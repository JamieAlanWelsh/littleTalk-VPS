from datetime import timedelta

from django.core import mail
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from littleTalkApp.models import (
    JoinRequest,
    Profile,
    Role,
    School,
    SchoolLicenseCode,
    SchoolMembership,
    StaffInvite,
)
from littleTalkApp.tests.base import BaseFlowTestMixin
from littleTalkApp.utilities import hash_email


class SchoolTypicalFlowTests(BaseFlowTestMixin, TestCase):
    def test_school_signup_with_license_code_grants_90_day_license(self):
        code = SchoolLicenseCode.objects.create(code="SCHOOL90")

        response = self.client.post(
            reverse("school_signup"),
            {
                "full_name": "Licensed Admin",
                "email": "licensed-admin@example.com",
                "password": "strongpass123",
                "school_name": "Licensed School",
                "license_code": "school90",
                "contact_info": "",
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)

        school = School.objects.get(name="Licensed School")
        self.assertTrue(school.is_licensed)
        self.assertIsNotNone(school.license_expires_at)
        self.assertGreaterEqual(school.license_expires_at, timezone.now() + timedelta(days=89))
        self.assertLessEqual(school.license_expires_at, timezone.now() + timedelta(days=91))

        code.refresh_from_db()
        self.assertIsNone(code.used_at)
        self.assertIsNone(code.used_by_school)

    def test_school_signup_license_code_can_be_reused_when_active(self):
        SchoolLicenseCode.objects.create(code="SHARED90", is_active=True)

        first = self.client.post(
            reverse("school_signup"),
            {
                "full_name": "Admin One",
                "email": "admin-one@example.com",
                "password": "strongpass123",
                "school_name": "School One",
                "license_code": "shared90",
                "contact_info": "",
            },
            follow=True,
        )
        self.assertEqual(first.status_code, 200)

        self.client.logout()

        second = self.client.post(
            reverse("school_signup"),
            {
                "full_name": "Admin Two",
                "email": "admin-two@example.com",
                "password": "strongpass123",
                "school_name": "School Two",
                "license_code": "SHARED90",
                "contact_info": "",
            },
            follow=True,
        )
        self.assertEqual(second.status_code, 200)

        self.assertTrue(School.objects.get(name="School One").is_licensed)
        self.assertTrue(School.objects.get(name="School Two").is_licensed)

    def test_school_signup_sends_support_notification_email(self):
        response = self.client.post(
            reverse("school_signup"),
            {
                "full_name": "New Admin",
                "email": "new-admin@example.com",
                "password": "strongpass123",
                "school_name": "New School",
                "license_code": "",
                "contact_info": "",
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        support_messages = [
            message
            for message in mail.outbox
            if "support@chatterdillo.com" in message.to
            and message.subject == "New School Signup - Chatterdillo"
        ]

        self.assertEqual(len(support_messages), 1)
        self.assertIn("School: New School", support_messages[0].body)
        self.assertIn("Admin name: New Admin", support_messages[0].body)
        self.assertIn("Admin email: new-admin@example.com", support_messages[0].body)
        self.assertIn("License code used: none", support_messages[0].body)

    def test_accept_invite_creates_user_and_membership(self):
        admin_user, _, school = self.create_staff_user_with_school(username="admin_user", role=Role.ADMIN)
        invite = StaffInvite.objects.create(
            school=school,
            email="invitee@example.com",
            role=Role.STAFF,
            sent_by=admin_user,
        )

        response = self.client.post(
            reverse("accept_invite", kwargs={"token": invite.token}),
            {"full_name": "Invited User", "password": "strongpass123", "contact_info": ""},
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        invite.refresh_from_db()
        self.assertTrue(invite.used)

        invited_user = Profile.objects.get(user__email_hash=hash_email("invitee@example.com")).user
        self.assertEqual(invited_user.profile.first_name, "Invited User")
        self.assertTrue(
            SchoolMembership.objects.filter(
                profile=invited_user.profile,
                school=school,
                role=Role.STAFF,
            ).exists()
        )

    def test_expired_invite_redirects_home(self):
        admin_user, _, school = self.create_staff_user_with_school(username="admin_owner", role=Role.ADMIN)
        invite = StaffInvite.objects.create(
            school=school,
            email="expired@example.com",
            role=Role.STAFF,
            sent_by=admin_user,
            expires_at=timezone.now() - timedelta(days=1),
        )

        response = self.client.get(reverse("accept_invite", kwargs={"token": invite.token}))
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "/")

    def test_school_dashboard_can_update_membership_role(self):
        admin_user, _, school = self.create_staff_user_with_school(username="admin_owner", role=Role.ADMIN)
        staff_user, staff_profile, _ = self.create_staff_user_with_school(username="staff_member", role=Role.STAFF)

        staff_profile.schools.add(school)
        SchoolMembership.objects.update_or_create(
            profile=staff_profile,
            school=school,
            defaults={"role": Role.STAFF, "is_active": True},
        )

        self.client.force_login(admin_user)
        self.set_selected_school(school.id)

        response = self.client.post(
            reverse("school"),
            {"user_id": staff_user.id, "new_role": Role.TEAM_MANAGER},
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        updated_membership = SchoolMembership.objects.get(profile=staff_profile, school=school)
        self.assertEqual(updated_membership.role, Role.TEAM_MANAGER)


class JoinRequestFlowTests(BaseFlowTestMixin, TestCase):
    def test_request_join_school_creates_pending_request(self):
        school = School.objects.create(name="Join School")

        response = self.client.post(
            reverse("request_join_school"),
            {
                "full_name": "Join User",
                "email": "joiner@example.com",
                "school": school.id,
                "contact_info": "",
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            JoinRequest.objects.filter(
                full_name="Join User",
                email="joiner@example.com",
                school=school,
                status="pending",
            ).exists()
        )

    def test_admin_can_approve_join_request_from_school_dashboard(self):
        admin_user, _, school = self.create_staff_user_with_school(username="admin_join", role=Role.ADMIN)
        join_request = JoinRequest.objects.create(
            full_name="Prospective Staff",
            email="prospective@example.com",
            school=school,
            status=JoinRequest.Status.PENDING,
        )

        self.client.force_login(admin_user)
        self.set_selected_school(school.id)

        response = self.client.post(
            reverse("school"),
            {"approve_join_request": "1", "join_request_id": join_request.id},
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        join_request.refresh_from_db()
        self.assertEqual(join_request.status, "accepted")
        self.assertTrue(
            StaffInvite.objects.filter(
                school=school,
                email="prospective@example.com",
                used=False,
                withdrawn=False,
            ).exists()
        )
