import json
from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from littleTalkApp.models import Learner, Role
from littleTalkApp.tests.base import BaseFlowTestMixin


class ApiTypicalFlowTests(BaseFlowTestMixin, TestCase):
    def _build_payload(self, nonce):
        started_at = timezone.now() - timedelta(minutes=2)
        completed_at = timezone.now()
        return {
            "nonce": nonce,
            "exp": 10,
            "total_exercises": 1,
            "exercise_id": "categorisation",
            "difficulty_level": 3,
            "difficulty_label": "3 options",
            "started_at": started_at.isoformat(),
            "completed_at": completed_at.isoformat(),
            "total_questions": 5,
            "incorrect_answers": 1,
            "attempts_per_question": [1, 1, 1, 2, 1],
        }

    def test_submit_exercise_rejects_nonce_replay(self):
        user, _, school = self.create_staff_user_with_school(username="api_staff", role=Role.STAFF)
        learner = Learner.objects.create(
            user=user,
            school=school,
            name="Api Learner",
            date_of_birth=timezone.now().date() - timedelta(days=365 * 7),
        )

        self.client.force_login(user)
        self.set_selected_school(school.id)

        payload = self._build_payload(nonce="nonce-abc-123")

        url = reverse("submit_exercise", kwargs={"learner_uuid": learner.learner_uuid})
        first_response = self.client.post(url, data=json.dumps(payload), content_type="application/json")
        self.assertEqual(first_response.status_code, 200)

        second_response = self.client.post(url, data=json.dumps(payload), content_type="application/json")
        self.assertEqual(second_response.status_code, 400)
        self.assertIn("Nonce already used", second_response.content.decode())

    def test_submit_exercise_forbidden_for_cross_school_staff(self):
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

        payload = self._build_payload(nonce="nonce-forbidden")

        response = self.client.post(
            reverse("submit_exercise", kwargs={"learner_uuid": learner.learner_uuid}),
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
