import csv
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Avg, Count, Q
from django.http import HttpResponse
from django.shortcuts import render

from feedback.models import Feedback
from policies.models import Policy


@staff_member_required
def overview(request):
    live = Feedback.objects.filter(is_flagged=False)
    rows = (Policy.objects.annotate(
        n=Count("feedbacks", filter=Q(feedbacks__is_flagged=False)),
        pos=Count("feedbacks", filter=Q(feedbacks__is_flagged=False, feedbacks__sentiment="positive")),
        neg=Count("feedbacks", filter=Q(feedbacks__is_flagged=False, feedbacks__sentiment="negative")),
        neu=Count("feedbacks", filter=Q(feedbacks__is_flagged=False, feedbacks__sentiment="neutral")),
        avg_rating=Avg("feedbacks__rating", filter=Q(feedbacks__is_flagged=False)),
    ).order_by("-n"))
    return render(request, "dashboard/overview.html", {
        "rows": rows,
        "totals": {
            "policies": Policy.objects.count(),
            "published": Policy.objects.filter(status="published").count(),
            "feedback": live.count(),
            "flagged": Feedback.objects.filter(is_flagged=True).count(),
            "positive": live.filter(sentiment="positive").count(),
            "negative": live.filter(sentiment="negative").count(),
            "neutral": live.filter(sentiment="neutral").count(),
        },
        "recent": Feedback.objects.select_related("policy")[:15],
    })


@staff_member_required
def export_feedback_csv(request):
    """Export citizen feedback data to CSV for analysis, per project spec."""
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="feedback_export.csv"'
    writer = csv.writer(response)
    writer.writerow([
        "ID", "Policy", "Rating", "Comment", "Applied Status",
        "Region", "Age Group", "Sentiment", "Confidence", "Model Name",
        "Is Sample", "Is Flagged", "Created At"
    ])
    feedbacks = Feedback.objects.select_related("policy").all().order_by("-created_at")
    for f in feedbacks:
        writer.writerow([
            f.id,
            f.policy.title if f.policy else "N/A",
            f.rating,
            f.comment,
            f.applied_status,
            f.region,
            f.age_group,
            f.sentiment,
            f.confidence,
            f.model_name,
            f.is_sample,
            f.is_flagged,
            f.created_at.strftime("%Y-%m-%d %H:%M:%S") if f.created_at else "",
        ])
    return response
