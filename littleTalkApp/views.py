# Django core
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseRedirect
from django.urls import reverse
from django.contrib import messages
from django.conf import settings
from django.core.mail import send_mail
from django.middleware.csrf import get_token
from django.http import HttpResponse

# Django auth
from django.contrib.auth import login, authenticate, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.views import LoginView

# Third-party (DRF)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# Local app: forms
from .forms import (
    UserRegistrationForm,
    LearnerForm,
    CustomAuthenticationForm,
    LogEntryForm,
    UserUpdateForm,
    PasswordUpdateForm,
    CohortForm,
)

# Local app: models
from .models import (
    Profile,
    Learner,
    LearnerAssessmentAnswer,
    LogEntry,
    Cohort,
)

# Local app: serializers
from .serializers import LearnerExpUpdateSerializer

# Local app: other
from .game_data import GAME_DESCRIPTIONS
from .assessment_qs import QUESTIONS, RECOMMENDATIONS

# Python stdlib
from collections import defaultdict
import json


def home(request):
    request.hide_sidebar = True
    if request.user.is_authenticated:
        return redirect('/practise/')
    return render(request, 'landing.html')

def schools(request):
    request.hide_sidebar = True
    return render(request, 'schools.html')

# This view will serve the first question when the assessment starts
def start_assessment(request):
    request.hide_sidebar = True

    # Check for retake
    retake_id = request.GET.get("retake")
    if retake_id:
        request.session["retake_learner_id"] = int(retake_id)

    # Reset assessment session state
    request.session["assessment_answers"] = []
    request.session["assessment_complete"] = False
    request.session["current_question_index"] = 1
    request.session["previous_question_id"] = None

    # Get the first question
    first_question = QUESTIONS[0]
    total_questions = len(QUESTIONS)

    # Store the current question index and other relevant info in the session
    request.session['current_question_index'] = 1
    request.session['previous_question_id'] = None

    return render(request, 'assessment/assessment_form.html', {
    'question': first_question,
    'total_questions': total_questions,
    'current_question_index': 1,
    'user_logged_in': request.user.is_authenticated,
    'questions_json': json.dumps(QUESTIONS),
})


def save_all_assessment_answers(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request'}, status=400)

    try:
        data = json.loads(request.body)
        # Example data: { "1": "Yes", "2": "No", ... }

        request.session['assessment_answers'] = data
        request.session['assessment_complete'] = True

        # Compute where to redirect user
        if request.user.is_authenticated:
            if request.session.get("retake_learner_id"):
                redirect_url = "/assessment/save-retake/"
            else:
                redirect_url = "/add-learner/"
        else:
            redirect_url = "/register/"

        return JsonResponse({'redirect_url': redirect_url})

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)


# Saves and assigns learners assessment answers and recommendations
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

    strong_skills = [skill for skill, responses in skill_answers.items() if "No" not in responses]
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

    selected_id = request.session.get('selected_learner_id')
    if selected_id:
        learner = Learner.objects.filter(id=selected_id, user=request.user).first()
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

    return render(request, 'assessment/summary.html', {
        "answers": answers,
        "strong_skills": strong_skills,
        "needs_support_skills": needs_support_skills,
        "readiness_status": readiness_status,
        "learner": learner,
    })


@login_required
def save_retake_assessment(request):
    learner_id = request.session.get("retake_learner_id")
    answers = request.session.get("assessment_answers", {})

    if not learner_id:
        return redirect("profile")

    learner = Learner.objects.filter(id=learner_id, user=request.user).first()
    if not learner:
        return redirect("profile")

    save_assessment_for_learner(learner, answers)

    request.session["selected_learner_id"] = learner.id
    request.session.pop("retake_learner_id", None)
    request.session.pop("assessment_answers", None)
    request.session.pop("assessment_complete", None)

    return redirect("assessment_summary")


