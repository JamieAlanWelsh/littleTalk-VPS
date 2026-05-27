"""
Skolon views.

Webhook endpoints (POST, csrf_exempt — Skolon calls from its own servers):
  POST /webhooks/skolon/              – API data-edits notification (roster/license changes)
  POST /webhooks/skolon/remove-user/  – GDPR: delete a user's data
  POST /webhooks/skolon/remove-class/ – GDPR: delete a class

SSO endpoint (GET — browser redirect from Skolon IDP):
  GET  /sso/callback/                 – Exchange auth code, resolve/provision user, log in

Modelled on the existing stripe_webhook pattern in views_modules/subscription.py.
"""

import json
import logging
import urllib.parse
import uuid

from django.conf import settings
from django.contrib import messages
from django.contrib.auth import get_user_model, login
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from littleTalkApp.integrations.skolon_client import api_client, token_manager
from littleTalkApp.integrations.skolon_sync import (
    sync_groups,
    sync_licenses,
    sync_schools,
    sync_users,
)
from littleTalkApp.models import (
    Profile,
    Role,
    School,
    SchoolMembership,
    SkolonOrg,
    SkolonSyncCursor,
    SkolonUser,
)

logger = logging.getLogger(__name__)

User = get_user_model()

SKOLON_SYNC_ORDER = ("school", "license", "user", "group")
ALLOWED_SKOLON_SSO_ROLES = {"TEACHER"}

# ---------------------------------------------------------------------------
# Main data-edits webhook
# ---------------------------------------------------------------------------

# Entity names Skolon sends → our sync functions.
# Built inside the handler so module-level patching works in tests.
def _get_sync_fn(entity):
    return {
        "user": sync_users,
        "school": sync_schools,
        "group": sync_groups,
        "license": sync_licenses,
    }.get(entity)


def _get_ordered_skolon_entities(entities):
    requested = {entity for entity in (entities or []) if _get_sync_fn(entity)}
    if "user" in requested or "license" in requested:
        requested.add("school")
    if "license" in requested:
        requested.add("user")
    return [entity for entity in SKOLON_SYNC_ORDER if entity in requested]


def _run_skolon_syncs(entities):
    ordered_entities = _get_ordered_skolon_entities(entities)
    for entity in ordered_entities:
        sync_fn = _get_sync_fn(entity)
        if sync_fn:
            sync_fn(api_client)
    return ordered_entities


def _load_skolon_user(skolon_user_id):
    return (
        SkolonUser.objects.select_related("user", "skolon_org__school")
        .filter(skolon_id=skolon_user_id, is_deleted=False)
        .first()
    )


def _needs_skolon_access_refresh(skolon_user_obj):
    if skolon_user_obj is None:
        return True
    if skolon_user_obj.skolon_org is None or skolon_user_obj.skolon_org.school is None:
        return True
    return not skolon_user_obj.skolon_org.school.has_valid_license()


def _is_allowed_skolon_sso_role(skolon_role: str) -> bool:
    return (skolon_role or "").strip().upper() in ALLOWED_SKOLON_SSO_ROLES


@csrf_exempt
@require_POST
def skolon_webhook(request):
    """
    Receives Skolon data-edits notifications and triggers incremental sync.

    Expected body (JSON):
        { "entities": ["user", "license"] }

    Responds 200 immediately; sync runs synchronously for MVP.
    If any individual sync step fails it is logged but does not prevent
    the remaining entities from being processed.
    """
    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        logger.warning("Skolon webhook: invalid JSON body received.")
        return HttpResponse(status=400)

    entities = data.get("entities", [])
    logger.info(
        "Skolon data-edits webhook received: entities=%s",
        entities or "(none)",
    )

    ordered_entities = _get_ordered_skolon_entities(entities)
    unknown_entities = [entity for entity in entities if entity not in ordered_entities and not _get_sync_fn(entity)]

    for entity in ordered_entities:
        try:
            _get_sync_fn(entity)(api_client)
        except Exception:
            logger.exception(
                "Skolon webhook: sync failed for entity '%s'.", entity
            )

    for entity in unknown_entities:
        logger.warning("Skolon webhook: unknown entity type '%s' — skipped.", entity)

    return JsonResponse({"received": True}, status=200)


# ---------------------------------------------------------------------------
# GDPR — remove user data
# ---------------------------------------------------------------------------

