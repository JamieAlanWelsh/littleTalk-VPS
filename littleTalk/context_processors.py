from django.conf import settings


def layout_context(request):
    can_access_school_management = False
    if request.user.is_authenticated:
        try:
            profile = request.user.profile
            school = profile.get_current_school(request)
            can_access_school_management = bool(
                school
                and (
                    profile.is_admin_for_school(school)
                    or profile.is_manager_for_school(school)
                )
            )
        except Exception:
            can_access_school_management = False

    return {
        'hide_sidebar': getattr(request, 'hide_sidebar', False),
        'can_access_school_management': can_access_school_management,
    }

def canonical_url(request):
    canonical = request.build_absolute_uri(request.path)
    return {'canonical_url': canonical}


def marketing_links(request):
    return {
        'calendly_url': settings.CALENDLY_URL,
    }