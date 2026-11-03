# 🚀 SmarthAI Developer & Setup Guide

This guide covers getting **SmarthAI (Policy Portal)** running locally, containerized with Docker, or deployed to the cloud.

---

## 🛠️ Prerequisites

- **Python 3.10+** (Python 3.12 recommended)
- **Git**
- *(Optional)* **Docker & Docker Compose**

---

## 💻 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Yashendra-org/SmarthAI.git
cd SmarthAI
```

### 2. Create and Activate Virtual Environment

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

> [!TIP]
> **Encountered `ModuleNotFoundError: No module named 'django'`?**
> This means your virtual environment is empty. Always run Step 3 (`pip install -r requirements.txt`) immediately after activating `.venv`.

### 3. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
# Windows:
copy .env.example .env

# macOS / Linux:
cp .env.example .env
```
Open `.env` and configure `SECRET_KEY`, `DEBUG=True`, and `ALLOWED_HOSTS`.

### 5. Apply Database Migrations
```bash
python manage.py migrate
```

### 6. Create Admin Superuser
```bash
python manage.py createsuperuser
# Enter username (e.g. admin), email, and password (e.g. admin123)
```

### 7. Populate Seed Policies & Demo Data
```bash
# Loads all researched policies into the database
python manage.py load_policies --publish-all

# (Optional) Loads demo citizen feedback to display initial sentiment pie charts
python manage.py load_sample_feedback
```

### 8. Start the Development Server
```bash
python manage.py runserver
```

Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in your web browser.

---

## 🌐 Portal Navigation

| Section | Local URL | Description |
|---|---|---|
| **Public Home** | `http://127.0.0.1:8000/` | Main discovery portal with search, topics, and target groups |
| **All Policies** | `http://127.0.0.1:8000/policies/` | Multi-criteria filtering (category, department, level, state) |
| **How Sentiment Works** | `http://127.0.0.1:8000/how-sentiment-works/` | Methodology, transparency notice, and model limitations |
| **About Us** | `http://127.0.0.1:8000/about/` | Problem statement and civic-tech mission |
| **Disclaimer** | `http://127.0.0.1:8000/disclaimer/` | Non-governmental independence notice |
| **Admin Dashboard** | `http://127.0.0.1:8000/dashboard/` | Analytics KPIs, sentiment splits, and CSV export |
| **Django Admin** | `http://127.0.0.1:8000/admin/` | Content management, policy approval, spam moderation |

---

## 🐳 Docker Deployment

To launch the full environment in an isolated container without installing Python locally:

```bash
docker compose up -d --build
```

View container logs:
```bash
docker compose logs -f web
```

Stop the container:
```bash
docker compose down
```

---

## 🧪 Testing & Evaluation

### Run Test Suites
```bash
python manage.py test
```

### Benchmark Sentiment Accuracy
```bash
# Evaluate active engine on data/hinglish_test_set.csv
python manage.py evaluate_sentiment

# Evaluate all candidate engines and update docs/accuracy_report.md
python manage.py evaluate_sentiment --engine all --write
```

---

## ❓ Common Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `ModuleNotFoundError: No module named 'django'` | Virtual environment not active or dependencies not installed | Activate `.venv` and run `pip install -r requirements.txt`. |
| `Not Found: /favicon.ico (404)` | Missing favicon endpoint | Handled automatically via `/favicon.ico` redirect to `/static/img/favicon.svg`. |
| Chart not visible on policy page | Response count is below `MIN_RESPONSES_FOR_CHART` (10) | Run `python manage.py load_sample_feedback` to populate test feedback. |
| `DisallowedHost` warning | Host header not in `ALLOWED_HOSTS` | Add your domain/IP to `ALLOWED_HOSTS` in `.env`. |
