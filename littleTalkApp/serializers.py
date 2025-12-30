from rest_framework import serializers
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta
from django.core.cache import cache
from .models import Learner

class LearnerExpUpdateInputSerializer(serializers.Serializer):
    exp = serializers.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(1000000)])
    total_exercises = serializers.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(1000000)])
    timestamp = serializers.DateTimeField()
    nonce = serializers.CharField(max_length=100)

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