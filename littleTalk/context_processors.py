from django.conf import settings


def layout_context(request):
    return {
        'hide_sidebar': getattr(request, 'hide_sidebar', False),
    }

def canonical_url(request):
    canonical = request.build_absolute_uri(request.path)
    return {'canonical_url': canonical}


def marketing_links(request):
    return {
        'calendly_url': settings.CALENDLY_URL,
    }