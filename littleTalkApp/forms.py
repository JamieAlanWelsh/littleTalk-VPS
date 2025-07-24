from django import forms
from django.contrib.auth.models import User
from .models import Learner
from .models import Cohort
from django.contrib.auth.forms import AuthenticationForm
from .models import LogEntry
import re
from django.core.exceptions import ValidationError
from datetime import date


def no_emoji_validator(value):
    emoji_pattern = re.compile(
        r"["
        r"\U0001F600-\U0001F64F"  # emoticons
        r"\U0001F300-\U0001F5FF"  # symbols & pictographs
        r"\U0001F680-\U0001F6FF"  # transport & map symbols
        r"\U0001F1E0-\U0001F1FF"  # flags
        r"\u2600-\u26FF"          # misc symbols
        r"\u2700-\u27BF"          # dingbats
        r"]+", flags=re.UNICODE
    )
    if emoji_pattern.search(value):
        raise ValidationError("Please avoid using emojis or special symbols when inputting names.")


def sanity_check_name(value):
    if len(value) > 50:
        raise ValidationError("Name cannot exceed 50 characters.")


class CustomAuthenticationForm(AuthenticationForm):
    def clean_username(self):
        return self.cleaned_data['username'].lower()


class UserRegistrationForm(forms.ModelForm):
    password1 = forms.CharField(widget=forms.PasswordInput, label="Password")
    password2 = forms.CharField(widget=forms.PasswordInput, label="Confirm Password")
    learner_name = forms.CharField(label="Learner's Name", required=True)
    learner_dob = forms.DateField(
        label="Learner DOB",
        required=True,
        widget=forms.DateInput(attrs={
        'type': 'date',
        'placeholder': 'Learner date of birth'
    })
    )
    hear_about = forms.ChoiceField(
        choices=[
            ("", "How did you hear about us? (optional)"),
            ("instagram", "Instagram"),
            ("facebook", "Facebook"),
            ("google", "Google Search"),
            ("direct", "Direct Link"),
            ("wom", "Word of Mouth"),
            ("other", "Other"),
        ],
        required=False
    )
    agree_updates = forms.BooleanField(label="I agree to receive updates via Email", required=False)

    class Meta:
        model = User
        fields = ['email', 'first_name']
    
    def clean_email(self):
        email = self.cleaned_data.get('email', '').lower()
        if User.objects.filter(username=email).exists():
            raise ValidationError("An account with this email already exists.")
        return email

    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords do not match")
        return password2

    def clean_first_name(self):
        first_name = self.cleaned_data.get("first_name", "")
        first_name = first_name.strip()
        if not first_name:
            raise forms.ValidationError("Name cannot be empty.")
        no_emoji_validator(first_name)
        sanity_check_name(first_name)
        return first_name

    def clean_learner_dob(self):
            dob = self.cleaned_data.get('learner_dob')
            if dob and dob > date.today():
                raise ValidationError("Learner's date of birth cannot be in the future.")
            return dob
    
    def clean_learner_name(self):
        learner_name = self.cleaned_data.get("learner_name", "").strip()
        if not learner_name:
            raise forms.ValidationError("Learner name cannot be empty.")
        no_emoji_validator(learner_name)
        sanity_check_name(learner_name)
        return learner_name


class LearnerForm(forms.ModelForm):
    name = forms.CharField(
        label="Learner's name (or nickname)",
        required=True
    )
    date_of_birth = forms.DateField(
        label="Learner DOB",
        required=True,
        widget=forms.DateInput(attrs={'type': 'date'})
    )
    cohort = forms.ModelChoiceField(
        queryset=Cohort.objects.none(),  # override in __init__
        label="Cohort",
        required=False,
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    class Meta:
        model = Learner
        fields = ['name', 'date_of_birth', 'cohort']

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)

        if user and hasattr(user, 'profile') and user.profile.school:
            self.fields['cohort'].queryset = Cohort.objects.filter(school=user.profile.school)
        else:
            self.fields['cohort'].queryset = Cohort.objects.none()
            self.fields['cohort'].empty_label = "Select a cohort (optional)"

    def clean_name(self):
        name = self.cleaned_data.get("name", "").strip()
        if not name:
            raise forms.ValidationError("Name cannot be empty.")
        no_emoji_validator(name)
        sanity_check_name(name)
        return name

    def clean_date_of_birth(self):
        dob = self.cleaned_data.get("date_of_birth")
        if not dob:
            raise forms.ValidationError("Date of birth is required.")
        if dob > date.today():
            raise forms.ValidationError("Learner's date of birth cannot be in the future.")
        return dob


# class WaitingListForm(forms.ModelForm):
#     class Meta:
#         model = WaitingList
#         fields = ['email']


class LogEntryForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super(LogEntryForm, self).__init__(*args, **kwargs)

        if user and hasattr(user, 'profile') and user.profile.school:
            self.fields['learner'].queryset = Learner.objects.filter(
                school=user.profile.school,
                deleted=False
            )
        else:
            self.fields['learner'].queryset = Learner.objects.none()

        # Override labels
        self.fields['goals'].label = 'Target'
        self.fields['notes'].label = 'Summary'

    class Meta:
        model = LogEntry
        fields = ['title', 'learner', 'goals', 'exercises_practised', 'notes']  # Maintain model field names
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'learner': forms.Select(attrs={'class': 'form-control'}),
            'goals': forms.TextInput(attrs={'class': 'form-control'}),  # use TextInput for a CharField-like UI
            'exercises_practised': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 5}),
        }


# SETTINGS FORMS

class UserUpdateForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name', 'email']
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Your Name'}),
            'email': forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Your Email'})
        }

    def clean_email(self):
        email = self.cleaned_data.get("email")
        if not email.strip():  # Prevent empty or whitespace-only input
            raise forms.ValidationError("Email cannot be empty.")
        return email

    def clean_first_name(self):
        first_name = self.cleaned_data.get("first_name", "")
        first_name = first_name.strip()
        if not first_name:
            raise forms.ValidationError("Name cannot be empty.")
        no_emoji_validator(first_name)
        sanity_check_name(first_name)
        return first_name


class PasswordUpdateForm(forms.Form):
    current_password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Current Password'}),
        label="Current Password"
    )
    new_password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'New Password'}),
        label="New Password"
    )

    def __init__(self, user, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = user

    def clean_current_password(self):
        current_password = self.cleaned_data.get("current_password")
        if not self.user.check_password(current_password):
            raise forms.ValidationError("Incorrect current password.")
        return current_password

class CohortForm(forms.ModelForm):
    class Meta:
        model = Cohort
        fields = ['name', 'description']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }