from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from email.utils import formataddr
from .models import Role

# permissions


def can_edit_or_delete_log(user, log_entry):
    # Direct owner may always edit/delete
    if log_entry.user == user:
        return True

    # If both users are associated with any overlapping schools and
    # the acting user is admin/manager, allow edit/delete
    try:
        user_schools = set(user.profile.schools.all())
        entry_schools = set(log_entry.user.profile.schools.all())
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

    # Fallback to legacy FK comparison for backwards compatibility
    try:
        if (
            user.profile.school is not None
            and log_entry.user.profile.school is not None
            and user.profile.school == log_entry.user.profile.school
        ):
            role_for = user.profile.get_role_for_school(user.profile.school)
            if role_for in [Role.ADMIN, Role.TEAM_MANAGER]:
                return True
    except Exception:
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


# Send school welcome email


def send_school_welcome_email(school, user):
    from_email = formataddr(("Chatterdillo Team", "noreply@chatterdillo.com"))
    to_email = [user.email]

    context = {
        "user": user,
        "school": school,
    }

    subject = f"Welcome to Chatterdillo, {school.name}!"
    text_content = render_to_string("emails/school_welcome.txt", context)
    html_content = render_to_string("emails/school_welcome.html", context)

    email = EmailMultiAlternatives(subject, text_content, from_email, to_email)
    email.attach_alternative(html_content, "text/html")
    email.send()


# Send parent welcome email


def send_parent_welcome_email(user):
    from_email = formataddr(("Chatterdillo Team", "noreply@chatterdillo.com"))
    to_email = [user.email]

    context = {
        "user": user,
    }

    subject = "Welcome to Chatterdillo!"
    text_content = render_to_string("emails/parent_welcome.txt", context)
    html_content = render_to_string("emails/parent_welcome.html", context)

    email = EmailMultiAlternatives(subject, text_content, from_email, to_email)
    email.attach_alternative(html_content, "text/html")
    email.send()
