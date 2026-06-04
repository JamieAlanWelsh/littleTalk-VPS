from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.urls import reverse
from django.utils import timezone

from littleTalkApp.content import GAME_DESCRIPTIONS, RECOMMENDATIONS
from littleTalkApp.models import Learner


PRACTISE_STAGES = {
    1: {
        "label": "Stage 1 - Foundations",
        "exercises": [
            "colourful_semantics_early_sentence_building",
            "spot_on",
            "whos_who_pronouns",
            "whats_in_the_bag_vocabulary_builder",
        ],
    },
    2: {
        "label": "Stage 2 - Building Language",
        "exercises": [
            "colourful_semantics",
            "think_and_find",
            "concept_quest",
            "categorisation",
            "story_train",
        ],
    },
    3: {
        "label": "Stage 3 - Advanced Language",
        "exercises": [
            "colourful_semantics_advanced_sentence_building",
            "story_train_advanced_sequencing",
            "task_master_instructions",
            "in_the_know_inferencing",
            "what_happens_next_predicting",
        ],
    },
}


RECOMMENDATION_LEVEL_TO_STAGE = {
    0: 1,
    1: 1,
    2: 2,
    3: 3,
}


PRACTISE_EXERCISE_ROUTE_NAMES = {
    "colourful_semantics": "colourful_semantics",
    "colourful_semantics_early_sentence_building": "colourful_semantics",
    "colourful_semantics_advanced_sentence_building": "colourful_semantics",
    "think_and_find": "think_and_find",
    "concept_quest": "concept_quest",
    "categorisation": "categorisation_example",
    "story_train": "story_train",
    "story_train_advanced_sequencing": "story_train",
    "spot_on": "spot_on",
    "whos_who_pronouns": "whos_who",
    "whats_in_the_bag_vocabulary_builder": "whats_in_the_bag",
    "task_master_instructions": "task_master",
    "in_the_know_inferencing": "in_the_know",
    "what_happens_next_predicting": "what_happens_next",
}


PRACTISE_EXERCISE_ROUTE_QUERIES = {
    "colourful_semantics_early_sentence_building": "variant=early-years",
    "colourful_semantics_advanced_sentence_building": "variant=advanced",
    "story_train_advanced_sequencing": "variant=advanced",
}


CANONICAL_TO_PRACTISE_KEY = {
    "categorisation": "categorisation",
    "colourful-semantics": "colourful_semantics",
    "colourful-semantics-early": "colourful_semantics_early_sentence_building",
    "colourful-semantics-plus": "colourful_semantics_advanced_sentence_building",
    "concept-quest": "concept_quest",
    "in-the-know": "in_the_know_inferencing",
    "spot-on": "spot_on",
    "story-train": "story_train",
    "story-train-plus": "story_train_advanced_sequencing",
    "task-master": "task_master_instructions",
    "think-and-find": "think_and_find",
    "what-happens-next": "what_happens_next_predicting",
    "whats-in-the-bag": "whats_in_the_bag_vocabulary_builder",
    "whos-who": "whos_who_pronouns",
}

PRACTISE_KEY_TO_STAGE = {
    exercise_key: stage_number
    for stage_number, stage_data in PRACTISE_STAGES.items()
    for exercise_key in stage_data.get("exercises", [])
}


