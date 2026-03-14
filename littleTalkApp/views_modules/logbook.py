from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render

from littleTalkApp.forms import LogEntryForm
from littleTalkApp.models import Cohort, Learner, LogEntry, Role
from littleTalkApp.utilites import can_edit_or_delete_log


@login_required
def logbook(request):
    """Renders logbook/logbook.html — the main log entry list page.

    Admins and managers see all school log entries; other staff see only their own.
    Results can be filtered by learner or cohort via GET params.
    """

    selected_learner_id = request.GET.get("learner")
    selected_cohort_id = request.GET.get("cohort")
    user = request.user
    school = user.profile.get_current_school(request)
    if school:
        learners = Learner.objects.filter(school=school, deleted=False)
        cohorts = Cohort.objects.filter(school=school)

        if user.profile.is_admin_for_school(school) or user.profile.is_manager_for_school(school):
            log_entries = LogEntry.objects.filter(school=school, deleted=False)
        else:
            log_entries = LogEntry.objects.filter(school=school, user=user, deleted=False)
    else:
        learners = None
        cohorts = None
        log_entries = LogEntry.objects.filter(user=user, deleted=False)

    selected_learner = None

    if selected_cohort_id:
        learners = learners.filter(cohort__id=selected_cohort_id)

    if selected_learner_id:
        log_entries = log_entries.filter(learner__id=selected_learner_id)
        try:
            selected_learner = Learner.objects.get(id=selected_learner_id)
        except Learner.DoesNotExist:
            selected_learner = None
    elif selected_cohort_id:
        log_entries = log_entries.filter(learner__cohort__id=selected_cohort_id)

    log_entries = log_entries.order_by("-timestamp")

    return render(
        request,
        "logbook/logbook.html",
        {
            "log_entries": log_entries,
            "learners": learners,
            "cohorts": cohorts,
            "selected_learner_id": selected_learner_id,
            "selected_cohort_id": selected_cohort_id,
            "selected_learner": selected_learner,
        },
    )


@login_required
def new_log_entry(request):
    """Renders logbook/new_log_entry.html — form to create a new log entry.

    On POST, validates and saves the entry, attaching the current user's school
    and role. Pre-populates the learner field from the session if one is selected.
    """

    selected_learner_id = request.session.get("selected_learner_id")

    if request.method == "POST":
        form = LogEntryForm(request.POST, user=request.user, request=request)
        if form.is_valid():
            log_entry = form.save(commit=False)
            log_entry.user = request.user

            try:
                profile = request.user.profile

                if not profile.is_parent():
                    school_ctx = (
                        profile.get_current_school(request)
                        if hasattr(profile, "get_current_school")
                        else None
                    )
                    log_entry.school = school_ctx
                    role_for = profile.get_role_for_school(school_ctx)
                else:
                    log_entry.school = None
                    role_for = Role.PARENT

                log_entry.created_by_role = role_for
            except Exception:
                log_entry.created_by_role = request.user.profile.role

            log_entry.save()
            return redirect("logbook")
    else:
        initial = {}
        if selected_learner_id:
            initial["learner"] = selected_learner_id
        form = LogEntryForm(user=request.user, request=request, initial=initial)

    return render(request, "logbook/new_log_entry.html", {"form": form})


@login_required
@login_required
def log_entry_detail(request, entry_id):
    """Renders logbook/log_entry_detail.html — the detail view for a single log entry.

    Redirects to the logbook list if the user does not have edit/delete permissions
    for this entry.
    """

    log_entry = get_object_or_404(LogEntry, id=entry_id, deleted=False)

    if not can_edit_or_delete_log(request.user, log_entry):
        return redirect("logbook")

    return render(request, "logbook/log_entry_detail.html", {"log_entry": log_entry})


@login_required
def edit_log_entry(request, entry_id):
    """Renders logbook/new_log_entry.html (in edit mode) — edit an existing log entry.

    Only the original author or an admin/manager may edit an entry. On successful
    POST the user is redirected back to the log entry detail page.
    """

    log_entry = get_object_or_404(LogEntry, id=entry_id, deleted=False)

    if not can_edit_or_delete_log(request.user, log_entry):
        return redirect("logbook")

    if request.method == "POST":
        form = LogEntryForm(
            request.POST, instance=log_entry, user=request.user, request=request
        )
        if form.is_valid():
            form.save()
            return redirect("log_entry_detail", entry_id=log_entry.id)
    else:
        form = LogEntryForm(instance=log_entry, user=request.user, request=request)

    return render(
        request,
        "logbook/new_log_entry.html",
        {"form": form, "is_editing": True, "log_entry": log_entry},
    )


@login_required
def delete_log_entry(request, entry_id):
    """JSON API (POST): soft-deletes a log entry by setting its deleted flag.

    Returns JSON {success: true} on success or an error payload if the method
    is wrong or the user is unauthorised.
    """

    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Invalid method"}, status=405)

    log_entry = get_object_or_404(LogEntry, id=entry_id, deleted=False)

    if not can_edit_or_delete_log(request.user, log_entry):
        return JsonResponse({"success": False, "error": "Unauthorized"}, status=403)

    log_entry.deleted = True
    log_entry.save()
    return JsonResponse({"success": True})


@login_required
def generate_summary(request, learner_uuid):
    """Renders logbook/log_summary.html — a printable summary of log entries for a learner.

    Admins and managers see all entries for the learner; other staff see only their
    own entries. Scoped to the user's current school.
    """

    school = request.user.profile.get_current_school(request)
    learner = get_object_or_404(Learner, learner_uuid=learner_uuid, school=school)

    if request.user.profile.is_admin_for_school(school) or request.user.profile.is_manager_for_school(school):
        log_entries = LogEntry.objects.filter(learner=learner, deleted=False).order_by(
            "timestamp"
        )
    else:
        log_entries = LogEntry.objects.filter(
            user=request.user, learner=learner, deleted=False
        ).order_by("timestamp")

    return render(
        request,
        "logbook/log_summary.html",
        {"learner": learner, "log_entries": log_entries},
    )
