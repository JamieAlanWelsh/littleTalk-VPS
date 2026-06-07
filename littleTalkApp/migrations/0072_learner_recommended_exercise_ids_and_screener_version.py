from django.db import migrations, models


def backfill_screener_version(apps, schema_editor):
    LearnerAssessmentAnswer = apps.get_model("littleTalkApp", "LearnerAssessmentAnswer")
    LearnerAssessmentAnswer.objects.update(screener_version=1)


class Migration(migrations.Migration):

    dependencies = [
        ("littleTalkApp", "0071_exercisesession_learner_total_exp_after_session"),
    ]

    operations = [
        migrations.AddField(
            model_name="learner",
            name="recommended_exercise_ids",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="learnerassessmentanswer",
            name="screener_version",
            field=models.IntegerField(default=2),
        ),
        migrations.RunPython(backfill_screener_version, migrations.RunPython.noop),
    ]
