from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect
from django.views.decorators.http import require_POST

from policies.models import Policy
from sentiment.services import get_engine

from .forms import FeedbackForm
from .services import hash_ip, is_rate_limited


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
