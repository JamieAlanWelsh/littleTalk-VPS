import os


# Provide safe defaults so importing base settings does not require production secrets.
os.environ.setdefault("EMAIL_HOST_PASSWORD", "test-email-password")
os.environ.setdefault("FIELD_ENCRYPTION_KEY", "jD6Y0ahM95M06WQ0fY5nq2WEYLRh3SeDsICoZ6RiMCM=")
os.environ.setdefault("STRIPE_SECRET_KEY", "sk_test_mock")
os.environ.setdefault("STRIPE_PUBLISHABLE_KEY", "pk_test_mock")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_test_mock")

from .settings import *  # noqa: F401,F403


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles_test")

# Speed up tests while preserving behavior checks.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
AUTH_PASSWORD_VALIDATORS = []
