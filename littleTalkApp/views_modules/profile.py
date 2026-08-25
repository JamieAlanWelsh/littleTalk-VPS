from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Prefetch
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.template.loader import render_to_string
from django.urls import reverse
from django.templatetags.static import static

from littleTalkApp.content.avatars import (
    AVATAR_CHARACTER_MAP,
    AVATAR_COLORS,
    DEFAULT_AVATAR_CHARACTER,
    DEFAULT_AVATAR_COLOR,
    SELECTABLE_AVATAR_CHARACTERS,
)
from littleTalkApp.forms import LearnerForm
from littleTalkApp.decorators import block_read_only
from littleTalkApp.models import Cohort, InterventionGroup, Learner, LogEntry, Role
from littleTalkApp.views_modules.practise import get_recommended_stage_label


def _learner_is_accessible_by_user(user, request, learner):
    if learner.deleted:
        return False

    if user.profile.is_parent():
        if learner.school_id:
            return learner.user_id == user.id
        return learner in user.profile.parent_profile.learners.all()

    user_school = user.profile.get_current_school(request)
    return learner.school == user_school


def _get_avatar_image_url(avatar_character):
    character_meta = AVATAR_CHARACTER_MAP.get(avatar_character)
    if not character_meta:
        character_meta = AVATAR_CHARACTER_MAP[DEFAULT_AVATAR_CHARACTER]

    return static(f"exercise_assets/characters/{character_meta['image_filename']}")


def _decorate_learner_avatar(learner):
    learner.avatar_image_url = _get_avatar_image_url(learner.avatar_character)
    learner.avatar_display_color = learner.avatar_color or DEFAULT_AVATAR_COLOR
    return learner


@login_required
def profile(request):
    """Renders profile/profile.html — the main account page.

    Shows the learner list for the current user (scoped to their school or, for
    parents, to their linked learners). Handles cohort filtering and keeps the
    selected learner at the top of the list. Also surfaces trial/subscription
    state for parent accounts.
    """

    profile_obj = request.user.profile

    on_trial = False
    trial_days_left = 0
    is_subscribed = False

    if profile_obj.is_parent():
        parent_profile = profile_obj.parent_profile
        all_learners = profile_obj.parent_profile.learners.filter(deleted=False)
        cohorts = Cohort.objects.none()
        manage_cohorts = []
        school_learners = []
        can_edit_cohorts = False
        manage_groups = []
        school_group_learners = []
        can_edit_groups = False
        selected_group_id = None

        on_trial = parent_profile.on_trial()
        trial_days_left = parent_profile.trial_days_left()
        is_subscribed = parent_profile.is_subscribed
    else:
        user_school = profile_obj.get_current_school(request)
        if user_school:
            all_learners = Learner.objects.filter(school=user_school, deleted=False)
            cohorts = Cohort.objects.filter(school=user_school).distinct()
            can_edit_cohorts = profile_obj.is_admin_for_school(user_school) or profile_obj.is_manager_for_school(user_school)
            can_edit_groups = can_edit_cohorts

            cohort_learners = Learner.objects.filter(school=user_school, deleted=False)
            manage_cohorts = list(
                Cohort.objects.filter(school=user_school)
                .order_by("name")
                .prefetch_related(
                    Prefetch(
                        "learner_set",
                        queryset=cohort_learners,
                        to_attr="active_learners",
                    )
                )
            )
            school_learners = [_decorate_learner_avatar(learner) for learner in cohort_learners]

            group_learners = Learner.objects.filter(school=user_school, deleted=False)
            manage_groups = list(
                InterventionGroup.objects.filter(school=user_school)
                .order_by("name")
                .prefetch_related(
                    Prefetch(
                        "learners",
                        queryset=group_learners,
                        to_attr="active_learners",
                    )
                )
            )
            school_group_learners = [_decorate_learner_avatar(learner) for learner in group_learners]

            for cohort in manage_cohorts:
                cohort.active_learners = [
                    _decorate_learner_avatar(learner)
                    for learner in cohort.active_learners
                ]
            for group in manage_groups:
                group.active_learners = [
                    _decorate_learner_avatar(learner)
                    for learner in group.active_learners
                ]
                group.active_learner_ids = [learner.id for learner in group.active_learners]

            selected_group_id = request.session.get("selected_group_id")
            if selected_group_id not in [None, ""]:
                try:
                    selected_group_id = int(selected_group_id)
                    if not any(group.id == selected_group_id for group in manage_groups):
                        selected_group_id = None
                except ValueError:
                    selected_group_id = None
            # The group panel/nav shown by default when nothing is being viewed yet.
            viewed_group_id = selected_group_id
            if viewed_group_id is None and manage_groups:
                viewed_group_id = manage_groups[0].id
        else:
            all_learners = Learner.objects.none()
            cohorts = Cohort.objects.none()
            manage_cohorts = []
            school_learners = []
            can_edit_cohorts = False
            manage_groups = []
            school_group_learners = []
            can_edit_groups = False
            selected_group_id = None
            viewed_group_id = None

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

    learners_list = [_decorate_learner_avatar(learner) for learner in learners]

    recommended_stage_label = None
    if selected_learner:
        selected_learner = _decorate_learner_avatar(selected_learner)
        recommended_stage_label = get_recommended_stage_label(selected_learner)

    # The group set as the practise selection (if any) takes priority over the individual learner.
    practise_group = None
    if selected_group_id:
        practise_group = next((group for group in manage_groups if group.id == selected_group_id), None)

    is_selected_for_practise = bool(selected_learner) and not practise_group
    animate_context_bar = request.session.pop("animate_profile_context_bar", False)

    return render(
        request,
        "profile/profile.html",
        {
            "learners": learners_list,
            "selected_learner": selected_learner,
            "recommended_stage_label": recommended_stage_label,
            "cohorts": cohorts,
            "selected_cohort": selected_cohort_id,
            "on_trial": on_trial,
            "trial_days_left": trial_days_left,
            "is_subscribed": is_subscribed,
            "is_staff_profile": not profile_obj.is_parent(),
            "manage_cohorts": manage_cohorts,
            "school_learners": school_learners,
            "can_edit_cohorts": can_edit_cohorts,
            "manage_groups": manage_groups,
            "school_group_learners": school_group_learners,
            "can_edit_groups": can_edit_groups,
            "selected_group_id": selected_group_id,
            "viewed_group_id": viewed_group_id,
            "practise_group": practise_group,
            "is_selected_for_practise": is_selected_for_practise,
            "animate_context_bar": animate_context_bar,
        },
    )


