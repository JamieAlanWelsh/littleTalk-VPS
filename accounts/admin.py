from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Custom User admin with date_joined ordering"""
    list_filter = UserAdmin.list_filter + ('date_joined',)
    ordering = ('-date_joined',)
