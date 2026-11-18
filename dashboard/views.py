import csv
import json
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth import authenticate, login, logout
from django.core.cache import cache
from django.db.models import Avg, Count, Q
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.utils.text import slugify
from django.views.decorators.csrf import csrf_exempt

from feedback.models import Feedback
from feedback.services import hash_ip
from policies.models import Department, Policy

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION = 900  # 15 minutes lockout


# ==============================================================================
# Authentication & Status API
# ==============================================================================

def auth_status_api(request):
    """Check whether the current session is authenticated as a government staff/admin."""
    user = request.user
    if user.is_authenticated and (user.is_staff or user.is_superuser):
        return JsonResponse({
            "authenticated": True,
            "is_staff": True,
            "is_superuser": user.is_superuser,
            "username": user.username,
            "name": user.get_full_name() or user.username,
            "role": getattr(user, "role", "admin"),
        })
    return JsonResponse({
        "authenticated": False,
        "is_staff": False,
        "is_superuser": False,
        "username": "",
    })


@csrf_exempt
def auth_login_api(request):
    """Official Officer / Administrator SSO Login endpoint with brute-force defense."""
    if request.method != "POST":
        return JsonResponse({"error": "POST method required"}, status=405)

    ip_hash = hash_ip(request)
    lock_key = f"login_lock_{ip_hash}"
    if cache.get(lock_key):
        return JsonResponse({
            "status": "error",
            "message": "Too many failed attempts. Login is temporarily locked for 15 minutes."
        }, status=429)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        data = request.POST

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return JsonResponse({"status": "error", "message": "Username and password are required."}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is not None:
        if user.is_staff or user.is_superuser:
            cache.delete(f"login_fail_{ip_hash}")
            login(request, user)
            return JsonResponse({
                "status": "success",
                "message": "Officer authentication successful.",
                "user": {
                    "username": user.username,
                    "name": user.get_full_name() or user.username,
                    "is_staff": user.is_staff,
                    "is_superuser": user.is_superuser,
                }
            })
        return JsonResponse({
            "status": "error",
            "message": "Access restricted to authorized Ministry Officers and Staff only."
        }, status=403)

    # Increment failure counter
    fail_key = f"login_fail_{ip_hash}"
    failed_count = cache.get(fail_key, 0) + 1
    if failed_count >= MAX_LOGIN_ATTEMPTS:
        cache.set(lock_key, True, timeout=LOCKOUT_DURATION)
        cache.delete(fail_key)
        return JsonResponse({
            "status": "error",
            "message": "Maximum login attempts exceeded. Account is locked for 15 minutes."
        }, status=429)
    else:
        cache.set(fail_key, failed_count, timeout=600)

    return JsonResponse({"status": "error", "message": "Invalid government credentials. Please check username and password."}, status=401)


@csrf_exempt
def auth_logout_api(request):
    """Secure logout for staff."""
    logout(request)
    return JsonResponse({"status": "success", "message": "Logged out successfully."})


# ==============================================================================
# Admin Scheme Management API (Staff Only)
# ==============================================================================

def admin_schemes_api(request):
    """List, search, filter or add schemes directly in the database."""
    if not (request.user.is_authenticated and request.user.is_staff):
        return JsonResponse({"error": "Unauthorized: Staff credentials required"}, status=403)

    if request.method == "GET":
        q = request.GET.get("q", "").strip()
        status_filter = request.GET.get("status", "")
        qs = Policy.objects.all().select_related("department").order_by("-updated_at")
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(department__name__icontains=q) | Q(benefits__icontains=q))
        if status_filter:
            qs = qs.filter(status=status_filter)

        try:
            limit = int(request.GET.get("limit", 50))
        except (ValueError, TypeError):
            limit = 50

        total = qs.count()
        schemes = []
        for p in qs[:limit]:
            schemes.append({
                "id": p.id,
                "slug": p.slug,
                "name": p.title,
                "dept": p.department.name if p.department else "N/A",
                "category": p.category,
                "category_display": p.get_category_display(),
                "level": p.level,
                "state": p.state,
                "benefit": p.benefits,
                "url": p.official_url,
                "status": p.status,
                "apply_clicks": p.apply_clicks,
                "last_verified": str(p.last_verified) if p.last_verified else None,
            })
        return JsonResponse({
            "total": total,
            "schemes": schemes,
        })

    if request.method == "POST":
        try:
            data = json.loads(request.body.decode("utf-8"))
        except Exception:
            data = request.POST

        name = (data.get("name") or "").strip()
        dept_name = (data.get("dept") or "Ministry of Electronics & Information Technology").strip()
        cat = data.get("cat") or "other"
        benefit = (data.get("benefit") or "").strip()
        url = (data.get("url") or "").strip()
        desc = (data.get("desc") or benefit).strip()

        if not name or not benefit:
            return JsonResponse({"error": "Scheme name and benefits are required"}, status=400)

        dept, _ = Department.objects.get_or_create(name=dept_name)
        base_slug = slugify(name)[:50] or "scheme"
        slug = base_slug
        c = 1
        while Policy.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{c}"
            c += 1

        policy = Policy.objects.create(
            title=name,
            slug=slug,
            department=dept,
            category=cat,
            level=data.get("lvl", "central"),
            state=data.get("state", ""),
            benefits=benefit,
            objective=desc,
            summary_en=desc,
            summary_hi=data.get("summary_hi", ""),
            official_url=url,
            status=Policy.Status.PUBLISHED,
        )

        return JsonResponse({
            "status": "success",
            "message": f"Scheme '{policy.title}' created and published.",
            "scheme": {
                "id": policy.id,
                "slug": policy.slug,
                "name": policy.title,
                "status": policy.status,
            }
        })

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def admin_scheme_toggle_status(request, slug):
    """Toggle a scheme status between 'published' and 'draft'."""
    if not (request.user.is_authenticated and request.user.is_staff):
        return JsonResponse({"error": "Unauthorized"}, status=403)
    if request.method != "POST":
        return JsonResponse({"error": "POST method required"}, status=405)

    try:
        policy = Policy.objects.get(slug=slug)
        if policy.status == Policy.Status.PUBLISHED:
            policy.status = Policy.Status.DRAFT
        else:
            policy.status = Policy.Status.PUBLISHED
        policy.save(update_fields=["status", "updated_at"])
        return JsonResponse({
            "status": "success",
            "slug": policy.slug,
            "new_status": policy.status,
            "is_published": policy.status == Policy.Status.PUBLISHED,
        })
    except Policy.DoesNotExist:
        return JsonResponse({"error": "Scheme not found"}, status=404)


