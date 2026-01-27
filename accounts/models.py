from django.contrib.auth.models import AbstractUser
from django.db import models
from encrypted_model_fields.fields import EncryptedEmailField


class User(AbstractUser):
    """
    Custom user model that inherits from AbstractUser.
    Uses db_table = 'auth_user' to reuse the existing user table.
    
    Email encryption fields:
    - email: Original email field (kept for backward compatibility during migration)
    - email_encrypted: EncryptedEmailField - stores encrypted email
    - email_hash: SHA256 hash of email for fast lookups (indexed)
    """
    email_encrypted = EncryptedEmailField(blank=True, null=True)
    email_hash = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        db_index=True,
        help_text="SHA256 hash of encrypted email for authentication lookups"
    )
    
    class Meta:
        db_table = 'auth_user'
