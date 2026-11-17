import json
import logging
import os
import re
import socket
import urllib.error
import urllib.request
import requests

try:
    import dotenv
    dotenv.load_dotenv()
except Exception:
    pass

logger = logging.getLogger(__name__)

# API keys loaded securely from environment / .env
def get_api_key(name):
    return os.getenv(name, "")

GROQ_API_KEY = get_api_key("GROQ_API_KEY")
GEMINI_API_KEY = get_api_key("GEMINI_API_KEY")
NVIDIA_API_KEY = get_api_key("NVIDIA_API_KEY")
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


def call_gemini(user_prompt, history=None):
    """Ultra-fast LLM inference using Google Gemini 2.5 Flash via requests with 3.5s strict timeout."""
    key = os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY
    if not key:
        return None
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
        headers = {"Content-Type": "application/json"}

        contents = []
        # Concise System Instruction
        contents.append({"role": "user", "parts": [{"text": f"Instruction: {SYSTEM_PROMPT}"}]})
        contents.append({"role": "model", "parts": [{"text": "Understood. I will provide crisp, structured answers for Indian government schemes with Benefits, Eligibility, Documents and Official Portal Links."}]})

        if history:
            for m in history[-4:]:
                role = "model" if m.get("role") in ["assistant", "bot", "b"] else "user"
                txt = m.get("content") or m.get("text") or m.get("t") or ""
                if txt:
                    contents.append({"role": role, "parts": [{"text": txt[:400]}]})

        contents.append({"role": "user", "parts": [{"text": user_prompt}]})

        payload = {
            "contents": contents,
            "generationConfig": {"maxOutputTokens": 600, "temperature": 0.4},
        }
        resp = requests.post(url, json=payload, headers=headers, timeout=(2.0, 3.5))
        if resp.status_code == 200:
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        logger.debug(f"Gemini API request error or timeout: {e}")
        return None


