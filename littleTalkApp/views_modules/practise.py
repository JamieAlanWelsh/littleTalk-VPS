from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from littleTalkApp.content import GAME_DESCRIPTIONS, RECOMMENDATIONS
from littleTalkApp.models import Learner


PRACTISE_STAGES = {
    1: {
        "label": "Stage 1 - Foundations",
        "exercises": ["colourful_semantics", "think_and_find"],
    },
    2: {
        "label": "Stage 2 - Building Language",
        "exercises": ["concept_quest", "categorisation"],
    },
    3: {
        "label": "Stage 3 - Advanced Language",
        "exercises": ["story_train"],
    },
}


RECOMMENDATION_LEVEL_TO_STAGE = {
    0: 1,
    1: 1,
    2: 2,
    3: 3,
}


@login_required
def practise(request):
    """Renders practise/practise.html — the main game selection page.

    Reads the currently selected learner from the session and, if a recommendation
    level has been set, surfaces the appropriate game recommendation alongside all
    available game descriptions.
    """

    selected_learner_id = request.session.get("selected_learner_id")
    learner_selected = False
    selected_learner = None
    recommendation = None
    recommended_stage_number = None
    recommended_exercise_key = None

    stage_numbers = sorted(PRACTISE_STAGES.keys())
    default_stage_number = stage_numbers[0] if stage_numbers else None

    exercise_icon_map = {
        "colourful_semantics": "icons/colour_semantics_icon_bg.png",
        "think_and_find": "icons/think_and_find_icon.png",
        "concept_quest": "icons/concept_quest_icon.png",
        "categorisation": "icons/categorisation_icon.png",
        "story_train": "icons/story_train_icon.png",
    }

    title_to_key = {
        game_data.get("title"): game_key
        for game_key, game_data in GAME_DESCRIPTIONS.items()
    }

    stage_library = []
    exercise_cards_by_key = {}
    for stage_number in stage_numbers:
        stage_data = PRACTISE_STAGES.get(stage_number, {})
        exercise_cards = []

        for exercise_key in stage_data.get("exercises", []):
            game_data = GAME_DESCRIPTIONS.get(exercise_key)
            if not game_data:
                continue

            card_payload = {
                "key": exercise_key,
                "title": game_data.get("title", ""),
                "target": game_data.get("target", ""),
                "bullet1": game_data.get("bullet1", ""),
                "bullet2": game_data.get("bullet2", ""),
                "bullet3": game_data.get("bullet3", ""),
                "icon": exercise_icon_map.get(exercise_key, ""),
                "start_path": f"exercises/{exercise_key}/index.html",
            }
            exercise_cards.append(card_payload)
            exercise_cards_by_key[exercise_key] = card_payload

        stage_library.append(
            {
                "number": stage_number,
                "label": stage_data.get("label", f"Stage {stage_number}"),
                "exercise_cards": exercise_cards,
            }
        )

    if selected_learner_id:
        selected_learner = Learner.objects.filter(id=selected_learner_id).first()
        learner_selected = selected_learner is not None

        if learner_selected and selected_learner.recommendation_level is not None:
            level = selected_learner.recommendation_level
            recommendation = RECOMMENDATIONS[level] if level < len(RECOMMENDATIONS) else None
            if recommendation:
                recommended_stage_number = RECOMMENDATION_LEVEL_TO_STAGE.get(level)
                recommended_exercise_key = title_to_key.get(recommendation.get("focus"))

    if recommended_stage_number is None:
        recommended_stage_number = default_stage_number

    active_stage_number = recommended_stage_number or default_stage_number
    recommended_exercise_card = exercise_cards_by_key.get(recommended_exercise_key)

    context = {
        "learner_selected": learner_selected,
        "selected_learner": selected_learner,
        "recommendation": recommendation,
        "game_descriptions": GAME_DESCRIPTIONS,
        "stage_library": stage_library,
        "recommended_stage_number": recommended_stage_number,
        "recommended_exercise_key": recommended_exercise_key,
        "recommended_exercise_card": recommended_exercise_card,
        "active_stage_number": active_stage_number,
    }

    return render(request, "practise/practise.html", context)
