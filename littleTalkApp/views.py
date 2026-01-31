# Django core
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseRedirect
from django.urls import reverse
from django.contrib import messages
from django.conf import settings
from django.core.mail import send_mail
from django.middleware.csrf import get_token
from django.http import HttpResponse
from django.utils import timezone
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

# Django auth
from django.contrib.auth import login, authenticate, update_session_auth_hash, get_user_model
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.views import LoginView

User = get_user_model()

# Third-party (DRF)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.authentication import SessionAuthentication
from django.db.models import Q
from django.db import models

# Honeypot and rate limiting
from honeypot.decorators import check_honeypot

# Local app: forms
from .forms import (
    UserRegistrationForm,
    LearnerForm,
    CustomAuthenticationForm,
    LogEntryForm,
    UserUpdateForm,
    PasswordUpdateForm,
    CohortForm,
    SchoolSignupForm,
    StaffInviteForm,
    AcceptInviteForm,
    JoinRequestForm,
    ParentSignupForm,
    ParentAccessCodeForm,
)

# Local app: models
from .models import (
    Profile,
    Learner,
    LearnerAssessmentAnswer,
    LogEntry,
    Cohort,
    School,
    StaffInvite,
    SchoolMembership,
    Role,
    JoinRequest,
    ParentAccessToken,
    ParentProfile,
    ExerciseSession,
)

# Local app: serializers
from .serializers import LearnerExpUpdateSerializer, LearnerExpUpdateInputSerializer

# Local app: other
from .game_data import GAME_DESCRIPTIONS
from .assessment_qs import QUESTIONS, RECOMMENDATIONS
from .decorators import valid_game_required

# Python stdlib
from collections import defaultdict
import json
import stripe
import uuid

from .utilites import (
    can_edit_or_delete_log,
    send_invite_email,
    send_parent_access_email,
    send_school_welcome_email,
    send_parent_welcome_email,
    hash_email,
)


def home(request):
    request.hide_sidebar = True
    if request.user.is_authenticated:
        return redirect("/practise/")
    return render(request, "landing.html")


@check_honeypot
def school_signup(request):
    request.hide_sidebar = True
    if request.method == "POST":
        form = SchoolSignupForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data["email"].lower()
            password = form.cleaned_data["password"]
            full_name = form.cleaned_data["full_name"]
            school_name = form.cleaned_data["school_name"]

            # Create user with a random UUID username (no plaintext email)
            user = get_user_model().objects.create_user(
                username=str(uuid.uuid4()), password=password
            )
            # Populate encrypted email and hash
            user.email_encrypted = email
            user.email_hash = hash_email(email)
            user.save()

            # Create school
            school = School.objects.create(name=school_name, created_by=user)

            # Link profile
            profile = Profile.objects.create(user=user, first_name=full_name, school=school)
            # Ensure new M2M relation includes this school for the profile
            try:
                profile.schools.add(school)
            except Exception:
                pass
            # Keep legacy role as a fallback but create a SchoolMembership for the
            # selected school so the user is admin for that school.
            profile.role = Role.ADMIN
            profile.save()
            try:
                SchoolMembership.objects.create(profile=profile, school=school, role=Role.ADMIN, is_active=True)
            except Exception:
                pass

            # Send welcome email
            send_school_welcome_email(school, user)

            # Auto-login
            login(request, user)

            return redirect("profile")  # or wherever your school users land
    else:
        form = SchoolSignupForm()

    return render(request, "registration/school_signup.html", {"form": form})


# This view will serve the first question when the assessment starts
@login_required
def start_assessment(request):
    request.hide_sidebar = True

    # Reset assessment session state
    request.session["assessment_answers"] = []
    request.session["assessment_complete"] = False
    request.session["current_question_index"] = 1
    request.session["previous_question_id"] = None

    # Get the first question
    first_question = QUESTIONS[0]
    total_questions = len(QUESTIONS)

    # Store the current question index and other relevant info in the session
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
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    # Persist in session; we will apply to the selected learner only
    request.session["assessment_answers"] = data
    request.session["assessment_complete"] = True

    # Send client to the final save endpoint (no user-controlled IDs)
    return JsonResponse({"redirect_url": "/screener/save/"})


# Saves and assigns learners assessment answers and recommendations
@login_required
def save_assessment_for_learner(learner, answers):
    from collections import defaultdict

    # Delete old answers
    learner.answers.all().delete()

    # Save new answers
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
        )

    # Calculate strong skills
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

    # Recommendation level
    max_complexity = 0
    for question_id_str, user_answer in answers.items():
        if user_answer.lower() == "yes":
            question_id = int(question_id_str)
            question = next((q for q in QUESTIONS if q["order"] == question_id), None)
            if question and question.get("complexity") is not None:
                max_complexity = max(max_complexity, question["complexity"])

    learner.recommendation_level = max_complexity
    learner.save()


@login_required
def assessment_summary(request):
    request.hide_sidebar = True

    answers = []
    learner = None

    selected_id = request.session.get("selected_learner_id")
    if selected_id:
        learner = Learner.objects.filter(id=selected_id).first()
        if learner:
            answers = learner.answers.all()

    # Group answers by skill
    skill_answers = defaultdict(list)
    for answer in answers:
        skill = answer.skill
        skill_answers[skill].append(answer.answer)

    strong_skills = []
    needs_support_skills = []

    for skill, responses in skill_answers.items():
        if "No" in responses:
            needs_support_skills.append(skill)
        else:
            strong_skills.append(skill)

    # Attention/listening readiness logic (skill = 'base')
    readiness_answers = [a for a in answers if a.skill == "Attention and listening"]
    readiness_yes = [a for a in readiness_answers if a.answer == "Yes"]
    readiness_no = [a for a in readiness_answers if a.answer == "No"]

    if len(readiness_no) > 0:
        readiness_status = "not_ready"
    elif len(readiness_yes) == len(readiness_answers):
        readiness_status = "ready"
    else:
        readiness_status = "mixed"

    return render(
        request,
        "assessment/summary.html",
        {
            "answers": answers,
            "strong_skills": strong_skills,
            "needs_support_skills": needs_support_skills,
            "readiness_status": readiness_status,
            "learner": learner,
        },
    )


