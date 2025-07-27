from django.core.mail import send_mail
from django.conf import settings

# permissions

def can_edit_or_delete_log(user, log_entry):
    return (
        log_entry.user == user or
        (user.profile.school == log_entry.user.profile.school and (
            user.profile.is_admin() or user.profile.is_manager()
        ))
    )

# send invite mail

def send_invite_email(invite, school, request):
    invite_url = request.build_absolute_uri(f"/accept-invite/{invite.token}/")

    send_mail(
        subject=f"You're invited to join {school.name} on Chatterdillo",
        message=(
            f"Hi there!\n\nYou've been invited to join {school.name} on Chatterdillo.\n\n"
            f"Click the link below to set up your account:\n{invite_url}\n\n"
            f"This invite will expire in 7 days.\n\n"
            f"If you weren’t expecting this email, feel free to ignore it."
        ),
        from_email='noreply@chatterdillo.com',
        recipient_list=[invite.email],
        fail_silently=False,
    )