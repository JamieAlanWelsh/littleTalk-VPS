from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse

from accounts.models import User
from littleTalkApp.models import PasswordResetToken
from littleTalkApp.utilities import hash_email


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PasswordResetFlowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="reset-user", password="Password123!")
        self.user.email_encrypted = "reset@example.com"
        self.user.email_hash = hash_email("reset@example.com")
        self.user.save(update_fields=["email_encrypted", "email_hash"])

    def test_request_view_sends_link_for_existing_email(self):
        response = self.client.post(
            reverse("password_reset"),
            {"email": "reset@example.com"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertTrue(PasswordResetToken.objects.filter(user=self.user).exists())

    def test_request_view_displays_generic_success_for_unknown_email(self):
        response = self.client.post(
            reverse("password_reset"),
            {"email": "missing@example.com"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)
        self.assertContains(response, "If an account exists")

    def test_confirm_view_sets_new_password(self):
        token = PasswordResetToken.objects.create(user=self.user)

        response = self.client.post(
            reverse("password_reset_confirm", args=[token.link_token]),
            {"new_password": "NewPassword123!"},
        )

        self.assertEqual(response.status_code, 302)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPassword123!"))
