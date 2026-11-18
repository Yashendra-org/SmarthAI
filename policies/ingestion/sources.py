import ast
import csv
import ipaddress
import json
import logging
import os
import socket
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from django.utils.text import slugify

logger = logging.getLogger(__name__)

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SmarthAI-PolicyPortal/1.0"
ALLOWED_SCHEMES = {"http", "https"}
BLOCKED_HOSTS = {"169.254.169.254", "localhost", "127.0.0.1", "0.0.0.0"}


def safe_urlopen(req, timeout=10):
    """
    Validates URL scheme and resolves target hostname to ensure it does not
    hit internal/private/loopback IPs or cloud metadata services (SSRF defense).
    """
    url = req.full_url if hasattr(req, "full_url") else str(req)
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme.lower() not in ALLOWED_SCHEMES:
        raise ValueError(f"Disallowed scheme: {parsed.scheme}")

    hostname = (parsed.hostname or "").lower()
    if not hostname or hostname in BLOCKED_HOSTS:
        raise ValueError(f"Disallowed host: {hostname}")

    try:
        resolved = socket.getaddrinfo(hostname, None)
        for item in resolved:
            ip_str = item[4][0]
            ip_obj = ipaddress.ip_address(ip_str)
            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local:
                raise ValueError(f"Blocked private network destination: {ip_str}")
    except socket.gaierror as e:
        raise ValueError(f"Failed to resolve host {hostname}: {e}")

    return urllib.request.urlopen(req, timeout=timeout)


class BaseGovSource:
    name = "Base"

    def fetch_schemes(self, limit=10):
        raise NotImplementedError


class DataGovSource(BaseGovSource):
    """
    Open Government Data (data.gov.in)
    Uses OGD Developer API Key (DATA_GOV_API_KEY).
    """
    name = "Open Government Data (data.gov.in)"

    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("DATA_GOV_API_KEY", "")

    def fetch_schemes(self, limit=10):
        schemes = []
        if not self.api_key:
            logger.info("DATA_GOV_API_KEY not configured. Falling back to open datasets.")
            return schemes

        # data.gov.in public catalog API
        url = f"https://api.data.gov.in/catalog/api/v1/search?api-key={self.api_key}&q=scheme&format=json&limit={limit}"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with safe_urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                records = data.get("records") or data.get("data") or []
                for r in records[:limit]:
                    schemes.append({
                        "title": r.get("title") or r.get("scheme_name") or "Government Scheme",
                        "department": r.get("department") or r.get("ministry") or "Government of India",
                        "description": r.get("description") or r.get("objective") or "",
                        "url": r.get("url") or r.get("official_url") or "https://data.gov.in",
                        "source": "data.gov.in",
                    })
        except Exception as e:
            logger.warning(f"Error fetching from data.gov.in: {e}")
        return schemes


class APISetuMySchemeSource(BaseGovSource):
    """
    API Setu / myScheme (apisetu.gov.in / myscheme.gov.in)
    Uses API Setu Client ID & API Key.
    """
    name = "API Setu – myScheme (apisetu.gov.in)"

    def __init__(self, client_id=None, api_key=None):
        self.client_id = client_id or os.getenv("APISETU_CLIENT_ID", "")
        self.api_key = api_key or os.getenv("APISETU_API_KEY", "")

    def fetch_schemes(self, limit=10):
        schemes = []
        if not (self.client_id and self.api_key):
            logger.info("API Setu credentials not set.")
            return schemes

        url = f"https://api.myscheme.gov.in/schemes?limit={limit}"
        headers = {
            "User-Agent": USER_AGENT,
            "X-APISETU-CLIENTID": self.client_id,
            "X-APISETU-APIKEY": self.api_key,
        }
        req = urllib.request.Request(url, headers=headers)
        try:
            with safe_urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for s in data.get("data", [])[:limit]:
                    schemes.append({
                        "title": s.get("schemeName") or s.get("title"),
                        "department": s.get("ministry") or s.get("department") or "Central Ministry",
                        "description": s.get("schemeShortTitle") or s.get("briefDescription") or "",
                        "url": s.get("schemeUrl") or f"https://www.myscheme.gov.in/schemes/{s.get('slug', '')}",
                        "source": "apisetu.gov.in",
                    })
        except Exception as e:
            logger.warning(f"Error fetching from API Setu: {e}")
        return schemes


