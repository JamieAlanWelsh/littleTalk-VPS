from django.db import migrations


def forwards(apps, schema_editor):
    Profile = apps.get_model('littleTalkApp', 'Profile')
    LegacyUser = apps.get_model('auth', 'User')

    for profile in Profile.objects.all():
        if profile.first_name:
            continue
        legacy = LegacyUser.objects.filter(pk=profile.user_id).first()
        if legacy and legacy.first_name:
            profile.first_name = legacy.first_name
            profile.save(update_fields=['first_name'])


def backwards(apps, schema_editor):
    # No-op: we don't want to clear profile names on reverse.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('littleTalkApp', '0066_custom_user_model'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
