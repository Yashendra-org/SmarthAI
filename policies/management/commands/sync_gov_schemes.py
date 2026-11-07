from django.core.management.base import BaseCommand
from policies.ingestion.sync import run_scheme_sync


class Command(BaseCommand):
    help = "Automatically fetch, simplify (with Qwen/Gemini AI), and sync government schemes from API Setu, data.gov.in, MyGov, and official feeds."

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            default="all",
            choices=["all", "data_gov", "apisetu", "mygov", "feeds", "curated"],
            help="Government data source to fetch from.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=10,
            help="Maximum number of schemes to fetch per source.",
        )
        parser.add_argument(
            "--no-ai",
            action="store_true",
            help="Disable AI simplification and use raw text directly.",
        )
        parser.add_argument(
            "--draft",
            action="store_true",
            help="Save fetched schemes as draft instead of publishing automatically.",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("🚀 Starting Automated Government Scheme Ingestion..."))
        source = options["source"]
        limit = options["limit"]
        use_ai = not options["no_ai"]
        auto_publish = not options["draft"]

        res = run_scheme_sync(
            source_name=source,
            limit=limit,
            auto_publish=auto_publish,
            use_ai=use_ai,
        )

        for log in res.get("logs", []):
            self.stdout.write(f"  • {log}")

        self.stdout.write(
            self.style.SUCCESS(
                f"✅ Sync Complete: {res['created']} newly created, {res['updated']} updated. "
                f"Total active schemes in portal: {res['total_active']}"
            )
        )
