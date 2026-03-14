import uuid

from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model, login
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from honeypot.decorators import check_honeypot

from littleTalkApp.forms import (
    AcceptInviteForm,
    CohortForm,
    JoinRequestForm,
    SchoolSignupForm,
    StaffInviteForm,
)
from littleTalkApp.models import Cohort, JoinRequest, Profile, Role, School, SchoolMembership, StaffInvite
from littleTalkApp.utilites import hash_email, send_invite_email, send_school_welcome_email


def _handle_school_role_update(request, profile, school):
    user_id = request.POST.get("user_id")
    new_role = request.POST.get("new_role")

    target_profile = get_object_or_404(Profile, user__id=user_id)

    if not target_profile.schools.filter(id=school.id).exists():
        messages.error(
            request,
            "This user is not associated with this school. Please notify support",
        )
        return redirect("school")

    target_current_role = target_profile.get_role_for_school(school)

    if target_profile.user == request.user:
        messages.error(request, "You cannot change your own role.")
    elif profile.is_manager_for_school(school) and target_current_role == Role.ADMIN:
        messages.error(request, "Only admins can edit the roles of other admins.")
    elif profile.is_manager_for_school(school) and new_role == Role.ADMIN:
        messages.error(request, "Only admins can assign the admin role.")
    elif new_role in dict(Role.CHOICES).keys():
        try:
            membership = target_profile.memberships.filter(school=school).first()
            if membership:
                membership.role = new_role
                membership.save()
            else:
                target_profile.schools.add(school)
                SchoolMembership.objects.create(
                    profile=target_profile,
                    school=school,
                    role=new_role,
                    is_active=True,
                )
        except Exception:
            target_profile.role = new_role
            target_profile.save()
        messages.success(request, f"{target_profile.first_name}'s role updated")
    else:
        messages.error(request, "Invalid role selected.")
    return redirect("school")


def _handle_school_invite_resend(request, school):
    invite_id = request.POST.get("invite_id")
    invite = get_object_or_404(
        StaffInvite, id=invite_id, school=school, used=False, withdrawn=False
    )

    send_invite_email(invite, school, request)
    messages.success(request, f"Invite resent to {invite.email}.")
    return redirect("school")


def _handle_school_invite_withdrawal(request, school):
    invite_id = request.POST.get("invite_id")
    invite = get_object_or_404(
        StaffInvite, id=invite_id, school=school, used=False, withdrawn=False
    )

    invite.withdrawn = True
    invite.save()
    messages.success(request, f"Invite to {invite.email} withdrawn.")
    return redirect("school")


def _handle_school_join_request_action(request, school):
    join_request_id = request.POST.get("join_request_id")
    join_request = get_object_or_404(
        JoinRequest, id=join_request_id, school=school, status="pending"
    )

    if "approve_join_request" in request.POST:
        invite = StaffInvite.objects.create(
            email=join_request.email,
            role="staff",
            school=school,
            sent_by=request.user,
        )
        send_invite_email(invite, school, request)
        join_request.status = "accepted"
        messages.success(
            request,
            f"Join request from {join_request.full_name} approved and invite sent.",
        )
    else:
        join_request.status = "rejected"
        messages.info(
            request, f"Join request from {join_request.full_name} was rejected."
        )

    join_request.resolved_by = request.user
    join_request.resolved_at = timezone.now()
    join_request.save()
    return redirect("school")


def _handle_school_dashboard_post(request, profile, school):
    if "user_id" in request.POST and "new_role" in request.POST:
        return _handle_school_role_update(request, profile, school)

    if "resend_invite" in request.POST:
        return _handle_school_invite_resend(request, school)

    if "withdraw_invite" in request.POST:
        return _handle_school_invite_withdrawal(request, school)

    if "approve_join_request" in request.POST or "reject_join_request" in request.POST:
        return _handle_school_join_request_action(request, school)

    return None


