import importlib
import uuid
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse

from accounts.models import User
from littleTalkApp.models import Role, School, StaffInvite


class ImportContractsTests(TestCase):
    def test_views_facade_and_modules_import(self):
        importlib.import_module("littleTalkApp.views")

        module_names = [
            "littleTalkApp.views_modules.api",
            "littleTalkApp.views_modules.auth",
            "littleTalkApp.views_modules.assessment",
            "littleTalkApp.views_modules.dashboard",
            "littleTalkApp.views_modules.logbook",
            "littleTalkApp.views_modules.parent_access",
            "littleTalkApp.views_modules.practise",
            "littleTalkApp.views_modules.profile",
            "littleTalkApp.views_modules.public",
            "littleTalkApp.views_modules.school",
            "littleTalkApp.views_modules.settings_views",
            "littleTalkApp.views_modules.subscription",
            "littleTalkApp.views_modules.skolon",
            "littleTalkApp.integrations.skolon_client",
            "littleTalkApp.integrations.skolon_sync",
        ]

        for module_name in module_names:
            with self.subTest(module=module_name):
                importlib.import_module(module_name)


class UrlContractsTests(TestCase):
    def test_named_urls_reverse(self):
        url_kwargs = {
            "game_description": {"game_name": "matching-sounds"},
            "accept_invite": {"token": uuid.uuid4()},
            "edit_learner": {"learner_uuid": uuid.uuid4()},
            "confirm_delete_learner": {"learner_uuid": uuid.uuid4()},
            "cohort_edit": {"cohort_id": 1},
            "cohort_delete": {"cohort_id": 1},
            "log_entry_detail": {"entry_id": 1},
            "edit_log_entry": {"entry_id": 1},
            "delete_log_entry": {"entry_id": 1},
            "generate_summary": {"learner_uuid": uuid.uuid4()},
            "view_parent_token": {"learner_uuid": uuid.uuid4()},
            "generate_parent_token": {"learner_uuid": uuid.uuid4()},
            "email_parent_token": {"learner_uuid": uuid.uuid4()},
            "target_detail": {"target_id": 1},
        }

        names = [
            "home",
            "game_description",
            "practise",
            "tips",
            "method",
            "about",
            "terms",
            "privacy",
            "data_policy",
            "cookie_policy",
            "support",
            "send_support_email",
            "screener",
            "start_assessment",
            "start_assessment_v2",
            "save_all_assessment_answers",
            "save_all_assessment_answers_v2",
            "assessment_summary",
            "assessment_summary_v2",
            "assessment_summary_old",
            "login",
            "account_setup",
            "profile",
            "add_learner",
            "select_learner",
            "edit_learner",
            "confirm_delete_learner",
            "cohort_list",
            "cohort_create",
            "select_school",
            "cohort_edit",
            "cohort_delete",
            "logbook",
            "new_log_entry",
            "log_entry_detail",
            "edit_log_entry",
            "delete_log_entry",
            "generate_summary",
            "settings",
            "change_user_details",
            "change_password",
            "logout",
            "school_signup",
            "invite_staff",
            "accept_invite",
            "school",
            "request_join_school",
            "invite_audit_trail",
            "view_parent_token",
            "generate_parent_token",
            "email_parent_token",
            "parent_signup",
            "add_pac_learner",
            "subscribe",
            "license_expired",
            "stripe_webhook",
            "create_checkout_session",
            "subscribe_success",
            "manage_subscription",
            "get_current_session_learner_context",
            "create_target",
            "target_detail",
            "learner_dashboard",
            "learner_progress_data",
            "skolon_webhook",
            "skolon_remove_user",
            "skolon_remove_class",
            "sso_callback",
            "sso_launch",
        ]

        for name in names:
            with self.subTest(name=name):
                kwargs = url_kwargs.get(name)
                reverse(name, kwargs=kwargs)


