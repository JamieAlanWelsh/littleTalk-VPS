from django.conf import settings
from django.contrib import messages
from django.core.mail import send_mail
from django.shortcuts import redirect, render

from honeypot.decorators import check_honeypot

from littleTalkApp.decorators import valid_game_required
from littleTalkApp.content.game_descriptions import GAME_DESCRIPTIONS
from littleTalkApp.content.testimonials import get_landing_testimonials


def home(request):
    """Renders public/landing.html — the public-facing landing page.

    Redirects authenticated users straight to /practise/. Passes testimonial data
    to the template for display on the landing page.
    """

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
    """Renders public/game_description.html — a description page for a specific game.

    The game_name is validated by the @valid_game_required decorator before this
    view is called. Passes all game descriptions for the sidebar nav.
    """

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
    """Renders public/support.html — the public support / help page."""

    request.hide_sidebar = True
    return render(request, "public/support.html", {})


@check_honeypot
def send_support_email(request):
    """Handles POST from the support contact form, sends an email to the support
    address, then redirects back to the support page with a success message.
    Non-POST requests are also redirected to the support page. Protected by a
    honeypot field to deter bots.
    """

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
    """Renders public/tips.html — a static tips and best-practice page."""

    return render(request, "public/tips.html", {})


def method(request):
    """Renders public/method.html — an overview of the educational methodology,
    including descriptions of all available games.
    """

    context = {
        "game_descriptions": GAME_DESCRIPTIONS,
    }
    return render(request, "public/method.html", context)


def about(request):
    """Renders public/about.html — the public about/team page."""

    return render(request, "public/about.html")


def terms_and_conditions(request):
    """Renders public/legal/terms.html — the Terms and Conditions page."""

    request.hide_sidebar = True
    return render(request, "public/legal/terms.html")


def privacy_policy(request):
    """Renders public/legal/privacy.html — the Privacy Policy page."""

    request.hide_sidebar = True
    return render(request, "public/legal/privacy.html")


def data_policy(request):
    """Renders public/legal/data-policy.html — the Data Policy page."""

    request.hide_sidebar = True
    return render(request, "public/legal/data-policy.html")