@login_required
def practise(request):
    selected_learner_id = request.session.get('selected_learner_id')
    learner_selected = False
    selected_learner = None
    recommendation = None

    if selected_learner_id:
        selected_learner = Learner.objects.filter(id=selected_learner_id).first()
        learner_selected = selected_learner is not None

        if learner_selected and selected_learner.recommendation_level is not None:
            level = selected_learner.recommendation_level
            recommendation = RECOMMENDATIONS[level] if level < len(RECOMMENDATIONS) else None

    context = {
        'learner_selected': learner_selected,
        'selected_learner': selected_learner,
        'recommendation': recommendation,
        'game_descriptions': GAME_DESCRIPTIONS,
    }

    return render(request, 'practise.html', context)


@login_required
def logbook(request):
    selected_learner_id = request.GET.get('learner')
    selected_cohort_id = request.GET.get('cohort')

    log_entries = LogEntry.objects.filter(user=request.user, deleted=False)
    learners = Learner.objects.filter(user=request.user, deleted=False)
    cohorts = Cohort.objects.filter(user=request.user)

    # Filter learners by cohort
    if selected_cohort_id:
        learners = learners.filter(cohort__id=selected_cohort_id)

    # Filter log entries by learner
    if selected_learner_id:
        log_entries = log_entries.filter(learner__id=selected_learner_id)
    elif selected_cohort_id:
        # Filter log entries by learners in selected cohort
        log_entries = log_entries.filter(learner__cohort__id=selected_cohort_id)

    log_entries = log_entries.order_by('-timestamp')

    return render(request, 'logbook/logbook.html', {
        'log_entries': log_entries,
        'learners': learners,
        'cohorts': cohorts,
        'selected_learner_id': selected_learner_id,
        'selected_cohort_id': selected_cohort_id,
    })


@login_required
def new_log_entry(request):
    selected_learner_id = request.session.get('selected_learner_id')

    if request.method == "POST":
        form = LogEntryForm(request.POST, user=request.user)
        if form.is_valid():
            log_entry = form.save(commit=False)
            log_entry.user = request.user  # Assign the logged-in user
            log_entry.save()
            return redirect('logbook')  # Redirect to logbook page after saving
    else:
        initial = {}
        if selected_learner_id:
            initial['learner'] = selected_learner_id  # pre-fill selected learner
        form = LogEntryForm(user=request.user, initial=initial)

    return render(request, 'logbook/new_log_entry.html', {'form': form})

@login_required
def log_entry_detail(request, entry_id):
    log_entry = get_object_or_404(LogEntry, id=entry_id, user=request.user)
    return render(request, 'logbook/log_entry_detail.html', {'log_entry': log_entry})

@login_required
def edit_log_entry(request, entry_id):
    log_entry = get_object_or_404(LogEntry, id=entry_id, user=request.user)

    if request.method == "POST":
        form = LogEntryForm(request.POST, instance=log_entry, user=request.user)
        if form.is_valid():
            form.save()
            return redirect('log_entry_detail', entry_id=log_entry.id)
    else:
        form = LogEntryForm(instance=log_entry, user=request.user)

    return render(request, 'logbook/new_log_entry.html', {
        'form': form,
        'is_editing': True,
        'log_entry': log_entry
    })

@login_required
def delete_log_entry(request, entry_id):
    log_entry = get_object_or_404(LogEntry, id=entry_id, user=request.user)
    log_entry.deleted = True  # Soft delete the entry
    log_entry.save()
    return JsonResponse({"success": True})


def generate_summary(request, learner_id):
    learner = get_object_or_404(Learner, id=learner_id)
    log_entries = LogEntry.objects.filter(
        user=request.user,
        learner=learner,
        deleted=False
    ).order_by("timestamp")

    return render(request, "logbook/log_summary.html", {
        "learner": learner,
        "log_entries": log_entries
    })


@login_required
def game_description(request, game_name):
    game = GAME_DESCRIPTIONS.get(game_name, None)
    if not game:
        return render(request, '404.html', status=404)  # Return a 404 if the game name is invalid
    
    return render(request, 'game_description.html', {'game': game})


