from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("littleTalkApp", "0073_learner_recommendation_cursor_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="learner",
            name="secondary_exercise_ids",
            field=models.JSONField(blank=True, null=True),
        ),
    ]
