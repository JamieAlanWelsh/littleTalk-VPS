from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render

from littleTalkApp.decorators import block_read_only
from littleTalkApp.forms import CohortForm
from littleTalkApp.models import Cohort, Learner
from littleTalkApp.views_modules.profile import _get_avatar_image_url


def _get_school_for_request(request):
    if request.user.profile.is_parent():
        return None
    return request.user.profile.get_current_school(request)


def _can_edit_cohorts(request, school):
    return request.user.profile.is_admin_for_school(school) or request.user.profile.is_manager_for_school(school)


def _avatar_payload(learner):
    return {
        "id": learner.id,
        "name": learner.name,
        "avatar_color": learner.avatar_color,
        "avatar_image_url": _get_avatar_image_url(learner.avatar_character),
    }


@login_required
@block_read_only
def profile_cohort_create(request):
    school = _get_school_for_request(request)
    if school is None or not _can_edit_cohorts(request, school):
        return redirect("profile")

    if request.method == "POST":
        form = CohortForm(request.POST)
        if form.is_valid():
            cohort = form.save(commit=False)
            cohort.school = school
            cohort.save()
            return redirect("profile")
    else:
        form = CohortForm()

    return render(
        request,
        "profile/cohort_form.html",
        {"form": form, "is_editing": False},
    )


@login_required
@block_read_only
def profile_cohort_edit(request, cohort_id):
    school = _get_school_for_request(request)
    if school is None or not _can_edit_cohorts(request, school):
        return redirect("profile")

    cohort = get_object_or_404(Cohort, id=cohort_id, school=school)

    if request.method == "POST":
        form = CohortForm(request.POST, instance=cohort)
        if form.is_valid():
            form.save()
            return redirect("profile")
    else:
        form = CohortForm(instance=cohort)

    return render(
        request,
        "profile/cohort_form.html",
        {"form": form, "is_editing": True, "cohort": cohort},
    )


@login_required
@block_read_only
def profile_cohort_delete(request, cohort_id):
    school = _get_school_for_request(request)
    if school is None or not _can_edit_cohorts(request, school):
        return redirect("profile")

    cohort = get_object_or_404(Cohort, id=cohort_id, school=school)

    if request.method == "POST":
        confirmation = (request.POST.get("confirmation") or "").strip()

        if confirmation == "DELETE":
            cohort.delete()
            return redirect("profile")

        error_message = "Please type DELETE to confirm deletion. It is case-sensitive."
        return render(
            request,
            "profile/cohort_confirm_delete.html",
            {"cohort": cohort, "error_message": error_message},
        )

    return render(
        request,
        "profile/cohort_confirm_delete.html",
        {"cohort": cohort},
    )


@login_required
@block_read_only(api=True)
def profile_cohort_add_learner(request, cohort_id):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    school = _get_school_for_request(request)
    if school is None or not _can_edit_cohorts(request, school):
        return JsonResponse({"error": "Forbidden."}, status=403)

    cohort = get_object_or_404(Cohort, id=cohort_id, school=school)

    learner_id = request.POST.get("learner_id")
    if not learner_id:
        return JsonResponse({"error": "Missing learner_id."}, status=400)

    learner = get_object_or_404(Learner, id=learner_id, school=school, deleted=False)
    learner.cohort = cohort
    learner.save(update_fields=["cohort"])

    return JsonResponse({"ok": True, "learner": _avatar_payload(learner)})


@login_required
@block_read_only(api=True)
def profile_cohort_remove_learner(request, cohort_id):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    school = _get_school_for_request(request)
    if school is None or not _can_edit_cohorts(request, school):
        return JsonResponse({"error": "Forbidden."}, status=403)

    cohort = get_object_or_404(Cohort, id=cohort_id, school=school)

    learner_id = request.POST.get("learner_id")
    if not learner_id:
        return JsonResponse({"error": "Missing learner_id."}, status=400)

    learner = get_object_or_404(Learner, id=learner_id, school=school, deleted=False)
    if learner.cohort_id != cohort.id:
        return JsonResponse({"error": "Learner is not in this cohort."}, status=400)

    learner.cohort = None
    learner.save(update_fields=["cohort"])

    return JsonResponse({"ok": True, "learner": _avatar_payload(learner)})
