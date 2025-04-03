from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from django.contrib.auth import logout
from django.contrib.auth.models import User
from .forms import UserRegistrationForm
from .models import Profile
from .forms import LearnerForm
from .models import Learner
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import LearnerExpUpdateSerializer
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.contrib.auth.views import LoginView
from .forms import WaitingListForm
from .forms import CustomAuthenticationForm
from django.contrib import messages
from .models import LogEntry
from .forms import LogEntryForm
from .forms import UserUpdateForm
from .forms import PasswordUpdateForm
from django.contrib.auth import update_session_auth_hash
from django.core.mail import send_mail
from django.conf import settings


def home(request):
    request.hide_sidebar = True
    if request.user.is_authenticated:
        return redirect('/practise/')
    return render(request, 'landing.html')


@login_required
def practise(request):
    selected_learner_id = request.session.get('selected_learner_id')
    learner_selected = False
    selected_learner = None

    if selected_learner_id:
        # Fetch the learner object from the database
        selected_learner = Learner.objects.filter(id=selected_learner_id).first()
        learner_selected = selected_learner is not None

    return render(request, 'practise.html', {
        'learner_selected': learner_selected,
        'selected_learner': selected_learner,
    })


@login_required
def logbook(request):
    log_entries = LogEntry.objects.filter(user=request.user, deleted=False).order_by('-timestamp')
    return render(request, 'logbook/logbook.html', {'log_entries': log_entries})

@login_required
def new_log_entry(request):
    if request.method == "POST":
        form = LogEntryForm(request.POST, user=request.user)
        if form.is_valid():
            log_entry = form.save(commit=False)
            log_entry.user = request.user  # Assign the logged-in user
            log_entry.save()
            return redirect('logbook')  # Redirect to logbook page after saving
    else:
        form = LogEntryForm(user=request.user)  # Pass user to filter learners

    return render(request, 'logbook/new_log_entry.html', {'form': form})

@login_required
def log_entry_detail(request, entry_id):
    log_entry = get_object_or_404(LogEntry, id=entry_id, user=request.user)
    return render(request, 'logbook/log_entry_detail.html', {'log_entry': log_entry})

@login_required
def delete_log_entry(request, entry_id):
    log_entry = get_object_or_404(LogEntry, id=entry_id, user=request.user)
    log_entry.deleted = True  # Soft delete the entry
    log_entry.save()
    return JsonResponse({"success": True})


