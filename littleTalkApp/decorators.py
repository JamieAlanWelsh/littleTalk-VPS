from django.contrib import messages
from django.http import Http404
from django.shortcuts import redirect
from functools import wraps

# Use your actual game list / lookup
from .content import GAME_DESCRIPTIONS

def valid_game_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, game_name, *args, **kwargs):
        if game_name not in GAME_DESCRIPTIONS:
            raise Http404("Game not found")
        return view_func(request, game_name, *args, **kwargs)
    return _wrapped_view


def block_skolon_user(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if request.user.is_authenticated and request.user.profile.is_skolon_user():
            messages.error(request, "This page is not available for Skolon accounts.")
            return redirect("profile")
        return view_func(request, *args, **kwargs)

    return _wrapped_view