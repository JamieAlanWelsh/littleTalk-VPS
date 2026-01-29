from django.contrib.auth.models import AbstractUser
from django.db import models
from encrypted_model_fields.fields import EncryptedEmailField


class User(AbstractUser):
    """
    Custom user model that inherits from AbstractUser.
    Uses db_table = 'auth_user' to reuse the existing user table.
    
    Email encryption fields:
    - email_encrypted: EncryptedEmailField - stores encrypted email
    - email_hash: SHA256 hash of email for fast lookups (indexed)
    
    Note: email, first_name, and last_name columns from AbstractUser are
    explicitly set to None to indicate they are not used (removed from DB).
    """
    # Override AbstractUser fields to remove them
    email = None
    first_name = None
    last_name = None
    
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
