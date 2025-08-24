from django.shortcuts import redirect
from django.urls import reverse
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponseForbidden


class AccessControlMiddleware(MiddlewareMixin):
    """
    Restricts access based on parent subscription or school license.
    Allows /login/, /logout/, /profile/, /subscribe/, /license-expired/
    """

    def process_view(self, request, view_func, view_args, view_kwargs):
        user = request.user
        path = request.path

        # Allow unauthenticated users to access login/logout
        allowed_paths = [
            reverse('login'),
            reverse('logout'),
            reverse('profile'),
            reverse('select_learner'),
            reverse('subscribe'),
            reverse('license_expired'),
            reverse('settings'),
            reverse('logbook'),
            reverse('support'),
        ]

        if any(path.startswith(ap) for ap in allowed_paths):
            return None

        if not user.is_authenticated:
            return None  # Let login-required decorators handle it

        profile = getattr(user, 'profile', None)

        if not profile:
            return None

        # --- Parent User Logic ---
        if profile.role == 'parent':
            parent_profile = getattr(profile, 'parent_profile', None)
            if parent_profile and not parent_profile.has_access():
                return redirect('subscribe')

        # --- School Staff Logic ---
        if profile.role in ['admin', 'manager', 'staff']:
            school = profile.school
            if school and not school.has_valid_license():
                return redirect('license_expired')

        return None


class RoleSchoolBlockMiddleware:
    """
    Blocks users from accessing the app if:
    - user.profile.role != "parent"
    - AND user.profile.school is None
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = request.user

        if user.is_authenticated:
            profile = getattr(user, "profile", None)
            if profile:
                if profile.role != "parent" and profile.school_id is None:
                    # 1) show forbidden
                    return HttpResponseForbidden("Your account is not configured for access.")
                    # 2) or redirect to a support/contact page
                    # return redirect(reverse("account_help"))

        return self.get_response(request)