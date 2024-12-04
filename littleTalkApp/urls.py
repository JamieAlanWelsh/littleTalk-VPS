from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('exercise/<str:game_name>/', views.game_description, name='game_description'),
]