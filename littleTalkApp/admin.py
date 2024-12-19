from django.contrib import admin
from django.contrib.auth.models import Group

#unregister groups
admin.site.unregister(Group)