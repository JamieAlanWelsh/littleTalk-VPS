from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.urls import reverse
from django.contrib.auth.password_validation import validate_password
from django import forms
from email.utils import formataddr

from .models import Role

import hashlib


def hash_email(email):
    """Generate SHA256 hash of an email address for authentication lookups."""
    if not email:
        return None
    return hashlib.sha256(email.lower().encode()).hexdigest()


def validate_password_strength(password, user=None):
    """
    Validate password strength using AUTH_PASSWORD_VALIDATORS.
    Raises forms.ValidationError with all validation errors.
    
    Args:
        password (str): The password to validate.
        user (User, optional): The user object for context-aware validation.
    
    Raises:
        forms.ValidationError: If password fails any validator.
    """
    try:
        validate_password(password, user=user)
    except forms.ValidationError:
        # Re-raise as-is; validate_password already returns forms.ValidationError
        raise
    except Exception as e:
        # Catch any other validation errors and convert to forms.ValidationError
        raise forms.ValidationError(str(e))


# permissions


def can_edit_or_delete_log(user, log_entry):
    # Direct owner may always edit/delete
    if log_entry.user == user:
        return True

    # If both users are associated with any overlapping schools and
    # the acting user is admin/manager, allow edit/delete
    try:
        user_schools = set(user.profile.get_accessible_schools())
        entry_schools = set(log_entry.user.profile.get_accessible_schools())
        overlap = user_schools & entry_schools
        if overlap:
            # If the acting user is admin/manager for any overlapping school, allow
            for school in overlap:
                try:
                    role_for = user.profile.get_role_for_school(school)
                    if role_for in [Role.ADMIN, Role.TEAM_MANAGER]:
                        return True
                except Exception:
                    continue
    except Exception:
        # Ignore if relation isn't available for any reason
        pass

    return False


# send staff invite mail


def send_invite_email(invite, school, request):
    invite_url = request.build_absolute_uri(f"/accept-invite/{invite.token}/")

    context = {
        "invite": invite,
        "school": school,
        "invite_url": invite_url,
    }

    subject = f"You're invited to join {school.name} on Chatterdillo"
    from_email = formataddr(("Chatterdillo Team", "noreply@chatterdillo.com"))
    to_email = [invite.email]

    text_content = render_to_string("emails/invite_staff.txt", context)
    html_content = render_to_string("emails/invite_staff.html", context)

    email = EmailMultiAlternatives(subject, text_content, from_email, to_email)
    email.attach_alternative(html_content, "text/html")
    email.send()


# send parent invite email


def send_parent_access_email(token, learner, email, request):
    signup_url = request.build_absolute_uri(f"/parent-signup/?code={token.token}")

    context = {
        "learner": learner,
        "signup_url": signup_url,
        "token": token.token,
    }

    subject = f"Your Parent Access Code for {learner.name}"
    from_email = formataddr(("Chatterdillo Team", "noreply@chatterdillo.com"))
    to_email = [email]

    text_content = render_to_string("emails/parent_access.txt", context)
    html_content = render_to_string("emails/parent_access.html", context)

    email = EmailMultiAlternatives(subject, text_content, from_email, to_email)
    email.attach_alternative(html_content, "text/html")
    email.send()


# Send email verification code


def send_email_verification_code(user, verification_code, request):
    """Send a 6-digit verification code and a click link to the user."""
    from_email = formataddr(("Chatterdillo Team", "noreply@chatterdillo.com"))
    to_email = [user.email_encrypted]

    # Build the click-link URL
    verify_url = request.build_absolute_uri(
        f"/verify-email/{verification_code.link_token}/"
    )

    context = {
        "user": user,
        "code": verification_code.code,
        "verify_link": verify_url,
    }

    subject = "Verify your Chatterdillo email"
    text_content = render_to_string("emails/verify_email.txt", context)
    html_content = render_to_string("emails/verify_email.html", context)

    email = EmailMultiAlternatives(subject, text_content, from_email, to_email)
    email.attach_alternative(html_content, "text/html")
    email.send()


def send_join_approved_email(user, school, request):
    from_email = formataddr(("Chatterdillo Team", "noreply@chatterdillo.com"))
    to_email = [user.email_encrypted]

    context = {
        "user": user,
        "school": school,
        "login_url": request.build_absolute_uri(reverse("login")),
    }

    subject = f"Your request to join {school.name} has been approved"
    text_content = render_to_string("emails/join_approved.txt", context)
    html_content = render_to_string("emails/join_approved.html", context)

    email = EmailMultiAlternatives(subject, text_content, from_email, to_email)
    email.attach_alternative(html_content, "text/html")
    email.send()


def send_join_rejected_email(user, school, request):
    from_email = formataddr(("Chatterdillo Team", "noreply@chatterdillo.com"))
    to_email = [user.email_encrypted]

    context = {
        "user": user,
        "school": school,
        "login_url": request.build_absolute_uri(reverse("login")),
    }

    subject = f"Your request to join {school.name} was not approved"
    text_content = render_to_string("emails/join_rejected.txt", context)
    html_content = render_to_string("emails/join_rejected.html", context)

    email = EmailMultiAlternatives(subject, text_content, from_email, to_email)
    email.attach_alternative(html_content, "text/html")
    email.send()
