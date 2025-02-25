from django import forms
from django.contrib.auth.models import User
from .models import Learner
from .models import WaitingList
from django.contrib.auth.forms import AuthenticationForm


class CustomAuthenticationForm(AuthenticationForm):
    def clean_username(self):
        return self.cleaned_data['username'].lower()


class UserRegistrationForm(forms.ModelForm):
    password1 = forms.CharField(widget=forms.PasswordInput, label="Password")
    password2 = forms.CharField(widget=forms.PasswordInput, label="Confirm Password")

    class Meta:
        model = User
        fields = ['email', 'first_name']  # add more fields if needed

    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords do not match")
        return password2


class LearnerForm(forms.ModelForm):
    class Meta:
        model = Learner
        fields = ['name', 'date_of_birth', 'assessment1', 'assessment2']
        widgets = {
            'date_of_birth': forms.DateInput(attrs={'type': 'date'}),
            'assessment1': forms.Select(choices=Learner.ASSESSMENT_CHOICES_1),
            'assessment2': forms.Select(choices=Learner.ASSESSMENT_CHOICES_2),
        }
        labels = {
            'name': "Learner name",
            'date_of_birth': "Learner DOB   ",
            'assessment1': "What best describes your learner's current language level?",
            'assessment2': "What best describes your learner's sentence building ability?",
        }


class WaitingListForm(forms.ModelForm):
    class Meta:
        model = WaitingList
        fields = ['email']