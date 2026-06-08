import json
import uuid
from collections import defaultdict

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils import timezone

from littleTalkApp.content import QUESTIONS
from littleTalkApp.content.assessments_v2 import (
    QUESTIONS_V2,
    STAGE_PADDING_ORDER,
    get_question_by_order,
    validate_v2_exercise_ids,
)
from littleTalkApp.models import Cohort, Learner, LearnerAssessmentAnswer


MOSTLY_YES_THRESHOLD = 0.6

STAGE_TO_COLOURFUL_SEMANTICS = {
    1: "colourful-semantics-early",
    2: "colourful-semantics",
    3: "colourful-semantics-plus",
}

COLOURFUL_SEMANTICS_IDS = frozenset(STAGE_TO_COLOURFUL_SEMANTICS.values())


@login_required
def screener(request):
    """Renders assessment/screener.html — the main screener overview page.

    Lists all learners accessible to the current user (filtered by school or parent
    relationship) and shows whether each one has a completed screener on record,
    along with the date of the most recent screener.
    """

    from django.db.models import Count

    profile = request.user.profile

    if profile.is_parent():
        learners = profile.parent_profile.learners.filter(
            deleted=False, school__isnull=True
        )
        cohorts = Cohort.objects.none()
    else:
        user_school = profile.get_current_school(request)
        if not user_school:
            messages.error(request, "No school assigned to your profile.")
            return redirect("profile")
        learners = Learner.objects.filter(school=user_school, deleted=False)
        cohorts = Cohort.objects.filter(school=user_school).distinct()

    selected_cohort_id = request.GET.get("cohort")
    if selected_cohort_id and not profile.is_parent():
        try:
            learners = learners.filter(cohort__id=int(selected_cohort_id))
        except ValueError:
            pass

    learners = learners.annotate(session_count=Count("exercise_sessions")).order_by("name")

    learner_uuid = request.GET.get("learner")
    selected_learner = None
    has_screener = False
    has_old_screener = False
    has_v2_screener = False
    last_screener_date = None

    if learner_uuid:
        try:
            selected_learner = learners.get(learner_uuid=learner_uuid)
            request.session["selected_learner_id"] = selected_learner.id
        except Learner.DoesNotExist:
            messages.error(request, "Learner not found or access denied.")

    if not selected_learner:
        selected_learner_id = request.session.get("selected_learner_id")
        if selected_learner_id:
            try:
                selected_learner = learners.get(id=selected_learner_id)
            except Learner.DoesNotExist:
                pass

    if selected_learner:
        has_old_screener = selected_learner.answers.filter(screener_version=1).exists()
        has_v2_screener = selected_learner.answers.filter(screener_version=2).exists()
        has_screener = has_old_screener or has_v2_screener
        if has_screener:
            last_answer = selected_learner.answers.order_by("-timestamp").first()
            last_screener_date = last_answer.timestamp if last_answer else None

    return render(
        request,
        "assessment/screener.html",
        {
            "learners": learners,
            "selected_learner": selected_learner,
            "cohorts": cohorts,
            "selected_cohort": int(selected_cohort_id)
            if selected_cohort_id and selected_cohort_id.isdigit()
            else None,
            "has_screener": has_screener,
            "has_old_screener": has_old_screener,
            "has_v2_screener": has_v2_screener,
            "last_screener_date": last_screener_date,
        },
    )


@login_required
def start_assessment(request):
    """Legacy screener start route; redirect to V2 start."""

    return redirect("start_assessment_v2")


@login_required
def start_assessment_v2(request):
    """Renders assessment/assessment_form.html for Screener V2."""

    request.hide_sidebar = True

    selected_learner_id = request.session.get("selected_learner_id")
    selected_learner = None
    if selected_learner_id:
        selected_learner = Learner.objects.filter(id=selected_learner_id).first()

    if not selected_learner:
        messages.info(
            request,
            "Please add or select a learner in your profile before starting a screener.",
        )
        return redirect("profile")

    assessment_session_id = uuid.uuid4()

    request.session["assessment_session_id"] = str(assessment_session_id)

    first_question = QUESTIONS_V2[0]
    total_questions = len(QUESTIONS_V2)

    return render(
        request,
        "assessment/assessment_form.html",
        {
            "question": first_question,
            "total_questions": total_questions,
            "current_question_index": 1,
            "user_logged_in": request.user.is_authenticated,
            "questions_json": json.dumps(QUESTIONS_V2),
            "save_url": reverse("save_all_assessment_answers_v2"),
        },
    )


