from django.test import TestCase
from django.urls import reverse

from accounts.models import User
from littleTalkApp.models import Profile, Role, School


class MultiSchoolMiddlewareFlowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="staff_user", password="password123")
        self.profile = Profile.objects.create(user=self.user, role=Role.STAFF)
        self.client.force_login(self.user)

    def test_all_unlicensed_multi_school_user_is_redirected_to_select_school(self):
        school_a = School.objects.create(name="School A", is_licensed=False)
        school_b = School.objects.create(name="School B", is_licensed=False)
        self.profile.schools.add(school_a, school_b)

        response = self.client.get(reverse("learner_dashboard"), follow=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.request["PATH_INFO"], reverse("select_school"))

    def test_selected_unlicensed_school_reaches_license_expired_without_loop(self):
        school_a = School.objects.create(name="School A", is_licensed=False)
        school_b = School.objects.create(name="School B", is_licensed=True)
        self.profile.schools.add(school_a, school_b)

        session = self.client.session
        session["selected_school_id"] = school_a.id
        session.save()

        response = self.client.get(reverse("learner_dashboard"), follow=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.request["PATH_INFO"], reverse("license_expired"))

    def test_mixed_license_multi_school_user_without_selection_must_select_school(self):
        school_a = School.objects.create(name="School A", is_licensed=False)
        school_b = School.objects.create(name="School B", is_licensed=True)
        self.profile.schools.add(school_a, school_b)

        response = self.client.get(reverse("cohort_list"), follow=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.request["PATH_INFO"], reverse("select_school"))
