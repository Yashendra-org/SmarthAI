"use strict";

/* ==========================================================================
   Smarth AI — National Policy Portal & Civic Tech Guide
   Frontend Architecture: Modernized Vanilla JS SPA Renderer
   Preserves: Theme, Data Contracts, Storage Keys, and Routing Dispatch
   ========================================================================== */

const D = window.DATA, $ = (s, p = document) => p.querySelector(s), $$ = (s, p = document) => [...p.querySelectorAll(s)];

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[c]));

const safeUrl = u => {
  if (!u) return "#";
  try {
    const p = new URL(u, window.location.origin);
    return (p.protocol === "http:" || p.protocol === "https:") ? p.href : "#";
  } catch (e) {
    return "#";
  }
};

/* LocalStorage Persistence Wrapper */
const S = {
  get(k, d) {
    try {
      const v = localStorage.getItem("sm_" + k);
      return v === null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem("sm_" + k, JSON.stringify(v));
    } catch { }
  }
};

/* Modern Lucide-Style SVG Icon System */
const SVG_ICONS = {
  home: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  schemes: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
  compare: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>`,
  checklist: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>`,
  eligibility: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`,
  assistant: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,
  services: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
  feedback: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  dashboard: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
  admin: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  search: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  bookmark: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
  external: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  mic: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`,
  send: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  volume: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
  volumeX: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  printer: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>`,
  share: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
  sparkles: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`,
  check: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><polyline points="20 6 9 17 4 12"/></svg>`,
  info: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
  alertTriangle: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-ic"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
};

/* Translation Dictionary */
const TX = {
  en: {
    compare: "Compare",
    checklist: "Doc Checklist",
    home: "Home",
    schemes: "Schemes",
    eligibility: "Eligibility",
    assistant: "AI Assistant",
    services: "Services",
    feedback: "Feedback",
    dashboard: "My Dashboard",
    admin: "Admin",
    h1: "Discover. Understand. Check eligibility. Apply officially.",
    sub: "Explore 1,868+ verified Indian Central and State government welfare schemes. Simplified benefits, plain-words clauses, and direct .gov.in application portals.",
    search: "Search schemes by name, benefit, or keyword (e.g. 'PM Kisan ₹6000', 'Ayushman 70+')…"
  },
  hi: {
    compare: "तुलना",
    checklist: "दस्तावेज़ चेकलिस्ट",
    home: "होम",
    schemes: "योजनाएँ",
    eligibility: "पात्रता",
    assistant: "AI सहायक",
    services: "सेवाएँ",
    feedback: "प्रतिक्रिया",
    dashboard: "मेरा डैशबोर्ड",
    admin: "एडमिन",
    h1: "खोजें. समझें. पात्रता जाँचें. आधिकारिक रूप से आवेदन करें.",
    sub: "भारत सरकार एवं राज्य सरकारों की 1,868+ योजनाएँ खोजें, सरल शब्दों में लाभ समझें और बिना बिचौलियों के सीधे आधिकारिक सरकारी पोर्टल से आवेदन करें।",
    search: "योजना का नाम या लाभ लिखकर खोजें (जैसे: 'पीएम किसान ₹6000', 'आयुष्मान 70+')…"
  }
};

let lang = S.get("lang", "en");
const t = k => TX[lang][k] || TX.en[k] || k;

/* Accessible Floating Toast */
const toast = m => {
  const e = $("#toast");
  if (!e) return;
  e.innerHTML = `<span class="toast-dot"></span><span>${esc(m)}</span>`;
  e.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => e.classList.remove("show"), 2600);
};

/* Admin Cache & Scheme Ingestion State */
const ADM = () => S.get("adm", { custom: [], hidden: [], deleted: [] });
D.all = [...D.schemes];

const indexSchemes = () => {
  D.schemes.forEach(s => {
    s._s = (
      (s.name || "") + " " +
      (s.desc || "") + " " +
      (s.desc_hi || "") + " " +
      (s.dept || "") + " " +
      (s.benefit || "") + " " +
      (s.state || "") + " " +
      (D.cats[s.cat] || "")
    ).toLowerCase();
  });
};

const applyAdm = () => {
  const m = ADM();
  D.schemes = [...D.all.filter(s => !m.deleted.includes(s.id)), ...m.custom].filter(s => !m.hidden.includes(s.id));
  indexSchemes();
};
applyAdm();

const byId = id => D.schemes.find(s => s.id === id);
const push = (k, v, max = 10) => {
  const a = S.get(k, []).filter(x => x !== v && JSON.stringify(x) !== JSON.stringify(v));
  a.unshift(v);
  S.set(k, a.slice(0, max));
};

/* Category Emojis / Visuals */
const ICON = {
  agriculture: "🌾",
  education: "🎓",
  health: "🩺",
  housing: "🏠",
  women: "👩",
  employment: "💼",
  finance: "💰",
  senior: "🧓",
  social: "🛡️",
  business: "🏭",
  rural: "🏘️"
};

/* Modern Stroke Icons mapped to Navigation items */
const NI = {
  home: SVG_ICONS.home,
  schemes: SVG_ICONS.schemes,
  compare: SVG_ICONS.compare,
  checklist: SVG_ICONS.checklist,
  eligibility: SVG_ICONS.eligibility,
  assistant: SVG_ICONS.assistant,
  services: SVG_ICONS.services,
  feedback: SVG_ICONS.feedback,
  dashboard: SVG_ICONS.dashboard,
  admin: SVG_ICONS.admin
};

const GL = {
  farmer: ["Farmers", "किसान"],
  student: ["Students", "छात्र"],
  women: ["Women & girls", "महिलाएँ"],
  senior: ["Senior citizens", "बुजुर्ग"],
  worker: ["Workers", "श्रमिक"],
  business: ["Entrepreneurs", "उद्यमी"],
  housing: ["Housing seekers", "आवास"],
  everyone: ["Everyone", "सभी"]
};

const GI = {
  farmer: "🌾",
  student: "🎓",
  women: "👩",
  senior: "🧓",
  worker: "👷",
  business: "🏭",
  housing: "🏠",
  everyone: "🇮🇳"
};

const GM = {
  "pm-kisan": ["farmer"],
  pmfby: ["farmer"],
  "ab-pmjay": ["everyone", "senior"],
  pmay: ["housing"],
  ssy: ["women"],
  pmuy: ["women"],
  apy: ["worker", "senior"],
  mudra: ["business"],
  nsp: ["student"],
  pmjdy: ["everyone"],
  pmvishwakarma: ["business", "worker"],
  pmkvy: ["student", "worker"],
  mgnrega: ["worker", "farmer"]
};

const CG = {
  agriculture: ["farmer"],
  education: ["student"],
  women: ["women"],
  senior: ["senior"],
  employment: ["worker"],
  business: ["business"],
  housing: ["housing"]
};

const whoOf = s => GM[s.id] || CG[s.cat] || ["everyone"];
const gl = k => GL[k][lang === "hi" ? 1 : 0];

const VER = "2026-11-14";
const ver = () => {
  const d = Math.floor((Date.now() - new Date(VER)) / 864e5);
  return d > 90
    ? `<span class="vb old">${SVG_ICONS.alertTriangle} Verified directory record (${d} days ago)</span>`
    : `<span class="vb">${SVG_ICONS.check} Verified official directory record</span>`;
};

const fmtBenefit = b => {
  if (!b) return "";
  let clean = String(b)
    .replace(/\ufffd+/g, "₹")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^[•\-\*]\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  clean = clean.replace(/₹\s*(\d)/g, "₹$1");
  return esc(clean);
};

/* Upgraded Scheme Card Component */
const card = s => `
<article class="card modern-scheme-card" data-id="${esc(s.id)}">
  <div class="card-top-row">
    <div class="ic-badge" title="${esc(D.cats[s.cat] || s.cat)}">${ICON[s.cat] || "📌"}</div>
    <div class="card-tags">
      <span class="tag lvl ${s.lvl === 'Central' ? 'tag-central' : 'tag-state'}">${esc(s.lvl)}</span>
      <span class="tag cat">${esc(D.cats[s.cat] || s.cat)}</span>
      ${s.state ? `<span class="tag loc">📍 ${esc(s.state)}</span>` : ""}
    </div>
  </div>
  <h3 class="card-title">${esc(s.name)}</h3>
  <div class="ben">${fmtBenefit(s.benefit)}</div>
  <div class="mu dept">${esc(s.dept)}</div>
  <div class="card-actions">
    <a class="btn pri btn-scheme-view" href="scheme.html?id=${encodeURIComponent(s.id)}">
      <span>View Details</span>
      ${SVG_ICONS.arrowRight}
    </a>
    <label class="cmp" title="Select to compare side by side">
      <input type="checkbox" data-cmp="${esc(s.id)}"${S.get("cmp", []).includes(s.id) ? " checked" : ""}>
      <span class="cmp-text">${t("compare")}</span>
    </label>
  </div>
</article>`;

const NAV = [
  ["index", "home"],
  ["schemes", "schemes"],
  ["compare", "compare"],
  ["checklist", "checklist"],
  ["eligibility", "eligibility"],
  ["assistant", "assistant"],
  ["services", "services"],
  ["feedback", "feedback"],
  ["dashboard", "dashboard"],
  ["admin", "admin"]
];

let currentOfficerUser = null;

/* Accessibility & Display Preferences */
const applyPrefs = () => {
  document.documentElement.style.fontSize = S.get("font", 16) + "px";
  document.documentElement.lang = lang;
};

if ($("#bLang")) {
  $("#bLang").onclick = () => {
    lang = lang === "en" ? "hi" : "en";
    S.set("lang", lang);
    route();
    toast(lang === "hi" ? "भाषा हिंदी चुनी गई" : "Language set to English");
  };
}

if ($("#bFontP")) {
  $("#bFontP").onclick = () => {
    const cur = S.get("font", 16);
    if (cur < 22) {
      S.set("font", cur + 1);
      applyPrefs();
      toast(`Text size increased (${cur + 1}px)`);
    }
  };
}

if ($("#bFontM")) {
  $("#bFontM").onclick = () => {
    const cur = S.get("font", 16);
    if (cur > 13) {
      S.set("font", cur - 1);
      applyPrefs();
      toast(`Text size decreased (${cur - 1}px)`);
    }
  };
}

/* Mobile Navigation Toggle Handler */
function initMobileMenu() {
  const bMenu = $("#bMenu");
  const nav = $("#nav");
  const backdrop = $("#nav-backdrop");
  const header = $("#site-header");

  if (!bMenu || !nav) return;

  const toggle = (open) => {
    const isOpen = open !== undefined ? open : !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", isOpen);
    if (backdrop) backdrop.classList.toggle("is-open", isOpen);
    if (header) header.classList.toggle("menu-open", isOpen);
    bMenu.setAttribute("aria-expanded", isOpen ? "true" : "false");
    document.body.classList.toggle("no-scroll", isOpen);
  };

  bMenu.onclick = () => toggle();
  if (backdrop) backdrop.onclick = () => toggle(false);

  // Close drawer when a nav link is clicked
  nav.addEventListener("click", e => {
    if (e.target.closest("a")) toggle(false);
  });
}

/* ==========================================================================
   Page Renderers (V Object Dispatched by body[data-page])
   ========================================================================== */
const V = {};

/* 7.1 Home View */
V.home = () => {
  const pop = D.schemes.slice(0, 6);
  return `
  <section class="hero modern-hero-card">
    <div class="ht">
      <div class="eyebrow-pill">
        <span class="eyebrow-dot"></span>
        <span>भारत सरकार एवं राज्य सरकार की योजनाएँ · ${D.schemes.length} Official Schemes</span>
      </div>
      <h1 class="hero-heading">${t("h1")}</h1>
      <p class="hero-sub">${t("sub")}</p>
      
      <form class="bar modern-search-bar" id="hs">
        <div class="search-input-wrap">
          <span class="search-icon-inside">${SVG_ICONS.search}</span>
          <input id="hq" placeholder="${esc(t("search"))}" aria-label="Search government schemes" autocomplete="off">
          <button type="button" id="hq-clear" class="btn-input-clear" style="display:none" title="Clear">✕</button>
        </div>
        <button type="submit" class="btn pri btn-search-submit">
          <span>Search Directory</span>
          ${SVG_ICONS.arrowRight}
        </button>
      </form>

      <div class="quick-tags">
        <span class="quick-tag-label">Try searching:</span>
        <button type="button" class="quick-tag" data-q="PM Kisan ₹6000">🌾 PM Kisan ₹6000</button>
        <button type="button" class="quick-tag" data-q="Ayushman 70+">🏥 Ayushman 70+</button>
        <button type="button" class="quick-tag" data-q="Free Solar">☀️ PM Surya Ghar</button>
        <button type="button" class="quick-tag" data-q="Mudra loan">💼 Mudra Business Loan</button>
      </div>

      <div class="steps-tracker">
        <span class="step-chip"><b class="step-num">1</b> Discover</span>
        <span class="step-arrow">➔</span>
        <span class="step-chip"><b class="step-num">2</b> Understand</span>
        <span class="step-arrow">➔</span>
        <span class="step-chip"><b class="step-num">3</b> Eligibility</span>
        <span class="step-arrow">➔</span>
        <span class="step-chip"><b class="step-num">4</b> Readiness</span>
        <span class="step-arrow">➔</span>
        <span class="step-chip"><b class="step-num">5</b> Apply</span>
      </div>

      <div class="hero-cta-row">
        <a class="btn pri hero-primary-btn" href="eligibility.html">
          <span>Evaluate Your Eligibility</span>
          ${SVG_ICONS.arrowRight}
        </a>
        <a class="btn sec-btn hero-assistant-btn" href="assistant.html">
          <img src="/static/img/assistant-avatar.svg" width="22" height="22" alt="Guide">
          <span>Ask Smarth AI Guide</span>
        </a>
      </div>
    </div>

    <div class="stambhwrap">
      <div class="stambh-frame">
        <img src="/static/img/ashoka-stambh.jpg" alt="National Emblem of India" class="stambh-photo" loading="lazy">
        <div class="stambh-badge">
          <b>सत्यमेव जयते</b>
          <span>Official Public Welfare Directory</span>
        </div>
      </div>
    </div>
  </section>

  <section class="section-container">
    <div class="section-header">
      <h2 class="section-title">Browse by Category</h2>
      <p class="mu section-sub">Explore targeted schemes filtered across primary economic, health, and social welfare categories.</p>
    </div>
    <div class="grid cats">
      ${Object.entries(D.cats).map(([k, v]) => `
        <a class="card tile modern-tile" href="schemes.html?cat=${encodeURIComponent(k)}">
          <div class="tile-icon-box">${ICON[k] || "🏛️"}</div>
          <div class="tile-content">
            <b class="tile-name">${esc(v)}</b>
            <span class="tile-count">${D.schemes.filter(s => s.cat === k).length} schemes</span>
          </div>
          <span class="tile-hover-arrow">${SVG_ICONS.arrowRight}</span>
        </a>
      `).join("")}
    </div>
  </section>

  <section class="section-container">
    <div class="section-header">
      <h2 class="section-title">Browse by Citizen Profile</h2>
      <p class="mu section-sub">Direct access to benefits designed specifically for your demographic or occupational group.</p>
    </div>
    <div class="chips profile-chips">
      ${Object.keys(GL).map(k => `
        <a class="chip modern-chip" href="schemes.html?who=${encodeURIComponent(k)}">
          <span class="chip-avatar">${GI[k]}</span>
          <span class="chip-label">${esc(gl(k))}</span>
          <span class="chip-count">${D.schemes.filter(s => whoOf(s).includes(k)).length}</span>
        </a>
      `).join("")}
    </div>
  </section>

  <section class="section-container">
    <div class="section-header">
      <h2 class="section-title">Citizen Smart Tools</h2>
      <p class="mu section-sub">Interactive decision tools to prepare your application with zero rejection risk.</p>
    </div>
    <div class="grid tools-grid">
      ${[
        ["compare.html", "Compare Schemes", "Put two or three schemes side by side: compare financial benefits, eligibility criteria, and common required documents.", SVG_ICONS.compare, "Open Comparison Matrix ➔"],
        ["checklist.html", "Document Readiness Checker", "Tick the documents you have on hand and resolve missing certificate blockers before visiting official portals.", SVG_ICONS.checklist, "Start Readiness Audit ➔"]
      ].map(x => `
        <div class="card modern-tool-card">
          <div class="tool-card-header">
            <div class="tool-icon-circle">${x[3]}</div>
            <div><h3 style="margin:0">${x[1]}</h3></div>
          </div>
          <p class="mu">${x[2]}</p>
          <div style="margin-top:auto;padding-top:1rem">
            <a class="btn pri tool-btn" href="${x[0]}">${x[4]}</a>
          </div>
        </div>
      `).join("")}
    </div>
  </section>

  <section class="section-container">
    <div class="section-header">
      <h2 class="section-title">How Smarth AI Works</h2>
      <p class="mu section-sub">Four structured steps to discover, verify, and secure your entitled public benefits.</p>
    </div>
    <div class="grid process-grid">
      ${[
        ["1", "Discover", `Explore ${D.schemes.length} Central & State welfare schemes indexed by department and beneficiary group.`, "schemes.html"],
        ["2", "Understand", "Read simplified benefits, gazette clause breakdowns, and fine print translated into plain words.", "schemes.html"],
        ["3", "Check Eligibility", "Verify age, income, category, and residential requirements instantaneously.", "eligibility.html"],
        ["4", "Apply Officially", "Access direct links to verified .gov.in and .nic.in portals with zero middleman friction.", "schemes.html"]
      ].map(x => `
        <a class="card process-card" href="${x[3]}">
          <div class="step-num-badge">${x[0]}</div>
          <b>${x[1]}</b>
          <span class="mu">${x[2]}</span>
        </a>
      `).join("")}
    </div>
  </section>

  <section class="section-container">
    <div class="section-header">
      <h2 class="section-title">Popular &amp; High-Impact Schemes</h2>
      <p class="mu section-sub">Frequently accessed national programs with direct financial transfers and healthcare support.</p>
    </div>
    <div class="grid">${pop.map(card).join("")}</div>
  </section>

  <section class="section-container">
    <div class="section-header">
      <h2 class="section-title">Frequently Asked Questions</h2>
      <p class="mu section-sub">Clear answers on portal independence, data security, and official application procedures.</p>
    </div>
    <div class="faq-list">
      ${D.faq.map(f => `
        <details class="modern-faq">
          <summary>${esc(f[0])}</summary>
          <div class="faq-body"><p>${esc(f[1])}</p></div>
        </details>
      `).join("")}
    </div>
  </section>`;
};

V.home.after = () => {
  const form = $("#hs"), input = $("#hq"), clearBtn = $("#hq-clear");
  if (form && input) {
    form.onsubmit = e => {
      e.preventDefault();
      location.href = "schemes.html?q=" + encodeURIComponent(input.value.trim());
    };
    input.addEventListener("input", () => {
      if (clearBtn) clearBtn.style.display = input.value.trim() ? "block" : "none";
    });
    if (clearBtn) {
      clearBtn.onclick = () => {
        input.value = "";
        clearBtn.style.display = "none";
        input.focus();
      };
    }
  }
  $$(".quick-tag").forEach(b => {
    b.onclick = () => {
      location.href = "schemes.html?q=" + encodeURIComponent(b.dataset.q || b.textContent);
    };
  });
};

/* 7.2 Schemes Explorer View */
V.schemes = p => {
  const states = [...new Set(D.schemes.map(s => s.state).filter(Boolean))].sort();
  return `
  <div class="page-header">
    <div class="page-title-badge">📂 National Schemes Catalog</div>
    <h1>${t("schemes")} <span class="mu counter-badge" id="catalog-count">(${D.schemes.length} total)</span></h1>
    <p class="mu page-sub">Search, filter, and compare verified Central and State welfare programs across India.</p>
  </div>

  <div class="bar filter-panel" id="filter-bar">
    <div class="filter-search-wrap">
      <span class="search-icon-inside">${SVG_ICONS.search}</span>
      <input id="q" placeholder="${esc(t("search"))}" value="${esc(p.get("q") || "")}" aria-label="Search schemes">
      <button type="button" id="q-clear" class="btn-input-clear" style="${p.get("q") ? "" : "display:none"}" title="Clear">✕</button>
    </div>
    <select id="cat" aria-label="Category filter">
      <option value="">All Categories</option>
      ${Object.entries(D.cats).map(([k, v]) => `<option value="${k}"${p.get("cat") === k ? " selected" : ""}>${v}</option>`).join("")}
    </select>
    <select id="lvl" aria-label="Level filter">
      <option value="">Central &amp; State</option>
      <option value="Central">Central Govt</option>
      <option value="State">State Govt</option>
    </select>
    <select id="st" aria-label="State filter">
      <option value="">All States &amp; UTs</option>
      ${states.map(s => `<option value="${esc(s)}"${p.get("state") === s ? " selected" : ""}>${esc(s)}</option>`).join("")}
    </select>
    <select id="who" aria-label="Target Group filter">
      <option value="">All Beneficiary Groups</option>
      ${Object.keys(GL).map(k => `<option value="${k}"${p.get("who") === k ? " selected" : ""}>${gl(k)}</option>`).join("")}
    </select>
    <select id="sort" aria-label="Sort order">
      <option value="">Sort: Default</option>
      <option value="az">Sort: Name (A–Z)</option>
    </select>
    <button type="button" id="btn-reset-filters" class="btn btn-quiet" title="Clear all filters">Clear Filters</button>
  </div>

  <div class="active-filter-summary" id="filter-summary"></div>
  <div id="list" class="grid schemes-grid"></div>`;
};

V.schemes.after = () => {
  let pageLimit = 48, deb;
  const qEl = $("#q"), qClear = $("#q-clear"), summaryEl = $("#filter-summary");

  const draw = (resetPage = true) => {
    if (resetPage) pageLimit = 48;
    const q = (qEl?.value || "").trim().toLowerCase(),
      c = $("#cat")?.value || "",
      l = $("#lvl")?.value || "",
      st = $("#st")?.value || "",
      so = $("#sort")?.value || "",
      w = $("#who")?.value || "";

    if (qClear) qClear.style.display = q ? "block" : "none";
    if (q) push("searches", q, 8);

    let r = D.schemes.filter(s =>
      (!c || s.cat === c) &&
      (!l || s.lvl === l) &&
      (!st || s.state === st) &&
      (!w || whoOf(s).includes(w)) &&
      (!q || (s._s ? s._s.includes(q) : (s.name + s.desc + s.dept).toLowerCase().includes(q)))
    );

    if (so === "az") r = [...r].sort((a, b) => a.name.localeCompare(b.name));

    // Update active filter summary chips
    const activeFilters = [];
    if (q) activeFilters.push(`Keyword: "<b>${esc(q)}</b>"`);
    if (c) activeFilters.push(`Category: <b>${esc(D.cats[c] || c)}</b>`);
    if (l) activeFilters.push(`Level: <b>${esc(l)}</b>`);
    if (st) activeFilters.push(`State: <b>${esc(st)}</b>`);
    if (w) activeFilters.push(`Group: <b>${esc(gl(w))}</b>`);

    if (summaryEl) {
      if (activeFilters.length) {
        summaryEl.innerHTML = `
          <div class="filter-tags-row">
            <span class="filter-count-text">Found <b>${r.length}</b> schemes matching:</span>
            ${activeFilters.map(f => `<span class="active-filter-pill">${f}</span>`).join("")}
          </div>
        `;
      } else {
        summaryEl.innerHTML = `<p class="mu" style="font-size:0.88rem;margin:0.2rem 0">Showing all <b>${r.length}</b> verified welfare schemes</p>`;
      }
    }

    const visible = r.slice(0, pageLimit);
    let html = visible.map(card).join("");

    if (r.length > pageLimit) {
      html += `
        <div class="load-more-container" style="grid-column:1/-1;text-align:center;padding:2rem 1rem">
          <p class="mu">Displaying <b>${visible.length}</b> of <b>${r.length}</b> matching schemes</p>
          <button id="btn-load-more" class="btn pri btn-large">
            Load More Schemes (+${Math.min(48, r.length - pageLimit)} more)
          </button>
        </div>`;
    }

    const listEl = $("#list");
    if (listEl) {
      listEl.innerHTML = r.length
        ? html
        : `<div class="sec empty-sec" style="grid-column:1/-1">
            <div class="empty-icon">${SVG_ICONS.search}</div>
            <h2>No matching schemes found</h2>
            <p class="mu">Try adjusting your search keywords, clearing selected filters, or searching in Hindi.</p>
            <button id="btn-empty-clear" class="btn pri" style="margin-top:1rem">Reset All Filters</button>
          </div>`;
    }

    const lm = $("#btn-load-more");
    if (lm) lm.onclick = () => { pageLimit += 48; draw(false); };
    const emc = $("#btn-empty-clear");
    if (emc) emc.onclick = resetFilters;
  };

  const resetFilters = () => {
    if (qEl) qEl.value = "";
    ["cat", "lvl", "st", "who", "sort"].forEach(id => {
      const el = $("#" + id);
      if (el) el.value = "";
    });
    draw(true);
  };

  if (qEl) {
    qEl.addEventListener("input", () => {
      clearTimeout(deb);
      deb = setTimeout(() => draw(true), 120);
    });
  }
  if (qClear) qClear.onclick = () => { if (qEl) { qEl.value = ""; draw(true); qEl.focus(); } };
  ["cat", "lvl", "st", "who", "sort"].forEach(i => {
    const el = $("#" + i);
    if (el) el.addEventListener("change", () => draw(true));
  });
  const rstBtn = $("#btn-reset-filters");
  if (rstBtn) rstBtn.onclick = resetFilters;

  draw(true);
};

/* 7.3 Scheme Detail View */
V.scheme = (p, id) => {
  const s = byId(id);
  if (!s) return V.nf();
  push("recent", id, 8);

  const L = a => `<ul class="detail-list">${a.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const saved = S.get("saved", []).includes(id);
  const rel = D.schemes.filter(x => x.cat === s.cat && x.id !== id).slice(0, 3);

  return `
  <div class="detail-breadcrumbs">
    <a href="schemes.html" class="back-link">
      <span class="back-arrow">←</span> All Government Schemes
    </a>
  </div>

  <div class="scheme-header-card">
    <div class="scheme-badge-row">
      <span class="tag lvl ${s.lvl === 'Central' ? 'tag-central' : 'tag-state'}">${esc(s.lvl)} Scheme</span>
      <span class="tag cat">${esc(D.cats[s.cat] || s.cat)}</span>
      ${s.state ? `<span class="tag loc">📍 ${esc(s.state)}</span>` : ""}
      <span class="tag dept-tag">${esc(s.dept)}</span>
      ${ver()}
    </div>

    <h1 class="scheme-detail-title">${esc(s.name)}</h1>

    <div class="row scheme-action-bar">
      <button id="sv" class="btn ${saved ? 'btn-saved' : 'pri'}">
        <span>${saved ? '★ Bookmarked' : '☆ Bookmark Scheme'}</span>
      </button>
      <button id="sh" class="btn" title="Share with family or colleagues">
        ${SVG_ICONS.share}
        <span>Share</span>
      </button>
      <button id="pr" class="btn" title="Print scheme summary">
        ${SVG_ICONS.printer}
        <span>Print / PDF</span>
      </button>
      <button id="rp" class="btn" title="Report outdated information">
        ${SVG_ICONS.info}
        <span>Report Issue</span>
      </button>
      <a class="btn btn-assistant-link" href="assistant.html?q=${encodeURIComponent("Tell me about " + s.name)}">
        <img src="/static/img/assistant-avatar.svg" width="20" height="20" alt="Guide">
        <span>Ask AI Guide</span>
      </a>
    </div>
  </div>

  <div class="detail-content-grid">
    <div class="sec modern-detail-section">
      <h2 class="section-title-sm">About the Scheme</h2>
      <p id="sc-about" class="detail-body-text">${esc(lang === "hi" && (s.desc_hi || s.desc) || s.desc)}</p>
      ${s.desc_hi && lang !== "hi" ? `
        <details class="hindi-summary-accordion">
          <summary>हिंदी विवरण (Hindi Summary)</summary>
          <p style="margin-top:.5rem">${esc(s.desc_hi)}</p>
        </details>` : ""}
    </div>

    <div class="sec modern-detail-section highlight-benefit-section">
      <h2 class="section-title-sm">Key Benefits &amp; Financial Support</h2>
      <div id="sc-ben" class="benefit-box">${fmtBenefit(s.benefit)}</div>
    </div>

    <div class="sec modern-detail-section">
      <h2 class="section-title-sm">Indicative Eligibility Criteria</h2>
      <div id="sc-elig">${L(s.elig)}</div>
      <div style="margin-top:1rem">
        <a class="btn" href="eligibility.html">
          ${SVG_ICONS.eligibility}
          <span>Run Profile Evaluation</span>
        </a>
      </div>
    </div>

    <div class="sec modern-detail-section">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <h2 class="section-title-sm" style="margin:0">Required Documents Checklist</h2>
        <a class="btn btn-quiet" href="checklist.html?id=${encodeURIComponent(s.id)}">
          ${SVG_ICONS.checklist}
          <span>Open Interactive Checklist</span>
        </a>
      </div>
      <div id="sc-docs" style="margin-top:0.8rem">${L(s.docs)}</div>
    </div>

    <div class="sec modern-detail-section apply-section">
      <h2 class="section-title-sm">How to Apply Officially</h2>
      <p id="sc-apply" class="detail-body-text">${esc(s.apply)}</p>
      <div class="row apply-buttons-row">
        <a class="btn pri btn-large" id="sc-url" href="${safeUrl(s.url)}" target="_blank" rel="noopener noreferrer">
          <span>Go to Official Portal (.gov.in)</span>
          ${SVG_ICONS.external}
        </a>
        <button id="cp" class="btn">
          ${SVG_ICONS.copy}
          <span>Copy Portal URL</span>
        </button>
        <a class="btn btn-audit" href="feedback.html?sid=${encodeURIComponent(s.id)}">
          ${SVG_ICONS.feedback}
          <span>Submit On-Ground Audit</span>
        </a>
      </div>
      <p class="mu official-portal-notice">
        <b>Notice:</b> Smarth AI never asks for bank passwords, OTPs, or fee payments. Always ensure you are on a verified <b>.gov.in</b> or <b>.nic.in</b> government domain before entering personal information.
      </p>
    </div>

    <div class="sec breakdown-section" id="sc-breakdown-sec">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem">
        <h2 class="section-title-sm" style="margin:0">
          ⚖️ Clause-by-Clause Policy Breakdown &amp; Fine Print (बारीकियाँ &amp; छिपी शर्तें)
        </h2>
        <a class="btn btn-quiet" href="feedback.html?sid=${encodeURIComponent(s.id)}">
          <span>📝 Submit Feedback</span>
        </a>
      </div>
      <p class="mu" style="font-size:0.9rem;margin-top:6px">
        Official Gazette clauses translated into plain words with concrete examples, plus unwritten conditions (NPCI DBT bank linkage, 1-per-family limits, validity dates).
      </p>
      <div id="sc-breakdown-box" style="margin-top:1rem">
        <div class="breakdown-loading">
          <span class="chat-spinner"></span>
          <span>Analyzing policy clauses and uncovering fine print…</span>
        </div>
      </div>
    </div>
  </div>

  ${rel.length ? `
    <div class="related-schemes-section">
      <h2>Related Schemes in ${esc(D.cats[s.cat] || s.cat)}</h2>
      <div class="grid">${rel.map(card).join("")}</div>
    </div>
  ` : ""}`;
};

V.scheme.after = (p, id) => {
  const s = byId(id);
  if (!s) return;

  // On-demand fetch of detailed backend scheme data
  fetch(`/api/schemes/${encodeURIComponent(id)}/`)
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (!d) return;
      if (d.benefits && $("#sc-ben")) $("#sc-ben").textContent = d.benefits;
      if (d.how_to_apply && $("#sc-apply")) $("#sc-apply").textContent = d.how_to_apply;
      if (d.eligibility?.length && $("#sc-elig")) {
        $("#sc-elig").innerHTML = `<ul class="detail-list">${d.eligibility.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
      }
      if (d.documents_required?.length && $("#sc-docs")) {
        $("#sc-docs").innerHTML = `<ul class="detail-list">${d.documents_required.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
      }
    })
    .catch(() => { });

  const renderBreakdown = (bk) => {
    if (!bk || !bk.clauses) return;
    const cHtml = bk.clauses.map((c, i) => `
      <div class="clause-card">
        <h3 class="clause-title">${esc(c.clause_title || `Clause ${i + 1}`)}</h3>
        <div class="clause-block">
          <b class="clause-label clause-label-gazette">📜 Official Gazette Clause:</b>
          <p class="clause-text">${esc(c.official_content)}</p>
        </div>
        <div class="clause-block">
          <b class="clause-label clause-label-plain">💡 Plain Words (सरल शब्दों में):</b>
          <p class="clause-text clause-plain-text">${esc(c.plain_words)}</p>
        </div>
        <div class="clause-example-box">
          <b class="clause-label clause-label-example">👤 Concrete Example:</b>
          <p class="clause-example-text">"${esc(c.example)}"</p>
        </div>
      </div>
    `).join("");

    const hHtml = bk.hidden_points && bk.hidden_points.length ? `
      <div class="hidden-points-box">
        <h3 class="hidden-points-title">⚠️ Hidden Points &amp; Fine Print (छिपी शर्तें और नियम)</h3>
        <p class="hidden-points-desc">Critical rules strictly enforced by scrutinizing officials:</p>
        <div class="hidden-points-grid">
          ${bk.hidden_points.map(h => `
            <div class="hidden-point-item">
              <b>⚡ ${esc(h.title)}</b>
              <p>${esc(h.detail)}</p>
            </div>
          `).join("")}
        </div>
      </div>
    ` : "";

    const box = $("#sc-breakdown-box");
    if (box) box.innerHTML = `<div>${cHtml}${hHtml}</div>`;
  };

  fetch(`/api/schemes/${encodeURIComponent(id)}/breakdown/`)
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (d && d.breakdown) renderBreakdown(d.breakdown);
      else if ($("#sc-breakdown-box")) {
        $("#sc-breakdown-box").innerHTML = "<p class='mu'>Policy breakdown available on official gazette portal.</p>";
      }
    })
    .catch(() => {
      if ($("#sc-breakdown-box")) {
        $("#sc-breakdown-box").innerHTML = "<p class='mu'>Policy breakdown offline. Check official ministry portal.</p>";
      }
    });

  const svBtn = $("#sv");
  if (svBtn) {
    svBtn.onclick = () => {
      let a = S.get("saved", []);
      const has = a.includes(id);
      a = has ? a.filter(x => x !== id) : [...a, id];
      S.set("saved", a);
      svBtn.className = `btn ${!has ? 'btn-saved' : 'pri'}`;
      svBtn.innerHTML = `<span>${!has ? '★ Bookmarked' : '☆ Bookmark Scheme'}</span>`;
      toast(!has ? "Scheme bookmarked in Citizen Vault" : "Bookmark removed");
    };
  }

  const prBtn = $("#pr");
  if (prBtn) prBtn.onclick = () => print();

  const rpBtn = $("#rp");
  if (rpBtn) {
    rpBtn.onclick = () => {
      const m = prompt("What is wrong or outdated on this page?");
      if (!m || !m.trim()) return;
      const a = S.get("reports", []);
      a.unshift({ sid: id, m: m.trim().slice(0, 300), t: new Date().toLocaleDateString("en-IN") });
      S.set("reports", a);
      toast("Thanks – issue report saved on this device");
    };
  }

  const shBtn = $("#sh");
  if (shBtn) {
    shBtn.onclick = async () => {
      const d = { title: s.name, text: `${s.name} – ${s.benefit}`, url: s.url };
      try {
        if (navigator.share) await navigator.share(d);
        else {
          await navigator.clipboard.writeText(d.text + " " + d.url);
          toast("Scheme link copied to clipboard");
        }
      } catch { }
    };
  }

  const cpBtn = $("#cp");
  if (cpBtn) {
    cpBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(s.url);
        toast("Official portal URL copied");
      } catch {
        toast("Copy failed");
      }
    };
  }
};

