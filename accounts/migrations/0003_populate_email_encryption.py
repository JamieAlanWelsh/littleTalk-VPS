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
    
    total_users = User.objects.count()
    processed = 0
    
    # Process users in batches to avoid memory issues
    batch_size = 100
    users_to_update = []
    
    for user in User.objects.all():
        if user.email:
            # The EncryptedEmailField will handle encryption during assignment
            user.email_encrypted = user.email
            user.email_hash = hash_email(user.email)
            users_to_update.append(user)
            processed += 1
            
            # Bulk update in batches
            if len(users_to_update) >= batch_size:
                User.objects.bulk_update(
                    users_to_update,
                    ['email_encrypted', 'email_hash'],
                    batch_size=batch_size
                )
                users_to_update = []
    
    # Final batch
    if users_to_update:
        User.objects.bulk_update(
            users_to_update,
            ['email_encrypted', 'email_hash'],
            batch_size=batch_size
        )
    
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
