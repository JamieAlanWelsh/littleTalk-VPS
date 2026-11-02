from collections import defaultdict
from datetime import timedelta

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import models
from django.db.models import Avg, Count, DurationField, ExpressionWrapper, F, FloatField, Sum
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone

from littleTalkApp.content import GAME_DESCRIPTIONS
from littleTalkApp.models import Cohort, ExerciseSession, Learner, Target
from littleTalkApp.views_modules.practise import (
    CANONICAL_TO_PRACTISE_KEY,
    PRACTISE_STAGES,
)
from littleTalkApp.views_modules.assessment import get_screener_comparison_data


def _build_dashboard_exercise_groups(exercise_counts):
    groups = []

    for stage_number in sorted(PRACTISE_STAGES.keys()):
        stage_data = PRACTISE_STAGES[stage_number]
        stage_exercises = []

        for practise_key in stage_data.get("exercises", []):
            matching_slug = next(
                (
                    slug
                    for slug, mapped_key in CANONICAL_TO_PRACTISE_KEY.items()
                    if mapped_key == practise_key
                ),
                None,
            )
            if not matching_slug:
                continue

            title = GAME_DESCRIPTIONS.get(practise_key, {}).get("title", matching_slug)
            stage_exercises.append(
                {
                    "id": matching_slug,
                    "name": title,
                    "count": exercise_counts.get(matching_slug, 0),
                }
            )

        groups.append(
            {
                "id": f"stage-{stage_number}",
                "label": stage_data.get("label", f"Stage {stage_number}"),
                "exercises": stage_exercises,
            }
        )

    return groups


def _format_elapsed_time(duration):
    total_seconds = int(max(duration.total_seconds(), 0))
    minutes, seconds = divmod(total_seconds, 60)
    return f"{minutes}m {seconds:02d}s"


def _build_recent_sessions(selected_learner):
    if not selected_learner:
        return []

    recent_sessions = (
        ExerciseSession.objects.filter(learner=selected_learner)
        .order_by("-completed_at")[:5]
    )

    rows = []
    for session in recent_sessions:
        practise_key = CANONICAL_TO_PRACTISE_KEY.get(session.exercise_id)
        exercise_name = GAME_DESCRIPTIONS.get(practise_key, {}).get(
            "title",
            session.exercise_id,
        )

        if session.total_questions > 0:
            correct = session.total_questions - session.incorrect_answers
            accuracy_display = f"{round((correct / session.total_questions) * 100, 1)}%"
        else:
            accuracy_display = "-"

        elapsed_display = "-"
        if session.started_at and session.completed_at:
            elapsed_display = _format_elapsed_time(session.completed_at - session.started_at)

        rows.append(
            {
                "exercise_name": exercise_name,
                "difficulty_selected": session.difficulty_label
                or session.difficulty_selected
                or "-",
                "accuracy": accuracy_display,
                "time_elapsed": elapsed_display,
                "session_time": session.completed_at,
            }
        )

    return rows


