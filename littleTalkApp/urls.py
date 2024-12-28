from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('exercise/<str:game_name>/', views.game_description, name='game_description'),

    # Login and logout URLs
    path('login/', auth_views.LoginView.as_view(), name='login'),
    path('logout/', views.custom_logout_view, name='logout'),
    path('register/', views.register, name='register'),

    # Profile and adding learners
    path('profile/', views.profile, name='profile'),
]