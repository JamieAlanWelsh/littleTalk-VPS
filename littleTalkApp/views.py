from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from django.contrib.auth import logout
from django.contrib.auth.models import User
from .forms import UserRegistrationForm
from .models import Profile
from .forms import LearnerForm
from .models import Learner


def home(request):
    return render(request, 'home.html')


@login_required
def game_description(request, game_name):
    game_descriptions = {
        'colourful_semantics': {
            'title': 'Colourful Semantics',
            'description': 'Colourful semantics is an approach designed to support children developing their understanding of sentence structure and expand the length of their sentences.',
            'description2': 'The structure of a sentence (syntax) is colour coded and then these are linked to their meaning (semantics)',
            'link': 'https://jamiealanwelsh.github.io/colour-semantics-webgl/',
            'video_id': 'FcdA00Tj5N0',
        },
        'exercise2': {
            'title': 'Exercise 2',
            'description': 'Another fun learning activity.',
            'description2': '',
            'link': 'https://jamiealanwelsh.github.io/exercise2/',
            'video_id': '',
        },
    }
    game = game_descriptions.get(game_name, None)
    if not game:
        return render(request, '404.html', status=404)  # Return a 404 if the game name is invalid
    
    return render(request, 'game_description.html', {'game': game})


def register(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            # Create and save the user
            email = form.cleaned_data.get('email')
            password = form.cleaned_data.get('password1')
            first_name = form.cleaned_data.get('first_name')
            last_name = form.cleaned_data.get('last_name')
            # Create user
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            # Explicitly create or update the Profile
            Profile.objects.create(user=user, first_name=first_name, last_name=last_name)
            # Log the user in and redirect to home
            login(request, user)
            return redirect('home')
    else:
        form = UserRegistrationForm()

    return render(request, 'registration/register.html', {'form': form})


@login_required
def custom_logout_view(request):
    if request.method == 'POST':
        logout(request)
        return redirect('home')  # Redirect to the home page after logging out
    return render(request, 'logout_confirm.html')  # Show confirmation page


def profile(request):
    learners = Learner.objects.filter(user=request.user)
    return render(request, 'profile.html', {'learners': learners})


def add_learner(request):
    if request.method == 'POST':
        form = LearnerForm(request.POST)
        if form.is_valid():
            learner = form.save(commit=False)
            learner.user = request.user  # Associate the learner with the logged-in user
            learner.save()
            return redirect('profile')  # Redirect back to the profile page
    else:
        form = LearnerForm()

    return render(request, 'add_learner.html', {'form': form})