@csrf_exempt
@require_POST
def skolon_remove_user(request):
    """
    GDPR deletion endpoint.  Skolon calls this when a user is removed from a school
    and requests that we delete or anonymise their data.

    Expected body (JSON):
        { "userId": "<skolon_user_id>" }

    Action:
      - Detach the SkolonUser from its local User link.
      - Mark the SkolonUser as deleted.
      - Deactivate (set unusable password, clear email) the local User so they
        can no longer log in, while preserving log/audit rows.
    """
    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        logger.warning("Skolon remove-user webhook: invalid JSON body.")
        return HttpResponse(status=400)

    skolon_id = data.get("userId")
    if not skolon_id:
        logger.warning("Skolon remove-user webhook: missing userId in payload.")
        return HttpResponse(status=400)

    logger.info("Skolon GDPR remove-user request for skolon_id=%s", skolon_id)

    try:
        skolon_user = SkolonUser.objects.select_related("user").filter(
            skolon_id=skolon_id
        ).first()

        if skolon_user:
            local_user = skolon_user.user

            # Anonymise the local account if one is linked.
            if local_user:
                local_user.set_unusable_password()
                local_user.email_encrypted = None
                local_user.email_hash = None
                local_user.save(update_fields=["password", "email_encrypted", "email_hash"])
                logger.info(
                    "Anonymised local user pk=%s linked to Skolon id=%s",
                    local_user.pk,
                    skolon_id,
                )

            skolon_user.user = None
            skolon_user.is_deleted = True
            skolon_user.save(update_fields=["user", "is_deleted"])
        else:
            # No matching record — still return 200 (idempotent).
            logger.info(
                "Skolon remove-user: no SkolonUser found for id=%s (already removed or never synced).",
                skolon_id,
            )
    except Exception:
        logger.exception(
            "Skolon remove-user: error processing deletion for skolon_id=%s", skolon_id
        )
        return HttpResponse(status=500)

    return JsonResponse({"removed": True}, status=200)


# ---------------------------------------------------------------------------
# GDPR — remove class data
# ---------------------------------------------------------------------------

@csrf_exempt
@require_POST
def skolon_remove_class(request):
    """
    GDPR deletion endpoint.  Skolon calls this when a class/group is removed
    and requests that we delete the associated data.

    Expected body (JSON):
        { "classId": "<skolon_group_id>" }  (may also be "groupId")

    Action:
      - Find any SkolonUser records linked to this class via skolon_org and
        whose role indicates class membership — not implemented at group level yet
        as groups are not yet stored locally.
      - Mark the SkolonOrg's group reference as deleted if we can identify it.
      - Log the request for audit purposes.
    """
    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        logger.warning("Skolon remove-class webhook: invalid JSON body.")
        return HttpResponse(status=400)

    class_id = data.get("classId") or data.get("groupId")
    if not class_id:
        logger.warning("Skolon remove-class webhook: missing classId/groupId in payload.")
        return HttpResponse(status=400)

    logger.info(
        "Skolon GDPR remove-class request for class_id=%s — logged for audit. "
        "Full cohort deletion will be wired when group→Cohort mapping is implemented.",
        class_id,
    )

    # Re-sync groups so the versionTag cursor advances past this deletion.
    try:
        sync_groups(api_client)
    except Exception:
        logger.exception("Skolon remove-class: group re-sync failed.")

    return JsonResponse({"removed": True}, status=200)


# ---------------------------------------------------------------------------
# SSO callback
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# SSO launch
# ---------------------------------------------------------------------------

def sso_launch(request):
    """
    SSO launch — redirect the browser to the Skolon IDP to start authentication.

    This URL is registered in the Skolon Partner Portal as the tool's SSO entry
    point.  Skolon embeds it as the tool tile URL, so clicking the tile in the
    Skolon platform sends the user here first.
    """
    auth_url = (
        f"{settings.SKOLON_IDP_BASE_URL}/oauth/auth"
        f"?client_id={urllib.parse.quote(settings.SKOLON_CLIENT_ID)}"
        f"&redirect_uri={urllib.parse.quote(settings.SKOLON_SSO_CALLBACK_URL)}"
        f"&response_type=code"
        f"&scope=authenticatedUser.profile.read"
    )
    return redirect(auth_url)


def _map_skolon_role(skolon_role: str) -> str:
    """Map a Skolon role string to a local Role constant."""
    role = (skolon_role or "").lower()
    if "admin" in role:
        return Role.ADMIN
    if "manager" in role:
        return Role.TEAM_MANAGER
    return Role.STAFF


def _provision_local_user(skolon_user_obj: SkolonUser) -> "get_user_model()":
    """
    Create a local User, Profile, and SchoolMembership for a Skolon user
    who has no local account yet.  Mirrors the pattern in school_signup/accept_invite.
    """
    User = get_user_model()

    if not _is_allowed_skolon_sso_role(skolon_user_obj.role or ""):
        raise ValueError("Only TEACHER Skolon users can be provisioned locally.")

    local_role = _map_skolon_role(skolon_user_obj.role or "")
    school = (
        skolon_user_obj.skolon_org.school
        if skolon_user_obj.skolon_org and skolon_user_obj.skolon_org.school
        else None
    )

    user = User.objects.create_user(username=str(uuid.uuid4()))
    # SSO-only account — no password login.
    user.set_unusable_password()
    user.save()

    profile = Profile.objects.create(user=user, role=local_role)

    if school:
        profile.schools.add(school)
        SchoolMembership.objects.create(
            profile=profile,
            school=school,
            role=local_role,
            is_active=True,
        )

    logger.info(
        "Provisioned local user pk=%s for SkolonUser %s (role=%s, school=%s)",
        user.pk,
        skolon_user_obj.skolon_id,
        local_role,
        school,
    )
    return user


