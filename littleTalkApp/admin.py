from django.contrib import admin
from django.contrib.auth.models import Group
from .models import Profile, School, ParentProfile, Learner, JoinRequest

# unregister groups
admin.site.unregister(Group)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "first_name", "school", "schools_list", "role")
    filter_horizontal = ("schools",)

    def schools_list(self, obj):
        return ", ".join([s.name for s in obj.schools.all()])

    schools_list.short_description = "Schools"


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = (
        "name",
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
        "assessment1",
        "cohort",
    )


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
