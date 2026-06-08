"""
Skolon sync services — Django ORM implementation of the starter script sync functions.

Each function:
  1. Reads the stored versionTag cursor so only changed records are fetched.
  2. Upserts the relevant Django models.
  3. Saves the new versionTag so the next sync is incremental.

License sync also propagates School.is_licensed / School.license_expires_at so
the existing AccessControlMiddleware access gates work without any changes.
"""

import logging
from datetime import datetime, timezone as dt_timezone
from typing import Dict, List, Optional, Tuple

from django.utils import timezone as django_tz

from littleTalkApp.models import (
    School,
    SkolonOrg,
    SkolonSyncCursor,
    SkolonUser,
)

logger = logging.getLogger(__name__)

SYNCED_SKOLON_ROLES = {"TEACHER"}


def _get_user_school_id(user: Dict) -> Optional[str]:
    """Return the first school id from the live Skolon user payload."""
    schools = user.get("schools") or []
    if isinstance(schools, list):
        for school in schools:
            if isinstance(school, dict) and school.get("id"):
                return school["id"]
    return user.get("schoolId") or user.get("school_id")


def _get_user_role(user: Dict) -> Optional[str]:
    """Return the role-like field Skolon currently sends for users."""
    return user.get("userType") or user.get("role") or user.get("type")


def _normalise_skolon_role(role: Optional[str]) -> str:
    return (role or "").strip().upper()


def _get_license_school_id(lic: Dict) -> Optional[str]:
    """Return the school id from the live Skolon license payload."""
    return (
        lic.get("ownerSchoolId")
        or lic.get("schoolId")
        or lic.get("school_id")
    )


def _ensure_local_school_for_org(org: Optional[SkolonOrg]) -> Tuple[Optional[School], bool]:
    """Create the local School on first active license, not during raw school sync."""
    if org is None or org.is_deleted:
        return None, False
    if org.school is None:
        local_school = School.objects.create(name=org.name or org.skolon_id)
        org.school = local_school
        org.save(update_fields=["school"])
        logger.info(
            "Created local School '%s' for licensed Skolon org %s",
            local_school.name,
            org.skolon_id,
        )
        return local_school, True
    return org.school, False


# ---------------------------------------------------------------------------
# Cursor helpers
# ---------------------------------------------------------------------------

def _get_cursor(entity_type: str) -> Optional[str]:
    """Return the stored versionTag for an entity type, or None."""
    cursor = SkolonSyncCursor.objects.filter(entity_type=entity_type).first()
    return cursor.version_tag if cursor else None


def _save_cursor(entity_type: str, version_tag: Optional[str]):
    """Persist a new versionTag for an entity type."""
    if version_tag:
        SkolonSyncCursor.objects.update_or_create(
            entity_type=entity_type,
            defaults={
                "version_tag": version_tag,
                "last_synced_at": django_tz.now(),
            },
        )


# ---------------------------------------------------------------------------
# Individual sync functions
# ---------------------------------------------------------------------------

def sync_schools(client) -> Dict[str, object]:
    """
    Upsert SkolonOrg records from the Skolon schools endpoint.
    Local School creation is deferred until an active license is present.
    """
    cursor = _get_cursor(SkolonSyncCursor.EntityType.SCHOOL)
    result = client.get_schools(version_tag=cursor)
    schools = result["schools"]
    created_count = 0
    updated_count = 0

    for school in schools:
        skolon_id = school.get("id")
        if not skolon_id:
            continue

        is_deleted = school.get("isDeleted", False)

        org, created = SkolonOrg.objects.update_or_create(
            skolon_id=skolon_id,
            defaults={
                "name": school.get("name", ""),
                "organisation_number": school.get("organizationNumber"),
                "is_deleted": is_deleted,
            },
        )
        if created:
            created_count += 1
        else:
            updated_count += 1

    _save_cursor(SkolonSyncCursor.EntityType.SCHOOL, result.get("versionTag"))
    stats = {
        "fetched": len(schools),
        "orgs_created": created_count,
        "orgs_updated": updated_count,
        "local_schools_created": 0,
    }
    logger.info(
        "School sync complete: fetched=%s orgs_created=%s orgs_updated=%s local_schools_created=%s",
        stats["fetched"],
        stats["orgs_created"],
        stats["orgs_updated"],
        stats["local_schools_created"],
    )
    return {"items": schools, "stats": stats}


