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


def home(request):
    request.hide_sidebar = True
    if request.user.is_authenticated:
        return redirect('/practice/')
    return render(request, 'home.html')


@login_required
def practice(request):
    selected_learner_id = request.session.get('selected_learner_id')
    learner_selected = False
    selected_learner = None

    if selected_learner_id:
        # Fetch the learner object from the database
        selected_learner = Learner.objects.filter(id=selected_learner_id).first()
        learner_selected = selected_learner is not None

    return render(request, 'practice.html', {
        'learner_selected': learner_selected,
        'selected_learner': selected_learner,
    })


# def about(request):
#     return render(request, 'about.html')


@login_required
def game_description(request, game_name):
    game_descriptions = {
        'colourful_semantics': {
            'title': 'Colourful Semantics',
            'description': 'Colourful semantics is an approach designed to support children developing their understanding of sentence structure and expand the length of their sentences.',
            'description2': 'The structure of a sentence (syntax) is colour coded and then these are linked to their meaning (semantics)',
            'link': 'https://jamiealanwelsh.github.io/colour-semantics-webgl/',
            'video_id': 'FcdA00Tj5N0',
            'static_name': 'colourful_semantics',
        },
        'categorisation': {
            'title': 'Exercise 2',
            'description': 'Another fun learning activity.',
            'description2': '',
            'link': 'https://jamiealanwelsh.github.io/exercise2/',
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

    return render(request, "comingsoon.html", {"form": form})


@login_required
def custom_logout_view(request):
    if request.method == 'POST':
        logout(request)
        return redirect('login')  # Redirect to the login page after logging out
    return render(request, 'logout_confirm.html')  # Show confirmation page


@login_required
def profile(request):
    # Fetch learners for the logged-in user, excluding the ones marked as deleted
    learners = Learner.objects.filter(user=request.user, deleted=False)

    # Get the selected learner from the session (if any)
    selected_learner_id = request.session.get('selected_learner_id', None)
    selected_learner = None
    if selected_learner_id:
        selected_learner = Learner.objects.get(id=selected_learner_id)

    return render(request, 'profile.html', {
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

    return render(request, 'add_learner.html', {'form': form})


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
    return render(request, 'edit_learner.html', context)


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

    return render(request, 'confirm_delete_learner.html', {'learner': learner})


# def colourful_semantics_view(request):
#     # Get the CSRF token
#     csrf_token = get_token(request)

#     # Pass the CSRF token to the template context
#     return render(request, 'exercises/index.html', {'csrf_token': csrf_token})


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
    return render(request, 'support.html', {})