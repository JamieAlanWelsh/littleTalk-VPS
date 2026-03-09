from django.conf import settings
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.views.decorators.csrf import csrf_exempt

import stripe

from littleTalkApp.utilites import hash_email

stripe.api_key = settings.STRIPE_SECRET_KEY


def subscribe(request):
    request.hide_sidebar = True
    return render(request, "lockout/subscribe.html")


def license_expired(request):
    request.hide_sidebar = True
    return render(request, "lockout/license_expired.html")


@login_required
def create_checkout_session(request):
    checkout_session = stripe.checkout.Session.create(
        customer_email=request.user.email_encrypted,
        payment_method_types=["card"],
        line_items=[
            {
                "price": settings.STRIPE_PARENT_PRICE_ID,
                "quantity": 1,
            }
        ],
        mode="subscription",
        success_url=request.build_absolute_uri("/subscribe/success/"),
        cancel_url=request.build_absolute_uri("/subscribe/"),
    )

    return redirect(checkout_session.url)


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META["HTTP_STRIPE_SIGNATURE"]
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        email = session.get("customer_email")
        customer_id = session.get("customer")

        if email:
            email_lower = email.lower()
            email_hash = hash_email(email_lower)

            user = None
            if email_hash:
                user = get_user_model().objects.filter(email_hash=email_hash).first()

            if user and hasattr(user, "profile"):
                parent_profile = user.profile.parent_profile
                parent_profile.is_subscribed = True
                parent_profile.stripe_customer_id = customer_id
                parent_profile.save()

    return HttpResponse(status=200)


@login_required
def subscribe_success(request):
    messages.info(
        request, "Subscription activated successfully. Welcome to the community!"
    )
    return render(request, "subscribe/success.html")


@login_required
def manage_subscription(request):
    user = request.user
    profile = user.profile
    parent_profile = getattr(profile, "parent_profile", None)

    if not parent_profile:
        return redirect("profile")

    stripe_customer_id = parent_profile.stripe_customer_id

    if not stripe_customer_id:
        return redirect("subscribe")

    session = stripe.billing_portal.Session.create(
        customer=stripe_customer_id,
        return_url=request.build_absolute_uri("/profile/"),
    )
    return redirect(session.url)
