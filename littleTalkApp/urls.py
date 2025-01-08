from django.urls import path
from django.contrib.auth import views as auth_views
from . import views
from .views import UpdateLearnerExpAPIView

urlpatterns = [
    path('', views.home, name='home'),
    path('exercise/<str:game_name>/', views.game_description, name='game_description'),
    path('about/', views.about, name='about'),
    path('practice/', views.practice, name='practice'),


    # Login and logout URLs
    path('login/', views.CustomLoginView.as_view(), name='login'),
    path('logout/', views.custom_logout_view, name='logout'),
    path('register/', views.register, name='register'),

    # Profile and adding learners
    path('profile/', views.profile, name='profile'),
    path('add-learner/', views.add_learner, name='add_learner'),
    path('select-learner/', views.select_learner, name='select_learner'),
    path('profile/edit_learner/<uuid:learner_uuid>/', views.edit_learner, name='edit_learner'),
    path('profile/edit_learner/confirm_delete_learner/<uuid:learner_uuid>/', views.confirm_delete_learner, name='confirm_delete_learner'),

    # Exercises
    # path('colourful_semantics_view/', views.colourful_semantics_view, name='colourful_semantics_view'),

    # API endpoints
    path('api/learners/<int:learner_id>/update-exp/', UpdateLearnerExpAPIView.as_view(), name='update_learner_exp'),
    path('api/selected-learner/', views.get_selected_learner, name='get_selected_learner'),
]