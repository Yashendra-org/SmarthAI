#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> Step 1: Upgrading pip and installing requirements..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Step 2: Collecting static files for frontend..."
python manage.py collectstatic --noinput

echo "==> Step 3: Running database migrations..."
python manage.py migrate --noinput

echo "==> Step 4: Ensuring initial admin superuser exists..."
python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from accounts.models import User
if not User.objects.filter(username='admin').exists():
    pwd = os.getenv('ADMIN_PASSWORD', 'admin123')
    u = User.objects.create_superuser('admin', 'admin@example.com', pwd)
    u.role = 'admin'
    u.save()
    print('Created default admin superuser (admin / ' + pwd + ')')
else:
    print('Admin superuser already exists.')
"

echo "==> Step 5: Loading policy catalog..."
python manage.py load_policies --publish-all || true

echo "==> Step 6: Loading sample feedback for sentiment charts..."
python manage.py load_sample_feedback || true

echo "==> Render build finished successfully!"