@login_required
def save_all_assessment_answers(request):
    """Legacy save endpoint delegates to Screener V2 save handler."""

    return save_all_assessment_answers_v2(request)


@login_required
def save_all_assessment_answers_v2(request):
    """JSON API (POST): persists submitted Screener V2 answers to the database.

    Uses the currently selected learner from session state, saves answers via
    save_assessment_v2_for_learner, clears the active assessment session UUID,
    and returns a JSON redirect URL to the summary page.
    """

    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    selected_learner_id = request.session.get("selected_learner_id")
    selected_learner = None
    if selected_learner_id:
        selected_learner = Learner.objects.filter(id=selected_learner_id).first()

    if not selected_learner:
        return JsonResponse({"error": "No learner selected"}, status=400)

    if not isinstance(data, dict) or not data:
        return JsonResponse({"error": "No answers provided"}, status=400)

    assessment_session_id = request.session.get("assessment_session_id")
    save_assessment_v2_for_learner(selected_learner, data, session_id=assessment_session_id)

    request.session.pop("assessment_session_id", None)

    return JsonResponse({"redirect_url": reverse("assessment_summary")})


def _iter_v2_scored_answers(answers):
    """Yield non-readiness V2 answers normalized as lowercase yes/no strings."""

    question_index = {question["order"]: question for question in QUESTIONS_V2}

    for question_id_str, user_answer in answers.items():
        try:
            question_id = int(question_id_str)
        except (TypeError, ValueError):
            continue

        question = question_index.get(question_id)
        if not question or question.get("is_readiness"):
            continue

        normalized_answer = str(user_answer).strip().lower()
        if normalized_answer not in {"yes", "no"}:
            continue

        yield question, normalized_answer


def compute_stage_mastery(answers, tau=MOSTLY_YES_THRESHOLD):
    """Compute per-stage mastery and stage ceiling based on clustered yes answers."""

    stage_stats = {
        1: {"yes": 0, "total": 0},
        2: {"yes": 0, "total": 0},
        3: {"yes": 0, "total": 0},
    }

    for question, normalized_answer in _iter_v2_scored_answers(answers):
        stage = question.get("stage")
        if stage not in stage_stats:
            continue
        stage_stats[stage]["total"] += 1
        if normalized_answer == "yes":
            stage_stats[stage]["yes"] += 1

    stage_mastery = {}
    for stage, counts in stage_stats.items():
        yes_ratio = (counts["yes"] / counts["total"]) if counts["total"] else 0.0
        stage_mastery[stage] = yes_ratio >= tau

    allowed_max_stage = 1
    if stage_mastery[1]:
        allowed_max_stage = 2
    if stage_mastery[1] and stage_mastery[2]:
        allowed_max_stage = 3

    return stage_mastery, allowed_max_stage


def _pad_recommendations(recommendations, allowed_max_stage):
    """Pad recommendations from the current frontier stage downward."""

    for stage in range(allowed_max_stage, 0, -1):
        for exercise_id in STAGE_PADDING_ORDER.get(stage, []):
            if len(recommendations) >= 3:
                return recommendations[:3]
            if exercise_id in COLOURFUL_SEMANTICS_IDS and exercise_id not in recommendations:
                continue
            if exercise_id not in recommendations:
                recommendations.append(exercise_id)

    return recommendations[:3]


