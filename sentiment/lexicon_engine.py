"""Lightweight fallback engine: word lists for English and Hinglish (Roman Hindi).

This is a starting point, NOT the final model. Member 3 should compare it against
pretrained models using data/hinglish_test_set.csv and report accuracy honestly.
"""
import re

from .base import BaseSentimentEngine, SentimentResult

POSITIVE = {
    "good", "great", "excellent", "helpful", "helped", "easy", "useful", "thanks", "thank",
    "benefit", "benefits", "benefited", "happy", "love", "best", "smooth", "fast", "simple", "improved",
    "accha", "acha", "achha", "badhiya", "behtareen", "shukriya", "dhanyavad", "madad", "fayda",
    "faydemand", "aasan", "asaan", "mast", "zabardast", "sahi", "khushi", "behtar",
}
NEGATIVE = {
    "bad", "worst", "poor", "slow", "difficult", "complicated", "confusing", "crash", "crashing",
    "crashed", "failed", "fail", "problem", "problems", "useless", "waste", "delay", "delayed",
    "corrupt", "rejected", "angry", "hate", "unfair", "pending", "stuck", "error", "harassment",
    "bekar", "kharab", "bura", "buri", "pareshani", "mushkil", "dikkat", "galat", "dhoka",
    "fraud", "rishwat", "nahi", "nahin", "band", "intezaar", "pareshan", "bakwas",
}
NEGATIONS = {"not", "no", "never", "nahi", "nahin", "na", "without"}

WORD_RE = re.compile(r"[a-zA-Z\u0900-\u097F']+")


class LexiconEngine(BaseSentimentEngine):
    name = "lexicon-v1"

    def analyze(self, text: str) -> SentimentResult:
        words = [w.lower() for w in WORD_RE.findall(text or "")]
        pos = neg = 0
        for i, w in enumerate(words):
            negated = i > 0 and words[i - 1] in NEGATIONS
            if w in POSITIVE:
                neg, pos = (neg + 1, pos) if negated else (neg, pos + 1)
            elif w in NEGATIVE and w not in NEGATIONS:
                pos, neg = (pos + 1, neg) if negated else (pos, neg + 1)
        total = pos + neg
        if total == 0:
            return SentimentResult("neutral", 0.5, self.name)
        if pos == neg:
            return SentimentResult("neutral", 0.5, self.name)
        label = "positive" if pos > neg else "negative"
        confidence = round(max(pos, neg) / total * min(1.0, 0.5 + 0.1 * total), 2)
        return SentimentResult(label, confidence, self.name)
