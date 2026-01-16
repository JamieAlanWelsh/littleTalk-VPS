from django.contrib import admin
from django.contrib.auth.models import Group, User
from django.contrib.auth.admin import UserAdmin
from .models import Profile, School, ParentProfile, Learner, JoinRequest, SchoolMembership, ExerciseSession, LogEntry

# unregister groups
admin.site.unregister(Group)

# Unregister the default User admin and register custom one
# This change was created so we can custom order users by date joined
admin.site.unregister(User)


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_filter = UserAdmin.list_filter + ('date_joined',)
    ordering = ('-date_joined',)


class SchoolMembershipInline(admin.TabularInline):
    """Inline editor for school memberships with roles"""
    model = SchoolMembership
    extra = 1
    fields = ("school", "role", "is_active", "created_at")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("school",)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "first_name", "legacy_school", "schools_with_roles", "legacy_role")
    list_filter = ("role", "schools", "user__date_joined")
    search_fields = ("user__username", "user__email", "first_name")
    autocomplete_fields = ("user",)
    filter_horizontal = ("schools",)
    inlines = [SchoolMembershipInline]
    ordering = ('-user__date_joined',)
    
    fieldsets = (
        ("User Info", {
            "fields": ("user", "first_name", "opted_in")
        }),
        ("Legacy Fields (for migration)", {
            "fields": ("school", "role"),
            "description": "These are legacy single-school fields. Use School Memberships below for multiple schools."
        }),
        ("Multiple Schools", {
            "fields": ("schools",),
            "description": "Select schools this profile has access to. Roles are managed in School Memberships below."
        }),
    )

    def legacy_school(self, obj):
        """Display the legacy single school FK"""
        return obj.school.name if obj.school else "—"
    legacy_school.short_description = "Legacy School"
    
    def legacy_role(self, obj):
        """Display the legacy role field"""
        return obj.get_role_display() if obj.role else "—"
    legacy_role.short_description = "Legacy Role"

    def schools_with_roles(self, obj):
        """Display all schools with their roles from SchoolMembership"""
        memberships = obj.memberships.select_related("school").order_by("school__name")
        if not memberships.exists():
            return "—"
        return ", ".join([f"{m.school.name} ({m.get_role_display()})" for m in memberships])
    schools_with_roles.short_description = "Schools & Roles"


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "member_count",
        "active_learners_count",
        "is_licensed",
        "license_expires_at",
        "license_status",
        "created_by",
        "created_at",
    )
    list_editable = ("is_licensed", "license_expires_at")
    list_filter = ("is_licensed", "license_expires_at", "created_at")
    search_fields = ("name", "address", "created_by__email", "created_by__username")
    readonly_fields = ("created_at",)

    def license_status(self, obj):
        if obj.has_valid_license():
            return "✅ Active"
        elif obj.is_licensed:
            return "⚠️ Expired"
        else:
            return "❌ Not Licensed"
    license_status.short_description = "License Status"
    
    def member_count(self, obj):
        """Count of staff/members in this school"""
        return obj.memberships.filter(is_active=True).count()
    member_count.short_description = "Active Members"
    
    def active_learners_count(self, obj):
        """Count of active (non-deleted) learners in this school"""
        return obj.learners.filter(deleted=False).count()
    active_learners_count.short_description = "Active Learners"


@admin.register(ParentProfile)
class ParentProfileAdmin(admin.ModelAdmin):
    list_display = (
        "profile",
        "trial_started_at",
        "trial_ends_at",
        "subscription_status",
        "is_subscribed",
        "stripe_customer_id",
    )
    list_editable = ("is_subscribed", "trial_ends_at")
    list_filter = ("is_subscribed",)
    readonly_fields = ("stripe_customer_id",)

    def subscription_status(self, obj):
        if obj.on_trial():
            return "⌚ On Trial"
        elif obj.is_subscribed:
            return "✅ Active"
        else:
            return "❌ Not Subscribed"

    subscription_status.short_description = "Sub Status"


@admin.register(Learner)
class LearnerAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "school",
        "exp",
        "total_exercises",
        "recommendation_level",
        "deleted",
        "date_of_birth",
        "age_group",
        "assessment1",
        "cohort",
    )
    list_filter = ("age_group", "deleted", "school")
    search_fields = ("name", "user__username", "user__email", "learner_uuid")


@admin.register(JoinRequest)
class JoinRequestAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "email",
        "school",
        "status",
        "created_at",
        "resolved_at",
        "resolved_by",
    )
    search_fields = ("full_name", "email", "school")


@admin.register(ExerciseSession)
class ExerciseSessionAdmin(admin.ModelAdmin):
    list_display = (
        "learner_uuid",
        "school_name",
        "exercise_id",
        "difficulty_selected",
        "time_elapsed",
        "total_questions",
        "incorrect_answers",
        "accuracy",
        "created_at",
    )
    list_filter = ("exercise_id", "learner__school", "created_at")
    search_fields = ("learner__learner_uuid", "exercise_id")
    readonly_fields = ("created_at",)

    def learner_uuid(self, obj):
        return obj.learner.learner_uuid
    learner_uuid.short_description = "Learner UUID"
    learner_uuid.admin_order_field = "learner__learner_uuid"

    def school_name(self, obj):
        return obj.learner.school.name if obj.learner.school else "—"
    school_name.short_description = "School"
    school_name.admin_order_field = "learner__school__name"

    def time_elapsed(self, obj):
        if obj.completed_at and obj.started_at:
            elapsed = obj.completed_at - obj.started_at
            return f"{elapsed.total_seconds():.2f}s"
        return "N/A"
    time_elapsed.short_description = "Time Elapsed"

    def accuracy(self, obj):
        if obj.total_questions > 0:
            accuracy = (obj.total_questions - obj.incorrect_answers) / obj.total_questions * 100
            return f"{accuracy:.2f}%"
        return "N/A"
    accuracy.short_description = "Accuracy"


@admin.register(SchoolMembership)
class SchoolMembershipAdmin(admin.ModelAdmin):
    """Manage profile-school-role relationships"""
    list_display = ("profile_user", "profile_name", "school", "role", "is_active", "created_at")
    list_filter = ("role", "is_active", "school")
    search_fields = ("profile__user__username", "profile__user__email", "profile__first_name", "school__name")
    autocomplete_fields = ("profile", "school")
    list_editable = ("role", "is_active")
    readonly_fields = ("created_at", "updated_at")
    
    fieldsets = (
        (None, {
            "fields": ("profile", "school", "role", "is_active")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
    
    def profile_user(self, obj):
        return obj.profile.user.username
    profile_user.short_description = "Username"
    profile_user.admin_order_field = "profile__user__username"
    
    def profile_name(self, obj):
        return obj.profile.first_name or "—"
    profile_name.short_description = "Name"
    profile_name.admin_order_field = "profile__first_name"


@admin.register(LogEntry)
class LogEntryAdmin(admin.ModelAdmin):
    """Admin interface for LogEntry with decryption view"""
    list_display = (
        "id",
        "title",
        "user",
        "created_by_role",
        "timestamp",
        "deleted",
    )
    list_filter = ("created_by_role", "timestamp", "deleted", "school")