class CustomLoginView(LoginView):
    template_name = 'registration/login.html'  # Use your custom template
    redirect_authenticated_user = True  # Redirect logged-in users to a specific page
    authentication_form = CustomAuthenticationForm  # Use custom form to lowercase username

    def dispatch(self, request, *args, **kwargs):
        # Set request.hide_panels to True before processing the request
        request.hide_sidebar = True
        return super().dispatch(request, *args, **kwargs)


def register(request):
    request.hide_sidebar = True

    # Prevent access unless assessment is complete
    if not request.session.get('assessment_complete'):
        return redirect('start_assessment')

    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data.get('email').lower()
            password = form.cleaned_data.get('password1')
            first_name = form.cleaned_data.get('first_name')
            learner_name = form.cleaned_data.get('learner_name')
            learner_dob = form.cleaned_data.get('learner_dob')
            hear_about = form.cleaned_data.get('hear_about')
            agree_updates = form.cleaned_data.get('agree_updates')

            # Create user
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
            )

            # Create user profile
            Profile.objects.create(
                user=user,
                first_name=first_name,
                hear_about=hear_about,
                opted_in=agree_updates,
            )

            # Create learner
            learner = Learner.objects.create(
                user=user,
                name=learner_name,
                date_of_birth=learner_dob,
            )

            # Save answers using our helper
            answers = request.session.get("assessment_answers", {})
            save_assessment_for_learner(learner, answers)

            # Log in the user
            login(request, user)

            # Select the learner
            request.session['selected_learner_id'] = learner.id

            # Clean up session
            request.session.pop("assessment_answers", None)
            request.session.pop("assessment_complete", None)

            return redirect("assessment_summary")
    else:
        form = UserRegistrationForm()

    return render(request, 'registration/register.html', {'form': form})


# def comingsoon(request):
#     request.hide_sidebar = True
#     if request.method == "POST":
#         form = WaitingListForm(request.POST)
#         if form.is_valid():
#             form.save()
#             messages.success(request, "You've been added to the waiting list!")
#             return redirect("comingsoon")
#         else:
#             messages.error(request, "Invalid email or already registered.")
#     else:
#         form = WaitingListForm()

#     return render(request, "registration/comingsoon.html", {"form": form})


# @login_required
# def custom_logout_view(request):
#     if request.method == 'POST':
#         logout(request)
#         return redirect('login')  # Redirect to the login page after logging out
#     return render(request, 'logout_confirm.html')  # Show confirmation page


@login_required
def profile(request):
    # All learners for this user (not deleted)
    all_learners = Learner.objects.filter(user=request.user, deleted=False)

    # Get all distinct cohorts for the dropdown
    cohorts = Cohort.objects.filter(learner__in=all_learners).distinct()

    # Get selected cohort from GET params
    selected_cohort = request.GET.get('cohort')
    try:
        if selected_cohort:
            selected_cohort_id = int(selected_cohort)
            learners = all_learners.filter(cohort__id=selected_cohort_id)
        else:
            learners = all_learners
            selected_cohort_id = None
    except ValueError:
        # Invalid cohort ID
        learners = all_learners
        selected_cohort_id = None

    # Get selected learner from session (safe)
    selected_learner = None
    selected_learner_id = request.session.get('selected_learner_id')
    try:
        if selected_learner_id not in [None, '']:
            selected_learner = Learner.objects.get(id=int(selected_learner_id), user=request.user, deleted=False)
    except (ValueError, Learner.DoesNotExist):
        selected_learner = None

    return render(request, 'profile/profile.html', {
        'learners': learners,
        'selected_learner': selected_learner,
        'cohorts': cohorts,
        'selected_cohort': selected_cohort_id,
    })


