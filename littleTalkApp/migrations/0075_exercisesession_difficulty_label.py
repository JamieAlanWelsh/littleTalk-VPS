from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("littleTalkApp", "0074_learner_secondary_exercise_ids"),
    ]

    operations = [
        migrations.AddField(
            model_name="exercisesession",
            name="difficulty_label",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
    ]
