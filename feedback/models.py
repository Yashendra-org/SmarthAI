from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from policies.models import Policy


class Feedback(models.Model):
    class Sentiment(models.TextChoices):
        POSITIVE = "positive", "Positive"
        NEGATIVE = "negative", "Negative"
        NEUTRAL = "neutral", "Neutral"

    class AppliedStatus(models.TextChoices):
        APPLIED = "applied", "Yes, I applied"
        STARTED = "started", "Started but did not finish"
        NOT_APPLIED = "not_applied", "No, I have not applied"

    policy = models.ForeignKey(Policy, on_delete=models.CASCADE, related_name="feedbacks")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(max_length=2000)
    applied_status = models.CharField(max_length=12, choices=AppliedStatus.choices, blank=True)

    region = models.CharField(max_length=60, blank=True)
    age_group = models.CharField(max_length=10, blank=True)

    sentiment = models.CharField(max_length=10, choices=Sentiment.choices, blank=True)
    confidence = models.FloatField(null=True, blank=True)
    model_name = models.CharField(max_length=80, blank=True)

    is_sample = models.BooleanField(default=False)
    is_flagged = models.BooleanField(default=False)
    ip_hash = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["policy", "sentiment"])]

    def __str__(self):
        return f"{self.policy} ({self.rating}/5, {self.sentiment or 'unscored'})"