@login_required
def learner_dashboard(request):
    """Renders dashboard/learner_dashboard.html — the main staff-facing learner overview.

    Displays exercise session counts, target progress, and screener comparison data for
    the currently selected learner at the user's school. Not accessible to parent accounts.
    """

    profile = request.user.profile

    if profile.is_parent():
        messages.info(request, "Dashboard access is not available for parent accounts.")
        return redirect("profile")

    # Multi-school users can switch the school they're viewing via a ?school= param.
    school_param = request.GET.get("school")
    if school_param:
        try:
            profile.select_school(int(school_param), request)
        except (TypeError, ValueError):
            pass

    user_school = profile.get_current_school(request)
    if not user_school:
        messages.error(request, "No school assigned to your profile.")
        return redirect("profile")

    accessible_learners = Learner.objects.filter(school=user_school, deleted=False)
    cohorts = Cohort.objects.filter(school=user_school).distinct()

    selected_cohort_id = request.GET.get("cohort")
    if selected_cohort_id and not profile.is_parent():
        try:
            accessible_learners = accessible_learners.filter(cohort__id=int(selected_cohort_id))
        except ValueError:
            pass

    accessible_learners = accessible_learners.annotate(session_count=Count("exercise_sessions")).order_by("name")

    learner_uuid = request.GET.get("learner")
    selected_learner = None

    if learner_uuid:
        try:
            selected_learner = accessible_learners.get(learner_uuid=learner_uuid)
        except Learner.DoesNotExist:
            messages.error(request, "Learner not found or access denied.")

    if not selected_learner:
        selected_learner_id = request.session.get("selected_learner_id")
        if selected_learner_id:
            try:
                selected_learner = accessible_learners.get(id=selected_learner_id)
            except Learner.DoesNotExist:
                pass

    # Auto-select a learner (e.g. on first load or after switching school) so the
    # dashboard doesn't show the "select a learner" prompt unnecessarily.
    if not selected_learner:
        selected_learner = accessible_learners.first()

    if selected_learner:
        request.session["selected_learner_id"] = selected_learner.id

    exercise_counts = {}
    if selected_learner:
        exercise_count_qs = ExerciseSession.objects.filter(learner=selected_learner).values(
            "exercise_id"
        ).annotate(count=Count("id"))
        exercise_counts = {item["exercise_id"]: item["count"] for item in exercise_count_qs}

        total_count = ExerciseSession.objects.filter(learner=selected_learner).count()
        exercise_counts["all"] = total_count

    exercise_groups = _build_dashboard_exercise_groups(exercise_counts)

    targets_data = None
    if selected_learner:
        targets = Target.objects.filter(learner=selected_learner).order_by("-created_at")

        total_targets = targets.count()
        achieved_targets = targets.filter(status=Target.Status.ACHIEVED).count()
        targets_percentage = round((achieved_targets / total_targets * 100)) if total_targets > 0 else 0

        targets_data = {
            "all": list(targets),
            "achieved": list(targets.filter(status=Target.Status.ACHIEVED)),
            "not_achieved": list(targets.filter(status=Target.Status.NOT_ACHIEVED)),
            "ongoing": list(targets.filter(status=Target.Status.ONGOING)),
            "not_set": list(targets.filter(status=Target.Status.NOT_SET)),
            "total_count": total_targets,
            "achieved_count": achieved_targets,
            "percentage": targets_percentage,
        }

    screener_data = None
    if selected_learner:
        comparison_data = get_screener_comparison_data(selected_learner, screener_version=2)

        latest_session = (
            selected_learner.answers.filter(screener_version=2)
            .order_by("-timestamp")
            .values("session_id")
            .first()
        )
        current_strong_skills = []
        current_support_skills = []

        if latest_session:
            answers = selected_learner.answers.filter(session_id=latest_session["session_id"])
            skill_answers = defaultdict(list)
            for answer in answers:
                skill_answers[answer.skill].append(answer.answer)

            for skill, responses in skill_answers.items():
                if "No" in responses:
                    current_support_skills.append(skill)
                else:
                    current_strong_skills.append(skill)

        skills_gained_count = 0
        first_screener_date = None

        if comparison_data and comparison_data["has_previous"]:
            skills_gained_count = len(comparison_data["skills_gained"])

            first_session = (
                selected_learner.answers.filter(screener_version=2)
                .order_by("timestamp")
                .values("assessment_date")
                .first()
            )
            if first_session:
                first_screener_date = first_session["assessment_date"]

        screener_data = {
            "comparison": comparison_data,
            "current_strong_skills": current_strong_skills,
            "current_support_skills": current_support_skills,
            "skills_gained_count": skills_gained_count,
            "first_screener_date": first_screener_date,
            "has_screener_data": latest_session is not None,
        }

    recent_sessions = _build_recent_sessions(selected_learner)

    # Only offer schools that have at least one active learner to switch to.
    switcher_schools = list(
        profile.get_licensed_schools()
        .filter(learners__deleted=False)
        .distinct()
        .order_by("name")
    )

    context = {
        "learners": accessible_learners,
        "selected_learner": selected_learner,
        "cohorts": cohorts,
        "selected_cohort": int(selected_cohort_id) if selected_cohort_id and selected_cohort_id.isdigit() else None,
        "exercise_groups": exercise_groups,
        "total_sessions": exercise_counts.get("all", 0),
        "targets_data": targets_data,
        "screener_data": screener_data,
        "recent_sessions": recent_sessions,
        "schools": switcher_schools,
        "selected_school": user_school,
        "show_school_switcher": len(switcher_schools) > 1,
    }

    return render(request, "dashboard/learner_dashboard.html", context)


