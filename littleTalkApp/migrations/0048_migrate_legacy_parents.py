from django.db import migrations, transaction
from django.utils import timezone
import datetime

PARENT_ROLE = "parent"

def forwards(apps, schema_editor):
    Profile = apps.get_model("littleTalkApp", "Profile")
    ParentProfile = apps.get_model("littleTalkApp", "ParentProfile")
    Learner = apps.get_model("littleTalkApp", "Learner")

    # Legacy parents = users who already have learners
    user_ids_with_learners = (
        Learner.objects.values_list("user_id", flat=True).distinct()
    )

    qs = (
        Profile.objects
        .select_related("user")
        .filter(user_id__in=user_ids_with_learners)
        .only("id", "user_id")
        .order_by("id")
        .iterator(chunk_size=1000)
    )

    now = timezone.now()
    trial_end = now + datetime.timedelta(days=7)

    with transaction.atomic():
        for profile in qs:
            # Ensure a ParentProfile exists and is configured as requested
            parent_profile, created = ParentProfile.objects.get_or_create(
                profile_id=profile.id,
                defaults={
                    "is_standalone": True,
                    "trial_started_at": now,
                    "trial_ends_at": trial_end,
                    "is_subscribed": False,
                },
            )
            if not created:
                # Update existing ParentProfiles to match new policy
                ParentProfile.objects.filter(pk=parent_profile.pk).update(
                    is_standalone=True,
                    trial_started_at=now,
                    trial_ends_at=trial_end,
                    is_subscribed=False,
                )

            # Link all non-deleted learners owned by this user
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
    # No destructive reverse to avoid data loss.
    pass

class Migration(migrations.Migration):
    dependencies = [
        # Replace with your actual last migration in this app
        ("littleTalkApp", "0047_alter_profile_role"),
    ]
    operations = [
        migrations.RunPython(forwards, backwards),
    ]