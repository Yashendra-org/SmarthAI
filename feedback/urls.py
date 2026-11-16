from django.urls import path

from . import views

app_name = "feedback"
urlpatterns = [
    path("<slug:slug>/submit/", views.submit_feedback, name="submit"),
    path("<slug:slug>/api/submit/", views.api_submit_feedback, name="api_submit"),
]
