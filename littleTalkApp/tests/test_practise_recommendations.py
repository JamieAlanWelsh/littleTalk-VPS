from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from littleTalkApp.models import Learner, Role
from littleTalkApp.tests.base import BaseFlowTestMixin
from littleTalkApp.views_modules.practise import resolve_recommendation_index


class PractiseRecommendationRotationTests(BaseFlowTestMixin, TestCase):
    def setUp(self):
        self.user, _, self.school = self.create_staff_user_with_school(
            username="practise_staff", role=Role.STAFF
        )
        self.learner = Learner.objects.create(
            user=self.user,
            school=self.school,
            name="Practise Learner",
            date_of_birth=timezone.now().date() - timedelta(days=365 * 7),
            recommended_exercise_ids=["whats-in-the-bag", "story-train-plus", "in-the-know"],
            recommendation_index=0,
            recommendation_index_updated_at=timezone.now() - timedelta(days=2),
        )

        self.client.force_login(self.user)
        self.set_selected_school(self.school.id)
        session = self.client.session
        session["selected_learner_id"] = self.learner.id
        session.save()

    def test_resolve_recommendation_index_advances_every_24h_with_wrap(self):
        index = resolve_recommendation_index(self.learner)
        self.assertEqual(index, 2)

        self.learner.refresh_from_db()
        self.assertEqual(self.learner.recommendation_index, 2)
        self.assertIsNotNone(self.learner.recommendation_index_updated_at)

    def test_practise_context_contains_three_highlighted_recommendations(self):
        response = self.client.get(reverse("practise"))
        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.context["recommended_exercise_keys"],
            [
                "whats_in_the_bag_vocabulary_builder",
                "story_train_advanced_sequencing",
                "in_the_know_inferencing",
            ],
        )
        self.assertEqual(response.context["recommended_stage_numbers"], [1, 3])
        self.assertIn(response.context["recommended_exercise_key"], response.context["recommended_exercise_keys"])
        self.assertEqual(response.context["recommended_stage_number"], 3)
