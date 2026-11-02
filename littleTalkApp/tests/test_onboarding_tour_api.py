import json

from django.test import TestCase
from django.urls import reverse

from littleTalkApp.models import OnboardingTourStatus, Role
from littleTalkApp.tests.base import BaseFlowTestMixin


class OnboardingTourApiTests(BaseFlowTestMixin, TestCase):
    def setUp(self):
        self.user, _, self.school = self.create_staff_user_with_school(
            username="tour_staff",
            role=Role.STAFF,
        )
        self.url = reverse("update_onboarding_tour")

    def test_update_persists_status_and_step(self):
        self.client.force_login(self.user)
        response = self.client.post(
            self.url,
            data=json.dumps({"status": OnboardingTourStatus.IN_PROGRESS, "step": 3}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        profile = self.user.profile
        profile.refresh_from_db()
        self.assertEqual(profile.onboarding_tour_status, OnboardingTourStatus.IN_PROGRESS)
        self.assertEqual(profile.onboarding_tour_step, 3)

    def test_invalid_status_is_rejected(self):
        self.client.force_login(self.user)
        response = self.client.post(
            self.url,
            data=json.dumps({"status": "bogus", "step": 1}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        profile = self.user.profile
        profile.refresh_from_db()
        self.assertEqual(profile.onboarding_tour_status, OnboardingTourStatus.NOT_OFFERED)

    def test_requires_authentication(self):
        response = self.client.post(
            self.url,
            data=json.dumps({"status": OnboardingTourStatus.DECLINED, "step": 0}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("login"), response.url)
