"""
Management command: python manage.py skolon_sync

Runs a Skolon data sync against the production API.
By default runs a full sync (schools → licenses → users → groups).
Use --entity to sync a single entity type for faster targeted updates.
Use --reset-cursors or --full-refresh to force re-fetching from Skolon.

Examples:
    python manage.py skolon_sync
    python manage.py skolon_sync --entity license
    python manage.py skolon_sync --entity user
    python manage.py skolon_sync --reset-cursors user license
    python manage.py skolon_sync --full-refresh
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
from littleTalkApp.models import SkolonSyncCursor

ENTITY_MAP = {
    "school": sync_schools,
    "user": sync_users,
    "group": sync_groups,
    "license": sync_licenses,
}


class Command(BaseCommand):
    help = "Sync data from Skolon (schools, users, groups, licenses)."

    def _format_stats(self, stats):
        return "\n".join(f"  - {key}: {value}" for key, value in stats.items())

    def _format_entity_summary(self, entity, stats):
        title = entity.replace("_", " ").title()
        return f"{title}:\n{self._format_stats(stats)}"

    def _reset_cursors(self, entities):
        if not entities:
            return

        cursor_entities = list(dict.fromkeys(entities))
        deleted_count, _ = SkolonSyncCursor.objects.filter(
            entity_type__in=cursor_entities
        ).delete()
        self.stdout.write(
            f"Reset {deleted_count} cursor rows for: {', '.join(cursor_entities)}"
        )

    def add_arguments(self, parser):
        parser.add_argument(
            "--entity",
            choices=list(ENTITY_MAP.keys()),
            default=None,
            help="Sync a single entity type. Omit to run a full sync.",
        )
        parser.add_argument(
            "--reset-cursors",
            nargs="+",
            choices=[*ENTITY_MAP.keys(), "all"],
            default=None,
            help="Reset one or more stored Skolon cursors before syncing.",
        )
        parser.add_argument(
            "--full-refresh",
            action="store_true",
            help="Reset all Skolon cursors before syncing.",
        )

    def handle(self, *args, **options):
        entity = options["entity"]
        reset_cursors = options["reset_cursors"] or []
        full_refresh = options["full_refresh"]

        if full_refresh:
            cursor_entities = list(ENTITY_MAP.keys())
        elif "all" in reset_cursors:
            cursor_entities = list(ENTITY_MAP.keys())
        else:
            cursor_entities = reset_cursors

        self._reset_cursors(cursor_entities)

        if entity:
            self.stdout.write(f"Syncing Skolon entity: {entity}...")
            result = ENTITY_MAP[entity](api_client)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Done.\n{self._format_entity_summary(entity, result['stats'])}"
                )
            )
        else:
            self.stdout.write("Running full Skolon sync...")
            results = run_full_sync(api_client)
            sections = [
                self._format_entity_summary("schools", results["schools"]["stats"]),
                self._format_entity_summary("licenses", results["licenses"]["stats"]),
                self._format_entity_summary("users", results["users"]["stats"]),
                self._format_entity_summary("groups", results["groups"]["stats"]),
            ]
            self.stdout.write(
                self.style.SUCCESS(
                    "Full sync complete.\n\n" + "\n\n".join(sections)
                )
            )
