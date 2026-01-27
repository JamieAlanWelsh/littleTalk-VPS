# Generated migration for email encryption fields

from django.db import migrations, models
import encrypted_model_fields.fields


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='email_encrypted',
            field=encrypted_model_fields.fields.EncryptedEmailField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='email_hash',
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text='SHA256 hash of encrypted email for authentication lookups',
                max_length=64,
                null=True,
            ),
        ),
    ]
