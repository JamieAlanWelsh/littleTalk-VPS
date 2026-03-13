from django.urls import path
from django.contrib.auth import views as auth_views
from .views_modules import api as api_views
from .views_modules import auth as auth_app_views
from .views_modules import assessment as assessment_views
from .views_modules import dashboard as dashboard_views
from .views_modules import practise as practise_views
from .views_modules import logbook as logbook_views
from .views_modules import parent_access as parent_access_views
from .views_modules import profile as profile_views
from .views_modules import public as public_views
from .views_modules import school as school_views
from .views_modules import settings_views as settings_app_views
from .views_modules import subscription as subscription_views

urlpatterns = [
    # Landing content
    path('', public_views.home, name='home'),
    path('exercise/<str:game_name>/', public_views.game_description, name='game_description'),
    path('practise/', practise_views.practise, name='practise'),
    path('tips/', public_views.tips, name='tips'),
    path('method/', public_views.method, name='method'),
    path('about/', public_views.about, name='about'),
    path('terms/', public_views.terms_and_conditions, name='terms'),
    path('privacy/', public_views.privacy_policy, name='privacy'),
    path('data-policy/', public_views.data_policy, name='data_policy'),

    # Support
    path('support/', public_views.support, name='support'),
    path('support/send-email/', public_views.send_support_email, name='send_support_email'),

    # Assessment
    path('screener/', assessment_views.screener, name='screener'),
    path('screener/start/', assessment_views.start_assessment, name='start_assessment'),
    path('screener/save-all/', assessment_views.save_all_assessment_answers, name='save_all_assessment_answers'),
    path('screener/save/', assessment_views.save_assessment, name='save_assessment'),
    path('screener/summary/', assessment_views.assessment_summary, name='assessment_summary'),

    # Login and logout URLs
    path('login/', auth_app_views.CustomLoginView.as_view(), name='login'),
    path('account-setup/', auth_app_views.account_setup_view, name='account_setup'),

    # Profile and adding learners
    path('profile/', profile_views.profile, name='profile'),
    path('add-learner/', profile_views.add_learner, name='add_learner'),
    path('select-learner/', profile_views.select_learner, name='select_learner'),
    path('profile/edit_learner/<uuid:learner_uuid>/', profile_views.edit_learner, name='edit_learner'),
    path('profile/edit_learner/confirm_delete_learner/<uuid:learner_uuid>/', profile_views.confirm_delete_learner, name='confirm_delete_learner'),

    # Cohorts
    path('school/cohorts/', profile_views.cohort_list, name='cohort_list'),
    path('school/cohorts/new/', profile_views.cohort_create, name='cohort_create'),
    path('select-school/', school_views.select_school, name='select_school'),
    path('school/cohorts/<int:cohort_id>/edit/', profile_views.cohort_edit, name='cohort_edit'),
    path('school/cohorts/<int:cohort_id>/delete/', profile_views.cohort_delete, name='cohort_delete'),

    # Logbook
    path('logbook/', logbook_views.logbook, name='logbook'),
    path('logbook/new/', logbook_views.new_log_entry, name='new_log_entry'),
    path('logbook/<int:entry_id>/', logbook_views.log_entry_detail, name='log_entry_detail'),
    path("logbook/edit/<int:entry_id>/", logbook_views.edit_log_entry, name="edit_log_entry"),
    path('logbook/delete/<int:entry_id>/', logbook_views.delete_log_entry, name='delete_log_entry'), 
    path("logbook/summary/<uuid:learner_uuid>/", logbook_views.generate_summary, name="generate_summary"),

    # Settings
    path('settings/', settings_app_views.settings_view, name='settings'),
    path('settings/change-user-details/', settings_app_views.change_user_details, name='change_user_details'),
    path('settings/change-password/', settings_app_views.change_password, name='change_password'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),

    # School
    path('school-signup/', school_views.school_signup, name='school_signup'),
    path('school/invite-staff/', school_views.invite_staff, name='invite_staff'),
    path('accept-invite/<uuid:token>/', school_views.accept_invite, name='accept_invite'),
    path('school/', school_views.school_dashboard, name='school'),
    path('request-join-school/', school_views.request_join_school, name='request_join_school'),
    path('school/invite-audit/', school_views.invite_audit_trail, name='invite_audit_trail'),

    # Generate parent token
    path('profile/parent-token/<uuid:learner_uuid>/', parent_access_views.view_parent_token, name='view_parent_token'),
    path('profile/generate-token/<uuid:learner_uuid>/', parent_access_views.generate_parent_token, name='generate_parent_token'),
    path('profile/parent-token/<uuid:learner_uuid>/email/', parent_access_views.email_parent_token, name='email_parent_token'),

    # Parent
    path('parent-signup/', parent_access_views.parent_signup_view, name='parent_signup'),
    path('add-learner/pac', parent_access_views.add_learner_via_pac, name='add_pac_learner'),

    # Subcription routes
    path('subscribe/', subscription_views.subscribe, name='subscribe'),
    path('license-expired/', subscription_views.license_expired, name='license_expired'),

    # Stripe Webhook to activate and manage subscription
    path('webhooks/stripe/', subscription_views.stripe_webhook, name='stripe_webhook'),
    path('subscribe/checkout/', subscription_views.create_checkout_session, name='create_checkout_session'),
    path('subscribe/success/', subscription_views.subscribe_success, name='subscribe_success'),
    path('subscribe/manage/', subscription_views.manage_subscription, name='manage_subscription'),

    # API endpoints
    path('api/learners/<uuid:learner_uuid>/update-exp/', api_views.UpdateLearnerExpAPIView.as_view(), name='update_learner_exp'),
    path('api/selected-learner/', api_views.get_selected_learner, name='get_selected_learner'),
    path('api/targets/', api_views.create_target, name='create_target'),
    path('api/targets/<int:target_id>/', api_views.target_detail, name='target_detail'),

    # Dashboard
    path('dashboard/learner/', dashboard_views.learner_dashboard, name='learner_dashboard'),
    path('api/dashboard/progress-data/', dashboard_views.learner_progress_data, name='learner_progress_data'),
]