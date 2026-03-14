import json
import uuid
from collections import defaultdict

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import redirect, render

from littleTalkApp.content import QUESTIONS
from littleTalkApp.models import Cohort, Learner, LearnerAssessmentAnswer


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

    if not selected_learner and learners.exists():
        selected_learner = learners.first()
        request.session["selected_learner_id"] = selected_learner.id

    if selected_learner:
        has_screener = selected_learner.answers.exists()
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
            "last_screener_date": last_screener_date,
        },
    )


@login_required
def start_assessment(request):
    """Renders assessment/assessment_form.html — initialises a new assessment session.

    Clears any previous assessment state from the session, assigns a fresh UUID for
    the session, and renders the first question in the screener questionnaire.
    """

    request.hide_sidebar = True

    assessment_session_id = uuid.uuid4()

    request.session["assessment_answers"] = []
    request.session["assessment_complete"] = False
    request.session["current_question_index"] = 1
    request.session["previous_question_id"] = None
    request.session["assessment_session_id"] = str(assessment_session_id)

    first_question = QUESTIONS[0]
    total_questions = len(QUESTIONS)

    request.session["current_question_index"] = 1
    request.session["previous_question_id"] = None

    return render(
        request,
        "assessment/assessment_form.html",
        {
            "question": first_question,
            "total_questions": total_questions,
            "current_question_index": 1,
            "user_logged_in": request.user.is_authenticated,
            "questions_json": json.dumps(QUESTIONS),
        },
    )


@login_required
def save_all_assessment_answers(request):
    """JSON API (POST): persists the submitted assessment answers to the session and
    marks the assessment as complete. Returns a JSON redirect URL pointing to the
    save endpoint so the client can finalise and store results.
    """

    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    request.session["assessment_answers"] = data
    request.session["assessment_complete"] = True

    return JsonResponse({"redirect_url": "/screener/save/"})


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


def get_screener_comparison_data(learner):
    """Helper: builds a comparison dict between the learner's two most recent screener
    sessions. Returns None if the learner has fewer than two sessions. Used by both
    assessment_summary and the learner dashboard to show skill progression over time.
    """

    if not learner:
        return None

    all_answers = learner.answers.all()

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
    """Renders assessment/summary.html — the results page after completing a screener.

    Reads the most recent screener session for the currently selected learner and
    categorises skills as strong or needing support. Also includes comparison data
    against the previous session if one exists.
    """

    answers = []
    learner = None
    comparison_data = None

    selected_id = request.session.get("selected_learner_id")
    if selected_id:
        learner = Learner.objects.filter(id=selected_id).first()
        if learner:
            latest_session = learner.answers.order_by("-timestamp").values("session_id").first()
            if latest_session:
                answers = learner.answers.filter(session_id=latest_session["session_id"])

            comparison_data = get_screener_comparison_data(learner)

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
    readiness_yes = [a for a in readiness_answers if a.answer == "Yes"]
    readiness_no = [a for a in readiness_answers if a.answer == "No"]

    if len(readiness_no) > 0:
        readiness_status = "not_ready"
    elif len(readiness_yes) == len(readiness_answers):
        readiness_status = "ready"
    else:
        readiness_status = "mixed"

    context = {
        "answers": answers,
        "strong_skills": strong_skills,
        "needs_support_skills": needs_support_skills,
        "readiness_status": readiness_status,
        "learner": learner,
    }

    if comparison_data:
        context.update(comparison_data)

    return render(
        request,
        "assessment/summary.html",
        context,
    )


@login_required
def save_assessment(request):
    """Saves the in-progress assessment from the session to the database.

    Reads answers stored in the session by save_all_assessment_answers, delegates
    persistence to save_assessment_for_learner, clears all assessment session keys,
    then redirects to assessment_summary.
    """

    selected_learner_id = request.session.get("selected_learner_id")

    if selected_learner_id:
        selected_learner = Learner.objects.filter(id=selected_learner_id).first()
    else:
        selected_learner = None

    answers = request.session.get("assessment_answers", {})
    assessment_session_id = request.session.get("assessment_session_id")

    if not answers:
        return redirect("start_assessment")

    if selected_learner:
        save_assessment_for_learner(
            selected_learner, answers, session_id=assessment_session_id
        )

    request.session.pop("assessment_answers", None)
    request.session.pop("assessment_complete", None)
    request.session.pop("current_question_index", None)
    request.session.pop("previous_question_id", None)
    request.session.pop("assessment_session_id", None)

    return redirect("assessment_summary")