@login_required
def learner_progress_data(request):
    """JSON API: returns time-series progress data for a given learner.

    Accepts query params: learner_uuid, date_range (days or 'all'), exercise_id,
    and a comma-separated metrics list (exp, exercises, accuracy, difficulty, time_elapsed).
    Used to populate the progress chart on the learner dashboard.
    """

    profile = request.user.profile
    learner_uuid = request.GET.get("learner_uuid")

    if not learner_uuid:
        return JsonResponse({"error": "learner_uuid is required"}, status=400)

    try:
        if profile.is_parent():
            learner = profile.parent_profile.learners.get(learner_uuid=learner_uuid, deleted=False)
        else:
            user_school = profile.get_current_school(request)
            if not user_school:
                return JsonResponse({"error": "No school assigned"}, status=403)
            learner = Learner.objects.get(learner_uuid=learner_uuid, school=user_school, deleted=False)
    except Learner.DoesNotExist:
        return JsonResponse({"error": "Learner not found or access denied"}, status=404)

    date_range = request.GET.get("date_range", "30")
    date_end = timezone.now().date()

    if date_range == "all":
        earliest_session = ExerciseSession.objects.filter(learner=learner).order_by("created_at").first()
        if earliest_session:
            date_start = earliest_session.created_at.date()
        else:
            date_start = date_end
    else:
        try:
            days = int(date_range)
        except ValueError:
            days = 30
        date_start = date_end - timedelta(days=days)

    exercise_id = request.GET.get("exercise_id")
    metrics_param = request.GET.get("metrics", "exp")
    metrics = [metric.strip() for metric in metrics_param.split(",") if metric.strip()]
    if not metrics:
        metrics = ["exp"]

    sessions = ExerciseSession.objects.filter(
        learner=learner,
        created_at__date__gte=date_start,
        created_at__date__lte=date_end,
    ).annotate(
        time_elapsed=ExpressionWrapper(
            models.F("completed_at") - models.F("started_at"),
            output_field=DurationField(),
        )
    ).order_by("completed_at")

    if exercise_id and exercise_id != "all":
        sessions = sessions.filter(exercise_id=exercise_id)

    prior_sessions = ExerciseSession.objects.filter(learner=learner, created_at__date__lt=date_start)
    if exercise_id and exercise_id != "all":
        prior_sessions = prior_sessions.filter(exercise_id=exercise_id)

    prior_count = prior_sessions.count()

    dates = []
    metrics_data = {metric: [] for metric in metrics}
    difficulty_labels = []

    cumulative_exp = prior_count * 10
    cumulative_exercises = prior_count

    for session in sessions:
        dates.append(session.completed_at.strftime("%Y-%m-%d %H:%M"))

        for metric in metrics:
            if metric == "exp":
                cumulative_exp += 10
                metrics_data[metric].append(cumulative_exp)
            elif metric == "exercises":
                cumulative_exercises += 1
                metrics_data[metric].append(cumulative_exercises)
            elif metric == "accuracy":
                if session.total_questions > 0:
                    correct = session.total_questions - session.incorrect_answers
                    accuracy = (correct / session.total_questions) * 100
                    metrics_data[metric].append(round(accuracy, 1))
                else:
                    metrics_data[metric].append(None)
            elif metric == "difficulty":
                try:
                    difficulty = float(session.difficulty_selected)
                    metrics_data[metric].append(round(difficulty, 2))
                except (ValueError, TypeError):
                    metrics_data[metric].append(None)
            elif metric == "time_elapsed":
                if session.time_elapsed is None:
                    metrics_data[metric].append(None)
                else:
                    elapsed_minutes = session.time_elapsed.total_seconds() / 60
                    metrics_data[metric].append(round(max(elapsed_minutes, 0), 1))

        difficulty_labels.append(session.difficulty_label or "")

    metrics_data_response = [
        (
            {
                "metric": metric,
                "values": metrics_data[metric],
                "labels": difficulty_labels,
            }
            if metric == "difficulty"
            else {
                "metric": metric,
                "values": metrics_data[metric],
            }
        )
        for metric in metrics
    ]

    response_data = {
        "dates": dates,
        "metrics_data": metrics_data_response,
        "learner_name": learner.name,
        "exercise_id": exercise_id or "all",
        "date_start": date_start.strftime("%Y-%m-%d"),
        "date_end": date_end.strftime("%Y-%m-%d"),
    }

    return JsonResponse(response_data)


