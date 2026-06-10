from datetime import timedelta

from django.utils import timezone

from accounts.models import User
from littleTalkApp.models import ParentProfile, Profile, Role, School, SchoolMembership, SkolonUser, SkolonOrg


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

    def create_skolon_user_with_school(self, username="skolon_user", school_name=None):
        user = User.objects.create_user(username=username)
        user.set_unusable_password()
        user.save()

        school = School.objects.create(
            name=school_name or f"{username}-school",
            is_licensed=True,
            license_expires_at=timezone.now() + timedelta(days=30),
        )
        profile = Profile.objects.create(user=user, role=Role.ADMIN, first_name=username)
        profile.schools.add(school)
        SchoolMembership.objects.create(
            profile=profile,
            school=school,
            role=Role.ADMIN,
            is_active=True,
        )
        SkolonOrg.objects.create(skolon_id=f"org-{username}", name=school.name, school=school)
        SkolonUser.objects.create(
            skolon_id=f"skolon-{username}",
            external_id=f"external-{username}",
            user=user,
            skolon_org=school.skolon_org,
            role="TEACHER",
        )
        return user, profile, school

    def set_selected_school(self, school_id):
        session = self.client.session
        session["selected_school_id"] = school_id
        session.save()
