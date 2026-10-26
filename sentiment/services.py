from django.conf import settings

_engine = None


def get_engine():
    """Return the engine chosen by SENTIMENT_ENGINE (.env). Falls back to lexicon if the model can't load."""
    global _engine
    if _engine is None:
        choice = getattr(settings, "SENTIMENT_ENGINE", "lexicon")
        if choice == "transformer":
            try:
                from .transformer_engine import TransformerEngine
                _engine = TransformerEngine()
            except Exception:
                from .lexicon_engine import LexiconEngine
                _engine = LexiconEngine()
        else:
            from .lexicon_engine import LexiconEngine
            _engine = LexiconEngine()
    return _engine
