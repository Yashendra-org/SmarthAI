from django.urls import path

from . import views

app_name = "feedback"
urlpatterns = [path("<slug:slug>/submit/", views.submit_feedback, name="submit")]
