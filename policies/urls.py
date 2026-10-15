from django.urls import path

from . import views

app_name = "policies"
urlpatterns = [
    path("", views.home, name="home"),
    path("policies/", views.policy_list, name="list"),
    path("policies/<slug:slug>/", views.policy_detail, name="detail"),
    path("policies/<slug:slug>/apply/", views.apply_redirect, name="apply"),
    path("how-sentiment-works/", views.how_sentiment_works, name="how_sentiment"),
    path("about/", views.about, name="about"),
    path("disclaimer/", views.disclaimer, name="disclaimer"),
]
