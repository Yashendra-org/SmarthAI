import json
import logging
import os
import urllib.error
import urllib.request

logger = logging.getLogger(__name__)

# API keys loaded securely from environment / .env
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def simplify_scheme_with_ai(raw_scheme):
    """
    Takes raw government scheme text/attributes and generates citizen-friendly
    short plain English and Hindi summaries, eligibility, and documents using Qwen / Gemini.
    """
    title = raw_scheme.get("title", "")
    dept = raw_scheme.get("department", "")
    desc = raw_scheme.get("description") or raw_scheme.get("raw_text") or raw_scheme.get("objective") or ""
    existing_benefits = raw_scheme.get("benefits", "")
    existing_elig = raw_scheme.get("eligibility", "")
    existing_docs = raw_scheme.get("documents", "")

    prompt = f"""You are a Civic Technology Policy Simplifier for India.
Simplify this Government Scheme for everyday citizens so it is easy and quick to understand:

Scheme Title: {title}
Ministry/Department: {dept}
Raw Description: {desc}
Known Details: {existing_benefits} {existing_elig} {existing_docs}

Respond ONLY with valid JSON with these exact keys:
{{
  "summary_en": "2-3 short, clear sentences in simple English explaining what this scheme gives and who gets it.",
  "summary_hi": "2-3 सरल वाक्य हिंदी में जो समझाएं कि यह योजना क्या देती है और किसे मिलेगी।",
  "benefits": "Short bullet points of exact benefits/money/support received.",
  "eligibility": "Simple criteria: age, income, who qualifies.",
  "documents_required": "List of documents separated by semicolons (e.g. Aadhaar; Bank passbook; Mobile number)",
  "category": "One of: agriculture, health, education, housing, finance, digital, social_welfare, other",
  "target_groups": ["list of groups like: farmers, students, women, senior citizens, workers, entrepreneurs, everyone"]
}}"""

    # 1. Try Local Ollama Qwen if running locally
    try:
        ollama_url = "http://localhost:11434/api/generate"
        ollama_payload = {
            "model": "qwen2.5:2b",
            "prompt": prompt + "\nOutput strictly valid JSON with no markdown wrapping.",
            "format": "json",
            "stream": False,
        }
        req = urllib.request.Request(
            ollama_url,
            data=json.dumps(ollama_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            response_text = data.get("response", "").strip()
            return json.loads(response_text)
    except Exception:
        pass  # Ollama not running locally, proceed to cloud Groq Qwen

    # 2. Try Groq Qwen
    if GROQ_API_KEY:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SmarthAI/1.0",
            }
            payload = {
                "model": "qwen/qwen3.8-27b",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "response_format": {"type": "json_object"},
                "max_tokens": 700,
            }
            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        except urllib.error.HTTPError as he:
            if he.code == 429:
                logger.warning("Groq rate limit reached (429), switching to Gemini fallback.")
            else:
                logger.warning(f"Groq simplification HTTP {he.code}: {he}")
        except Exception as e:
            logger.warning(f"Qwen simplification failed, trying fallback: {e}")

    # 3. Try Gemini
    if GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{"parts": [{"text": prompt + "\nStrictly output valid JSON only."}]}],
                "generationConfig": {"temperature": 0.3, "responseMimeType": "application/json"},
            }
            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text)
        except Exception as e:
            logger.warning(f"Gemini simplification failed: {e}")

    # 4. Rule-based Fallback if offline
    return {
        "summary_en": raw_scheme.get("objective") or desc[:200] or f"Official government scheme under {dept}.",
        "summary_hi": f"{title} भारत सरकार की एक महत्वपूर्ण योजना है जो नागरिकों को सहायता प्रदान करती है।",
        "benefits": existing_benefits or desc[:150],
        "eligibility": existing_elig or "Indian citizens meeting scheme criteria.",
        "documents_required": existing_docs or "Aadhaar card; Bank account; Mobile number",
        "category": raw_scheme.get("category", "other"),
        "target_groups": ["everyone"],
    }
