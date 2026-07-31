from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse

from accounts.models import User
from littleTalkApp.models import PasswordResetToken
from littleTalkApp.utilities import hash_email


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PasswordResetFlowTests(TestCase):
    def setUp(self):
        cache.clear()
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

    def test_cooldown_is_silent_and_sends_no_second_email(self):
        token = PasswordResetToken.objects.create(user=self.user)
        original_link_token = token.link_token

        response = self.client.post(
            reverse("password_reset"),
            {"email": "reset@example.com"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "If an account exists")
        self.assertNotContains(response, "60 seconds")
        self.assertEqual(len(mail.outbox), 0)
        token.refresh_from_db()
        self.assertEqual(token.link_token, original_link_token)

    def test_ip_rate_limit_blocks_after_threshold(self):
        for _ in range(5):
            self.client.post(reverse("password_reset"), {"email": "reset@example.com"})

        mail.outbox.clear()

        response = self.client.post(
            reverse("password_reset"),
            {"email": "reset@example.com"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "If an account exists")
        self.assertEqual(len(mail.outbox), 0)

