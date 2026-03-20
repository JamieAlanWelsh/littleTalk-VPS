from datetime import timedelta

from django.utils import timezone

from accounts.models import User
from littleTalkApp.models import ParentProfile, Profile, Role, School, SchoolMembership


class BaseFlowTestMixin:
    def create_staff_user_with_school(self, username="staff_user", role=Role.STAFF):
        user = User.objects.create_user(username=username, password="password123")
        profile = Profile.objects.create(user=user, role=role, first_name=username)
        school = School.objects.create(
            name=f"{username}-school",
            is_licensed=True,
            license_expires_at=timezone.now() + timedelta(days=30),
        )
        profile.schools.add(school)
        SchoolMembership.objects.create(profile=profile, school=school, role=role, is_active=True)
        return user, profile, school

    def create_parent_user(self, username="parent_user"):
        user = User.objects.create_user(username=username, password="password123")
        profile = Profile.objects.create(user=user, role=Role.PARENT, first_name=username)
        parent_profile = ParentProfile.objects.create(profile=profile)
        return user, profile, parent_profile

    def set_selected_school(self, school_id):
        session = self.client.session
        session["selected_school_id"] = school_id
        session.save()
