from django.contrib import admin
from django.urls import include, path
from django.views.generic.base import RedirectView

urlpatterns = [
    path("favicon.ico", RedirectView.as_view(url="/static/img/favicon.svg", permanent=True)),
    path("admin/", admin.site.urls),
    path("", include("policies.urls")),
    path("feedback/", include("feedback.urls")),
    path("dashboard/", include("dashboard.urls")),
]
