from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("littleTalkApp", "0072_learner_recommended_exercise_ids_and_screener_version"),
    ]

    operations = [
        migrations.AddField(
            model_name="learner",
            name="recommendation_index",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="learner",
            name="recommendation_index_updated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
