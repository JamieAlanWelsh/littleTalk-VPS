import hashlib
from django.db import migrations


def hash_email(email):
    """Generate SHA256 hash of an email address."""
    if not email:
        return None
    return hashlib.sha256(email.lower().encode()).hexdigest()


def populate_email_encrypted_and_hash(apps, schema_editor):
    """
    Data migration: Populate email_encrypted and email_hash from existing email field.
    
    This migration:
    1. Reads the existing email field
    2. Encrypts it and stores in email_encrypted
    3. Creates a SHA256 hash and stores in email_hash
    
    Safe rollback: Preserves the original email field.
    """
    User = apps.get_model('accounts', 'User')
    
    processed = 0
    
    for user in User.objects.all():
        if user.email:
            # Assign email to encrypted fields
            user.email_encrypted = user.email
            user.email_hash = hash_email(user.email)
            # CRITICAL: Use save() instead of bulk_update() to trigger encryption
            # bulk_update() bypasses Django's field encryption logic
            user.save(update_fields=['email_encrypted', 'email_hash'])
            processed += 1
    
    print(f"Successfully processed {processed} users")


def reverse_email_encryption(apps, schema_editor):
    """
    Safe rollback: Clear the encrypted fields but preserve original email field.
    
    This allows rolling back without data loss.
    """
    User = apps.get_model('accounts', 'User')
    
    # Clear encrypted fields while keeping original email intact
    User.objects.all().update(
        email_encrypted='',
        email_hash=''
    )
    
    print("Rolled back email encryption fields")


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_email_fields'),
    ]

    operations = [
        migrations.RunPython(
            populate_email_encrypted_and_hash,
            reverse_email_encryption,
        ),
    ]