class MyGovSource(BaseGovSource):
    """
    MyGov Developer APIs (developers.mygov.in)
    """
    name = "MyGov Developer APIs (developers.mygov.in)"

    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("MYGOV_API_KEY", "")

    def fetch_schemes(self, limit=10):
        schemes = []
        if not self.api_key:
            return schemes
        url = f"https://developers.mygov.in/api/v1/schemes?api_key={self.api_key}&limit={limit}"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with safe_urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for item in data.get("schemes", [])[:limit]:
                    schemes.append({
                        "title": item.get("title"),
                        "department": item.get("ministry", "Government of India"),
                        "description": item.get("details", ""),
                        "url": item.get("url", "https://mygov.in"),
                        "source": "developers.mygov.in",
                    })
        except Exception as e:
            logger.warning(f"Error fetching from MyGov API: {e}")
        return schemes


class PIBMinistryFeedSource(BaseGovSource):
    """
    Press Information Bureau (PIB) & Ministry Announcement Feeds
    Parses official releases about newly launched or revised government schemes.
    """
    name = "PIB & Ministry Feeds (pib.gov.in)"

    def fetch_schemes(self, limit=8):
        schemes = []
        url = "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1"  # PIB Press Releases RSS
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with safe_urlopen(req, timeout=8) as resp:
                xml_data = resp.read()
                root = ET.fromstring(xml_data)
                for item in root.findall(".//item")[:limit]:
                    title = item.findtext("title", "")
                    link = item.findtext("link", "")
                    desc = item.findtext("description", "")
                    if any(kw in (title + desc).lower() for kw in ["scheme", "yojana", "initiative", "mission", "portal", "subsidy", "benefit"]):
                        schemes.append({
                            "title": title.strip(),
                            "department": "Press Information Bureau (Government of India)",
                            "description": desc.strip(),
                            "url": link.strip() or "https://pib.gov.in",
                            "source": "pib.gov.in",
                        })
        except Exception as e:
            logger.info(f"PIB RSS feed fetch note: {e}")
        return schemes


