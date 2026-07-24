from django.contrib import messages
from django.http import Http404, JsonResponse
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


def block_read_only(view_func=None, *, api=False):
    """Block users with a read-only role for their current school.

    Read-only staff may view everything but cannot create or edit content
    (learners, log entries, screeners). Pass ``api=True`` for JSON endpoints
    to return a 403 JSON response instead of redirecting.
    """

    def decorator(func):
        @wraps(func)
        def _wrapped_view(request, *args, **kwargs):
            profile = getattr(request.user, "profile", None)
            if profile is not None:
                school = profile.get_current_school(request)
                if school and profile.is_read_only_for_school(school):
                    if api:
                        return JsonResponse(
                            {"error": "Your read-only role does not permit this action."},
                            status=403,
                        )
                    messages.error(
                        request,
                        "Your read-only role does not permit this action.",
                    )
                    return redirect("profile")
            return func(request, *args, **kwargs)

        return _wrapped_view

    if view_func is not None:
        return decorator(view_func)
    return decorator