def sso_callback(request):
    """
    SSO callback — browser is redirected here by Skolon after the user authenticates.

    Flow (ported from the starter script sso_callback):
      1. Receive ?code= from Skolon IDP.
      2. Exchange code for an access token via client_credentials token manager.
      3. Call /v2/partner/user/session to resolve the Skolon userId.
      4. Look up SkolonUser by skolon_id.  If missing, trigger a user sync and retry.
      5. If SkolonUser has no local User linked, provision one.
      6. Log the user in and redirect to the normal post-login destination.
    """
    request.hide_sidebar = True

    # --- OAuth error from IDP ---
    error = request.GET.get("error")
    if error:
        description = request.GET.get("error_description", error)
        logger.warning("Skolon SSO error: %s — %s", error, description)
        messages.error(request, f"Skolon login failed: {description}")
        return redirect("login")

    code = request.GET.get("code")
    if not code:
        logger.warning("Skolon SSO callback reached without an auth code.")
        messages.error(request, "No authorisation code received from Skolon.")
        return redirect("login")

    try:
        # Step 1: exchange code → access token (SSO flow, not client_credentials)
        access_token = token_manager.exchange_code_for_token(code)

        # Step 2: resolve who just logged in
        user_session = api_client.get_user_session(access_token)
        skolon_user_id = user_session.get("userId")

        if not skolon_user_id:
            logger.error("Skolon user session returned no userId: %s", user_session)
            messages.error(request, "Could not retrieve your Skolon identity. Please contact support.")
            return redirect("login")

        # Step 3: find the SkolonUser row (may need a fresh sync)
        skolon_user_obj = _load_skolon_user(skolon_user_id)

        if _needs_skolon_access_refresh(skolon_user_obj):
            logger.info(
                "Skolon user %s requires a catch-up sync before access can be evaluated.",
                skolon_user_id,
            )
            _run_skolon_syncs(["school", "license", "user"])
            skolon_user_obj = _load_skolon_user(skolon_user_id)

        if skolon_user_obj is None:
            logger.info(
                "Skolon user %s still missing after ordered catch-up; resetting USER cursor and retrying user sync.",
                skolon_user_id,
            )
            SkolonSyncCursor.objects.filter(
                entity_type=SkolonSyncCursor.EntityType.USER
            ).delete()
            _run_skolon_syncs(["user"])
            skolon_user_obj = _load_skolon_user(skolon_user_id)

        if skolon_user_obj is None:
            logger.error(
                "SkolonUser %s still not found after sync. "
                "The account may not have a matching externalId.",
                skolon_user_id,
            )
            messages.error(
                request,
                "Your Skolon account could not be matched. Please contact support.",
            )
            return redirect("login")

        if not _is_allowed_skolon_sso_role(skolon_user_obj.role or ""):
            logger.warning(
                "Skolon SSO: user %s has unsupported role %s.",
                skolon_user_id,
                skolon_user_obj.role,
            )
            messages.error(
                request,
                "Your Skolon account is not eligible for Chatterdillo access.",
            )
            return redirect("login")

        # Step 3.5: verify the school has a valid, non-expired license (uses the
        # locally-cached value maintained by sync_licenses / the license webhook).
        school = (
            skolon_user_obj.skolon_org.school
            if skolon_user_obj.skolon_org
            else None
        )
        if not school or not school.has_valid_license():
            logger.warning(
                "Skolon SSO: user %s has no valid licence — access denied.", skolon_user_id
            )
            messages.error(
                request,
                "Your Skolon account does not have an active licence for Chatterdillo. "
                "Please contact your school administrator.",
            )
            return redirect("login")

        # Step 4: get or create a local User
        local_user = skolon_user_obj.user
        if local_user is None:
            local_user = _provision_local_user(skolon_user_obj)
            skolon_user_obj.user = local_user
            skolon_user_obj.save(update_fields=["user"])

        # Step 5: log in and redirect
        login(request, local_user, backend="django.contrib.auth.backends.ModelBackend")
        logger.info(
            "SSO login successful: local user pk=%s via Skolon id=%s",
            local_user.pk,
            skolon_user_id,
        )
        return redirect(settings.LOGIN_REDIRECT_URL)

    except Exception:
        logger.exception("Skolon SSO callback raised an unexpected error.")
        messages.error(
            request,
            "Login via Skolon failed unexpectedly. Please try again or contact support.",
        )
        return redirect("login")