@login_required
def save_assessment(request):
    # Enforce selected learner & ownership
    selected_learner_id = request.session.get("selected_learner_id")

    if selected_learner_id:
        selected_learner = Learner.objects.filter(id=selected_learner_id).first()

    answers = request.session.get("assessment_answers", {})

    if not answers:
        # Nothing to save; send back to start
        return redirect("start_assessment")

    save_assessment_for_learner(selected_learner, answers)

    # Keep this learner selected; clear assessment temp state
    # request.session["selected_learner_id"] = selected_learner.id
    request.session.pop("assessment_answers", None)
    request.session.pop("assessment_complete", None)
    request.session.pop("current_question_index", None)
    request.session.pop("previous_question_id", None)
    # (No retake key anymore)

    return redirect("assessment_summary")


@login_required
def practise(request):
    selected_learner_id = request.session.get("selected_learner_id")
    learner_selected = False
    selected_learner = None
    recommendation = None

    if selected_learner_id:
        selected_learner = Learner.objects.filter(id=selected_learner_id).first()
        learner_selected = selected_learner is not None

        if learner_selected and selected_learner.recommendation_level is not None:
            level = selected_learner.recommendation_level
            recommendation = (
                RECOMMENDATIONS[level] if level < len(RECOMMENDATIONS) else None
            )

    context = {
        "learner_selected": learner_selected,
        "selected_learner": selected_learner,
        "recommendation": recommendation,
        "game_descriptions": GAME_DESCRIPTIONS,
    }

    return render(request, "practise.html", context)


@login_required
def logbook(request):
    selected_learner_id = request.GET.get("learner")
    selected_cohort_id = request.GET.get("cohort")
    user = request.user
    # Use profile helper to support multiple schools per user.
    school = user.profile.get_current_school(request) # if user is a parent this will return None
    if school:
        learners = Learner.objects.filter(school=school, deleted=False)
        cohorts = Cohort.objects.filter(school=school)

        # Admins/managers should see log entries for the whole school.
        # Other roles should see their own log entries
        if user.profile.is_admin_for_school(school) or user.profile.is_manager_for_school(school):
            # Strict behaviour: staff see only entries that are linked to learners that belong to this school.
            log_entries = LogEntry.objects.filter(school=school, deleted=False)
        else:
            # Non-admin users see only their own entries
            log_entries = LogEntry.objects.filter(school=school, user=user, deleted=False)
    else:
        learners = None
        cohorts = None
        # Parent users see only their own entries
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
    selected_learner_id = request.session.get("selected_learner_id")

    if request.method == "POST":
        form = LogEntryForm(request.POST, user=request.user, request=request)
        if form.is_valid():
            log_entry = form.save(commit=False)
            log_entry.user = request.user  # Assign the logged-in user
            
            # Set school and role based on context
            try:
                profile = request.user.profile
                
                # For non-parent users without learner, use session-selected school
                if not profile.is_parent():
                    school_ctx = profile.get_current_school(request) if hasattr(profile, "get_current_school") else None
                    log_entry.school = school_ctx
                    role_for = profile.get_role_for_school(school_ctx)
                # For parent users without learner, leave school as null
                else:
                    log_entry.school = None
                    role_for = Role.PARENT
                    
                log_entry.created_by_role = role_for
            except Exception:
                # Fall back to legacy value
                log_entry.created_by_role = request.user.profile.role

            log_entry.save()
            return redirect("logbook")  # Redirect to logbook page after saving
    else:
        initial = {}
        if selected_learner_id:
            initial["learner"] = selected_learner_id  # pre-fill selected learner
        form = LogEntryForm(user=request.user, request=request, initial=initial)

    return render(request, "logbook/new_log_entry.html", {"form": form})


@login_required
def log_entry_detail(request, entry_id):
    log_entry = get_object_or_404(LogEntry, id=entry_id, deleted=False)

    if not can_edit_or_delete_log(request.user, log_entry):
        return redirect("logbook")

    return render(request, "logbook/log_entry_detail.html", {"log_entry": log_entry})


@login_required
def edit_log_entry(request, entry_id):
    log_entry = get_object_or_404(LogEntry, id=entry_id, deleted=False)

    if not can_edit_or_delete_log(request.user, log_entry):
        return redirect("logbook")

    if request.method == "POST":
        form = LogEntryForm(request.POST, instance=log_entry, user=request.user, request=request)
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
    school = request.user.profile.get_current_school(request)
    learner = get_object_or_404(Learner, learner_uuid=learner_uuid, school=school)

    # Allow broader access if the user is admin or manager for this school
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


@valid_game_required
@login_required
def game_description(request, game_name):
    game = GAME_DESCRIPTIONS.get(game_name, None)
    return render(request, "game_description.html", {"game": game})


class CustomLoginView(LoginView):
    template_name = "registration/login.html"  # Use your custom template
    redirect_authenticated_user = True  # Redirect logged-in users to a specific page
    authentication_form = (
        CustomAuthenticationForm  # Use custom form to lowercase username
    )

    def dispatch(self, request, *args, **kwargs):
        # Set request.hide_panels to True before processing the request
        request.hide_sidebar = True
        return super().dispatch(request, *args, **kwargs)