@login_required
def avatar_editor(request, learner_uuid):
    """Render avatar editor screen for a learner the current user can access."""

    learner = get_object_or_404(Learner, learner_uuid=learner_uuid, deleted=False)

    if not _learner_is_accessible_by_user(request.user, request, learner):
        messages.error(request, "You do not have permission to edit this learner avatar.")
        return redirect("profile")

    characters = []
    for character in SELECTABLE_AVATAR_CHARACTERS:
        characters.append(
            {
                "id": character["id"],
                "name": character["name"],
                "bio": character["bio"],
                "imageUrl": static(
                    f"exercise_assets/characters/{character['image_filename']}"
                ),
            }
        )

    current_character = learner.avatar_character
    if current_character == DEFAULT_AVATAR_CHARACTER:
        current_character = SELECTABLE_AVATAR_CHARACTERS[0]["id"]

    context = {
        "learner": learner,
        "avatar_characters": characters,
        "avatar_colors": AVATAR_COLORS,
        "current_avatar_character": current_character,
        "current_avatar_color": learner.avatar_color or DEFAULT_AVATAR_COLOR,
    }
    return render(request, "profile/avatar_editor.html", context)


@login_required
@block_read_only
def add_learner(request):
    """Renders profile/add_learner.html — form to create a new learner record.

    On POST, saves the learner, assigns them to the user's school (if applicable)
    or the parent's profile, sets them as the selected learner in the session,
    and redirects to the profile page.
    """

    if request.method == "POST":
        form = LearnerForm(request.POST, user=request.user, request=request)
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
            request.session.pop("selected_group_id", None)

            return redirect("profile")
    else:
        form = LearnerForm(user=request.user, request=request)

    return render(request, "profile/add_learner.html", {"form": form})


