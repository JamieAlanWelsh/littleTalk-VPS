from rest_framework import serializers
from .models import Learner

class LearnerExpUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Learner
        fields = ['id', 'exp', 'total_exercises']