def resolve_recommendation_index(learner):
    """Return current recommendation index and apply 24h fallback rotation."""

    recommendation_ids = learner.recommended_exercise_ids or []
    recommendation_count = len(recommendation_ids)
    if recommendation_count == 0:
        return None

    current_index = learner.recommendation_index % recommendation_count
    now = timezone.now()

    if learner.recommendation_index_updated_at is None:
        learner.recommendation_index = current_index
        learner.recommendation_index_updated_at = now
        learner.save(update_fields=["recommendation_index", "recommendation_index_updated_at"])
        return current_index

    elapsed = now - learner.recommendation_index_updated_at
    elapsed_days = elapsed.days
    if elapsed_days < 1:
        return current_index

    current_index = (current_index + elapsed_days) % recommendation_count
    learner.recommendation_index = current_index
    learner.recommendation_index_updated_at = now
    learner.save(update_fields=["recommendation_index", "recommendation_index_updated_at"])
    return current_index


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
    recommended_exercise_keys = []
    recommended_stage_numbers = []

    stage_numbers = sorted(PRACTISE_STAGES.keys())
    default_stage_number = stage_numbers[0] if stage_numbers else None

    exercise_icon_map = {
        "colourful_semantics": "exercise_icons/colourful_semantics_icon.webp",
        "colourful_semantics_early_sentence_building": "exercise_icons/colourful_semantics_early_icon.webp",
        "colourful_semantics_advanced_sentence_building": "exercise_icons/colourful_semantics_advanced_icon.webp",
        "think_and_find": "exercise_icons/think_and_find_icon.webp",
        "concept_quest": "exercise_icons/concept_quest_icon.webp",
        "categorisation": "exercise_icons/categorisation_icon.webp",
        "story_train": "exercise_icons/story_train_icon.webp",
        "story_train_advanced_sequencing": "exercise_icons/story_train_advanced_icon.webp",
        "task_master_instructions": "exercise_icons/task_master_icon.webp",
        "spot_on": "exercise_icons/spot_on_icon.webp",
        "whos_who_pronouns": "exercise_icons/whos_who_icon.webp",
        "whats_in_the_bag_vocabulary_builder": "exercise_icons/whats_in_the_bag_icon.webp",
        "in_the_know_inferencing": "exercise_icons/in_the_know_icon.webp",
        "what_happens_next_predicting": "exercise_icons/what_happens_next_icon.webp",
    }

    title_to_key = {}
    for game_key, game_data in GAME_DESCRIPTIONS.items():
        title = game_data.get("title")
        if title and title not in title_to_key:
            title_to_key[title] = game_key

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
                "start_url": reverse(
                    PRACTISE_EXERCISE_ROUTE_NAMES.get(exercise_key, "practise")
                ),
            }
            query = PRACTISE_EXERCISE_ROUTE_QUERIES.get(exercise_key)
            if query:
                card_payload["start_url"] = f"{card_payload['start_url']}?{query}"
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

        if learner_selected and selected_learner.recommended_exercise_ids:
            mapped_keys = []
            for exercise_id in selected_learner.recommended_exercise_ids:
                practise_key = CANONICAL_TO_PRACTISE_KEY.get(exercise_id)
                if practise_key and practise_key not in mapped_keys:
                    mapped_keys.append(practise_key)

            recommended_exercise_keys = mapped_keys

            stage_set = {
                PRACTISE_KEY_TO_STAGE[practice_key]
                for practice_key in mapped_keys
                if practice_key in PRACTISE_KEY_TO_STAGE
            }
            recommended_stage_numbers = sorted(stage_set)

            current_index = resolve_recommendation_index(selected_learner)
            if current_index is not None:
                recommendation_ids = selected_learner.recommended_exercise_ids
                ordered_current = (
                    recommendation_ids[current_index:] + recommendation_ids[:current_index]
                )
                for exercise_id in ordered_current:
                    practise_key = CANONICAL_TO_PRACTISE_KEY.get(exercise_id)
                    if practise_key:
                        recommended_exercise_key = practise_key
                        break

                if recommended_exercise_key:
                    recommended_stage_number = PRACTISE_KEY_TO_STAGE.get(recommended_exercise_key)

        elif learner_selected and selected_learner.recommendation_level is not None:
            level = selected_learner.recommendation_level
            recommendation = RECOMMENDATIONS[level] if level < len(RECOMMENDATIONS) else None
            if recommendation:
                recommended_stage_number = RECOMMENDATION_LEVEL_TO_STAGE.get(level)
                recommended_exercise_key = title_to_key.get(recommendation.get("focus"))
                if recommended_exercise_key:
                    recommended_exercise_keys = [recommended_exercise_key]
                if recommended_stage_number:
                    recommended_stage_numbers = [recommended_stage_number]

    active_stage_number = recommended_stage_number or default_stage_number
    recommended_exercise_card = exercise_cards_by_key.get(recommended_exercise_key)

    context = {
        "learner_selected": learner_selected,
        "selected_learner": selected_learner,
        "recommendation": recommendation,
        "game_descriptions": GAME_DESCRIPTIONS,
        "stage_library": stage_library,
        "recommended_stage_number": recommended_stage_number,
        "recommended_stage_numbers": recommended_stage_numbers,
        "recommended_exercise_key": recommended_exercise_key,
        "recommended_exercise_keys": recommended_exercise_keys,
        "recommended_exercise_card": recommended_exercise_card,
        "active_stage_number": active_stage_number,
    }

    return render(request, "practise/practise.html", context)