/* 7.4 Priority Signature Feature: AI Assistant (Smarth AI Guide) */
let muted = S.get("mute", false), rec = null;

const cleanSpeechText = raw => {
  if (!raw) return "";
  let t = raw;
  t = t.replace(/\*\*(.*?)\*\*/g, "$1");
  t = t.replace(/\*(.*?)\*/g, "$1");
  t = t.replace(/`([^`]+)`/g, "$1");
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  t = t.replace(/https?:\/\/\S+/g, "");
  t = t.replace(/[•\-\*#_~]+/g, " ");
  t = t.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/gu, "");
  const sentences = t.split(/[।.!?\n]+/).map(s => s.trim()).filter(Boolean);
  return sentences.slice(0, 2).join(". ");
};

const speak = txt => {
  if (muted || !("speechSynthesis" in window)) return;
  try {
    speechSynthesis.cancel();
    const clean = cleanSpeechText(txt);
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = /[\u0900-\u097F]/.test(clean) ? "hi-IN" : "en-IN";
    u.rate = 1.0;
    u.pitch = 1.0;
    speechSynthesis.speak(u);
  } catch (e) { }
};

const navCmd = q => {
  const l = q.toLowerCase();
  if (/dark|अँधेरा|रात/.test(l) && /mode|theme|मोड/.test(l)) {
    return { say: "This site uses the light theme only.", run: () => { } };
  }
  if (!/open|go to|take me|show me page|kholo|khol|खोल|दिखा|जाओ|le chalo/.test(l)) return null;
  const m = [
    [/compar|तुलना|tulna/, "compare.html", "Opening scheme compare tool."],
    [/checklist|readiness|document|दस्तावेज|दस्तावेज़/, "checklist.html", "Opening document readiness checker."],
    [/eligib|पात्र/, "eligibility.html", "Opening eligibility checker."],
    [/dashboard|डैशबोर्ड/, "dashboard.html", "Opening your dashboard."],
    [/admin|एडमिन/, "admin.html", "Opening admin command center."],
    [/feedback|प्रतिक्रिया/, "feedback.html", "Opening feedback audit."],
    [/service|सेवा/, "services.html", "Opening services directory."],
    [/home|होम/, "index.html", "Going to home page."],
    [/scheme|yojana|योजना/, "schemes.html", "Opening all schemes directory."]
  ].find(x => x[0].test(l));
  return m ? { say: m[2], run: () => location.href = m[1] } : null;
};

const answer = q => {
  const l = q.toLowerCase(), hi = /[\u0900-\u097F]/.test(q);
  const kw = {
    agriculture: ["farm", "kisan", "crop", "किसान", "खेती"],
    education: ["student", "scholar", "study", "छात्र", "स्कॉलर"],
    health: ["health", "hospital", "ayushman", "insurance", "स्वास्थ्य", "इलाज"],
    housing: ["house", "awas", "home", "घर", "आवास"],
    women: ["woman", "women", "girl", "महिला", "बेटी"],
    employment: ["job", "skill", "work", "रोजगार", "नौकरी"],
    social: ["ration", "labour", "worker", "मजदूर", "राशन"],
    senior: ["senior", "old age", "elderly", "बुजुर्ग"],
    finance: ["loan", "pension", "bank", "business", "लोन", "पेंशन"]
  };
  const named = D.schemes.find(s => l.includes(s.name.toLowerCase()) || l.includes(s.id.replace(/-/g, " ")));
  if (named) {
    return `**${named.name}**\n\n• **Core Benefit:** ${named.benefit}\n• **Eligibility:** ${named.elig.join("; ")}\n• **Key Documents:** ${named.docs.join(", ")}\n• **Application Route:** ${named.apply}\n• **Official Portal:** [${named.name} Link](${named.url})`;
  }
  if (/document|दस्तावेज|कागज/.test(l)) {
    return hi
      ? "आम तौर पर आधार कार्ड, बैंक पासबुक, आय/निवास प्रमाण पत्र की आवश्यकता होती है। योजना-विशिष्ट दस्तावेज़ सूची देखने के लिए 'दस्तावेज़ चेकलिस्ट' टूल खोलें।"
      : "Commonly required documents: Aadhaar card, active bank passbook, and income/residence certificate. Open our Document Checklist tool to verify your readiness.";
  }
  if (/eligib|पात्र|qualify/.test(l)) {
    return hi
      ? "पात्रता पृष्ठ (eligibility.html) पर अपनी उम्र, आय और व्यवसाय दर्ज करके तुरंत योग्य योजनाओं की सूची देखें।"
      : "Use our Indicative Eligibility Checker (eligibility.html) – enter your age, income, and occupation to instantly filter matching schemes.";
  }
  const toks = l.split(/[^a-z0-9\u0900-\u097F]+/).filter(w => w.length > 3);
  const sc = D.schemes
    .map(s => [s, toks.filter(w => (s.name + " " + s.benefit + " " + s.dept).toLowerCase().includes(w)).length])
    .filter(x => x[1] > 0)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 3);
  if (sc.length) {
    return (hi ? "ये सरकारी योजनाएँ आपके प्रश्न से मेल खाती हैं:\n\n" : "Here are matching government schemes:\n\n") +
      sc.map(([s]) => `• **${s.name}**: ${s.benefit} ([View Details](scheme.html?id=${s.id}))`).join("\n") +
      (hi ? "\n\nपूर्ण विवरण के लिए संबंधित योजना लिंक खोलें।" : "\n\nOpen any scheme page for complete eligibility and application steps.");
  }
  for (const [c, w] of Object.entries(kw)) {
    if (w.some(x => l.includes(x))) {
      const r = D.schemes.filter(s => s.cat === c).slice(0, 4);
      return (hi ? "संबंधित श्रेणियाँ और योजनाएँ:\n" : "Recommended related schemes:\n") +
        r.map(s => `• ${s.name} (${s.benefit})`).join("\n");
    }
  }
  if (/^(hi|hello|namaste|नमस्ते|hey)/.test(l)) {
    return hi
      ? "नमस्ते! मैं **Smarth AI Guide** हूँ। भारत सरकार या राज्य सरकार की किसी भी योजना, पात्रता, या दस्तावेज़ के बारे में पूछें।"
      : "Namaste! I am **Smarth AI Guide**, your citizen welfare companion. Ask me about any government scheme, eligibility requirements, or documents.";
  }
  return hi
    ? "माफ़ कीजिए, कृपया किसी विशिष्ट सरकारी योजना का नाम (जैसे: किसान सम्मान, आयुष्मान, मुद्रा लोन, पीएम आवास) लिखकर पूछें।"
    : "Please specify a welfare scheme or keyword (e.g., PM-KISAN, Ayushman Bharat, Mudra loan, scholarships) to help me find exact benefits.";
};

const fmt = s => {
  let o = esc(s);
  o = o.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|[a-zA-Z0-9_\-\.\?=&]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>');
  o = o.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  o = o.replace(/\*(.*?)\*/g, "<i>$1</i>");
  o = o.replace(/^### (.*$)/gim, "<b class='msg-h3'>$1</b>");
  o = o.replace(/^## (.*$)/gim, "<b class='msg-h2'>$1</b>");
  o = o.replace(/^[•\-\*] (.*$)/gim, "<div class='msg-bullet'><span class='bullet-dot'>•</span><span>$1</span></div>");
  o = o.replace(/\n/g, "<br>");
  return o;
};

V.assistant = p => `
<div class="chat-wrapper modern-workspace-chat">
  <div class="chat-header">
    <div class="chat-header-info">
      <div class="bot-badge-wrap">
        <img src="/static/img/assistant-avatar.svg" width="44" height="44" alt="Smarth AI Guide Avatar" class="assistant-chat-avatar">
        <span class="bot-status-dot" title="Online and Ready"></span>
      </div>
      <div>
        <h2 class="assistant-chat-title">
          <span>Smarth AI Guide</span>
          <span class="live-pill">● Online · Multilingual</span>
        </h2>
        <p class="mu assistant-chat-sub">Official Citizen Welfare Companion · English, Hindi &amp; Hinglish</p>
      </div>
    </div>
    <div class="chat-header-actions">
      <button id="mu" class="tool-btn" title="Toggle audio voice output">
        ${muted ? SVG_ICONS.volumeX : SVG_ICONS.volume}
        <span id="mu-text">${muted ? "Audio Off" : "Voice Active"}</span>
      </button>
      <button id="cl" class="tool-btn" title="Clear chat history">
        ${SVG_ICONS.trash}
        <span>Clear Chat</span>
      </button>
    </div>
  </div>

  <div class="chat-body" id="chat" aria-live="polite"></div>

  <div class="chat-suggestions" id="sg-box">
    <span class="sg-hint">💡 Popular Prompts:</span>
    <button class="sg" data-q="PM-KISAN ₹6000 yojana kya hai aur kaun eligible hai?">🌾 PM-KISAN ₹6000</button>
    <button class="sg" data-q="Ayushman Bharat 70+ elderly free treatment card">🏥 Ayushman Bharat 70+</button>
    <button class="sg" data-q="PM Surya Ghar free electricity rooftop solar subsidy">☀️ PM Surya Ghar Solar</button>
    <button class="sg" data-q="Scholarships and fee waivers for college students">🎓 Student Scholarships</button>
    <button class="sg" data-q="Pradhan Mantri Mudra business loan without collateral">💼 Mudra Business Loan</button>
    <button class="sg" data-q="Sukanya Samriddhi Yojana for girl child">👧 Sukanya Samriddhi</button>
  </div>

  <div class="chat-input-bar">
    <div class="input-container">
      <input id="ci" placeholder="Ask about any government scheme, eligibility or documents…" autocomplete="off" aria-label="Ask a question about government policies or schemes" />
      <button id="mic" class="mic-btn" title="Speak question with voice recognition" aria-label="Activate voice input">
        ${SVG_ICONS.mic}
      </button>
    </div>
    <button id="cs" class="send-btn" title="Send message" aria-label="Send message">
      <span class="send-icon">${SVG_ICONS.send}</span>
      <span class="send-text">Send</span>
    </button>
  </div>