@login_required
def game_description(request, game_name):
    game_descriptions = {
        'colourful_semantics': {
            'title': 'Colourful Semantics',
            'quote': '"By visually categorising words into color groups, children can more easily make connections between words and their syntactic roles, facilitating improved comprehension and memory retention" (Bryan, 2020).',
            'description': "Colourful Semantics is a system for colour coding sentences according to the role of different words. It can help children to break down sentences and understand the individual meaning of each word and its role in the sentence. It can help children to better understand word order. Children can use colourful semantics to build up meaningful, well structured sentences.",
            'description2': "Colourful Semantics aims to enhance children's understanding of word meanings, helps children understand word order, and helps children build meaningful sentences. By using Colourful Semantics, children not only expand their vocabulary but also improve their ability to answer questions and develop narrative skills.",
            'description3': 'The Colourful Semantics exercise will ask your child to build a sentence based on a picture on the screen. Your child will have to then drag the correct pictures into the corresponding boxes to make a sentence eg. "The children are building a sandcastle"',
            'description4': "",
            'learninglevel': "Colourful Semantics features an Auto button which automatically chooses a learning level, which serves as a good way to get started. You can then adjust this manually to match your child's needs as you see fit.",
            'video_id': 'FcdA00Tj5N0',
            'static_name': 'colourful_semantics',
        },
        'think_and_find': {
            'title': 'Think and Find',
            'quote': '"Linking items to concepts helps children structure their thoughts and enhances memory and retrieval capabilities" (Anderson & Freebody, 1981).',
            'description': "Think and Find is an activity designed to enhance children's language skills and cognitive development. This exercise helps children connect tangible items with abstract concepts, facilitating deeper understanding and language use. By associating specific items with broader concepts, children learn to identify items based on similarities and differences, aiding in information processing and decision-making.",
            'description2': "This method not only supports the integration of new information but also significantly boosts vocabulary development and comprehension. For children experiencing language difficulties, this activity can be particularly beneficial in improving their ability to organise and recall words.",
            'description3': "The Think and Find exercise will ask your child to find the correct item out of a number of options. For example, your child might be asked to find the ‘bear with the yellow hat’ out of a choice of four bears. Your child will then have to click on the correct option.",
            'description4': "",
            'learninglevel': "We recommnend starting your learner at the lowest learning level and gradually increasing the number of choices to match your child's ability",
            'video_id': '',
            'static_name': 'think_and_find',
        },
        'categorisation': {
            'title': 'Categorisation',
            'quote': '“Arranging thoughts, concepts and words into categories facilitate meaning, memory and retrieval” (Roth & Troia, 2005)',
            'description': "Categorisation is an exercise designed to help children process and store information. Categorisation is important for language development as it teaches children to group ideas, process information, store and retrieve ideas and describe items.",
            'description2': "Categorisation allows children to make a connection between words based upon similarities and differences.Working on categorisation is a great way to build and expand vocabulary. Expanding vocabulary through categorisation allows for better comprehension and helps to store information. Some children with language difficulties can have a hard time organising and remembering words, but categorisation is a great way to develop this skill!",
            'description3': "The categorisation exercise will ask your child to sort different items into groups. For example, your child will be asked to find zoo animals, clothes and fruit. Your child then needs to select the correct items and drag them into the corresponding box.",
            'description4': "",
            'learninglevel': "We recommend starting your learner at the lowest learning level and gradually increasing the number of choices to match your child's ability",
            'video_id': '',
            'static_name': 'categorisation',
        },
    }
    game = game_descriptions.get(game_name, None)
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
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            # Create and save the user
            email = form.cleaned_data.get('email').lower()
            password = form.cleaned_data.get('password1')
            first_name = form.cleaned_data.get('first_name')
            # Create user
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
            )
            # Explicitly create or update the Profile
            Profile.objects.create(user=user, first_name=first_name)
            # Log the user in and redirect to home
            login(request, user)
            return redirect('profile')
    else:
        form = UserRegistrationForm()

    return render(request, 'registration/register.html', {'form': form})


def comingsoon(request):
    request.hide_sidebar = True
    if request.method == "POST":
        form = WaitingListForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "You've been added to the waiting list!")
            return redirect("comingsoon")
        else:
            messages.error(request, "Invalid email or already registered.")
    else:
        form = WaitingListForm()

    return render(request, "registration/comingsoon.html", {"form": form})


# @login_required
# def custom_logout_view(request):
#     if request.method == 'POST':
#         logout(request)
#         return redirect('login')  # Redirect to the login page after logging out
#     return render(request, 'logout_confirm.html')  # Show confirmation page


@login_required
def profile(request):
    # Fetch learners for the logged-in user, excluding the ones marked as deleted
    learners = Learner.objects.filter(user=request.user, deleted=False)

    # Get the selected learner from the session (if any)
    selected_learner_id = request.session.get('selected_learner_id', None)
    selected_learner = None
    if selected_learner_id:
        selected_learner = Learner.objects.get(id=selected_learner_id)

    return render(request, 'profile/profile.html', {
        'learners': learners,
        'selected_learner': selected_learner
    })


@login_required
def add_learner(request):
    if request.method == 'POST':
        form = LearnerForm(request.POST)
        if form.is_valid():
            learner = form.save(commit=False)
            learner.user = request.user  # Associate the learner with the logged-in user
            learner.save()
            # Automatically select the newly added learner by storing their ID in the session
            request.session['selected_learner_id'] = learner.id
            return redirect('profile')  # Redirect back to the profile page
    else:
        form = LearnerForm()

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
        
        form = LearnerForm(request.POST, instance=learner)
        if form.is_valid():
            form.save()
            return redirect('profile') 
    else:
        form = LearnerForm(instance=learner)

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
            del request.session['selected_learner_id']
            return redirect('profile')  # Redirect to the profile page after deletion
        else:
            # If authentication fails, show an error
            error_message = "Incorrect password. Please try again."
            return render(request, 'confirm_delete_learner.html', {'learner': learner, 'error_message': error_message})

    return render(request, 'profile/confirm_delete_learner.html', {'learner': learner})


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
    return render(request, 'method.html', {})