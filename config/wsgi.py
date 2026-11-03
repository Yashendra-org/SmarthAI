import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
application = get_wsgi_application()

# ------------------------------------------------------------------------------
# Auto-bootstrap on deployment (Render / Cloud / Production)
# Ensures that on any fresh container boot, migrations are applied and policies
# are loaded and published so the site never shows "0 policies".
# ------------------------------------------------------------------------------
try:
    from django.core.management import call_command
    from django.db import connection
    from policies.models import Policy
    from accounts.models import User

    # 1. Apply any pending database migrations
    call_command("migrate", interactive=False)

    # 2. Ensure default admin superuser exists
    if not User.objects.filter(username="admin").exists():
        admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
        u = User.objects.create_superuser("admin", "admin@example.com", admin_pass)
        u.role = "admin"
        u.save()
        print(f"[SmarthAI Bootstrap] Created default admin superuser (admin / {admin_pass})")

    # 3. If no published policies exist, load seed policies and sample feedback
    if Policy.objects.filter(status=Policy.Status.PUBLISHED).count() == 0:
        print("[SmarthAI Bootstrap] Loading policy catalog with publish-all flag...")
        call_command("load_policies", "--publish-all")
        call_command("load_sample_feedback")
        print(f"[SmarthAI Bootstrap] Loaded {Policy.objects.filter(status=Policy.Status.PUBLISHED).count()} published policies successfully.")

except Exception as err:
    # Gracefully log without preventing WSGI server startup
    print(f"[SmarthAI Bootstrap Warning] Startup bootstrap check: {err}")
