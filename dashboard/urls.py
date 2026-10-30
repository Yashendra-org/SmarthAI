from django.urls import path

from . import views

app_name = "dashboard"
urlpatterns = [
    path("", views.overview, name="overview"),
    path("export/", views.export_feedback_csv, name="export_csv"),
]
