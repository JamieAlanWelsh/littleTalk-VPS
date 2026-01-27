from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Custom User admin with encrypted email display"""
    
    # Override list_display to show email_encrypted instead of email
    list_display = ('username', 'email_encrypted', 'first_name', 'last_name', 'is_staff', 'date_joined')
    
    # Add email_encrypted and email_hash to the fieldsets
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email_encrypted', 'email_hash')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Make email_encrypted and email_hash readonly to prevent accidental modification
    readonly_fields = ('email_hash', 'date_joined')
    
    # Exclude the plaintext email field from the admin
    exclude = ('email',)
    
    # Update filters
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups', 'date_joined')
    
    # Update search to use email_encrypted instead of email
    search_fields = ('username', 'first_name', 'last_name', 'email_encrypted')
    
    # Ordering by date_joined (newest first)
    ordering = ('-date_joined',)

