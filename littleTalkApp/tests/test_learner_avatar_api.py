import json
from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from littleTalkApp.models import Learner, Role
from littleTalkApp.tests.base import BaseFlowTestMixin


class LearnerAvatarApiTests(BaseFlowTestMixin, TestCase):
    def setUp(self):
        self.user, _, self.school = self.create_staff_user_with_school(
            username="avatar_staff",
            role=Role.STAFF,
        )
        self.learner = Learner.objects.create(
            user=self.user,
            school=self.school,
            name="Avatar Learner",
            date_of_birth=timezone.now().date() - timedelta(days=365 * 7),
        )

        self.client.force_login(self.user)
        self.set_selected_school(self.school.id)
        self.url = reverse(
            "update_learner_avatar",
            kwargs={"learner_uuid": self.learner.learner_uuid},
        )

    def test_staff_can_update_learner_avatar(self):
        response = self.client.patch(
            self.url,
            data=json.dumps(
                {
                    "avatar_character": "arlo_armadillo",
                    "avatar_color": "#36A3E2",
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.learner.refresh_from_db()
        self.assertEqual(self.learner.avatar_character, "arlo_armadillo")
        self.assertEqual(self.learner.avatar_color, "#36A3E2")

    def test_avatar_update_rejects_invalid_character(self):
        response = self.client.patch(
            self.url,
            data=json.dumps(
                {
                    "avatar_character": "unknown_character",
                    "avatar_color": "#36A3E2",
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("avatar_character", response.json())

    def test_avatar_update_forbidden_for_cross_school_staff(self):
        outsider_user, _, outsider_school = self.create_staff_user_with_school(
            username="avatar_outsider",
            role=Role.STAFF,
        )
        self.client.force_login(outsider_user)
        self.set_selected_school(outsider_school.id)

        response = self.client.patch(
            self.url,
            data=json.dumps(
                {
                    "avatar_character": "arlo_armadillo",
                    "avatar_color": "#36A3E2",
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
