from django.conf import settings


def layout_context(request):
    can_access_school_management = False
    sidebar_school_switcher_enabled = False
    sidebar_school_switcher_options = []
    sidebar_current_school_id = None
    if request.user.is_authenticated:
        try:
            profile = request.user.profile
            school = profile.get_current_school(request)
            sidebar_current_school_id = school.id if school else None
            can_access_school_management = bool(
                school
                and (
                    profile.is_admin_for_school(school)
                    or profile.is_manager_for_school(school)
                )
            )
            if not profile.is_parent():
                schools = list(profile.get_accessible_schools().order_by("name"))
                if len(schools) > 1:
                    sidebar_school_switcher_enabled = True
                    sidebar_school_switcher_options = schools
        except Exception:
            can_access_school_management = False
            sidebar_school_switcher_enabled = False
            sidebar_school_switcher_options = []
            sidebar_current_school_id = None

    return {
        'hide_sidebar': getattr(request, 'hide_sidebar', False),
        'can_access_school_management': can_access_school_management,
        'sidebar_school_switcher_enabled': sidebar_school_switcher_enabled,
        'sidebar_school_switcher_options': sidebar_school_switcher_options,
        'sidebar_current_school_id': sidebar_current_school_id,
    }

def canonical_url(request):
    canonical = request.build_absolute_uri(request.path)
    return {'canonical_url': canonical}


def marketing_links(request):
    return {
        'calendly_url': settings.CALENDLY_URL,
    }