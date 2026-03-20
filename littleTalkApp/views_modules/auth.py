from django.contrib.auth.views import LoginView
from django.shortcuts import render

from littleTalkApp.forms import CustomAuthenticationForm


class CustomLoginView(LoginView):
    """Renders auth/login.html — the main login page.

    Extends Django's built-in LoginView with a custom authentication form and
    hides the sidebar. Redirects already-authenticated users away automatically.
    """

    template_name = "auth/login.html"
    redirect_authenticated_user = True
    authentication_form = CustomAuthenticationForm

    def dispatch(self, request, *args, **kwargs):
        request.hide_sidebar = True
        return super().dispatch(request, *args, **kwargs)


def account_setup_view(request):
    """Renders auth/account_setup.html — a static informational page shown to users
    after registration who still need to complete their account configuration.
    """

    request.hide_sidebar = True
    return render(request, "auth/account_setup.html")
