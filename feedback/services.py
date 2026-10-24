import hashlib
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from .models import Feedback


def hash_ip(request):
    ip = request.META.get("REMOTE_ADDR", "")
    return hashlib.sha256(f"{settings.SECRET_KEY}:{ip}".encode()).hexdigest()


def is_rate_limited(ip_hash):
    since = timezone.now() - timedelta(hours=1)
    return Feedback.objects.filter(ip_hash=ip_hash, created_at__gte=since).count() >= settings.FEEDBACK_RATE_LIMIT_PER_HOUR


def sentiment_summary(policy):
    """Shared by the public policy page and the dashboard so the numbers always agree."""
    qs = policy.feedbacks.filter(is_flagged=False)
    total = qs.count()
    base = {"total": total, "min_required": settings.MIN_RESPONSES_FOR_CHART, "apply_clicks": policy.apply_clicks}
    if total < settings.MIN_RESPONSES_FOR_CHART:
        return {**base, "show_chart": False}
    counts = {s: qs.filter(sentiment=s).count() for s in ("positive", "negative", "neutral")}
    applied = qs.filter(applied_status="applied").count()
    started = qs.filter(applied_status="started").count()
    return {
        **base,
        "show_chart": True,
        "counts": counts,
        "percent": {k: round(100 * v / total) for k, v in counts.items()},
        "applied_percent": round(100 * applied / total),
        "started_percent": round(100 * started / total),
        "has_sample_data": qs.filter(is_sample=True).exists(),
    }
