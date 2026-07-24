import encrypted_model_fields.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("littleTalkApp", "0084_school_auto_approve_domains"),
    ]

    operations = [
        migrations.AddField(
            model_name="staffinvite",
            name="email_encrypted",
            field=encrypted_model_fields.fields.EncryptedEmailField(
                blank=True, null=True
            ),
        ),
        migrations.AddField(
            model_name="staffinvite",
            name="email_hash",
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text="SHA256 hash of the invited email for lookups.",
                max_length=64,
                null=True,
            ),
        ),
    ]
