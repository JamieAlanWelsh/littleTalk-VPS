from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('littleTalkApp', '0058_logentry_school'),
    ]

    def forwards_func(apps, schema_editor):
        LogEntry = apps.get_model('littleTalkApp', 'LogEntry')
        Profile = apps.get_model('littleTalkApp', 'Profile')
        for log in LogEntry.objects.filter(school__isnull=True):
            try:
                profile = Profile.objects.get(user_id=log.user_id)
                if profile.school_id:
                    log.school_id = profile.school_id
                    log.save(update_fields=["school"])
            except Profile.DoesNotExist:
                pass

    def reverse_func(apps, schema_editor):
        # Optionally clear the school field if you want to reverse
        LogEntry = apps.get_model('littleTalkApp', 'LogEntry')
        LogEntry.objects.update(school=None)

    operations = [
        migrations.RunPython(forwards_func, reverse_func),
    ]