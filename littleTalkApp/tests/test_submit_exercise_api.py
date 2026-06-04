import json
from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from littleTalkApp.models import ExerciseSession, Learner, Role
from littleTalkApp.tests.base import BaseFlowTestMixin


class SubmitExerciseApiTests(BaseFlowTestMixin, TestCase):
    def setUp(self):
        self.user, _, self.school = self.create_staff_user_with_school(
            username="submit_api_staff", role=Role.STAFF
        )
        self.learner = Learner.objects.create(
            user=self.user,
            school=self.school,
            name="Submit API Learner",
            date_of_birth=timezone.now().date() - timedelta(days=365 * 7),
        )
        self.client.force_login(self.user)
        self.set_selected_school(self.school.id)
        self.url = reverse(
            "submit_exercise", kwargs={"learner_uuid": self.learner.learner_uuid}
        )

    def _build_payload(self, exercise_id: str, nonce: str):
        started_at = timezone.now() - timedelta(minutes=2)
        completed_at = timezone.now()
        return {
            "nonce": nonce,
            "exp": 10,
            "total_exercises": 1,
            "exercise_id": exercise_id,
            "difficulty_selected": "medium",
            "started_at": started_at.isoformat(),
            "completed_at": completed_at.isoformat(),
            "total_questions": 5,
            "incorrect_answers": 1,
            "attempts_per_question": [1, 1, 1, 2, 1],
        }

    def test_submit_exercise_accepts_colourful_semantics_variant_ids(self):
        valid_ids = [
            "colourful-semantics",
            "colourful-semantics-early",
            "colourful-semantics-plus",
        ]

        for index, exercise_id in enumerate(valid_ids):
            with self.subTest(exercise_id=exercise_id):
                payload = self._build_payload(
                    exercise_id=exercise_id,
                    nonce=f"nonce-colourful-{index}",
                )
                response = self.client.post(
                    self.url,
                    data=json.dumps(payload),
                    content_type="application/json",
                )

                self.assertEqual(response.status_code, 200)
                self.learner.refresh_from_db()
                session = ExerciseSession.objects.get(
                    learner=self.learner,
                    exercise_id=exercise_id,
                )
                self.assertEqual(
                    session.learner_total_exp_after_session,
                    self.learner.exp,
                )

    def test_submit_exercise_records_post_session_total_exp_snapshot(self):
        self.learner.exp = 125
        self.learner.save(update_fields=["exp"])

        payload = self._build_payload(
            exercise_id="categorisation",
            nonce="nonce-exp-snapshot",
        )

        response = self.client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)

        self.learner.refresh_from_db()
        self.assertEqual(self.learner.exp, 135)

        session = ExerciseSession.objects.get(
            learner=self.learner,
            exercise_id="categorisation",
        )
        self.assertEqual(session.learner_total_exp_after_session, 135)

    def test_submit_exercise_rejects_unknown_exercise_id(self):
        payload = self._build_payload(
            exercise_id="colourful-semantics-unknown",
            nonce="nonce-invalid-id",
        )

        response = self.client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("exercise_id", response.json())
        self.assertFalse(
            ExerciseSession.objects.filter(learner=self.learner).exists()
        )
