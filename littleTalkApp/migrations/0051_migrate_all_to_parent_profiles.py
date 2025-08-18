# app_name/migrations/00xx_migrate_all_to_parent_profiles.py
from django.db import migrations, transaction
from django.utils import timezone
import datetime

def forwards(apps, schema_editor):
    Profile = apps.get_model("littleTalkApp", "Profile")
    ParentProfile = apps.get_model("littleTalkApp", "ParentProfile")
    Learner = apps.get_model("littleTalkApp", "Learner")

    # Iterate over ALL profiles (legacy users, even those with zero learners)
    qs = (
        Profile.objects
        .select_related("user")
        .only("id", "user_id")
        .order_by("id")
        .iterator(chunk_size=1000)
    )

    now = timezone.now()
    trial_end = now + datetime.timedelta(days=7)

    with transaction.atomic():
        for profile in qs:
            # Ensure a ParentProfile exists for EVERY profile
            parent_profile, created = ParentProfile.objects.get_or_create(
                profile_id=profile.id,
                defaults={
                    "is_standalone": True,
                    "trial_started_at": now,     # 1-week trial
                    "trial_ends_at": trial_end,
                    "is_subscribed": False,
                },
            )
            if not created:
                # Update existing ParentProfiles to your policy
                ParentProfile.objects.filter(pk=parent_profile.pk).update(
                    is_standalone=True,
                    trial_started_at=now,
                    trial_ends_at=trial_end,
                    is_subscribed=False,
                )

            # Link all non-deleted learners for this user (if any)
            learner_ids = list(
                Learner.objects
                .filter(user_id=profile.user_id, deleted=False)
                .values_list("id", flat=True)
            )
            if learner_ids:
                CHUNK = 500
                for i in range(0, len(learner_ids), CHUNK):
                    parent_profile.learners.add(*learner_ids[i:i+CHUNK])

def backwards(apps, schema_editor):
    # No destructive reverse (avoid data loss).
    pass

class Migration(migrations.Migration):
    dependencies = [
        # Replace with your app's latest migration
        ("littleTalkApp", "0050_migrate_legacy_parents"),
    ]
    operations = [
        migrations.RunPython(forwards, backwards),
    ]