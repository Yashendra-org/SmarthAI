import csv
import random
from pathlib import Path

from django.core.management.base import BaseCommand

from feedback.models import Feedback
from policies.models import Policy
from sentiment.services import get_engine


class Command(BaseCommand):
    help = "Create SAMPLE feedback (is_sample=True) from data/feedback_sample.csv, for demos and testing only."

    def add_arguments(self, parser):
        parser.add_argument("--file", default="data/feedback_sample.csv")
        parser.add_argument("--per-policy", type=int, default=12)

    def handle(self, *args, **opts):
        path = Path(opts["file"])
        if not path.exists():
            self.stderr.write(f"File not found: {path}")
            return
        with path.open(encoding="utf-8-sig", newline="") as f:
            samples = list(csv.DictReader(f))
        policies = Policy.objects.filter(status=Policy.Status.PUBLISHED)
        if not policies:
            self.stdout.write("No published policies yet. Load and publish policies first.")
            return
        engine = get_engine()
        total = 0
        for policy in policies:
            for i in range(opts["per_policy"]):
                row = samples[i % len(samples)]
                r = engine.analyze(row["comment"])
                Feedback.objects.create(
                    policy=policy, rating=int(row["rating"]), comment=row["comment"],
                    applied_status=row.get("applied_status", ""),
                    sentiment=r.label, confidence=r.confidence, model_name=r.model_name,
                    is_sample=True, ip_hash=f"sample-{random.randint(1, 10**6)}",
                )
                total += 1
        self.stdout.write(self.style.SUCCESS(f"Created {total} SAMPLE feedback entries (labelled is_sample)."))
