from datetime import date

from django.test import TestCase, override_settings
from django.urls import reverse

from feedback.models import Feedback
from feedback.services import sentiment_summary
from policies.models import Department, Policy
from sentiment.lexicon_engine import LexiconEngine


def make_policy(**kw):
    dept, _ = Department.objects.get_or_create(name="Test Dept")
    defaults = dict(title="Test Scheme", department=dept, category="health", status="published",
                    official_url="https://example.gov.in", last_verified=date.today(), summary_en="Simple summary.")
    defaults.update(kw)
    return Policy.objects.create(**defaults)


class SentimentTests(TestCase):
    def test_labels(self):
        e = LexiconEngine()
        self.assertEqual(e.analyze("This scheme helped my family, very good").label, "positive")
        self.assertEqual(e.analyze("Website keeps crashing, very bad").label, "negative")
        self.assertEqual(e.analyze("It was announced in March").label, "neutral")
        self.assertEqual(e.analyze("Bahut accha scheme hai").label, "positive")
        self.assertEqual(e.analyze("Portal bekar hai").label, "negative")
        self.assertEqual(e.analyze("not good").label, "negative")


class PublicPageTests(TestCase):
    def setUp(self):
        self.p = make_policy()

    def test_pages_load(self):
        for name, args in [
            ("policies:home", []),
            ("policies:list", []),
            ("policies:detail", [self.p.slug]),
            ("policies:how_sentiment", []),
            ("policies:about", []),
            ("policies:disclaimer", []),
        ]:
            self.assertEqual(self.client.get(reverse(name, args=args)).status_code, 200)

    def test_draft_hidden(self):
        d = make_policy(title="Hidden Draft", status="draft")
        self.assertEqual(self.client.get(d.get_absolute_url()).status_code, 404)

    def test_search_and_filter(self):
        r = self.client.get(reverse("policies:list"), {"q": "Test"})
        self.assertContains(r, "Test Scheme")
        r = self.client.get(reverse("policies:list"), {"category": "housing"})
        self.assertNotContains(r, "Test Scheme")

    def test_state_filter(self):
        p_up = make_policy(title="UP Scheme", state="Uttar Pradesh")
        p_mp = make_policy(title="MP Scheme", state="Madhya Pradesh")
        r = self.client.get(reverse("policies:list"), {"state": "Uttar Pradesh"})
        self.assertContains(r, "UP Scheme")
        self.assertNotContains(r, "MP Scheme")

    def test_hindi_summary_display(self):
        p_hi = make_policy(title="Hindi Scheme", summary_hi="यह एक सरल सारांश है।")
        r = self.client.get(p_hi.get_absolute_url())
        self.assertContains(r, "यह एक सरल सारांश है।")

    def test_apply_click_counted(self):
        r = self.client.get(reverse("policies:apply", args=[self.p.slug]))
        self.assertEqual(r.status_code, 302)
        self.p.refresh_from_db()
        self.assertEqual(self.p.apply_clicks, 1)


class FeedbackTests(TestCase):
    def setUp(self):
        self.p = make_policy()
        self.url = reverse("feedback:submit", args=[self.p.slug])

    def post(self, **extra):
        data = {"rating": 5, "comment": "This scheme helped my family, very good", "applied_status": "applied"}
        data.update(extra)
        return self.client.post(self.url, data)

    def test_feedback_scored(self):
        self.post()
        fb = Feedback.objects.get()
        self.assertEqual(fb.sentiment, "positive")
        self.assertTrue(fb.model_name)

    def test_honeypot_blocks_bots(self):
        self.post(website="http://spam.example")
        self.assertEqual(Feedback.objects.count(), 0)

    def test_rate_limit(self):
        for _ in range(8):
            self.post()
        self.assertEqual(Feedback.objects.count(), 5)

    def test_chart_threshold_and_flagged_excluded(self):
        self.assertFalse(sentiment_summary(self.p)["show_chart"])
        for i in range(10):
            Feedback.objects.create(policy=self.p, rating=4, comment="good", sentiment="positive", ip_hash=f"x{i}")
        self.assertTrue(sentiment_summary(self.p)["show_chart"])
        Feedback.objects.filter(ip_hash="x0").update(is_flagged=True)
        self.assertFalse(sentiment_summary(self.p)["show_chart"])


class DashboardTests(TestCase):
    def test_requires_staff(self):
        r = self.client.get(reverse("dashboard:overview"))
        self.assertEqual(r.status_code, 302)
        r_csv = self.client.get(reverse("dashboard:export_csv"))
        self.assertEqual(r_csv.status_code, 302)

    def test_csv_export_as_staff(self):
        from accounts.models import User
        staff_user = User.objects.create_user(username="staff", password="password123", is_staff=True)
        self.client.login(username="staff", password="password123")
        r = self.client.get(reverse("dashboard:export_csv"))
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r["Content-Type"], "text/csv")
        self.assertIn("attachment; filename=\"feedback_export.csv\"", r["Content-Disposition"])


class PublishAllTests(TestCase):
    def test_publish_all_flag_and_banner(self):
        from django.core.management import call_command
        from io import StringIO
        call_command("load_policies", "--publish-all", stdout=StringIO())
        self.assertEqual(Policy.objects.filter(status="published").count(), Policy.objects.count())
        unverified = Policy.objects.filter(last_verified__isnull=True).first()
        if not unverified:
            dept, _ = Department.objects.get_or_create(name="Test Dept")
            unverified = Policy.objects.create(
                title="Unverified Test Policy",
                department=dept,
                category="other",
                status="published",
                official_url="https://example.gov.in",
                last_verified=None,
                summary_en="Summary for unverified policy",
            )
        r = self.client.get(unverified.get_absolute_url())
        self.assertContains(r, "Details are still being checked")
        self.assertContains(r, "Visit the official website")
        verified = Policy.objects.exclude(last_verified=None).first()
        r = self.client.get(verified.get_absolute_url())
        self.assertNotContains(r, "Details are still being checked")

    def test_default_load_keeps_unverified_as_draft(self):
        from django.core.management import call_command
        from io import StringIO
        call_command("load_policies", stdout=StringIO())
        self.assertEqual(Policy.objects.filter(status="published").count(), 0)