def account_setup_view(request):
    request.hide_sidebar = True
    return render(request, "registration/account_setup.html")


# OLD REGISTER VIEW

# def register(request):
#     request.hide_sidebar = True

#     # Prevent access unless assessment is complete
#     if not request.session.get('assessment_complete'):
#         return redirect('start_assessment')

#     if request.method == 'POST':
#         form = UserRegistrationForm(request.POST)
#         if form.is_valid():
#             email = form.cleaned_data.get('email').lower()
#             password = form.cleaned_data.get('password1')
#             first_name = form.cleaned_data.get('first_name')
#             learner_name = form.cleaned_data.get('learner_name')
#             learner_dob = form.cleaned_data.get('learner_dob')
#             hear_about = form.cleaned_data.get('hear_about')
#             agree_updates = form.cleaned_data.get('agree_updates')

#             # Create user
#             user = User.objects.create_user(
#                 username=email,
#                 email=email,
#                 password=password,
#                 first_name=first_name,
#             )

#             # Create user profile
#             Profile.objects.create(
#                 user=user,
#                 email=email,
#                 first_name=first_name,
#                 hear_about=hear_about,
#                 opted_in=agree_updates,
#             )

#             # Create learner
#             learner = Learner.objects.create(
#                 user=user,
#                 name=learner_name,
#                 date_of_birth=learner_dob,
#             )

#             # Save answers using our helper
#             answers = request.session.get("assessment_answers", {})
#             save_assessment_for_learner(learner, answers)

#             # Log in the user
#             login(request, user)

#             # Select the learner
#             request.session['selected_learner_id'] = learner.id

#             # Clean up session
#             request.session.pop("assessment_answers", None)
#             request.session.pop("assessment_complete", None)

#             return redirect("assessment_summary")
#     else:
#         form = UserRegistrationForm()

#     return render(request, 'registration/register.html', {'form': form})


