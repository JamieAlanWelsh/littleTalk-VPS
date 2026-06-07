import importlib
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from littleTalkApp.models import ExerciseSession, Learner, Role
from littleTalkApp.tests.base import BaseFlowTestMixin


MIGRATION_MODULE = importlib.import_module(
    "littleTalkApp.migrations.0076_normalize_legacy_exercisesession_data"
)


class LegacyExerciseSessionMigrationTests(BaseFlowTestMixin, TestCase):
    def setUp(self):
        self.user, _, self.school = self.create_staff_user_with_school(
            username="legacy_migration_staff", role=Role.STAFF
        )
        self.learner = Learner.objects.create(
            user=self.user,
            school=self.school,
            name="Legacy Migration Learner",
            date_of_birth=timezone.now().date() - timedelta(days=365 * 8),
        )

    def _create_session(self, exercise_id, difficulty_selected, difficulty_label=""):
        started_at = timezone.now() - timedelta(minutes=3)
        completed_at = timezone.now() - timedelta(minutes=1)
        return ExerciseSession.objects.create(
            learner=self.learner,
            exercise_id=exercise_id,
            difficulty_selected=difficulty_selected,
            difficulty_label=difficulty_label,
            started_at=started_at,
            completed_at=completed_at,
            total_questions=5,
            incorrect_answers=1,
            attempts_per_question=[1, 1, 2, 1, 1],
            learner_total_exp_after_session=20,
        )

    def test_normalize_legacy_exercise_sessions_updates_legacy_ids_and_difficulty(self):
        sessions = [
            self._create_session("Story Train", "0"),
            self._create_session("Categorisation", "19"),
            self._create_session("Categorisation", "20"),
            self._create_session("Categorisation", "37"),
            self._create_session("Concept Quest", "43"),
            self._create_session("Concept Quest", "46"),
            self._create_session("Concept Quest", "49"),
            self._create_session("Concept Quest", "41"),
            self._create_session("Colourful Semantics", "5"),
            self._create_session("Colourful Semantics", "15"),
            self._create_session("Colourful Semantics", "25"),
            self._create_session("Colourful Semantics", "35"),
            self._create_session("Colourful Semantics", "45"),
            self._create_session("Think and Find", "10"),
            self._create_session("Think and Find", "20"),
            self._create_session("Think and Find", "30"),
            self._create_session("Think and Find", "31"),
            self._create_session("spot-on", "2", "2 prepositions"),
        ]

        MIGRATION_MODULE.normalize_legacy_exercise_sessions(apps=None, schema_editor=None)

        expected = {
            sessions[0].pk: ("story-train", "3", "3-step sequence"),
            sessions[1].pk: ("categorisation", "2", "2 categories"),
            sessions[2].pk: ("categorisation", "3", "3 categories"),
            sessions[3].pk: ("categorisation", "4", "4 categories"),
            sessions[4].pk: ("concept-quest", "1", "Positive"),
            sessions[5].pk: ("concept-quest", "2", "Comparitive"),
            sessions[6].pk: ("concept-quest", "3", "Superlative"),
            sessions[7].pk: ("concept-quest", "", ""),
            sessions[8].pk: ("colourful-semantics", "1", "Subject"),
            sessions[9].pk: ("colourful-semantics", "1", "Verb"),
            sessions[10].pk: ("colourful-semantics", "2", "Subject+Verb"),
            sessions[11].pk: ("colourful-semantics", "3", "Subject+Verb+Object"),
            sessions[12].pk: (
                "colourful-semantics",
                "4",
                "Subject+Verb+Object+Location",
            ),
            sessions[13].pk: ("think-and-find", "2", "2 options"),
            sessions[14].pk: ("think-and-find", "3", "3 options"),
            sessions[15].pk: ("think-and-find", "4", "4 options"),
            sessions[16].pk: ("think-and-find", "5", "5 options"),
            sessions[17].pk: ("spot-on", "2", "2 prepositions"),
        }

        actual = {
            session.pk: (
                session.exercise_id,
                session.difficulty_selected,
                session.difficulty_label,
            )
            for session in ExerciseSession.objects.order_by("pk")
        }

        self.assertEqual(actual, expected)

    def test_normalize_legacy_exercise_sessions_blanks_invalid_legacy_difficulty(self):
        session = self._create_session("Think and Find", "not-a-number")

        MIGRATION_MODULE.normalize_legacy_exercise_sessions(apps=None, schema_editor=None)

        session.refresh_from_db()
        self.assertEqual(session.exercise_id, "think-and-find")
        self.assertEqual(session.difficulty_selected, "")
        self.assertEqual(session.difficulty_label, "")