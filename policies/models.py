from django.conf import settings
from django.db import models
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify


class Department(models.Model):
    name = models.CharField(max_length=200, unique=True)
    website = models.URLField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class TargetGroup(models.Model):
    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(max_length=70, unique=True, blank=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Policy(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    class Category(models.TextChoices):
        AGRICULTURE = "agriculture", "Agriculture"
        HEALTH = "health", "Health"
        EDUCATION = "education", "Education"
        HOUSING = "housing", "Housing"
        DIGITAL = "digital", "Digital & IT"
        SOCIAL = "social_welfare", "Social Welfare"
        FINANCE = "finance", "Finance"
        OTHER = "other", "Other"

    class Level(models.TextChoices):
        CENTRAL = "central", "Central"
        STATE = "state", "State"

    title = models.CharField(max_length=250)
    slug = models.SlugField(max_length=260, unique=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name="policies")
    category = models.CharField(max_length=20, choices=Category.choices)
    target_groups = models.ManyToManyField(TargetGroup, blank=True, related_name="policies")
    level = models.CharField(max_length=10, choices=Level.choices, default=Level.CENTRAL)
    state = models.CharField(max_length=60, blank=True)
    launch_year = models.PositiveIntegerField(null=True, blank=True)

    objective = models.CharField(max_length=300, blank=True)
    eligibility = models.TextField(blank=True)
    benefits = models.TextField(blank=True)
    how_to_apply = models.TextField(blank=True)
    documents_required = models.TextField(blank=True, help_text="One item per line or separated by ;")
    summary_en = models.TextField(blank=True)
    summary_hi = models.TextField(blank=True)

    official_url = models.URLField(blank=True)
    last_verified = models.DateField(null=True, blank=True)
    verified_by = models.CharField(max_length=100, blank=True)

    apply_clicks = models.PositiveIntegerField(default=0)

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="policies_created"
    )
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]
        verbose_name_plural = "policies"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:240] or "policy"
            slug, n = base, 2
            while Policy.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug, n = f"{base}-{n}", n + 1
            self.slug = slug
        if self.status == self.Status.PUBLISHED and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse("policies:detail", args=[self.slug])

    @property
    def document_list(self):
        raw = self.documents_required.replace(";", "\n")
        return [line.strip() for line in raw.splitlines() if line.strip()]

    def __str__(self):
        return self.title
