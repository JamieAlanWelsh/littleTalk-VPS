import json

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from littleTalkApp.content.avatars import (
    AVATAR_CHARACTER_MAP,
    DEFAULT_AVATAR_CHARACTER,
    DEFAULT_AVATAR_COLOR,
)
from django.templatetags.static import static

from littleTalkApp.models import InterventionGroup, Learner


def _decorate_learner_avatar(learner):
    character_meta = AVATAR_CHARACTER_MAP.get(learner.avatar_character)
    if not character_meta:
        character_meta = AVATAR_CHARACTER_MAP[DEFAULT_AVATAR_CHARACTER]

    learner.avatar_image_url = static(
        f"exercise_assets/characters/{character_meta['image_filename']}"
    )
    learner.avatar_display_color = learner.avatar_color or DEFAULT_AVATAR_COLOR
    return learner


def _get_session_learner_uuid(request):
    learner_id = request.session.get("selected_learner_id")
    if not learner_id:
        return None

    learner = Learner.objects.get(id=learner_id)
    return str(learner.learner_uuid)


def _get_session_group_context(request):
    group_id = request.session.get("selected_group_id")
    if group_id in [None, ""]:
        return None, []

    school = request.user.profile.get_current_school(request)
    if not school:
        return None, []

    try:
        group_id = int(group_id)
    except (TypeError, ValueError):
        return None, []

    group = InterventionGroup.objects.filter(id=group_id, school=school).first()
    if not group:
        return None, []

    learners = [
        _decorate_learner_avatar(learner)
        for learner in group.learners.filter(deleted=False).order_by("id")
    ]
    return group, learners


def _exercise_context(request):
    selected_group, group_learners = _get_session_group_context(request)
    return {
        "learner_uuid": _get_session_learner_uuid(request),
        "selected_group_id": selected_group.id if selected_group else None,
        "group_learners_json": json.dumps(
            [
                {
                    "id": learner.id,
                    "name": learner.name,
                    "avatar_color": learner.avatar_display_color,
                    "avatar_image_url": learner.avatar_image_url,
                }
                for learner in group_learners
            ]
        ),
    }

@login_required
def categorisation_example(request):
    """
    Categorisation exercise using the React framework.
    Renders a categorisation exercise where users group items into categories.
    """

    return render(request, "exercises/categorisation.html", _exercise_context(request))

@login_required
def think_and_find(request):
    """React-based Think & Find exercise demo."""
    return render(request, "exercises/think_and_find.html", _exercise_context(request))


@login_required
def concept_quest(request):
    """React-based Concept Quest exercise demo."""
    return render(request, "exercises/concept_quest.html", _exercise_context(request))


@login_required
def colourful_semantics(request):
    return render(request, "exercises/colourful_semantics.html", _exercise_context(request))


@login_required
def story_train(request):
    return render(request, "exercises/story_train.html", _exercise_context(request))


@login_required
def spot_on(request):
    return render(request, "exercises/spot_on.html", _exercise_context(request))


@login_required
def whats_in_the_bag(request):
    return render(request, "exercises/whats_in_the_bag.html", _exercise_context(request))


@login_required
def what_happens_next(request):
    return render(request, "exercises/what_happens_next.html", _exercise_context(request))


@login_required
def in_the_know(request):
    return render(request, "exercises/in_the_know.html", _exercise_context(request))


@login_required
def whos_who(request):
    return render(request, "exercises/whos_who.html", _exercise_context(request))


@login_required
def task_master(request):
    return render(request, "exercises/task_master.html", _exercise_context(request))