@login_required
def add_learner(request):
    # Prevent access unless assessment is complete
    if not request.session.get('assessment_complete'):
        return redirect('start_assessment')

    if request.method == 'POST':
        form = LearnerForm(request.POST, user=request.user)
        if form.is_valid():
            learner = form.save(commit=False)
            learner.user = request.user
            learner.save()

            # Store as selected learner
            request.session['selected_learner_id'] = learner.id

            # Get answers from session
            answers = request.session.get("assessment_answers", {})

            # Save answers and compute metrics helper function
            save_assessment_for_learner(learner, answers)

            # Clean up session
            request.session.pop("assessment_answers", None)
            request.session.pop("assessment_complete", None)

            return redirect('/assessment/summary/')
    else:
        form = LearnerForm(user=request.user)

    return render(request, 'profile/add_learner.html', {'form': form})


@login_required
def select_learner(request):
    if request.method == 'POST':
        learner_id = request.POST.get('learner_id')
        if learner_id:
            request.session['selected_learner_id'] = learner_id  # Store selected learner in session
    return HttpResponseRedirect(reverse('profile'))  # Redirect back to the profile page


@login_required
def edit_learner(request, learner_uuid):
    learner = get_object_or_404(Learner, learner_uuid=learner_uuid, user=request.user)

    if request.method == 'POST':
        if 'remove' in request.POST:  # Check if the remove button was clicked
            return redirect('confirm_delete_learner', learner_uuid=learner.learner_uuid)
        
        form = LearnerForm(request.POST, instance=learner, user=request.user)
        if form.is_valid():
            form.save()
            return redirect('profile') 
    else:
        form = LearnerForm(instance=learner, user=request.user)

    context = {
        'form': form,
        'learner': learner,
    }
    return render(request, 'profile/edit_learner.html', context)


@login_required
def confirm_delete_learner(request, learner_uuid):
    learner = get_object_or_404(Learner, learner_uuid=learner_uuid, user=request.user)

    if request.method == 'POST':
        password = request.POST.get('password')
        user = authenticate(request, username=request.user.username, password=password)

        if user is not None:
            # User authenticated, mark the learner as deleted
            learner.deleted = True
            learner.save()

            # Soft-delete all log entries linked to this learner
            LogEntry.objects.filter(learner=learner, user=request.user, deleted=False).update(deleted=True)

            # Clear session and redirect
            del request.session['selected_learner_id']
            return redirect('profile')  # Redirect to the profile page after deletion
        else:
            # If authentication fails, show an error
            error_message = "Incorrect password. Please try again."
            return render(request, 'profile/confirm_delete_learner.html', {'learner': learner, 'error_message': error_message})

    return render(request, 'profile/confirm_delete_learner.html', {'learner': learner})


# COHORT

@login_required
def cohort_list(request):
    cohorts = Cohort.objects.filter(user=request.user).order_by('name')
    return render(request, 'cohorts/cohort_list.html', {'cohorts': cohorts})

@login_required
def cohort_create(request):
    if request.method == 'POST':
        form = CohortForm(request.POST)
        if form.is_valid():
            cohort = form.save(commit=False)
            cohort.user = request.user
            cohort.save()
            return redirect('cohort_list')
    else:
        form = CohortForm()
    return render(request, 'cohorts/cohort_form.html', {'form': form, 'is_editing': False})

@login_required
def cohort_edit(request, cohort_id):
    cohort = get_object_or_404(Cohort, id=cohort_id, user=request.user)
    if request.method == 'POST':
        form = CohortForm(request.POST, instance=cohort)
        if form.is_valid():
            form.save()
            return redirect('cohort_list')
    else:
        form = CohortForm(instance=cohort)
    return render(request, 'cohorts/cohort_form.html', {'form': form, 'is_editing': True})

