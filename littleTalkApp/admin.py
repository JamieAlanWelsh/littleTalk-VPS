from django.contrib import admin
from django.contrib.auth.models import Group
from .models import Profile

#unregister groups
admin.site.unregister(Group)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'first_name', 'last_name')