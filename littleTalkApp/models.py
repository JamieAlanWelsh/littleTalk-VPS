from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from datetime import date
import uuid


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


class Learner(models.Model):
    DIAGNOSIS_CHOICES = [
        ('autism', 'Autism'),
        ('down_syndrome', 'Down Syndrome'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learners')
    name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    diagnosis = models.CharField(max_length=50, choices=DIAGNOSIS_CHOICES, blank=True, null=True)
    learner_uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    exp = models.IntegerField(default=0)
    deleted = models.BooleanField(default=False) 

    def __str__(self):
        return f"{self.name}, Age: {self.age}"