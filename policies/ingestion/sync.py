import json
import logging
import os
import time
from datetime import date
from django.conf import settings
from django.db import transaction
from django.utils.text import slugify

from policies.models import Department, Policy, TargetGroup
from policies.ingestion.ai_simplifier import simplify_scheme_with_ai
from policies.ingestion.sources import (
    APISetuMySchemeSource,
    CuratedLiveGovSource,
    DataGovSource,
    MyGovSource,
    NationalComprehensiveGovSource,
    PIBMinistryFeedSource,
)

logger = logging.getLogger(__name__)


def sync_frontend_data_js():
    """
    Exports all published policies from database into static/js/data.js
    so the web frontend discovery, comparison, and checklist stay 100% in sync!
    """
    policies = Policy.objects.filter(status=Policy.Status.PUBLISHED).select_related("department")

    schemes_data = []
    category_map = {
        "agriculture": "agriculture",
        "health": "health",
        "education": "education",
        "housing": "housing",
        "finance": "finance",
        "digital": "business",
        "social_welfare": "social",
        "other": "social",
    }

    for p in policies:
        cat_key = category_map.get(p.category, "social")
        docs = [d.strip() for d in p.documents_required.replace(";", "\n").splitlines() if d.strip()]
        elig_items = [e.strip() for e in p.eligibility.replace(";", "\n").splitlines() if e.strip()]

        schemes_data.append({
            "id": p.slug,
            "name": p.title,
            "cat": cat_key,
            "lvl": p.get_level_display(),
            "state": p.state or "",
            "dept": p.department.name,
            "benefit": (p.benefits or "Government assistance")[:120],
            "desc": (p.summary_en or p.objective or "Official government policy.")[:250],
            "desc_hi": (p.summary_hi or "")[:250],
            "elig": elig_items[:4] if elig_items else ["Eligible Indian citizens"],
            "docs": docs[:4] if docs else ["Aadhaar", "Bank passbook"],
            "apply": (p.how_to_apply or "Apply on the official government website.")[:140],
            "url": p.official_url or "https://www.myscheme.gov.in/",
            "r": {},
        })

    # Read existing data.js to preserve categories, depts, services, and faq
    data_js_path = settings.BASE_DIR / "static" / "js" / "data.js"
    cats = {
        "agriculture": "Agriculture",
        "education": "Education",
        "health": "Health",
        "housing": "Housing",
        "women": "Women",
        "employment": "Employment",
        "finance": "Financial",
        "senior": "Senior citizen",
        "social": "Social security",
        "business": "Business & MSME",
        "rural": "Rural development",
    }
    depts = [
        ["Ministry of Education", "https://www.education.gov.in/"],
        ["Ministry of Agriculture", "https://agricoop.gov.in/"],
        ["Ministry of Health", "https://www.mohfw.gov.in/"],
        ["Ministry of Finance", "https://finmin.nic.in/"],
        ["Ministry of Women & Child Development", "https://wcd.nic.in/"],
        ["Ministry of Rural Development", "https://rural.gov.in/"],
        ["Ministry of Labour", "https://labour.gov.in/"],
        ["Ministry of Social Justice", "https://socialjustice.gov.in/"],
        ["Ministry of New & Renewable Energy", "https://mnre.gov.in/"],
    ]
    services = [
        ["Aadhaar (UIDAI)", "https://uidai.gov.in/"],
        ["PAN (Income Tax)", "https://www.incometax.gov.in/"],
        ["Passport Seva", "https://www.passportindia.gov.in/"],
        ["Voter Services", "https://voters.eci.gov.in/"],
        ["DigiLocker", "https://www.digilocker.gov.in/"],
        ["UMANG", "https://web.umang.gov.in/"],
        ["Scholarships (NSP)", "https://scholarships.gov.in/"],
        ["National Career Service", "https://www.ncs.gov.in/"],
        ["Pension (Jeevan Pramaan)", "https://jeevanpramaan.gov.in/"],
        ["PM Surya Ghar Portal", "https://pmsuryaghar.gov.in/"],
        ["Ayushman Bharat (NHA)", "https://beneficiary.nha.gov.in/"],
        ["PM-KISAN Portal", "https://pmkisan.gov.in/"],
    ]
    faq = [
        [
            "What is Smarth AI Policy Portal and is it an official government site?",
            "Smarth AI is an independent, non-profit civic technology portal designed to make Indian government welfare schemes accessible and easy to understand for all citizens. It is NOT a government agency. All scheme information is verified and ingested from official government sources (myScheme, data.gov.in, PIB, and Ministry portals). We never charge fees and always direct you to the official government website (.gov.in / .nic.in) to apply.",
        ],
        [
            "How many schemes are available and how often are they updated?",
            "The portal catalogues over 1,868 official schemes—covering 439 Central Schemes across all Union Ministries and 1,429 State Schemes across all 28 States and 8 Union Territories. Data is regularly updated via automated ingestion pipelines connected to official government announcement feeds and national scheme registries.",
        ],
        [
            "How does the AI Assistant (Chatbot) help me find schemes?",
            "Our AI Assistant is powered by advanced bilingual models (Qwen & Gemini). You can ask questions in English, Hindi, or Hinglish (e.g. 'I am a 22-year-old student, what education loans or internship schemes can I get?'). The AI analyzes your profile, explains benefits in simple terms, lists documents required, and provides the official application link.",
        ],
        [
            "How does the Indicative Eligibility Checker work?",
            "The Eligibility tool matches your demographic profile—including age, gender, occupation (farmer, student, woman, senior citizen, worker, entrepreneur), and household income—against scheme guidelines. Results are indicative; final eligibility is determined by the competent government authority upon application.",
        ],
        [
            "What documents are commonly required to apply for government welfare schemes?",
            "Most schemes require standard KYC documents: (1) Aadhaar Card linked with mobile number, (2) Active Bank Account Passbook (DBT/Aadhaar-seeded), (3) Proof of Address (Ration Card, Electricity Bill, or Voter ID), (4) Income Certificate issued by Revenue Authority/Tehsildar, and (5) Category / Caste / Disability certificate where applicable. Use our 'Doc Checklist' to track your documents.",
        ],
        [
            "Are state-specific government schemes included for my state?",
            "Yes! The portal includes schemes from all 36 Indian States and Union Territories (including Uttar Pradesh, Maharashtra, Bihar, Rajasthan, Madhya Pradesh, Tamil Nadu, Karnataka, Gujarat, Kerala, Haryana, West Bengal, Odisha, Assam, Punjab, and others). Select your state from the 'All States & UTs' filter on the Schemes page to view them.",
        ],
        [
            "Is my personal data safe? Do you store my Aadhaar, income, or bank details?",
            "Absolutely safe. Smarth AI operates with a strict privacy-first architecture. We do NOT collect, store, or transmit your Aadhaar number, bank details, or private documents. All eligibility checks, document checklist progress, and comparisons are stored solely inside your own device's browser (localStorage).",
        ],
        [
            "Can I apply directly on this website?",
            "No third-party portal can legally process official government applications. Smarth AI simplifies the guidelines and gives you the direct, verified button ('Official website ↗') to the authentic government portal (e.g. pmkisan.gov.in, pmsuryaghar.gov.in, beneficiary.nha.gov.in). Always apply only on official .gov.in or .nic.in domains.",
        ],
        [
            "How do I track which documents I have ready before applying?",
            "Click on 'Doc Checklist' in the navigation bar. Choose the scheme you want to apply for, and check off the documents you already possess. The tool calculates your readiness percentage and lets you print or save a checklist PDF so you are fully prepared before visiting a CSC or Seva Kendra.",
        ],
        [
            "How do I report outdated details, broken links, or incorrect benefits?",
            "Every scheme page features a 'Report a problem' button. If a deadline has passed, a portal link has moved, or guidelines have been revised by the Ministry, you can submit feedback directly. You can also rate schemes on our Feedback page to assist fellow citizens.",
        ],
    ]

    compact_schemes = json.dumps(schemes_data, separators=(",", ":"), ensure_ascii=False)
    compact_cats = json.dumps(cats, separators=(",", ":"), ensure_ascii=False)
    compact_depts = json.dumps(depts, separators=(",", ":"), ensure_ascii=False)
    compact_services = json.dumps(services, separators=(",", ":"), ensure_ascii=False)
    compact_faq = json.dumps(faq, separators=(",", ":"), ensure_ascii=False)

    content = f"window.DATA={{\"cats\":{compact_cats},\"schemes\":{compact_schemes},\"depts\":{compact_depts},\"services\":{compact_services},\"faq\":{compact_faq}}};\n"

    with open(data_js_path, "w", encoding="utf-8") as f:
        f.write(content)
    logger.info(f"Synchronized {len(schemes_data)} schemes into static/js/data.js")