def resolve_local_scheme_knowledge(prompt):
    """
    Sub-10ms instantaneous knowledge resolver for Indian welfare schemes.
    Matches scheme keywords directly against our catalog and returns full
    benefits, criteria, documents, official link, and fine print.
    """
    p_lower = prompt.lower()
    
    # 1. Match against Curated Official Schemes
    try:
        from policies.ingestion.sources import CuratedLiveGovSource
        for s in CuratedLiveGovSource.OFFICIAL_SCHEMES:
            t_low = s["title"].lower()
            if "surya ghar" in p_lower and "surya" in t_low:
                return format_scheme_response(s)
            if "vay vandana" in p_lower and "vandana" in t_low:
                return format_scheme_response(s)
            if ("vidyalaxmi" in p_lower or "vidya laxmi" in p_lower) and "vidyalaxmi" in t_low:
                return format_scheme_response(s)
            if "vishwakarma" in p_lower and "vishwakarma" in t_low:
                return format_scheme_response(s)
            if "svanidhi" in p_lower and "svanidhi" in t_low:
                return format_scheme_response(s)
            if "internship" in p_lower and "internship" in t_low:
                return format_scheme_response(s)
            if "drone didi" in p_lower and "drone" in t_low:
                return format_scheme_response(s)
            if "lakhpati didi" in p_lower and "lakhpati" in t_low:
                return format_scheme_response(s)
            if "janman" in p_lower and "janman" in t_low:
                return format_scheme_response(s)
    except Exception:
        pass

    # 2. Database lookup
    try:
        from policies.models import Policy
        words = [w for w in re.split(r"[^\w]+", p_lower) if len(w) > 3 and w not in ["kya", "hai", "batao", "scheme", "yojana", "about", "tell"]]
        if words:
            q = Policy.objects.filter(title__icontains=words[0])
            for w in words[1:]:
                q = q.filter(title__icontains=w)
            match = q.first()
            if match:
                return format_db_policy_response(match)
    except Exception:
        pass

    # 3. Category Fallbacks
    if any(k in p_lower for k in ["kisan", "farmer", "krishi", "pm-kisan", "pmkisan", "किसान"]):
        return (
            "🌾 **PM-KISAN (प्रधानमंत्री किसान सम्मान निधि)**\n\n"
            "• **अवलोकन (Overview):** सभी भूमिधारक किसान परिवारों को आय सहायता प्रदान करने वाली केंद्रीय योजना।\n"
            "• **लाभ (Benefits):** प्रति वर्ष ₹6,000 की वित्तीय सहायता (₹2,000 की 3 समान किस्तों में सीधे DBT बैंक खाते में)।\n"
            "• **पात्रता (Eligibility):** अपने नाम पर कृषि भूमि रखने वाले छोटे व सीमांत किसान परिवार। (ITR भरने वाले व सरकारी कर्मचारी अपात्र हैं)।\n"
            "• **आवश्यक दस्तावेज़:** आधार कार्ड, बैंक पासबुक (NPCI DBT लिंक), खसरा-खतौनी भूमि रिकॉर्ड, मोबाइल नंबर।\n"
            "• **आधिकारिक पोर्टल:** [pmkisan.gov.in](https://pmkisan.gov.in/)\n\n"
            "⚠️ **जरूरी छिपी बात:** बैंक खाते में सिर्फ आधार लिंक होना काफी नहीं है, बैंक में **NPCI DBT Mapping** सक्रिय होना अनिवार्य है अन्यथा किस्त अटक जाएगी।"
        )

    if any(k in p_lower for k in ["ayushman", "health", "hospital", "swasthya", "5 lakh", "आयुष्मान", "इलाज"]):
        return (
            "🏥 **आयुष्मान भारत (PM-JAY & वय वंदना 70+)**\n\n"
            "• **अवलोकन:** दुनिया की सबसे बड़ी स्वास्थ्य सुरक्षा योजना। 70 वर्ष या उससे अधिक आयु के सभी वरिष्ठ नागरिकों को आय सीमा के बिना निःशुल्क कवर।\n"
            "• **लाभ:** प्रति वर्ष प्रति परिवार ₹5 लाख तक का कैशलेस इलाज देश के सभी सूचीबद्ध सरकारी और निजी अस्पतालों में।\n"
            "• **पात्रता:** SECC 2011 सूची / राशन कार्ड धारक, और 70+ वर्ष के सभी वरिष्ठ नागरिक।\n"
            "• **आवश्यक दस्तावेज़:** आधार कार्ड (उम्र सत्यापन हेतु), राशन कार्ड / समग्र आईडी, मोबाइल नंबर।\n"
            "• **आधिकारिक पोर्टल:** [beneficiary.nha.gov.in](https://beneficiary.nha.gov.in/)\n\n"
            "⚠️ **जरूरी छिपी बात:** अस्पताल में भर्ती होते ही आरोग्य मित्र से तुरंत प्री-ऑथराइजेशन (Pre-authorization) कराना जरूरी है।"
        )

    if any(k in p_lower for k in ["scholarship", "student", "study", "education loan", "छात्रवृत्ति", "पढ़ाई"]):
        return (
            "🎓 **PM-विद्यालक्ष्मी & राष्ट्रीय छात्रवृत्ति (NSP Scholarships)**\n\n"
            "• **अवलोकन:** देश के शीर्ष 860 गुणवत्तापूर्ण उच्च शिक्षण संस्थानों में प्रवेश पाने वाले छात्रों के लिए बिना किसी गारंटी के शिक्षा ऋण।\n"
            "• **लाभ:** पूर्ण ट्यूशन फीस और कोर्स खर्च हेतु ऋण, 8 लाख तक वार्षिक पारिवारिक आय पर 3% ब्याज छूट, और सरकार द्वारा 75% क्रेडिट गारंटी।\n"
            "• **पात्रता:** मान्यता प्राप्त संस्थान में प्रवेश, न्यूनतम 50-60% अंक।\n"
            "• **आवश्यक दस्तावेज़:** प्रवेश पत्र (Admission letter), 10वीं/12वीं अंकपत्र, आधार कार्ड, आय प्रमाण पत्र।\n"
            "• **आधिकारिक पोर्टल:** [pmvidyalaxmi.co.in](https://pmvidyalaxmi.co.in/) और [scholarships.gov.in](https://scholarships.gov.in/)"
        )

    if any(k in p_lower for k in ["loan", "business", "mudra", "dukan", "startup", "लोन", "व्यापार"]):
        return (
            "💼 **प्रधानमंत्री मुद्रा योजना (PMMY)**\n\n"
            "• **अवलोकन:** गैर-कॉर्पोरेट, गैर-कृषि लघु व सूक्ष्म उद्यमों के लिए संपार्श्विक-मुक्त (Collateral-free) व्यापार ऋण।\n"
            "• **श्रेणियां (Benefits):**\n"
            "  - **शिशु:** ₹50,000 तक\n"
            "  - **किशोर:** ₹50,000 से ₹5 लाख तक\n"
            "  - **तरुण:** ₹5 लाख से ₹10 लाख तक\n"
            "• **पात्रता:** कोई भी भारतीय नागरिक जो विनिर्माण, प्रसंस्करण, व्यापार या सेवा क्षेत्र में नया व्यवसाय शुरू करना चाहता है या मौजूदा व्यापार बढ़ाना चाहता है।\n"
            "• **आवश्यक दस्तावेज़:** पहचान पत्र (आधार/पैन), निवास प्रमाण, व्यापार का प्रोजेक्ट विवरण, 6 माह का बैंक स्टेटमेंट।\n"
            "• **आधिकारिक पोर्टल:** [mudra.org.in](https://www.mudra.org.in/) व [udyamimitra.in](https://www.udyamimitra.in/)"
        )

    return None


