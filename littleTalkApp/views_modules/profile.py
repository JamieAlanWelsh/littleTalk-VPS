from django.contrib import messages
from django.contrib.auth import authenticate
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse

from littleTalkApp.forms import LearnerForm
from littleTalkApp.models import Cohort, Learner, LogEntry, Role


@login_required
def profile(request):
    profile_obj = request.user.profile

    on_trial = False
    trial_days_left = 0
    is_subscribed = False

    if profile_obj.is_parent():
        parent_profile = profile_obj.parent_profile
        all_learners = profile_obj.parent_profile.learners.filter(deleted=False)
        cohorts = Cohort.objects.none()

        on_trial = parent_profile.on_trial()
        trial_days_left = parent_profile.trial_days_left()
        is_subscribed = parent_profile.is_subscribed
    else:
        user_school = profile_obj.get_current_school(request)
        all_learners = Learner.objects.filter(school=user_school, deleted=False)
        cohorts = Cohort.objects.filter(school=user_school).distinct()

    selected_cohort = request.GET.get("cohort")
    try:
        if selected_cohort and not profile_obj.is_parent():
            selected_cohort_id = int(selected_cohort)
            learners = all_learners.filter(cohort__id=selected_cohort_id)
        else:
            learners = all_learners
            selected_cohort_id = None
    except ValueError:
        learners = all_learners
        selected_cohort_id = None

    selected_learner = None
    selected_learner_id = request.session.get("selected_learner_id")
    try:
        if selected_learner_id not in [None, ""]:
            selected_learner = all_learners.get(id=int(selected_learner_id))
    except (ValueError, Learner.DoesNotExist):
        selected_learner = None

    if not selected_learner and learners.exists():
        selected_learner = learners.first()
        request.session["selected_learner_id"] = selected_learner.id

    learners_list = list(learners)
    if selected_learner and selected_learner in learners_list:
        learners_list.remove(selected_learner)
        learners_list.insert(0, selected_learner)

    return render(
        request,
        "profile/profile.html",
        {
            "learners": learners_list,
            "selected_learner": selected_learner,
            "cohorts": cohorts,
            "selected_cohort": selected_cohort_id,
            "on_trial": on_trial,
            "trial_days_left": trial_days_left,
            "is_subscribed": is_subscribed,
        },
    )


@login_required
def add_learner(request):
    if request.method == "POST":
        form = LearnerForm(request.POST, user=request.user)
        if form.is_valid():
            learner = form.save(commit=False)
            learner.user = request.user

            if not request.user.profile.is_parent():
                learner.school = request.user.profile.get_current_school(request)
            learner.save()

            if request.user.profile.is_parent():
                request.user.profile.parent_profile.learners.add(learner)
            learner.save()

            request.session["selected_learner_id"] = learner.id

            return redirect("profile")
    else:
        form = LearnerForm(user=request.user)

    return render(request, "profile/add_learner.html", {"form": form})


@login_required
def select_learner(request):
    if request.method == "POST":
        learner_id = request.POST.get("learner_id")
        if learner_id:
            request.session["selected_learner_id"] = learner_id
    return HttpResponseRedirect(reverse("profile"))


@login_required
def edit_learner(request, learner_uuid):
    learner = get_object_or_404(Learner, learner_uuid=learner_uuid, deleted=False)

    if request.user.profile.is_parent() and learner.school_id:
        return redirect("profile")

    if request.method == "POST":
        if "remove" in request.POST:
            return redirect("confirm_delete_learner", learner_uuid=learner.learner_uuid)

        form = LearnerForm(request.POST, instance=learner, user=request.user)
        if form.is_valid():
            form.save()
            return redirect("profile")
    else:
        form = LearnerForm(instance=learner, user=request.user)

    if learner.school_id:
        role_for = request.user.profile.get_role_for_school(learner.school)
        can_delete = role_for in [Role.ADMIN, Role.TEAM_MANAGER] or request.user.profile.is_parent()
    else:
        can_delete = (
            request.user.profile.is_admin()
            or request.user.profile.is_manager()
            or request.user.profile.is_parent()
        )

    context = {
        "form": form,
        "learner": learner,
        "can_delete": can_delete,
    }
    return render(request, "profile/edit_learner.html", context)


@login_required
def confirm_delete_learner(request, learner_uuid):
    learner = get_object_or_404(Learner, learner_uuid=learner_uuid, deleted=False)

    if request.user.profile.is_parent() and learner.school_id:
        messages.error(request, "You do not have permission to delete this learner.")
        return redirect("profile")

    allowed = False
    if learner.school_id:
        role_for = request.user.profile.get_role_for_school(learner.school)
        if role_for in [Role.ADMIN, Role.TEAM_MANAGER] or (
            request.user.profile.is_parent() and learner.user_id == request.user.id
        ):
            allowed = True
    else:
        if (
            request.user.profile.is_admin()
            or request.user.profile.is_manager()
            or (request.user.profile.is_parent() and learner.user_id == request.user.id)
        ):
            allowed = True

    if not allowed:
        messages.error(request, "You do not have permission to delete this learner.")
        return redirect("profile")

    if request.method == "POST":
        password = request.POST.get("password")
        user = authenticate(request, username=request.user.username, password=password)

        if user is not None:
            learner.deleted = True
            learner.save()

            LogEntry.objects.filter(learner=learner, deleted=False).update(deleted=True)

            del request.session["selected_learner_id"]
            return redirect("profile")

        error_message = "Incorrect password. Please try again."
        return render(
            request,
            "profile/confirm_delete_learner.html",
            {"learner": learner, "error_message": error_message},
        )

    return render(request, "profile/confirm_delete_learner.html", {"learner": learner})
