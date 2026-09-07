from datetime import timedelta

from django.test import RequestFactory, TestCase
from django.utils import timezone

from accounts.models import User
from littleTalkApp.models import Learner, Profile, Role, School, SchoolMembership


class SchoolModelTests(TestCase):
    def test_has_valid_license_false_when_unlicensed(self):
        school = School.objects.create(name="No License", is_licensed=False)

        self.assertFalse(school.has_valid_license())

    def test_has_valid_license_false_when_expired(self):
        school = School.objects.create(
            name="Expired License",
            is_licensed=True,
            license_expires_at=timezone.now() - timedelta(minutes=1),
        )

        self.assertFalse(school.has_valid_license())

    def test_has_valid_license_true_when_active(self):
        school = School.objects.create(
            name="Active License",
            is_licensed=True,
            license_expires_at=timezone.now() + timedelta(days=30),
        )

        self.assertTrue(school.has_valid_license())


class LearnerModelTests(TestCase):
    def test_age_is_stored_as_an_integer(self):
        user = User.objects.create_user(username="learner-owner", password="password123")
        school = School.objects.create(name="Learner School")

        learner = Learner.objects.create(
            user=user,
            school=school,
            name="Learner",
            age=6,
        )

        self.assertEqual(learner.age, 6)


class ProfileModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="profile-user", password="password123")
        self.profile = Profile.objects.create(user=self.user, role=Role.STAFF, first_name="Profile")
        self.school_a = School.objects.create(name="School A")
        self.school_b = School.objects.create(name="School B")
        self.profile.schools.add(self.school_a, self.school_b)

    def test_get_current_school_prefers_session_selected_school(self):
        request = RequestFactory().get("/")
        request.session = {"selected_school_id": self.school_b.id}

        self.assertEqual(self.profile.get_current_school(request), self.school_b)

    def test_get_current_school_falls_back_to_first_school(self):
        request = RequestFactory().get("/")
        request.session = {}

        current = self.profile.get_current_school(request)

        self.assertIn(current, [self.school_a, self.school_b])

    def test_get_role_for_school_uses_membership_role(self):
        SchoolMembership.objects.create(
            profile=self.profile,
            school=self.school_a,
            role=Role.TEAM_MANAGER,
            is_active=True,
        )

        self.assertEqual(self.profile.get_role_for_school(self.school_a), Role.TEAM_MANAGER)

    def test_get_role_for_school_returns_none_for_inactive_membership(self):
        SchoolMembership.objects.create(
            profile=self.profile,
            school=self.school_a,
            role=Role.TEAM_MANAGER,
            is_active=False,
        )

        self.assertIsNone(self.profile.get_role_for_school(self.school_a))

    def test_get_current_school_ignores_inactive_selected_school(self):
        SchoolMembership.objects.create(
            profile=self.profile,
            school=self.school_a,
            role=Role.STAFF,
            is_active=False,
        )
        SchoolMembership.objects.create(
            profile=self.profile,
            school=self.school_b,
            role=Role.STAFF,
            is_active=True,
        )
        request = RequestFactory().get("/")
        request.session = {"selected_school_id": self.school_a.id}

        self.assertEqual(self.profile.get_current_school(request), self.school_b)

    def test_select_school_requires_membership(self):
        request = RequestFactory().get("/")
        request.session = {}
        foreign_school = School.objects.create(name="Foreign School")

        success = self.profile.select_school(foreign_school.id, request=request)

        self.assertFalse(success)
        self.assertNotIn("selected_school_id", request.session)

    def test_select_school_rejects_inactive_membership(self):
        SchoolMembership.objects.create(
            profile=self.profile,
            school=self.school_a,
            role=Role.STAFF,
            is_active=False,
        )
        request = RequestFactory().get("/")
        request.session = {}

        success = self.profile.select_school(self.school_a.id, request=request)

        self.assertFalse(success)
        self.assertNotIn("selected_school_id", request.session)
