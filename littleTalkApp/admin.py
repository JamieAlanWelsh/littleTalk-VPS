from django.contrib import admin
from django.contrib.auth.models import Group
from .models import (
    Profile,
    School,
    ParentProfile,
)

#unregister groups
admin.site.unregister(Group)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'first_name', 'school', 'role')


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'is_licensed',
        'license_expires_at',
        'license_status',
        'created_by',
        'created_at',
    )
    list_editable = ('is_licensed', 'license_expires_at')
    list_filter = ('is_licensed', 'license_expires_at', 'created_at')
    search_fields = ('name', 'address', 'created_by__email', 'created_by__username')
    readonly_fields = ('created_at',)

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
        'profile',
        'trial_started_at',
        'trial_ends_at',
        'subscription_status',
        'is_subscribed',
        'stripe_customer_id',
    )
    list_editable = ('is_subscribed', 'trial_ends_at')
    list_filter = ('is_subscribed',)
    readonly_fields = ('stripe_customer_id',)
    
    def subscription_status(self, obj):
        if obj.on_trial():
            return "⌚ On Trial"
        elif obj.is_subscribed:
            return "✅ Active"
        else:
            return "❌ Not Subscribed"
    subscription_status.short_description = "Sub Status"