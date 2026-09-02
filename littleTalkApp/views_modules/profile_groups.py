from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render

from littleTalkApp.decorators import block_read_only
from littleTalkApp.forms import InterventionGroupForm
from littleTalkApp.models import InterventionGroup, Learner
from littleTalkApp.views_modules.profile import _get_avatar_image_url


def _get_school_for_request(request):
    profile = request.user.profile
    return profile.get_current_school(request)


def _can_edit_groups(profile, school):
    if not school:
        return False
    return (
        profile.is_admin_for_school(school)
        or profile.is_manager_for_school(school)
        or profile.is_staff_for_school(school)
    )


def _avatar_payload(learner):
    return {
        "id": learner.id,
        "name": learner.name,
        "avatar_color": learner.avatar_color,
        "avatar_image_url": _get_avatar_image_url(learner.avatar_character),
    }


@login_required
def profile_group_select(request):
    if request.method != "POST":
        return redirect("profile")

    group_id = request.POST.get("group_id")
    if not group_id:
        messages.error(request, "Please choose a group.")
        return redirect("profile")

    school = _get_school_for_request(request)
    if not school:
        messages.error(request, "No school assigned to your profile.")
        return redirect("profile")

    group = get_object_or_404(InterventionGroup, id=group_id, school=school)
    selected_learner = group.learners.filter(deleted=False).order_by("id").first()

    if not selected_learner:
        messages.error(request, "This group does not have any learners yet.")
        return redirect("profile")

    request.session["selected_group_id"] = group.id
    request.session["selected_learner_id"] = selected_learner.id
    request.session["animate_profile_context_bar"] = True
    return redirect("profile")


@login_required
@block_read_only
def profile_group_create(request):
    school = _get_school_for_request(request)
    if not school or not _can_edit_groups(request.user.profile, school):
        messages.error(request, "You do not have permission to manage intervention groups.")
        return redirect("profile")

    if request.method == "POST":
        form = InterventionGroupForm(request.POST)
        if form.is_valid():
            group = form.save(commit=False)
            group.school = school
            group.save()
            return redirect("profile")
    else:
        form = InterventionGroupForm()

    return render(request, "profile/profile_group_form.html", {"form": form, "school": school, "mode": "create"})


@login_required
@block_read_only
def profile_group_edit(request, group_id):
    school = _get_school_for_request(request)
    group = get_object_or_404(InterventionGroup, id=group_id, school=school)

    if not school or not _can_edit_groups(request.user.profile, school):
        messages.error(request, "You do not have permission to manage intervention groups.")
        return redirect("profile")

    if request.method == "POST":
        form = InterventionGroupForm(request.POST, instance=group)
        if form.is_valid():
            form.save()
            return redirect("profile")
    else:
        form = InterventionGroupForm(instance=group)

    return render(request, "profile/profile_group_form.html", {"form": form, "school": school, "group": group, "mode": "edit"})


@login_required
@block_read_only
def profile_group_delete(request, group_id):
    school = _get_school_for_request(request)
    group = get_object_or_404(InterventionGroup, id=group_id, school=school)

    if not school or not _can_edit_groups(request.user.profile, school):
        messages.error(request, "You do not have permission to manage intervention groups.")
        return redirect("profile")

    if request.method == "POST":
        confirmation = (request.POST.get("confirmation") or "").strip()

        if confirmation == "DELETE":
            group.delete()
            if request.session.get("selected_group_id") == group_id:
                request.session.pop("selected_group_id", None)
            return redirect("profile")

        error_message = "Please type DELETE to confirm deletion. It is case-sensitive."
        return render(
            request,
            "profile/profile_group_confirm_delete.html",
            {"group": group, "error_message": error_message},
        )

    return render(request, "profile/profile_group_confirm_delete.html", {"group": group})


@login_required
@block_read_only
def profile_group_add_learner(request, group_id):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    school = _get_school_for_request(request)
    group = get_object_or_404(InterventionGroup, id=group_id, school=school)
    if not _can_edit_groups(request.user.profile, school):
        return JsonResponse({"error": "Permission denied"}, status=403)

    learner_id = request.POST.get("learner_id")
    learner = get_object_or_404(Learner, id=learner_id, school=school, deleted=False)
    group.learners.add(learner)
    return JsonResponse({"ok": True, "learner": _avatar_payload(learner)})


@login_required
@block_read_only
def profile_group_remove_learner(request, group_id):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    school = _get_school_for_request(request)
    group = get_object_or_404(InterventionGroup, id=group_id, school=school)
    if not _can_edit_groups(request.user.profile, school):
        return JsonResponse({"error": "Permission denied"}, status=403)

    learner_id = request.POST.get("learner_id")
    learner = get_object_or_404(Learner, id=learner_id, school=school, deleted=False)
    group.learners.remove(learner)
    return JsonResponse({"ok": True, "learner": _avatar_payload(learner)})