@login_required
def select_learner(request):
    """Sets the practise selection or previews a learner's details, depending on the request.

    A standard (non-AJAX) POST form submit — used by the "Select for practise" button —
    stores the chosen learner ID in the session as the practise selection and redirects
    back to the profile page.

    An AJAX POST (``X-Requested-With: XMLHttpRequest``) — used by the left-column nav —
    only previews the learner's details without changing the practise selection, and
    returns the rendered right-column detail partial as JSON so the page can switch
    the displayed learner without a full reload.
    """

    if request.method != "POST":
        return HttpResponseRedirect(reverse("profile"))

    learner_id = request.POST.get("learner_id")
    is_ajax = request.headers.get("x-requested-with") == "XMLHttpRequest"

    try:
        learner_id_int = int(learner_id) if learner_id not in [None, ""] else None
    except (TypeError, ValueError):
        learner_id_int = None

    if not is_ajax:
        if learner_id_int is not None:
            request.session["selected_learner_id"] = learner_id_int
            request.session.pop("selected_group_id", None)
            request.session["animate_profile_context_bar"] = True
        return HttpResponseRedirect(reverse("profile"))

    if learner_id_int is None:
        return JsonResponse({"error": "Missing learner_id."}, status=400)

    try:
        learner = Learner.objects.get(id=learner_id_int, deleted=False)
    except (ValueError, Learner.DoesNotExist):
        return JsonResponse({"error": "Learner not found."}, status=404)

    if not _learner_is_accessible_by_user(request.user, request, learner):
        return JsonResponse({"error": "You cannot access this learner."}, status=403)

    _decorate_learner_avatar(learner)

    is_selected_for_practise = (
        not request.session.get("selected_group_id")
        and str(request.session.get("selected_learner_id")) == str(learner.id)
    )

    context = {
        "selected_learner": learner,
        "is_selected_for_practise": is_selected_for_practise,
        "recommended_stage_label": get_recommended_stage_label(learner),
    }
    profile_obj = request.user.profile
    if profile_obj.is_parent():
        parent_profile = profile_obj.parent_profile
        context["on_trial"] = parent_profile.on_trial()
        context["trial_days_left"] = parent_profile.trial_days_left()
        context["is_subscribed"] = parent_profile.is_subscribed

    html = render_to_string("profile/_learner_detail.html", context, request=request)
    return JsonResponse(
        {
            "html": html,
            "learner_id": learner.id,
            "learner_uuid": str(learner.learner_uuid),
        }
    )


@login_required
@block_read_only
def edit_learner(request, learner_uuid):
    """Renders profile/edit_learner.html — edit a learner's details.

    A 'remove' POST action redirects to the confirm-delete flow instead.
    School-assigned learners belonging to a parent cannot be edited here.
    Respects role-based delete permissions when determining if the delete
    button should be shown.
    """

    learner = get_object_or_404(Learner, learner_uuid=learner_uuid, deleted=False)

    if request.user.profile.is_parent() and learner.school_id:
        return redirect("profile")

    if request.method == "POST":
        if "remove" in request.POST:
            return redirect("confirm_delete_learner", learner_uuid=learner.learner_uuid)

        form = LearnerForm(
            request.POST,
            instance=learner,
            user=request.user,
            request=request,
        )
        if form.is_valid():
            form.save()
            return redirect("profile")
    else:
        form = LearnerForm(instance=learner, user=request.user, request=request)

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
        "learner": _decorate_learner_avatar(learner),
        "can_delete": can_delete,
    }
    return render(request, "profile/edit_learner.html", context)


@login_required
def confirm_delete_learner(request, learner_uuid):
    """Renders profile/confirm_delete_learner.html — password-confirmed learner deletion.

    Requires the user to re-enter their password before the learner is soft-deleted.
    Also soft-deletes related log entries. Clears the selected learner from the session
    and redirects to the profile page on success.
    """

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
        confirmation = (request.POST.get("confirmation") or "").strip()

        if confirmation == "DELETE":
            learner.deleted = True
            learner.save()

            LogEntry.objects.filter(learner=learner, deleted=False).update(deleted=True)

            del request.session["selected_learner_id"]
            request.session.pop("selected_group_id", None)
            return redirect("profile")

        error_message = "Please type DELETE to confirm deletion. It is case-sensitive."
        return render(
            request,
            "profile/confirm_delete_learner.html",
            {
                "learner": learner,
                "error_message": error_message,
            },
        )

    return render(
        request,
        "profile/confirm_delete_learner.html",
        {"learner": learner},
    )
