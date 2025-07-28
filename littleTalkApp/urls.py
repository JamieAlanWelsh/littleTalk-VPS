from django.urls import path
from django.contrib.auth import views as auth_views
from . import views
from .views import UpdateLearnerExpAPIView

urlpatterns = [
    # Landing content
    path('', views.home, name='home'),
    path('schools/', views.schools, name='schools'),
    path('exercise/<str:game_name>/', views.game_description, name='game_description'),
    path('practise/', views.practise, name='practise'),

    # Support
    path('support/', views.support, name='support'),
    path('support/send-email/', views.send_support_email, name='send_support_email'),
    # path('comingsoon/', views.comingsoon, name='comingsoon'),
    path('tips/', views.tips, name='tips'),
    path('method/', views.method, name='method'),

    # Assessment
    path('assessment/start/', views.start_assessment, name='start_assessment'),
    path('assessment/save-all/', views.save_all_assessment_answers, name='save_all_assessment_answers'),
    path('assessment/summary/', views.assessment_summary, name='assessment_summary'),
    path('assessment/save-retake/', views.save_retake_assessment, name='save_retake_assessment'),

    # Login and logout URLs
    path('login/', views.CustomLoginView.as_view(), name='login'),
    # path('logout/', views.custom_logout_view, name='logout'),
    path('register/', views.register, name='register'),

    # School sign up
    path('school-signup/', views.school_signup, name='school_signup'),

    # Profile and adding learners
    path('profile/', views.profile, name='profile'),
    path('add-learner/', views.add_learner, name='add_learner'),
    path('select-learner/', views.select_learner, name='select_learner'),
    path('profile/edit_learner/<uuid:learner_uuid>/', views.edit_learner, name='edit_learner'),
    path('profile/edit_learner/confirm_delete_learner/<uuid:learner_uuid>/', views.confirm_delete_learner, name='confirm_delete_learner'),

    # Cohorts
    path('cohorts/', views.cohort_list, name='cohort_list'),
    path('cohorts/new/', views.cohort_create, name='cohort_create'),
    path('cohorts/<int:cohort_id>/edit/', views.cohort_edit, name='cohort_edit'),
    path('cohorts/<int:cohort_id>/delete/', views.cohort_delete, name='cohort_delete'),

    # Logbook
    path('logbook/', views.logbook, name='logbook'),
    path('logbook/new/', views.new_log_entry, name='new_log_entry'),
    path('logbook/<int:entry_id>/', views.log_entry_detail, name='log_entry_detail'),
    path("logbook/edit/<int:entry_id>/", views.edit_log_entry, name="edit_log_entry"),
    path('logbook/delete/<int:entry_id>/', views.delete_log_entry, name='delete_log_entry'), 
    path("logbook/summary/<int:learner_id>/", views.generate_summary, name="generate_summary"),

    # Settings
    path('settings/', views.settings_view, name='settings'),
    path('settings/change-user-details/', views.change_user_details, name='change_user_details'),
    path('settings/change-password/', views.change_password, name='change_password'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),

    # School
    path('school/invite-staff/', views.invite_staff, name='invite_staff'),
    path('accept-invite/<uuid:token>/', views.accept_invite, name='accept_invite'),
    path('school/dashboard/', views.school_dashboard, name='school_dashboard'),
    path('request-join-school/', views.request_join_school, name='request_join_school'),

    # API endpoints
    path('api/learners/<int:learner_id>/update-exp/', UpdateLearnerExpAPIView.as_view(), name='update_learner_exp'),
    path('api/selected-learner/', views.get_selected_learner, name='get_selected_learner'),
]