from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils import timezone
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Custom User admin with encrypted email display"""
    
    # Override list_display to show email_encrypted instead of email
    list_display = ('username', 'email_encrypted', 'email_verified', 'is_staff', 'date_joined')
    
    # Add email_encrypted and email_hash to the fieldsets
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('email_encrypted', 'email_hash', 'email_verified')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'email_verified_at')}),
    )
    
    # Make email_encrypted and email_hash readonly to prevent accidental modification
    readonly_fields = ('email_hash', 'date_joined', 'email_verified_at')
    
    # Exclude the plaintext email field from the admin
    exclude = ('email',)
    
    # Update filters
    list_filter = ('email_verified', 'is_staff', 'is_superuser', 'is_active', 'groups', 'date_joined')
    
    # Update search to use email_encrypted instead of email
    search_fields = ('username', 'email_encrypted')
    
    # Ordering by date_joined (newest first)
    ordering = ('-date_joined',)

    def save_model(self, request, obj, form, change):
        if obj.email_verified:
            obj.email_verified_at = obj.email_verified_at or timezone.now()
        else:
            obj.email_verified_at = None
        super().save_model(request, obj, form, change)

