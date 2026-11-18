<div align="center">

# 🏛️ Smarth AI — National Policy Portal & Civic Tech Guide

**Empowering 1.4 Billion Citizens with 1,868+ Central & State Welfare Schemes**

[![Django Version](https://img.shields.io/badge/Django-5.0%20%7C%206.0-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Python Version](https://img.shields.io/badge/Python-3.12%20%7C%203.14-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Total Schemes](https://img.shields.io/badge/Schemes%20Cataloged-1%2C868%2B-0e7c7b)](http://127.0.0.1:8000/schemes.html)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Groq%20gpt--oss--20b%20(~900%20tokens/s)-orange)](https://groq.com/)
[![Admin Security](https://img.shields.io/badge/Security-OWASP%20Top%2010%20%2B%20JWT%20SSO-success)](http://127.0.0.1:8000/admin.html)

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-key-features">Key Features</a> •
  <a href="#-national-schemes-coverage">Schemes Coverage</a> •
  <a href="#-system-architecture">Architecture</a> •
  <a href="#-ultra-fast-groq-ai-engine">AI Assistant</a> •
  <a href="#-admin-officer-command-center--jwt-auth">Admin & Security</a> •
  <a href="#-automated-ingestion-pipeline">Auto-Ingestion</a> •
  <a href="#-optimization--performance">Performance</a> •
  <a href="#-frequently-asked-questions">10 FAQs</a> •
  <a href="#-installation--setup">Setup</a>
</p>

</div>

---

## 📌 Overview

**Smarth AI (Policy Portal)** is an independent, high-performance civic-technology platform built to solve India's policy information accessibility gap.

While the Government of India and State Governments release thousands of welfare initiatives and subsidies every year, citizens struggle because:
1. **Policies are scattered** across hundreds of different ministry and state portals.
2. **Bureaucratic language is difficult to understand** for everyday citizens and students.
3. **Application portals and KYC document requirements** are unclear.

### The Solution

Smarth AI bridges this divide with:
- **1,868+ Verified Schemes** cataloged across all Central Ministries and all 36 States & Union Territories.
- **Ultra-Fast AI Simplifier (Groq `openai/gpt-oss-20b` generating ~900 tokens/sec, with Gemini 2.5 Flash & Offline Knowledge Engines)** that distills dense legal gazettes into plain English, Hindi, and Hinglish summaries, bulleted benefits, eligibility checklists, and direct links to official application portals.
- **Interactive Civic Tools**: Live AI Voice/Chat Assistant, Side-by-side Scheme Comparison, Document Readiness Checklist, and Indicative Eligibility Calculator.
- **Ministry Officer Command Center**: Protected by rate limiting, brute-force defense, and **JWT (JSON Web Token) SSO Authentication**.
- **Privacy-First Design**: Zero tracking of private KYC/Aadhaar/bank details; all user preference data is stored strictly in the citizen's own browser (`localStorage`).

> [!NOTE]
> **Independent Platform Notice**: Smarth AI is an independent civic portal. It is **not operated by, affiliated with, or endorsed by the Government of India or any state government**. Citizens are always directed to official `.gov.in` and `.nic.in` portals to complete and submit applications.

---

## ✨ Key Features

### 🔍 Comprehensive Scheme Discovery
- **1,868+ Schemes**: 439 Central Government schemes + 1,429 State schemes.
- **State & UT Dropdown Filter**: Filter instantly by any of the 36 States & UTs (e.g. *Uttar Pradesh*, *Maharashtra*, *Rajasthan*, *Tamil Nadu*, *Kerala*, *Bihar*, *Delhi*, etc.).
- **Category Filter**: Agriculture, Education & Skill, Health, Housing, Finance, Digital/IT, and Social Welfare.
- **Segmented Audience Discovery**: Farmers, Students, Women & Girls, Senior Citizens, Workers & Artisans, Entrepreneurs, Differently Abled, and Tribal Communities.
- **Pre-computed $O(1)$ Search**: Instant sub-millisecond search across scheme names, benefits, departments, and Hindi keywords.

### 🤖 Smarth AI Assistant (Bilingual Chatbot)
- Multi-tier intelligent orchestrator:
  - **Tier 1 (Sub-10ms)**: Verified Instant Scheme Knowledge Resolver (direct catalog matching).
  - **Tier 2 (~1-3s)**: **Groq `openai/gpt-oss-20b`** generating ~900 tokens/sec for comparative, conversational, and general policy advice.
  - **Tier 3 (Redundant Fallback)**: Google Gemini 2.5 Flash for high availability.
  - **Tier 4 (Offline Fallback)**: Offline rule-based assistant.
- **Audio Voice Controls**: Built-in speech recognition (STT) and natural text-to-speech (TTS) speech synthesis.
- **Concurrency Lock**: One-message-at-a-time processing to ensure reliable, clean interactions without overlapping responses.

### ⚖️ Civic Tech Tools
- **Scheme Comparison Tool (`compare.html`)**: Select up to 3 schemes side-by-side to compare benefits, eligibility, and documents.
- **Document Readiness Checker (`checklist.html`)**: Interactive checkbox system calculating readiness percentages and generating printable PDFs.
- **Indicative Eligibility Checker (`eligibility.html`)**: Match age, gender, occupation, and income against scheme criteria.

---

## 🔐 Admin Officer Command Center & JWT Auth

The portal includes an administrative command center accessible directly from the main frontend (`/admin.html`):

- **Default Officer Credentials**:
  - **Username**: `admin`
  - **Password**: `admin123`
  - *Automatic startup provisioning via `python manage.py init_admin` ensures superuser credentials persist across fresh Docker and Render deployments.*
- **JWT Authentication Engine (`dashboard/jwt_auth.py`)**:
  - Issues signed `HS256` JWT tokens with a 12-hour lifetime.
  - Sets secure, `HttpOnly`, `SameSite=Lax` cookies (`admin_jwt`).
  - `@jwt_or_staff_required` decorator secures scheme creation, status toggles (Draft / Published), feedback moderation, and batch API ingestion.
- **Brute-Force Protection**: 15-minute IP lockout after 5 consecutive failed login attempts.
- **OWASP Hardening**: Rate-limited APIs (25 requests/min per IP on `/api/chat/`), SSRF-safe URL openers, and DOM XSS sanitized URL resolvers.

---

## 🇮🇳 National Schemes Coverage

```
Total Active Schemes in Portal: 1,868
├── Central Government Schemes: 439
└── State Government Schemes: 1,429 (Across 36 States & UTs)
```

### Top States Represented
- **Puducherry**: 145 schemes
- **Tamil Nadu**: 138 schemes
- **Haryana**: 89 schemes
- **Goa**: 84 schemes
- **Gujarat**: 82 schemes
- **Madhya Pradesh**: 67 schemes
- **Chhattisgarh**: 56 schemes
- **Rajasthan**: 55 schemes
- **Odisha**: 52 schemes
- **Kerala**: 50 schemes
- **West Bengal**: 48 schemes
- *Maharashtra, Uttar Pradesh, Bihar, Karnataka, Punjab, Delhi, Assam, J&K, Uttarakhand, Himachal, and all others.*

---

## 🧱 System Architecture

```mermaid
flowchart TD
    A[Official Data Sources] --> B[Ingestion Pipeline]
    A1[API Setu - myScheme] --> B
    A2[data.gov.in OGD API] --> B
    A3[PIB & Ministry Feeds] --> B
    A4[National Scheme Catalog] --> B

    B --> C[AI Simplifier Engine]
    C1[Groq gpt-oss-20b] --> C
    C2[Local Ollama] --> C
    C3[Gemini 2.5 Flash] --> C

    C --> D[(Django SQLite / Postgres)]
    D --> E[Auto-Sync static/js/data.js]

    D --> F[Django Backend API]
    F --> F1[/api/chat/ - Rate Limited]
    F --> F2[/api/schemes/sync/ - JWT Auth]
    F --> F3[/api/schemes/<slug>/]
    F --> F4[/api/schemes/<slug>/breakdown/]
    F --> F5[/dashboard/api/auth/login/ - JWT SSO]

    E --> G[Modern Civic Frontend]
    G --> G1[Responsive Header & Clean Navbar]
    G --> G2[Interactive Catalog & Search]
    G --> G3[Clause Breakdown & Hidden Points]
    G --> G4[4-Part Citizen Audit Form]
    G --> G5[AI Voice/Chat Assistant]
    G --> G6[Eligibility & Checklist Tools]
```

---

## 🛠️ Management Commands

```bash
# Initialize or reset default admin/admin123 superuser:
python manage.py init_admin

# Bulk-import all 1,868+ National Schemes (Central & 36 States + UTs) in ~3 seconds:
python manage.py import_all_government_schemes

# Auto-fetch and sync with live government feeds using AI simplifier:
python manage.py sync_gov_schemes --source=all --limit=10

# Run automated unit test suite (17 tests):
python manage.py test
```

---

## 💻 Installation & Setup

1. **Clone repository**:
   ```bash
   git clone https://github.com/Yashendra-org/SmarthAI.git
   cd SmarthAI
   ```

2. **Set up virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables (`.env`)**:
   ```env
   SECRET_KEY=your-django-secret-key
   DEBUG=True
   GROQ_API_KEY=your_groq_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   DATA_GOV_API_KEY=...       # (Optional)
   APISETU_CLIENT_ID=...      # (Optional)
   APISETU_API_KEY=...        # (Optional)
   ```

4. **Initialize Database, Superuser & Import Schemes**:
   ```bash
   python manage.py migrate
   python manage.py init_admin
   python manage.py import_all_government_schemes
   ```

5. **Start Development Server**:
   ```bash
   python manage.py runserver
   ```
   Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in your browser.
   To log in as administrator, click **Admin** in the navigation bar or visit [http://127.0.0.1:8000/admin.html](http://127.0.0.1:8000/admin.html).

---

## 📄 License
This project is licensed under the [MIT License](LICENSE). Built for public welfare and digital empowerment across India.
