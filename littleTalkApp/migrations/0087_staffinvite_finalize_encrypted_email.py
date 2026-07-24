# Drop the raw plaintext email column and promote the encrypted field to `email`.
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("littleTalkApp", "0086_staffinvite_populate_encrypted_email"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="staffinvite",
            name="email",
        ),
        migrations.RenameField(
            model_name="staffinvite",
            old_name="email_encrypted",
            new_name="email",
        ),
    ]