class TemplateContractsTests(TestCase):
    def test_public_and_auth_templates_render(self):
        cases = [
            ("home", {}, "public/landing.html"),
            ("support", {}, "public/support.html"),
            ("tips", {}, "public/tips.html"),
            ("method", {}, "public/method.html"),
            ("about", {}, "public/about.html"),
            ("terms", {}, "public/legal/terms.html"),
            ("privacy", {}, "public/legal/privacy.html"),
            ("login", {}, "auth/login.html"),
            ("account_setup", {}, "auth/account_setup.html"),
            ("school_signup", {}, "school/school_signup.html"),
            ("parent_signup", {}, "parent_access/parent_signup.html"),
        ]

        for name, kwargs, template in cases:
            with self.subTest(name=name):
                response = self.client.get(reverse(name, kwargs=kwargs or None))
                self.assertEqual(response.status_code, 200)
                if template:
                    self.assertTemplateUsed(response, template)

    def test_shared_templates_gate_analytics_without_global_company_disclosure(self):
        for name in ("home", "login"):
            with self.subTest(name=name):
                response = self.client.get(reverse(name))
                content = response.content.decode()

                self.assertNotIn("https://www.googletagmanager.com/gtag/js", content)
                self.assertContains(response, 'id="cookie-consent"')
                self.assertContains(response, 'data-consent-action="accept"')
                self.assertContains(response, 'data-consent-action="reject"')
                self.assertNotContains(response, 'class="cookie-settings-button"')
                self.assertNotContains(response, "Registered office:")

    def test_cookie_settings_can_only_be_reopened_from_privacy_policy(self):
        privacy = self.client.get(reverse("privacy"))

        self.assertContains(privacy, 'data-cookie-settings')
        self.assertContains(privacy, "Adjust your cookie settings")

    def test_legacy_legal_routes_redirect_to_combined_privacy_policy(self):
        for name in ("data_policy", "cookie_policy"):
            with self.subTest(name=name):
                response = self.client.get(reverse(name))
                self.assertRedirects(response, reverse("privacy") + "#cookies")

    def test_legal_notices_do_not_make_unsupported_claims(self):
        privacy = self.client.get(reverse("privacy"))
        terms = self.client.get(reverse("terms"))

        content = privacy.content.decode()
        self.assertNotIn("multi-factor authentication", content)
        self.assertNotIn("stored exclusively within the European Economic Area", content)
        self.assertNotIn("We have appointed a Data Protection Officer", content)
        self.assertNotIn("Continued use of the Service after changes constitutes acceptance", content)

        for provider in ("Google Analytics", "Stripe", "Zoho", "Skolon"):
            self.assertContains(privacy, provider)

        self.assertContains(privacy, "Data & Privacy Policy")
        self.assertContains(privacy, "Registered office: 19 Ganghill, Guildford, Surrey, GU1 1XE")
        self.assertContains(privacy, "Our Privacy Lead oversees data protection matters")
        self.assertContains(privacy, 'id="cookies"')
        self.assertContains(privacy, "Information Commissioner")
        self.assertContains(privacy, "category-level retention")
        self.assertContains(terms, "statutory rights")
        self.assertNotContains(terms, "sole discretion")
        self.assertNotContains(terms, "resolved through arbitration")

    def test_accept_invite_template_renders_for_valid_token(self):
        sender = User.objects.create_user(username="sender", password="password123")
        school = School.objects.create(name="Contract School")
        invite = StaffInvite.objects.create(
            school=school,
            email="invitee@example.com",
            role=Role.STAFF,
            sent_by=sender,
        )

        response = self.client.get(reverse("accept_invite", kwargs={"token": invite.token}))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "school/accept_invite.html")

    def test_signup_pages_link_terms_and_privacy_notice(self):
        for name in ("account_setup", "school_signup", "request_join_school", "parent_signup"):
            with self.subTest(name=name):
                response = self.client.get(reverse(name))
                self.assertContains(response, reverse("terms"))
                self.assertContains(response, reverse("privacy"))

    def test_home_landing_hero_renders_primary_ctas_and_widget(self):
        response = self.client.get(reverse("home"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Speech and Language Support")
        self.assertContains(response, "Made Simple.")
        self.assertContains(response, "Book a Demo")
        self.assertContains(response, "Get Started")
        self.assertContains(response, "Naomie Harris OBE")
        self.assertContains(response, "images/landing/frontpagewidget.png")


class SubscriptionContractsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="subscriber",
            email_encrypted="subscriber@example.com",
            password="password123",
        )
        self.client.force_login(self.user)

    def test_checkout_requires_post_and_service_start_acknowledgement(self):
        checkout_url = reverse("create_checkout_session")

        self.assertEqual(self.client.get(checkout_url).status_code, 405)

        with patch(
            "littleTalkApp.views_modules.subscription.stripe.checkout.Session.create"
        ) as create_session:
            create_session.return_value.url = "https://checkout.stripe.test/session"

            response = self.client.post(checkout_url)

        self.assertRedirects(
            response,
            "https://checkout.stripe.test/session",
            fetch_redirect_response=False,
        )
        create_session.assert_called_once()

    @patch("littleTalkApp.views_modules.subscription.stripe.checkout.Session.create")
    def test_checkout_records_legal_acknowledgements_in_stripe(self, create_session):
        create_session.return_value.url = "https://checkout.stripe.test/session"

        response = self.client.post(reverse("create_checkout_session"))

        self.assertRedirects(
            response,
            "https://checkout.stripe.test/session",
            fetch_redirect_response=False,
        )
        create_session.assert_called_once()
        metadata = create_session.call_args.kwargs["metadata"]
        self.assertEqual(metadata["service_start_requested"], "true")
        self.assertEqual(metadata["terms_version"], "2026-07-26")
        self.assertEqual(metadata["privacy_version"], "2026-07-26")
