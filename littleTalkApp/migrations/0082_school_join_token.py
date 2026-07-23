import uuid

from django.db import migrations, models


def assign_join_tokens(apps, schema_editor):
    School = apps.get_model("littleTalkApp", "School")
    for school in School.objects.all():
        School.objects.filter(pk=school.pk).update(join_token=uuid.uuid4())


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("littleTalkApp", "0081_remove_joinrequest_full_name_email"),
    ]

    operations = [
        migrations.AddField(
            model_name="school",
            name="join_token",
            field=models.UUIDField(default=uuid.uuid4, editable=False, null=True),
        ),
        migrations.RunPython(assign_join_tokens, noop),
        migrations.AlterField(
            model_name="school",
            name="join_token",
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