@login_required
def profile(request):
    profile = request.user.profile

    # placeholders - allows school view to render
    on_trial = False
    trial_days_left = 0
    is_subscribed = False

    if profile.is_parent():
        parent_profile = profile.parent_profile
        # Standalone or invited parent: only show their linked learners
        all_learners = profile.parent_profile.learners.filter(deleted=False)
        cohorts = Cohort.objects.none()

        on_trial = parent_profile.on_trial()
        trial_days_left = parent_profile.trial_days_left()
        is_subscribed = parent_profile.is_subscribed
    else:
        # Staff/admin: show all learners in their active school
        user_school = profile.get_current_school(request)
        all_learners = Learner.objects.filter(school=user_school, deleted=False)
        cohorts = Cohort.objects.filter(school=user_school).distinct()

    # Get selected cohort from GET params
    selected_cohort = request.GET.get("cohort")
    try:
        if selected_cohort and not profile.is_parent():
            selected_cohort_id = int(selected_cohort)
            learners = all_learners.filter(cohort__id=selected_cohort_id)
        else:
            learners = all_learners
            selected_cohort_id = None
    except ValueError:
        learners = all_learners
        selected_cohort_id = None

    # Get selected learner from session
    selected_learner = None
    selected_learner_id = request.session.get("selected_learner_id")
    try:
        if selected_learner_id not in [None, ""]:
            selected_learner = all_learners.get(id=int(selected_learner_id))
    except (ValueError, Learner.DoesNotExist):
        selected_learner = None

    # If none selected, pick the first available learner
    if not selected_learner and learners.exists():
        selected_learner = learners.first()
        request.session["selected_learner_id"] = selected_learner.id

    return render(
        request,
        "profile/profile.html",
        {
            "learners": learners,
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
    # if request.user.profile.role == Role.PARENT:
    #     if request.user.profile.parent_profile.learners.count() < 2:
    #         return redirect('profile')
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

            # Store selected learner in session (optional)
            request.session["selected_learner_id"] = learner.id

            return redirect("profile")  # or 'logbook' or any page you prefer
    else:
        form = LearnerForm(user=request.user)

    return render(request, "profile/add_learner.html", {"form": form})


@login_required
def select_learner(request):
    if request.method == "POST":
        learner_id = request.POST.get("learner_id")
        if learner_id:
            request.session["selected_learner_id"] = (
                learner_id  # Store selected learner in session
            )
    return HttpResponseRedirect(reverse("profile"))  # Redirect back to the profile page


@login_required
def edit_learner(request, learner_uuid):
    learner = get_object_or_404(Learner, learner_uuid=learner_uuid, deleted=False)

    # If user is a parent and this learner is tied to any school, send them back
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

    # Determine delete permission in context of learner's school when applicable
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

    # If user is a parent and this learner is tied to any school, send them back
    if request.user.profile.is_parent() and learner.school_id:
        messages.error(request, "You do not have permission to delete this learner.")
        return redirect("profile")

    # Restrict delete permissions
    # Determine permission to delete the learner. If the learner is attached to a school,
    # check per-school roles for that specific school. Otherwise fall back to legacy checks.
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
            # User authenticated, mark the learner as deleted
            learner.deleted = True
            learner.save()

            # Soft-delete all log entries linked to this learner
            LogEntry.objects.filter(learner=learner, deleted=False).update(deleted=True)

            # Clear session and redirect
            del request.session["selected_learner_id"]
            return redirect("profile")  # Redirect to the profile page after deletion
        else:
            # If authentication fails, show an error
            error_message = "Incorrect password. Please try again."
            return render(
                request,
                "profile/confirm_delete_learner.html",
                {"learner": learner, "error_message": error_message},
            )

    return render(request, "profile/confirm_delete_learner.html", {"learner": learner})


# COHORT


@login_required
def cohort_list(request):
    school = request.user.profile.get_current_school(request)
    # Only allow admins/managers for the current school
    if not (
        request.user.profile.is_admin_for_school(school)
        or request.user.profile.is_manager_for_school(school)
    ):
        # messages.error(request, "You don't have permission to create cohorts.")
        return redirect("profile")

    cohorts = Cohort.objects.filter(school=school).order_by("name")
    return render(
        request,
        "cohorts/cohort_list.html",
        {
            "cohorts": cohorts,
            "can_edit_cohorts": request.user.profile.is_admin_for_school(school)
            or request.user.profile.is_manager_for_school(school),
        },
    )


@login_required
def cohort_create(request):
    school = request.user.profile.get_current_school(request)
    if not (
        request.user.profile.is_admin_for_school(school)
        or request.user.profile.is_manager_for_school(school)
    ):
        # messages.error(request, "You don't have permission to create cohorts.")
        return redirect("profile")

    if request.method == "POST":
        form = CohortForm(request.POST)
        if form.is_valid():
            cohort = form.save(commit=False)
            cohort.school = school
            cohort.save()
            return redirect("cohort_list")
    else:
        form = CohortForm()

    return render(
        request, "cohorts/cohort_form.html", {"form": form, "is_editing": False}
    )


@login_required
def cohort_edit(request, cohort_id):
    school = request.user.profile.get_current_school(request)
    if not (
        request.user.profile.is_admin_for_school(school)
        or request.user.profile.is_manager_for_school(school)
    ):
        # messages.error(request, "You don't have permission to edit cohorts.")
        return redirect("cohort_list")

    cohort = get_object_or_404(Cohort, id=cohort_id, school=school)

    if request.method == "POST":
        form = CohortForm(request.POST, instance=cohort)
        if form.is_valid():
            form.save()
            return redirect("cohort_list")
    else:
        form = CohortForm(instance=cohort)

    return render(
        request, "cohorts/cohort_form.html", {"form": form, "is_editing": True}
    )


@login_required
def cohort_delete(request, cohort_id):
    school = request.user.profile.get_current_school(request)
    if not (
        request.user.profile.is_admin_for_school(school)
        or request.user.profile.is_manager_for_school(school)
    ):
        # messages.error(request, "You don't have permission to delete cohorts.")
        return redirect("cohort_list")

    cohort = get_object_or_404(Cohort, id=cohort_id, school=school)

    if request.method == "POST":
        password = request.POST.get("password")
        user = authenticate(username=request.user.username, password=password)

        if user is not None:
            cohort.delete()
            return redirect("cohort_list")
        else:
            error_message = "Incorrect password. Please try again."
            return render(
                request,
                "cohorts/cohort_confirm_delete.html",
                {"cohort": cohort, "error_message": error_message},
            )

    return render(request, "cohorts/cohort_confirm_delete.html", {"cohort": cohort})


# SETTINGS


@login_required
def settings_view(request):
    user_form = UserUpdateForm(instance=request.user)
    password_form = PasswordUpdateForm(user=request.user)

    return render(
        request,
        "settings.html",
        {"user_form": user_form, "password_form": password_form},
    )


@login_required
def change_user_details(request):
    if request.method == "POST":
        user_form = UserUpdateForm(request.POST, instance=request.user)
        password_form = PasswordUpdateForm(
            user=request.user
        )  # Ensure password form is included

        if user_form.is_valid():
            user_form.save()
            messages.success(request, "Your details have been updated successfully!")
            return redirect("settings")
        else:
            messages.error(request, "Error updating details. Please try again.")

    else:
        user_form = UserUpdateForm(instance=request.user)
        password_form = PasswordUpdateForm(user=request.user)

    return render(
        request,
        "settings.html",
        {"user_form": user_form, "password_form": password_form},
    )


@login_required
def change_password(request):
    if request.method == "POST":
        user_form = UserUpdateForm(
            instance=request.user
        )  # Ensure email form is included
        password_form = PasswordUpdateForm(request.user, request.POST)

        if password_form.is_valid():
            new_password = password_form.cleaned_data.get("new_password")
            request.user.set_password(new_password)
            request.user.save()
            update_session_auth_hash(request, request.user)

            messages.success(request, "Your password has been updated successfully!")
            return redirect("settings")
        else:
            messages.error(request, "Error updating password. Please try again.")

    return render(
        request,
        "settings.html",
        {"user_form": user_form, "password_form": password_form},
    )


# SCHOOL CENTRIC CODE


@login_required
def invite_staff(request):
    profile = request.user.profile

    # Use profile helper to support multiple schools per user
    school = profile.get_current_school(request)

    # Only admins and managers for this school can access
    if not (
        profile.is_admin_for_school(school) or profile.is_manager_for_school(school)
    ):
        return redirect("school_dashboard")

    if request.method == "POST":
        form = StaffInviteForm(request.POST, school=school, user=request.user)
        if form.is_valid():
            invite = form.save(commit=False)
            invite.school = school
            invite.sent_by = request.user
            invite.save()

            # Uses updated HTML+text email utility
            send_invite_email(invite, school, request)

            messages.success(request, f"Invite sent to {invite.email}")
            return redirect("invite_staff")
    else:
        form = StaffInviteForm(user=request.user, school=school)

    return render(
        request,
        "school/invite_staff.html",
        {
            "form": form,
        },
    )


# API VIEWS


class CanUpdateLearnerPermission(BasePermission):
    """
    Custom permission to allow parents to update their own learners,
    and staff to update learners in their school/cohort.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        profile = getattr(user, 'profile', None)
        if not profile:
            return False

        learner = obj  # obj is the Learner instance

        if profile.is_parent():
            # Parents can only update their own learners
            return learner.user == user
        elif profile.is_staff() or profile.is_manager() or profile.is_admin():
            # Staff can update learners in their school
            current_school = profile.get_current_school(request)
            if current_school:
                return learner.school == current_school
            return False
        return False


class UpdateLearnerExpAPIView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated, CanUpdateLearnerPermission]

    def post(self, request, learner_uuid):
        learner = get_object_or_404(Learner, learner_uuid=learner_uuid)
        self.check_object_permissions(request, learner)

        input_serializer = LearnerExpUpdateInputSerializer(data=request.data)
        if not input_serializer.is_valid():
            return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        nonce = input_serializer.validated_data['nonce']
        cache_key = f"nonce_{request.user.id}_{nonce}"
        if cache.get(cache_key):
            return Response({"detail": "Nonce already used."}, status=status.HTTP_400_BAD_REQUEST)

        new_exp = input_serializer.validated_data['exp']
        new_total_exercises = input_serializer.validated_data['total_exercises']

        learner.exp += new_exp
        learner.total_exercises += new_total_exercises
        learner.save()

        # Create ExerciseSession if analytics data is provided
        if 'exercise_id' in input_serializer.validated_data:
            ExerciseSession.objects.create(
                learner=learner,
                exercise_id=input_serializer.validated_data['exercise_id'],
                difficulty_selected=input_serializer.validated_data.get('difficulty_selected', ''),
                started_at=input_serializer.validated_data['started_at'],
                completed_at=input_serializer.validated_data['completed_at'],
                total_questions=input_serializer.validated_data['total_questions'],
                incorrect_answers=input_serializer.validated_data['incorrect_answers'],
                attempts_per_question=input_serializer.validated_data['attempts_per_question'],
            )

        # Mark nonce as used, expire in 10 minutes
        cache.set(cache_key, True, 600)

        logger.info(f"User {request.user.username} updated learner {learner.id}: exp +{new_exp}, exercises +{new_total_exercises}")

        serializer = LearnerExpUpdateSerializer(learner)
        return Response(serializer.data, status=status.HTTP_200_OK)


def get_selected_learner(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)

    csrf_token = get_token(request)  # Get CSRF token

    selected_learner_id = request.session.get(
        "selected_learner_id"
    )  # Retrieve the selected learner from the session

    selected_learner = None

    if selected_learner_id:
        selected_learner = Learner.objects.get(id=selected_learner_id)
        return JsonResponse(
            {
                "learner_uuid": str(selected_learner.learner_uuid),
                "csrf_token": csrf_token,
                "cs_level": selected_learner.assessment2,
            }
        )
    return JsonResponse({"error": "No learner selected"}, status=400)


# API VIEWS END


def support(request):
    request.hide_sidebar = True
    return render(request, "support.html", {})


@check_honeypot
def send_support_email(request):
    if request.method == "POST":
        name = request.POST.get("name")
        email = request.POST.get("email")
        message = request.POST.get("message")

        full_message = f"Message from {name} <{email}>:\n\n{message}"

        send_mail(
            subject="Support Request - Chatterdillo",
            message=full_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[
                "support@chatterdillo.com"
            ],  # Update to official support address
            fail_silently=False,
        )

        messages.success(
            request, "Your message has been sent. We'll get back to you shortly."
        )
        return redirect("support")  # Redirect to avoid resubmission on refresh

    return redirect("support")


def tips(request):
    return render(request, "tips.html", {})


def method(request):
    context = {
        "game_descriptions": GAME_DESCRIPTIONS,
    }
    return render(request, "method.html", context)


def about(request):
    return render(request, "about.html")


@check_honeypot
def accept_invite(request, token):
    request.hide_sidebar = True

    try:
        invite = StaffInvite.objects.get(token=token)
    except StaffInvite.DoesNotExist:
        return redirect("/")  # Invalid token

    # Redirect if already used, expired, or withdrawn
    if invite.used or invite.withdrawn or invite.expires_at < timezone.now():
        return redirect("/")

    email_hash = hash_email(invite.email.lower())
    if email_hash and get_user_model().objects.filter(email_hash=email_hash).first():
        return redirect("/")

    if request.method == "POST":
        form = AcceptInviteForm(request.POST)
        if form.is_valid():
            email = invite.email.lower()
            password = form.cleaned_data["password"]
            full_name = form.cleaned_data["full_name"]

            user = get_user_model().objects.create_user(
                username=str(uuid.uuid4()), password=password
            )
            # Add these lines:
            user.email_encrypted = email
            user.email_hash = hash_email(email)
            user.save()

            profile = Profile.objects.create(
                user=user, first_name=full_name, school=invite.school
            )
            # ensure M2M mapping is created and create a SchoolMembership
            try:
                profile.schools.add(invite.school)
            except Exception:
                pass
            # keep legacy role for fallback but ensure membership exists
            profile.role = invite.role
            profile.save()
            try:
                SchoolMembership.objects.create(profile=profile, school=invite.school, role=invite.role, is_active=True)
            except Exception:
                pass

            invite.used = True
            invite.save()

            login(request, user)
            return redirect("profile")
    else:
        form = AcceptInviteForm()

    return render(
        request,
        "school/accept_invite.html",
        {"form": form, "school_name": invite.school.name, "email": invite.email},
    )


@login_required
def school_dashboard(request):
    if request.user.profile.is_parent():
        return redirect("profile")
    profile = request.user.profile
    school = profile.get_current_school(request)

    if request.method == "POST":
        if "user_id" in request.POST and "new_role" in request.POST:
            # Update user role logic
            user_id = request.POST.get("user_id")
            new_role = request.POST.get("new_role")

            # Get the profile by user ID, then verify they're associated with this school
            target_profile = get_object_or_404(Profile, user__id=user_id)
            
            # Verify the target profile is associated with this school
            if not (target_profile.schools.filter(id=school.id).exists()):
                messages.error(request, "This user is not associated with this school. Please notify support")
                return redirect("school_dashboard")

            # Get the target user's current role for this school
            target_current_role = target_profile.get_role_for_school(school)

            if target_profile.user == request.user:
                messages.error(request, "You cannot change your own role.")
            # Team managers cannot edit admins at all
            elif profile.is_manager_for_school(school) and target_current_role == Role.ADMIN:
                messages.error(request, "Only admins can edit the roles of other admins.")
            # Team managers cannot assign the admin role
            elif profile.is_manager_for_school(school) and new_role == Role.ADMIN:
                messages.error(request, "Only admins can assign the admin role.")
            elif new_role in dict(Role.CHOICES).keys():
                # Update or create a SchoolMembership for the target profile
                try:
                    membership = target_profile.memberships.filter(school=school).first()
                    if membership:
                        membership.role = new_role
                        membership.save()
                    else:
                        target_profile.schools.add(school)
                        SchoolMembership.objects.create(profile=target_profile, school=school, role=new_role, is_active=True)
                except Exception:
                    # fallback: update legacy role
                    target_profile.role = new_role
                    target_profile.save()
                messages.success(request, f"{target_profile.first_name}'s role updated")
            else:
                messages.error(request, "Invalid role selected.")
            return redirect("school_dashboard")

        elif "resend_invite" in request.POST:
            invite_id = request.POST.get("invite_id")
            invite = get_object_or_404(
                StaffInvite, id=invite_id, school=school, used=False, withdrawn=False
            )

            # Send invite again
            send_invite_email(invite, school, request)
            messages.success(request, f"Invite resent to {invite.email}.")
            return redirect("school_dashboard")

        elif "withdraw_invite" in request.POST:
            invite_id = request.POST.get("invite_id")
            invite = get_object_or_404(
                StaffInvite, id=invite_id, school=school, used=False, withdrawn=False
            )

            invite.withdrawn = True
            invite.save()
            messages.success(request, f"Invite to {invite.email} withdrawn.")
            return redirect("school_dashboard")

        elif (
            "approve_join_request" in request.POST
            or "reject_join_request" in request.POST
        ):
            join_request_id = request.POST.get("join_request_id")
            join_request = get_object_or_404(
                JoinRequest, id=join_request_id, school=school, status="pending"
            )

            if "approve_join_request" in request.POST:
                # Create invite on approval
                invite = StaffInvite.objects.create(
                    email=join_request.email,
                    role="staff",
                    school=school,
                    sent_by=request.user,
                )
                send_invite_email(invite, school, request)
                join_request.status = "accepted"
                messages.success(
                    request,
                    f"Join request from {join_request.full_name} approved and invite sent.",
                )
            else:
                join_request.status = "rejected"
                messages.info(
                    request, f"Join request from {join_request.full_name} was rejected."
                )

            join_request.resolved_by = request.user
            join_request.resolved_at = timezone.now()
            join_request.save()
            return redirect("school_dashboard")

    # Only show profiles associated with this school that are staff-like roles.
    # Parent accounts may be associated with a school when creating learners;
    # exclude them from the staff dashboard so parents don't appear as staff.
    # Collect profiles associated with this school and filter out those who
    # are parents for THIS school (membership takes precedence).
    raw_profiles = (
        Profile.objects.filter(Q(schools=school))
        .select_related("user")
        .distinct()
    )
    # Build a list of dicts so templates can access the per-school role
    staff_profiles = []
    for p in raw_profiles:
        try:
            role_for = p.get_role_for_school(school)
        except Exception:
            role_for = p.role  # fallback to legacy role
        if role_for != Role.PARENT:
            staff_profiles.append({"profile": p, "role": role_for})

    invites = StaffInvite.objects.filter(
        school=school, used=False, withdrawn=False
    ).order_by("-created_at")[:10]

    # Only admins and managers for this school can see join requests
    can_invite_staff = profile.is_admin_for_school(school) or profile.is_manager_for_school(school)
    join_requests = []
    if can_invite_staff:
        join_requests = JoinRequest.objects.filter(
            school=school, status="pending"
        ).order_by("-created_at")[:10]

    return render(
        request,
        "school/school_dashboard.html",
        {
            "staff_profiles": staff_profiles,
            "invites": invites,
            "school_name": school.name,
            "school": school,
            "role_choices": Role.CHOICES,
            "can_invite_staff": can_invite_staff,
            "current_user_is_admin_or_manager": can_invite_staff,
            "join_requests": join_requests,
        },
    )


@check_honeypot
def request_join_school(request):
    request.hide_sidebar = True
    if request.method == "POST":
        form = JoinRequestForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(
                request,
                "Your request has been submitted. An admin will review it shortly. If approved, you will receive an invite via E-Mail",
            )
            return redirect("request_join_school")  # or somewhere else
    else:
        form = JoinRequestForm()

    return render(request, "school/request_join_school.html", {"form": form})


@login_required
def invite_audit_trail(request):
    school = request.user.profile.get_current_school(request)
    if not (
        request.user.profile.is_admin_for_school(school) or request.user.profile.is_manager_for_school(school)
    ):
        return redirect("school_dashboard")


    invites = (
        StaffInvite.objects.filter(school=school)
        .select_related("sent_by")
        .order_by("-created_at")[:50]
    )
    join_requests = (
        JoinRequest.objects.filter(school=school)
        .select_related("resolved_by")
        .order_by("-created_at")[:50]
    )

    return render(
        request,
        "school/invite_audit_trail.html",
        {
            "invites": invites,
            "join_requests": join_requests,
            "now": timezone.now(),
        },
    )


# PARENT ACCESS


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

    # Optionally auto-regenerate if expired
    if token.is_expired():
        token.regenerate_token()

    return render(
        request,
        "parent_token/view_token.html",
        {
            "learner": learner,
            "token": token,
            "signup_link": request.build_absolute_uri(
                f"/parent-signup/?code={token.token}"
            ),
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
        token = learner.parent_token  # assumes OneToOne
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
            # lowercase that email
            email = form.cleaned_data["email"].lower()
            # set up user
            user = get_user_model().objects.create_user(
                username=str(uuid.uuid4()),
                password=form.cleaned_data["password"],
            )
            # Populate encrypted email and hash
            user.email_encrypted = email
            user.email_hash = hash_email(email)
            user.save()

            token = form.cleaned_data.get(
                "access_code"
            )  # This is the actual token object or None
            learner = token.learner if token else None
            # school = learner.school if learner else None

            profile = Profile.objects.create(
                user=user,
                first_name=form.cleaned_data["first_name"],
                role="parent",
                opted_in=form.cleaned_data.get("agree_updates", False),
            )
            # If the parent signs up with a learner access token and that learner
            # is attached to a school, link that school to the parent profile.
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

            # Send welcome email
            send_parent_welcome_email(user)

            login(request, user)
            return redirect("profile")
    else:
        # Pre-fill access code if passed via URL
        form = ParentSignupForm(initial={"access_code": prefill_code})

    return render(
        request,
        "parent/parent_signup.html",
        {
            "form": form,
            "standalone": not prefill_code,  # controls header/template messaging
        },
    )


@login_required
def add_learner_via_pac(request):
    # Ensure only parent users can access
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
                # Link the learner's school to the parent profile's schools M2M
                try:
                    profile = request.user.profile
                    if learner.school:
                        profile.schools.add(learner.school)
                        # Keep legacy FK in sync if it isn't set yet
                        if not profile.school:
                            profile.school = learner.school
                            profile.save()
                except Exception:
                    # Don't block the primary flow if M2M linking fails
                    pass

                token.used = True
                token.save()
                messages.success(
                    request, f"{learner.name} has been added to your account."
                )
                return redirect("profile")
    else:
        form = ParentAccessCodeForm()

    return render(request, "parent/add_learner_via_pac.html", {"form": form})


def subscribe(request):
    request.hide_sidebar = True
    return render(request, "lockout/subscribe.html")


def license_expired(request):
    request.hide_sidebar = True
    return render(request, "lockout/license_expired.html")


# stripe payments

stripe.api_key = settings.STRIPE_SECRET_KEY


@login_required
def create_checkout_session(request):
    checkout_session = stripe.checkout.Session.create(
        customer_email=request.user.email_encrypted,
        payment_method_types=["card"],
        line_items=[
            {
                "price": settings.STRIPE_PARENT_PRICE_ID,
                "quantity": 1,
            }
        ],
        mode="subscription",
        success_url=request.build_absolute_uri("/subscribe/success/"),
        cancel_url=request.build_absolute_uri("/subscribe/"),
    )

    return redirect(checkout_session.url)


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META["HTTP_STRIPE_SIGNATURE"]
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        email = session.get("customer_email")
        customer_id = session.get("customer")

        # Look up user by email_hash for security
        if email:
            email_lower = email.lower()
            email_hash = hash_email(email_lower)
            
            # Lookup by email_hash
            user = None
            if email_hash:
                user = get_user_model().objects.filter(email_hash=email_hash).first()
            
            if user and hasattr(user, "profile"):
                parent_profile = user.profile.parent_profile
                parent_profile.is_subscribed = True
                parent_profile.stripe_customer_id = customer_id
                parent_profile.save()

    return HttpResponse(status=200)


@login_required
def subscribe_success(request):
    messages.info(
        request, "Subscription activated successfully. Welcome to the community!"
    )
    return render(request, "subscribe/success.html")


@login_required
def select_school(request):
    """Handle school selection for users with access to multiple schools."""
    request.hide_sidebar = True
    profile = request.user.profile
    
    # Parents don't select schools - they are linked via learners
    if profile.is_parent():
        return redirect('profile')
        
    # Single-school users don't need to select
    if not profile.has_multiple_schools():
        # Auto-select their only school if they have one
        school = profile.schools.first()
        if school:
            request.session['selected_school_id'] = school.id
        return redirect('profile')
    
    # Handle selection
    if request.method == 'POST':
        school_id = request.POST.get('school_id')
        next_url = request.POST.get('next', 'profile')
        
        if school_id and school_id.isdigit():
            if profile.select_school(int(school_id), request):
                return redirect(next_url)
        messages.error(request, 'Please select a valid school.')
    
    # Show selection form
    schools = profile.schools.all()
    return render(request, 'school/select_school.html', {
        'schools': schools,
        'next_url': request.GET.get('next'),
    })


@login_required
def manage_subscription(request):
    user = request.user
    profile = user.profile
    parent_profile = getattr(profile, "parent_profile", None)

    if not parent_profile:
        return redirect("profile")

    stripe_customer_id = parent_profile.stripe_customer_id

    if not stripe_customer_id:
        # fallback
        return redirect("subscribe")

    session = stripe.billing_portal.Session.create(
        customer=stripe_customer_id,
        return_url=request.build_absolute_uri("/profile/"),
    )
    return redirect(session.url)


@login_required
def learner_dashboard(request):
    """
    Progress dashboard showing charts for individual learner analytics.
    Accessible by parents (own learners) and staff (school learners).
    """
    profile = request.user.profile
    
    # Get accessible learners based on role
    if profile.is_parent():
        accessible_learners = profile.parent_profile.learners.filter(deleted=False)
    else:
        user_school = profile.get_current_school(request)
        if not user_school:
            messages.error(request, "No school assigned to your profile.")
            return redirect("profile")
        accessible_learners = Learner.objects.filter(school=user_school, deleted=False)
    
    # Get selected learner from query param or session
    learner_uuid = request.GET.get("learner")
    selected_learner = None
    
    if learner_uuid:
        try:
            selected_learner = accessible_learners.get(learner_uuid=learner_uuid)
        except Learner.DoesNotExist:
            messages.error(request, "Learner not found or access denied.")
    
    # Fall back to session or first learner
    if not selected_learner:
        selected_learner_id = request.session.get("selected_learner_id")
        if selected_learner_id:
            try:
                selected_learner = accessible_learners.get(id=selected_learner_id)
            except Learner.DoesNotExist:
                pass
    
    if not selected_learner and accessible_learners.exists():
        selected_learner = accessible_learners.first()
    
    # Get list of exercises for filter dropdown
    exercise_choices = [
        {"id": "Colourful Semantics", "name": "Colourful Semantics"},
        {"id": "Think and Find", "name": "Think and Find"},
        {"id": "Concept Quest", "name": "Concept Quest"},
        {"id": "Categorisation", "name": "Categorisation"},
        {"id": "Story Train", "name": "Story Train"},
    ]
    
    context = {
        "learners": accessible_learners,
        "selected_learner": selected_learner,
        "exercise_choices": exercise_choices,
    }
    
    return render(request, "dashboard/learner_dashboard.html", context)


@login_required
def learner_progress_data(request):
    """
    API endpoint returning JSON data for progress charts.
    Query params:
    - learner_uuid: UUID of learner (required)
    - exercise_id: Filter by specific exercise (optional)
    - date_start: Start date YYYY-MM-DD (default: 30 days ago)
    - date_end: End date YYYY-MM-DD (default: today)
    - metric: exp|exercises|accuracy|difficulty (default: exp)
    """
    from datetime import datetime, timedelta
    
    profile = request.user.profile
    learner_uuid = request.GET.get("learner_uuid")
    
    if not learner_uuid:
        return JsonResponse({"error": "learner_uuid is required"}, status=400)
    
    # Verify access to learner
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
    
    # Parse date range preset (default to last 30 days)
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
    
    # Optional exercise filter
    exercise_id = request.GET.get("exercise_id")
    metrics_param = request.GET.get("metrics", "exp")
    metrics = [m.strip() for m in metrics_param.split(",") if m.strip()]
    if not metrics:
        metrics = ["exp"]
    
    # Query exercise sessions in date range - ordered by creation time for consistent ordering
    sessions = ExerciseSession.objects.filter(
        learner=learner,
        created_at__date__gte=date_start,
        created_at__date__lte=date_end,
    ).order_by('created_at')
    
    if exercise_id and exercise_id != "all":
        sessions = sessions.filter(exercise_id=exercise_id)
    
    # Get cumulative baseline (sessions before date_start)
    prior_sessions = ExerciseSession.objects.filter(
        learner=learner,
        created_at__date__lt=date_start
    )
    if exercise_id and exercise_id != "all":
        prior_sessions = prior_sessions.filter(exercise_id=exercise_id)
    
    cumulative_exp_baseline = prior_sessions.count() * 10
    cumulative_exercises_baseline = prior_sessions.count()
    
    # Build timestamps and metric values, one per session
    timestamps = []
    
    # Initialize values list for each metric
    metric_values = {m: [] for m in metrics}
    cumulative_exp = cumulative_exp_baseline
    cumulative_exercises = cumulative_exercises_baseline
    
    # Process each session as a data point
    for session in sessions:
        timestamps.append(session.created_at.isoformat())
        
        for metric in metrics:
            if metric == "exp":
                cumulative_exp += 10
                metric_values[metric].append(cumulative_exp)
            elif metric == "exercises":
                cumulative_exercises += 1
                metric_values[metric].append(cumulative_exercises)
            elif metric == "accuracy":
                if session.total_questions > 0:
                    correct = session.total_questions - session.incorrect_answers
                    accuracy = (correct / session.total_questions) * 100
                    metric_values[metric].append(round(accuracy, 1))
                else:
                    metric_values[metric].append(0)
            elif metric == "difficulty":
                try:
                    difficulty_val = int(session.difficulty_selected)
                    metric_values[metric].append(difficulty_val)
                except (ValueError, TypeError):
                    metric_values[metric].append(None)
            elif metric == "time_elapsed":
                if session.completed_at and session.started_at:
                    time_diff = session.completed_at - session.started_at
                    time_minutes = round(time_diff.total_seconds() / 60, 2)
                    metric_values[metric].append(time_minutes)
                else:
                    metric_values[metric].append(None)
    
    # Build metrics_data with all values collected
    metrics_data = []
    for metric in metrics:
        metrics_data.append({
            "metric": metric,
            "values": metric_values[metric],
        })
    
    # Build response with timestamps as x-axis
    response_data = {
        "timestamps": timestamps,
        "metrics_data": metrics_data,
        "learner_name": learner.name,
        "exercise_id": exercise_id or "all",
        "date_start": date_start.strftime("%Y-%m-%d"),
        "date_end": date_end.strftime("%Y-%m-%d"),
        "session_count": len(timestamps),
    }
    
    return JsonResponse(response_data)


def terms_and_conditions(request):
    request.hide_sidebar = True
    return render(request, "legal/terms.html")

def privacy_policy(request):
    request.hide_sidebar = True
    return render(request, "legal/privacy.html")

def data_policy(request):
    request.hide_sidebar = True
    return render(request, "legal/data-policy.html")