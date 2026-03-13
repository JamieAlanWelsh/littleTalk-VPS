from datetime import timedelta

from django.test import RequestFactory, TestCase
from django.utils import timezone

from accounts.models import User
from littleTalkApp.models import AgeGroup, Learner, Profile, Role, School, SchoolMembership


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


class AgeGroupModelTests(TestCase):
    def test_from_age_boundaries(self):
        self.assertEqual(AgeGroup.from_age(2), AgeGroup.GROUP_1)
        self.assertEqual(AgeGroup.from_age(3), AgeGroup.GROUP_2)
        self.assertEqual(AgeGroup.from_age(5), AgeGroup.GROUP_3)
        self.assertEqual(AgeGroup.from_age(9), AgeGroup.GROUP_4)
        self.assertEqual(AgeGroup.from_age(12), AgeGroup.GROUP_5)


class LearnerModelTests(TestCase):
    def test_derive_age_group_returns_none_for_future_dob(self):
        future_date = timezone.now().date() + timedelta(days=1)

        self.assertIsNone(Learner.derive_age_group(future_date))

    def test_save_populates_age_group(self):
        user = User.objects.create_user(username="learner-owner", password="password123")
        school = School.objects.create(name="Learner School")
        dob = timezone.now().date() - timedelta(days=365 * 6)

        learner = Learner.objects.create(
            user=user,
            school=school,
            name="Learner",
            date_of_birth=dob,
        )

        self.assertEqual(learner.age_group, AgeGroup.GROUP_3)


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

    def test_select_school_requires_membership(self):
        request = RequestFactory().get("/")
        request.session = {}
        foreign_school = School.objects.create(name="Foreign School")

        success = self.profile.select_school(foreign_school.id, request=request)

        self.assertFalse(success)
        self.assertNotIn("selected_school_id", request.session)