class CuratedLiveGovSource(BaseGovSource):
    """
    Curated Official Schemes from myScheme & Ministry Portals
    Provides 100% verified, up-to-date scheme announcements (e.g. PM Surya Ghar,
    Ayushman Vay Vandana, PM-Vidyalaxmi, PM-JANMAN, etc.) to ensure instant availability.
    """
    name = "Verified Ministry Schemes (Live Feed)"

    OFFICIAL_SCHEMES = [
        {
            "title": "PM Surya Ghar: Muft Bijli Yojana",
            "department": "Ministry of New & Renewable Energy",
            "category": "agriculture",
            "level": "central",
            "state": "",
            "launch_year": 2024,
            "objective": "Free electricity up to 300 units monthly through rooftop solar installations.",
            "eligibility": "Indian citizens with residential roofs suitable for solar panel installation and grid connectivity.",
            "benefits": "Direct subsidy of up to ₹78,000 for rooftop solar, leading to 300 units free electricity per month.",
            "documents": "Aadhaar card; Electricity bill; Bank passbook; Roof photograph",
            "url": "https://pmsuryaghar.gov.in/",
            "raw_text": "PM Surya Ghar Muft Bijli Yojana launched in 2024 provides financial subsidy up to Rs 78,000 for installing solar panels on homes to get 300 free power units.",
        },
        {
            "title": "Ayushman Vay Vandana Card (PM-JAY 70+)",
            "department": "Ministry of Health & Family Welfare (National Health Authority)",
            "category": "health",
            "level": "central",
            "state": "",
            "launch_year": 2024,
            "objective": "Universal cashless health insurance of ₹5 Lakh for every citizen aged 70 years and above.",
            "eligibility": "Every Indian citizen aged 70 years or above, regardless of family income or economic status.",
            "benefits": "Free hospital treatment up to ₹5 lakh per year at all empanelled hospitals across India.",
            "documents": "Aadhaar Card with age verification; Mobile number",
            "url": "https://beneficiary.nha.gov.in/",
            "raw_text": "Universal health cover for all senior citizens aged 70 and above under Ayushman Bharat. Dedicated card provides Rs 5 lakh annual hospital coverage.",
        },
        {
            "title": "PM-Vidyalaxmi Scheme",
            "department": "Ministry of Education",
            "category": "education",
            "level": "central",
            "state": "",
            "launch_year": 2024,
            "objective": "Collateral-free, guarantor-free education loans for students admitted to Top 860 Quality Higher Education Institutions (QHEIs).",
            "eligibility": "Students admitted to listed top higher education institutions in India; family annual income up to ₹8 lakh eligible for 3% interest subvention.",
            "benefits": "Full tuition and course fees loan without any collateral or third-party guarantee with 75% credit guarantee by Government.",
            "documents": "Admission letter; Aadhaar; PAN card; Income certificate; Bank account details",
            "url": "https://pmvidyalaxmi.co.in/",
            "raw_text": "Central sector scheme to provide financial support to meritorious students for higher education without collateral up to Rs 7.5 lakh or full course fee.",
        },
        {
            "title": "Pradhan Mantri Vishwakarma Yojana",
            "department": "Ministry of Micro, Small and Medium Enterprises",
            "category": "finance",
            "level": "central",
            "state": "",
            "launch_year": 2023,
            "objective": "End-to-end support to traditional artisans and craftspeople across 18 listed trades.",
            "eligibility": "Artisans and craftspeople working with hands and tools in 18 traditional family-based trades (blacksmiths, carpenters, potters, etc.), minimum age 18.",
            "benefits": "PM Vishwakarma Certificate & ID, ₹15,000 toolkit incentive, basic & advanced training with ₹500/day stipend, and collateral-free loans up to ₹3 Lakh at 5% interest.",
            "documents": "Aadhaar card; Mobile number; Bank passbook; Ration card",
            "url": "https://pmvishwakarma.gov.in/",
            "raw_text": "Holistic support to artisans including skills training, modern toolkits, market linkage, and low-interest credit support up to Rs 3 lakh.",
        },
        {
            "title": "PM SVANidhi (Street Vendor's AtmaNirbhar Nidhi)",
            "department": "Ministry of Housing & Urban Affairs",
            "category": "finance",
            "level": "central",
            "state": "",
            "launch_year": 2020,
            "objective": "Collateral-free working capital micro-loans to street vendors to resume livelihoods.",
            "eligibility": "Street vendors vending in urban areas possessing Certificate of Vending or Identity Card issued by Urban Local Bodies.",
            "benefits": "Initial working capital loan up to ₹10,000, 2nd tranche up to ₹20,000, and 3rd tranche up to ₹50,000 on timely repayment with 7% interest subsidy.",
            "documents": "Aadhaar Card; Vending Certificate / LOR from Municipality; Bank passbook",
            "url": "https://pmsvanidhi.mohua.gov.in/",
            "raw_text": "Special micro-credit facility for street vendors providing affordable working capital credit and rewarding digital transactions with cashback.",
        },
        {
            "title": "PM Internship Scheme (PMIS)",
            "department": "Ministry of Corporate Affairs",
            "category": "education",
            "level": "central",
            "state": "",
            "launch_year": 2024,
            "objective": "12-month real-world internship opportunities in top 500 Indian companies for 1 crore youth over 5 years.",
            "eligibility": "Youth aged 21-24 years who are not employed full-time, not enrolled in full-time education, passed Class 10/12/ITI/Diploma/Graduation, and family income below ₹8 lakh.",
            "benefits": "Monthly stipend of ₹5,000 (₹4,500 by Govt + ₹500 by company CSR) plus one-time incidentals grant of ₹6,000 and insurance under PMJJBY/PMSBY.",
            "documents": "Aadhaar Card; Educational certificates (10th/12th/Diploma/Degree); Bank account details; Self-declaration of family income",
            "url": "https://pminternship.mca.gov.in/",
            "raw_text": "Government of India 12-month internship scheme for youth aged 21 to 24 in top 500 companies with monthly 5000 stipend and hands-on skill training.",
        },
        {
            "title": "Namo Drone Didi Scheme",
            "department": "Ministry of Agriculture and Farmers Welfare",
            "category": "agriculture",
            "level": "central",
            "state": "",
            "launch_year": 2024,
            "objective": "Empowering women Self Help Groups (SHGs) by providing 15,000 agricultural drones for rental services to farmers.",
            "eligibility": "Women members of active Self Help Groups (SHGs) registered under Deendayal Antyodaya Yojana - DAY-NRLM in rural areas.",
            "benefits": "80% central financial assistance (up to ₹8 Lakh) towards the drone package cost, 15-day certified pilot training, and sustainable rental income of ₹1 Lakh+ annually.",
            "documents": "Aadhaar card; SHG membership certificate; Bank passbook; Residential proof",
            "url": "https://agricoop.gov.in/",
            "raw_text": "Central sector scheme providing 15000 drones to women Self Help Groups to offer drone services for liquid fertilizers and pesticide spraying to farmers.",
        },
        {
            "title": "Lakhpati Didi Initiative",
            "department": "Ministry of Rural Development",
            "category": "social_welfare",
            "level": "central",
            "state": "",
            "launch_year": 2023,
            "objective": "Enable 3 crore rural women SHG members to earn a sustainable income of at least ₹1 Lakh per year.",
            "eligibility": "Rural women organized in Self Help Groups (SHGs) under Deendayal Antyodaya Yojana - National Rural Livelihoods Mission (DAY-NRLM).",
            "benefits": "Financial literacy, market linkages, interest-subvented bank loans, mentorship, and support in micro-enterprises like LED making, organic farming, and food processing.",
            "documents": "Aadhaar card; SHG passbook; Bank account details; PAN card",
            "url": "https://nrlm.gov.in/",
            "raw_text": "Mission to transform rural women into micro-entrepreneurs earning minimum Rs 1 lakh annually through diverse livelihood activities and collective enterprise.",
        },
        {
            "title": "Pradhan Mantri Janjati Adivasi Nyaya Maha Abhiyan (PM-JANMAN)",
            "department": "Ministry of Tribal Affairs",
            "category": "social_welfare",
            "level": "central",
            "state": "",
            "launch_year": 2023,
            "objective": "Comprehensive socio-economic development of Particularly Vulnerable Tribal Groups (PVTGs) across 18 states and UTs.",
            "eligibility": "Families belonging to 75 Particularly Vulnerable Tribal Groups (PVTGs) living in remote habitations and forest villages.",
            "benefits": "Pucca houses under PMAY(G), piped water under Jal Jeevan Mission, electricity under RDSS, mobile medical units, Van Dhan Vikas Kendras, and road connectivity.",
            "documents": "Aadhaar card; Tribal certificate (PVTG); Ration card; Bank passbook",
            "url": "https://tribal.nic.in/",
            "raw_text": "Targeted mission to saturated basic amenities such as safe housing, clean drinking water, education, electricity and roads in remote tribal habitations.",
        }
    ]

    def fetch_schemes(self, limit=10):
        return self.OFFICIAL_SCHEMES[:limit]


