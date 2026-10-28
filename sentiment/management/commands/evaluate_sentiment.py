from pathlib import Path

from django.core.management.base import BaseCommand

from sentiment.evaluate import evaluate, load_test_set, to_markdown


class Command(BaseCommand):
    help = "Measure sentiment engine accuracy on data/hinglish_test_set.csv. Use --engine all to compare."

    def add_arguments(self, parser):
        parser.add_argument("--file", default="data/hinglish_test_set.csv")
        parser.add_argument("--engine", default="lexicon", choices=["lexicon", "transformer", "all"])
        parser.add_argument("--write", action="store_true", help="Save docs/accuracy_report.md")

    def handle(self, *args, **opts):
        rows = load_test_set(opts["file"])
        names = ["lexicon", "transformer"] if opts["engine"] == "all" else [opts["engine"]]
        results = []
        for name in names:
            try:
                if name == "lexicon":
                    from sentiment.lexicon_engine import LexiconEngine
                    engine = LexiconEngine()
                else:
                    from sentiment.transformer_engine import TransformerEngine
                    engine = TransformerEngine()
            except Exception as exc:
                self.stderr.write(f"Skipping {name}: {exc}. Install with: pip install transformers torch")
                continue
            r = evaluate(engine, rows)
            results.append(r)
            self.stdout.write(f"{r['engine']}: accuracy {r['accuracy']:.0%}, macro F1 {r['macro_f1']:.2f} on {r['n']} comments")
        if results and opts["write"]:
            Path("docs").mkdir(exist_ok=True)
            Path("docs/accuracy_report.md").write_text(to_markdown(results, opts["file"]), encoding="utf-8")
            self.stdout.write(self.style.SUCCESS("Wrote docs/accuracy_report.md"))
