from datetime import timedelta

from django.test import RequestFactory, TestCase
from django.utils import timezone

from accounts.models import User
from littleTalkApp.forms import (
    AcceptInviteForm,
    LearnerForm,
    ParentAccessCodeForm,
    ParentSignupForm,
    SchoolSignupForm,
    UserRegistrationForm,
)
from littleTalkApp.models import Cohort, Learner, ParentAccessToken, Profile, Role, School
from littleTalkApp.utilities import hash_email


class FormValidationTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.existing_user = User.objects.create_user(
            username="existing-user",
            password="password123",
        )
        self.existing_user.email_encrypted = "existing@example.com"
        self.existing_user.email_hash = hash_email("existing@example.com")
        self.existing_user.save()

    def test_school_signup_form_rejects_duplicate_email(self):
        form = SchoolSignupForm(
            data={
                "full_name": "Test User",
                "email": "existing@example.com",
                "password": "password123",
                "school_name": "Test School",
            }
        )

        self.assertFalse(form.is_valid())
        self.assertIn("email", form.errors)

    def test_user_registration_rejects_emoji_name(self):
        form = UserRegistrationForm(
            data={
                "email": "new@example.com",
                "first_name": "Mia😀",
                "password1": "password123",
                "password2": "password123",
                "learner_name": "Learner Name",
                "learner_dob": "2019-01-01",
            }
        )

        self.assertFalse(form.is_valid())
        self.assertIn("first_name", form.errors)

    def test_user_registration_rejects_future_learner_dob(self):
        future_date = (timezone.now().date() + timedelta(days=1)).isoformat()
        form = UserRegistrationForm(
            data={
                "email": "new2@example.com",
                "first_name": "Valid Name",
                "password1": "password123",
                "password2": "password123",
                "learner_name": "Learner Name",
                "learner_dob": future_date,
            }
        )

        self.assertFalse(form.is_valid())
        self.assertIn("learner_dob", form.errors)

    def test_accept_invite_requires_min_password_length(self):
        form = AcceptInviteForm(data={"full_name": "Invitee", "password": "12345"})

        self.assertFalse(form.is_valid())
        self.assertIn("password", form.errors)

    def test_parent_signup_form_returns_token_object_for_valid_access_code(self):
        staff = User.objects.create_user(username="staff1", password="password123")
        school = School.objects.create(name="Parent School")
        learner = Learner.objects.create(
            user=staff,
            school=school,
            name="PAC Learner",
            date_of_birth=timezone.now().date() - timedelta(days=365 * 7),
        )
        token = ParentAccessToken.objects.create(learner=learner)

        form = ParentSignupForm(
            data={
                "first_name": "Parent",
                "email": "parent-new@example.com",
                "password": "password123",
                "agree_updates": True,
                "access_code": token.token,
            }
        )

        self.assertTrue(form.is_valid())
        self.assertEqual(form.cleaned_data["access_code"], token)

    def test_parent_access_code_form_rejects_expired_or_used_code(self):
        staff = User.objects.create_user(username="staff2", password="password123")
        school = School.objects.create(name="Parent School 2")
        learner = Learner.objects.create(
            user=staff,
            school=school,
            name="Expired PAC Learner",
            date_of_birth=timezone.now().date() - timedelta(days=365 * 8),
        )
        token = ParentAccessToken.objects.create(learner=learner, used=True)

        form = ParentAccessCodeForm(data={"access_code": token.token})

        self.assertFalse(form.is_valid())
        self.assertIn("access_code", form.errors)

    def test_learner_form_scopes_cohorts_to_session_selected_school(self):
        staff_user = User.objects.create_user(username="staff-cohort", password="password123")
        profile = Profile.objects.create(user=staff_user, role=Role.STAFF, first_name="Staff")
        happy_school = School.objects.create(name="Happy School")
        sad_school = School.objects.create(name="Sad School")
        profile.schools.add(happy_school, sad_school)

        happy_cohort = Cohort.objects.create(school=happy_school, name="happy")
        Cohort.objects.create(school=sad_school, name="sad")

        request = self.factory.get("/")
        request.session = {"selected_school_id": happy_school.id}

        form = LearnerForm(user=staff_user, request=request)

        self.assertQuerySetEqual(
            form.fields["cohort"].queryset.order_by("id"),
            Cohort.objects.filter(id=happy_cohort.id),
            transform=lambda cohort: cohort,
        )