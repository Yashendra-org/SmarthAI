#!/usr/bin/env bash
set -e

echo "==> Step 1: Applying database migrations..."
python manage.py migrate --noinput

echo "==> Step 2: Ensuring seed policies are loaded and published..."
python manage.py load_policies --publish-all || true

echo "==> Step 3: Loading sample feedback for sentiment charts..."
python manage.py load_sample_feedback || true

echo "==> Step 4: Starting Gunicorn WSGI server..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}