@login_required
def progress_hub(request):
    """Entry point for the Progress nav item. Trust leads (admins/managers with
    multiple licensed schools) choose between multi-school and individual-school
    reporting; everyone else goes straight to the learner dashboard.
    """
    profile = request.user.profile
    if profile.is_parent():
        return redirect("profile")
    if profile.can_view_multischool_dashboard():
        return render(request, "dashboard/progress_hub.html")
    return redirect("learner_dashboard")


# =============================================================================
# Multi-school (cross-school) dashboard
# =============================================================================


def _multischool_parse_date_range(request):
    date_end = timezone.now().date()
    date_range = request.GET.get("date_range", "all")
    if date_range == "all":
        return None, date_end
    try:
        days = int(date_range)
    except (TypeError, ValueError):
        days = 30
    return date_end - timedelta(days=days), date_end


def _multischool_sessions_for_learners(learner_ids, date_start, date_end):
    sessions = ExerciseSession.objects.filter(learner_id__in=learner_ids)
    if date_start is not None:
        sessions = sessions.filter(created_at__date__gte=date_start)
    sessions = sessions.filter(created_at__date__lte=date_end)
    return sessions


def _multischool_avg_accuracy(sessions):
    result = (
        sessions.filter(total_questions__gt=0)
        .annotate(
            accuracy=ExpressionWrapper(
                (F("total_questions") - F("incorrect_answers")) * 100.0 / F("total_questions"),
                output_field=FloatField(),
            )
        )
        .aggregate(avg=Avg("accuracy"))
    )
    value = result.get("avg")
    return round(value, 1) if value is not None else None


def _multischool_skills_gained_total(learner_ids):
    total = 0
    for learner in Learner.objects.filter(id__in=learner_ids):
        comparison = get_screener_comparison_data(learner, screener_version=2)
        if comparison and comparison.get("has_previous"):
            total += len(comparison.get("skills_gained", []))
    return total


def _build_multischool_school_summary(school, date_start, date_end):
    """Build an aggregated summary row for a single school."""
    learner_ids = list(
        Learner.objects.filter(school=school, deleted=False).values_list("id", flat=True)
    )
    active_learners = len(learner_ids)
    sessions = _multischool_sessions_for_learners(learner_ids, date_start, date_end)
    session_count = sessions.count()
    total_xp = (
        Learner.objects.filter(id__in=learner_ids).aggregate(total=Sum("exp"))["total"] or 0
    )

    avg_accuracy = None
    targets_percentage = None
    skills_gained = None
    if learner_ids:
        avg_accuracy = _multischool_avg_accuracy(sessions)

        targets = Target.objects.filter(learner_id__in=learner_ids)
        total_targets = targets.count()
        achieved_targets = targets.filter(status=Target.Status.ACHIEVED).count()
        targets_percentage = (
            round(achieved_targets / total_targets * 100) if total_targets > 0 else 0
        )

        skills_gained = _multischool_skills_gained_total(learner_ids)

    return {
        "school_id": school.id,
        "school_name": school.name,
        "active_learners": active_learners,
        "session_count": session_count,
        "total_xp": total_xp,
        "avg_accuracy": avg_accuracy,
        "targets_percentage": targets_percentage,
        "skills_gained": skills_gained,
    }


