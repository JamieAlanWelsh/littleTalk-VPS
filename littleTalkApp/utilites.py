from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from email.utils import formataddr

# permissions

def can_edit_or_delete_log(user, log_entry):
    return (
        log_entry.user == user or
        (user.profile.school == log_entry.user.profile.school and (
            user.profile.is_admin() or user.profile.is_manager()
        ))
    )

# send staff invite mail

def send_invite_email(invite, school, request):
    invite_url = request.build_absolute_uri(f"/accept-invite/{invite.token}/")

    context = {
        'invite': invite,
        'school': school,
        'invite_url': invite_url,
    }

    subject = f"You're invited to join {school.name} on Chatterdillo"
    from_email = formataddr(("Chatterdillo Team", "noreply@chatterdillo.com"))
    to_email = [invite.email]

    text_content = render_to_string('emails/invite_staff.txt', context)
    html_content = render_to_string('emails/invite_staff.html', context)

    email = EmailMultiAlternatives(subject, text_content, from_email, to_email)
    email.attach_alternative(html_content, "text/html")
    email.send()

# send parent invite email

def send_parent_access_email(token, learner, email, request):
    signup_url = request.build_absolute_uri(f"/parent-signup/?code={token.token}")

    context = {
        'learner': learner,
        'signup_url': signup_url,
        'token': token.token,
    }

    subject = f"Your Parent Access Code for {learner.name}"
    from_email = formataddr(("Chatterdillo Team", "noreply@chatterdillo.com"))
    to_email = [email]

    text_content = render_to_string('emails/parent_access.txt', context)
    html_content = render_to_string('emails/parent_access.html', context)

    email = EmailMultiAlternatives(subject, text_content, from_email, to_email)
    email.attach_alternative(html_content, "text/html")
    email.send()

# Send school welcome email

def send_school_welcome_email(school, user):
    from_email = formataddr(("Chatterdillo Team", "noreply@chatterdillo.com"))
    to_email = [user.email]

    context = {
        'user': user,
        'school': school,
    }

    subject = f"Welcome to Chatterdillo, {school.name}!"
    text_content = render_to_string('emails/school_welcome.txt', context)
    html_content = render_to_string('emails/school_welcome.html', context)

    email = EmailMultiAlternatives(subject, text_content, from_email, to_email)
    email.attach_alternative(html_content, "text/html")
    email.send()

# Send parent welcome email

def send_parent_welcome_email(user):
    from_email = formataddr(("Chatterdillo Team", "noreply@chatterdillo.com"))
    to_email = [user.email]

    context = {
        'user': user,
    }

    subject = "Welcome to Chatterdillo!"
    text_content = render_to_string('emails/parent_welcome.txt', context)
    html_content = render_to_string('emails/parent_welcome.html', context)

    email = EmailMultiAlternatives(subject, text_content, from_email, to_email)
    email.attach_alternative(html_content, "text/html")
    email.send()