from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from accounts.models import User
from littleTalkApp.models import Learner, ParentAccessToken, Role
from littleTalkApp.tests.base import BaseFlowTestMixin
from littleTalkApp.utilities import hash_email


class ParentAccessFlowTests(BaseFlowTestMixin, TestCase):
    def test_parent_signup_with_access_code_links_learner_and_marks_token_used(self):
        staff_user, _, school = self.create_staff_user_with_school(username="staff_parent", role=Role.STAFF)
        learner = Learner.objects.create(
            user=staff_user,
            school=school,
            name="Learner PAC",
            date_of_birth=timezone.now().date() - timedelta(days=365 * 6),
        )
        token = ParentAccessToken.objects.create(learner=learner)

        response = self.client.post(
            reverse("parent_signup"),
            {
                "first_name": "Parent One",
                "email": "parent.one@example.com",
                "password": "parentpass123",
                "agree_updates": True,
                "access_code": token.token,
                "contact_info": "",
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(self.client.session.get("_auth_user_id"))

        created_user = User.objects.get(email_hash=hash_email("parent.one@example.com"))
        self.assertEqual(created_user.profile.role, Role.PARENT)
        self.assertTrue(created_user.profile.parent_profile.learners.filter(id=learner.id).exists())

        token.refresh_from_db()
        self.assertTrue(token.used)

    def test_non_parent_cannot_add_learner_via_pac(self):
        user, _, school = self.create_staff_user_with_school(username="staff_not_parent", role=Role.STAFF)
        self.client.force_login(user)
        self.set_selected_school(school.id)

        response = self.client.post(reverse("add_pac_learner"), {"access_code": "ABC123"}, follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.request["PATH_INFO"], reverse("add_learner"))

    def test_parent_add_learner_via_pac_rejects_expired_code(self):
        parent_user, _, parent_profile_obj = self.create_parent_user("parent_two")
        self.client.force_login(parent_user)

        staff_user, _, school = self.create_staff_user_with_school(username="staff_for_expired", role=Role.STAFF)
        learner = Learner.objects.create(
            user=staff_user,
            school=school,
            name="Learner Expired PAC",
            date_of_birth=timezone.now().date() - timedelta(days=365 * 7),
        )
        token = ParentAccessToken.objects.create(
            learner=learner,
            used=False,
            expires_at=timezone.now() - timedelta(days=1),
        )

        response = self.client.post(reverse("add_pac_learner"), {"access_code": token.token})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(parent_profile_obj.learners.filter(id=learner.id).exists())
