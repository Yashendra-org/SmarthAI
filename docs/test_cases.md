# 🧪 Manual & Automated Test Matrix

Comprehensive test specifications for **SmarthAI (Policy Portal)**.

---

## 📋 Test Matrix

| # | Feature / Component | Test Action | Expected Result | Automated Test |
|---|---|---|---|:---:|
| **1** | Draft Policy Protection | Open a policy whose status is `Draft` | Returns HTTP `404 Not Found` | ✅ |
| **2** | Full-Text Search | Search query `farmer` in search bar | Only matching published policies are listed | ✅ |
| **3** | Category & Group Filter | Filter by Category (`Agriculture`) and Target Group (`Farmers`) | Catalog filters down accurately | ✅ |
| **4** | State Filter | Filter policies by State (e.g. `Uttar Pradesh`) | Only policies applicable to the state appear | ✅ |
| **5** | Bilingual Summary | Open policy detail with Hindi summary | Displays both English and Hindi sections clearly | ✅ |
| **6** | Outbound Click Tracker | Click "Apply on the official site" button | Increments `apply_clicks` counter by 1 & 302 redirects to official `.gov.in` URL | ✅ |
| **7** | Feedback Input Validation | Submit comment with less than 5 characters | Form validation error; feedback is not recorded | ✅ |
| **8** | Anti-Bot Honeypot | Submit feedback with hidden `website` field filled | Rejected silently with spam detection error | ✅ |
| **9** | Sliding-Window Rate Limit | Submit 6 feedbacks within 1 hour from the same IP | 6th submission blocked with rate-limit warning | ✅ |
| **10** | Sentiment Scoring | Submit positive feedback (*"Very helpful scheme"*) | Classified as `positive` with confidence score | ✅ |
| **11** | Hinglish Language Support | Submit comment *"Yeh scheme bahut bekar hai"* | Classified as `negative` | ✅ |
| **12** | Chart Threshold Guard | Policy with less than 10 responses | Chart hidden; displays responses needed indicator | ✅ |
| **13** | Dynamic Sentiment Chart | Policy reaches 10+ approved responses | Chart.js sentiment pie chart & percentages rendered | ✅ |
| **14** | Spam Moderation Flag | Mark feedback `is_flagged = True` in admin | Immediately excluded from public charts & counts | ✅ |
| **15** | Dashboard Access Guard | Access `/dashboard/` as an unauthenticated guest | Redirected to staff login page | ✅ |
| **16** | CSV Feedback Export | Click "Export Feedback CSV" as staff user | Generates downloadable `feedback_export.csv` | ✅ |
| **17** | Transparency Pages | Navigate to `/about/`, `/how-sentiment-works/`, `/disclaimer/` | All pages load with HTTP `200 OK` | ✅ |
| **18** | Favicon Handling | Request `/favicon.ico` | HTTP `301/200` redirect to `/static/img/favicon.svg` | ✅ |
| **19** | Responsive Design | View at mobile viewport width (< 480px) | Clean mobile navigation, no horizontal scroll | ✅ |

---

## 🤖 Running Automated Test Suites

```bash
python manage.py test
```

Expected output:
```text
Ran 17 tests in 2.2s
OK
```
