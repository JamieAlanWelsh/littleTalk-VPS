from collections import defaultdict
from datetime import timedelta

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import models
from django.db.models import Count, DurationField, ExpressionWrapper
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone

from littleTalkApp.models import Cohort, ExerciseSession, Learner
from littleTalkApp.views_modules.assessment import get_screener_comparison_data


@login_required
def learner_dashboard(request):
    profile = request.user.profile

    if profile.is_parent():
        messages.info(request, "Dashboard access is not available for parent accounts.")
        return redirect("profile")

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

    if not selected_learner and accessible_learners.exists():
        selected_learner = accessible_learners.first()

    exercise_counts = {}
    if selected_learner:
        exercise_count_qs = ExerciseSession.objects.filter(learner=selected_learner).values(
            "exercise_id"
        ).annotate(count=Count("id"))
        exercise_counts = {item["exercise_id"]: item["count"] for item in exercise_count_qs}

        total_count = ExerciseSession.objects.filter(learner=selected_learner).count()
        exercise_counts["all"] = total_count

    exercise_choices = [
        {"id": "Colourful Semantics", "name": "Colourful Semantics", "count": exercise_counts.get("Colourful Semantics", 0)},
        {"id": "Think and Find", "name": "Think and Find", "count": exercise_counts.get("Think and Find", 0)},
        {"id": "Concept Quest", "name": "Concept Quest", "count": exercise_counts.get("Concept Quest", 0)},
        {"id": "Categorisation", "name": "Categorisation", "count": exercise_counts.get("Categorisation", 0)},
        {"id": "Story Train", "name": "Story Train", "count": exercise_counts.get("Story Train", 0)},
    ]

    targets_data = None
    if selected_learner:
        from littleTalkApp.models import Target

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
        comparison_data = get_screener_comparison_data(selected_learner)

        latest_session = selected_learner.answers.order_by("-timestamp").values("session_id").first()
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

            first_session = selected_learner.answers.order_by("timestamp").values("assessment_date").first()
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

    context = {
        "learners": accessible_learners,
        "selected_learner": selected_learner,
        "cohorts": cohorts,
        "selected_cohort": int(selected_cohort_id) if selected_cohort_id and selected_cohort_id.isdigit() else None,
        "exercise_choices": exercise_choices,
        "total_sessions": exercise_counts.get("all", 0),
        "targets_data": targets_data,
        "screener_data": screener_data,
    }

    return render(request, "dashboard/learner_dashboard.html", context)


@login_required
def learner_progress_data(request):
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

    metrics_data_response = [
        {
            "metric": metric,
            "values": metrics_data[metric],
        }
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
