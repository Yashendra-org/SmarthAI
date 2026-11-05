import json
import logging
import os
import urllib.error
import urllib.request

logger = logging.getLogger(__name__)

# API keys loaded securely from environment / .env
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

SYSTEM_PROMPT = """You are Smarth AI — a citizen-centric Indian Government Scheme & Policy AI Assistant for the Policy Portal.

Your goal is to help citizens discover, understand, check eligibility, and apply for central and state government schemes in India.

Key Knowledge Base:
- Agriculture: PM-KISAN (₹6000/year in 3 installments), PM Fasal Bima Yojana (PMFBY), Kisan Credit Card (KCC), PM-KUSUM (solar pump), Soil Health Card, e-NAM.
- Health: Ayushman Bharat PM-JAY (₹5 lakh cashless cover/family/year; free for 70+ senior citizens), ABHA card, PM Jan Aushadhi.
- Housing: PM Awas Yojana (PMAY Urban & Gramin) - financial support for pucca house.
- Women & Children: Sukanya Samriddhi Yojana (SSY for girl child savings), PM Ujjwala Yojana (free LPG), Beti Bachao Beti Padhao, PM Matru Vandana Yojana (maternity cash support).
- Finance & Social Security: Atal Pension Yojana (APY ₹1000-5000 pension after 60), PM Jan Dhan Yojana (zero-balance account + RuPay), PM Jeevan Jyoti Bima (PMJJBY ₹2 lakh life cover for ₹436/yr), PM Suraksha Bima (PMSBY ₹2 lakh accident cover for ₹20/yr).
- Business & Employment: PM MUDRA (Shishu up to 50k, Kishore up to 5L, Tarun up to 10L), PM Vishwakarma (artisans & craftspeople), PM SVANidhi (street vendors), Stand-Up India, Startup India, PMKVY, MGNREGA (100 days guaranteed wage work).
- Education: National Scholarship Portal (NSP), PM-Vidyalaxmi (higher education collateral-free loans), PM POSHAN (mid-day meal), Samagra Shiksha.

Instructions:
1. Language: Answer in the same language the user writes (English, Hindi, or natural conversational Hinglish).
2. Format: Use clean bullet points, bold key figures (like amounts, age limits), and list:
   - Scheme Overview
   - Benefits
   - Key Eligibility Criteria
   - Required Documents
   - Official Application Link
3. Keep replies crisp, practical, and citizen-friendly.
4. Reminder: Clarify that eligibility checks here are indicative and citizens must apply on the official government website.
"""


import socket

def is_ollama_available():
    """Quick 0.1s socket probe to check if local Ollama port is open."""
    try:
        with socket.create_connection(("127.0.0.1", 11434), timeout=0.15):
            return True
    except (OSError, socket.timeout):
        return False


def call_ollama(messages, model="qwen3.5:2b"):
    """Try local Ollama server if available."""
    if not is_ollama_available():
        return None
    try:
        url = f"{OLLAMA_HOST}/api/chat"
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("message", {}).get("content", "").strip()
    except Exception as e:
        logger.debug(f"Ollama call failed or not running: {e}")
        return None


def call_groq_qwen(messages, model="qwen/qwen3.8-27b"):
    """Call Groq API using high-performance Qwen model."""
    if not GROQ_API_KEY:
        return None
    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SmarthAI/1.0",
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.6,
            "max_tokens": 800,
        }
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.warning(f"Groq API call error: {e}")
        return None


def call_gemini(user_prompt):
    """Fallback to Gemini API if Groq encounters any limit."""
    if not GEMINI_API_KEY:
        return None
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        prompt_with_system = f"{SYSTEM_PROMPT}\n\nUser: {user_prompt}\n\nSmarth AI:"
        payload = {
            "contents": [{"parts": [{"text": prompt_with_system}]}],
            "generationConfig": {"maxOutputTokens": 800, "temperature": 0.6},
        }
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        logger.warning(f"Gemini API call error: {e}")
        return None


def ask_smarth_ai(user_prompt, history=None):
    """
    Main entry point for AI Assistant chatbot.
    Cascades:
      1. Local Ollama (qwen3.5:2b / qwen3.5:4b / qwen2.5:2b) if running
      2. Groq Qwen (qwen/qwen3.8-27b) - primary ultra-fast cloud
      3. Google Gemini 2.5 Flash - resilient cloud fallback
    """
    history = history or []
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for msg in history[-8:]:  # keep last 8 turns for context
        role = "assistant" if msg.get("role") in ["assistant", "bot", "b"] else "user"
        content = msg.get("content") or msg.get("text") or msg.get("t") or ""
        if content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_prompt})

    # 1. Try local Ollama if user has it running
    for ollama_m in ["qwen3.5:2b", "qwen3.5:4b", "qwen2.5:2b", "qwen2.5:4b", "qwen:latest"]:
        res = call_ollama(messages, model=ollama_m)
        if res:
            return {"reply": res, "provider": f"Ollama ({ollama_m})"}

    # 2. Try Groq Qwen (fastest cloud inference)
    res = call_groq_qwen(messages, model="qwen/qwen3.8-27b")
    if res:
        return {"reply": res, "provider": "Groq (Qwen 3.8)"}

    # 3. Fallback to Gemini
    res = call_gemini(user_prompt)
    if res:
        return {"reply": res, "provider": "Google Gemini 2.5"}

    # Final fallback if all networks fail
    return {
        "reply": "माफ़ कीजिए, AI सेवा से संपर्क नहीं हो पाया। कृपया इंटरनेट कनेक्शन जाँचें या थोड़ी देर बाद प्रयास करें।",
        "provider": "Offline Fallback",
    }