@login_required
def multischool_dashboard(request):
    """Renders dashboard/multischool_dashboard.html — the cross-school (multi-school) overview
    for trust leads. Aggregates progress across the licensed schools the profile can
    access, showing school-level roll-ups only (no individual pupil data).
    """

    profile = request.user.profile

    if not profile.can_view_multischool_dashboard():
        messages.error(request, "The cross-school dashboard is not available for your account.")
        return redirect("profile")

    date_start, date_end = _multischool_parse_date_range(request)

    schools = list(profile.get_licensed_schools().order_by("name"))
    school_rows = [
        _build_multischool_school_summary(school, date_start, date_end) for school in schools
    ]

    totals = {
        "school_count": len(school_rows),
        "active_learners": sum(row["active_learners"] for row in school_rows),
        "session_count": sum(row["session_count"] for row in school_rows),
        "total_xp": sum(row["total_xp"] for row in school_rows),
        "skills_gained": sum(row["skills_gained"] or 0 for row in school_rows),
    }

    reported_targets = [
        row["targets_percentage"]
        for row in school_rows
        if row["targets_percentage"] is not None
    ]
    totals["avg_targets_percentage"] = (
        round(sum(reported_targets) / len(reported_targets)) if reported_targets else None
    )

    context = {
        "school_rows": school_rows,
        "totals": totals,
        "schools": schools,
        "selected_date_range": request.GET.get("date_range", "all"),
    }
    return render(request, "dashboard/multischool_dashboard.html", context)


@login_required
def multischool_progress_data(request):
    """JSON API: per-school daily trend series for the multi-school dashboard chart.

    Query params: date_range (days or 'all'), metric (sessions | accuracy | difficulty),
    school (optional school id to restrict the trend to a single school).
    Returns one series per licensed school.
    """

    profile = request.user.profile
    if not profile.can_view_multischool_dashboard():
        return JsonResponse({"error": "Access denied"}, status=403)

    metric = request.GET.get("metric", "sessions")
    if metric not in {"sessions", "accuracy", "difficulty"}:
        metric = "sessions"

    date_start, date_end = _multischool_parse_date_range(request)
    schools = list(profile.get_licensed_schools().order_by("name"))

    # Optional single-school filter for a quick snapshot of one school.
    school_param = request.GET.get("school")
    if school_param:
        try:
            school_id = int(school_param)
            schools = [school for school in schools if school.id == school_id]
        except (TypeError, ValueError):
            pass

    # Establish the date axis. For 'all', derive from the earliest session across schools.
    if date_start is None:
        all_learner_ids = list(
            Learner.objects.filter(school__in=schools, deleted=False).values_list("id", flat=True)
        )
        earliest = (
            ExerciseSession.objects.filter(learner_id__in=all_learner_ids)
            .order_by("created_at")
            .values_list("created_at", flat=True)
            .first()
        )
        date_start = earliest.date() if earliest else date_end

    date_axis = []
    cursor = date_start
    while cursor <= date_end:
        date_axis.append(cursor)
        cursor += timedelta(days=1)
    date_labels = [d.strftime("%Y-%m-%d") for d in date_axis]
    date_index = {d: i for i, d in enumerate(date_axis)}

    series = []
    for school in schools:
        learner_ids = list(
            Learner.objects.filter(school=school, deleted=False).values_list("id", flat=True)
        )

        sessions = _multischool_sessions_for_learners(learner_ids, date_start, date_end).order_by(
            "completed_at"
        )

        if metric == "sessions":
            values = [0 for _ in date_axis]
            for session in sessions:
                idx = date_index.get(session.completed_at.date())
                if idx is not None:
                    values[idx] += 1
        else:
            buckets = {i: [] for i in range(len(date_axis))}
            for session in sessions:
                idx = date_index.get(session.completed_at.date())
                if idx is None:
                    continue
                if metric == "accuracy":
                    if session.total_questions > 0:
                        correct = session.total_questions - session.incorrect_answers
                        buckets[idx].append((correct / session.total_questions) * 100)
                else:
                    try:
                        buckets[idx].append(float(session.difficulty_selected))
                    except (TypeError, ValueError):
                        continue
            values = [
                round(sum(vals) / len(vals), 1) if vals else None
                for idx, vals in buckets.items()
            ]

        series.append({"school_name": school.name, "values": values})

    return JsonResponse(
        {
            "metric": metric,
            "dates": date_labels,
            "series": series,
            "date_start": date_start.strftime("%Y-%m-%d"),
            "date_end": date_end.strftime("%Y-%m-%d"),
        }
    )