@csrf_exempt
def admin_scheme_delete(request, slug):
    """Archive or delete a scheme."""
    if not (request.user.is_authenticated and request.user.is_staff):
        return JsonResponse({"error": "Unauthorized"}, status=403)
    if request.method != "POST":
        return JsonResponse({"error": "POST method required"}, status=405)

    try:
        policy = Policy.objects.get(slug=slug)
        policy.status = Policy.Status.ARCHIVED
        policy.save(update_fields=["status", "updated_at"])
        return JsonResponse({"status": "success", "message": f"Scheme '{policy.title}' archived."})
    except Policy.DoesNotExist:
        return JsonResponse({"error": "Scheme not found"}, status=404)


# ==============================================================================
# Admin Feedback Moderation API (Staff Only)
# ==============================================================================

def admin_feedback_api(request):
    """List recent feedback from database with moderation actions."""
    if not (request.user.is_authenticated and request.user.is_staff):
        return JsonResponse({"error": "Unauthorized: Staff credentials required"}, status=403)

    if request.method == "GET":
        qs = Feedback.objects.select_related("policy").all().order_by("-created_at")
        filter_flagged = request.GET.get("flagged")
        if filter_flagged == "true":
            qs = qs.filter(is_flagged=True)
        elif filter_flagged == "false":
            qs = qs.filter(is_flagged=False)

        try:
            limit = int(request.GET.get("limit", 50))
        except (ValueError, TypeError):
            limit = 50

        items = []
        for fb in qs[:limit]:
            items.append({
                "id": fb.id,
                "policy_title": fb.policy.title if fb.policy else "N/A",
                "policy_slug": fb.policy.slug if fb.policy else "",
                "rating": fb.rating,
                "comment": fb.comment,
                "role": fb.role,
                "duration_subject": fb.duration_subject,
                "clarity_rating": fb.clarity_rating,
                "ambiguity_notes": fb.ambiguity_notes,
                "operational_impact": fb.operational_impact,
                "perceived_fairness": fb.perceived_fairness,
                "unintended_consequences": fb.unintended_consequences,
                "proposed_modifications": fb.proposed_modifications,
                "overall_effectiveness": fb.overall_effectiveness,
                "applied_status": fb.applied_status,
                "sentiment": fb.sentiment,
                "confidence": fb.confidence,
                "is_flagged": fb.is_flagged,
                "created_at": fb.created_at.strftime("%Y-%m-%d %H:%M") if fb.created_at else "",
            })
        return JsonResponse({
            "total": qs.count(),
            "feedback": items,
        })
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def admin_feedback_action(request, fb_id):
    """Flag, unflag, or delete feedback."""
    if not (request.user.is_authenticated and request.user.is_staff):
        return JsonResponse({"error": "Unauthorized"}, status=403)
    if request.method != "POST":
        return JsonResponse({"error": "POST method required"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        data = request.POST

    action = data.get("action", "toggle_flag")
    try:
        fb = Feedback.objects.get(id=fb_id)
        if action == "toggle_flag":
            fb.is_flagged = not fb.is_flagged
            fb.save(update_fields=["is_flagged"])
            return JsonResponse({"status": "success", "id": fb.id, "is_flagged": fb.is_flagged})
        elif action == "delete":
            fb.delete()
            return JsonResponse({"status": "success", "message": "Feedback deleted"})
        return JsonResponse({"error": "Invalid action"}, status=400)
    except Feedback.DoesNotExist:
        return JsonResponse({"error": "Feedback not found"}, status=404)


# ==============================================================================
# Existing Dashboard Views
# ==============================================================================

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
