from django.urls import path
from django.contrib.auth import views as auth_views
from . import views
from .views import UpdateLearnerExpAPIView

urlpatterns = [
    path('', views.home, name='home'),
    path('exercise/<str:game_name>/', views.game_description, name='game_description'),
    path('practise/', views.practise, name='practise'),
    path('support/', views.support, name='support'),
    path('comingsoon/', views.comingsoon, name='comingsoon'),


    # Login and logout URLs
    path('login/', views.CustomLoginView.as_view(), name='login'),
    # path('logout/', views.custom_logout_view, name='logout'),
    path('register/', views.register, name='register'),

    # Profile and adding learners
    path('profile/', views.profile, name='profile'),
    path('add-learner/', views.add_learner, name='add_learner'),
    path('select-learner/', views.select_learner, name='select_learner'),
    path('profile/edit_learner/<uuid:learner_uuid>/', views.edit_learner, name='edit_learner'),
    path('profile/edit_learner/confirm_delete_learner/<uuid:learner_uuid>/', views.confirm_delete_learner, name='confirm_delete_learner'),

    # Logbook
    path('logbook/', views.logbook, name='logbook'),
    path('logbook/new/', views.new_log_entry, name='new_log_entry'),
    path('logbook/<int:entry_id>/', views.log_entry_detail, name='log_entry_detail'),
    path('logbook/delete/<int:entry_id>/', views.delete_log_entry, name='delete_log_entry'),  # New delete URL

    # Settings
    path('settings/', views.settings_view, name='settings'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),

    # API endpoints
    path('api/learners/<int:learner_id>/update-exp/', UpdateLearnerExpAPIView.as_view(), name='update_learner_exp'),
    path('api/selected-learner/', views.get_selected_learner, name='get_selected_learner'),
]