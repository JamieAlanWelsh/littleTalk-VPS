from django import forms
from django.contrib.auth.models import User

class UserRegistrationForm(forms.ModelForm):
    firstName = forms.CharField(max_length=100, label="First Name")  # Optional field
    lastName = forms.CharField(max_length=100, label="Last Name")  # Optional field
    password1 = forms.CharField(widget=forms.PasswordInput, label="Password")
    password2 = forms.CharField(widget=forms.PasswordInput, label="Confirm Password")

    class Meta:
        model = User
        fields = ['username', 'email']  # You can add more fields if needed

    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')

        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords do not match")
        return password2