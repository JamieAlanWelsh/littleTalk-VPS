from django.db import models
from django.contrib.auth.models import User
from encrypted_model_fields.fields import EncryptedCharField
import uuid
from django.utils import timezone
from datetime import timedelta
import random
import string


class School(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="schools_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    # Licensing fields
    is_licensed = models.BooleanField(default=False)
    license_expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

    def has_valid_license(self):
        return self.is_licensed and (
            self.license_expires_at is None or self.license_expires_at > timezone.now()
        )


class Role:
    ADMIN = "admin"
    TEAM_MANAGER = "team_manager"
    STAFF = "staff"
    READ_ONLY = "read_only"
    PARENT = "parent"

    CHOICES = [
        (ADMIN, "Admin"),
        (TEAM_MANAGER, "Team Manager"),
        (STAFF, "Staff"),
        (READ_ONLY, "Read Only"),
    ]


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    email = models.CharField(max_length=50, blank=True, null=True)
    first_name = models.CharField(max_length=50, blank=True, null=True)
    hear_about = models.CharField(max_length=50, blank=True, null=True)
    opted_in = models.BooleanField(default=False)
    school = models.ForeignKey(
        School, on_delete=models.SET_NULL, null=True, blank=True, related_name="users"
    )
    # Support multiple schools per user. Keep the legacy `school` FK for
    # backward-compatibility and a smooth migration path. New code should
    # prefer `get_current_school()` which will choose a session-selected
    # school, then the legacy FK, then the first school on the M2M.
    schools = models.ManyToManyField(School, blank=True, related_name="profiles")
    role = models.CharField(max_length=20, choices=Role.CHOICES, default=Role.PARENT)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    def is_admin(self):
        return self.role == Role.ADMIN

    def is_manager(self):
        return self.role == Role.TEAM_MANAGER

    def is_staff(self):
        return self.role == Role.STAFF

    def is_read_only(self):
        return self.role == Role.READ_ONLY

    def is_parent(self):
        return self.role == Role.PARENT

    def get_current_school(self, request=None):
        """
        Return the active/selected school for this profile.

        Preference order:
         1. If a request is provided and `request.session['selected_school_id']`
            refers to a school that this profile is associated with, return it.
         2. The first school in the `schools` ManyToMany relation, if any.
         3. The legacy `school` FK (keeps existing behaviour until we've migrated).
         4. None

        This helper allows minimal changes to call sites: replace
        `request.user.profile.school` with `request.user.profile.get_current_school(request)`
        when supporting multiple schools is required.
        """
        # 1) Session-selected school
        if request is not None:
            try:
                selected_id = request.session.get("selected_school_id")
                if selected_id:
                    try:
                        # Prefer schools on the M2M relation
                        school = self.schools.filter(id=selected_id).first()
                        if school:
                            print('found school from session:', school)
                            return school
                    except Exception:
                        pass
            except Exception:
                # Defensive: don't break if session is unavailable
                pass
        
        # 2) First M2M school, if any
        first = self.schools.first()
        if first:
            print('falling back to first M2M school:', first)
            return first

        # 3) Legacy FK
        if self.school:
            print('fallging back to school from legacy FK:', self.school)
            return self.school

        # 4) Nothing available
        return None

    def get_role_for_school(self, school):
        """
        Resolve a role for this profile for the given school.

        Resolution order:
         1. If a SchoolMembership exists for (profile, school) return its role.
         2. Fall back to the legacy Profile.role value.
        """
        if not school or self.is_parent():
            return self.role

        try:
            membership = self.memberships.filter(school=school).first()
            if membership and membership.role:
                print('found role from membership:', membership.role)
                return membership.role
        except Exception:
            # Defensive: if membership relation unavailable, fall back
            pass
        print('falling back to profile role:', self.role)
        return self.role

    def has_role_for_school(self, school, role):
        return self.get_role_for_school(school) == role

    def is_admin_for_school(self, school):
        return self.has_role_for_school(school, Role.ADMIN)

    def is_manager_for_school(self, school):
        return self.has_role_for_school(school, Role.TEAM_MANAGER)

    def is_staff_for_school(self, school):
        return self.has_role_for_school(school, Role.STAFF)


def default_trial_end():
    return timezone.now() + timedelta(days=7)


class ParentProfile(models.Model):
    profile = models.OneToOneField(
        "Profile", on_delete=models.CASCADE, related_name="parent_profile"
    )
    learners = models.ManyToManyField("Learner", related_name="parents")
    # subscripion fields
    trial_started_at = models.DateTimeField(auto_now_add=True)
    trial_ends_at = models.DateTimeField(default=default_trial_end)
    is_subscribed = models.BooleanField(default=False)
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    is_standalone = models.BooleanField(default=False)

    def on_trial(self):
        return timezone.now() < self.trial_ends_at and not self.is_subscribed

    def has_access(self):
        return self.is_subscribed or self.on_trial()

    def trial_days_left(self):
        # Return days remaining in trial, or 0 if trial expired.
        if self.trial_ends_at and self.on_trial():
            return max((self.trial_ends_at - timezone.now()).days, 0)
        return 0


class SchoolMembership(models.Model):
    """Assign a role to a Profile for a specific School.

    This allows users to have different roles per school (e.g. admin at one
    school and staff at another) while keeping the legacy `Profile.role`
    as a fallback during migration.
    """
    profile = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="memberships"
    )
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="memberships")
    # Reuse the Role choices; include parent choice if not present to be safe.
    ROLE_CHOICES = list(Role.CHOICES)
    if (Role.PARENT, "Parent") not in ROLE_CHOICES:
        ROLE_CHOICES.append((Role.PARENT, "Parent"))

    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default=Role.STAFF)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("profile", "school")
        indexes = [models.Index(fields=["school", "role"]), models.Index(fields=["profile"])]

    def __str__(self):
        return f"{self.profile.user.username} @ {self.school.name}: {self.role}"


