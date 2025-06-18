from django.db import models
from django.contrib.auth.models import User
from encrypted_model_fields.fields import EncryptedCharField
import uuid


# class Assessment(models.Model):
#     user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
#     learner_name = models.CharField(max_length=100)
#     learner_dob = models.DateField()
#     source = models.CharField(max_length=200, blank=True, null=True)

# class AssessmentQuestion(models.Model):
#     question_text = models.CharField(max_length=500)
#     is_optional = models.BooleanField(default=False)
#     order = models.IntegerField()

# class AssessmentAnswer(models.Model):
#     assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE)
#     question = models.ForeignKey(AssessmentQuestion, on_delete=models.CASCADE)
#     answer = models.BooleanField()


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=50, blank=True, null=True)
    hear_about = models.CharField(max_length=50, blank=True, null=True)
    opted_in = models.BooleanField(default=False) 

    def __str__(self):
        return f"{self.user.username}'s Profile"


class LearnerAssessmentAnswer(models.Model):
    learner = models.ForeignKey('Learner', on_delete=models.CASCADE, related_name='answers')
    question_id = models.IntegerField()
    topic = models.CharField(max_length=100)
    skill = models.CharField(max_length=100)
    text = models.TextField()
    answer = models.CharField(max_length=10)  # 'Yes' or 'No'
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.learner.name} - Q{self.question_id}: {self.answer}"


class Learner(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learners')
    name = EncryptedCharField(max_length=255)
    learner_uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    exp = models.IntegerField(default=0)
    recommendation_level = models.IntegerField(blank=True, null=True)
    deleted = models.BooleanField(default=False)
    date_of_birth = models.DateField(null=True, blank=True)
    assessment1 = models.IntegerField(blank=True, null=True)
    assessment2 = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return self.name


class WaitingList(models.Model):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email


class LogEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="log_entries")  # Link log entry to a user
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name="log_entries", null=True, blank=True)
    title = models.CharField(max_length=70)
    exercises_practised = models.TextField(blank=True, null=True, max_length=255)
    goals = models.TextField(blank=True, null=True, max_length=255)
    notes = models.TextField(blank=True, null=True, max_length=1000)
    timestamp = models.DateTimeField(auto_now_add=True)  # Automatically set on creation
    deleted = models.BooleanField(default=False) 

    def __str__(self):
        return f"{self.title} - {self.user.username}"