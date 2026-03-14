import json
from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from littleTalkApp.models import Learner, Role
from littleTalkApp.tests.base import BaseFlowTestMixin


class ApiTypicalFlowTests(BaseFlowTestMixin, TestCase):
    def test_update_exp_rejects_nonce_replay(self):
        user, _, school = self.create_staff_user_with_school(username="api_staff", role=Role.STAFF)
        learner = Learner.objects.create(
            user=user,
            school=school,
            name="Api Learner",
            date_of_birth=timezone.now().date() - timedelta(days=365 * 7),
        )

        self.client.force_login(user)
        self.set_selected_school(school.id)

        payload = {
            "exp": 10,
            "total_exercises": 1,
            "timestamp": timezone.now().isoformat(),
            "nonce": "nonce-abc-123",
        }

        url = reverse("update_learner_exp", kwargs={"learner_uuid": learner.learner_uuid})
        first_response = self.client.post(url, data=json.dumps(payload), content_type="application/json")
        self.assertEqual(first_response.status_code, 200)

        second_response = self.client.post(url, data=json.dumps(payload), content_type="application/json")
        self.assertEqual(second_response.status_code, 400)
        self.assertIn("Nonce already used", second_response.content.decode())

    def test_update_exp_rejects_old_timestamp(self):
        user, _, school = self.create_staff_user_with_school(username="api_staff_2", role=Role.STAFF)
        learner = Learner.objects.create(
            user=user,
            school=school,
            name="Api Learner 2",
            date_of_birth=timezone.now().date() - timedelta(days=365 * 7),
        )

        self.client.force_login(user)
        self.set_selected_school(school.id)

        payload = {
            "exp": 1,
            "total_exercises": 1,
            "timestamp": (timezone.now() - timedelta(minutes=10)).isoformat(),
            "nonce": "nonce-old-ts",
        }

        response = self.client.post(
            reverse("update_learner_exp", kwargs={"learner_uuid": learner.learner_uuid}),
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("timestamp", response.content.decode().lower())

    def test_update_exp_forbidden_for_cross_school_staff(self):
        user_a, _, school_a = self.create_staff_user_with_school(username="api_staff_a", role=Role.STAFF)
        user_b, _, school_b = self.create_staff_user_with_school(username="api_staff_b", role=Role.STAFF)
        learner = Learner.objects.create(
            user=user_b,
            school=school_b,
            name="Foreign Learner",
            date_of_birth=timezone.now().date() - timedelta(days=365 * 8),
        )

        self.client.force_login(user_a)
        self.set_selected_school(school_a.id)

        payload = {
            "exp": 1,
            "total_exercises": 1,
            "timestamp": timezone.now().isoformat(),
            "nonce": "nonce-forbidden",
        }

        response = self.client.post(
            reverse("update_learner_exp", kwargs={"learner_uuid": learner.learner_uuid}),
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
