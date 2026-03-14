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
    """Renders subscription/subscribe.html — the subscription plan information page.
    Accessible without login so prospective users can review pricing.
    """

    request.hide_sidebar = True
    return render(request, "subscription/subscribe.html")


def license_expired(request):
    """Renders subscription/license_expired.html — shown when a parent's subscription
    or free trial has lapsed and they need to renew to continue.
    """

    request.hide_sidebar = True
    return render(request, "subscription/license_expired.html")


@login_required
def create_checkout_session(request):
    """Creates a Stripe Checkout session for the parent subscription plan and
    redirects the user to the Stripe-hosted payment page.
    """

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
    """Handles incoming Stripe webhook events. CSRF is intentionally disabled as
    Stripe signs requests with a signature header instead.

    On a 'checkout.session.completed' event, looks up the user by email hash and
    marks their ParentProfile as subscribed, storing the Stripe customer ID.
    """

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
    """Renders subscription/success.html — the post-payment confirmation page shown
    after a Stripe Checkout session completes successfully.
    """

    messages.info(
        request, "Subscription activated successfully. Welcome to the community!"
    )
    return render(request, "subscription/success.html")


@login_required
def manage_subscription(request):
    """Creates a Stripe Billing Portal session and redirects the user to manage
    their subscription (update payment method, cancel, etc.). Redirects to the
    subscribe page if no Stripe customer ID is on record.
    """

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
