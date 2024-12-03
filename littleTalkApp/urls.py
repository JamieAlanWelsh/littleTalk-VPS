from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('game/<str:game_name>/', views.game_description, name='game_description'),
    # path('colour-semantics/', views.colour_semantics, name='colour_semantics'),
]