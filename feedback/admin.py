from django.contrib import admin
from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ["policy", "rating", "sentiment", "confidence", "is_sample", "is_flagged", "created_at"]
    list_filter = ["sentiment", "is_sample", "is_flagged", "policy"]
    search_fields = ["comment"]
    actions = ["flag_selected", "unflag_selected"]

    @admin.action(description="Flag as spam or abusive (hidden from charts)")
    def flag_selected(self, request, queryset):
        queryset.update(is_flagged=True)

    @admin.action(description="Remove flag")
    def unflag_selected(self, request, queryset):
        queryset.update(is_flagged=False)
