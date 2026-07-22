from django.shortcuts import render, redirect
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.contrib import messages
from django.http import Http404

from littleTalkApp.models import EmailVerificationCode
from littleTalkApp.utilities import send_email_verification_code


User = get_user_model()


@login_required
@require_http_methods(["GET", "POST"])
def verify_email_view(request):
    """
    Email verification page where users can:
    1. Enter a 6-digit code
    2. Request a code resend (with cooldown)
    """
    request.hide_sidebar = True
    user = request.user

    # If already verified, redirect to profile
    if user.email_verified:
        return redirect("profile")

    # Get or create verification code
    try:
        verification_code = user.email_verification_code
    except EmailVerificationCode.DoesNotExist:
        # Create a new verification code if none exists
        verification_code = EmailVerificationCode.objects.create(user=user)
        send_email_verification_code(user, verification_code, request)

    if request.method == "POST":
        action = request.POST.get("action")

        if action == "verify":
            # User submitted a code
            code = request.POST.get("code", "").strip().upper()

            if not code:
                messages.error(request, "Please enter the verification code.")
                return render(request, "auth/verify_email.html", {
                    "verification_code": verification_code,
                    "error": "Please enter the verification code.",
                })

            # Check if code is expired
            if verification_code.is_expired():
                messages.error(request, "Your verification code has expired. Please request a new one.")
                return render(request, "auth/verify_email.html", {
                    "verification_code": verification_code,
                    "error": "Your verification code has expired. Please request a new one.",
                })

            # Check if max attempts exceeded
            if verification_code.is_attempt_limit_exceeded():
                messages.error(
                    request,
                    "Too many failed attempts. Please request a new code.",
                )
                return render(request, "auth/verify_email.html", {
                    "verification_code": verification_code,
                    "error": "Too many failed attempts. Please request a new code.",
                })

            # Check if code matches
            if code != verification_code.code:
                verification_code.increment_attempts()
                remaining_attempts = 5 - verification_code.attempts
                messages.error(
                    request,
                    f"Invalid code. {remaining_attempts} attempts remaining.",
                )
                return render(request, "auth/verify_email.html", {
                    "verification_code": verification_code,
                    "error": f"Invalid code. {remaining_attempts} attempts remaining.",
                })

            # Code is correct - mark user as verified
            user.email_verified = True
            user.email_verified_at = timezone.now()
            user.save(update_fields=["email_verified", "email_verified_at"])
            verification_code.mark_used()

            messages.success(request, "Email verified successfully!")
            return redirect("profile")

        elif action == "resend":
            # User requested a new code
            try:
                verification_code.regenerate_code()
                send_email_verification_code(user, verification_code, request)
                messages.success(
                    request,
                    "A new verification code has been sent to your email.",
                )
            except Exception as e:
                messages.error(
                    request,
                    "Please wait before requesting a new code. Try again in a few moments.",
                )

            return render(request, "auth/verify_email.html", {
                "verification_code": verification_code,
            })

    return render(request, "auth/verify_email.html", {
        "verification_code": verification_code,
    })


def verify_email_link_view(request, link_token):
    """
    Handle the click-link email verification.
    This is a public view (no login required) to verify via UUID link.
    """
    request.hide_sidebar = True
    try:
        verification_code = EmailVerificationCode.objects.get(link_token=link_token)
    except EmailVerificationCode.DoesNotExist:
        raise Http404("Invalid or expired verification link.")

    user = verification_code.user

    # Check if already verified
    if user.email_verified:
        messages.info(request, "Your email is already verified.")
        return redirect("login")

    # Check if code is expired
    if verification_code.is_expired():
        messages.error(
            request,
            "Your verification link has expired. Please request a new code.",
        )
        return redirect("verify_email")

    # Verify the email
    user.email_verified = True
    user.email_verified_at = timezone.now()
    user.save(update_fields=["email_verified", "email_verified_at"])
    verification_code.mark_used()

    messages.success(request, "Email verified successfully!")

    # If user is authenticated, redirect to profile; otherwise to login
    if request.user.is_authenticated:
        return redirect("profile")
    else:
        return redirect("login")