def generate_deep_policy_breakdown(scheme):
    """
    Generates:
    1. Clause-by-clause / Paragraph-by-paragraph breakdown:
       - Actual Policy Content (Gazette Clause)
       - Simplified Plain Words Explanation
       - Concrete Everyday Example
    2. Hidden Points & Fine Print (unspoken rules, eligibility traps, DBT linking, verification).
    """
    title = getattr(scheme, "title", None) or (scheme.get("title") if isinstance(scheme, dict) else str(scheme))
    category = getattr(scheme, "category", "") or (scheme.get("category", "") if isinstance(scheme, dict) else "")
    objective = getattr(scheme, "objective", "") or (scheme.get("objective", "") if isinstance(scheme, dict) else "")
    benefits = getattr(scheme, "benefits", "") or (scheme.get("benefits", "") if isinstance(scheme, dict) else "")
    eligibility = getattr(scheme, "eligibility", "") or (scheme.get("eligibility", "") if isinstance(scheme, dict) else "")
    documents = getattr(scheme, "documents_required", "") or (scheme.get("documents_required", "") if isinstance(scheme, dict) else "")

    if isinstance(eligibility, list):
        eligibility = "; ".join(eligibility)
    if isinstance(documents, list):
        documents = "; ".join(documents)

    prompt = (
        f"You are a Senior Indian Public Policy Analyst & Citizen Rights Expert. "
        f"Analyze this government scheme in extreme depth for an Indian citizen:\n"
        f"Scheme Name: {title}\n"
        f"Category: {category}\n"
        f"Objective: {objective}\n"
        f"Benefits: {benefits}\n"
        f"Eligibility: {eligibility}\n"
        f"Documents Required: {documents}\n\n"
        f"Return strict JSON with this exact structure:\n"
        f"{{\n"
        f'  "clauses": [\n'
        f'    {{"clause_title": "Clause 1 Title", "official_content": "Official gazette clause or rule", "plain_words": "Simple, friendly explanation in plain words", "example": "Real-life concrete example (e.g. Ramesh from Varanasi...)"}},\n'
        f'    {{"clause_title": "Clause 2 Title", "official_content": "Official gazette clause or rule", "plain_words": "Simple, friendly explanation", "example": "Real-life concrete example"}}\n'
        f"  ],\n"
        f'  "hidden_points": [\n'
        f'    {{"title": "Fine Print Title", "detail": "What is NOT prominently told in the banner, but strictly applicable in practice (e.g., Aadhaar-NPCI DBT mapping, 1 per ration card, fresh income certificate window, ancestral land dispute, post-facto reimbursement)."}}\n'
        f"  ]\n"
        f"}}\n"
        f"Output ONLY valid JSON."
    )

    # 1. Try Groq or Gemini for live LLM extraction if available
    llm_raw = None
    try:
        groq_resp = call_groq_qwen([
            {"role": "system", "content": "You are a JSON-only government policy parser. Never output markdown fences or conversational text."},
            {"role": "user", "content": prompt}
        ], model="qwen/qwen3.8-27b")
        if groq_resp and "clauses" in groq_resp:
            llm_raw = groq_resp
    except Exception:
        pass

    if not llm_raw:
        try:
            gem_resp = call_gemini(prompt)
            if gem_resp and "clauses" in gem_resp:
                llm_raw = gem_resp
        except Exception:
            pass

    if llm_raw:
        try:
            clean = llm_raw.strip()
            if clean.startswith("```json"):
                clean = clean[7:]
            if clean.startswith("```"):
                clean = clean[3:]
            if clean.endswith("```"):
                clean = clean[:-3]
            parsed = json.loads(clean.strip())
            if "clauses" in parsed and "hidden_points" in parsed:
                return parsed
        except Exception:
            pass

    # High-fidelity Rule-Based Fallback Engine
    title_lower = title.lower()
    cat_lower = str(category).lower()
    obj_clean = objective or f"Welfare scheme under {category or 'Government of India'}."
    ben_clean = benefits or "Financial assistance, subsidy or welfare benefits as per gazette guidelines."
    elig_clean = eligibility or "Resident citizens meeting category criteria."

    # Determine archetype
    is_agri = any(w in title_lower or w in cat_lower for w in ["kisan", "farmer", "krishi", "crop", "fasal", "agriculture"])
    is_health = any(w in title_lower or w in cat_lower for w in ["health", "swasthya", "ayushman", "arogya", "medical", "hospital"])
    is_edu = any(w in title_lower or w in cat_lower for w in ["scholarship", "vidya", "education", "student", "shiksha", "fellowship"])
    is_women = any(w in title_lower or w in cat_lower for w in ["mahila", "woman", "women", "kanya", "ladli", "matru", "beti"])
    is_housing = any(w in title_lower or w in cat_lower for w in ["awas", "housing", "pmay", "ghar"])
    is_business = any(w in title_lower or w in cat_lower for w in ["mudra", "msme", "svanidhi", "stand up", "loan", "udyami", "entrepreneur"])

    clauses = [
        {
            "clause_title": "Clause 1: Eligibility Mandate & Demographics",
            "official_content": f"The beneficiary must conform strictly to defined parametric filters: {elig_clean}. Must be an Indian citizen with active residential documentation.",
            "plain_words": "You must fulfill the core income and category criteria. All family details in your Aadhaar and Ration Card must match without name or age mismatches.",
            "example": "If the scheme is for farmers or small traders, your official trade license or land record must be directly in your own name, not in your parents' or uncle's name.",
        },
        {
            "clause_title": "Clause 2: Financial Assistance & Benefit Disbursement",
            "official_content": f"Quantum of benefit: {ben_clean}. Disbursement executed via direct benefit transfer (DBT) directly into beneficiary bank accounts.",
            "plain_words": "The money or subsidy is sent straight to your bank account through government DBT. Cash payment or middlemen checks are strictly prohibited.",
            "example": "If Rs 6,000 or a subsidy is announced, it arrives in verified bank installments directly to your primary bank account.",
        },
        {
            "clause_title": "Clause 3: Documentary Verification & On-Ground Inspection",
            "official_content": f"Applicant must furnish {documents or 'Aadhaar Card, Bank Passbook, Address Proof, and Income Certificate'} before the designated Nodal Officer.",
            "plain_words": "Every document is cross-checked online against state databases. Local revenue or block officers may conduct spot checks before final sign-off.",
            "example": "A field inspector or Patwari/Panchayat Secretary may visit to verify you actually cultivate the land, run the shop, or live in the house before approval.",
        },
    ]

    hidden_points = [
        {
            "title": "NPCI / Aadhaar-Seed Mapping Trap",
            "detail": "Having an Aadhaar linked to your bank is NOT enough. Your bank account must be actively mapped to the National Payments Corporation of India (NPCI) DBT server. Without NPCI mapper flag, DBT transactions will bounce silently.",
        },
        {
            "title": "Strict 'One Benefit Per Family / Ration Card' Rule",
            "detail": "Even if two adult members in the same house satisfy eligibility individually, government portals cross-check SAMAGRA/Ration Card/PDS family IDs. Dual claims result in immediate disqualification and blacklisting.",
        },
        {
            "title": "Income Certificate 6-Month Expiry Window",
            "detail": "Tehsildar/Revenue authority income certificates older than 6 months or 1 financial year are auto-rejected by portal verification scripts without notice.",
        },
        {
            "title": "Post-Facto Reimbursement vs Upfront Grant",
            "detail": "Most capital or tool subsidies require you to purchase the approved equipment first with your own money and GST invoice. The government subsidy is credited only after physical inspection and geo-tagged upload.",
        },
    ]

    if is_agri:
        hidden_points.append({
            "title": "Land Title (Khatauni/ROR) Mutation Requirement",
            "detail": "Ancestral land without official mutation in applicant's individual name is ineligible. Disputed joint-holding plots where co-owners haven't signed NOC are rejected.",
        })
    elif is_health:
        hidden_points.append({
            "title": "Pre-Authorization & Empaneled Hospital Catch",
            "detail": "Treatment must be initiated only after hospital Aarogya Mitra pre-authorizes the package online. Emergency reimbursement after discharge is rarely permitted.",
        })
    elif is_edu:
        hidden_points.append({
            "title": "Biometric Attendance & NSP Duplicate Application Ban",
            "detail": "Students must have minimum 75% biometric attendance. Applying for state scholarship while simultaneously registered on the National Scholarship Portal (NSP) leads to immediate de-registration.",
        })
    elif is_business:
        hidden_points.append({
            "title": "CIBIL Score & Udhyam Registration Pre-requisite",
            "detail": "While advertised as 'collateral-free', banks mandate a minimum CIBIL score (usually 650+) and active Udhyam Registration number. Existing NPA or defaulted loan anywhere blocks approval.",
        })

    return {
        "clauses": clauses,
        "hidden_points": hidden_points,
    }

