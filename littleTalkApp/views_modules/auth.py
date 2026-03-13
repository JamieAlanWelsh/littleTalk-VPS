from django.contrib.auth.views import LoginView
from django.shortcuts import render

from littleTalkApp.forms import CustomAuthenticationForm


class CustomLoginView(LoginView):
    template_name = "auth/login.html"
    redirect_authenticated_user = True
    authentication_form = CustomAuthenticationForm

    def dispatch(self, request, *args, **kwargs):
        request.hide_sidebar = True
        return super().dispatch(request, *args, **kwargs)


def account_setup_view(request):
    request.hide_sidebar = True
    return render(request, "auth/account_setup.html")
