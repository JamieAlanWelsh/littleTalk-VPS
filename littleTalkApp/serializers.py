from rest_framework import serializers
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta
from django.core.cache import cache
from .models import Learner, ExerciseSession

"""Serializer for exercise submission with deduplication and full ExerciseSession recording."""
class SubmitExerciseSerializer(serializers.Serializer):
    # Deduplication
    nonce = serializers.CharField(max_length=100)
    
    # Learner XP/progress updates
    exp = serializers.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(1000000)])
    total_exercises = serializers.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(1000000)])
    
    # ExerciseSession fields (all required)
    exercise_id = serializers.CharField(max_length=255)
    difficulty_selected = serializers.CharField(max_length=50)
    started_at = serializers.DateTimeField()
    completed_at = serializers.DateTimeField()
    total_questions = serializers.IntegerField(validators=[MinValueValidator(0)])
    incorrect_answers = serializers.IntegerField(validators=[MinValueValidator(0)])
    attempts_per_question = serializers.ListField(child=serializers.IntegerField())

class LearnerExpUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Learner
        fields = ['id', 'exp', 'total_exercises']