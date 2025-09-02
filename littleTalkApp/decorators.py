from django.http import Http404
from functools import wraps

# Use your actual game list / lookup
from .game_data import GAME_DESCRIPTIONS  # Or move this logic to a shared module

def valid_game_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, game_name, *args, **kwargs):
        if game_name not in GAME_DESCRIPTIONS:
            raise Http404("Game not found")
        return view_func(request, game_name, *args, **kwargs)
    return _wrapped_view