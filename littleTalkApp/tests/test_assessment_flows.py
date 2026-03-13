import json
from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from littleTalkApp.models import Learner, LearnerAssessmentAnswer, Role
from littleTalkApp.tests.base import BaseFlowTestMixin


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
        self.assertEqual(start_response.status_code, 200)

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

        save_response = self.client.get(reverse("save_assessment"), follow=True)
        self.assertEqual(save_response.status_code, 200)

        self.assertGreater(LearnerAssessmentAnswer.objects.filter(learner=learner).count(), 0)

        summary_response = self.client.get(reverse("assessment_summary"))
        self.assertEqual(summary_response.status_code, 200)
