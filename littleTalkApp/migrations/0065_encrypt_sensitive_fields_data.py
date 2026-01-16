# Generated migration for encrypting existing data in newly encrypted fields
# This migration re-saves all records with encrypted fields to trigger encryption
# of existing unencrypted data in the database

from django.db import migrations


def encrypt_profile_data(apps, schema_editor):
    """Re-encrypt all Profile records with first_name"""
    Profile = apps.get_model('littleTalkApp', 'Profile')
    profiles = Profile.objects.all()
    
    for profile in profiles:
        if profile.first_name:
            profile.save(update_fields=['first_name'])
    
    print(f"Re-encrypted {profiles.count()} Profile records")


def encrypt_logentry_data(apps, schema_editor):
    """Re-encrypt all LogEntry records with encrypted text fields"""
    LogEntry = apps.get_model('littleTalkApp', 'LogEntry')
    logentries = LogEntry.objects.all()
    
    for logentry in logentries:
        # Re-save if any of these fields have data
        if logentry.title or logentry.exercises_practised or logentry.goals or logentry.notes:
            logentry.save(update_fields=['title', 'exercises_practised', 'goals', 'notes'])
    
    print(f"Re-encrypted {logentries.count()} LogEntry records")


def encrypt_learner_data(apps, schema_editor):
    """Re-encrypt all Learner records with name (in case it wasn't fully encrypted before)"""
    Learner = apps.get_model('littleTalkApp', 'Learner')
    learners = Learner.objects.all()
    
    for learner in learners:
        if learner.name:
            learner.save(update_fields=['name'])
    
    print(f"Re-encrypted {learners.count()} Learner records")


def reverse_encrypt(apps, schema_editor):
    """Reverse operation - data will be decrypted when read"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("littleTalkApp", "0064_alter_profile_first_name"),
    ]

    operations = [
        migrations.RunPython(encrypt_profile_data, reverse_encrypt),
        migrations.RunPython(encrypt_logentry_data, reverse_encrypt),
        migrations.RunPython(encrypt_learner_data, reverse_encrypt),
    ]
