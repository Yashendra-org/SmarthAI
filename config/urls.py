import json
import os
from django.conf import settings
from django.contrib import admin
from django.http import Http404, JsonResponse
from django.shortcuts import render
from django.urls import include, path, re_path
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.base import RedirectView
from django.views.static import serve
from policies.chat_service import ask_smarth_ai, generate_deep_policy_breakdown
from policies.ingestion.sync import run_scheme_sync
from policies.models import Policy


@csrf_exempt
def chat_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST method required"}, status=405)
    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        data = request.POST

    prompt = (data.get("prompt") or data.get("message") or "").strip()
    history = data.get("history", [])

    if not prompt:
        return JsonResponse({"error": "Prompt is required"}, status=400)

    result = ask_smarth_ai(prompt, history=history)
    return JsonResponse(result)


@csrf_exempt
def sync_schemes_api(request):
    if request.method == "GET":
        total = Policy.objects.count()
        published = Policy.objects.filter(status=Policy.Status.PUBLISHED).count()
        return JsonResponse({
            "total_schemes": total,
            "published": published,
            "sources": [
                {"id": "national", "name": "National Directory (All 1,800+ Official Central & State Schemes)"},
                {"id": "curated", "name": "Verified Ministry Schemes (Live Feed)"},
                {"id": "data_gov", "name": "Open Government Data (data.gov.in)"},
                {"id": "apisetu", "name": "API Setu – myScheme (apisetu.gov.in)"},
                {"id": "mygov", "name": "MyGov Developer APIs (developers.mygov.in)"},
                {"id": "feeds", "name": "PIB & Ministry Feeds (pib.gov.in)"},
                {"id": "all", "name": "All Government Sources"},
            ],
        })

    if request.method != "POST":
        return JsonResponse({"error": "GET or POST method required"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        data = request.POST

    source = data.get("source", "all")
    try:
        limit = int(data.get("limit", 10))
    except (ValueError, TypeError):
        limit = 10
    use_ai = bool(data.get("use_ai", True))
    credentials = data.get("credentials") or {}

    try:
        result = run_scheme_sync(
            source_name=source,
            limit=limit,
            auto_publish=True,
            use_ai=use_ai,
            credentials=credentials,
        )
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({"status": "error", "error": str(e)}, status=500)


def scheme_detail_api(request, slug):
    try:
        policy = Policy.objects.select_related("department").prefetch_related("target_groups").get(slug=slug)
        docs = [d.strip() for d in policy.documents_required.replace(";", "\n").splitlines() if d.strip()]
        elig = [e.strip() for e in policy.eligibility.replace(";", "\n").splitlines() if e.strip()]
        return JsonResponse({
            "id": policy.slug,
            "title": policy.title,
            "department": policy.department.name,
            "category": policy.get_category_display(),
            "level": policy.get_level_display(),
            "state": policy.state,
            "objective": policy.objective,
            "summary_en": policy.summary_en,
            "summary_hi": policy.summary_hi,
            "benefits": policy.benefits,
            "eligibility": elig,
            "documents_required": docs,
            "how_to_apply": policy.how_to_apply,
            "official_url": policy.official_url,
            "last_verified": str(policy.last_verified) if policy.last_verified else None,
            "target_groups": [tg.name for tg in policy.target_groups.all()],
        })
    except Policy.DoesNotExist:
        return JsonResponse({"error": "Scheme not found"}, status=404)


def scheme_breakdown_api(request, slug):
    policy = Policy.objects.filter(slug=slug).first()
    if policy:
        data = generate_deep_policy_breakdown(policy)
        return JsonResponse({"status": "success", "slug": policy.slug, "title": policy.title, "breakdown": data})
    return JsonResponse({"error": "Scheme not found"}, status=404)


def render_frontend_page(request, page="index"):
    template_name = f"{page}.html"
    template_path = settings.BASE_DIR / "templates" / template_name
    if os.path.exists(template_path):
        return render(request, template_name)
    raise Http404(f"Page {template_name} not found")


def serve_static_fallback(request, path=""):
    resp = serve(request, path, document_root=settings.BASE_DIR / "static")
    if request.path.endswith((".css", ".js", ".jpg", ".png", ".svg", ".ico")):
        resp["Cache-Control"] = "public, max-age=86400"
    return resp


urlpatterns = [
    path("favicon.ico", RedirectView.as_view(url="/static/img/favicon.svg", permanent=True)),
    path("admin/", admin.site.urls),

    # AI Chatbot API Endpoint (Groq Qwen, Ollama, Gemini)
    path("api/chat/", chat_api, name="chat_api"),

    # Automated Government Schemes Ingestion & Sync API
    path("api/schemes/sync/", sync_schemes_api, name="sync_schemes_api"),

    # High-Performance On-Demand Scheme Detail API
    path("api/schemes/<slug:slug>/", scheme_detail_api, name="scheme_detail_api"),
    path("api/schemes/<slug:slug>/breakdown/", scheme_breakdown_api, name="scheme_breakdown_api"),

    # Root renders the new frontend home
    path("", lambda req: render_frontend_page(req, "index"), name="home"),

    # Direct .html page routes (e.g. /eligibility.html, /schemes.html, /assistant.html)
    path("<str:page>.html", render_frontend_page),

    # Support /frontend/ prefix as well
    path("frontend/", lambda req: render_frontend_page(req, "index")),
    path("frontend/<str:page>.html", render_frontend_page),

    # Static fallbacks for relative assets like css/style.css, js/app.js, assets/...
    re_path(r"^(?P<path>(css|js|img|assets)/.*)$", serve_static_fallback),
    re_path(r"^frontend/(?P<path>(css|js|img|assets)/.*)$", serve_static_fallback),

    # Existing Django apps
    path("", include("policies.urls")),
    path("feedback/", include("feedback.urls")),
    path("dashboard/", include("dashboard.urls")),
]
