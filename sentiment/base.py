from dataclasses import dataclass


@dataclass
class SentimentResult:
    label: str          # "positive" | "negative" | "neutral"
    confidence: float   # 0.0 to 1.0
    model_name: str


class BaseSentimentEngine:
    """Every engine implements analyze(). The rest of the app only calls get_engine().analyze(text)."""

    name = "base"

    def analyze(self, text: str) -> SentimentResult:
        raise NotImplementedError