</div>`;

V.assistant.after = p => {
  const chat = $("#chat");
  const ci = $("#ci");
  const cs = $("#cs");
  const mic = $("#mic");
  let h = S.get("chat", []);
  let isSending = false;

  if (ci) ci.value = "";

  const draw = () => {
    if (!chat) return;
    chat.innerHTML = h.map(m => {
      const isU = m.r === "u";
      const timeStr = m.time || "";
      return `
        <div class="chat-msg-row ${m.r}">
          <div class="msg-avatar">
            ${isU
              ? `<div class="user-avatar-badge">${SVG_ICONS.eligibility}</div>`
              : `<img src="/static/img/assistant-avatar.svg" width="34" height="34" alt="AI">`
            }
          </div>
          <div class="msg-content-wrapper">
            <div class="m-bubble">
              ${m.typing
                ? '<div class="typing-indicator"><span></span><span></span><span></span></div><span class="typing-text">Analyzing official policy clauses…</span>'
                : fmt(m.t)
              }
            </div>
            <div class="msg-footer">
              ${timeStr ? `<span>${esc(timeStr)}</span>` : ""}
              ${m.prov ? `<span>• ⚡ ${esc(m.prov)}</span>` : ""}
              ${!isU && !m.typing ? `
                <button class="btn-copy-msg" data-text="${esc(m.t)}" title="Copy response">
                  ${SVG_ICONS.copy}
                </button>
              ` : ""}
            </div>
          </div>
        </div>
      `;
    }).join("");
    chat.scrollTop = chat.scrollHeight;

    // Attach copy button handlers
    $$(".btn-copy-msg", chat).forEach(btn => {
      btn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(btn.dataset.text || "");
          toast("Assistant answer copied to clipboard");
        } catch { }
      };
    });
  };

  const add = (r, tx, prov, typing = false, timeStr = "") => {
    h.push({ r, t: tx, prov, typing, time: timeStr });
    h = h.slice(-40);
    S.set("chat", h);
    draw();
  };

  if (!h.length) {
    const initTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    add(
      "b",
      "नमस्ते! मैं **Smarth AI Guide** हूँ। भारत सरकार या राज्य सरकारों की किसी भी योजना (PM-KISAN, आयुष्मान भारत, पीएम आवास, मुद्रा लोन, पीएम सूर्य घर) के लाभ, पात्रता और दस्तावेज़ों के बारे में बेझिझक पूछें।\n\nआप नीचे दिए गए त्वरित विकल्पों पर क्लिक कर सकते हैं या सीधे अपना सवाल लिख सकते हैं।",
      "Smarth AI Knowledge Base",
      false,
      initTime
    );
  }
  draw();

  const send = async tx => {
    tx = (tx || "").trim();
    if (!tx || isSending) return;
    isSending = true;

    if (ci) { ci.disabled = true; ci.value = ""; }
    if (cs) {
      cs.disabled = true;
      cs.classList.add("loading");
      cs.innerHTML = '<span class="chat-spinner"></span> <span>Thinking…</span>';
    }
    if (mic) mic.disabled = true;
    $$(".sg").forEach(b => b.disabled = true);

    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    add("u", tx, null, false, nowTime);

    const g = navCmd(tx);
    if (g) {
      setTimeout(() => {
        add("b", g.say, "Navigator", false, nowTime);
        speak(g.say);
        isSending = false;
        if (ci) { ci.disabled = false; ci.focus(); }
        if (cs) {
          cs.disabled = false;
          cs.classList.remove("loading");
          cs.innerHTML = `<span class="send-icon">${SVG_ICONS.send}</span> <span class="send-text">Send</span>`;
        }
        if (mic) mic.disabled = false;
        $$(".sg").forEach(b => b.disabled = false);
        setTimeout(() => g.run(), 1200);
      }, 300);
      return;
    }

    add("b", "", null, true, nowTime);

    try {
      const res = await fetch("/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: tx,
          history: h.slice(-6).filter(x => !x.typing).map(x => ({
            role: x.r === "u" ? "user" : "assistant",
            content: x.t
          }))
        })
      });
      const data = await res.json();
      h = h.filter(x => !x.typing);
      const reply = data.reply || answer(tx);
      const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      add("b", reply, data.provider || "Smarth AI Guide", false, replyTime);
      speak(reply);
    } catch (err) {
      h = h.filter(x => !x.typing);
      const fallback = answer(tx);
      const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      add("b", fallback, "Local Knowledge Base", false, replyTime);
      speak(fallback);
    } finally {
      isSending = false;
      if (ci) {
        ci.disabled = false;
        ci.value = "";
        ci.focus();
      }
      if (cs) {
        cs.disabled = false;
        cs.classList.remove("loading");
        cs.innerHTML = `<span class="send-icon">${SVG_ICONS.send}</span> <span class="send-text">Send</span>`;
      }
      if (mic) mic.disabled = false;
      $$(".sg").forEach(b => b.disabled = false);
    }
  };

  if (cs) cs.onclick = () => { if (ci) send(ci.value); };
  if (ci) ci.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); if (cs) cs.click(); } };

  $$(".sg").forEach(b => b.onclick = () => send(b.dataset.q || b.textContent));

  const clBtn = $("#cl");
  if (clBtn) {
    clBtn.onclick = () => {
      h = [];
      S.set("chat", []);
      if ("speechSynthesis" in window) speechSynthesis.cancel();
      if (ci) ci.value = "";
      draw();
      toast("Chat conversation cleared");
    };
  }

  const muBtn = $("#mu");
  if (muBtn) {
    muBtn.onclick = () => {
      muted = !muted;
      S.set("mute", muted);
      muBtn.innerHTML = `${muted ? SVG_ICONS.volumeX : SVG_ICONS.volume} <span>${muted ? "Audio Off" : "Voice Active"}</span>`;
      if ("speechSynthesis" in window) speechSynthesis.cancel();
      toast(muted ? "Voice narration muted" : "Voice narration active");
    };
  }

  if (mic) {
    mic.onclick = () => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return toast("Speech recognition requires Chrome or Edge browser.");
      if (rec) {
        rec.stop();
        return;
      }
      try {
        rec = new SR();
        rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
        rec.continuous = false;
        rec.interimResults = false;
        rec.onstart = () => {
          mic.classList.add("recording");
          toast("Listening... speak your welfare scheme query");
        };
        rec.onresult = e => {
          const tx = e.results[0][0].transcript;
          if (tx) send(tx);
        };
        rec.onerror = () => {
          mic.classList.remove("recording");
          toast("Speech recognition could not capture audio. Please type.");
        };
        rec.onend = () => {
          rec = null;
          mic.classList.remove("recording");
        };
        rec.start();
      } catch (err) {
        toast("Microphone initialization error.");
      }
    };
  }

  if (p.get("q")) send(p.get("q"));
};

/* 7.5 Eligibility Checker View */
const OCC = {
  student: "Student (छात्र)",
  farmer: "Farmer (किसान)",
  employee: "Salaried Employee (वेतनभोगी)",
  selfemployed: "Self-employed / Artisan (स्वरोजगार)",
  unemployed: "Job Seeker / Unemployed (बेरोजगार)",
  homemaker: "Homemaker (गृहिणी)",
  retired: "Senior / Retired (सेवानिवृत्त)"
};

const check = (s, u) => {
  const r = s.r || {}, miss = [];
  if (r.a && (u.age < r.a[0] || u.age > r.a[1])) miss.push(`Age limit ${r.a[0]}–${r.a[1]} years`);
  if (r.g === "f" && u.gender !== "female") miss.push("Designated for women / girl children");
  if (r.o && !r.o.includes(u.occ)) miss.push("Designed for: " + r.o.map(o => OCC[o] || o).join(", "));
  if (r.i && u.income > r.i) miss.push(`Family annual income ceiling: ₹${r.i.toLocaleString("en-IN")}`);
  return miss;
};

V.eligibility = () => `
<div class="page-header">
  <div class="page-title-badge">🎯 Citizen Eligibility Engine</div>
  <h1>Indicative Eligibility Checker</h1>
  <p class="mu page-sub">Answer four key demographic parameters to instantly evaluate matched benefits tailored to your profile.</p>
