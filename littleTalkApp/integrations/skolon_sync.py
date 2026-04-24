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
from typing import Dict, List, Optional

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


def _ensure_local_school_for_org(org: Optional[SkolonOrg]) -> Optional[School]:
    """Create the local School on first active license, not during raw school sync."""
    if org is None or org.is_deleted:
        return None
    if org.school is None:
        local_school = School.objects.create(name=org.name or org.skolon_id)
        org.school = local_school
        org.save(update_fields=["school"])
        logger.info(
            "Created local School '%s' for licensed Skolon org %s",
            local_school.name,
            org.skolon_id,
        )
    return org.school


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

def sync_schools(client) -> List[Dict]:
    """
    Upsert SkolonOrg records from the Skolon schools endpoint.
    Local School creation is deferred until an active license is present.
    """
    cursor = _get_cursor(SkolonSyncCursor.EntityType.SCHOOL)
    result = client.get_schools(version_tag=cursor)
    schools = result["schools"]

    for school in schools:
        skolon_id = school.get("id")
        if not skolon_id:
            continue

        is_deleted = school.get("isDeleted", False)

        org, _ = SkolonOrg.objects.update_or_create(
            skolon_id=skolon_id,
            defaults={
                "name": school.get("name", ""),
                "organisation_number": school.get("organizationNumber"),
                "is_deleted": is_deleted,
            },
        )

    _save_cursor(SkolonSyncCursor.EntityType.SCHOOL, result.get("versionTag"))
    logger.info("School sync complete: %s records processed.", len(schools))
    return schools


def sync_users(client) -> List[Dict]:
    """
    Upsert teacher-only SkolonUser records, linking them to licensed local schools.
    Deleted users are flagged; their local User link is left intact for auditing.
    """
    cursor = _get_cursor(SkolonSyncCursor.EntityType.USER)
    result = client.get_users(version_tag=cursor)
    users = result["users"]

    for user in users:
        skolon_id = user.get("id")
        if not skolon_id:
            continue

        role = _normalise_skolon_role(_get_user_role(user))
        if role not in SYNCED_SKOLON_ROLES:
            continue

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
            continue

        SkolonUser.objects.update_or_create(
            skolon_id=skolon_id,
            defaults={
                "external_id": external_id,
                "skolon_org": org,
                "role": role,
                "is_deleted": user.get("isDeleted", False),
            },
        )

    _save_cursor(SkolonSyncCursor.EntityType.USER, result.get("versionTag"))
    logger.info("User sync complete: %s records processed.", len(users))
    return users


def sync_groups(client) -> List[Dict]:
    """
    Fetch Skolon groups and advance the cursor.
    Cohort mapping is a future step — groups are logged but not yet written to DB.
    """
    cursor = _get_cursor(SkolonSyncCursor.EntityType.GROUP)
    result = client.get_groups(version_tag=cursor)
    groups = result["groups"]

    _save_cursor(SkolonSyncCursor.EntityType.GROUP, result.get("versionTag"))
    logger.info(
        "Group sync complete: %s records received (cohort mapping pending).",
        len(groups),
    )
    return groups


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


def sync_licenses(client) -> List[Dict]:
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
    result = client.get_licenses(version_tag=cursor)
    licenses = result["licenses"]

    now = django_tz.now()

    # school_pk → latest expiry (None = perpetual)
    school_expiry: Dict[int, Optional[datetime]] = {}
    # all school pks seen in this batch (active or not)
    seen_school_pks = set()

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
            school = _ensure_local_school_for_org(org) if not is_deleted and not is_expired else (org.school if org else None)
            if school:
                school_pks_for_lic.add(school.pk)
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

        for school_pk in school_pks_for_lic:
            seen_school_pks.add(school_pk)

            if not is_deleted and not is_expired:
                if school_pk not in school_expiry:
                    school_expiry[school_pk] = expiry
                elif school_expiry[school_pk] is not None:
                    # None (perpetual) always wins; otherwise keep the furthest date.
                    if expiry is None or expiry > school_expiry[school_pk]:
                        school_expiry[school_pk] = expiry

    # Apply outcomes only for schools that appeared in this sync batch.
    for school_pk in seen_school_pks:
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
    logger.info("License sync complete: %s records processed.", len(licenses))
    return licenses


# ---------------------------------------------------------------------------
# Full sync
# ---------------------------------------------------------------------------

def run_full_sync(client) -> Dict:
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
        "Full sync complete: %s schools, %s users, %s groups, %s licenses.",
        len(results["schools"]),
        len(results["users"]),
        len(results["groups"]),
        len(results["licenses"]),
    )
    return results