@check_honeypot
def school_signup(request):
    """Renders school/school_signup.html — onboarding form for a new school admin.

    Creates the user account, school, profile, and SchoolMembership records, sends
    a welcome email, logs the user in, and redirects to the profile page.
    Protected by a honeypot field to deter bots.
    """

    request.hide_sidebar = True
    if request.method == "POST":
        form = SchoolSignupForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data["email"].lower()
            password = form.cleaned_data["password"]
            full_name = form.cleaned_data["full_name"]
            school_name = form.cleaned_data["school_name"]

            user = get_user_model().objects.create_user(
                username=str(uuid.uuid4()), password=password
            )
            user.email_encrypted = email
            user.email_hash = hash_email(email)
            user.save()

            school = School.objects.create(name=school_name, created_by=user)

            profile = Profile.objects.create(user=user, first_name=full_name)
            try:
                profile.schools.add(school)
            except Exception:
                pass
            profile.role = Role.ADMIN
            profile.save()
            try:
                SchoolMembership.objects.create(
                    profile=profile, school=school, role=Role.ADMIN, is_active=True
                )
            except Exception:
                pass

            send_school_welcome_email(school, user)

            login(request, user)

            return redirect("profile")
    else:
        form = SchoolSignupForm()

    return render(request, "school/school_signup.html", {"form": form})


@check_honeypot
def accept_invite(request, token):
    """Renders school/accept_invite.html — staff registration via a single-use invite token.

    Validates that the token exists, is unused, not withdrawn, and not expired.
    Redirects to '/' for any invalid token. On successful sign-up, creates the
    user, profile, and SchoolMembership, marks the invite as used, and logs the
    user in. Also invalidates any duplicate pending invites for the same email.
    Protected by a honeypot field.
    """

    request.hide_sidebar = True

    try:
        invite = StaffInvite.objects.get(token=token)
    except StaffInvite.DoesNotExist:
        return redirect("/")

    if invite.used or invite.withdrawn or invite.expires_at < timezone.now():
        return redirect("/")

    email_hash = hash_email(invite.email.lower())
    if email_hash and get_user_model().objects.filter(email_hash=email_hash).first():
        return redirect("/")

    if request.method == "POST":
        form = AcceptInviteForm(request.POST)
        if form.is_valid():
            email = invite.email.lower()
            password = form.cleaned_data["password"]
            full_name = form.cleaned_data["full_name"]

            user = get_user_model().objects.create_user(
                username=str(uuid.uuid4()), password=password
            )
            user.email_encrypted = email
            user.email_hash = hash_email(email)
            user.save()

            profile = Profile.objects.create(user=user, first_name=full_name)
            try:
                profile.schools.add(invite.school)
            except Exception:
                pass
            profile.role = invite.role
            profile.save()
            try:
                SchoolMembership.objects.create(
                    profile=profile,
                    school=invite.school,
                    role=invite.role,
                    is_active=True,
                )
            except Exception:
                pass

            invite.used = True
            invite.save()

            StaffInvite.objects.filter(
                email__iexact=invite.email,
                used=False,
                withdrawn=False,
            ).exclude(id=invite.id).update(used=True)

            login(request, user)
            return redirect("profile")
    else:
        form = AcceptInviteForm()

    return render(
        request,
        "school/accept_invite.html",
        {"form": form, "school_name": invite.school.name, "email": invite.email},
    )


@login_required
def invite_staff(request):
    """Renders school/invite_staff.html — form for admins/managers to invite a new staff member.

    Creates a StaffInvite record and sends the invite email. Only accessible to
    admins and managers of the current school.
    """

    profile = request.user.profile
    school = profile.get_current_school(request)

    if not (
        profile.is_admin_for_school(school) or profile.is_manager_for_school(school)
    ):
        return redirect("school")

    if request.method == "POST":
        form = StaffInviteForm(request.POST, school=school, user=request.user)
        if form.is_valid():
            invite = form.save(commit=False)
            invite.school = school
            invite.sent_by = request.user
            invite.save()

            send_invite_email(invite, school, request)

            messages.success(request, f"Invite sent to {invite.email}")
            return redirect("invite_staff")
    else:
        form = StaffInviteForm(user=request.user, school=school)

    return render(
        request,
        "school/invite_staff.html",
        {
            "form": form,
        },
    )


