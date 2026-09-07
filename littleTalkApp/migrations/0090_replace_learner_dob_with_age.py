from django.db import migrations, models
from django.core.validators import MaxValueValidator, MinValueValidator
from django.utils import timezone


MIN_LEARNER_AGE = 1
MAX_LEARNER_AGE = 19


def forwards(apps, schema_editor):
    Learner = apps.get_model("littleTalkApp", "Learner")
    today = timezone.now().date()

    for learner in Learner.objects.filter(date_of_birth__isnull=False).iterator():
        dob = learner.date_of_birth
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        learner.age = age if MIN_LEARNER_AGE <= age <= MAX_LEARNER_AGE else None
        learner.save(update_fields=["age"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("littleTalkApp", "0089_interventiongroup"),
    ]

    operations = [
        migrations.AddField(
            model_name="learner",
            name="age",
            field=models.PositiveSmallIntegerField(
                blank=True,
                null=True,
                validators=[
                    MinValueValidator(MIN_LEARNER_AGE),
                    MaxValueValidator(MAX_LEARNER_AGE),
                ],
            ),
        ),
        migrations.RunPython(forwards, noop),
        migrations.RemoveField(
            model_name="learner",
            name="date_of_birth",
        ),
        migrations.RemoveField(
            model_name="learner",
            name="age_group",
        ),
    ]
