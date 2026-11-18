import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = "Auto-creates default superuser/admin if it does not already exist"

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "admin")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "admin123")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@smarthai.gov.in")

        user, created = User.objects.get_or_create(username=username, defaults={"email": email, "is_staff": True, "is_superuser": True})
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()
        if created:
            self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' created successfully."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' updated successfully."))
