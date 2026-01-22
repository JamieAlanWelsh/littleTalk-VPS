from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model that inherits from AbstractUser.
    Uses db_table = 'auth_user' to reuse the existing user table.
    """
    
    class Meta:
        db_table = 'auth_user'
