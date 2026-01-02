from rest_framework import serializers
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta
from django.core.cache import cache
from .models import Learner, ExerciseSession

class LearnerExpUpdateInputSerializer(serializers.Serializer):
    exp = serializers.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(1000000)])
    total_exercises = serializers.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(1000000)])
    timestamp = serializers.DateTimeField()
    nonce = serializers.CharField(max_length=100)
    # New analytics fields
    exercise_id = serializers.CharField(max_length=255, required=False)
    difficulty_selected = serializers.CharField(max_length=50, required=False)
    started_at = serializers.DateTimeField(required=False)
    completed_at = serializers.DateTimeField(required=False)
    total_questions = serializers.IntegerField(validators=[MinValueValidator(0)], required=False)
    incorrect_answers = serializers.IntegerField(validators=[MinValueValidator(0)], required=False)
    attempts_per_question = serializers.ListField(child=serializers.IntegerField(), required=False)

    def validate(self, data):
        # If exercise_id is provided, all analytics fields must be provided
        analytics_fields = [
            'exercise_id', 'difficulty_selected', 'started_at', 'completed_at',
            'total_questions', 'incorrect_answers', 'attempts_per_question'
        ]
        if 'exercise_id' in data:
            for field in analytics_fields:
                if field not in data:
                    raise serializers.ValidationError(f"{field} is required when exercise_id is provided.")
        return data

    def validate_timestamp(self, value):
        now = timezone.now()
        if now - value > timedelta(minutes=5):
            raise serializers.ValidationError("Request timestamp is too old.")
        if value > now + timedelta(minutes=1):
            raise serializers.ValidationError("Request timestamp is in the future.")
        return value

    def validate_nonce(self, value):
        # Assuming request is passed, but in serializer, it's not directly available.
        # Need to pass request to serializer or check in view.
        # For now, skip uniqueness check, just validate format.
        if not value:
            raise serializers.ValidationError("Nonce is required.")
        return value

class LearnerExpUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Learner
        fields = ['id', 'exp', 'total_exercises']