from django.db.models import F, Q
from django.shortcuts import get_object_or_404, redirect, render

from feedback.forms import FeedbackForm
from feedback.services import sentiment_summary

from .models import Department, Policy, TargetGroup


def published():
    return Policy.objects.filter(status=Policy.Status.PUBLISHED).select_related("department")


def home(request):
    return render(request, "policies/home.html", {
        "categories": Policy.Category.choices,
        "target_groups": TargetGroup.objects.filter(policies__status=Policy.Status.PUBLISHED).distinct(),
        "recent": published().order_by("-published_at")[:6],
        "total": published().count(),
    })


def policy_list(request):
    qs = published().prefetch_related("target_groups")
    q = request.GET.get("q", "").strip()
    category = request.GET.get("category", "")
    department = request.GET.get("department", "")
    level = request.GET.get("level", "")
    state = request.GET.get("state", "").strip()
    group = request.GET.get("group", "")

    if q:
        qs = qs.filter(
            Q(title__icontains=q)
            | Q(objective__icontains=q)
            | Q(summary_en__icontains=q)
            | Q(summary_hi__icontains=q)
            | Q(eligibility__icontains=q)
            | Q(benefits__icontains=q)
        )
    if category:
        qs = qs.filter(category=category)
    if department:
        qs = qs.filter(department_id=department)
    if level:
        qs = qs.filter(level=level)
    if state:
        qs = qs.filter(state__iexact=state)
    if group:
        qs = qs.filter(target_groups__slug=group)

    # Unique states for the state filter dropdown
    available_states = (
        Policy.objects.filter(status=Policy.Status.PUBLISHED)
        .exclude(state="")
        .values_list("state", flat=True)
        .distinct()
        .order_by("state")
    )

    return render(request, "policies/list.html", {
        "policies": qs.distinct(),
        "q": q,
        "category": category,
        "department": department,
        "level": level,
        "state": state,
        "group": group,
        "categories": Policy.Category.choices,
        "departments": Department.objects.filter(policies__status=Policy.Status.PUBLISHED).distinct(),
        "levels": Policy.Level.choices,
        "states": available_states,
        "target_groups": TargetGroup.objects.all(),
    })


def policy_detail(request, slug):
    policy = get_object_or_404(published().prefetch_related("target_groups"), slug=slug)
    return render(request, "policies/detail.html", {
        "policy": policy,
        "summary": sentiment_summary(policy),
        "form": FeedbackForm(),
    })


def apply_redirect(request, slug):
    """Counts the click, then sends the citizen to the official page."""
    policy = get_object_or_404(published(), slug=slug)
    if not policy.official_url:
        return redirect(policy.get_absolute_url())
    Policy.objects.filter(pk=policy.pk).update(apply_clicks=F("apply_clicks") + 1)
    return redirect(policy.official_url)


def how_sentiment_works(request):
    return render(request, "pages/how_sentiment.html")


def about(request):
    return render(request, "pages/about.html")


def disclaimer(request):
    return render(request, "pages/disclaimer.html")
