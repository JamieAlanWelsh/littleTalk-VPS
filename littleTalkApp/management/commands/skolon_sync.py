"""
Management command: python manage.py skolon_sync

Runs a Skolon data sync against the production API.
By default runs a full sync (schools → users → groups → licenses).
Use --entity to sync a single entity type for faster targeted updates.

Examples:
    python manage.py skolon_sync
    python manage.py skolon_sync --entity license
    python manage.py skolon_sync --entity user
"""

from django.core.management.base import BaseCommand

from littleTalkApp.integrations.skolon_client import api_client
from littleTalkApp.integrations.skolon_sync import (
    run_full_sync,
    sync_groups,
    sync_licenses,
    sync_schools,
    sync_users,
)

ENTITY_MAP = {
    "school": sync_schools,
    "user": sync_users,
    "group": sync_groups,
    "license": sync_licenses,
}


class Command(BaseCommand):
    help = "Sync data from Skolon (schools, users, groups, licenses)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--entity",
            choices=list(ENTITY_MAP.keys()),
            default=None,
            help="Sync a single entity type. Omit to run a full sync.",
        )

    def handle(self, *args, **options):
        entity = options["entity"]

        if entity:
            self.stdout.write(f"Syncing Skolon entity: {entity}...")
            records = ENTITY_MAP[entity](api_client)
            self.stdout.write(
                self.style.SUCCESS(f"Done. {len(records)} {entity} records processed.")
            )
        else:
            self.stdout.write("Running full Skolon sync...")
            results = run_full_sync(api_client)
            self.stdout.write(
                self.style.SUCCESS(
                    "Full sync complete: "
                    f"{len(results['schools'])} schools, "
                    f"{len(results['users'])} users, "
                    f"{len(results['groups'])} groups, "
                    f"{len(results['licenses'])} licenses."
                )
            )
