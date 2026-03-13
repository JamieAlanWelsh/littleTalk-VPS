import uuid

from django.contrib import messages
from django.contrib.auth import get_user_model, login
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render

from honeypot.decorators import check_honeypot

from littleTalkApp.forms import ParentAccessCodeForm, ParentSignupForm
from littleTalkApp.models import Learner, ParentAccessToken, ParentProfile, Profile, Role
from littleTalkApp.utilites import hash_email, send_parent_access_email, send_parent_welcome_email


@login_required
def generate_parent_token(request, learner_uuid):
    school = request.user.profile.get_current_school(request)
    learner = get_object_or_404(Learner, learner_uuid=learner_uuid, school=school)

    token, created = ParentAccessToken.objects.get_or_create(learner=learner)

    force = request.GET.get("force") == "true"

    if force or token.is_expired():
        token.regenerate_token()
        messages.success(request, "A new parent access token has been generated.")
    elif created:
        messages.success(request, "Parent access token created.")
    else:
        messages.info(request, "An active token already exists for this learner.")

    return redirect("view_parent_token", learner_uuid=learner.learner_uuid)


@login_required
def view_parent_token(request, learner_uuid):
    if request.user.profile.is_parent():
        return redirect("profile")
    learner = get_object_or_404(
        Learner,
        learner_uuid=learner_uuid,
        school=request.user.profile.get_current_school(request),
    )
    token, created = ParentAccessToken.objects.get_or_create(learner=learner)

    if token.is_expired():
        token.regenerate_token()

    return render(
        request,
        "parent_access/view_token.html",
        {
            "learner": learner,
            "token": token,
            "signup_link": request.build_absolute_uri(f"/parent-signup/?code={token.token}"),
        },
    )


@login_required
def email_parent_token(request, learner_uuid):
    if request.method == "POST":
        learner = get_object_or_404(
            Learner,
            learner_uuid=learner_uuid,
            school=request.user.profile.get_current_school(request),
        )
        token = learner.parent_token
        email = request.POST.get("email")

        if not email:
            messages.error(request, "Email is required.")
            return redirect("view_parent_token", learner_uuid=learner_uuid)

        send_parent_access_email(token, learner, email, request)
        messages.success(request, "Email sent to parent.")
        return redirect("view_parent_token", learner_uuid=learner_uuid)


@check_honeypot
def parent_signup_view(request):
    request.hide_sidebar = True
    prefill_code = request.GET.get("code", "").strip()

    if request.user.is_authenticated:
        return redirect("profile")

    if request.method == "POST":
        form = ParentSignupForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data["email"].lower()
            user = get_user_model().objects.create_user(
                username=str(uuid.uuid4()),
                password=form.cleaned_data["password"],
            )
            user.email_encrypted = email
            user.email_hash = hash_email(email)
            user.save()

            token = form.cleaned_data.get("access_code")
            learner = token.learner if token else None

            profile = Profile.objects.create(
                user=user,
                first_name=form.cleaned_data["first_name"],
                role="parent",
                opted_in=form.cleaned_data.get("agree_updates", False),
            )
            if learner and learner.school_id:
                try:
                    profile.schools.add(learner.school)
                except Exception:
                    pass

            parent_profile = ParentProfile.objects.create(
                profile=profile, is_standalone=(token is None)
            )

            if learner:
                parent_profile.learners.add(learner)
                token.used = True
                token.save()

            send_parent_welcome_email(user)

            login(request, user)
            return redirect("profile")
    else:
        form = ParentSignupForm(initial={"access_code": prefill_code})

    return render(
        request,
        "parent_access/parent_signup.html",
        {
            "form": form,
            "standalone": not prefill_code,
        },
    )


@login_required
def add_learner_via_pac(request):
    if not hasattr(request.user, "profile") or request.user.profile.role != Role.PARENT:
        messages.error(request, "Only parent accounts can add learners via PAC.")
        return redirect("add_learner")

    parent_profile = request.user.profile.parent_profile

    if request.method == "POST":
        form = ParentAccessCodeForm(request.POST)
        if form.is_valid():
            token = form.cleaned_data["access_code"]
            learner = token.learner

            if learner in parent_profile.learners.all():
                messages.info(request, "You already have access to this learner.")
            else:
                parent_profile.learners.add(learner)
                try:
                    profile = request.user.profile
                    if learner.school:
                        profile.schools.add(learner.school)
                except Exception:
                    pass

                token.used = True
                token.save()
                messages.success(request, f"{learner.name} has been added to your account.")
                return redirect("profile")
    else:
        form = ParentAccessCodeForm()

    return render(request, "parent_access/add_learner_via_pac.html", {"form": form})
