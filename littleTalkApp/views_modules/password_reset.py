from django.contrib import messages
from django.contrib.auth import get_user_model
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils import timezone
from django.http import Http404
from django_ratelimit.decorators import ratelimit

from littleTalkApp.forms import PasswordResetConfirmForm, PasswordResetRequestForm
from littleTalkApp.models import PasswordResetToken
from littleTalkApp.utilities import hash_email, send_password_reset_email

User = get_user_model()

RESET_REQUEST_GENERIC_MESSAGE = (
    "If an account exists for that email, we have sent a password reset link."
)


@ratelimit(key="ip", rate="5/h", method="POST", block=False)
def password_reset_request_view(request):
    request.hide_sidebar = True
    if request.method == "POST":
        form = PasswordResetRequestForm(request.POST)
        if form.is_valid():
            # Throttled clients get the same generic response — no enumeration signal.
            if not getattr(request, "limited", False):
                _issue_reset_link(form.cleaned_data["email"], request)

            messages.success(request, RESET_REQUEST_GENERIC_MESSAGE)
            return render(request, "auth/password_reset_request.html", {"form": form, "submitted": True})

        return render(request, "auth/password_reset_request.html", {"form": form})

    form = PasswordResetRequestForm()
    return render(request, "auth/password_reset_request.html", {"form": form})


def _issue_reset_link(email, request):
    user = User.objects.filter(email_hash=hash_email(email)).first()
    if not user:
        return

    try:
        token = user.password_reset_token
    except PasswordResetToken.DoesNotExist:
        token = PasswordResetToken.objects.create(user=user)
    else:
        try:
            token.regenerate()
        except Exception:
            # Within cooldown window — stay silent to avoid leaking account existence.
            return

    send_password_reset_email(user, token, request)


def password_reset_confirm_view(request, link_token):
    request.hide_sidebar = True
    try:
        token = PasswordResetToken.objects.select_related("user").get(link_token=link_token)
    except PasswordResetToken.DoesNotExist:
        raise Http404("Invalid or expired password reset link.")

    if token.is_expired():
        messages.error(request, "This password reset link has expired. Please request a new one.")
        return redirect("password_reset")

    if request.method == "POST":
        form = PasswordResetConfirmForm(request.POST)
        if form.is_valid():
            user = token.user
            user.set_password(form.cleaned_data["new_password"])
            user.save(update_fields=["password"])
            token.mark_used()
            messages.success(request, "Your password has been updated. Please log in with your new password.")
            return redirect("login")
        return render(request, "auth/password_reset_confirm.html", {"form": form, "token": token})

    form = PasswordResetConfirmForm()
    return render(request, "auth/password_reset_confirm.html", {"form": form, "token": token})
