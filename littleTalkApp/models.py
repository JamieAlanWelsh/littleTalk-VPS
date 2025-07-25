from django.db import models
from django.contrib.auth.models import User
from encrypted_model_fields.fields import EncryptedCharField
import uuid
from django.utils import timezone
from datetime import timedelta


class School(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="schools_created")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Role:
    ADMIN = 'admin'
    TEAM_MANAGER = 'team_manager'
    STAFF = 'staff'
    READ_ONLY = 'read_only'

    CHOICES = [
        (ADMIN, 'Admin'),
        (TEAM_MANAGER, 'Team Manager'),
        (STAFF, 'Staff'),
        (READ_ONLY, 'Read Only'),
    ]


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=50, blank=True, null=True)
    hear_about = models.CharField(max_length=50, blank=True, null=True)
    opted_in = models.BooleanField(default=False)
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True, related_name="users")
    role = models.CharField(max_length=20, choices=Role.CHOICES, default=Role.STAFF)

    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    def is_admin(self):
        return self.role == Role.ADMIN

    def is_manager(self):
        return self.role in [Role.ADMIN, Role.TEAM_MANAGER]

    def is_staff(self):
        return self.role == Role.STAFF

    def is_read_only(self):
        return self.role == Role.READ_ONLY


class LearnerAssessmentAnswer(models.Model):
    learner = models.ForeignKey('Learner', on_delete=models.CASCADE, related_name='answers')
    question_id = models.IntegerField()
    topic = models.CharField(max_length=100)
    skill = models.CharField(max_length=100)
    text = models.TextField()
    answer = models.CharField(max_length=10)  # 'Yes' or 'No'
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.learner.name} - Q{self.question_id}: {self.answer}"


class Cohort(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='cohorts', null=True, blank=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)  # optional
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Learner(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='learners', null=True, blank=True)
    name = EncryptedCharField(max_length=255)
    learner_uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    exp = models.IntegerField(default=0)
    recommendation_level = models.IntegerField(blank=True, null=True)
    deleted = models.BooleanField(default=False)
    date_of_birth = models.DateField(null=True, blank=True)
    assessment1 = models.IntegerField(blank=True, null=True)
    assessment2 = models.IntegerField(blank=True, null=True)
    cohort = models.ForeignKey(Cohort, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.name


class WaitingList(models.Model):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email


class LogEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="log_entries")  # Link log entry to a user
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name="log_entries", null=True, blank=True)
    title = models.CharField(max_length=70)
    exercises_practised = models.TextField(blank=True, null=True, max_length=255)
    goals = models.TextField(blank=True, null=True, max_length=255)
    notes = models.TextField(blank=True, null=True, max_length=1000)
    timestamp = models.DateTimeField(auto_now_add=True)  # Automatically set on creation
    deleted = models.BooleanField(default=False) 

    def __str__(self):
        return f"{self.title} - {self.user.username}"


def default_expiry():
    return timezone.now() + timedelta(days=7)


class StaffInvite(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='invites')
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=[('staff', 'Staff')], default='staff')
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_expiry)
    sent_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_invites')

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Invite to {self.email} for {self.school.name}"