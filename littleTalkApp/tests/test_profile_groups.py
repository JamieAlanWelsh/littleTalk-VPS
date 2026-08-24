from django.test import TestCase
from django.urls import reverse

from littleTalkApp.models import InterventionGroup, Learner, Role
from littleTalkApp.tests.base import BaseFlowTestMixin


class ProfileGroupFlowTests(BaseFlowTestMixin, TestCase):
    def test_profile_group_select_sets_selected_group_and_first_learner(self):
        staff_user, _, school = self.create_staff_user_with_school(
            username="group_admin",
            role=Role.ADMIN,
        )
        learner_a = Learner.objects.create(user=staff_user, school=school, name="Alpha")
        learner_b = Learner.objects.create(user=staff_user, school=school, name="Beta")
        group = InterventionGroup.objects.create(school=school, name="Group A")
        group.learners.add(learner_b, learner_a)

        self.client.force_login(staff_user)
        self.set_selected_school(school.id)

        response = self.client.post(
            reverse("profile_group_select"),
            {"group_id": group.id},
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.session.get("selected_group_id"), group.id)
        self.assertEqual(self.client.session.get("selected_learner_id"), learner_a.id)

    def test_select_learner_clears_selected_group(self):
        staff_user, _, school = self.create_staff_user_with_school(
            username="learner_switcher",
            role=Role.ADMIN,
        )
        learner = Learner.objects.create(user=staff_user, school=school, name="Switcher")
        group = InterventionGroup.objects.create(school=school, name="Group B")
        group.learners.add(learner)

        self.client.force_login(staff_user)
        self.set_selected_school(school.id)

        session = self.client.session
        session["selected_group_id"] = group.id
        session["selected_learner_id"] = learner.id
        session.save()

        response = self.client.post(reverse("select_learner"), {"learner_id": learner.id})

        self.assertEqual(response.status_code, 302)
        self.assertEqual(self.client.session.get("selected_learner_id"), learner.id)
        self.assertNotIn("selected_group_id", self.client.session)