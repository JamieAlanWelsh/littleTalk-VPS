from django.urls import path
from django.contrib.auth import views as auth_views
from . import views
from .views import UpdateLearnerExpAPIView

urlpatterns = [
    # Landing content
    path('', views.home, name='home'),
    path('exercise/<str:game_name>/', views.game_description, name='game_description'),
    path('practise/', views.practise, name='practise'),
    path('tips/', views.tips, name='tips'),
    path('method/', views.method, name='method'),
    path('about/', views.about, name='about'),

    # Support
    path('support/', views.support, name='support'),
    path('support/send-email/', views.send_support_email, name='send_support_email'),

    # Assessment
    path('screener/start/', views.start_assessment, name='start_assessment'),
    path('screener/save-all/', views.save_all_assessment_answers, name='save_all_assessment_answers'),
    path('screener/save/', views.save_assessment, name='save_assessment'),
    path('screener/summary/', views.assessment_summary, name='assessment_summary'),

    # Login and logout URLs
    path('login/', views.CustomLoginView.as_view(), name='login'),
    # path('logout/', views.custom_logout_view, name='logout'),
    # path('register/', views.register, name='register'),
    path('account-setup/', views.account_setup_view, name='account_setup'),

    # Profile and adding learners
    path('profile/', views.profile, name='profile'),
    path('add-learner/', views.add_learner, name='add_learner'),
    path('select-learner/', views.select_learner, name='select_learner'),
    path('profile/edit_learner/<uuid:learner_uuid>/', views.edit_learner, name='edit_learner'),
    path('profile/edit_learner/confirm_delete_learner/<uuid:learner_uuid>/', views.confirm_delete_learner, name='confirm_delete_learner'),

    # Cohorts
    path('cohorts/', views.cohort_list, name='cohort_list'),
    path('cohorts/new/', views.cohort_create, name='cohort_create'),
    path('select-school/', views.select_school, name='select_school'),
    path('cohorts/<int:cohort_id>/edit/', views.cohort_edit, name='cohort_edit'),
    path('cohorts/<int:cohort_id>/delete/', views.cohort_delete, name='cohort_delete'),

    # Logbook
    path('logbook/', views.logbook, name='logbook'),
    path('logbook/new/', views.new_log_entry, name='new_log_entry'),
    path('logbook/<int:entry_id>/', views.log_entry_detail, name='log_entry_detail'),
    path("logbook/edit/<int:entry_id>/", views.edit_log_entry, name="edit_log_entry"),
    path('logbook/delete/<int:entry_id>/', views.delete_log_entry, name='delete_log_entry'), 
    path("logbook/summary/<uuid:learner_uuid>/", views.generate_summary, name="generate_summary"),

    # Settings
    path('settings/', views.settings_view, name='settings'),
    path('settings/change-user-details/', views.change_user_details, name='change_user_details'),
    path('settings/change-password/', views.change_password, name='change_password'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),

    # School
    path('school-signup/', views.school_signup, name='school_signup'),
    path('school/invite-staff/', views.invite_staff, name='invite_staff'),
    path('accept-invite/<uuid:token>/', views.accept_invite, name='accept_invite'),
    path('school/dashboard/', views.school_dashboard, name='school_dashboard'),
    path('request-join-school/', views.request_join_school, name='request_join_school'),
    path('school/invite-audit/', views.invite_audit_trail, name='invite_audit_trail'),

    # Generate parent token
    path('profile/parent-token/<uuid:learner_uuid>/', views.view_parent_token, name='view_parent_token'),
    path('profile/generate-token/<uuid:learner_uuid>/', views.generate_parent_token, name='generate_parent_token'),
    path('profile/parent-token/<uuid:learner_uuid>/email/', views.email_parent_token, name='email_parent_token'),

    # Parent
    path('parent-signup/', views.parent_signup_view, name='parent_signup'),
    path('add-learner/pac', views.add_learner_via_pac, name='add_pac_learner'),

    # Subcription routes
    path('subscribe/', views.subscribe, name='subscribe'),
    path('license-expired/', views.license_expired, name='license_expired'),

    # Stripe Webhook to activate and manage subscription
    path('webhooks/stripe/', views.stripe_webhook, name='stripe_webhook'),
    path('subscribe/checkout/', views.create_checkout_session, name='create_checkout_session'),
    path('subscribe/success/', views.subscribe_success, name='subscribe_success'),
    path('subscribe/manage/', views.manage_subscription, name='manage_subscription'),

    # API endpoints
    path('api/learners/<uuid:learner_uuid>/update-exp/', UpdateLearnerExpAPIView.as_view(), name='update_learner_exp'),
    path('api/selected-learner/', views.get_selected_learner, name='get_selected_learner'),
]