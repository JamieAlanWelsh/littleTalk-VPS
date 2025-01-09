def layout_context(request):
    return {
        'hide_sidebar': getattr(request, 'hide_sidebar', False),
    }