def format_scheme_response(s):
    return (
        f"🏛️ **{s['title']}**\n\n"
        f"• **मंत्रालय (Ministry):** {s['department']}\n"
        f"• **अवलोकन (Overview):** {s['objective']}\n"
        f"• **मुख्य लाभ (Benefits):** {s['benefits']}\n"
        f"• **पात्रता (Eligibility):** {s['eligibility']}\n"
        f"• **आवश्यक दस्तावेज़ (Documents):** {s['documents']}\n"
        f"• **आधिकारिक पोर्टल (Official Portal):** [{s['url']}]({s['url']})\n\n"
        f"💡 *स्मार्ट टिप: आवेदन करने से पहले आधिकारिक वेबसाइट पर जाकर दिशानिर्देश अवश्य जांचें।*"
    )


def format_db_policy_response(p):
    docs = p.documents_required.replace(";", "\n• ")
    return (
        f"🏛️ **{p.title}**\n\n"
        f"• **विभाग/मंत्रालय:** {p.department.name}\n"
        f"• **उद्देश्य:** {p.objective or p.summary_en}\n"
        f"• **मुख्य लाभ:** {p.benefits}\n"
        f"• **पात्रता:** {p.eligibility}\n"
        f"• **आवश्यक दस्तावेज़:**\n• {docs}\n"
        f"• **आवेदन प्रक्रिया:** {p.how_to_apply}\n"
        f"• **आधिकारिक लिंक:** [{p.official_url}]({p.official_url})"
    )


def ask_smarth_ai(user_prompt, history=None):
    """
    Sub-second response orchestrator for Smarth AI Chatbot:
    1. Instant Knowledge Resolver: sub-10ms matching for scheme names/topics.
    2. Google Gemini 2.5 Flash: ~1.5s cloud AI for complex/conversational inquiries.
    3. Fast Offline Fallback: Instant responsive fallback without blocking.
    """
    history = history or []
    prompt_clean = user_prompt.strip()

    # 1. Check instant local scheme knowledge resolver (sub-10ms response)
    fast_match = resolve_local_scheme_knowledge(prompt_clean)
    if fast_match:
        return {"reply": fast_match, "provider": "Smarth AI Verified Knowledge Engine"}

    # 2. Try Gemini 2.5 Flash via requests with strict 3.5s timeout
    gem_res = call_gemini(prompt_clean, history=history)
    if gem_res:
        return {"reply": gem_res, "provider": "Google Gemini 2.5 Flash"}

    # 3. Instant helpful fallback
    return {
        "reply": (
            "नमस्ते! मैं **Smarth AI** हूँ। आप मुझसे किसी भी सरकारी योजना (जैसे PM-KISAN, आयुष्मान भारत, "
            "छात्रवृत्ति, मुद्रा लोन, पीएम सूर्य घर) या अपनी पात्रता व आवश्यक दस्तावेज़ों के बारे में पूछ सकते हैं।"
        ),
        "provider": "Smarth AI Core Assistant",
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
            gem_resp        = call_gemini(prompt)
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

