from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from littleTalkApp.assessment_qs import RECOMMENDATIONS
from littleTalkApp.game_data import GAME_DESCRIPTIONS
from littleTalkApp.models import Learner


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
            recommendation = RECOMMENDATIONS[level] if level < len(RECOMMENDATIONS) else None

    context = {
        "learner_selected": learner_selected,
        "selected_learner": selected_learner,
        "recommendation": recommendation,
        "game_descriptions": GAME_DESCRIPTIONS,
    }

    return render(request, "practise/practise.html", context)
