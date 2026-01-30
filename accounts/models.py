from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from encrypted_model_fields.fields import EncryptedEmailField


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError("Users must have a username.")
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(username, password, **extra_fields)


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

    EMAIL_FIELD = "email_encrypted"
    REQUIRED_FIELDS = []

    objects = UserManager()
    
    class Meta:
        db_table = 'auth_user'
