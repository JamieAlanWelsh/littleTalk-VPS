import json
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from littleTalkApp.models import Learner

def hi_from_react(request):
    """Original proof-of-concept React route."""
    return render(request, "hello_from_react.html")

@login_required
def sentence_matching_example(request):
    """
    Example exercise using the React framework.
    Renders a sentence-to-picture matching exercise with fixture data.
    """

    learner_id = request.session.get("selected_learner_id")
    learner_uuid = None
    if learner_id:
        learner = Learner.objects.get(id=learner_id)
        learner_uuid = str(learner.learner_uuid)
    
    context = {
        "learner_uuid": learner_uuid,
    }
    
    return render(request, "exercises/sentence_matching_example.html", context)

def colourful_semantics(request):
    return render(request, "exercises/colourful_semantics.html")
