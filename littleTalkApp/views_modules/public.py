from django.conf import settings
from django.contrib import messages
from django.core.mail import send_mail
from django.shortcuts import redirect, render

from honeypot.decorators import check_honeypot

from littleTalkApp.decorators import valid_game_required
from littleTalkApp.game_data import GAME_DESCRIPTIONS
from littleTalkApp.landing_content import get_landing_testimonials


def home(request):
    request.hide_sidebar = True
    if request.user.is_authenticated:
        return redirect("/practise/")

    return render(
        request,
        "public/landing.html",
        {
            "testimonials": get_landing_testimonials(),
        },
    )


@valid_game_required
def game_description(request, game_name):
    game = GAME_DESCRIPTIONS.get(game_name, None)
    return render(
        request,
        "public/game_description.html",
        {
            "game": game,
            "game_descriptions": GAME_DESCRIPTIONS,
            "current_game_name": game_name,
        },
    )


def support(request):
    request.hide_sidebar = True
    return render(request, "public/support.html", {})


@check_honeypot
def send_support_email(request):
    if request.method == "POST":
        name = request.POST.get("name")
        email = request.POST.get("email")
        message = request.POST.get("message")

        full_message = f"Message from {name} <{email}>:\n\n{message}"

        send_mail(
            subject="Support Request - Chatterdillo",
            message=full_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=["support@chatterdillo.com"],
            fail_silently=False,
        )

        messages.success(
            request, "Your message has been sent. We'll get back to you shortly."
        )
        return redirect("support")

    return redirect("support")


def tips(request):
    return render(request, "public/tips.html", {})


def method(request):
    context = {
        "game_descriptions": GAME_DESCRIPTIONS,
    }
    return render(request, "public/method.html", context)


def about(request):
    return render(request, "public/about.html")


def terms_and_conditions(request):
    request.hide_sidebar = True
    return render(request, "public/legal/terms.html")


def privacy_policy(request):
    request.hide_sidebar = True
    return render(request, "public/legal/privacy.html")


def data_policy(request):
    request.hide_sidebar = True
    return render(request, "public/legal/data-policy.html")
