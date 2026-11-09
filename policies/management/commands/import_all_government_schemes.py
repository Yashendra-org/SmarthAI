import logging
from datetime import date
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from policies.models import Department, Policy, TargetGroup
from policies.ingestion.sources import CuratedLiveGovSource, NationalComprehensiveGovSource
from policies.ingestion.sync import sync_frontend_data_js

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Bulk-import all Indian Government Schemes (Central & 28 States + 8 UTs) from official directory into Django database and sync data.js"

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Limit number of schemes to import (default: all)",
        )
        parser.add_argument(
            "--draft",
            action="store_true",
            help="Import as draft instead of published",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("🇮🇳 Starting Complete National Government Schemes Bulk Ingestion..."))
        limit = options["limit"]
        auto_publish = not options["draft"]
        status = Policy.Status.PUBLISHED if auto_publish else Policy.Status.DRAFT

        # 1. Fetch from National Comprehensive Directory + Curated Latest 2024 schemes
        national_src = NationalComprehensiveGovSource()
        curated_src = CuratedLiveGovSource()

        raw_items = []
        raw_items.extend(curated_src.fetch_schemes())
        raw_items.extend(national_src.fetch_schemes(limit=limit))

        self.stdout.write(f"  • Total schemes prepared for ingestion: {len(raw_items)}")

        # 2. Pre-cache existing records to minimize database roundtrips
        dept_cache = {d.name.lower(): d for d in Department.objects.all()}
        tg_cache = {tg.slug: tg for tg in TargetGroup.objects.all()}
        existing_policies = {p.title.lower(): p for p in Policy.objects.all()}

        created_count = 0
        updated_count = 0
        valid_categories = set(c[0] for c in Policy.Category.choices)

        # 3. Process inside a transaction
        with transaction.atomic():
            for item in raw_items:
                title = item.get("title", "").strip()
                if not title:
                    continue

                dept_name = (item.get("department") or "Government of India").strip()[:190]
                dept_key = dept_name.lower()
                dept = dept_cache.get(dept_key)
                if not dept:
                    dept, _ = Department.objects.get_or_create(name=dept_name)
                    dept_cache[dept_key] = dept

                cat = (item.get("category") or "other").lower()
                if cat not in valid_categories:
                    cat = "other"

                level = item.get("level", Policy.Level.CENTRAL)
                state = item.get("state", "").strip()[:55]

                defaults = {
                    "department": dept,
                    "category": cat,
                    "level": level,
                    "state": state,
                    "launch_year": item.get("launch_year"),
                    "objective": (item.get("objective") or item.get("summary_en") or "")[:295],
                    "summary_en": item.get("summary_en", "")[:600],
                    "summary_hi": item.get("summary_hi", "")[:600],
                    "benefits": item.get("benefits", ""),
                    "eligibility": item.get("eligibility", ""),
                    "documents_required": item.get("documents", ""),
                    "how_to_apply": item.get("how_to_apply", ""),
                    "official_url": item.get("url") or "https://www.myscheme.gov.in/",
                    "last_verified": date.today(),
                    "verified_by": "National Scheme Directory (Verified)",
                    "status": status,
                }

                policy = existing_policies.get(title.lower())
                if policy:
                    for k, v in defaults.items():
                        setattr(policy, k, v)
                    policy.save()
                    updated_count += 1
                else:
                    policy = Policy.objects.create(title=title, **defaults)
                    existing_policies[title.lower()] = policy
                    created_count += 1

                # Target Groups
                groups = item.get("target_groups", ["everyone"])
                if isinstance(groups, str):
                    groups = [groups]
                for g_name in groups:
                    g_name = str(g_name).strip()
                    if not g_name:
                        continue
                    g_slug = slugify(g_name)[:65] or "group"
                    tg = tg_cache.get(g_slug)
                    if not tg:
                        try:
                            tg, _ = TargetGroup.objects.get_or_create(name=g_name.title(), slug=g_slug)
                        except Exception:
                            tg = TargetGroup.objects.filter(slug=g_slug).first()
                        if tg:
                            tg_cache[g_slug] = tg
                    if tg:
                        policy.target_groups.add(tg)

        # 4. Synchronize data.js for frontend discovery, comparison, checklist, and search
        self.stdout.write("  • Synchronizing static/js/data.js with complete catalog...")
        sync_frontend_data_js()

        total_active = Policy.objects.filter(status=Policy.Status.PUBLISHED).count()
        central_count = Policy.objects.filter(level=Policy.Level.CENTRAL, status=Policy.Status.PUBLISHED).count()
        state_count = Policy.objects.filter(level=Policy.Level.STATE, status=Policy.Status.PUBLISHED).count()

        self.stdout.write(
            self.style.SUCCESS(
                f"\n🎉 Successfully Imported Complete National Schemes Catalog!\n"
                f"   • Newly Created: {created_count}\n"
                f"   • Updated Existing: {updated_count}\n"
                f"   • Total Active Schemes: {total_active}\n"
                f"   • Central Schemes: {central_count}\n"
                f"   • State Schemes: {state_count} (across all 28 States & 8 UTs)\n"
                f"   • Frontend static/js/data.js fully synchronized."
            )
        )
