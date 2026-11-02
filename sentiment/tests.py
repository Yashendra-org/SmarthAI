from django.test import SimpleTestCase

from .evaluate import evaluate, load_test_set
from .lexicon_engine import LexiconEngine


class EvaluationTests(SimpleTestCase):
    def test_test_set_is_valid_and_large_enough(self):
        rows = load_test_set("data/hinglish_test_set.csv")
        self.assertGreaterEqual(len(rows), 50)
        self.assertEqual({r["label"] for r in rows}, {"positive", "negative", "neutral"})

    def test_evaluation_runs(self):
        rows = load_test_set("data/hinglish_test_set.csv")
        r = evaluate(LexiconEngine(), rows)
        self.assertEqual(r["n"], len(rows))
        self.assertTrue(0 <= r["accuracy"] <= 1)
        self.assertEqual(sum(sum(v.values()) for v in r["matrix"].values()), len(rows))