def compute_v2_recommendations(answers):
    """Compute top-3 strong-match recommendations within the allowed stage ceiling."""

    _, allowed_max_stage = compute_stage_mastery(answers)
    exercise_scores = defaultdict(int)
    exercise_tiebreak = {}

    for question, normalized_answer in _iter_v2_scored_answers(answers):
        if normalized_answer != "no":
            continue

        stage = question.get("stage")
        if not stage or stage > allowed_max_stage:
            continue

        exercise_id = question.get("exercise_id")
        if not exercise_id:
            continue

        exercise_scores[exercise_id] += 1

        blank_level = question.get("blank_level") or 999
        current_tiebreak = exercise_tiebreak.get(exercise_id)
        if not current_tiebreak or (stage, blank_level) < (
            current_tiebreak["stage"],
            current_tiebreak["blank_level"],
        ):
            exercise_tiebreak[exercise_id] = {
                "stage": stage,
                "blank_level": blank_level,
            }

    ranked = sorted(
        exercise_scores.items(),
        key=lambda item: (
            -item[1],
            exercise_tiebreak[item[0]]["stage"],
            exercise_tiebreak[item[0]]["blank_level"],
            item[0],
        ),
    )

    recommendations = [exercise_id for exercise_id, _ in ranked]
    colourful_semantics_id = STAGE_TO_COLOURFUL_SEMANTICS.get(allowed_max_stage)
    genuine_colourful_semantics_id = next(
        (exercise_id for exercise_id in recommendations if exercise_id in COLOURFUL_SEMANTICS_IDS),
        None,
    )

    locked_colourful_semantics_id = genuine_colourful_semantics_id or colourful_semantics_id
    if locked_colourful_semantics_id:
        recommendations = [
            locked_colourful_semantics_id,
            *[exercise_id for exercise_id in recommendations if exercise_id != locked_colourful_semantics_id],
        ]

    return _pad_recommendations(
        recommendations,
        allowed_max_stage,
    )


def compute_v2_secondary_recommendations(answers, tier_one_recommendations):
    """Compute good-match in-range support recommendations excluded from tier one."""

    _, allowed_max_stage = compute_stage_mastery(answers)
    tier_one_ids = set(tier_one_recommendations)
    exercise_scores = defaultdict(int)
    exercise_tiebreak = {}

    for question, normalized_answer in _iter_v2_scored_answers(answers):
        if normalized_answer != "no":
            continue

        stage = question.get("stage")
        if not stage or stage > allowed_max_stage:
            continue

        exercise_id = question.get("exercise_id")
        if not exercise_id or exercise_id in tier_one_ids:
            continue

        exercise_scores[exercise_id] += 1

        blank_level = question.get("blank_level") or 999
        current_tiebreak = exercise_tiebreak.get(exercise_id)
        if not current_tiebreak or (stage, blank_level) < (
            current_tiebreak["stage"],
            current_tiebreak["blank_level"],
        ):
            exercise_tiebreak[exercise_id] = {
                "stage": stage,
                "blank_level": blank_level,
            }

    ranked = sorted(
        exercise_scores.items(),
        key=lambda item: (
            -item[1],
            exercise_tiebreak[item[0]]["stage"],
            exercise_tiebreak[item[0]]["blank_level"],
            item[0],
        ),
    )
    return [exercise_id for exercise_id, _ in ranked]


def save_assessment_v2_for_learner(learner, answers, session_id=None):
    """Helper: persists a completed Screener V2 answer set for a learner."""

    invalid_exercise_ids = validate_v2_exercise_ids()
    if invalid_exercise_ids:
        raise ValueError(f"Invalid V2 exercise IDs configured: {invalid_exercise_ids}")

    if not session_id:
        session_id = uuid.uuid4()

    for question_id_str, user_answer in answers.items():
        try:
            question_id = int(question_id_str)
        except (TypeError, ValueError):
            continue

        question = get_question_by_order(question_id)
        if not question:
            continue

        LearnerAssessmentAnswer.objects.create(
            learner=learner,
            question_id=question_id,
            topic=question["topic"],
            skill=question["skill"],
            text=question["text"],
            answer=user_answer,
            session_id=session_id,
            screener_version=2,
        )

    skill_answers = defaultdict(list)
    for question_id_str, user_answer in answers.items():
        try:
            question_id = int(question_id_str)
        except (TypeError, ValueError):
            continue
        question = get_question_by_order(question_id)
        if not question:
            continue
        skill_answers[question["skill"]].append(user_answer)

    strong_skills = [
        skill for skill, responses in skill_answers.items() if "No" not in responses
    ]
    learner.assessment1 = len(strong_skills)
    tier_one_recommendations = compute_v2_recommendations(answers)
    learner.recommended_exercise_ids = tier_one_recommendations
    learner.secondary_exercise_ids = compute_v2_secondary_recommendations(
        answers,
        tier_one_recommendations,
    )
    learner.recommendation_index = 0
    learner.recommendation_index_updated_at = timezone.now()
    learner.save(
        update_fields=[
            "assessment1",
            "recommended_exercise_ids",
            "secondary_exercise_ids",
            "recommendation_index",
            "recommendation_index_updated_at",
        ]
    )


