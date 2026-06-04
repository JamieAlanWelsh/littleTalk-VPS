import json
from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from littleTalkApp.models import Learner, LearnerAssessmentAnswer, Role
from littleTalkApp.tests.base import BaseFlowTestMixin
from littleTalkApp.views_modules.assessment import compute_v2_recommendations


class AssessmentTypicalFlowTests(BaseFlowTestMixin, TestCase):
    def test_screener_start_save_summary_flow(self):
        user, _, school = self.create_staff_user_with_school(username="assessment_staff", role=Role.STAFF)
        learner = Learner.objects.create(
            user=user,
            school=school,
            name="Learner One",
            date_of_birth=timezone.now().date() - timedelta(days=365 * 6),
        )

        self.client.force_login(user)
        self.set_selected_school(school.id)

        screener_response = self.client.get(reverse("screener"))
        self.assertEqual(screener_response.status_code, 200)

        start_response = self.client.get(reverse("start_assessment"))
        self.assertEqual(start_response.status_code, 302)
        self.assertEqual(start_response.url, reverse("start_assessment_v2"))

        session = self.client.session
        session["selected_learner_id"] = learner.id
        session.save()

        answers_payload = {"1": "Yes", "2": "No", "3": "Yes"}
        save_all_response = self.client.post(
            reverse("save_all_assessment_answers"),
            data=json.dumps(answers_payload),
            content_type="application/json",
        )
        self.assertEqual(save_all_response.status_code, 200)
        self.assertEqual(
            save_all_response.json().get("redirect_url"), reverse("assessment_summary")
        )

        self.assertGreater(LearnerAssessmentAnswer.objects.filter(learner=learner).count(), 0)

        summary_response = self.client.get(reverse("assessment_summary"))
        self.assertEqual(summary_response.status_code, 200)

    def test_v2_recommendations_saved_for_latest_screener(self):
        user, _, school = self.create_staff_user_with_school(username="assessment_staff_v2", role=Role.STAFF)
        learner = Learner.objects.create(
            user=user,
            school=school,
            name="Learner Two",
            date_of_birth=timezone.now().date() - timedelta(days=365 * 7),
        )

        self.client.force_login(user)
        self.set_selected_school(school.id)

        session = self.client.session
        session["selected_learner_id"] = learner.id
        session.save()

        start_response = self.client.get(reverse("start_assessment_v2"))
        self.assertEqual(start_response.status_code, 200)

        answers_payload = {
            "1": "Yes",
            "2": "Yes",
            "3": "No",
            "4": "No",
            "11": "No",
            "13": "No",
            "19": "No",
        }
        save_response = self.client.post(
            reverse("save_all_assessment_answers_v2"),
            data=json.dumps(answers_payload),
            content_type="application/json",
        )
        self.assertEqual(save_response.status_code, 200)
        self.assertEqual(save_response.json().get("redirect_url"), reverse("assessment_summary"))

        learner.refresh_from_db()
        self.assertEqual(
            learner.recommended_exercise_ids,
            ["whats-in-the-bag", "story-train", "in-the-know"],
        )
        self.assertEqual(learner.recommendation_index, 0)
        self.assertIsNotNone(learner.recommendation_index_updated_at)

        latest_answers = LearnerAssessmentAnswer.objects.filter(learner=learner)
        self.assertTrue(latest_answers.exists())
        self.assertTrue(all(answer.screener_version == 2 for answer in latest_answers))


class AssessmentRecommendationTests(TestCase):
    def test_compute_v2_recommendations_dedupes_and_uses_stage_padding(self):
        answers_payload = {
            "3": "No",   # whats-in-the-bag
            "4": "No",   # whats-in-the-bag
            "5": "No",   # spot-on
            "14": "No",  # story-train-plus
        }

        recommendations = compute_v2_recommendations(answers_payload)

        self.assertEqual(
            recommendations,
            ["whats-in-the-bag", "spot-on", "story-train-plus"],
        )

    def test_compute_v2_recommendations_pads_to_three_with_high_stage(self):
        answers_payload = {
            "1": "Yes",
            "2": "Yes",
            "3": "Yes",
        }

        recommendations = compute_v2_recommendations(answers_payload)

        self.assertEqual(
            recommendations,
            [
                "colourful-semantics-plus",
                "story-train-plus",
                "what-happens-next",
            ],
        )
