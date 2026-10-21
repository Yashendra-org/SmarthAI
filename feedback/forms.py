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
        fields = ["rating", "comment", "applied_status", "region", "age_group"]
        widgets = {
            "comment": forms.Textarea(attrs={"rows": 4, "maxlength": 2000}),
            "age_group": forms.Select(choices=[("", "Prefer not to say"), ("<18", "Under 18"), ("18-30", "18-30"),
                                               ("31-45", "31-45"), ("46-60", "46-60"), ("60+", "Over 60")]),
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
