from django.contrib import messages
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render

from littleTalkApp.forms import PasswordUpdateForm, UserUpdateForm


@login_required
def settings_view(request):
    """Renders settings_views/settings.html — the account settings page.

    Displays both the user-details form and the change-password form.
    """

    user_form = UserUpdateForm(instance=request.user)
    password_form = PasswordUpdateForm(user=request.user)

    return render(
        request,
        "settings_views/settings.html",
        {"user_form": user_form, "password_form": password_form},
    )


@login_required
def change_user_details(request):
    """Handles POST from the user-details form on the settings page.

    On success, saves the updated user details and redirects back to settings
    with a success message. On validation failure, re-renders the settings page
    with error feedback.
    """

    if request.method == "POST":
        user_form = UserUpdateForm(request.POST, instance=request.user)
        password_form = PasswordUpdateForm(user=request.user)

        if user_form.is_valid():
            user_form.save()
            messages.success(request, "Your details have been updated successfully!")
            return redirect("settings")

        messages.error(request, "Error updating details. Please try again.")
    else:
        user_form = UserUpdateForm(instance=request.user)
        password_form = PasswordUpdateForm(user=request.user)

    return render(
        request,
        "settings_views/settings.html",
        {"user_form": user_form, "password_form": password_form},
    )


@login_required
def change_password(request):
    """Handles POST from the change-password form on the settings page.

    Validates the new password, updates it, and calls update_session_auth_hash so
    the user is not logged out. On success, redirects to the settings page.
    Always re-renders settings_views/settings.html on GET or validation failure.
    """

    if request.method == "POST":
        user_form = UserUpdateForm(instance=request.user)
        password_form = PasswordUpdateForm(request.user, request.POST)

        if password_form.is_valid():
            new_password = password_form.cleaned_data.get("new_password")
            request.user.set_password(new_password)
            request.user.save()
            update_session_auth_hash(request, request.user)

            messages.success(request, "Your password has been updated successfully!")
            return redirect("settings")

        messages.error(request, "Error updating password. Please try again.")

        return render(
            request,
            "settings_views/settings.html",
            {"user_form": user_form, "password_form": password_form},
        )

    user_form = UserUpdateForm(instance=request.user)
    password_form = PasswordUpdateForm(user=request.user)
    return render(
        request,
        "settings_views/settings.html",
        {"user_form": user_form, "password_form": password_form},
    )
