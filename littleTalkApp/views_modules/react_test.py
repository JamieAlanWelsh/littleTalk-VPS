from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from littleTalkApp.models import Learner


def _get_session_learner_uuid(request):
    learner_id = request.session.get("selected_learner_id")
    if not learner_id:
        return None

    learner = Learner.objects.get(id=learner_id)
    return str(learner.learner_uuid)


def hi_from_react(request):
    """Original proof-of-concept React route."""
    return render(request, "hello_from_react.html")


@login_required
def sentence_matching_example(request):
    """
    Example exercise using the React framework.
    Renders a sentence-to-picture matching exercise with fixture data.
    """
    context = {
        "learner_uuid": _get_session_learner_uuid(request),
    }
    return render(request, "exercises/sentence_matching_example.html", context)

@login_required
def categorisation_example(request):
    """
    Categorisation exercise using the React framework.
    Renders a categorisation exercise where users group items into categories.
    """

    learner_id = request.session.get("selected_learner_id")
    learner_uuid = None
    if learner_id:
        learner = Learner.objects.get(id=learner_id)
        learner_uuid = str(learner.learner_uuid)
    
    context = {
        "learner_uuid": learner_uuid,
    }
    
    return render(request, "exercises/categorisation.html", context)

@login_required
def think_and_find(request):
    """React-based Think & Find exercise demo."""
    context = {
        "learner_uuid": _get_session_learner_uuid(request),
    }
    return render(request, "exercises/think_and_find.html", context)


@login_required
def concept_quest(request):
    """React-based Concept Quest exercise demo."""
    context = {
        "learner_uuid": _get_session_learner_uuid(request),
    }
    return render(request, "exercises/concept_quest.html", context)


@login_required
def colourful_semantics(request):
    context = {
        "learner_uuid": _get_session_learner_uuid(request),
    }
    return render(request, "exercises/colourful_semantics.html", context)


@login_required
def story_train(request):
    context = {
        "learner_uuid": _get_session_learner_uuid(request),
    }
    return render(request, "exercises/story_train.html", context)


@login_required
def whats_in_the_bag(request):
    context = {
        "learner_uuid": _get_session_learner_uuid(request),
    }
    return render(request, "exercises/whats_in_the_bag.html", context)
