from django.db import models
from django.contrib.auth.models import User
import uuid


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


class Learner(models.Model):

    ASSESSMENT_CHOICES_1 = [
        (1, 'Limited vocabulary with some understanding and use of subject and verb eg. the dog is running'),
        (2, 'Can determine differences between objects and find objects based on verbal or visual information eg. find the big, red hat'),
        (3, 'Can sort items into categories and find similarities eg. which of these are animals?'),
        (4, 'Can retell a story or describe an event step by step eg. how do you brush your teeth?'),
        (5, 'Can make their own predictions about an event eg. the girl is standing by the river, what might she do next?'),
        (6, 'Is able to do all of the above and is looking to practise or build on their current skills'),
    ]

    ASSESSMENT_CHOICES_2 = [
        (1, 'Knows some common verbs eg. running, jumping, sleeping, eating'),
        (2, 'Uses verbs in a sentence e.g. The dog is playing'),
        (3, 'Uses objects in a sentence eg. The dog was playing with a ball'),
        (4, 'Often uses location in a sentence e.g. I was playing in the playground'),
        (5, 'Often uses adjectives in a sentence eg. my jumper is fluffy'),
        (6, 'Often uses when in a sentence eg. In the morning, I’m going to the park'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learners')
    name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    assessment1 = models.IntegerField(choices=ASSESSMENT_CHOICES_1, blank=True, null=True)
    assessment2 = models.IntegerField(choices=ASSESSMENT_CHOICES_2, blank=True, null=True)
    learner_uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    exp = models.IntegerField(default=0)
    deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name}, Age: {self.age}"