@login_required
def school_dashboard(request):
    """Renders school/school_dashboard.html — the school management hub.

    Handles role changes, invite resends/withdrawals, and join request
    approvals/rejections via POST. On GET, displays the full staff list, pending
    invites, and pending join requests. Shows a school switcher when the user
    belongs to multiple schools. Not accessible to parent accounts.
    """

    if request.user.profile.is_parent():
        return redirect("profile")
    profile = request.user.profile
    school = profile.get_current_school(request)
    available_schools = profile.schools.all().order_by("name")
    show_school_switcher = available_schools.count() > 1
    current_school_id = school.id if school else None

    if request.method == "POST":
        post_response = _handle_school_dashboard_post(request, profile, school)
        if post_response:
            return post_response

    raw_profiles = (
        Profile.objects.filter(Q(schools=school)).select_related("user").distinct()
    )
    staff_profiles = []
    for profile_item in raw_profiles:
        try:
            role_for = profile_item.get_role_for_school(school)
        except Exception:
            role_for = profile_item.role
        if role_for != Role.PARENT:
            staff_profiles.append({"profile": profile_item, "role": role_for})

    invites = StaffInvite.objects.filter(
        school=school, used=False, withdrawn=False
    ).order_by("-created_at")[:10]

    can_invite_staff = profile.is_admin_for_school(school) or profile.is_manager_for_school(
        school
    )
    join_requests = []
    if can_invite_staff:
        join_requests = JoinRequest.objects.filter(
            school=school, status="pending"
        ).order_by("-created_at")[:10]

    return render(
        request,
        "school/school_dashboard.html",
        {
            "staff_profiles": staff_profiles,
            "invites": invites,
            "school_name": school.name,
            "school": school,
            "role_choices": Role.CHOICES,
            "can_invite_staff": can_invite_staff,
            "current_user_is_admin_or_manager": can_invite_staff,
            "join_requests": join_requests,
            "available_schools": available_schools,
            "show_school_switcher": show_school_switcher,
            "current_school_id": current_school_id,
        },
    )


@check_honeypot
def request_join_school(request):
    """Renders school/request_join_school.html — public form for someone to request
    access to a school without having received an invite. Admins review requests
    in the school dashboard. Protected by a honeypot field.
    """

    request.hide_sidebar = True
    if request.method == "POST":
        form = JoinRequestForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(
                request,
                "Your request has been submitted. An admin will review it shortly. If approved, you will receive an invite via E-Mail",
            )
            return redirect("request_join_school")
    else:
        form = JoinRequestForm()

    return render(request, "school/request_join_school.html", {"form": form})


@login_required
def invite_audit_trail(request):
    """Renders school/invite_audit_trail.html — shows the 50 most recent invites and
    join requests for the current school. Only accessible to admins and managers.
    """

    school = request.user.profile.get_current_school(request)
    if not (
        request.user.profile.is_admin_for_school(school)
        or request.user.profile.is_manager_for_school(school)
    ):
        return redirect("school")

    invites = (
        StaffInvite.objects.filter(school=school)
        .select_related("sent_by")
        .order_by("-created_at")[:50]
    )
    join_requests = (
        JoinRequest.objects.filter(school=school)
        .select_related("resolved_by")
        .order_by("-created_at")[:50]
    )

    return render(
        request,
        "school/invite_audit_trail.html",
        {
            "invites": invites,
            "join_requests": join_requests,
            "now": timezone.now(),
        },
    )


