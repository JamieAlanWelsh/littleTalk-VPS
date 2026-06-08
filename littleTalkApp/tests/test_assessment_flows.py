import json
from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from littleTalkApp.models import Learner, LearnerAssessmentAnswer, Role
from littleTalkApp.tests.base import BaseFlowTestMixin
from littleTalkApp.views_modules.assessment import (
    compute_stage_mastery,
    compute_v2_recommendations,
    compute_v2_secondary_recommendations,
)


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
            ["whats-in-the-bag", "spot-on", "whos-who"],
        )
        self.assertEqual(learner.secondary_exercise_ids, [])
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
            ["colourful-semantics-early", "whats-in-the-bag", "spot-on"],
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
                "colourful-semantics",
                "concept-quest",
                "categorisation",
            ],
        )

    def test_compute_v2_recommendations_guarantees_stage_matching_colourful_semantics(self):
        answers_payload = {
            "3": "Yes",
            "4": "Yes",
            "5": "Yes",
            "8": "Yes",
            "9": "No",
            "10": "No",
            "11": "No",
            "12": "No",
            "13": "No",
        }

        recommendations = compute_v2_recommendations(answers_payload)

        self.assertEqual(
            recommendations,
            ["colourful-semantics", "story-train", "categorisation"],
        )

    def test_compute_v2_recommendations_keeps_genuine_colourful_semantics_first(self):
        answers_payload = {
            "3": "Yes",
            "4": "Yes",
            "5": "Yes",
            "6": "Yes",
            "7": "No",
            "8": "Yes",
            "9": "Yes",
            "10": "Yes",
            "11": "No",
            "12": "No",
            "13": "No",
        }

        recommendations = compute_v2_recommendations(answers_payload)

        colourful_semantics_recommendations = [
            exercise_id
            for exercise_id in recommendations
            if exercise_id.startswith("colourful-semantics")
        ]

        self.assertEqual(recommendations[0], "colourful-semantics-early")
        self.assertEqual(colourful_semantics_recommendations, ["colourful-semantics-early"])

    def test_compute_stage_mastery_locks_to_stage_one_when_stage_one_is_mostly_no(self):
        answers_payload = {
            "3": "No",
            "4": "No",
            "5": "No",
            "8": "Yes",
        }

        stage_mastery, allowed_max_stage = compute_stage_mastery(answers_payload)

        self.assertFalse(stage_mastery[1])
        self.assertEqual(allowed_max_stage, 1)

    def test_compute_v2_recommendations_unlocks_stage_three_when_stage_one_and_two_mostly_yes(self):
        answers_payload = {
            "3": "Yes",
            "4": "Yes",
            "5": "Yes",
            "8": "Yes",
            "9": "Yes",
            "10": "Yes",
            "15": "No",
        }

        recommendations = compute_v2_recommendations(answers_payload)

        self.assertEqual(recommendations[0], "colourful-semantics-plus")
        self.assertIn("story-train-plus", recommendations)

    def test_compute_v2_secondary_recommendations_returns_in_range_needs_support_only(self):
        answers_payload = {
            "3": "Yes",
            "4": "Yes",
            "5": "Yes",
            "8": "No",
            "9": "No",
            "10": "No",
            "11": "No",
            "15": "No",
        }

        tier_one = compute_v2_recommendations(answers_payload)
        secondary = compute_v2_secondary_recommendations(answers_payload, tier_one)

        self.assertEqual(
            tier_one,
            ["colourful-semantics", "categorisation", "concept-quest"],
        )
        self.assertEqual(secondary, ["story-train"])
