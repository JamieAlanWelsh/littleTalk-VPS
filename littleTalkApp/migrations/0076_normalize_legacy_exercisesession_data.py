from django.db import migrations


LEGACY_EXERCISE_MAPPINGS = {
    "Story Train": "story-train",
    "Categorisation": "categorisation",
    "Concept Quest": "concept-quest",
    "Colourful Semantics": "colourful-semantics",
    "Think and Find": "think-and-find",
}


def _parse_legacy_difficulty(raw_value):
    try:
        return float(raw_value)
    except (TypeError, ValueError):
        return None


def _normalize_story_train(_raw_value):
    return "3", "3-step sequence"


def _normalize_concept_quest(raw_value):
    difficulty = _parse_legacy_difficulty(raw_value)
    if difficulty is None:
        return "", ""

    difficulty_text = str(int(difficulty)) if difficulty.is_integer() else str(difficulty)
    last_digit = difficulty_text.rstrip("0").rstrip(".")[-1] if difficulty_text else ""

    if last_digit == "3":
        return "1", "Positive"
    if last_digit == "6":
        return "2", "Comparitive"
    if last_digit == "9":
        return "3", "Superlative"

    return "", ""


def _normalize_categorisation(raw_value):
    difficulty = _parse_legacy_difficulty(raw_value)
    if difficulty is None:
        return "", ""
    if difficulty < 20:
        return "2", "2 categories"
    if difficulty < 30:
        return "3", "3 categories"
    return "4", "4 categories"


def _normalize_think_and_find(raw_value):
    difficulty = _parse_legacy_difficulty(raw_value)
    if difficulty is None:
        return "", ""
    if difficulty <= 10:
        return "2", "2 options"
    if difficulty <= 20:
        return "3", "3 options"
    if difficulty <= 30:
        return "4", "4 options"
    return "5", "5 options"


def _normalize_colourful_semantics(raw_value):
    difficulty = _parse_legacy_difficulty(raw_value)
    if difficulty is None:
        return "", ""
    if difficulty < 10:
        return "1", "Subject"
    if difficulty < 20:
        return "1", "Verb"
    if difficulty < 30:
        return "2", "Subject+Verb"
    if difficulty < 40:
        return "3", "Subject+Verb+Object"
    return "4", "Subject+Verb+Object+Location"


LEGACY_DIFFICULTY_NORMALIZERS = {
    "Story Train": _normalize_story_train,
    "Categorisation": _normalize_categorisation,
    "Concept Quest": _normalize_concept_quest,
    "Colourful Semantics": _normalize_colourful_semantics,
    "Think and Find": _normalize_think_and_find,
}


def _get_exercise_session_model(apps):
    if apps is not None:
        return apps.get_model("littleTalkApp", "ExerciseSession")

    from littleTalkApp.models import ExerciseSession

    return ExerciseSession


def normalize_legacy_exercise_sessions(apps, schema_editor):
    del schema_editor
    ExerciseSession = _get_exercise_session_model(apps)

    for legacy_name, slug in LEGACY_EXERCISE_MAPPINGS.items():
        normalize_difficulty = LEGACY_DIFFICULTY_NORMALIZERS[legacy_name]
        sessions = ExerciseSession.objects.filter(exercise_id=legacy_name).iterator()
        for session in sessions:
            difficulty_selected, difficulty_label = normalize_difficulty(
                session.difficulty_selected
            )
            session.exercise_id = slug
            session.difficulty_selected = difficulty_selected
            session.difficulty_label = difficulty_label
            session.save(
                update_fields=[
                    "exercise_id",
                    "difficulty_selected",
                    "difficulty_label",
                ]
            )


class Migration(migrations.Migration):

    dependencies = [
        ("littleTalkApp", "0075_exercisesession_difficulty_label"),
    ]

    operations = [
        migrations.RunPython(
            normalize_legacy_exercise_sessions,
            reverse_code=migrations.RunPython.noop,
        ),
    ]