@login_required
def save_assessment_for_learner(learner, answers, session_id=None):
    """Helper: persists a completed set of assessment answers for a learner.

    Creates a LearnerAssessmentAnswer record for each question, then recalculates
    the learner's strong-skill count (assessment1) and recommendation level based
    on the highest complexity question answered "Yes". Not a request-handling view.
    """

    if learner.recommendation_level is not None:
        learner.assessment2 = learner.recommendation_level

    if not session_id:
        session_id = uuid.uuid4()

    for question_id_str, user_answer in answers.items():
        try:
            question_id = int(question_id_str)
        except ValueError:
            continue

        question = next((q for q in QUESTIONS if q["order"] == question_id), None)
        if not question:
            continue

        LearnerAssessmentAnswer.objects.create(
            learner=learner,
            question_id=question_id,
            topic=question["topic"],
            skill=question["skill"],
            text=question["text"],
            answer=user_answer,
            session_id=session_id,
        )

    skill_answers = defaultdict(list)
    for question_id_str, user_answer in answers.items():
        question_id = int(question_id_str)
        question = next((q for q in QUESTIONS if q["order"] == question_id), None)
        if not question:
            continue
        skill_answers[question["skill"]].append(user_answer)

    strong_skills = [
        skill for skill, responses in skill_answers.items() if "No" not in responses
    ]
    learner.assessment1 = len(strong_skills)

    max_complexity = 0
    for question_id_str, user_answer in answers.items():
        if user_answer.lower() == "yes":
            question_id = int(question_id_str)
            question = next((q for q in QUESTIONS if q["order"] == question_id), None)
            if question and question.get("complexity") is not None:
                max_complexity = max(max_complexity, question["complexity"])

    learner.recommendation_level = max_complexity
    learner.save()