class LearnerAssessmentAnswer(models.Model):
    learner = models.ForeignKey(
        "Learner", on_delete=models.CASCADE, related_name="answers"
    )
    question_id = models.IntegerField()
    topic = models.CharField(max_length=100)
    skill = models.CharField(max_length=100)
    text = models.TextField()
    answer = models.CharField(max_length=10)  # 'Yes' or 'No'
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.learner.name} - Q{self.question_id}: {self.answer}"


class Cohort(models.Model):
    school = models.ForeignKey(
        School, on_delete=models.CASCADE, related_name="cohorts", null=True, blank=True
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)  # optional
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Learner(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="learners")
    # profile = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, related_name='learners')
    school = models.ForeignKey(
        School, on_delete=models.CASCADE, related_name="learners", null=True, blank=True
    )
    name = EncryptedCharField(max_length=255)
    learner_uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    exp = models.IntegerField(default=0)
    total_exercises = models.IntegerField(default=0)
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
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="log_entries"
    )  # Link log entry to a user
    learner = models.ForeignKey(
        Learner,
        on_delete=models.CASCADE,
        related_name="log_entries",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=70)
    exercises_practised = models.TextField(blank=True, null=True, max_length=255)
    goals = models.TextField(blank=True, null=True, max_length=255)
    notes = models.TextField(blank=True, null=True, max_length=1000)
    timestamp = models.DateTimeField(auto_now_add=True)  # Automatically set on creation
    deleted = models.BooleanField(default=False)
    created_by_role = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.title} - {self.user.username}"


def default_expiry():
    return timezone.now() + timedelta(days=7)


class StaffInvite(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="invites")
    email = models.EmailField()
    role = models.CharField(max_length=30, choices=Role.CHOICES)
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_expiry)
    sent_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_invites",
    )
    withdrawn = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Invite to {self.email} for {self.school.name}"


class JoinRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="handled_join_requests",
    )

    def __str__(self):
        return f"{self.full_name} ({self.email}) → {self.school.name} [{self.status}]"


def generate_short_code(length=6):
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choices(alphabet, k=length))


class ParentAccessToken(models.Model):
    learner = models.OneToOneField(
        "Learner", on_delete=models.CASCADE, related_name="parent_token"
    )
    token = models.CharField(max_length=6, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)
    expires_at = models.DateTimeField(
        default=default_expiry
    )  # Optional time-based expiry

    def is_expired(self):
        return self.used or timezone.now() > self.expires_at

    def regenerate_token(self):
        # Generate a new unique short code
        for _ in range(10):
            new_token = generate_short_code()
            if not ParentAccessToken.objects.filter(token=new_token).exists():
                self.token = new_token
                self.created_at = timezone.now()
                self.expires_at = ParentAccessToken._meta.get_field(
                    "expires_at"
                ).get_default()
                self.used = False
                self.save()
                return
        raise Exception("Unable to generate unique token after multiple attempts")

    def save(self, *args, **kwargs):
        if not self.token:
            # Only generate token here, do NOT save again
            for _ in range(10):
                new_token = generate_short_code()
                if not ParentAccessToken.objects.filter(token=new_token).exists():
                    self.token = new_token
                    break
            else:
                raise Exception("Unable to generate a unique token.")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Code for {self.learner.name}: {self.token}"
