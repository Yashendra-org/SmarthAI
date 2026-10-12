from django.contrib import admin
from .models import Department, Policy, TargetGroup


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    search_fields = ["name"]


@admin.register(TargetGroup)
class TargetGroupAdmin(admin.ModelAdmin):
    search_fields = ["name"]


@admin.register(Policy)
class PolicyAdmin(admin.ModelAdmin):
    list_display = ["title", "department", "category", "status", "last_verified", "apply_clicks"]
    list_filter = ["status", "category", "level", "department"]
    search_fields = ["title", "objective", "summary_en"]
    filter_horizontal = ["target_groups"]
    readonly_fields = ["apply_clicks", "published_at", "created_at", "updated_at"]
    actions = ["publish_selected", "archive_selected"]

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    @admin.action(description="Publish selected (only if verified date and official link exist)")
    def publish_selected(self, request, queryset):
        ok = queryset.exclude(official_url="").exclude(last_verified__isnull=True)
        skipped = queryset.count() - ok.count()
        for p in ok:
            p.status = Policy.Status.PUBLISHED
            p.save()
        self.message_user(request, f"Published {ok.count()}. Skipped {skipped} missing official link or verified date.")

    @admin.action(description="Archive selected")
    def archive_selected(self, request, queryset):
        queryset.update(status=Policy.Status.ARCHIVED)