def sync_users(client) -> Dict[str, object]:
    """
    Upsert teacher-only SkolonUser records, linking them to licensed local schools.
    Deleted users are flagged; their local User link is left intact for auditing.
    """
    cursor = _get_cursor(SkolonSyncCursor.EntityType.USER)
    result = client.get_users(version_tag=cursor)
    users = result["users"]
    eligible_count = 0
    created_count = 0
    updated_count = 0
    skipped_non_teacher = 0
    skipped_unlicensed_school = 0

    for user in users:
        skolon_id = user.get("id")
        if not skolon_id:
            continue

        role = _normalise_skolon_role(_get_user_role(user))
        if role not in SYNCED_SKOLON_ROLES:
            skipped_non_teacher += 1
            continue

        eligible_count += 1

        # Prefer externalId; fall back to Skolon's own id.
        external_id = user.get("externalId") or skolon_id
        school_id = _get_user_school_id(user)
        org = (
            SkolonOrg.objects.filter(skolon_id=school_id).first()
            if school_id
            else None
        )
        if org is None or org.school is None:
            logger.info(
                "Skipping Skolon user %s because school %s has no licensed local School yet.",
                skolon_id,
                school_id,
            )
            skipped_unlicensed_school += 1
            continue

        skolon_user, created = SkolonUser.objects.update_or_create(
            skolon_id=skolon_id,
            defaults={
                "external_id": external_id,
                "skolon_org": org,
                "role": role,
                "is_deleted": user.get("isDeleted", False),
            },
        )
        if created:
            created_count += 1
        else:
            updated_count += 1

    _save_cursor(SkolonSyncCursor.EntityType.USER, result.get("versionTag"))
    stats = {
        "fetched": len(users),
        "eligible": eligible_count,
        "created": created_count,
        "updated": updated_count,
        "skipped_non_teacher": skipped_non_teacher,
        "skipped_unlicensed_school": skipped_unlicensed_school,
        "applied": created_count + updated_count,
    }
    logger.info(
        "User sync complete: fetched=%s eligible=%s applied=%s created=%s updated=%s skipped_non_teacher=%s skipped_unlicensed_school=%s",
        stats["fetched"],
        stats["eligible"],
        stats["applied"],
        stats["created"],
        stats["updated"],
        stats["skipped_non_teacher"],
        stats["skipped_unlicensed_school"],
    )
    return {"items": users, "stats": stats}


def sync_groups(client) -> Dict[str, object]:
    """
    Fetch Skolon groups and advance the cursor.
    Cohort mapping is a future step — groups are logged but not yet written to DB.
    """
    cursor = _get_cursor(SkolonSyncCursor.EntityType.GROUP)
    result = client.get_groups(version_tag=cursor)
    groups = result["groups"]

    _save_cursor(SkolonSyncCursor.EntityType.GROUP, result.get("versionTag"))
    stats = {
        "fetched": len(groups),
    }
    logger.info(
        "Group sync complete: fetched=%s (cohort mapping pending).",
        stats["fetched"],
    )
    return {"items": groups, "stats": stats}


def _parse_expiry(expiration_date: Optional[str]) -> Optional[datetime]:
    """Parse an ISO 8601 expiry string to an aware datetime, or None (perpetual)."""
    if not expiration_date:
        return None
    try:
        dt = datetime.fromisoformat(expiration_date.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=dt_timezone.utc)
        return dt
    except (ValueError, AttributeError):
        return None


