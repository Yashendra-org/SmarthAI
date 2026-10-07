from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """User model supporting Admin and future government roles (Officer, Head, Citizen)."""

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        OFFICER = "officer", "Department Officer"
        HEAD = "head", "Department Head"
        CITIZEN = "citizen", "Citizen"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.ADMIN)
