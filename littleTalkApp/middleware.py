from django.shortcuts import redirect
from django.urls import reverse, resolve
from django.utils.deprecation import MiddlewareMixin
from .models import Role


class NoCacheHtmlMiddleware:
    """
    Prevent browsers/proxies from caching HTML documents.
    Static assets remain cacheable via static file server/CDN policy.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        content_type = response.get("Content-Type", "")
        if content_type.startswith("text/html"):
            response["Cache-Control"] = "no-cache, no-store, must-revalidate, private"
            response["Pragma"] = "no-cache"
            response["Expires"] = "0"

        return response


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
            reverse("login"),
            reverse("logout"),
            reverse("profile"),
            reverse("school"),
            reverse("select_school"),
            reverse("select_learner"),
            reverse("subscribe"),
            reverse("license_expired"),
            reverse("settings"),
            reverse("logbook"),
            reverse("support"),
            reverse("access_restricted"),
        ]

        if any(path.startswith(ap) for ap in allowed_paths):
            return None

        if not user.is_authenticated:
            return None  # Let login-required decorators handle it

        profile = getattr(user, "profile", None)

        if not profile:
            return None

        # --- Parent User Logic ---
        if profile.role == Role.PARENT:
            parent_profile = getattr(profile, "parent_profile", None)
            if parent_profile and not parent_profile.has_access():
                return redirect("subscribe")

        # --- School Staff Logic (per-school roles) ---
        # Determine selected/current school then check the role for that school.
        has_multiple_schools = (
            hasattr(profile, "has_multiple_schools") and profile.has_multiple_schools()
        )

        accessible_schools = (
            profile.get_accessible_schools()
            if hasattr(profile, "get_accessible_schools")
            else profile.schools.all()
        )

        if has_multiple_schools:
            selected_id = request.session.get("selected_school_id")
            if not selected_id:
                return None
            school = accessible_schools.filter(id=selected_id).first()
            if not school:
                return None
        else:
            school = (
                profile.get_current_school(request)
                if hasattr(profile, "get_current_school")
                else None
            )

        if school:
            role_for = profile.get_role_for_school(school)
            # Check staff-like roles for this school (include legacy 'manager')
            if role_for in [Role.ADMIN, Role.TEAM_MANAGER, Role.STAFF, "manager"]:
                if not school.has_valid_license():
                    return redirect("license_expired")

        return None


class SchoolSelectionMiddleware:
    """
    Ensure users with multiple schools have selected one.
    Redirects to school selection if needed.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Process request
        if self._should_redirect_to_school_selection(request):
            return redirect('select_school')
            
        response = self.get_response(request)
        return response
        
    def _should_redirect_to_school_selection(self, request):
        # Skip if not authenticated
        if not request.user.is_authenticated:
            return False
            
        # Get current URL name
        try:
            url_name = resolve(request.path_info).url_name
        except Exception:
            url_name = ''
            
        # Skip middleware for these paths
        skip_urls = {
            'select_school',
            'license_expired',
            'access_restricted',
            'logout',
            'static',
            'media',
            'support',
            'sso_callback',
            'sso_launch',
        }
        if url_name in skip_urls:
            return False
            
        # Skip for parent users
        if hasattr(request.user, 'profile') and request.user.profile.is_parent():
            return False
            
        # Check if user needs to select a school
        profile = getattr(request.user, 'profile', None)
        if profile and profile.has_multiple_schools():
            # Needs selection if no school is selected in session
            selected_id = request.session.get('selected_school_id')
            if not selected_id:
                return True
                
            # Or if selected school isn't valid for this user
            if not profile.get_accessible_schools().filter(id=selected_id).exists():
                return True
                
        return False


class RoleSchoolBlockMiddleware:
    """
    Blocks users from accessing the app if:
    - user.profile.role != "parent"
    - AND user.profile has no associated schools
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = request.user

        try:
            url_name = resolve(request.path_info).url_name
        except Exception:
            url_name = ""

        if url_name in {"access_restricted", "logout", "support"}:
            return self.get_response(request)

        if user.is_authenticated:
            profile = getattr(user, "profile", None)
            if profile:
                # If this user is staff (non-parent) and has no associated
                # schools, block access.
                if profile.role != Role.PARENT and not profile.get_accessible_schools().exists():
                    return redirect("access_restricted")

        return self.get_response(request)
