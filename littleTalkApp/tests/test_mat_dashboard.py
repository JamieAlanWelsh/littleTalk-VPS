from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from littleTalkApp.models import (
    ExerciseSession,
    Learner,
    Role,
    School,
    SchoolMembership,
    Target,
)
from littleTalkApp.tests.base import BaseFlowTestMixin


class MatDashboardTests(BaseFlowTestMixin, TestCase):
    def _add_licensed_school(self, profile, name, role=Role.ADMIN):
        school = School.objects.create(
            name=name,
            is_licensed=True,
            license_expires_at=timezone.now() + timedelta(days=30),
        )
        profile.schools.add(school)
        SchoolMembership.objects.create(
            profile=profile, school=school, role=role, is_active=True
        )
        return school

    def _add_learner_with_sessions(self, user, school, name, sessions=3, correct=True):
        learner = Learner.objects.create(user=user, school=school, name=name, exp=10 * sessions)
        now = timezone.now()
        for _ in range(sessions):
            ExerciseSession.objects.create(
                learner=learner,
                exercise_id="categorisation",
                difficulty_selected="2",
                difficulty_label="Medium",
                started_at=now - timedelta(minutes=5),
                completed_at=now,
                total_questions=10,
                incorrect_answers=0 if correct else 5,
                attempts_per_question=[1] * 10,
            )
        return learner

    def test_gate_hidden_for_single_school_admin(self):
        user, profile, school = self.create_staff_user_with_school(
            username="single_admin", role=Role.ADMIN
        )
        self.assertFalse(profile.can_view_mat_dashboard())

        self.client.force_login(user)
        self.set_selected_school(school.id)
        response = self.client.get(reverse("mat_dashboard"), follow=True)
        self.assertEqual(response.request["PATH_INFO"], reverse("profile"))

    def test_gate_hidden_for_multi_school_staff(self):
        user, profile, _ = self.create_staff_user_with_school(
            username="multi_staff", role=Role.STAFF
        )
        self._add_licensed_school(profile, "Second School", role=Role.STAFF)
        self.assertFalse(profile.can_view_mat_dashboard())

    def test_gate_visible_for_multi_school_admin(self):
        user, profile, first_school = self.create_staff_user_with_school(
            username="trust_lead", role=Role.ADMIN
        )
        self._add_licensed_school(profile, "Second School", role=Role.ADMIN)
        self.assertTrue(profile.can_view_mat_dashboard())

        self.client.force_login(user)
        self.set_selected_school(first_school.id)
        response = self.client.get(reverse("mat_dashboard"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Across Schools")
        self.assertContains(response, "Second School")

    def test_summary_aggregates_across_schools(self):
        user, profile, first_school = self.create_staff_user_with_school(
            username="agg_lead", role=Role.ADMIN
        )
        second_school = self._add_licensed_school(profile, "Agg Second", role=Role.ADMIN)

        for i in range(5):
            self._add_learner_with_sessions(user, first_school, f"A{i}", sessions=2)
        for i in range(5):
            self._add_learner_with_sessions(user, second_school, f"B{i}", sessions=3)

        self.client.force_login(user)
        self.set_selected_school(first_school.id)
        response = self.client.get(reverse("mat_dashboard"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["totals"]["active_learners"], 10)
        # 5*2 + 5*3 = 25 sessions
        self.assertEqual(response.context["totals"]["session_count"], 25)

    def test_small_school_outcome_metrics_shown(self):
        user, profile, first_school = self.create_staff_user_with_school(
            username="small_lead", role=Role.ADMIN
        )
        small_school = self._add_licensed_school(profile, "Tiny School", role=Role.ADMIN)

        # Even with a single learner, outcome metrics are shown (no suppression).
        self._add_learner_with_sessions(user, small_school, "Solo", sessions=1)
        for i in range(5):
            self._add_learner_with_sessions(user, first_school, f"L{i}", sessions=1)

        self.client.force_login(user)
        self.set_selected_school(first_school.id)
        response = self.client.get(reverse("mat_dashboard"))

        rows = {row["school_name"]: row for row in response.context["school_rows"]}
        self.assertEqual(rows["Tiny School"]["avg_accuracy"], 100.0)
        self.assertEqual(rows[first_school.name]["avg_accuracy"], 100.0)

    def test_progress_api_excludes_pupil_identifiers(self):
        user, profile, first_school = self.create_staff_user_with_school(
            username="api_lead", role=Role.ADMIN
        )
        second_school = self._add_licensed_school(profile, "API Second", role=Role.ADMIN)
        learner = self._add_learner_with_sessions(user, first_school, "SecretPupilName", sessions=3)
        self._add_learner_with_sessions(user, second_school, "AnotherPupil", sessions=2)

        self.client.force_login(user)
        self.set_selected_school(first_school.id)
        response = self.client.get(
            reverse("mat_progress_data"), {"metric": "sessions", "date_range": "30"}
        )

        self.assertEqual(response.status_code, 200)
        body = response.content.decode()
        self.assertNotIn("SecretPupilName", body)
        self.assertNotIn(str(learner.learner_uuid), body)

    def test_progress_api_accuracy_includes_small_schools(self):
        user, profile, first_school = self.create_staff_user_with_school(
            username="api_small_lead", role=Role.ADMIN
        )
        small_school = self._add_licensed_school(profile, "API Tiny", role=Role.ADMIN)
        self._add_learner_with_sessions(user, small_school, "Solo", sessions=1)
        for i in range(5):
            self._add_learner_with_sessions(user, first_school, f"F{i}", sessions=1)

        self.client.force_login(user)
        self.set_selected_school(first_school.id)
        response = self.client.get(
            reverse("mat_progress_data"), {"metric": "accuracy", "date_range": "30"}
        )

        data = response.json()
        series_names = {s["school_name"] for s in data["series"]}
        self.assertIn(first_school.name, series_names)
        self.assertIn("API Tiny", series_names)

    def test_progress_api_denied_for_single_school(self):
        user, profile, school = self.create_staff_user_with_school(
            username="api_denied", role=Role.ADMIN
        )
        self.client.force_login(user)
        self.set_selected_school(school.id)
        response = self.client.get(reverse("mat_progress_data"))
        self.assertEqual(response.status_code, 403)

    def test_targets_percentage_aggregated(self):
        user, profile, first_school = self.create_staff_user_with_school(
            username="targets_lead", role=Role.ADMIN
        )
        self._add_licensed_school(profile, "Targets Second", role=Role.ADMIN)
        learners = [
            self._add_learner_with_sessions(user, first_school, f"T{i}", sessions=1)
            for i in range(5)
        ]
        Target.objects.create(learner=learners[0], text="t1", status=Target.Status.ACHIEVED)
        Target.objects.create(learner=learners[1], text="t2", status=Target.Status.NOT_ACHIEVED)

        self.client.force_login(user)
        self.set_selected_school(first_school.id)
        response = self.client.get(reverse("mat_dashboard"))

        rows = {row["school_name"]: row for row in response.context["school_rows"]}
        self.assertEqual(rows[first_school.name]["targets_percentage"], 50)
