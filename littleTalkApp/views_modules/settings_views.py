from django.contrib import messages
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render

from littleTalkApp.forms import PasswordUpdateForm, UserUpdateForm


@login_required
def settings_view(request):
    user_form = UserUpdateForm(instance=request.user)
    password_form = PasswordUpdateForm(user=request.user)

    return render(
        request,
        "settings.html",
        {"user_form": user_form, "password_form": password_form},
    )


@login_required
def change_user_details(request):
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
        "settings.html",
        {"user_form": user_form, "password_form": password_form},
    )


@login_required
def change_password(request):
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
            "settings.html",
            {"user_form": user_form, "password_form": password_form},
        )

    user_form = UserUpdateForm(instance=request.user)
    password_form = PasswordUpdateForm(user=request.user)
    return render(
        request,
        "settings.html",
        {"user_form": user_form, "password_form": password_form},
    )
