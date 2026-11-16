from django import forms

from .models import Feedback


class FeedbackForm(forms.ModelForm):
    # honeypot: real users never see or fill this, bots usually do
    website = forms.CharField(required=False, widget=forms.TextInput(attrs={"tabindex": "-1", "autocomplete": "off"}))
    rating = forms.TypedChoiceField(
        choices=[(i, str(i)) for i in range(5, 0, -1)], coerce=int, widget=forms.RadioSelect
    )
    applied_status = forms.ChoiceField(
        choices=[("", "Prefer not to say")] + Feedback.AppliedStatus.choices, required=False
    )

    class Meta:
        model = Feedback
        fields = [
            "rating",
            "comment",
            "applied_status",
            "region",
            "age_group",
            "role",
            "duration_subject",
            "clarity_rating",
            "ambiguity_notes",
            "operational_impact",
            "perceived_fairness",
            "unintended_consequences",
            "proposed_modifications",
            "overall_effectiveness",
        ]
        widgets = {
            "comment": forms.Textarea(attrs={"rows": 4, "maxlength": 2000, "placeholder": "Share your experience with this policy..."}),
            "age_group": forms.Select(choices=[("", "Prefer not to say"), ("<18", "Under 18"), ("18-30", "18-30"),
                                               ("31-45", "31-45"), ("46-60", "46-60"), ("60+", "Over 60")]),
            "ambiguity_notes": forms.Textarea(attrs={"rows": 2, "placeholder": "Any confusing or contradictory clauses..."}),
            "operational_impact": forms.Textarea(attrs={"rows": 2, "placeholder": "Did it make your daily life/workflow easier or harder? Why?"}),
            "unintended_consequences": forms.Textarea(attrs={"rows": 2, "placeholder": "Unexpected roadblocks, delays, or friction..."}),
            "proposed_modifications": forms.Textarea(attrs={"rows": 2, "placeholder": "If you could change/add one thing, what would it be?"}),
        }

    def clean_comment(self):
        text = self.cleaned_data["comment"].strip()
        if len(text) < 5:
            raise forms.ValidationError("Please write at least a few words.")
        return text

    def clean_website(self):
        if self.cleaned_data.get("website"):
            raise forms.ValidationError("Spam detected.")
        return ""