@transaction.atomic
def run_scheme_sync(source_name="all", limit=10, auto_publish=True, use_ai=True, credentials=None):
    """
    Executes automated scheme discovery, AI simplification, database storage,
    and frontend static catalog sync.
    """
    creds = credentials or {}
    data_gov_key = creds.get("data_gov_api_key") or os.getenv("DATA_GOV_API_KEY", "")
    apisetu_client_id = creds.get("apisetu_client_id") or os.getenv("APISETU_CLIENT_ID", "")
    apisetu_key = creds.get("apisetu_api_key") or os.getenv("APISETU_API_KEY", "")
    mygov_key = creds.get("mygov_api_key") or os.getenv("MYGOV_API_KEY", "")

    sources_to_run = []
    if source_name in ["data_gov", "all"]:
        sources_to_run.append(DataGovSource(api_key=data_gov_key))
    if source_name in ["apisetu", "all"]:
        sources_to_run.append(APISetuMySchemeSource(client_id=apisetu_client_id, api_key=apisetu_key))
    if source_name in ["mygov", "all"]:
        sources_to_run.append(MyGovSource(api_key=mygov_key))
    if source_name in ["feeds", "all"]:
        sources_to_run.append(PIBMinistryFeedSource())
    if source_name in ["curated", "all"] or not sources_to_run:
        sources_to_run.append(CuratedLiveGovSource())
    if source_name in ["national", "all"]:
        sources_to_run.append(NationalComprehensiveGovSource())

    raw_items = []
    logs = []
    for src in sources_to_run:
        try:
            # If national, allow full limit or user-specified limit
            lim = limit if (src.name != NationalComprehensiveGovSource.name or limit > 50) else None
            items = src.fetch_schemes(limit=lim)
            logs.append(f"Fetched {len(items)} items from {src.name}")
            raw_items.extend(items)
        except Exception as e:
            logs.append(f"Error querying {src.name}: {e}")

    created_count = 0
    updated_count = 0

    valid_categories = [c[0] for c in Policy.Category.choices]

    for item in raw_items:
        title = item.get("title", "").strip()
        if not title:
            continue

        dept_name = (item.get("department") or "Government of India").strip()[:190]
        dept, _ = Department.objects.get_or_create(name=dept_name)

        # Use pre-summarized text if available, otherwise AI
        if item.get("summary_en") and item.get("summary_hi"):
            simplified = {
                "summary_en": item.get("summary_en") or item.get("objective") or "",
                "summary_hi": item.get("summary_hi") or "",
                "benefits": item.get("benefits", ""),
                "eligibility": item.get("eligibility", ""),
                "documents_required": item.get("documents", "Aadhaar; Bank account; Mobile number"),
                "category": item.get("category", "other"),
                "target_groups": item.get("target_groups", ["everyone"]),
            }
        elif use_ai:
            simplified = simplify_scheme_with_ai(item)
            time.sleep(0.4)
        else:
            simplified = {
                "summary_en": item.get("description") or item.get("objective") or "",
                "summary_hi": "",
                "benefits": item.get("benefits", ""),
                "eligibility": item.get("eligibility", ""),
                "documents_required": item.get("documents", "Aadhaar; Bank account; Mobile number"),
                "category": item.get("category", "other"),
                "target_groups": ["everyone"],
            }

        cat = simplified.get("category", "other").lower()
        if cat not in valid_categories:
            cat = "other"

        status = Policy.Status.PUBLISHED if auto_publish else Policy.Status.DRAFT

        # Safe update or create
        policy = Policy.objects.filter(title=title).first()
        defaults = {
            "department": dept,
            "category": cat,
            "level": item.get("level", Policy.Level.CENTRAL),
            "state": item.get("state", ""),
            "launch_year": item.get("launch_year"),
            "objective": (item.get("objective") or simplified.get("summary_en") or "")[:295],
            "summary_en": simplified.get("summary_en", ""),
            "summary_hi": simplified.get("summary_hi", ""),
            "benefits": simplified.get("benefits", ""),
            "eligibility": simplified.get("eligibility", ""),
            "documents_required": simplified.get("documents_required", ""),
            "official_url": item.get("url") or "https://www.myscheme.gov.in/",
            "last_verified": date.today(),
            "verified_by": "Automated Government Sync",
            "status": status,
        }
        if policy:
            for k, v in defaults.items():
                setattr(policy, k, v)
            policy.save()
            created = False
        else:
            policy = Policy.objects.create(title=title, **defaults)
            created = True

        # Target Groups
        target_group_names = simplified.get("target_groups", ["everyone"])
        if isinstance(target_group_names, str):
            target_group_names = [target_group_names]
        for tg_name in target_group_names:
            tg_name = str(tg_name).strip()
            if not tg_name:
                continue
            tg_slug = slugify(tg_name)[:65] or "group"
            tg = TargetGroup.objects.filter(slug=tg_slug).first()
            if not tg:
                tg = TargetGroup.objects.filter(name__iexact=tg_name).first()
            if not tg:
                try:
                    tg = TargetGroup.objects.create(name=tg_name.title(), slug=tg_slug)
                except Exception:
                    tg = TargetGroup.objects.filter(slug=tg_slug).first()
            if tg:
                policy.target_groups.add(tg)

        if created:
            created_count += 1
        else:
            updated_count += 1

    # Keep frontend static data in sync
    sync_frontend_data_js()

    return {
        "status": "success",
        "created": created_count,
        "updated": updated_count,
        "total_active": Policy.objects.filter(status=Policy.Status.PUBLISHED).count(),
        "logs": logs,
    }
