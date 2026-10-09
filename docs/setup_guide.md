# Local Setup Guide

1. Install Python 3.10+ and Git.
2. `git clone <repo-url> && cd policy-portal`
3. `python -m venv venv` then activate it (`source venv/bin/activate` or `venv\Scripts\activate`).
4. `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and set `SECRET_KEY`.
6. `python manage.py migrate`
7. `python manage.py createsuperuser` (this is the Admin login)
8. `python manage.py load_policies`
9. `python manage.py runserver` and open http://127.0.0.1:8000/

Optional: `python manage.py load_sample_feedback` for demo data (always labelled sample).

## Common problems
- "No module named django": the virtual environment is not active.
- Policies not visible: they are drafts until they have an official link and a verified date. Publish them from /admin/.
- Chart not showing: it needs at least 10 responses (`MIN_RESPONSES_FOR_CHART`).

## Showing all policies (demo mode)
`python manage.py load_policies --publish-all` publishes every policy in the CSV. Policies without a verified date show a "Details are still being checked" banner and a "Visit the official website" button. Use this for demos only. For a real launch, verify each policy and publish it from /admin/.
