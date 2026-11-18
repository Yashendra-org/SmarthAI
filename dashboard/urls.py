from django.urls import path

from . import views

app_name = "dashboard"
urlpatterns = [
    # Server-side overview
    path("", views.overview, name="overview"),
    path("export/", views.export_feedback_csv, name="export_csv"),

    # Admin Authentication APIs
    path("api/auth/status/", views.auth_status_api, name="auth_status"),
    path("api/auth/login/", views.auth_login_api, name="auth_login"),
    path("api/auth/logout/", views.auth_logout_api, name="auth_logout"),

    # Admin Management APIs (Staff Only)
    path("api/admin/schemes/", views.admin_schemes_api, name="admin_schemes"),
    path("api/admin/schemes/<slug:slug>/toggle/", views.admin_scheme_toggle_status, name="admin_scheme_toggle"),
    path("api/admin/schemes/<slug:slug>/delete/", views.admin_scheme_delete, name="admin_scheme_delete"),
    path("api/admin/feedback/", views.admin_feedback_api, name="admin_feedback"),
    path("api/admin/feedback/<int:fb_id>/action/", views.admin_feedback_action, name="admin_feedback_action"),
]