</div>

<div class="eligibility-container">
  <form class="f modern-elig-form" id="ef">
    <div class="form-grid-2">
      <div class="form-group">
        <label for="el-age"><b>Citizen Age (Years)</b>
          <span class="mu-hint">Enter applicant's current age (0 to 120)</span>
          <input id="el-age" name="age" type="number" min="0" max="120" placeholder="e.g. 28" required>
        </label>
      </div>

      <div class="form-group">
        <label for="el-gender"><b>Gender</b>
          <span class="mu-hint">Required for women &amp; girl-child targeted programs</span>
          <select id="el-gender" name="gender">
            <option value="female">Female (महिला)</option>
            <option value="male">Male (पुरुष)</option>
            <option value="other">Other / Transgender</option>
          </select>
        </label>
      </div>

      <div class="form-group">
        <label for="el-occ"><b>Primary Vocation / Status</b>
          <span class="mu-hint">Select daily occupation or current status</span>
          <select id="el-occ" name="occ">
            ${Object.entries(OCC).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}
          </select>
        </label>
      </div>

      <div class="form-group">
        <label for="el-income"><b>Annual Family Income (₹)</b>
          <span class="mu-hint">Combined household income as per income certificate</span>
          <input id="el-income" name="income" type="number" min="0" placeholder="e.g. 180000" required>
        </label>
      </div>
    </div>

    <div class="form-actions-row">
      <button type="submit" class="btn pri btn-large">
        <span>Evaluate Eligible Schemes</span>
        ${SVG_ICONS.arrowRight}
      </button>
      <button type="reset" class="btn btn-quiet">Reset Form</button>
    </div>
  </form>
</div>
<div id="res"></div>`;

V.eligibility.after = () => {
  const form = $("#ef");
  if (!form) return;
  form.onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const u = {
      age: +f.get("age"),
      gender: f.get("gender"),
      occ: f.get("occ"),
      income: +f.get("income")
    };
    const rs = D.schemes.map(s => ({ s, m: check(s, u) })),
      ok = rs.filter(x => !x.m.length),
      no = rs.filter(x => x.m.length);

    push("elig", {
      t: new Date().toLocaleString("en-IN"),
      age: u.age,
      occ: OCC[u.occ],
      n: ok.length
    }, 8);

    const resEl = $("#res");
    if (!resEl) return;
    resEl.innerHTML = `
      <div class="elig-results-header">
        <h2>${ok.length} Eligible Scheme Matches Found</h2>
        <p class="mu">Based on age ${u.age}, ${u.gender}, ${OCC[u.occ]}, and ₹${u.income.toLocaleString("en-IN")}/year family income.</p>
      </div>
      <div class="grid">${ok.map(({ s }) => card(s)).join("") || "<p class='mu'>No exact matches found for these specific criteria.</p>"}</div>
      ${no.length ? `
        <details class="modern-faq" style="margin-top:2.5rem">
          <summary>Review Other Directory Schemes (${no.length} skipped based on income/age criteria)</summary>
          <div class="faq-body">
            <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-top:10px">
              ${no.slice(0, 18).map(({ s, m }) => `
                <div class="card" style="padding:14px;border-left:3px solid #f59e0b">
                  <b>${esc(s.name)}</b>
                  <div class="mu" style="font-size:0.84rem;margin-top:4px">Criteria mismatch: ${esc(m.join("; "))}</div>
                </div>
              `).join("")}
            </div>
          </div>
        </details>` : ""}
    `;
    resEl.scrollIntoView({ behavior: "smooth" });
  };
};

/* 7.6 Document Readiness Checker View */
const docList = s => Array.isArray(s.docs) ? s.docs : [String(s.docs || "")];
const realDoc = d => !/official|scheme-specific/i.test(d);
const dkey = d => {
  const l = d.toLowerCase();
  return l.includes("aadhaar") ? "aadhaar" : l.includes("passbook") ? "bank passbook" : l;
};

const schemeOpts = sel => `<option value="">— Select a welfare scheme —</option>` + Object.entries(D.cats).map(([k, v]) => {
  const l = D.schemes.filter(s => s.cat === k);
  return l.length ? `<optgroup label="${esc(v)}">${l.map(s => `<option value="${esc(s.id)}"${s.id === sel ? " selected" : ""}>${esc(s.name)}</option>`).join("")}</optgroup>` : "";
}).join("");

const pushUrl = u => {
  try { history.replaceState(null, "", u); } catch { }
};

const crit = s => {
  const r = s.r || {}, o = [];
  if (r.a) o.push(r.a[1] >= 120 ? `Age ${r.a[0]}+ years` : `Age ${r.a[0]}–${r.a[1]} years`);
  if (r.g === "f") o.push("Women / girl child only");
  if (r.o) o.push("Usually designated for: " + r.o.map(x => OCC[x] || x).join(", "));
  if (r.i) o.push(`Family annual income ceiling: ₹${r.i.toLocaleString("en-IN")}`);
  return o.length ? o : ["Standard civic criteria without strict income/age ceiling"];
};

const CK = () => S.get("ck", {});
const ckItems = s => docList(s).map(d => /^see official/i.test(d) ? "Documents specified on the official ministry portal" : d);
const ckDone = s => { const t = CK()[s.id] || []; return ckItems(s).filter(d => t.includes(d)); };
const ckSave = (s, list) => {
  const c = CK();
  if (list.length) c[s.id] = list;
  else delete c[s.id];
  S.set("ck", c);
};

const pbar = pct => `
<div class="pb" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
  <i style="width:${pct}%"></i>
