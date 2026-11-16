from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json

from policies.models import Policy
from sentiment.services import get_engine

from .forms import FeedbackForm
from .models import Feedback
from .services import hash_ip, is_rate_limited


@csrf_exempt
def api_submit_feedback(request, slug):
    if request.method != "POST":
        return JsonResponse({"error": "POST method required"}, status=405)
    policy = get_object_or_404(Policy, slug=slug)
    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        data = request.POST

    comment = (data.get("comment") or data.get("operational_impact") or data.get("proposed_modifications") or "Citizen policy audit review.").strip()
    try:
        rating = int(data.get("rating", 5))
    except (ValueError, TypeError):
        rating = 5

    ip_hash = hash_ip(request)
    result = get_engine().analyze(comment)

    clarity_r = None
    if data.get("clarity_rating"):
        try:
            clarity_r = max(1, min(5, int(data.get("clarity_rating"))))
        except (ValueError, TypeError):
            pass

    overall_e = None
    if data.get("overall_effectiveness"):
        try:
            overall_e = max(1, min(5, int(data.get("overall_effectiveness"))))
        except (ValueError, TypeError):
            pass

    fb = Feedback.objects.create(
        policy=policy,
        rating=max(1, min(5, rating)),
        comment=comment[:2000],
        applied_status=str(data.get("applied_status", ""))[:12],
        role=str(data.get("role", ""))[:80],
        duration_subject=str(data.get("duration_subject", ""))[:40],
        clarity_rating=clarity_r,
        ambiguity_notes=str(data.get("ambiguity_notes", "")),
        operational_impact=str(data.get("operational_impact", "")),
        perceived_fairness=str(data.get("perceived_fairness", ""))[:20],
        unintended_consequences=str(data.get("unintended_consequences", "")),
        proposed_modifications=str(data.get("proposed_modifications", "")),
        overall_effectiveness=overall_e,
        region=str(data.get("region", ""))[:60],
        age_group=str(data.get("age_group", ""))[:10],
        sentiment=result.label,
        confidence=result.confidence,
        model_name=result.model_name,
        ip_hash=ip_hash,
    )
    return JsonResponse({
        "status": "success",
        "id": fb.id,
        "sentiment": fb.sentiment,
        "policy": policy.title,
        "message": "Thank you! Your citizen policy audit and experience have been saved."
    })


@require_POST
def submit_feedback(request, slug):
    policy = get_object_or_404(Policy, slug=slug, status=Policy.Status.PUBLISHED)
    form = FeedbackForm(request.POST)
    ip_hash = hash_ip(request)

    if is_rate_limited(ip_hash):
        messages.error(request, "You have sent several responses recently. Please try again later.")
    elif form.is_valid():
        fb = form.save(commit=False)
        fb.policy = policy
        fb.ip_hash = ip_hash
        result = get_engine().analyze(fb.comment)
        fb.sentiment, fb.confidence, fb.model_name = result.label, result.confidence, result.model_name
        fb.save()
        messages.success(request, "Thank you. Your feedback has been recorded.")
    else:
        messages.error(request, "Your feedback was not saved: " + "; ".join(
            f"{field}: {' '.join(errs)}" for field, errs in form.errors.items()))
    return redirect(f"{policy.get_absolute_url()}#feedback")
