from django.db import migrations

def populate_school_membership(apps, schema_editor):
    Profile = apps.get_model("littleTalkApp", "Profile")
    SchoolMembership = apps.get_model("littleTalkApp", "SchoolMembership")
    Role = Profile._meta.get_field("role").choices
    # Only migrate roles that are not parent and have a school
    for profile in Profile.objects.exclude(role="parent").exclude(school=None):
        # Only create if not already present
        SchoolMembership.objects.get_or_create(
            profile=profile,
            school=profile.school,
            defaults={"role": profile.role, "is_active": True},
        )

class Migration(migrations.Migration):
    dependencies = [
        ("littleTalkApp", "0055_schoolmembership"),
    ]
    operations = [
        migrations.RunPython(populate_school_membership, reverse_code=migrations.RunPython.noop),
    ]