</div>`;

const DH = [
  [/aadhaar/i, "Ensure mobile number is linked. Download e-Aadhaar from official UIDAI portal.", "https://uidai.gov.in/"],
  [/\bpan\b/i, "Apply for instant e-PAN or download reprint from Income Tax e-filing portal.", "https://www.incometax.gov.in/"],
  [/passbook|bank account/i, "Ensure bank account is Aadhaar seeded & NPCI DBT enabled for direct benefit transfer."],
  [/income/i, "Issued by your local Tehsil, SDM, or state e-District service portal."],
  [/ration/i, "Managed by State Food, Civil Supplies and Consumer Protection Department."],
  [/land|property/i, "Verified land record (Khatauni / Jamabandi) from state Bhulekh portal."],
  [/birth/i, "Available from Registrar of Births and Deaths or Municipal Corporation."],
  [/marksheet|education|certificate/i, "Keep verified digital copy in DigiLocker for instant zero-paper verification.", "https://www.digilocker.gov.in/"],
  [/mobile/i, "Keep active Aadhaar-linked mobile ready for OTP verification."]
];

const hintOf = d => DH.find(x => x[0].test(d));

const ckOverview = () => {
  const rows = Object.keys(CK())
    .map(id => byId(id))
    .filter(Boolean)
    .map(s => ({ s, d: ckDone(s).length, n: ckItems(s).length }))
    .filter(x => x.d > 0);

  return rows.length
    ? rows.map(({ s, d, n }) => {
      const pct = Math.round(d / n * 100);
      return `
        <div class="sec ck-progress-card">
          <div class="ckrow">
            <a href="checklist.html?id=${encodeURIComponent(s.id)}"><b>${esc(s.name)}</b></a>
            <span class="mu">${d}/${n} documents ready · <b>${pct}%</b></span>
          </div>
          ${pbar(pct)}
        </div>`;
    }).join("")
    : "<p class='mu'>No active document checklist yet. Select a scheme above to start tracking.</p>";
};

V.checklist = p => {
  const id = p.get("id") || S.get("cklast", "");
  const saved = S.get("saved", []).map(x => byId(x)).filter(Boolean).slice(0, 8);

  return `
  <div class="page-header">
    <div class="page-title-badge">📑 Zero-Rejection Prep</div>
    <h1>Document Readiness Checker</h1>
    <p class="mu page-sub">Pick any welfare scheme, tick off documents in your possession, and resolve missing certificate blockers before reaching the application portal.</p>
  </div>

  <div class="sec modern-selector-box">
    <label for="ks" style="font-weight:700;display:block;margin-bottom:8px">Select Scheme to Audit Documents:</label>
    <div class="bar" style="margin:0">
      <select id="ks" aria-label="Select Scheme">${schemeOpts(id)}</select>
    </div>
    ${saved.length ? `
      <div class="saved-quick-picks" style="margin-top:12px">
        <span class="mu" style="font-size:0.85rem">Quick select from saved schemes:</span>
        <div class="chips" id="ksv" style="margin:6px 0 0">
          ${saved.map(s => `<button class="chip modern-chip" data-id="${esc(s.id)}" style="cursor:pointer">⭐ ${esc(s.name)}</button>`).join("")}
        </div>
      </div>
    ` : ""}
  </div>

  <div id="kres"></div>
  <h2 style="margin-top:2.5rem">Checklists In Progress on This Device</h2>
  <div id="kov">${ckOverview()}</div>`;
};

V.checklist.after = () => {
  const ks = $("#ks"), res = $("#kres");
  let cur = null;

  const paint = () => {
    if (!cur) return;
    const items = ckItems(cur),
      done = ckDone(cur),
      n = items.length,
      pct = n ? Math.round(done.length / n * 100) : 0,
      miss = items.filter(d => !done.includes(d));

    const kp = $("#kp");
    if (kp) {
      kp.innerHTML = `
        <div class="readiness-status-banner ${pct === 100 ? 'status-ready' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap">
            <span style="font-weight:700;font-size:1.05rem">Document Readiness Score: ${pct}%</span>
            <span class="mu">${done.length} of ${n} verified on hand</span>
          </div>
          ${pbar(pct)}
          <p class="${pct === 100 ? "ben" : "mu"}" style="margin:6px 0 0">
            ${pct === 100
              ? "✅ All required certificates are ready! You can now proceed to apply on the official government website."
              : done.length
                ? `Still needed: <b>${esc(miss.join(", "))}</b>`
                : "Tick each document you have ready on hand to calculate your readiness."}
          </p>
        </div>`;
    }

    res.querySelectorAll("input[data-d]").forEach(i => {
      i.closest("label").classList.toggle("done", i.checked);
    });
    const kov = $("#kov");
    if (kov) kov.innerHTML = ckOverview();
  };

  const sync = () => {
    const before = ckDone(cur).length === ckItems(cur).length;
    ckSave(cur, [...res.querySelectorAll("input[data-d]:checked")].map(i => i.dataset.d));
    paint();
    if (!before && ckDone(cur).length === ckItems(cur).length) {
      toast("All documents ready! 🎉 You are set to apply.");
    }
  };

  const show = id => {
    cur = byId(id) || null;
    S.set("cklast", cur ? cur.id : "");
    if (!cur) {
      res.innerHTML = `<div class="sec empty-sec"><p class="mu">Select a government scheme from the dropdown above to view its required documents.</p></div>`;
      return;
    }
    pushUrl(`checklist.html?id=${encodeURIComponent(cur.id)}`);
    const t = CK()[cur.id] || [];

    res.innerHTML = `
      <div class="sec modern-detail-section">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <h2 style="margin:0">${esc(cur.name)}</h2>
          <div>
            <span class="tag lvl ${cur.lvl === 'Central' ? 'tag-central' : 'tag-state'}">${esc(cur.lvl)}</span>
            <span class="tag cat">${esc(D.cats[cur.cat] || cur.cat)}</span>
          </div>
        </div>

        <div id="kp" aria-live="polite" style="margin:1rem 0"></div>

        <div class="cklist">
          ${ckItems(cur).map(d => {
            const h = hintOf(d);
            return `
              <label class="ck">
                <input type="checkbox" data-d="${esc(d)}"${t.includes(d) ? " checked" : ""}>
                <span class="ck-text-wrap">
                  <span class="t">${esc(d)}</span>
                  ${h ? `<small class="mu">${esc(h[1])}${h[2] ? ` <a href="${h[2]}" target="_blank" rel="noopener noreferrer">Official Portal ↗</a>` : ""}</small>` : ""}
                </span>
              </label>`;
          }).join("")}
        </div>

        <div class="row" style="margin-top:1.5rem">
          <button id="kall" class="btn">Mark all ready</button>
          <button id="knone" class="btn btn-quiet">Clear all</button>
          <button id="kpr" class="btn">${SVG_ICONS.printer} <span>Print Checklist</span></button>
        </div>
      </div>

      <div class="row" style="margin-top:1rem">
        <a class="btn pri" href="${safeUrl(cur.url)}" target="_blank" rel="noopener noreferrer">
          <span>Go to Official Website</span>
          ${SVG_ICONS.external}
        </a>
        <a class="btn" href="scheme.html?id=${encodeURIComponent(cur.id)}">Scheme Details</a>
        <a class="btn" href="compare.html?a=${encodeURIComponent(cur.id)}">⚖️ Compare with another</a>
      </div>
      <p class="mu" style="font-size:0.85rem;margin-top:1rem">
        This document checklist is based on standard official ministry guidelines. The nodal officer or portal may request state-specific verifications.
      </p>`;

    res.onchange = e => { if (e.target.dataset.d !== undefined) sync(); };
    const kall = $("#kall"), knone = $("#knone"), kpr = $("#kpr");
    if (kall) kall.onclick = () => { res.querySelectorAll("input[data-d]").forEach(i => i.checked = true); sync(); };
    if (knone) knone.onclick = () => { res.querySelectorAll("input[data-d]").forEach(i => i.checked = false); sync(); };
    if (kpr) kpr.onclick = () => print();
    paint();
  };

  ks.onchange = () => show(ks.value);
  const sv = $("#ksv");
  if (sv) {
    sv.onclick = e => {
      const id = e.target.dataset.id;
      if (!id) return;
      ks.value = id;
      show(id);
    };
  }
  show(ks.value);
};

/* 7.7 Compare Schemes View */
const cmpIds = () => S.get("cmp", []).filter((x, i, r) => x && byId(x) && r.indexOf(x) === i).slice(0, 3);
const cmpUrl = ids => "compare.html" + (ids.length ? "?" + ids.map((x, i) => "abc"[i] + "=" + encodeURIComponent(x)).join("&") : "");

const cmpTable = T => {
  const L = r => `<ul class="detail-list">${r.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const ks = T.map(s => new Set(docList(s).filter(realDoc).map(dkey)));
  const all = [...ks[0]].filter(k => ks.every(z => z.has(k)));
  const common = docList(T[0]).filter(d => realDoc(d) && all.includes(dkey(d)));

  const dl = s => `
    <ul class="detail-list">
      ${docList(s).map(d => `<li>${esc(d)}${realDoc(d) && all.includes(dkey(d)) ? ' <span class="tag cm">Common Document</span>' : ""}</li>`).join("")}
    </ul>`;

  const cats = [...new Set(T.map(s => s.cat))];
  const R = [
    ["Target Beneficiaries", s => whoOf(s).map(gl).join(", ")],
    ["Nodal Department", s => esc(s.dept)],
    ["Core Financial Benefit", s => `<div class="ben">${fmtBenefit(s.benefit)}</div>`],
    ["Overview", s => esc(s.desc)],
    ["Eligibility Rules", s => L(s.elig)],
    ["Indicative Criteria", s => L(crit(s))],
    ["Required Documents", dl],
    ["Application Route", s => esc(s.apply)],
    ["Official Portal", s => `<a class="btn btn-quiet" href="${safeUrl(s.url)}" target="_blank" rel="noopener noreferrer">Open Portal ↗</a>`],
    ["Next Step", s => `
      <div style="display:flex;flex-direction:column;gap:6px">
        <a class="btn pri" href="scheme.html?id=${encodeURIComponent(s.id)}">Full Details</a>
        <a class="btn" href="checklist.html?id=${encodeURIComponent(s.id)}">📑 Audit Documents</a>
      </div>
    `]
  ];

  return `
  <div class="sec ok" style="margin:1.5rem 0">
    <h3 style="margin:0 0 6px 0;color:var(--pos)">Comparison Highlights</h3>
    <p style="margin:4px 0">
      ${cats.length === 1
        ? `All selected programs fall under the <b>${esc(D.cats[cats[0]] || cats[0])}</b> sector.`
        : `These programs cover distinct sectors: ${cats.map(c => esc(D.cats[c] || c)).join(", ")}.`
      }
    </p>
    <p style="margin:4px 0">
      ${common.length
        ? `<b>💡 Shared Requirement (${common.length} common documents):</b> ${esc(common.join(", "))}. Collect these once and use them across all applications.`
        : "Each program lists separate, specialized documentation."
      }
    </p>
  </div>

  <div class="compare-table-wrapper" style="overflow-x:auto">
    <table class="ct">
      <thead>
        <tr>
          <th>Attribute</th>
          ${T.map(s => `<th><a href="scheme.html?id=${encodeURIComponent(s.id)}" class="cmp-col-title">${esc(s.name)}</a></th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${R.map(([n, f]) => `
          <tr>
            <th>${n}</th>
            ${T.map(s => `<td>${f(s)}</td>`).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
  <p class="mu" style="font-size:0.85rem;margin-top:0.8rem">
    Indicative comparison based on public gazette notices. Always confirm latest terms on the official ministry portal.
  </p>`;
};

V.compare = p => {
  const q = ["a", "b", "c"].some(k => p.has(k)),
    ids = (q ? ["a", "b", "c"].map(k => p.get(k) || "") : S.get("cmp", []))
      .filter((x, i, r) => x && byId(x) && r.indexOf(x) === i)
      .slice(0, 3);

  const pairs = [
    ["pm-kisan", "pmfby"],
    ["apy", "nps"],
    ["pmkvy", "ddugky"],
    ["mudra", "pmegp"]
  ].filter(x => byId(x[0]) && byId(x[1]));

  return `
  <div class="page-header">
    <div class="page-title-badge">⚖️ Scheme Comparison Matrix</div>
    <h1>${t("compare")}</h1>
    <p class="mu page-sub">Pick 2 or 3 government schemes to compare financial benefits, eligibility limits, and required documents side by side.</p>
  </div>

  <div class="bar compare-pickers-bar">
    <select id="ca" aria-label="First scheme">${schemeOpts(ids[0])}</select>
    <select id="cb" aria-label="Second scheme">${schemeOpts(ids[1])}</select>
    <select id="cd" aria-label="Third scheme (optional)">${schemeOpts(ids[2]).replace("— Select a welfare scheme —", "— Optional 3rd Scheme —")}</select>
    <button id="ccl" class="btn btn-quiet">Clear</button>
  </div>

  ${pairs.length ? `
    <div class="row comparison-quick-pairs" id="cpairs" style="margin:12px 0 16px">
      <span class="mu" style="font-size:0.85rem">Popular Comparisons:</span>
      ${pairs.map(x => `
        <button class="chip modern-chip" data-a="${x[0]}" data-b="${x[1]}" style="cursor:pointer">
          ${esc(byId(x[0]).name)} vs ${esc(byId(x[1]).name)}
        </button>
      `).join("")}
    </div>
  ` : ""}

  <div id="cres"></div>`;
};

V.compare.after = () => {
  const sel = ["#ca", "#cb", "#cd"].map(x => $(x)), res = $("#cres");

  const draw = () => {
    const v = sel.map(x => x.value).filter(Boolean),
      ids = v.filter((x, i) => v.indexOf(x) === i);

    S.set("cmp", ids);
    pushUrl(cmpUrl(ids));

    if (v.length !== ids.length) {
      res.innerHTML = `<div class="sec no"><p>Please choose <b>different</b> schemes to compare.</p></div>`;
      return;
    }
    if (ids.length < 2) {
      res.innerHTML = `
        <div class="sec empty-sec">
          <p class="mu">Select at least two welfare schemes above (or tick "Compare" on scheme cards) to render the side-by-side comparison table.</p>
          <a class="btn pri" href="schemes.html" style="margin-top:0.8rem">Browse Schemes Catalog</a>
        </div>`;
      return;
    }

    res.innerHTML = cmpTable(ids.map(byId)) + `
      <div class="row" style="margin-top:1.5rem">
        <button id="cpl" class="btn">🔗 Copy Comparison Share Link</button>
        <button id="cpr" class="btn">${SVG_ICONS.printer} <span>Print Comparison</span></button>
      </div>`;

    const cpl = $("#cpl"), cpr = $("#cpr");
    if (cpl) {
      cpl.onclick = async () => {
        try {
          await navigator.clipboard.writeText(location.href.split(/[?#]/)[0] + cmpUrl(ids).slice(11));
          toast("Comparison link copied to clipboard");
        } catch {
          toast("Copy failed");
        }
      };
    }
    if (cpr) cpr.onclick = () => print();
  };

  sel.forEach(x => { if (x) x.onchange = draw; });
  const ccl = $("#ccl");
  if (ccl) {
    ccl.onclick = () => {
      sel.forEach(x => { if (x) x.value = ""; });
      draw();
    };
  }
  const pr = $("#cpairs");
  if (pr) {
    pr.onclick = e => {
      const d = e.target.dataset;
      if (!d.a) return;
      if (sel[0]) sel[0].value = d.a;
      if (sel[1]) sel[1].value = d.b;
      if (sel[2]) sel[2].value = "";
      draw();
    };
  }
  draw();
};

/* 7.8 Personal Citizen Dashboard View */
V.dashboard = () => {
  const saved = S.get("saved", []).map(byId).filter(Boolean);
  const recent = S.get("recent", []).map(byId).filter(Boolean);
  const searches = S.get("searches", []);

  return `
  <div class="page-header">
    <div class="page-title-badge">👤 Citizen Vault &amp; Activity</div>
    <h1>My Personal Policy Dashboard</h1>
    <p class="mu page-sub">Private local tracker on this device. Your data is stored exclusively in your browser and is never sold or transmitted.</p>
  </div>

  <div class="dashboard-metrics-grid">
    <div class="metric-card">
      <span class="metric-num">${saved.length}</span>
      <span class="metric-label">Bookmarked Schemes</span>
    </div>
    <div class="metric-card">
      <span class="metric-num">${Object.keys(CK()).length}</span>
      <span class="metric-label">Checklists In Progress</span>
    </div>
    <div class="metric-card">
      <span class="metric-num">${recent.length}</span>
      <span class="metric-label">Recently Inspected</span>
    </div>
  </div>

  <div class="section-header">
    <h2>Bookmarked Schemes</h2>
  </div>
  ${saved.length ? `<div class="grid">${saved.map(card).join("")}</div>` : `<div class="sec empty-sec"><p class="mu">No schemes bookmarked yet. Tap "☆ Bookmark Scheme" on any scheme details page to track it here.</p></div>`}

  <div class="section-header" style="margin-top:2.5rem">
    <h2>Document Readiness Progress</h2>
  </div>
  <div class="checklist-summary-box">${ckOverview()}</div>

  <div class="section-header" style="margin-top:2.5rem">
    <h2>Recently Viewed Schemes</h2>
  </div>
  ${recent.length ? `<div class="grid">${recent.map(card).join("")}</div>` : `<div class="sec empty-sec"><p class="mu">No recently viewed schemes on this device.</p></div>`}

  <div class="section-header" style="margin-top:2.5rem">
    <h2>Recent Search Queries</h2>
  </div>
  <div class="chips">
    ${searches.length
      ? searches.map(x => `<a class="chip modern-chip" href="schemes.html?q=${encodeURIComponent(x)}">🔍 ${esc(x)}</a>`).join("")
      : "<span class='mu'>No recent searches recorded</span>"
    }
  </div>

  <div class="sec dashboard-action-panel" style="margin-top:2.5rem">
    <h3>Data Privacy &amp; Device Controls</h3>
    <p class="mu">Export your bookmarks and checklists as a JSON backup or wipe local storage completely.</p>
    <div class="row">
      <button id="ex" class="btn">📥 Export My Data (JSON)</button>
      <button id="rs" class="btn btn-danger">🗑️ Reset All Local Data</button>
    </div>
  </div>`;
};

V.dashboard.after = () => {
  const ex = $("#ex"), rs = $("#rs");
  if (ex) {
    ex.onclick = () => {
      const o = {};
      Object.keys(localStorage).filter(k => k.startsWith("sm_")).forEach(k => o[k] = localStorage.getItem(k));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(o, null, 2)], { type: "application/json" }));
      a.download = "smarth-data-backup.json";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Data export downloaded successfully");
    };
  }
  if (rs) {
    rs.onclick = () => {
      if (confirm("Reset and clear all saved bookmarks, chats, and checklists on this device?")) {
        Object.keys(localStorage).filter(k => k.startsWith("sm_")).forEach(k => localStorage.removeItem(k));
        applyPrefs();
        route();
        toast("Local data cleared");
      }
    };
  }
};

/* 7.9 Services & Departments Directory View */
V.services = () => `
<div class="page-header">
  <div class="page-title-badge">🏛️ National Digital Infrastructure</div>
  <h1>Departments &amp; Citizen Services Directory</h1>
  <p class="mu page-sub">Verified direct access points to official Union Ministries, State Portals, and central citizen utility platforms.</p>
</div>

<div class="section-header">
  <h2>Direct Citizen Digital Services</h2>
</div>
<div class="grid services-grid">
  ${D.services.map(x => `
    <a class="card modern-service-card" href="${safeUrl(x[1])}" target="_blank" rel="noopener noreferrer">
      <div class="service-icon-box">🔗</div>
      <div class="service-content">
        <b>${esc(x[0])}</b>
        <span class="mu-url">${x[1].replace(/^https?:\/\//, "")} ↗</span>
      </div>
    </a>
  `).join("")}
</div>

<div class="section-header" style="margin-top:2.5rem">
  <h2>Union Ministries &amp; Nodal Departments</h2>
</div>
<div class="grid services-grid">
  ${D.depts.map(x => `
    <a class="card modern-service-card" href="${safeUrl(x[1])}" target="_blank" rel="noopener noreferrer">
      <div class="service-icon-box">🏛️</div>
      <div class="service-content">
        <b>${esc(x[0])}</b>
        <span class="mu-url">${x[1].replace(/^https?:\/\//, "")} ↗</span>
      </div>
    </a>
  `).join("")}
</div>`;

/* 7.10 Feedback & Policy Audit View */
let stars = 0, clarityStars = 0;

V.feedback = p => {
  const fb = S.get("fb", []), c = { Positive: 0, Neutral: 0, Negative: 0 };
  fb.forEach(x => { if (c[x.s] !== undefined) c[x.s]++; });
  const preSid = p.get("sid") || "";

  return `
  <div class="page-header">
    <div class="page-title-badge">📝 Citizen Policy Audit</div>
    <h1>Citizen Policy Experience &amp; Feedback Audit</h1>
    <p class="mu page-sub">Share on-ground implementation realities, clarity assessments, and friction points to help policymakers and fellow citizens.</p>
  </div>

  <form class="f modern-feedback-form" id="ff" style="display:flex;flex-direction:column;gap:1.5rem">
    <label><b>Select Government Scheme</b>
      <select name="sid">
        ${D.schemes.map(s => `<option value="${s.id}" ${s.id === preSid ? "selected" : ""}>${esc(s.name)}</option>`).join("")}
      </select>
    </label>

    <div class="sec audit-step-sec" style="border-left:4px solid #0284c7">
      <h3 style="margin-top:0;color:#0369a1">1. Context &amp; Respondent Profile</h3>
      <p class="mu" style="font-size:0.85rem">Understand who is experiencing the policy on the ground.</p>
      <div class="form-grid-2">
        <label>Your Role / Affiliation
          <select name="role">
            <option value="Student">Student (छात्र)</option>
            <option value="Faculty / Teacher">Faculty / Teacher (शिक्षक)</option>
            <option value="Farmer / Agri Worker">Farmer / Agricultural Worker (किसान)</option>
            <option value="MSME / Small Business">MSME / Small Business Owner (उद्यमी)</option>
            <option value="Salaried Employee">Salaried Employee / Worker (कर्मचारी)</option>
            <option value="Senior Citizen">Senior Citizen (60+)</option>
            <option value="Social Worker">Healthcare / ASHA / Anganwadi</option>
            <option value="Other Citizen">Other Citizen</option>
          </select>
        </label>
        <label>Duration Subject to Policy
          <select name="duration_subject">
            <option value="Less than 6 months">Less than 6 months</option>
            <option value="6 months - 1 year">6 months – 1 year</option>
            <option value="1-2 years">1 – 2 years</option>
            <option value="2+ years">2+ years</option>
          </select>
        </label>
      </div>
      <div style="margin-top:.8rem">
        <label>Application Status
          <select name="ap">
            <option value="applied">Yes, I applied</option>
            <option value="started">Started application but did not finish</option>
            <option value="not_applied">No, I have not applied yet</option>
          </select>
        </label>
      </div>
    </div>

    <div class="sec audit-step-sec" style="border-left:4px solid #0d9488">
      <h3 style="margin-top:0;color:#0f766e">2. Clarity &amp; Comprehension</h3>
      <p class="mu" style="font-size:0.85rem">Evaluate if the official policy guidelines and rules are straightforward.</p>
      <label><b>Clarity Rating:</b> How clear is the scheme language? (1 to 5)
        <div class="stars" id="st-clarity" aria-label="Clarity Rating" style="margin:.4rem 0">
          ${[1, 2, 3, 4, 5].map(i => `<button type="button" data-type="clarity" data-v="${i}" aria-label="${i} star">★</button>`).join("")}
        </div>
      </label>
      <label style="margin-top:.6rem"><b>Ambiguity Check:</b> Any clauses or requirements that felt confusing or open to misinterpretation?
        <textarea name="ambiguity_notes" rows="2" placeholder="e.g. Income certificate validity wasn't specified; Aadhaar OTP failed repeatedly..."></textarea>
      </label>
    </div>

    <div class="sec audit-step-sec" style="border-left:4px solid #f59e0b">
      <h3 style="margin-top:0;color:#b45309">3. Practical Impact &amp; Fairness</h3>
      <p class="mu" style="font-size:0.85rem">Does the program solve the intended welfare problem, or introduce administrative hurdles?</p>
      <label><b>Operational Impact:</b> Does this policy improve your routine life or work? Why?
        <textarea name="operational_impact" rows="2" placeholder="Describe concrete real-life outcome or delay..." required></textarea>
      </label>
      <div style="margin-top:.6rem">
        <label><b>Perceived Fairness:</b> Is this policy applied transparently without bias?
          <select name="perceived_fairness">
            <option value="yes">Yes — Fair and transparent</option>
            <option value="somewhat">Somewhat — Depends on local officials</option>
            <option value="no">No — Inconsistent or biased</option>
          </select>
        </label>
      </div>
      <label style="margin-top:.6rem"><b>Unintended Roadblocks:</b> Unexpected delays or additional unofficial demands?
        <textarea name="unintended_consequences" rows="2" placeholder="e.g. Long queue at Tehsil office; extra notarized affidavit requested..."></textarea>
      </label>
    </div>

    <div class="sec audit-step-sec" style="border-left:4px solid #6366f1">
      <h3 style="margin-top:0;color:#4338ca">4. Constructive Solutions</h3>
      <p class="mu" style="font-size:0.85rem">Propose practical ideas to improve implementation.</p>
      <label><b>Proposed Modification:</b> If you could adjust one rule, what would it be?
        <textarea name="proposed_modifications" rows="2" placeholder="e.g. Allow automatic renewal via DigiLocker; enable SMS status alerts..."></textarea>
      </label>
      <label style="margin-top:.6rem"><b>Overall Satisfaction:</b> Overall rating of this program (1 to 5)
        <div class="stars" id="st" aria-label="Overall Satisfaction" style="margin:.4rem 0">
          ${[1, 2, 3, 4, 5].map(i => `<button type="button" data-type="overall" data-v="${i}" aria-label="${i} star">★</button>`).join("")}
        </div>
      </label>
    </div>

    <button type="submit" class="btn pri btn-large">
      <span>Submit Citizen Policy Audit</span>
      ${SVG_ICONS.arrowRight}
    </button>
  </form>

  <div class="sec" style="margin-top:2rem">
    <h2>Audit Summary</h2>
    <p>Total Submissions: <b>${fb.length}</b> · Positive: <b>${c.Positive}</b> · Neutral: <b>${c.Neutral}</b> · Friction/Issues: <b>${c.Negative}</b></p>
  </div>
  <div id="fl" style="margin-top:1rem">${fbList()}</div>`;
};

const fbList = () => S.get("fb", []).map((x, i) => `
  <div class="sec audit-record-card">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <b>${esc(byId(x.sid)?.name || x.sid)}</b>
      <span class="tag ${x.s === 'Positive' ? 'tag-central' : x.s === 'Negative' ? 'tag-state' : ''}">${esc(x.s)}</span>
    </div>
    <div style="color:#f59e0b;font-size:1.1rem;margin:4px 0">${"★".repeat(x.r || 5)}</div>
    <div class="mu" style="font-size:0.85rem">Role: ${esc(x.role || "Citizen")} · Applied: ${esc(x.ap || "Yes")}</div>
    <p style="margin:8px 0">${esc(x.c || x.operational_impact || "")}</p>
    ${x.proposed_modifications ? `<p class="mu" style="font-size:0.85rem">💡 <b>Proposed fix:</b> ${esc(x.proposed_modifications)}</p>` : ""}
    <button class="btn btn-danger btn-quiet" data-del="${i}" style="margin-top:6px;padding:3px 10px;font-size:0.8rem">Delete</button>
  </div>
`).join("") || "<p class='mu'>No citizen policy audits submitted yet.</p>";

V.feedback.after = () => {
  stars = 0; clarityStars = 0;
  const st = $("#st");
  if (st) {
    st.onclick = e => {
      const v = e.target.dataset.v;
      if (!v) return;
      stars = +v;
      [...st.children].forEach((b, i) => b.classList.toggle("on", i < stars));
    };
  }
  const stc = $("#st-clarity");
  if (stc) {
    stc.onclick = e => {
      const v = e.target.dataset.v;
      if (!v) return;
      clarityStars = +v;
      [...stc.children].forEach((b, i) => b.classList.toggle("on", i < clarityStars));
    };
  }

  const form = $("#ff");
  if (form) {
    form.onsubmit = async e => {
      e.preventDefault();
      if (!stars) return toast("Please select an overall rating (1-5 stars)");
      const f = new FormData(e.target);
      const payload = {
        sid: f.get("sid"),
        rating: stars,
        clarity_rating: clarityStars || stars,
        role: f.get("role") || "",
        duration_subject: f.get("duration_subject") || "",
        ambiguity_notes: f.get("ambiguity_notes") || "",
        operational_impact: f.get("operational_impact") || "",
        perceived_fairness: f.get("perceived_fairness") || "yes",
        unintended_consequences: f.get("unintended_consequences") || "",
        proposed_modifications: f.get("proposed_modifications") || "",
        applied_status: f.get("ap") || "applied",
        comment: (f.get("operational_impact") || f.get("proposed_modifications") || "Policy audit review").trim()
      };
      const a = S.get("fb", []);
      a.unshift({
        ...payload,
        s: stars >= 4 ? "Positive" : stars === 3 ? "Neutral" : "Negative",
        r: stars,
        c: payload.comment
      });
      S.set("fb", a);

      try {
        await fetch(`/feedback/${encodeURIComponent(payload.sid)}/api/submit/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (err) { }

      toast("Citizen policy audit recorded successfully!");
      route();
    };
  }

  const fl = $("#fl");
  if (fl) {
    fl.onclick = e => {
      const i = e.target.dataset.del;
      if (i === undefined || !confirm("Delete this feedback record?")) return;
      const a = S.get("fb", []);
      a.splice(+i, 1);
      S.set("fb", a);
      route();
    };
  }
};

/* 7.11 Admin / Staff Officer Command Center View */
V.admin = () => {
  if (!currentOfficerUser || !currentOfficerUser.is_staff) {
    return `
    <div class="admin-login-wrapper">
      <div class="admin-login-card">
        <div class="admin-badge-icon">🏛️</div>
        <span class="tag restricted-tag">RESTRICTED GOVERNMENT PORTAL</span>
        <h2>Ministry Officer SSO Login</h2>
        <p class="mu admin-login-sub">Secure command console restricted to authorized Government Officials, Ministry Department Heads, and System Administrators.</p>
        
        <form id="adm-login-form" class="admin-login-form">
          <div class="form-group">
            <label for="adm-user"><b>Officer / Admin Username</b>
              <input type="text" id="adm-user" placeholder="Enter government staff username" required autocomplete="username">
            </label>
          </div>
          <div class="form-group">
            <label for="adm-pass"><b>Security Password / Passcode</b>
              <input type="password" id="adm-pass" placeholder="••••••••••••" required autocomplete="current-password">
            </label>
          </div>
          <div id="adm-login-err" class="admin-error-box" style="display:none"></div>
          <button type="submit" id="adm-login-btn" class="btn pri btn-large" style="width:100%;margin-top:0.5rem">
            Authenticate as Officer ➔
          </button>
        </form>
        <p class="mu admin-legal-note">Authorized access under IT Security &amp; Compliance Guidelines. Authentications are monitored under cyber security compliance.</p>
      </div>
    </div>`;
  }

  const m = ADM(), fb = S.get("fb", []), all = [...D.all.filter(s => !m.deleted.includes(s.id)), ...m.custom], c = { Positive: 0, Neutral: 0, Negative: 0 };
  fb.forEach(x => { if (c[x.s] !== undefined) c[x.s]++; });

  return `
  <div class="admin-top-bar">
    <div>
      <div class="page-title-badge" style="background:#fef3c7;color:#92400e">⚡ Ministry Administration</div>
      <h1 style="margin:4px 0 0;display:flex;align-items:center;gap:.6rem">Officer Command Center</h1>
      <p class="mu" style="margin:.3rem 0 0">Logged in as: <b>${esc(currentOfficerUser.username)}</b> (${currentOfficerUser.is_superuser ? "Super Administrator" : "Ministry Officer"})</p>
    </div>
    <div class="admin-top-actions">
      <a href="/admin/" target="_blank" class="btn" style="background:#0f172a;color:#fff;border-color:#0f172a;font-size:.85rem">Django Database Admin ↗</a>
      <button id="btn-adm-logout" class="btn btn-danger" style="font-size:.85rem">Sign Out</button>
    </div>
  </div>

  <div class="admin-kpi-grid">
    <div class="metric-card"><span class="metric-num">${all.length}</span><span class="metric-label">Central &amp; State Schemes</span></div>
    <div class="metric-card"><span class="metric-num" style="color:#0d6e53">${all.length - m.hidden.filter(h => all.some(s => s.id === h)).length}</span><span class="metric-label">Published &amp; Live</span></div>
    <div class="metric-card"><span class="metric-num">${fb.length}</span><span class="metric-label">Citizen Audits</span></div>
    <div class="metric-card"><span class="metric-num" style="color:#0284c7">${c.Positive}</span><span class="metric-label">Positive Ratings</span></div>
    <div class="metric-card"><span class="metric-num" style="color:#d97706">${c.Neutral}</span><span class="metric-label">Neutral Reviews</span></div>
    <div class="metric-card"><span class="metric-num" style="color:#dc2626">${c.Negative}</span><span class="metric-label">Friction / Issues</span></div>
  </div>

  <div class="sec modern-sync-card">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;margin-bottom:.75rem">
      <h2 style="margin:0;color:var(--accent);display:flex;align-items:center;gap:.5rem">
        <span>🔄</span> <span>Auto-Fetch Government Schemes (AI Simplifier)</span>
      </h2>
      <span class="tag" style="background:#e0f2f1;color:#00695c;font-weight:bold;padding:4px 10px;border-radius:12px">API Setu • data.gov.in • MyGov • Live Feeds</span>
    </div>
    <p class="mu" style="margin-top:0;font-size:.95rem">
      Automatically discover, pull, and simplify Indian government schemes directly from official APIs and announcement feeds. Smarth AI simplifies dense bureaucratic text into clean English &amp; Hindi summaries, key benefits, and eligibility checklists.
    </p>
    <form id="sync-form" class="f" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">
      <div>
        <label style="font-weight:600;display:block;margin-bottom:.35rem">Data Source:</label>
        <select id="sync-source" style="width:100%;padding:.65rem;border:1px solid var(--line);border-radius:8px;background:#fff">
          <option value="national" selected>National Directory (All 1,800+ Central &amp; State Schemes)</option>
          <option value="curated">Verified Ministry Schemes (Live 2024 Feeds)</option>
          <option value="data_gov">Open Government Data (data.gov.in)</option>
          <option value="apisetu">API Setu – myScheme (apisetu.gov.in)</option>
          <option value="mygov">MyGov Developer APIs (developers.mygov.in)</option>
          <option value="feeds">PIB &amp; Ministry Press Feeds (pib.gov.in)</option>
          <option value="all">All Sources (Batch Ingestion)</option>
        </select>
      </div>
      <div>
        <label style="font-weight:600;display:block;margin-bottom:.35rem">Limit Per Source:</label>
        <select id="sync-limit" style="width:100%;padding:.65rem;border:1px solid var(--line);border-radius:8px;background:#fff">
          <option value="5">5 Schemes</option>
          <option value="10" selected>10 Schemes</option>
          <option value="20">20 Schemes</option>
        </select>
      </div>
      <div style="grid-column:1/-1">
        <details style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:.8rem 1rem">
          <summary style="cursor:pointer;font-weight:600;color:var(--ink)">🔑 API Credentials (Optional for Live Feeds, required for official partner portals)</summary>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.75rem;margin-top:.75rem">
            <div><label style="font-size:.82rem;color:var(--mu);display:block;margin-bottom:.2rem">data.gov.in API Key:</label><input type="text" id="sync-datagov-key" placeholder="Enter OGD API Key" style="width:100%;padding:.5rem"></div>
            <div><label style="font-size:.82rem;color:var(--mu);display:block;margin-bottom:.2rem">API Setu Client ID:</label><input type="text" id="sync-apisetu-clientid" placeholder="X-APISETU-CLIENTID" style="width:100%;padding:.5rem"></div>
            <div><label style="font-size:.82rem;color:var(--mu);display:block;margin-bottom:.2rem">API Setu API Key:</label><input type="password" id="sync-apisetu-key" placeholder="X-APISETU-APIKEY" style="width:100%;padding:.5rem"></div>
            <div><label style="font-size:.82rem;color:var(--mu);display:block;margin-bottom:.2rem">MyGov API Key:</label><input type="text" id="sync-mygov-key" placeholder="MyGov API Key" style="width:100%;padding:.5rem"></div>
          </div>
        </details>
      </div>
      <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-top:.5rem">
        <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
          <input type="checkbox" id="sync-use-ai" checked>
          <b>Enable AI Simplification (Qwen / Gemini)</b>
        </label>
        <button type="submit" id="btn-start-sync" class="btn pri btn-large">
          ⚡ Fetch &amp; Ingest Government Schemes
        </button>
      </div>
    </form>
    <div id="sync-status-box" style="display:none;background:#0f172a;color:#f8fafc;padding:1.1rem;border-radius:8px;font-family:monospace;font-size:.88rem;margin-top:1.1rem">
      <div id="sync-spinner" style="font-weight:bold;color:#38bdf8;margin-bottom:.5rem">⏳ Syncing with official government portals...</div>
      <div id="sync-logs" style="max-height:160px;overflow-y:auto;white-space:pre-wrap;color:#cbd5e1;line-height:1.5"></div>
    </div>
  </div>

  <div class="sec" style="border-radius:12px;padding:24px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
      <div>
        <h2 style="margin:0">Manage Catalog Schemes</h2>
        <p class="mu" style="margin:4px 0 0;font-size:0.85rem">Quickly publish, hide, or remove welfare schemes directly from the portal directory.</p>
      </div>
      <input id="adm-search-scheme" placeholder="Filter schemes by name…" style="padding:.5rem .9rem;border-radius:6px;border:1px solid #cbd5e1;min-width:240px">
    </div>
    <div style="overflow:auto;max-height:480px" id="adm-scheme-table-wrap">
      <table class="ct">
        <thead><tr><th>Scheme Name</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="adm-table-body">
          ${all.slice(0, 80).map(s => `
            <tr>
              <td><b>${esc(s.name)}</b><br><span class="mu" style="font-size:.8rem">${esc(s.dept || "")}</span></td>
              <td><span class="tag">${D.cats[s.cat] || s.cat}</span></td>
              <td><span class="tag" style="background:${m.hidden.includes(s.id) ? '#fee2e2;color:#991b1b' : '#dcfce7;color:#166534'}">${m.hidden.includes(s.id) ? "Draft / Hidden" : "Published"}</span></td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn" style="padding:4px 10px;font-size:.8rem" data-tg="${s.id}">${m.hidden.includes(s.id) ? "Publish" : "Unpublish"}</button>
                  <button class="btn btn-danger" style="padding:4px 10px;font-size:.8rem" data-rm="${s.id}">Delete</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  </div>

  <div class="sec" style="border-radius:12px;padding:24px">
    <h2>Add New Scheme Manually</h2>
    <form class="f form-grid-2" id="af">
      <input name="name" placeholder="Scheme Name (e.g. PM Kisan)" required>
      <select name="cat">${Object.entries(D.cats).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>
      <input name="dept" placeholder="Nodal Ministry / Department" required>
      <input name="benefit" placeholder="Core Financial / Welfare Benefit" required>
      <input name="url" type="url" placeholder="Official Portal https:// Link" required>
      <textarea name="desc" placeholder="Brief Summary &amp; Objective" rows="2"></textarea>
      <div style="grid-column:1/-1"><button class="pri btn-large">Add Scheme to Directory ➔</button></div>
    </form>
  </div>

  <div class="sec" style="border-radius:12px;padding:24px">
    <h2>Citizen Feedback &amp; Policy Audits</h2>
    ${fb.length ? `
      <div style="overflow:auto">
        <table class="ct">
          <thead><tr><th>Rating</th><th>Sentiment</th><th>Feedback</th><th>Action</th></tr></thead>
          <tbody>
            ${fb.map((x, i) => `
              <tr>
                <td><span style="color:#f59e0b;font-size:1.1rem">${"★".repeat(x.r)}</span></td>
                <td><span class="tag">${x.s}</span></td>
                <td>${esc(x.c || "No comment")}</td>
                <td><button class="btn btn-danger" style="padding:4px 10px;font-size:.8rem" data-fd="${i}">Delete</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : "<p class='mu'>No citizen feedback records yet.</p>"}
  </div>

  <div class="sec dashboard-action-panel">
    <h3>Data Export &amp; Maintenance</h3>
    <div class="row">
      <button id="e1" class="btn">📥 Export Schemes CSV</button>
      <button id="e2" class="btn">📥 Export Feedback CSV</button>
      <button id="rs" class="btn btn-danger">Reset Local Admin Cache</button>
    </div>
  </div>`;
};

V.admin.after = () => {
  if (!currentOfficerUser || !currentOfficerUser.is_staff) {
    const lf = $("#adm-login-form");
    if (lf) {
      lf.onsubmit = async ev => {
        ev.preventDefault();
        const btn = $("#adm-login-btn"), err = $("#adm-login-err");
        const u = ($("#adm-user")?.value || "").trim(), p = $("#adm-pass")?.value || "";
        btn.disabled = true; btn.textContent = "Authenticating with Government SSO...";
        err.style.display = "none";
        try {
          const res = await fetch("/dashboard/api/auth/login/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: u, password: p })
          });
          const data = await res.json();
          if (data.status === "success") {
            currentOfficerUser = data.user;
            toast("SSO Authenticated successfully! Welcome, " + currentOfficerUser.username);
            route();
          } else {
            err.textContent = data.message || "Invalid government officer credentials.";
            err.style.display = "block";
          }
        } catch (e) {
          err.textContent = "Connection error. Please try again.";
          err.style.display = "block";
        } finally {
          btn.disabled = false; btn.textContent = "Authenticate as Officer ➔";
        }
      };
    }
    return;
  }

  const lo = $("#btn-adm-logout");
  if (lo) {
    lo.onclick = async () => {
      try {
        await fetch("/dashboard/api/auth/logout/", { method: "POST" });
      } catch (e) { }
      currentOfficerUser = null;
      toast("Officer logged out safely.");
      route();
    };
  }

  const sv = m => { S.set("adm", m); applyAdm(); route(); };
  const csv = (n, rows) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" }));
    a.download = n;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const sf = $("#sync-form");
  if (sf) {
    const savedCreds = S.get("api_creds", {});
    if ($("#sync-datagov-key")) $("#sync-datagov-key").value = savedCreds.data_gov_api_key || "";
    if ($("#sync-apisetu-clientid")) $("#sync-apisetu-clientid").value = savedCreds.apisetu_client_id || "";
    if ($("#sync-apisetu-key")) $("#sync-apisetu-key").value = savedCreds.apisetu_api_key || "";
    if ($("#sync-mygov-key")) $("#sync-mygov-key").value = savedCreds.mygov_api_key || "";

    sf.onsubmit = async ev => {
      ev.preventDefault();
      const btn = $("#btn-start-sync"), box = $("#sync-status-box"), sp = $("#sync-spinner"), logs = $("#sync-logs");
      const creds = {
        data_gov_api_key: ($("#sync-datagov-key")?.value || "").trim(),
        apisetu_client_id: ($("#sync-apisetu-clientid")?.value || "").trim(),
        apisetu_api_key: ($("#sync-apisetu-key")?.value || "").trim(),
        mygov_api_key: ($("#sync-mygov-key")?.value || "").trim(),
      };
      S.set("api_creds", creds);
      btn.disabled = true; btn.textContent = "⏳ Fetching & Ingesting...";
      box.style.display = "block";
      sp.textContent = "🔄 Contacting Government APIs & Running Smarth AI Simplifier...";
      logs.textContent = "Job initiated: Connecting to selected government endpoints...\n";
      try {
        const resp = await fetch("/api/schemes/sync/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: $("#sync-source").value,
            limit: parseInt($("#sync-limit").value, 10) || 10,
            use_ai: $("#sync-use-ai").checked,
            credentials: creds
          })
        });
        const res = await resp.json();
        if (res.status === "success") {
          sp.innerHTML = `✅ <b>Sync Completed!</b> Added: ${res.created}, Updated: ${res.updated}, Active in Portal: ${res.total_active}`;
          logs.textContent = (res.logs || []).join("\n") + "\n\nSuccess: Database & static/js/data.js updated.\nReloading catalog...";
          toast(`Synced ${res.created} new schemes!`);
          setTimeout(() => location.reload(), 2200);
        } else {
          sp.innerHTML = `❌ <b>Sync Failed:</b> ${esc(res.error || "Unknown error")}`;
          logs.textContent += "\n" + JSON.stringify(res, null, 2);
        }
      } catch (err) {
        sp.innerHTML = `❌ <b>Error:</b> ${esc(err.message)}`;
        logs.textContent += "\n" + err.stack;
      } finally {
        btn.disabled = false; btn.textContent = "⚡ Fetch & Ingest Government Schemes";
      }
    };
  }

  const af = $("#af");
  if (af) {
    af.onsubmit = e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target)), m = ADM();
      m.custom.push({
        id: "c" + Date.now(),
        name: f.name,
        cat: f.cat,
        lvl: "Central",
        dept: f.dept,
        benefit: f.benefit,
        desc: f.desc || f.benefit,
        elig: ["See official website"],
        docs: ["See official website"],
        apply: "Apply on the official website.",
        url: f.url,
        r: {}
      });
      sv(m);
    };
  }

  const searchInput = $("#adm-search-scheme");
  if (searchInput) {
    searchInput.oninput = () => {
      const q = searchInput.value.trim().toLowerCase();
      const filtered = all.filter(s => !q || s.name.toLowerCase().includes(q) || (s.dept && s.dept.toLowerCase().includes(q)));
      const tbody = $("#adm-table-body");
      if (tbody) {
        tbody.innerHTML = filtered.slice(0, 80).map(s => `
          <tr>
            <td><b>${esc(s.name)}</b><br><span class="mu" style="font-size:.8rem">${esc(s.dept || "")}</span></td>
            <td><span class="tag">${D.cats[s.cat] || s.cat}</span></td>
            <td><span class="tag" style="background:${m.hidden.includes(s.id) ? '#fee2e2;color:#991b1b' : '#dcfce7;color:#166534'}">${m.hidden.includes(s.id) ? "Draft / Hidden" : "Published"}</span></td>
            <td>
              <div style="display:flex;gap:6px">
                <button class="btn" style="padding:4px 10px;font-size:.8rem" data-tg="${s.id}">${m.hidden.includes(s.id) ? "Publish" : "Unpublish"}</button>
                <button class="btn btn-danger" style="padding:4px 10px;font-size:.8rem" data-rm="${s.id}">Delete</button>
              </div>
            </td>
          </tr>
        `).join("") || "<tr><td colspan='4' class='mu' style='text-align:center;padding:1rem'>No schemes found matching search.</td></tr>";
      }
    };
  }

  const mainEl = $("#main");
  if (mainEl) {
    mainEl.onclick = e => {
      const d = e.target.dataset, m = ADM();
      if (d.tg) {
        m.hidden = m.hidden.includes(d.tg) ? m.hidden.filter(x => x !== d.tg) : [...m.hidden, d.tg];
        sv(m);
      } else if (d.rm && confirm("Delete this scheme?")) {
        m.custom = m.custom.filter(s => s.id !== d.rm);
        if (D.all.some(s => s.id === d.rm)) m.deleted.push(d.rm);
        sv(m);
      } else if (d.fd !== undefined && confirm("Delete feedback?")) {
        const f = S.get("fb", []);
        f.splice(+d.fd, 1);
        S.set("fb", f);
        route();
      } else if (d.rp !== undefined) {
        const r = S.get("reports", []);
        r.splice(+d.rp, 1);
        S.set("reports", r);
        route();
      }
    };
  }

  const e1 = $("#e1"), e2 = $("#e2"), rs = $("#rs");
  if (e1) e1.onclick = () => csv("schemes.csv", [["Name", "Category", "Department", "Benefit", "URL"], ...[...D.all, ...ADM().custom].map(s => [s.name, s.cat, s.dept, s.benefit, s.url])]);
  if (e2) e2.onclick = () => csv("feedback.csv", [["Scheme", "Rating", "Sentiment", "Applied", "Comment"], ...S.get("fb", []).map(x => [x.sid, x.r, x.s, x.ap, x.c])]);
  if (rs) {
    rs.onclick = () => {
      if (confirm("Reset all local admin data?")) {
        Object.keys(localStorage).filter(k => k.startsWith("sm_")).forEach(k => localStorage.removeItem(k));
        applyAdm();
        applyPrefs();
        route();
      }
    };
  }
};

/* 404 View */
V.nf = () => `
<div class="hero modern-hero-card" style="text-align:center;padding:3rem 1.5rem">
  <h1>404 – Page Not Found</h1>
  <p class="mu">The requested scheme or page could not be located in the national directory.</p>
  <div style="margin-top:1.5rem">
    <a class="btn pri" href="index.html">Return to Portal Home</a>
  </div>
</div>`;

/* ==========================================================================
   Visual Effects: Subtle Particles, 3D Tilt, Intro Loader, and Router
   ========================================================================== */
const M = { x: -999, y: -999 };

function fx() {
  const c = $("#fx");
  if (!c) return;
  if (matchMedia("(prefers-reduced-motion:reduce)").matches || window.innerWidth < 768) {
    c.style.display = "none";
    return;
  }
  const x = c.getContext("2d");
  let W, H;
  const rs = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
  rs();
  addEventListener("resize", rs);

  const P = Array.from({ length: Math.min(26, innerWidth / 30 | 0) }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.5 + .4,
    vx: (Math.random() - .5) * .22,
    vy: (Math.random() - .5) * .22,
    k: Math.random() < .5
  }));

  let active = true;
  document.addEventListener("visibilitychange", () => {
    active = !document.hidden;
    if (active) requestAnimationFrame(f);
  });

  (function f() {
    if (!active) return;
    x.clearRect(0, 0, W, H);
    P.forEach((p, i) => {
      const dx = p.x - M.x, dy = p.y - M.y, d = Math.hypot(dx, dy);
      if (d < 100) {
        p.x += dx / d * 1.1;
        p.y += dy / d * 1.1;
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      for (let k = i + 1; k < P.length; k++) {
        const q = P[k], e = Math.hypot(p.x - q.x, p.y - q.y);
        if (e < 85) {
          x.globalAlpha = (1 - e / 85) * .22;
          x.strokeStyle = "#0e7c7b";
          x.beginPath();
          x.moveTo(p.x, p.y);
          x.lineTo(q.x, q.y);
          x.stroke();
        }
      }
      x.globalAlpha = .25;
      x.fillStyle = p.k ? "#0e7c7b" : "#16324f";
      x.beginPath();
      x.arc(p.x, p.y, p.r, 0, 7);
      x.fill();
    });
    requestAnimationFrame(f);
  })();
}

function ui3d() {
  const root = document.documentElement,
    fine = matchMedia("(pointer:fine)").matches,
    calm = matchMedia("(prefers-reduced-motion:reduce)").matches;

  if (fine && !calm) {
    const dot = document.createElement("div"), ring = document.createElement("div");
    dot.id = "cdot";
    ring.id = "cring";
    document.body.append(dot, ring);
    let rx = 0, ry = 0;

    (function t() {
      rx += (M.x - rx) * .18;
      ry += (M.y - ry) * .18;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(t);
    })();

    addEventListener("mousemove", e => {
      M.x = e.clientX;
      M.y = e.clientY;
      dot.style.transform = `translate(${M.x}px,${M.y}px) translate(-50%,-50%)`;
      root.style.setProperty("--px", (e.clientX / innerWidth - .5).toFixed(3));
      root.style.setProperty("--py", (e.clientY / innerHeight - .5).toFixed(3));
      ring.classList.toggle("hot", !!e.target.closest("a,button,input,select,textarea,summary,.card"));

      const el = e.target.closest(".card");
      if (ui3d.last && ui3d.last !== el) ui3d.last.style.transform = "";
      ui3d.last = el;
      if (el) {
        const r = el.getBoundingClientRect(),
          px = (e.clientX - r.left) / r.width,
          py = (e.clientY - r.top) / r.height;
        el.style.transform = `perspective(800px) rotateX(${((.5 - py) * 8).toFixed(1)}deg) rotateY(${((px - .5) * 10).toFixed(1)}deg) translateZ(6px)`;
      }
    });

    document.addEventListener("mouseleave", () => {
      M.x = M.y = -999;
      if (ui3d.last) ui3d.last.style.transform = "";
    });
  }

  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: .08 });

  const mark = () => document.querySelectorAll("#main .card:not(.rv),#main .sec:not(.rv),#main h2:not(.rv)").forEach(n => {
    n.classList.add("rv");
    io.observe(n);
  });
  new MutationObserver(mark).observe($("#main"), { childList: true, subtree: true });
  mark();
}

/* Polished & Streamlined Intro Loader (Duration 2.2s, skippable in 1 click) */
function intro() {
  let seen;
  try { seen = sessionStorage.getItem("seen_intro"); } catch { }
  if (document.body.dataset.page !== "home" || seen) return;

  const d = document.createElement("div");
  d.id = "intro";
  d.innerHTML = `
  <div class="loader-content">
    <div class="flag-frame">
      <img src="/static/img/indian-flag-loader.jpg" alt="National Flag of India" class="loader-flag">
    </div>
    <div class="loader-badge">🇮🇳 राष्ट्रीय नीति एवं जन कल्याण पोर्टल</div>
    <h1>SMARTH AI</h1>
    <p class="loader-motto">यतो धर्मस्ततो जयः • राष्ट्र सर्वोपरि</p>
    <p class="loader-sub">Empowering 1.4 Billion Citizens • Direct Access to 1,868+ Verified Welfare Schemes</p>
    <div class="loader-progress-wrap"><div class="loader-progress-bar" id="loader-bar"></div></div>
    <div class="loader-status" id="loader-status">Initializing National Scheme Registry...</div>
    <button class="loader-skip" id="loader-skip">Enter Portal ➔</button>
  </div>`;
  document.body.append(d);

  const bar = d.querySelector("#loader-bar");
  const st = d.querySelector("#loader-status");
  const startTime = Date.now();
  const totalDuration = 2200; // Streamlined 2.2 seconds duration

  const close = () => {
    if (d.classList.contains("out")) return;
    try { sessionStorage.setItem("seen_intro", "1"); } catch { }
    d.classList.add("out");
    setTimeout(() => d.remove(), 600);
  };

  const skipBtn = d.querySelector("#loader-skip");
  if (skipBtn) skipBtn.onclick = close;
  d.onclick = e => { if (e.target === d) close(); };

  const timer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
    if (bar) bar.style.width = progress + "%";
    if (elapsed < 700) {
      if (st) st.textContent = "Connecting to National Scheme Registry (myScheme)...";
    } else if (elapsed < 1400) {
      if (st) st.textContent = "Loaded 1,868+ Central & State Welfare Schemes...";
    } else if (elapsed < 2000) {
      if (st) st.textContent = "Optimizing AI Verification & Eligibility Engine...";
    } else {
      if (st) st.textContent = "Ready! Welcome to Smarth AI.";
    }
    if (elapsed >= totalDuration) {
      clearInterval(timer);
      close();
    }
  }, 40);
}

/* Floating Compare Bar */
const cbar = () => {
  let b = $("#cbar");
  const n = S.get("cmp", []).length;
  if (!n || document.body.dataset.page === "compare") {
    b && b.remove();
    return;
  }
  if (!b) {
    b = document.createElement("div");
    b.id = "cbar";
    document.body.append(b);
  }
  b.innerHTML = `
    <span class="cbar-count"><b>${n}</b> selected for comparison</span>
    <a class="btn pri btn-cbar-go" href="compare.html">${t("compare")}</a>
    <button id="cx" class="btn-cbar-close" title="Clear comparison selection">✕</button>
  `;
  const cx = $("#cx");
  if (cx) {
    cx.onclick = () => {
      S.set("cmp", []);
      $$("[data-cmp]").forEach(i => i.checked = false);
      cbar();
    };
  }
};

document.addEventListener("change", e => {
  const id = e.target.dataset && e.target.dataset.cmp;
  if (!id) return;
  let a = S.get("cmp", []);
  if (e.target.checked) {
    if (a.length >= 3) {
      e.target.checked = false;
      return toast("You can compare up to 3 schemes at once");
    }
    a.push(id);
  } else {
    a = a.filter(x => x !== id);
  }
  S.set("cmp", a);
  cbar();
});

/* Main Application Router */
function route() {
  const name = document.body.dataset.page || "home";
  const p = new URLSearchParams(location.search);
  const id = p.get("id");
  const v = V[name] || V.nf;

  const navEl = $("#nav");
  if (navEl) {
    navEl.innerHTML = NAV.map(([h, k]) => {
      const isHome = name === "home" && h === "index";
      const isActive = isHome || name === h;
      return `
        <a href="${h}.html" class="nav-item ${isActive ? 'on' : ''}">
          <span class="nav-icon">${NI[k] || ""}</span>
          <span class="nav-label">${t(k)}</span>
        </a>
      `;
    }).join("");
  }

  const mainEl = $("#main");
  if (mainEl) {
    mainEl.innerHTML = v(p, id);
    if (v.after) v.after(p, id);
  }

  cbar();
  document.title = "Smarth AI | " + (name === "home" ? "National Government Scheme Guide" : (t(name) || name));
}

// Check officer session on startup
(async () => {
  try {
    const res = await fetch("/dashboard/api/auth/status/");
    const data = await res.json();
    if (data.authenticated && data.is_staff) {
      currentOfficerUser = data;
      route();
    }
  } catch (e) { }
})();

/* Initialization */
applyPrefs();
initMobileMenu();
fx();
route();
intro();
ui3d();
