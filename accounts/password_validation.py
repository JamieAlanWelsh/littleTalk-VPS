"""
Custom password validators for Chatterdillo.
Enforces consistent password rules across the application:
1. Minimum 8 characters
2. At least 1 alphabetical character
3. At least 1 number or special character
"""

import re
from django.core.exceptions import ValidationError


class AlphabeticalCharacterValidator:
    """
    Validate that the password contains at least one alphabetical character.
    """
    
    def validate(self, password, user=None):
        if not re.search(r'[a-zA-Z]', password):
            raise ValidationError(
                "This password must contain at least 1 alphabetical character.",
                code='no_alphabetical_character',
                params={'min_alphabetical': 1},
            )
    
    def get_help_text(self):
        return "Your password must contain at least 1 alphabetical character."


class NumberOrSpecialCharacterValidator:
    """
    Validate that the password contains at least one number or special character.
    """
    
    def validate(self, password, user=None):
        # Allow digits or any non-alphanumeric/whitespace character (special char)
        if not re.search(r'[\d\W]', password):
            raise ValidationError(
                "This password must contain at least 1 number or special character.",
                code='no_number_or_special_character',
                params={'min_number_or_special': 1},
            )
    
    def get_help_text(self):
        return "Your password must contain at least 1 number or special character."
