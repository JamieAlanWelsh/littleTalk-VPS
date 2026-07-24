# Data migration: encrypt existing StaffInvite emails and populate the lookup hash.
import hashlib

from django.db import migrations


def hash_email(email):
    if not email:
        return None
    return hashlib.sha256(email.lower().encode()).hexdigest()


def populate_encrypted_email(apps, schema_editor):
    StaffInvite = apps.get_model("littleTalkApp", "StaffInvite")

    processed = 0
    for invite in StaffInvite.objects.all():
        if invite.email:
            # Assigning to the encrypted field triggers encryption on save().
            invite.email_encrypted = invite.email
            invite.email_hash = hash_email(invite.email)
            invite.save(update_fields=["email_encrypted", "email_hash"])
            processed += 1

    print(f"Encrypted {processed} StaffInvite email(s)")


def reverse_populate(apps, schema_editor):
    StaffInvite = apps.get_model("littleTalkApp", "StaffInvite")
    StaffInvite.objects.all().update(email_encrypted=None, email_hash=None)


class Migration(migrations.Migration):

    dependencies = [
        ("littleTalkApp", "0085_staffinvite_encrypt_email_add"),
    ]

    operations = [
        migrations.RunPython(populate_encrypted_email, reverse_populate),
    ]
