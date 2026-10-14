import csv
from datetime import date
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from policies.models import Department, Policy, TargetGroup


class Command(BaseCommand):
    help = "Load policies from data/policies_seed.csv. Safe to re-run (updates by title)."

    def add_arguments(self, parser):
        parser.add_argument("--file", default="data/policies_seed.csv")
        parser.add_argument(
            "--publish-all", action="store_true",
            help="DEMO ONLY: publish every row, even without a verified date. Unverified policies show a warning banner.",
        )

    @transaction.atomic
    def handle(self, *args, **opts):
        path = Path(opts["file"])
        if not path.exists():
            self.stderr.write(f"File not found: {path}")
            return
        created = updated = 0
        with path.open(encoding="utf-8-sig", newline="") as f:
            for n, row in enumerate(csv.DictReader(f), start=2):
                title = (row.get("title") or "").strip()
                if not title:
                    continue
                dept, _ = Department.objects.get_or_create(name=(row.get("department") or "Unknown").strip())
                verified = (row.get("last_verified") or "").strip()
                official = (row.get("official_url") or "").strip()
                requested = (row.get("status") or "draft").strip().lower()

                # A policy can only be published if it has an official link and a verified date.
                status = requested if requested in Policy.Status.values else "draft"
                if opts["publish_all"] and status == "draft":
                    status = "published"
                elif status == "published" and not (official and verified):
                    self.stdout.write(self.style.WARNING(
                        f"Row {n} ({title}): missing official_url or last_verified, saved as draft."))
                    status = "draft"

                year = (row.get("launch_year") or "").strip()
                defaults = {
                    "department": dept,
                    "category": (row.get("category") or "other").strip(),
                    "level": (row.get("level") or "central").strip(),
                    "state": (row.get("state") or "").strip(),
                    "launch_year": int(year) if year.isdigit() else None,
                    "objective": (row.get("objective") or "").strip(),
                    "eligibility": (row.get("eligibility") or "").strip(),
                    "benefits": (row.get("benefits") or "").strip(),
                    "how_to_apply": (row.get("how_to_apply") or "").strip(),
                    "documents_required": (row.get("documents_required") or "").strip(),
                    "summary_en": (row.get("summary_en") or "").strip(),
                    "summary_hi": (row.get("summary_hi") or "").strip(),
                    "official_url": official,
                    "last_verified": date.fromisoformat(verified) if verified else None,
                    "verified_by": (row.get("verified_by") or "").strip(),
                    "status": status,
                }
                policy, was_created = Policy.objects.update_or_create(title=title, defaults=defaults)
                tags = [t.strip().lower() for t in (row.get("target_groups") or "").split(";") if t.strip()]
                policy.target_groups.set([TargetGroup.objects.get_or_create(name=t)[0] for t in tags])
                created += was_created
                updated += not was_created
        self.stdout.write(self.style.SUCCESS(f"Policies loaded: {created} created, {updated} updated."))
        if opts["publish_all"]:
            unverified = Policy.objects.filter(status="published", last_verified__isnull=True).count()
            self.stdout.write(self.style.WARNING(
                f"Demo mode: {unverified} published policies have no verified date. "
                "They show a warning banner. Verify them before a real launch."))
