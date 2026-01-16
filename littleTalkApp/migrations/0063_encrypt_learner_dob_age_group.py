from django.db import migrations, models
import encrypted_model_fields.fields
from django.utils import timezone


AGE_GROUP_CHOICES = [
    (1, "0-2"),
    (2, "3-4"),
    (3, "5-8"),
    (4, "9-11"),
    (5, "12+"),
]


def derive_age_group(dob, today):
    if not dob or dob > today:
        return None

    age_years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    if age_years <= 2:
        return 1
    if age_years <= 4:
        return 2
    if age_years <= 8:
        return 3
    if age_years <= 11:
        return 4
    return 5


def forwards(apps, schema_editor):
    Learner = apps.get_model("littleTalkApp", "Learner")
    today = timezone.now().date()

    for learner in Learner.objects.filter(date_of_birth__isnull=False).iterator():
        dob = learner.date_of_birth
        learner.date_of_birth = dob
        learner.age_group = derive_age_group(dob, today)
        learner.save()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("littleTalkApp", "0062_alter_logentry_exercises_practised_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="learner",
            name="age_group",
            field=models.PositiveSmallIntegerField(
                blank=True,
                choices=AGE_GROUP_CHOICES,
                help_text="Derived age bucket for reporting",
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="learner",
            name="date_of_birth",
            field=encrypted_model_fields.fields.EncryptedDateField(blank=True, null=True),
        ),
        migrations.RunPython(forwards, noop),
    ]