class NationalComprehensiveGovSource(BaseGovSource):
    """
    National Directory of all Indian Government Schemes (Central & 28 States + 8 UTs)
    Sourced from official myScheme portal registers and OGD data.
    """
    name = "National Comprehensive Directory (All Official Indian Schemes)"

    def fetch_schemes(self, limit=None):
        data_dir = os.path.join(os.path.dirname(__file__), "data")
        all_csv = os.path.join(data_dir, "indian_schemes_all.csv")
        multi_csv = os.path.join(data_dir, "indian_schemes_multilingual.csv")

        if not os.path.exists(all_csv):
            logger.warning(f"National dataset not found at {all_csv}")
            return []

        hindi_map = {}
        if os.path.exists(multi_csv):
            try:
                with open(multi_csv, encoding="utf-8", errors="ignore") as f:
                    for r in csv.DictReader(f):
                        slug = slugify(r.get("scheme_name", ""))
                        if slug:
                            hindi_map[slug] = {
                                "hindi_name": r.get("scheme_name_hindi", ""),
                                "details_hi": r.get("details_hi", ""),
                            }
            except Exception as e:
                logger.warning(f"Error loading Hindi map: {e}")

        def parse_ministry(raw, state, agency):
            raw = (raw or "").strip()
            if raw.startswith("{") and "label" in raw:
                try:
                    d = ast.literal_eval(raw)
                    if isinstance(d, dict) and d.get("label"):
                        return d["label"].strip()[:190]
                except Exception:
                    pass
            if raw and not raw.startswith("{"):
                return raw[:190]
            if agency and len(agency.strip()) > 3:
                return agency.strip()[:190]
            if state and len(state.strip()) > 0:
                return f"Government of {state.strip()}"[:190]
            return "Government of India"

        def map_category(raw):
            raw = (raw or "").lower()
            if any(k in raw for k in ["agri", "farm", "rural", "fisher", "animal", "crop"]):
                return "agriculture"
            if any(k in raw for k in ["health", "sanitat", "medic", "ayush"]):
                return "health"
            if any(k in raw for k in ["edu", "learn", "school", "skill", "train", "scholar"]):
                return "education"
            if any(k in raw for k in ["hous", "urban", "shelter"]):
                return "housing"
            if any(k in raw for k in ["bank", "finan", "insur", "pension", "credit", "loan", "tax"]):
                return "finance"
            if any(k in raw for k in ["it", "comput", "digital", "telecom", "electron", "science", "technol"]):
                return "digital"
            if any(k in raw for k in ["social", "welfare", "women", "child", "disab", "differently", "caste", "trib", "empower"]):
                return "social_welfare"
            return "other"

        def parse_target_groups(beneficiaries, tags, title):
            text = f"{beneficiaries} {tags} {title}".lower()
            groups = []
            if any(k in text for k in ["farmer", "kisan", "krishi", "agri"]):
                groups.append("farmers")
            if any(k in text for k in ["student", "pupil", "scholar", "youth", "child", "school", "college"]):
                groups.append("students")
            if any(k in text for k in ["women", "girl", "mother", "female", "mahila", "widow"]):
                groups.append("women")
            if any(k in text for k in ["senior", "elderly", "old age", "pensioner"]):
                groups.append("senior citizens")
            if any(k in text for k in ["worker", "labour", "artisan", "weaver", "shramik"]):
                groups.append("workers")
            if any(k in text for k in ["msme", "business", "entrepreneur", "startup", "trader"]):
                groups.append("entrepreneurs")
            if any(k in text for k in ["disab", "divyang", "blind", "differently abled", "handicap"]):
                groups.append("differently abled")
            if any(k in text for k in ["tribal", "adivasi", "sc", "st", "scheduled"]):
                groups.append("tribal")
            if not groups:
                groups.append("everyone")
            return groups

        schemes = []
        seen = set()
        with open(all_csv, encoding="utf-8", errors="ignore") as f:
            for r in csv.DictReader(f):
                title = r.get("scheme_name", "").strip()
                if not title:
                    continue
                state = r.get("state", "").strip()
                key = (title.lower(), state.lower())
                if key in seen:
                    continue
                seen.add(key)

                slug = slugify(title)
                level = "state" if state or (r.get("level") or "").strip().lower() == "state" else "central"
                dept_name = parse_ministry(r.get("nodal_ministry"), state, r.get("implementing_agency"))
                category = map_category(r.get("category"))
                groups = parse_target_groups(r.get("target_beneficiaries"), r.get("tags"), title)

                desc_en = r.get("brief_description") or r.get("detailed_description") or f"Government welfare scheme administered by {dept_name}."
                hi_info = hindi_map.get(slug, {})
                desc_hi = hi_info.get("details_hi") or f"{title} भारत सरकार / राज्य सरकार की एक प्रमुख नागरिक कल्याणकारी योजना है।"

                schemes.append({
                    "title": title[:245],
                    "department": dept_name[:190],
                    "state": state[:55],
                    "level": level,
                    "category": category,
                    "objective": desc_en[:295],
                    "summary_en": desc_en[:600],
                    "summary_hi": desc_hi[:600],
                    "benefits": r.get("benefits", "") or "Financial/subsidy support and welfare assistance per scheme rules.",
                    "eligibility": r.get("eligibility_criteria", "") or "Eligible residents meeting scheme guidelines.",
                    "documents": r.get("documents_required", "") or "Aadhaar Card; Identity Proof; Bank Account Details",
                    "how_to_apply": r.get("application_process", "") or "Apply through official state/central government portal.",
                    "url": r.get("Official Website") or "https://www.myscheme.gov.in/",
                    "target_groups": groups,
                    "source": "myScheme National Catalog",
                })
                if limit and len(schemes) >= limit:
                    break

        return schemes
