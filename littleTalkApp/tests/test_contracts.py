import importlib
import uuid

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
            "update_learner_exp": {"learner_uuid": uuid.uuid4()},
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
            "support",
            "send_support_email",
            "screener",
            "start_assessment",
            "save_all_assessment_answers",
            "save_assessment",
            "assessment_summary",
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
            "update_learner_exp",
            "get_selected_learner",
            "create_target",
            "target_detail",
            "learner_dashboard",
            "learner_progress_data",
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
            ("data_policy", {}, "public/legal/data-policy.html"),
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