@login_required
def cohort_delete(request, cohort_id):
    cohort = get_object_or_404(Cohort, id=cohort_id, user=request.user)

    if request.method == 'POST':
        password = request.POST.get('password')
        user = authenticate(username=request.user.username, password=password)

        if user is not None:
            cohort.delete()
            return redirect('cohort_list')
        else:
            error_message = "Incorrect password. Please try again."
            return render(request, 'cohorts/cohort_confirm_delete.html', {
                'cohort': cohort,
                'error_message': error_message
            })

    return render(request, 'cohorts/cohort_confirm_delete.html', {'cohort': cohort})


# SETTINGS

@login_required
def settings_view(request):
    user_form = UserUpdateForm(instance=request.user)
    password_form = PasswordUpdateForm(user=request.user)

    return render(request, 'settings.html', {
        'user_form': user_form,
        'password_form': password_form
    })


@login_required
def change_user_details(request):
    if request.method == 'POST':
        user_form = UserUpdateForm(request.POST, instance=request.user)
        password_form = PasswordUpdateForm(user=request.user)  # Ensure password form is included

        if user_form.is_valid():
            user = user_form.save(commit=False)
            user.username = user.email  # Keep username in sync with email
            user.first_name = user.first_name
            user.save()
            messages.success(request, "Your details have been updated successfully!")
            return redirect('settings')
        else:
            messages.error(request, "Error updating details. Please try again.")

    else:
        user_form = UserUpdateForm(instance=request.user)
        password_form = PasswordUpdateForm(user=request.user)

    return render(request, 'settings.html', {
        'user_form': user_form,
        'password_form': password_form
    })



@login_required
def change_password(request):
    if request.method == 'POST':
        user_form = UserUpdateForm(instance=request.user)  # Ensure email form is included
        password_form = PasswordUpdateForm(request.user, request.POST)

        if password_form.is_valid():
            new_password = password_form.cleaned_data.get("new_password")
            request.user.set_password(new_password)
            request.user.save()
            update_session_auth_hash(request, request.user)

            messages.success(request, "Your password has been updated successfully!")
            return redirect('settings')
        else:
            messages.error(request, "Error updating password. Please try again.")

    return render(request, 'settings.html', {
        'user_form': user_form,
        'password_form': password_form
    })


# API VIEWS

class UpdateLearnerExpAPIView(APIView):
    def post(self, request, learner_id):
        try:
            learner = Learner.objects.get(id=learner_id)
        except Learner.DoesNotExist:
            return Response({"detail": "Learner not found."}, status=status.HTTP_404_NOT_FOUND)

        new_exp = request.data.get("exp")
        if new_exp is None:
            return Response({"detail": "Experience points are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            new_exp = int(new_exp)
            learner.exp += new_exp
            learner.save()

            serializer = LearnerExpUpdateSerializer(learner)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError:
            return Response({"detail": "Invalid experience points value."}, status=status.HTTP_400_BAD_REQUEST)


def get_selected_learner(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    csrf_token = get_token(request)  # Get CSRF token

    selected_learner_id = request.session.get('selected_learner_id')  # Retrieve the selected learner from the session

    selected_learner = None

    if selected_learner_id:
        selected_learner = Learner.objects.get(id=selected_learner_id)
        return JsonResponse({'learner_id': selected_learner_id, 'csrf_token': csrf_token, 'cs_level': selected_learner.assessment2})
    return JsonResponse({'error': 'No learner selected'}, status=400)


def support(request):
    request.hide_sidebar = True
    return render(request, 'support.html', {})


def send_support_email(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        message = request.POST.get('message')

        full_message = f"Message from {name} <{email}>:\n\n{message}"

        send_mail(
            subject='Support Request - LittleTalk',
            message=full_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['jw.jamiewelsh@gmail.com'],  # Change to your support email
            fail_silently=False,
        )
        return render(request, 'support.html', {'message_sent': True})
    
    return redirect('support')

def tips(request):
    return render(request, 'tips.html', {})

def method(request):
    context = {
        'game_descriptions': GAME_DESCRIPTIONS,
    }
    return render(request, 'method.html', context)