def get_screener_comparison_data(learner, screener_version=None):
    """Helper: builds a comparison dict between the learner's two most recent screener
    sessions. Returns None if the learner has fewer than two sessions. Used by both
    assessment_summary and the learner dashboard to show skill progression over time.
    """

    if not learner:
        return None

    all_answers = learner.answers.all()
    if screener_version is not None:
        all_answers = all_answers.filter(screener_version=screener_version)

    if not all_answers.exists():
        return None

    session_ids = all_answers.values_list("session_id", flat=True).distinct()

    sessions = []
    for session_id in session_ids:
        session_answers = list(all_answers.filter(session_id=session_id).order_by("timestamp"))
        if session_answers:
            sessions.append(
                {
                    "session_id": session_id,
                    "date": session_answers[0].assessment_date,
                    "timestamp": session_answers[0].timestamp,
                    "answers": session_answers,
                }
            )

    sessions.sort(key=lambda x: x["timestamp"])

    if len(sessions) < 2:
        return None

    current_session = sessions[-1]
    previous_session = sessions[-2]

    current_skill_map = defaultdict(list)
    for answer in current_session["answers"]:
        current_skill_map[answer.skill].append(answer.answer)

    previous_skill_map = defaultdict(list)
    for answer in previous_session["answers"]:
        previous_skill_map[answer.skill].append(answer.answer)

    def get_skill_status(skill_map):
        status = {}
        for skill, responses in skill_map.items():
            status[skill] = "strong" if "No" not in responses else "needs_support"
        return status

    current_skill_status = get_skill_status(current_skill_map)
    previous_skill_status = get_skill_status(previous_skill_map)

    skills_gained = []
    skills_lost = []
    skills_maintained_strong = []
    skills_maintained_support = []

    all_skills = set(current_skill_status.keys()) | set(previous_skill_status.keys())

    for skill in sorted(all_skills):
        prev_status = previous_skill_status.get(skill)
        curr_status = current_skill_status.get(skill)

        if prev_status == "needs_support" and curr_status == "strong":
            skills_gained.append(skill)
        elif prev_status == "strong" and curr_status == "needs_support":
            skills_lost.append(skill)
        elif prev_status == "strong" and curr_status == "strong":
            skills_maintained_strong.append(skill)
        elif prev_status == "needs_support" and curr_status == "needs_support":
            skills_maintained_support.append(skill)

    recommendation_change = {
        "previous": learner.assessment2 if learner.assessment2 is not None else None,
        "current": learner.recommendation_level,
    }

    if recommendation_change["previous"] is not None:
        if recommendation_change["current"] > recommendation_change["previous"]:
            recommendation_change["direction"] = "improved"
        elif recommendation_change["current"] < recommendation_change["previous"]:
            recommendation_change["direction"] = "declined"
        else:
            recommendation_change["direction"] = "same"

    return {
        "has_previous": True,
        "previous_session_date": previous_session["date"],
        "skills_gained": skills_gained,
        "skills_lost": skills_lost,
        "skills_maintained_strong": skills_maintained_strong,
        "skills_maintained_support": skills_maintained_support,
        "recommendation_change": recommendation_change,
    }


@login_required
def assessment_summary(request):
    """Legacy summary endpoint serves Screener V2 summary."""

    return assessment_summary_v2(request)


def _render_assessment_summary(request, screener_version, is_old_results=False):
    answers = []
    learner = None
    comparison_data = None

    selected_id = request.session.get("selected_learner_id")
    if selected_id:
        learner = Learner.objects.filter(id=selected_id).first()
        if learner:
            latest_session = (
                learner.answers.filter(screener_version=screener_version)
                .order_by("-timestamp")
                .values("session_id")
                .first()
            )
            if latest_session:
                answers = learner.answers.filter(
                    session_id=latest_session["session_id"],
                    screener_version=screener_version,
                )

            comparison_data = get_screener_comparison_data(
                learner, screener_version=screener_version
            )

    skill_answers = defaultdict(list)
    for answer in answers:
        skill_answers[answer.skill].append(answer.answer)

    strong_skills = []
    needs_support_skills = []

    for skill, responses in skill_answers.items():
        if "No" in responses:
            needs_support_skills.append(skill)
        else:
            strong_skills.append(skill)

    readiness_answers = [a for a in answers if a.skill == "Attention and listening"]
    readiness_yes = [a for a in readiness_answers if str(a.answer).strip().lower() == "yes"]
    readiness_no = [a for a in readiness_answers if str(a.answer).strip().lower() == "no"]

    if len(readiness_no) > 0:
        readiness_status = "not_ready"
    elif len(readiness_yes) == len(readiness_answers) and readiness_answers:
        readiness_status = "ready"
    else:
        readiness_status = "mixed"

    context = {
        "answers": answers,
        "strong_skills": strong_skills,
        "needs_support_skills": needs_support_skills,
        "readiness_status": readiness_status,
        "learner": learner,
        "is_old_results": is_old_results,
        "rescreener_url": reverse("start_assessment_v2"),
    }

    if comparison_data:
        context.update(comparison_data)

    return render(
        request,
        "assessment/summary.html",
        context,
    )


@login_required
def assessment_summary_v2(request):
    """Renders assessment/summary.html for latest Screener V2 session."""

    return _render_assessment_summary(request, screener_version=2, is_old_results=False)


@login_required
def assessment_summary_old(request):
    """Renders assessment/summary.html for latest legacy screener (v1) session."""

    return _render_assessment_summary(request, screener_version=1, is_old_results=True)

