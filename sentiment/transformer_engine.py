"""Pretrained multilingual engine (optional, needs: pip install transformers torch).

The model below is a CANDIDATE to be tested on the Hinglish test set, not a final choice.
"""
from .base import BaseSentimentEngine, SentimentResult

MODEL_ID = "cardiffnlp/twitter-xlm-roberta-base-sentiment"


class TransformerEngine(BaseSentimentEngine):
    name = f"transformer:{MODEL_ID}"

    def __init__(self):
        from transformers import pipeline  # imported lazily so the app runs without it
        self._pipe = pipeline("sentiment-analysis", model=MODEL_ID, truncation=True, max_length=256)

    def analyze(self, text: str) -> SentimentResult:
        out = self._pipe(text[:1000])[0]
        label = out["label"].lower()
        if label not in {"positive", "negative", "neutral"}:
            label = "neutral"
        return SentimentResult(label, round(float(out["score"]), 2), self.name)
