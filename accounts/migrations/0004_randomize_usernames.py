from django.db import migrations
import uuid


def randomize_usernames(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    # Update usernames that look like emails or match the email field
    qs = User.objects.all().only('id', 'username', 'email')
    updates = []
    existing_usernames = set(User.objects.values_list('username', flat=True))

    def unique_uuid():
        # Ensure uniqueness defensively
        while True:
            u = str(uuid.uuid4())
            if u not in existing_usernames:
                existing_usernames.add(u)
                return u

    for user in qs.iterator():
        uname = (user.username or '').strip()
        email = (user.email or '').strip()
        # Heuristics: if username equals email or appears to be an email
        if uname == email or ('@' in uname):
            user.username = unique_uuid()
            updates.append(user)
            # Bulk update in chunks
            if len(updates) >= 500:
                User.objects.bulk_update(updates, ['username'], batch_size=500)
                updates = []

    if updates:
        User.objects.bulk_update(updates, ['username'], batch_size=500)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_populate_email_encryption'),
    ]

    operations = [
        migrations.RunPython(randomize_usernames, reverse_code=migrations.RunPython.noop),
    ]
