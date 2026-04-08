"""
Tests for the Skolon integration:
  - Webhook ingestion (data-edits, remove-user, remove-class)
  - License sync effect on school access (middleware gate)
  - SSO callback — create/link user via skolon_id
"""

import json
from datetime import timedelta
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from littleTalkApp.models import (
    Profile,
    Role,
    School,
    SchoolMembership,
    SkolonOrg,
    SkolonSyncCursor,
    SkolonUser,
)
from littleTalkApp.tests.base import BaseFlowTestMixin

User = get_user_model()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_skolon_user(skolon_id="sku-1", external_id="ext-1", role="teacher", school=None):
    org = None
    if school:
        org, _ = SkolonOrg.objects.get_or_create(
            skolon_id=f"org-{school.pk}",
            defaults={"name": school.name, "school": school},
        )
    return SkolonUser.objects.create(
        skolon_id=skolon_id,
        external_id=external_id,
        role=role,
        skolon_org=org,
    )


# ---------------------------------------------------------------------------
# Webhook — data edits
# ---------------------------------------------------------------------------

class SkolonWebhookTests(TestCase):
    def _post(self, payload):
        return self.client.post(
            reverse("skolon_webhook"),
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_empty_entities_returns_200(self):
        response = self._post({"entities": []})
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, {"received": True})

    def test_invalid_json_returns_400(self):
        response = self.client.post(
            reverse("skolon_webhook"),
            data="not-json",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    @patch("littleTalkApp.views_modules.skolon.sync_licenses")
    def test_license_entity_calls_sync_licenses(self, mock_sync):
        mock_sync.return_value = []
        response = self._post({"entities": ["license"]})
        self.assertEqual(response.status_code, 200)
        mock_sync.assert_called_once()

    @patch("littleTalkApp.views_modules.skolon.sync_users")
    @patch("littleTalkApp.views_modules.skolon.sync_schools")
    def test_multiple_entities_calls_each_sync(self, mock_schools, mock_users):
        mock_schools.return_value = []
        mock_users.return_value = []
        response = self._post({"entities": ["user", "school"]})
        self.assertEqual(response.status_code, 200)
        mock_users.assert_called_once()
        mock_schools.assert_called_once()

    @patch("littleTalkApp.views_modules.skolon.sync_licenses")
    def test_sync_exception_does_not_crash_webhook(self, mock_sync):
        mock_sync.side_effect = Exception("Skolon API down")
        response = self._post({"entities": ["license"]})
        # Must still return 200 — Skolon expects a quick acknowledgement
        self.assertEqual(response.status_code, 200)

    def test_unknown_entity_ignored_gracefully(self):
        response = self._post({"entities": ["unknown_entity"]})
        self.assertEqual(response.status_code, 200)


# ---------------------------------------------------------------------------
# Webhook — GDPR remove-user
# ---------------------------------------------------------------------------

class SkolonRemoveUserTests(TestCase):
    def _post(self, payload):
        return self.client.post(
            reverse("skolon_remove_user"),
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_missing_user_id_returns_400(self):
        response = self._post({})
        self.assertEqual(response.status_code, 400)

    def test_unknown_skolon_id_returns_200_idempotent(self):
        response = self._post({"userId": "does-not-exist"})
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, {"removed": True})

    def test_remove_user_anonymises_linked_local_user(self):
        local_user = User.objects.create_user(username="to-delete", password="secret")
        local_user.email_encrypted = "test@example.com"
        local_user.save()
        skolon_user = SkolonUser.objects.create(
            skolon_id="sku-del-1",
            external_id="ext-del-1",
            user=local_user,
        )

        response = self._post({"userId": "sku-del-1"})

        self.assertEqual(response.status_code, 200)
        skolon_user.refresh_from_db()
        local_user.refresh_from_db()

        self.assertTrue(skolon_user.is_deleted)
        self.assertIsNone(skolon_user.user)
        self.assertFalse(local_user.has_usable_password())
        self.assertIsNone(local_user.email_encrypted)
        self.assertIsNone(local_user.email_hash)

    def test_remove_user_with_no_local_user_still_marks_deleted(self):
        SkolonUser.objects.create(
            skolon_id="sku-no-local",
            external_id="ext-no-local",
            user=None,
        )
        response = self._post({"userId": "sku-no-local"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(SkolonUser.objects.get(skolon_id="sku-no-local").is_deleted)


# ---------------------------------------------------------------------------
# Webhook — GDPR remove-class
# ---------------------------------------------------------------------------

class SkolonRemoveClassTests(TestCase):
    def _post(self, payload):
        return self.client.post(
            reverse("skolon_remove_class"),
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_missing_class_id_returns_400(self):
        response = self._post({})
        self.assertEqual(response.status_code, 400)

    @patch("littleTalkApp.views_modules.skolon.sync_groups")
    def test_valid_class_id_advances_cursor_and_returns_200(self, mock_sync):
        mock_sync.return_value = []
        response = self._post({"classId": "grp-1"})
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, {"removed": True})
        mock_sync.assert_called_once()

    @patch("littleTalkApp.views_modules.skolon.sync_groups")
    def test_group_id_key_also_accepted(self, mock_sync):
        mock_sync.return_value = []
        response = self._post({"groupId": "grp-2"})
        self.assertEqual(response.status_code, 200)


# ---------------------------------------------------------------------------
# License sync → school access gate
# ---------------------------------------------------------------------------

class SkolonLicenseSyncAccessTests(TestCase, BaseFlowTestMixin):
    """
    Verify that license sync outcomes feed through to the middleware access gate.
    Uses sync_licenses directly rather than going through the Skolon API.
    """

    def setUp(self):
        self.user, self.profile, self.school = self.create_staff_user_with_school(
            username="teacher1", role=Role.STAFF
        )
        self.client.force_login(self.user)

    def test_licensed_school_allows_access_to_protected_view(self):
        # School already licensed in setUp — sanity check.
        self.school.refresh_from_db()
        self.assertTrue(self.school.has_valid_license())
        response = self.client.get(reverse("learner_dashboard"))
        # 200 or further redirect is fine — the license gate did not fire
        self.assertNotEqual(response.status_code, 403)

    def test_revoked_license_blocks_staff_from_protected_view(self):
        self.school.is_licensed = False
        self.school.license_expires_at = None
        self.school.save()
        self.set_selected_school(self.school.id)

        response = self.client.get(reverse("learner_dashboard"), follow=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.request["PATH_INFO"], reverse("license_expired"))

    def test_expired_license_blocks_staff(self):
        self.school.is_licensed = True
        self.school.license_expires_at = timezone.now() - timedelta(days=1)
        self.school.save()
        self.set_selected_school(self.school.id)

        response = self.client.get(reverse("learner_dashboard"), follow=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.request["PATH_INFO"], reverse("license_expired"))


# ---------------------------------------------------------------------------
# SSO callback
# ---------------------------------------------------------------------------

class SkolonSSOCallbackTests(TestCase, BaseFlowTestMixin):
    def _get(self, params):
        return self.client.get(reverse("sso_callback"), params)

    def test_no_code_redirects_to_login_with_message(self):
        response = self._get({})
        self.assertRedirects(response, reverse("login"), fetch_redirect_response=False)

    def test_oauth_error_redirects_to_login(self):
        response = self._get({"error": "access_denied", "error_description": "User denied"})
        self.assertRedirects(response, reverse("login"), fetch_redirect_response=False)

    @patch("littleTalkApp.views_modules.skolon.token_manager")
    @patch("littleTalkApp.views_modules.skolon.api_client")
    def test_sso_links_existing_skolon_user_and_logs_in(self, mock_api, mock_tm):
        school = School.objects.create(name="SSO School", is_licensed=True)
        org = SkolonOrg.objects.create(skolon_id="org-sso", name="SSO School", school=school)
        local_user = User.objects.create_user(username="existing-sso-user")
        local_user.set_unusable_password()
        local_user.save()
        skolon_user = SkolonUser.objects.create(
            skolon_id="sku-sso-1",
            external_id="ext-sso-1",
            user=local_user,
            skolon_org=org,
        )

        mock_tm.exchange_code_for_token.return_value = "fake-access-token"
        mock_api.get_user_session.return_value = {"userId": "sku-sso-1"}

        response = self._get({"code": "auth-code-123"})

        self.assertRedirects(response, "/profile/", fetch_redirect_response=False)
        # User should now be logged in
        self.assertEqual(int(self.client.session["_auth_user_id"]), local_user.pk)

    @patch("littleTalkApp.views_modules.skolon.token_manager")
    @patch("littleTalkApp.views_modules.skolon.api_client")
    def test_sso_provisions_new_user_on_first_login(self, mock_api, mock_tm):
        school = School.objects.create(name="New SSO School", is_licensed=True)
        org = SkolonOrg.objects.create(
            skolon_id="org-new", name="New SSO School", school=school
        )
        SkolonUser.objects.create(
            skolon_id="sku-new-1",
            external_id="ext-new-1",
            user=None,
            skolon_org=org,
            role="teacher",
        )

        mock_tm.exchange_code_for_token.return_value = "fake-access-token"
        mock_api.get_user_session.return_value = {"userId": "sku-new-1"}

        response = self._get({"code": "auth-code-new"})

        self.assertRedirects(response, "/profile/", fetch_redirect_response=False)

        # A new local user should have been provisioned and linked
        skolon_user = SkolonUser.objects.get(skolon_id="sku-new-1")
        self.assertIsNotNone(skolon_user.user)
        self.assertFalse(skolon_user.user.has_usable_password())

        # And logged in
        self.assertEqual(
            int(self.client.session["_auth_user_id"]), skolon_user.user.pk
        )

    @patch("littleTalkApp.views_modules.skolon.sync_users")
    @patch("littleTalkApp.views_modules.skolon.token_manager")
    @patch("littleTalkApp.views_modules.skolon.api_client")
    def test_sso_triggers_sync_when_skolon_user_not_found(
        self, mock_api, mock_tm, mock_sync
    ):
        """If userId isn't in DB yet, sync_users is called to pull fresh data."""
        mock_tm.exchange_code_for_token.return_value = "fake-access-token"
        mock_api.get_user_session.return_value = {"userId": "sku-unknown"}
        # sync_users creates nothing — simulates user not in Skolon partner data
        mock_sync.return_value = []

        response = self._get({"code": "some-code"})

        mock_sync.assert_called_once()
        # No user found even after sync → redirect to login
        self.assertRedirects(response, reverse("login"), fetch_redirect_response=False)


# ---------------------------------------------------------------------------
# SSO launch
# ---------------------------------------------------------------------------

class SkolonSSOLaunchTests(TestCase):
    def test_launch_redirects_to_skolon_idp(self):
        """GET /sso/launch/ should redirect to the Skolon IDP auth URL."""
        response = self.client.get(reverse("sso_launch"))
        self.assertEqual(response.status_code, 302)
        location = response["Location"]
        self.assertIn("idp.skolon.com", location)
        self.assertIn("/oauth/auth", location)
        self.assertIn("response_type=code", location)
        self.assertIn("redirect_uri=", location)

    def test_launch_is_GET_accessible_without_login(self):
        """The launch URL must be publicly accessible (no auth required)."""
        response = self.client.get(reverse("sso_launch"))
        # Should be a redirect, not a 403 or 302-to-login
        self.assertEqual(response.status_code, 302)
        self.assertNotIn(reverse("login"), response["Location"])


# ---------------------------------------------------------------------------
# SSO callback — license gate
# ---------------------------------------------------------------------------

class SkolonSSOLicenseGateTests(TestCase, BaseFlowTestMixin):
    def _get(self, params):
        return self.client.get(reverse("sso_callback"), params)

    def _make_user_and_session_mocks(self, mock_api, mock_tm, skolon_id):
        mock_tm.exchange_code_for_token.return_value = "fake-token"
        mock_api.get_user_session.return_value = {"userId": skolon_id}

    @patch("littleTalkApp.views_modules.skolon.token_manager")
    @patch("littleTalkApp.views_modules.skolon.api_client")
    def test_sso_denied_when_no_license(self, mock_api, mock_tm):
        """School with no valid license is denied at callback."""
        school = School.objects.create(name="Lic Gate School", is_licensed=False)
        org = SkolonOrg.objects.create(skolon_id="org-lg", name="Lic Gate School", school=school)
        SkolonUser.objects.create(skolon_id="sku-lg-1", external_id="ext-lg-1", role="teacher", skolon_org=org)

        self._make_user_and_session_mocks(mock_api, mock_tm, "sku-lg-1")

        response = self._get({"code": "c"})
        self.assertRedirects(response, reverse("login"), fetch_redirect_response=False)

    @patch("littleTalkApp.views_modules.skolon.token_manager")
    @patch("littleTalkApp.views_modules.skolon.api_client")
    def test_sso_denied_when_license_expired(self, mock_api, mock_tm):
        """School whose license has expired is denied at callback."""
        school = School.objects.create(
            name="Expired School",
            is_licensed=True,
            license_expires_at=timezone.now() - timedelta(days=1),
        )
        org = SkolonOrg.objects.create(skolon_id="org-exp", name="Expired School", school=school)
        SkolonUser.objects.create(skolon_id="sku-exp-1", external_id="ext-exp-1", role="teacher", skolon_org=org)

        self._make_user_and_session_mocks(mock_api, mock_tm, "sku-exp-1")

        response = self._get({"code": "c"})
        self.assertRedirects(response, reverse("login"), fetch_redirect_response=False)

    @patch("littleTalkApp.views_modules.skolon.token_manager")
    @patch("littleTalkApp.views_modules.skolon.api_client")
    def test_sso_allowed_with_perpetual_license(self, mock_api, mock_tm):
        """User with a license that has no expiry (perpetual) is admitted."""
        school = School.objects.create(name="Perp School", is_licensed=True)
        org = SkolonOrg.objects.create(skolon_id="org-perp", name="Perp School", school=school)
        lu = User.objects.create_user(username="perp-user")
        SkolonUser.objects.create(
            skolon_id="sku-perp-1", external_id="ext-perp-1", role="teacher",
            skolon_org=org, user=lu,
        )

        self._make_user_and_session_mocks(mock_api, mock_tm, "sku-perp-1")

        response = self._get({"code": "c"})
        self.assertRedirects(response, "/profile/", fetch_redirect_response=False)
        self.assertEqual(int(self.client.session["_auth_user_id"]), lu.pk)
