def layout_context(request):
    return {
        'hide_header': getattr(request, 'hide_header', False),
        'hide_sidebar': getattr(request, 'hide_sidebar', False),
    }