def sync_licenses(client) -> Dict[str, object]:
    """
    Sync Skolon licenses and update school-level access.

        Logic:
        - For school-targeted licenses, `ownerSchoolId` is authoritative.
        - Only fall back to the `users[]` array when the payload provides no direct
            school id to resolve.
    - Mark schools as licensed with the latest expiry across all their active
      licenses. A None expiry = perpetual (takes precedence over any date).
    - Schools that appear in the batch but have no active licenses are revoked.
    - Schools with no Skolon licenses at all are untouched.
    """
    cursor = _get_cursor(SkolonSyncCursor.EntityType.LICENSE)
    is_full_refresh = cursor is None
    result = client.get_licenses(version_tag=cursor)
    licenses = result["licenses"]

    now = django_tz.now()

    # school_pk → latest expiry (None = perpetual)
    school_expiry: Dict[int, Optional[datetime]] = {}
    # all school pks seen in this batch (active or not)
    seen_school_pks = set()
    local_schools_created = 0
    direct_school_hits = 0
    fallback_user_school_hits = 0

    for lic in licenses:
        is_deleted = lic.get("isDeleted", False)
        expiry = _parse_expiry(lic.get("expirationDate"))
        is_expired = expiry is not None and expiry <= now

        # Collect all school PKs this license applies to.
        # School-targeted licenses should only affect the named school.
        school_pks_for_lic: set = set()

        direct_school_id = _get_license_school_id(lic)
        if direct_school_id:
            org = (
                SkolonOrg.objects.filter(skolon_id=direct_school_id)
                .select_related("school")
                .first()
            )
            school, school_created = (
                _ensure_local_school_for_org(org)
                if not is_deleted and not is_expired
                else ((org.school if org else None), False)
            )
            if school_created:
                local_schools_created += 1
            if school:
                school_pks_for_lic.add(school.pk)
                direct_school_hits += 1
        else:
            for u in lic.get("users", []):
                uid = u.get("id")
                if not uid:
                    continue
                skolon_user = (
                    SkolonUser.objects.filter(skolon_id=uid, is_deleted=False)
                    .select_related("skolon_org__school")
                    .first()
                )
                if skolon_user and skolon_user.skolon_org and skolon_user.skolon_org.school:
                    school_pks_for_lic.add(skolon_user.skolon_org.school.pk)
                    fallback_user_school_hits += 1

        for school_pk in school_pks_for_lic:
            seen_school_pks.add(school_pk)

            if not is_deleted and not is_expired:
                if school_pk not in school_expiry:
                    school_expiry[school_pk] = expiry
                elif school_expiry[school_pk] is not None:
                    # None (perpetual) always wins; otherwise keep the furthest date.
                    if expiry is None or expiry > school_expiry[school_pk]:
                        school_expiry[school_pk] = expiry

    # Incremental sync keeps current conservative behavior: only schools seen in
    # this batch are changed. Full refresh is authoritative and revokes any
    # managed school absent from active licenses.
    if is_full_refresh:
        school_pks_to_apply = set(
            SkolonOrg.objects.filter(school__isnull=False).values_list("school_id", flat=True)
        )
    else:
        school_pks_to_apply = seen_school_pks

    for school_pk in school_pks_to_apply:
        if school_pk in school_expiry:
            School.objects.filter(pk=school_pk).update(
                is_licensed=True,
                license_expires_at=school_expiry[school_pk],
            )
            logger.info(
                "Licensed school pk=%s (expires: %s)",
                school_pk,
                school_expiry[school_pk],
            )
        else:
            School.objects.filter(pk=school_pk).update(
                is_licensed=False,
                license_expires_at=None,
            )
            logger.info("Revoked license for school pk=%s", school_pk)

    _save_cursor(SkolonSyncCursor.EntityType.LICENSE, result.get("versionTag"))
    revoked_school_pks = set(school_pks_to_apply) - set(school_expiry.keys())
    stats = {
        "fetched": len(licenses),
        "active": sum(1 for lic in licenses if not lic.get("isDeleted", False)),
        "schools_licensed": len(school_expiry),
        "schools_revoked": len(revoked_school_pks),
        "local_schools_created": local_schools_created,
        "direct_school_hits": direct_school_hits,
        "fallback_user_school_hits": fallback_user_school_hits,
        "full_refresh": is_full_refresh,
    }
    logger.info(
        "License sync complete: fetched=%s active=%s schools_licensed=%s schools_revoked=%s local_schools_created=%s direct_school_hits=%s fallback_user_school_hits=%s",
        stats["fetched"],
        stats["active"],
        stats["schools_licensed"],
        stats["schools_revoked"],
        stats["local_schools_created"],
        stats["direct_school_hits"],
        stats["fallback_user_school_hits"],
    )
    return {"items": licenses, "stats": stats}


# ---------------------------------------------------------------------------
# Full sync
# ---------------------------------------------------------------------------

def run_full_sync(client) -> Dict[str, Dict[str, object]]:
    """
    Run a complete sync in dependency order:
    schools → licenses → users → groups.
    """
    logger.info("Starting full Skolon sync...")
    results = {
        "schools": sync_schools(client),
        "licenses": sync_licenses(client),
        "users": sync_users(client),
        "groups": sync_groups(client),
    }
    logger.info(
        "Full sync complete: schools fetched=%s orgs_created=%s; licenses fetched=%s schools_licensed=%s; users fetched=%s applied=%s; groups fetched=%s.",
        results["schools"]["stats"]["fetched"],
        results["schools"]["stats"]["orgs_created"],
        results["licenses"]["stats"]["fetched"],
        results["licenses"]["stats"]["schools_licensed"],
        results["users"]["stats"]["fetched"],
        results["users"]["stats"]["applied"],
        results["groups"]["stats"]["fetched"],
    )
    return results