@login_required
def cohort_list(request):
    """Renders school/cohorts/cohort_list.html — lists all cohorts for the current school.
    Only accessible to admins and managers.
    """

    school = request.user.profile.get_current_school(request)
    if not (
        request.user.profile.is_admin_for_school(school)
        or request.user.profile.is_manager_for_school(school)
    ):
        return redirect("profile")

    cohorts = Cohort.objects.filter(school=school).order_by("name")
    return render(
        request,
        "school/cohorts/cohort_list.html",
        {
            "cohorts": cohorts,
            "can_edit_cohorts": request.user.profile.is_admin_for_school(school)
            or request.user.profile.is_manager_for_school(school),
        },
    )


@login_required
def cohort_create(request):
    """Renders school/cohorts/cohort_form.html — form to create a new cohort.
    Only accessible to admins and managers of the current school.
    """

    school = request.user.profile.get_current_school(request)
    if not (
        request.user.profile.is_admin_for_school(school)
        or request.user.profile.is_manager_for_school(school)
    ):
        return redirect("profile")

    if request.method == "POST":
        form = CohortForm(request.POST)
        if form.is_valid():
            cohort = form.save(commit=False)
            cohort.school = school
            cohort.save()
            return redirect("cohort_list")
    else:
        form = CohortForm()

    return render(
        request, "school/cohorts/cohort_form.html", {"form": form, "is_editing": False}
    )


@login_required
def cohort_edit(request, cohort_id):
    """Renders school/cohorts/cohort_form.html (in edit mode) — edit an existing cohort.
    Only accessible to admins and managers of the current school.
    """

    school = request.user.profile.get_current_school(request)
    if not (
        request.user.profile.is_admin_for_school(school)
        or request.user.profile.is_manager_for_school(school)
    ):
        return redirect("cohort_list")

    cohort = get_object_or_404(Cohort, id=cohort_id, school=school)

    if request.method == "POST":
        form = CohortForm(request.POST, instance=cohort)
        if form.is_valid():
            form.save()
            return redirect("cohort_list")
    else:
        form = CohortForm(instance=cohort)

    return render(
        request, "school/cohorts/cohort_form.html", {"form": form, "is_editing": True}
    )


@login_required
def cohort_delete(request, cohort_id):
    """Renders school/cohorts/cohort_confirm_delete.html — password-confirmed cohort deletion.

    Requires re-entry of the user's password before the cohort is permanently deleted.
    Only accessible to admins and managers of the current school.
    """

    school = request.user.profile.get_current_school(request)
    if not (
        request.user.profile.is_admin_for_school(school)
        or request.user.profile.is_manager_for_school(school)
    ):
        return redirect("cohort_list")

    cohort = get_object_or_404(Cohort, id=cohort_id, school=school)

    if request.method == "POST":
        password = request.POST.get("password")
        user = authenticate(username=request.user.username, password=password)

        if user is not None:
            cohort.delete()
            return redirect("cohort_list")

        error_message = "Incorrect password. Please try again."
        return render(
            request,
            "school/cohorts/cohort_confirm_delete.html",
            {"cohort": cohort, "error_message": error_message},
        )

    return render(request, "school/cohorts/cohort_confirm_delete.html", {"cohort": cohort})


@login_required
def select_school(request):
    """Renders school/select_school.html — lets users who belong to multiple schools
    pick their active school for the session. Single-school users are redirected
    immediately to the profile page without seeing the selection screen.
    Not accessible to parent accounts.
    """

    request.hide_sidebar = True
    profile = request.user.profile

    if profile.is_parent():
        return redirect("profile")

    if not profile.has_multiple_schools():
        school = profile.schools.first()
        if school:
            request.session["selected_school_id"] = school.id
        return redirect("profile")

    if request.method == "POST":
        school_id = request.POST.get("school_id")
        next_url = request.POST.get("next", "profile")

        if school_id and school_id.isdigit():
            if profile.select_school(int(school_id), request):
                return redirect(next_url)
        messages.error(request, "Please select a valid school.")

    schools = profile.schools.all()
    return render(
        request,
        "school/select_school.html",
        {
            "schools": schools,
            "next_url": request.GET.get("next"),
        },
    )
