"use strict";
const D = window.DATA, $ = (s, p = document) => p.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = u => {
  if (!u) return "#";
  try {
    const p = new URL(u, window.location.origin);
    return (p.protocol === "http:" || p.protocol === "https:") ? p.href : "#";
  } catch (e) {
    return "#";
  }
};
const S = { get(k, d) { try { const v = localStorage.getItem("sm_" + k); return v === null ? d : JSON.parse(v) } catch { return d } }, set(k, v) { try { localStorage.setItem("sm_" + k, JSON.stringify(v)) } catch { } } };
const TX = {
  en: { compare: "Compare", checklist: "Doc Checklist", home: "Home", schemes: "Schemes", eligibility: "Eligibility", assistant: "AI Assistant", services: "Services", feedback: "Feedback", dashboard: "My Dashboard", admin: "Admin", h1: "Discover. Understand. Check eligibility. Apply officially.", sub: "Find Indian government schemes, understand benefits and reach official application portals.", search: "Search schemes…" },
  hi: { compare: "तुलना", checklist: "दस्तावेज़ चेकलिस्ट", home: "होम", schemes: "योजनाएँ", eligibility: "पात्रता", assistant: "AI सहायक", services: "सेवाएँ", feedback: "प्रतिक्रिया", dashboard: "मेरा डैशबोर्ड", admin: "एडमिन", h1: "खोजें. समझें. पात्रता जाँचें. आधिकारिक रूप से आवेदन करें.", sub: "भारत सरकार की योजनाएँ खोजें, लाभ समझें और आधिकारिक पोर्टल तक पहुँचें।", search: "योजना खोजें…" }
};
let lang = S.get("lang", "en"); const t = k => TX[lang][k] || TX.en[k] || k;
const toast = m => { const e = $("#toast"); e.textContent = m; e.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("show"), 2200) };
const ADM = () => S.get("adm", { custom: [], hidden: [], deleted: [] }); D.all = [...D.schemes];
const indexSchemes = () => { D.schemes.forEach(s => { s._s = (s.name + " " + (s.desc || "") + " " + (s.desc_hi || "") + " " + (s.dept || "") + " " + (s.benefit || "") + " " + (s.state || "") + " " + (D.cats[s.cat] || "")).toLowerCase() }) };
const applyAdm = () => { const m = ADM(); D.schemes = [...D.all.filter(s => !m.deleted.includes(s.id)), ...m.custom].filter(s => !m.hidden.includes(s.id)); indexSchemes() };
applyAdm();
const byId = id => D.schemes.find(s => s.id === id);
const push = (k, v, max = 10) => { const a = S.get(k, []).filter(x => x !== v && JSON.stringify(x) !== JSON.stringify(v)); a.unshift(v); S.set(k, a.slice(0, max)) };
const ICON = { agriculture: "🌾", education: "🎓", health: "🩺", housing: "🏠", women: "👩", employment: "💼", finance: "💰", senior: "🧓", social: "🛡️", business: "🏭", rural: "🏘️" }, NI = { compare: "⚖️", checklist: "📑", home: "🏛️", schemes: "📋", eligibility: "✅", assistant: "🎤", services: "🔗", feedback: "⭐", dashboard: "👤", admin: "⚙️" };
const GL = { farmer: ["Farmers", "किसान"], student: ["Students", "छात्र"], women: ["Women & girls", "महिलाएँ"], senior: ["Senior citizens", "बुजुर्ग"], worker: ["Workers", "श्रमिक"], business: ["Entrepreneurs", "उद्यमी"], housing: ["Housing seekers", "आवास"], everyone: ["Everyone", "सभी"] }, GI = { farmer: "🌾", student: "🎓", women: "👩", senior: "🧓", worker: "👷", business: "🏭", housing: "🏠", everyone: "🇮🇳" };
const GM = { "pm-kisan": ["farmer"], pmfby: ["farmer"], "ab-pmjay": ["everyone", "senior"], pmay: ["housing"], ssy: ["women"], pmuy: ["women"], apy: ["worker", "senior"], mudra: ["business"], nsp: ["student"], pmjdy: ["everyone"], pmvishwakarma: ["business", "worker"], pmkvy: ["student", "worker"], mgnrega: ["worker", "farmer"] }, CG = { agriculture: ["farmer"], education: ["student"], women: ["women"], senior: ["senior"], employment: ["worker"], business: ["business"], housing: ["housing"] };
const whoOf = s => GM[s.id] || CG[s.cat] || ["everyone"], gl = k => GL[k][lang === "hi" ? 1 : 0];
const VER = "2026-11-14", ver = () => { const d = Math.floor((Date.now() - new Date(VER)) / 864e5); return d > 90 ? `<span class="vb old">⚠ Last verified ${d} days ago – may be outdated</span>` : `<span class="vb">✔ Verified ${d <= 0 ? "today" : d + " days ago"}</span>` };
const card = s => `<article class="card"><div class="ic">${ICON[s.cat] || "📌"}</div><div><span class="tag">${s.lvl}</span><span class="tag">${D.cats[s.cat]}</span>${s.state ? `<span class="tag" style="background:#e8eaf6;color:#283593;font-weight:600">📍 ${esc(s.state)}</span>` : ""}</div><h3>${esc(s.name)}</h3><div class="ben">${esc(s.benefit)}</div><div class="mu">${esc(s.dept)}</div><div class="row"><a class="btn pri" href="scheme.html?id=${s.id}">Details</a><label class="cmp"><input type="checkbox" data-cmp="${s.id}"${S.get("cmp", []).includes(s.id) ? " checked" : ""}> ${t("compare")}</label></div></article>`;
const NAV = [["index", "home"], ["schemes", "schemes"], ["compare", "compare"], ["checklist", "checklist"], ["eligibility", "eligibility"], ["assistant", "assistant"], ["services", "services"], ["feedback", "feedback"], ["dashboard", "dashboard"]];
let currentOfficerUser = null;

/* Theme / font / language */
const applyPrefs = () => { document.documentElement.style.fontSize = S.get("font", 16) + "px"; document.documentElement.lang = lang };
$("#bLang").onclick = () => { lang = lang === "en" ? "hi" : "en"; S.set("lang", lang); route() };
$("#bFontP").onclick = () => { S.set("font", Math.min(22, S.get("font", 16) + 1)); applyPrefs() };
$("#bFontM").onclick = () => { S.set("font", Math.max(13, S.get("font", 16) - 1)); applyPrefs() };

/* Views */
const V = {};
V.home = () => {
  const pop = D.schemes.slice(0, 6); return `<section class="hero"><div class="ht"><p class="eyebrow">✦ भारत सरकार एवं राज्य सरकार की योजनाएँ · ${D.schemes.length} official schemes</p><h1>${t("h1")}</h1><p>${t("sub")}</p>
<form class="bar" id="hs"><input id="hq" placeholder="${t("search")}" aria-label="Search"><button class="pri">Search</button></form>
<div class="steps"><span>Discover</span>→<span>Understand</span>→<span>Eligibility</span>→<span>Guidance</span>→<span>Apply</span></div>
<div class="row"><a class="btn pri" href="eligibility.html">Check eligibility</a><a class="btn" href="assistant.html">🎤 Talk to Smarth AI</a></div></div>
<div class="stambhwrap"><img src="/static/img/ashoka-stambh.jpg" alt="Ashoka Stambh — National Emblem of India" class="stambh-photo"></div></section>
<h2>Browse by category</h2><div class="grid cats">${Object.entries(D.cats).map(([k, v]) => `<a class="card tile" href="schemes.html?cat=${k}"><div class="ic">${ICON[k]}</div><b>${v}</b><span class="mu">${D.schemes.filter(s => s.cat === k).length} schemes</span></a>`).join("")}</div>
<h2>Browse by who you are</h2><div class="chips">${Object.keys(GL).map(k => `<a class="chip" href="schemes.html?who=${k}">${GI[k]} ${gl(k)} (${D.schemes.filter(s => whoOf(s).includes(k)).length})</a>`).join("")}</div>
<h2>Smart tools</h2><div class="grid"><a class="card tile" href="compare.html"><div class="ic">⚖️</div><b>Compare schemes</b><span class="mu">Put two schemes side by side: benefits, eligibility, documents and process.</span></a><a class="card tile" href="checklist.html"><div class="ic">📑</div><b>Document readiness checker</b><span class="mu">Tick the documents you have and track your progress.</span></a></div>
<h2>How Smarth AI works</h2><div class="grid">${[["🔍", "1. Discover", `Browse ${D.schemes.length} central & state schemes by category or search.`, "schemes.html"], ["📖", "2. Understand", "Open a scheme to see benefits, documents and steps.", "schemes.html"], ["✅", "3. Check eligibility", "Enter age, income and occupation to see matches.", "eligibility.html"], ["🚀", "4. Apply officially", "Use the official link shown on every scheme page.", "schemes.html"]].map(x => `<a class="card tile" href="${x[3]}"><div class="ic">${x[0]}</div><b>${x[1]}</b><span class="mu">${x[2]}</span></a>`).join("")}</div>
<h2>Popular schemes</h2><div class="grid">${pop.map(card).join("")}</div>
<h2>FAQ</h2>${D.faq.map(f => `<details><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join("")}`
};
V.home.after = () => { $("#hs").onsubmit = e => { e.preventDefault(); location.href = "schemes.html?q=" + encodeURIComponent($("#hq").value) } };

V.schemes = p => {
  const states = [...new Set(D.schemes.map(s => s.state).filter(Boolean))].sort();
  return `<h1>${t("schemes")} <span class="mu" style="font-size:1.1rem;font-weight:normal">(${D.schemes.length} total)</span></h1>
  <div class="bar">
    <input id="q" placeholder="${t("search")}" value="${esc(p.get("q") || "")}">
    <select id="cat"><option value="">All categories</option>${Object.entries(D.cats).map(([k, v]) => `<option value="${k}"${p.get("cat") === k ? " selected" : ""}>${v}</option>`).join("")}</select>
    <select id="lvl"><option value="">Central &amp; State</option><option>Central</option><option>State</option></select>
    <select id="st"><option value="">All States &amp; UTs</option>${states.map(s => `<option value="${esc(s)}"${p.get("state") === s ? " selected" : ""}>${esc(s)}</option>`).join("")}</select>
    <select id="who"><option value="">All groups</option>${Object.keys(GL).map(k => `<option value="${k}"${p.get("who") === k ? " selected" : ""}>${gl(k)}</option>`).join("")}</select>
    <select id="sort"><option value="">Default order</option><option value="az">A–Z</option></select>
  </div>
  <div id="list" class="grid"></div>`;
};
V.schemes.after = () => {
  let pageLimit = 48, deb;
  const draw = (resetPage = true) => {
    if (resetPage) pageLimit = 48;
    const q = ($("#q")?.value || "").trim().toLowerCase(),
      c = $("#cat")?.value || "",
      l = $("#lvl")?.value || "",
      st = $("#st")?.value || "",
      so = $("#sort")?.value || "",
      w = $("#who")?.value || "";
    if (q) push("searches", q, 8);
    let r = D.schemes.filter(s => (!c || s.cat === c) && (!l || s.lvl === l) && (!st || s.state === st) && (!w || whoOf(s).includes(w)) && (!q || (s._s ? s._s.includes(q) : (s.name + s.desc + s.dept).toLowerCase().includes(q))));
    if (so === "az") r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    const visible = r.slice(0, pageLimit);
    let html = visible.map(card).join("");
    if (r.length > pageLimit) {
      html += `<div style="grid-column:1/-1;text-align:center;padding:1.5rem">
        <p class="mu">Showing <b>${visible.length}</b> of <b>${r.length}</b> matching schemes</p>
        <button id="btn-load-more" class="btn pri" style="padding:.7rem 2.2rem;font-size:1rem;cursor:pointer">
          Load More Schemes (+${Math.min(48, r.length - pageLimit)} more)
        </button>
      </div>`;
    }
    $("#list").innerHTML = r.length ? html : `<div class="sec" style="grid-column:1/-1"><h2>No schemes found</h2><p class="mu">Try a different search keyword or clear filters.</p></div>`;
    const lm = $("#btn-load-more");
    if (lm) lm.onclick = () => { pageLimit += 48; draw(false); };
  };
  $("#q")?.addEventListener("input", () => { clearTimeout(deb); deb = setTimeout(() => draw(true), 100) });
  ["cat", "lvl", "st", "who", "sort"].forEach(i => { const el = $("#" + i); if (el) el.addEventListener("change", () => draw(true)) });
  draw(true);
};

V.scheme = (p, id) => {
  const s = byId(id); if (!s) return V.nf(); push("recent", id, 8); const L = a => `<ul>${a.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`; const saved = S.get("saved", []).includes(id);
  const rel = D.schemes.filter(x => x.cat === s.cat && x.id !== id).slice(0, 3);
  return `<a href="schemes.html">← All schemes</a><h1>${esc(s.name)}</h1><div><span class="tag">${s.lvl}</span><span class="tag">${D.cats[s.cat]}</span>${s.state ? `<span class="tag" style="background:#e8eaf6;color:#283593;font-weight:600">📍 ${esc(s.state)}</span>` : ""}<span class="tag">${esc(s.dept)}</span>${ver()}</div>
<div class="row"><button id="sv" class="pri">${saved ? "★ Saved" : "☆ Save"}</button><button id="sh">Share</button><button id="pr">Print / PDF</button><button id="rp">Report a problem</button><a class="btn" href="assistant.html?q=${encodeURIComponent("Tell me about " + s.name)}">Ask AI</a></div>
<div class="sec"><h2>About</h2><p id="sc-about">${esc(lang === "hi" && (s.desc_hi || s.desc) || s.desc)}</p>${s.desc_hi && lang !== "hi" ? `<details style="margin-top:.5rem"><summary class="mu" style="cursor:pointer">हिंदी विवरण (Hindi Summary)</summary><p style="margin-top:.4rem">${esc(s.desc_hi)}</p></details>` : ""}</div>
<div class="sec"><h2>Benefits</h2><p id="sc-ben" class="ben">${esc(s.benefit)}</p></div>
<div class="sec"><h2>Eligibility (indicative)</h2><div id="sc-elig">${L(s.elig)}</div></div>
<div class="sec"><h2>Documents</h2><div id="sc-docs">${L(s.docs)}</div></div>
<div class="sec"><h2>How to apply</h2><p id="sc-apply">${esc(s.apply)}</p><div class="row"><a class="btn pri" id="sc-url" href="${safeUrl(s.url)}" target="_blank" rel="noopener noreferrer">Official website ↗</a><button id="cp">Copy link</button><a class="btn" href="feedback.html?sid=${s.id}" style="background:#0b5351;color:#fff">📝 Policy Audit & Experience</a></div>
<p class="mu">Details can change. Confirm everything on the official site before applying.</p></div>
<div class="sec" id="sc-breakdown-sec">
  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem">
    <h2>⚖️ Clause-by-Clause Policy Breakdown & Hidden Points (बारीकियाँ & छिपी शर्तें)</h2>
    <a class="btn" href="feedback.html?sid=${s.id}" style="border:1px solid var(--accent);color:var(--ink)">📝 Submit Audit</a>
  </div>
  <p class="mu">Gazette clauses translated into plain words with everyday examples, plus unwritten conditions (NPCI DBT mapping, 1-per-family limits, document expiry).</p>
  <div id="sc-breakdown-box" style="margin-top:1rem">
    <div style="padding:1rem;background:#f8f9fa;border-radius:8px;border:1px dashed #cbd5e1;text-align:center">
      <span class="spinner" style="display:inline-block;width:18px;height:18px;border:2px solid #ccc;border-top-color:#0b5351;border-radius:50%;animation:spin .8s linear infinite;vertical-align:middle;margin-right:8px"></span>
      Analyzing policy clauses and uncovering fine print…
    </div>
  </div>
</div>
${rel.length ? `<h2>Related schemes</h2><div class="grid">${rel.map(card).join("")}</div>` : ""}`
};
V.scheme.after = (p, id) => {
  const s = byId(id); if (!s) return;
  fetch(`/api/schemes/${encodeURIComponent(id)}/`).then(r => r.ok ? r.json() : null).then(d => {
    if (!d) return;
    if (d.benefits && $("#sc-ben")) $("#sc-ben").textContent = d.benefits;
    if (d.how_to_apply && $("#sc-apply")) $("#sc-apply").textContent = d.how_to_apply;
    if (d.eligibility?.length && $("#sc-elig")) $("#sc-elig").innerHTML = `<ul>${d.eligibility.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
    if (d.documents_required?.length && $("#sc-docs")) $("#sc-docs").innerHTML = `<ul>${d.documents_required.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  }).catch(() => { });
  const renderBreakdown = (bk) => {
    if (!bk || !bk.clauses) return;
    const cHtml = bk.clauses.map((c, i) => `
    <div style="margin-bottom:1rem;padding:1rem;border-left:4px solid var(--accent);background:rgba(11,83,81,0.03);border-radius:0 8px 8px 0">
      <h3 style="margin:0 0 .4rem 0;color:var(--pri)">${esc(c.clause_title || `Clause ${i + 1}`)}</h3>
      <div style="margin-bottom:.4rem"><b style="font-size:0.8rem;color:#64748b;text-transform:uppercase;letter-spacing:.5px">📜 Official Gazette Clause:</b><p style="margin:.2rem 0;font-size:0.92rem;color:#334155">${esc(c.official_content)}</p></div>
      <div style="margin-bottom:.4rem"><b style="font-size:0.8rem;color:#059669;text-transform:uppercase;letter-spacing:.5px">💡 Plain Words (सरल शब्दों में):</b><p style="margin:.2rem 0;font-size:0.92rem;font-weight:500;color:#0f172a">${esc(c.plain_words)}</p></div>
      <div style="background:#fff;padding:.5rem .7rem;border-radius:6px;border:1px solid #e2e8f0"><b style="font-size:0.8rem;color:#d97706;text-transform:uppercase;letter-spacing:.5px">👤 Concrete Example:</b><p style="margin:.2rem 0;font-size:0.88rem;color:#475569;font-style:italic">"${esc(c.example)}"</p></div>
    </div>
  `).join("");
    const hHtml = bk.hidden_points && bk.hidden_points.length ? `
    <div style="margin-top:1.2rem;padding:1rem;background:#fffbeb;border:1px solid #fde68a;border-radius:8px">
      <h3 style="margin:0 0 .5rem 0;color:#b45309;display:flex;align-items:center;gap:.5rem">⚠️ Hidden Points & Fine Print (छिपी शर्तें और नियम)</h3>
      <p style="font-size:0.85rem;color:#92400e;margin-bottom:.8rem">Critical points not emphasized in banners, but strictly checked by officials:</p>
      <div style="display:grid;gap:.6rem">
        ${bk.hidden_points.map(h => `
          <div style="padding:.6rem .8rem;background:#ffffff;border-radius:6px;border:1px solid #fef3c7">
            <b style="color:#b45309;font-size:0.92rem;display:block">⚡ ${esc(h.title)}</b>
            <p style="margin:.2rem 0 0 0;font-size:0.86rem;color:#451a03">${esc(h.detail)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `: "";
    const box = $("#sc-breakdown-box");
    if (box) box.innerHTML = `<div>${cHtml}${hHtml}</div>`;
  };
  fetch(`/api/schemes/${encodeURIComponent(id)}/breakdown/`)
    .then(r => r.ok ? r.json() : null)
    .then(d => { if (d && d.breakdown) renderBreakdown(d.breakdown); else if ($("#sc-breakdown-box")) $("#sc-breakdown-box").innerHTML = "<p class='mu'>Policy breakdown available on official gazette portal.</p>" })
    .catch(() => { if ($("#sc-breakdown-box")) $("#sc-breakdown-box").innerHTML = "<p class='mu'>Policy breakdown offline. Check official ministry portal.</p>" });
  $("#sv").onclick = () => { let a = S.get("saved", []); const has = a.includes(id); a = has ? a.filter(x => x !== id) : [...a, id]; S.set("saved", a); $("#sv").textContent = has ? "☆ Save" : "★ Saved"; toast(has ? "Removed" : "Saved") };
  $("#pr").onclick = () => print(); $("#rp").onclick = () => { const m = prompt("What is wrong or outdated on this page?"); if (!m || !m.trim()) return; const a = S.get("reports", []); a.unshift({ sid: id, m: m.trim().slice(0, 300), t: new Date().toLocaleDateString("en-IN") }); S.set("reports", a); toast("Thanks – report saved on this device") };
  $("#sh").onclick = async () => { const d = { title: s.name, text: s.name + " – " + s.benefit, url: s.url }; try { if (navigator.share) await navigator.share(d); else { await navigator.clipboard.writeText(d.text + " " + d.url); toast("Copied to clipboard") } } catch { } };
  $("#cp").onclick = async () => { try { await navigator.clipboard.writeText(s.url); toast("Link copied") } catch { toast("Copy failed") } }
};

/* Eligibility */
const OCC = { student: "Student", farmer: "Farmer", employee: "Salaried employee", selfemployed: "Self-employed / artisan", unemployed: "Unemployed / job seeker", homemaker: "Homemaker", retired: "Retired" };
const check = (s, u) => {
  const r = s.r || {}, miss = []; if (r.a && (u.age < r.a[0] || u.age > r.a[1])) miss.push(`Age must be ${r.a[0]}–${r.a[1]}`);
  if (r.g === "f" && u.gender !== "female") miss.push("For women / girl child only");
  if (r.o && !r.o.includes(u.occ)) miss.push("Usually for: " + r.o.map(o => OCC[o]).join(", "));
  if (r.i && u.income > r.i) miss.push(`Annual family income usually up to ₹${r.i.toLocaleString("en-IN")}`); return miss
};
V.eligibility = () => `<h1>Eligibility checker</h1><p class="mu">Indicative only. Rules here are simplified and are not an official decision.</p>
<form class="f" id="ef"><label>Age<input name="age" type="number" min="0" max="120" required></label>
<label>Gender<select name="gender"><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></label>
<label>Occupation<select name="occ">${Object.entries(OCC).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>
<label>Annual family income (₹)<input name="income" type="number" min="0" required></label>
<button class="pri">Check</button></form><div id="res"></div>`;
V.eligibility.after = () => {
  $("#ef").onsubmit = e => {
    e.preventDefault(); const f = new FormData(e.target), u = { age: +f.get("age"), gender: f.get("gender"), occ: f.get("occ"), income: +f.get("income") };
    const rs = D.schemes.map(s => ({ s, m: check(s, u) })), ok = rs.filter(x => !x.m.length), no = rs.filter(x => x.m.length);
    push("elig", { t: new Date().toLocaleString("en-IN"), age: u.age, occ: OCC[u.occ], n: ok.length }, 8);
    $("#res").innerHTML = `<h2>${ok.length} possible match${ok.length === 1 ? "" : "es"}</h2>` + (ok.map(({ s }) => `<div class="sec ok"><h3><a href="scheme.html?id=${s.id}">${esc(s.name)}</a></h3><p>${esc(s.benefit)}</p><p class="mu">Documents: ${esc(s.docs.join(", "))}</p><a href="${safeUrl(s.url)}" target="_blank" rel="noopener noreferrer">Official site ↗</a></div>`).join("") || "<p>No match found.</p>") +
      `<details><summary>Not matching (${no.length})</summary>${no.map(({ s, m }) => `<div class="sec no"><b>${esc(s.name)}</b><ul>${m.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</details>`; $("#res").scrollIntoView({ behavior: "smooth" })
  }
};

/* Assistant (rule-based, local) + voice */
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
    u.rate = 1.0; // Optimized natural conversational speed
    u.pitch = 1.0;
    speechSynthesis.speak(u);
  } catch (e) {}
};

const navCmd = q => {
  const l = q.toLowerCase();
  if (/dark|अँधेरा|रात/.test(l) && /mode|theme|मोड/.test(l)) return { say: "This site uses the light theme only.", run: () => { } };
  if (!/open|go to|take me|show me page|kholo|khol|खोल|दिखा|जाओ|le chalo/.test(l)) return null;
  const m = [[/compar|तुलना|tulna/, "compare.html", "Opening scheme compare tool."], [/checklist|readiness|document|दस्तावेज|दस्तावेज़/, "checklist.html", "Opening document readiness checker."], [/eligib|पात्र/, "eligibility.html", "Opening eligibility checker."], [/dashboard|डैशबोर्ड/, "dashboard.html", "Opening your dashboard."], [/admin|एडमिन/, "admin.html", "Opening admin."], [/feedback|प्रतिक्रिया/, "feedback.html", "Opening feedback."], [/service|सेवा/, "services.html", "Opening services."], [/home|होम/, "index.html", "Going home."], [/scheme|yojana|योजना/, "schemes.html", "Opening all schemes."]].find(x => x[0].test(l));
  return m ? { say: m[2], run: () => location.href = m[1] } : null
};

const answer = q => {
  const l = q.toLowerCase(), hi = /[\u0900-\u097F]/.test(q);
  const kw = { agriculture: ["farm", "kisan", "crop", "किसान", "खेती"], education: ["student", "scholar", "study", "छात्र", "स्कॉलर"], health: ["health", "hospital", "ayushman", "insurance", "स्वास्थ्य", "इलाज"], housing: ["house", "awas", "home", "घर", "आवास"], women: ["woman", "women", "girl", "महिला", "बेटी"], employment: ["job", "skill", "work", "रोजगार", "नौकरी"], social: ["ration", "labour", "worker", "मजदूर", "राशन"], senior: ["senior", "old age", "elderly", "बुजुर्ग"], finance: ["loan", "pension", "bank", "business", "लोन", "पेंशन"] };
  const named = D.schemes.find(s => l.includes(s.name.toLowerCase()) || l.includes(s.id.replace(/-/g, " ")));
  if (named) return `${named.name}: ${named.benefit}.\nEligibility: ${named.elig.join("; ")}.\nDocuments: ${named.docs.join(", ")}.\nApply: ${named.apply}\nOfficial: ${named.url}`;
  if (/document|दस्तावेज|कागज/.test(l)) return hi ? "आम तौर पर आधार, बैंक पासबुक, आय/निवास प्रमाण चाहिए। योजना का पेज देखें।" : "Commonly needed: Aadhaar, bank passbook, income/residence proof. Open a scheme page for its exact list.";
  if (/eligib|पात्र|qualify/.test(l)) return hi ? "पात्रता पेज पर उम्र, आय और व्यवसाय डालकर संभावित योजनाएँ देखें: eligibility.html" : "Use the Eligibility page – enter age, income and occupation to see possible schemes.";
  const toks = l.split(/[^a-z0-9\u0900-\u097F]+/).filter(w => w.length > 3), sc = D.schemes.map(s => [s, toks.filter(w => (s.name + " " + s.benefit + " " + s.dept).toLowerCase().includes(w)).length]).filter(x => x[1] > 0).sort((x, y) => y[1] - x[1]).slice(0, 3);
  if (sc.length) return (hi ? "ये योजनाएँ मिलीं:\n" : "These schemes may help:\n") + sc.map(([s]) => `• ${s.name}: ${s.benefit}`).join("\n") + (hi ? "\nविवरण के लिए योजना पेज खोलें।" : "\nOpen the scheme page for details.");
  for (const [c, w] of Object.entries(kw)) if (w.some(x => l.includes(x))) { const r = D.schemes.filter(s => s.cat === c); return (hi ? "ये योजनाएँ देखें: " : "Related schemes: ") + r.map(s => s.name).join(", ") }
  if (/^(hi|hello|namaste|नमस्ते|hey)/.test(l)) return hi ? "नमस्ते! मैं Smarth AI हूँ। सरकारी योजनाओं, पात्रता व दस्तावेजों के बारे में पूछें।" : "Namaste! Ask me about any government scheme, documents or eligibility.";
  return hi ? "माफ़ कीजिए, योजना का नाम (जैसे किसान, छात्रवृत्ति, आयुष्मान) लिखकर पूछें।" : "Please ask about a specific government scheme (e.g., PM-KISAN, Ayushman Bharat, Mudra loan)."
};

const fmt = s => {
  let o = esc(s);
  o = o.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>');
  o = o.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  o = o.replace(/\*(.*?)\*/g, "<i>$1</i>");
  o = o.replace(/^### (.*$)/gim, "<b style='font-size:1.02em;color:var(--ink);display:block;margin:6px 0 2px'>$1</b>");
  o = o.replace(/^## (.*$)/gim, "<b style='font-size:1.08em;color:var(--ink);display:block;margin:8px 0 2px'>$1</b>");
  o = o.replace(/^[•\-\*] (.*$)/gim, "<div style='margin-left:8px;display:flex;gap:6px'><span>•</span><span>$1</span></div>");
  o = o.replace(/\n/g, "<br>");
  return o;
};

V.assistant = p => `
<div class="chat-wrapper">
  <div class="chat-header">
    <div class="chat-header-info">
      <div class="bot-badge">☸</div>
      <div>
        <h2 style="margin:0;font-size:1.15rem;display:flex;align-items:center;gap:.5rem">
          Smarth AI Citizen Assistant
          <span class="live-pill">● Online</span>
        </h2>
        <p class="mu" style="margin:2px 0 0;font-size:0.8rem">Official Government Schemes & Citizen Policy Guide (English, Hindi, Hinglish)</p>
      </div>
    </div>
    <div class="chat-header-actions">
      <button id="mu" class="tool-btn" title="Toggle Voice">${muted ? "🔇 Audio Off" : "🔊 Voice Active"}</button>
      <button id="cl" class="tool-btn" title="Clear Conversation">🗑️ Clear Chat</button>
    </div>
  </div>

  <div class="chat-body" id="chat" aria-live="polite"></div>

  <div class="chat-suggestions" id="sg-box">
    <span class="sg-hint">💡 Popular:</span>
    <button class="sg" data-q="PM-KISAN ₹6000 yojana kya hai?">🌾 PM-KISAN</button>
    <button class="sg" data-q="Ayushman Bharat ₹5 Lakh health card">🏥 Ayushman Bharat</button>
    <button class="sg" data-q="PM Surya Ghar free electricity yojana">☀️ PM Surya Ghar</button>
    <button class="sg" data-q="Scholarships and loans for students">🎓 Student Scholarships</button>
    <button class="sg" data-q="Pradhan Mantri Mudra business loan">💼 Mudra Loan</button>
  </div>

  <div class="chat-input-bar">
    <div class="input-container">
      <input id="ci" placeholder="Ask about any government scheme, eligibility or documents…" autocomplete="off" />
      <button id="mic" class="mic-btn" title="Speak question">🎤</button>
    </div>
    <button id="cs" class="send-btn" title="Send message">
      <span class="send-icon">➤</span>
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

  // Delete any pre-written text from input
  if (ci) ci.value = "";

  const draw = () => {
    chat.innerHTML = h.map(m => {
      const isU = m.r === "u";
      const timeStr = m.time || "";
      return `
        <div class="chat-msg-row ${m.r}">
          <div class="msg-avatar">${isU ? "👤" : "☸"}</div>
          <div style="flex:1;max-width:100%">
            <div class="m-bubble">
              ${m.typing ? '<div class="typing-indicator"><span></span><span></span><span></span></div>' : fmt(m.t)}
            </div>
            <div class="msg-footer">
              ${timeStr ? `<span>${esc(timeStr)}</span>` : ""}
              ${m.prov ? `<span>• ⚡ ${esc(m.prov)}</span>` : ""}
            </div>
          </div>
        </div>
      `;
    }).join("");
    chat.scrollTop = chat.scrollHeight;
  };

  const add = (r, tx, prov, typing = false, timeStr = "") => {
    h.push({ r, t: tx, prov, typing, time: timeStr });
    h = h.slice(-40);
    S.set("chat", h);
    draw();
  };

  if (!h.length) {
    const initTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    add("b", "नमस्ते! मैं Smarth AI हूँ। भारत सरकार या राज्य सरकार की किसी भी योजना (PM-KISAN, आयुष्मान भारत, छात्रवृत्ति, मुद्रा लोन, पीएम सूर्य घर) के बारे में पूछें।", "Verified Knowledge Base", false, initTime);
  }
  draw();

  const send = async tx => {
    tx = (tx || "").trim();
    if (!tx || isSending) return;
    isSending = true;

    // Enforce 1 message at a time: disable input & lock send button
    if (ci) { ci.disabled = true; ci.value = ""; }
    if (cs) { cs.disabled = true; cs.classList.add("loading"); cs.innerHTML = '<span class="chat-spinner"></span> <span>Thinking…</span>'; }
    if (mic) mic.disabled = true;
    document.querySelectorAll(".sg").forEach(b => b.disabled = true);

    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    add("u", tx, null, false, nowTime);

    const g = navCmd(tx);
    if (g) {
      setTimeout(() => {
        add("b", g.say, "Navigator", false, nowTime);
        speak(g.say);
        isSending = false;
        if (ci) { ci.disabled = false; ci.focus(); }
        if (cs) { cs.disabled = false; cs.classList.remove("loading"); cs.innerHTML = '<span class="send-icon">➤</span> <span class="send-text">Send</span>'; }
        if (mic) mic.disabled = false;
        document.querySelectorAll(".sg").forEach(b => b.disabled = false);
        setTimeout(() => g.run(), 1500);
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
          history: h.slice(-6).filter(x => !x.typing).map(x => ({ role: x.r === "u" ? "user" : "assistant", content: x.t }))
        })
      });
      const data = await res.json();
      h = h.filter(x => !x.typing);
      const reply = data.reply || answer(tx);
      const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      add("b", reply, data.provider || "Smarth AI", false, replyTime);
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
        ci.value = ""; // Ensure pre-written text is deleted
        ci.focus();
      }
      if (cs) {
        cs.disabled = false;
        cs.classList.remove("loading");
        cs.innerHTML = '<span class="send-icon">➤</span> <span class="send-text">Send</span>';
      }
      if (mic) mic.disabled = false;
      document.querySelectorAll(".sg").forEach(b => b.disabled = false);
    }
  };

  if (cs) cs.onclick = () => { if (ci) send(ci.value); };
  if (ci) ci.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); if (cs) cs.click(); } };

  document.querySelectorAll(".sg").forEach(b => b.onclick = () => send(b.dataset.q || b.textContent));

  const clBtn = $("#cl");
  if (clBtn) clBtn.onclick = () => {
    h = [];
    S.set("chat", []);
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (ci) ci.value = "";
    draw();
    toast("Chat history cleared");
  };

  const muBtn = $("#mu");
  if (muBtn) muBtn.onclick = () => {
    muted = !muted;
    S.set("mute", muted);
    muBtn.textContent = muted ? "🔇 Audio Off" : "🔊 Voice Active";
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    toast(muted ? "Voice muted" : "Voice output active");
  };

  if (mic) mic.onclick = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return toast("Voice input not supported in this browser. Please use Chrome/Edge.");
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
        mic.textContent = "🔴";
        toast("Listening... speak your question");
      };
      rec.onresult = e => {
        const tx = e.results[0][0].transcript;
        if (tx) send(tx);
      };
      rec.onerror = e => {
        mic.classList.remove("recording");
        mic.textContent = "🎤";
        toast("Could not capture speech. Please type.");
      };
      rec.onend = () => {
        rec = null;
        mic.classList.remove("recording");
        mic.textContent = "🎤";
      };
      rec.start();
    } catch (err) {
      toast("Microphone initialization error.");
    }
  };

  if (p.get("q")) send(p.get("q"));
};

/* Services */
V.services = () => `<h1>Departments & services</h1><h2>Citizen services</h2><div class="grid">${D.services.map(x => `<a class="card" href="${x[1]}" target="_blank" rel="noopener noreferrer">${esc(x[0])} ↗</a>`).join("")}</div>
<h2>Ministries</h2><div class="grid">${D.depts.map(x => `<a class="card" href="${x[1]}" target="_blank" rel="noopener noreferrer">${esc(x[0])} ↗</a>`).join("")}</div>`;

/* Feedback */
let stars = 0, clarityStars = 0;
V.feedback = p => {
  const fb = S.get("fb", []), c = { Positive: 0, Neutral: 0, Negative: 0 }; fb.forEach(x => c[x.s]++);
  const preSid = p.get("sid") || "";
  return `<h1>Citizen Policy Experience & Feedback Audit</h1>
<p class="mu">Share on-ground implementation realities, clarity assessments, and friction points to help policymakers and fellow citizens.</p>
<form class="f" id="ff" style="display:flex;flex-direction:column;gap:1.2rem">
  <label><b>Select Government Scheme</b>
    <select name="sid">${D.schemes.map(s => `<option value="${s.id}" ${s.id === preSid ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select>
  </label>

  <div class="sec" style="margin:0;border-left:4px solid #0284c7">
    <h3 style="margin-top:0;color:#0369a1">1. Context & Respondent Profile</h3>
    <p class="mu" style="font-size:0.85rem">Understand who is experiencing the policy without feeling over-surveyed.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.8rem">
      <label>Your Role / Affiliation
        <select name="role">
          <option value="Student">Student</option>
          <option value="Faculty / Teacher">Faculty / Teacher</option>
          <option value="Farmer / Agri Worker">Farmer / Agricultural Worker</option>
          <option value="MSME / Small Business">MSME / Small Business Owner</option>
          <option value="Salaried Employee">Salaried Employee / Worker</option>
          <option value="Senior Citizen">Senior Citizen (60+)</option>
          <option value="Social Worker">Healthcare / ASHA / Anganwadi</option>
          <option value="Other Citizen">Other Citizen</option>
        </select>
      </label>
      <label>How long subject to this policy?
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

  <div class="sec" style="margin:0;border-left:4px solid #0d9488">
    <h3 style="margin-top:0;color:#0f766e">2. Clarity & Comprehension</h3>
    <p class="mu" style="font-size:0.85rem">If people don't understand the rules, they can't follow them.</p>
    <label><b>Clarity Rating:</b> How clear and easy to understand is the policy language? (1 to 5)
      <div class="stars" id="st-clarity" aria-label="Clarity Rating" style="margin:.4rem 0">
        ${[1, 2, 3, 4, 5].map(i => `<button type="button" data-type="clarity" data-v="${i}" aria-label="${i} star">★</button>`).join("")}
      </div>
    </label>
    <label style="margin-top:.6rem"><b>Ambiguity Check:</b> Any clauses, terms, or sections that felt confusing, contradictory, or open to misinterpretation?
      <textarea name="ambiguity_notes" rows="2" placeholder="e.g. Income certificate rules were vague; DBT linkage wasn't clearly stated..."></textarea>
    </label>
  </div>

  <div class="sec" style="margin:0;border-left:4px solid #f59e0b">
    <h3 style="margin-top:0;color:#b45309">3. Practical Impact & Fairness</h3>
    <p class="mu" style="font-size:0.85rem">Does the policy solve the problem it was made for, or create friction?</p>
    <label><b>Operational Impact:</b> Does this policy make your day-to-day workflow/life easier or harder? Why?
      <textarea name="operational_impact" rows="2" placeholder="Describe actual real-life impact on your routine, business or livelihood..." required></textarea>
    </label>
    <div style="margin-top:.6rem">
      <label><b>Perceived Fairness:</b> Is this policy applied fairly and consistently across the board?
        <select name="perceived_fairness">
          <option value="yes">Yes — Fair and transparent</option>
          <option value="somewhat">Somewhat — Depends on local officials</option>
          <option value="no">No — Inconsistent or biased</option>
        </select>
      </label>
    </div>
    <label style="margin-top:.6rem"><b>Unintended Consequences:</b> Any unexpected roadblocks, delays, or negative side effects?
      <textarea name="unintended_consequences" rows="2" placeholder="e.g. Long queue at Tehsil office; portal timeouts; extra notarized stamp paper demands..."></textarea>
    </label>
  </div>

  <div class="sec" style="margin:0;border-left:4px solid #6366f1">
    <h3 style="margin-top:0;color:#4338ca">4. Constructive Solutions</h3>
    <p class="mu" style="font-size:0.85rem">Collect constructive improvements to resolve pain points.</p>
    <label><b>Proposed Modifications:</b> If you could change, add, or remove one thing, what would it be?
      <textarea name="proposed_modifications" rows="2" placeholder="e.g. Auto-renew every year; allow DigiLocker verification; add SMS status alerts..."></textarea>
    </label>
    <label style="margin-top:.6rem"><b>Overall Effectiveness:</b> How effective is this policy at achieving its stated goal? (1 to 5)
      <div class="stars" id="st" aria-label="Overall Satisfaction" style="margin:.4rem 0">
        ${[1, 2, 3, 4, 5].map(i => `<button type="button" data-type="overall" data-v="${i}" aria-label="${i} star">★</button>`).join("")}
      </div>
    </label>
  </div>

  <button class="pri" style="font-size:1rem;padding:.75rem 1.4rem">Submit Citizen Policy Audit</button>
</form>
<div class="sec"><h2>Summary</h2><p>Total ${fb.length} · Positive ${c.Positive} · Neutral ${c.Neutral} · Negative ${c.Negative}</p></div><div id="fl">${fbList()}</div>`
};
const fbList = () => S.get("fb", []).map((x, i) => `<div class="sec"><b>${esc(byId(x.sid)?.name || x.sid)}</b> · ${"★".repeat(x.r)} · <span class="tag">${x.s}</span> · Role: ${esc(x.role || "Citizen")} · Applied: ${x.ap}<p>${esc(x.c || x.operational_impact || "")}</p>${x.proposed_modifications ? `<p class="mu" style="font-size:0.85rem">💡 <b>Proposed fix:</b> ${esc(x.proposed_modifications)}</p>` : ""}<button data-del="${i}">Delete</button></div>`).join("") || "<p class='mu'>No feedback yet.</p>";
V.feedback.after = () => {
  stars = 0; clarityStars = 0;
  const st = $("#st");
  if (st) st.onclick = e => { const v = e.target.dataset.v; if (!v) return; stars = +v;[...st.children].forEach((b, i) => b.classList.toggle("on", i < stars)) };
  const stc = $("#st-clarity");
  if (stc) stc.onclick = e => { const v = e.target.dataset.v; if (!v) return; clarityStars = +v;[...stc.children].forEach((b, i) => b.classList.toggle("on", i < clarityStars)) };
  $("#ff").onsubmit = async e => {
    e.preventDefault();
    if (!stars) return toast("Please select overall rating (1-5 stars)");
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
    a.unshift({ ...payload, s: stars >= 4 ? "Positive" : stars === 3 ? "Neutral" : "Negative", r: stars, c: payload.comment });
    S.set("fb", a);
    try {
      await fetch(`/feedback/${encodeURIComponent(payload.sid)}/api/submit/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) { }
    toast("Audit & feedback recorded successfully!");
    route();
  };
  $("#fl").onclick = e => { const i = e.target.dataset.del; if (i === undefined || !confirm("Delete this feedback?")) return; const a = S.get("fb", []); a.splice(+i, 1); S.set("fb", a); route() }
};

/* Dashboard */
V.dashboard = () => {
  const list = (ids) => ids.map(byId).filter(Boolean).map(card).join("") || "<p class='mu'>Nothing here yet.</p>";
  return `<h1>My dashboard</h1><p class="mu">Stored only in this browser.</p><h2>Saved schemes</h2><div class="grid">${list(S.get("saved", []))}</div>
<h2>Document readiness</h2>${ckOverview()}
<h2>Recently viewed</h2><div class="grid">${list(S.get("recent", []))}</div>
<h2>Recent searches</h2><p>${S.get("searches", []).map(x => `<a class="tag" href="schemes.html?q=${encodeURIComponent(x)}">${esc(x)}</a>`).join("") || "<span class='mu'>None</span>"}</p>
<h2>Eligibility history</h2>${S.get("elig", []).map(x => `<div class="sec">${esc(x.t)} · age ${x.age} · ${esc(x.occ)} · ${x.n} matches</div>`).join("") || "<p class='mu'>None</p>"}
<div class="row"><button id="ex">Export my data (JSON)</button><button id="rs">Reset all local data</button></div>`};
V.dashboard.after = () => {
  $("#ex").onclick = () => {
    const o = {}; Object.keys(localStorage).filter(k => k.startsWith("sm_")).forEach(k => o[k] = localStorage.getItem(k));
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(o, null, 2)], { type: "application/json" })); a.download = "smarth-data.json"; a.click(); URL.revokeObjectURL(a.href)
  };
  $("#rs").onclick = () => { if (confirm("Delete all saved data?")) { Object.keys(localStorage).filter(k => k.startsWith("sm_")).forEach(k => localStorage.removeItem(k)); applyPrefs(); route() } }
};


V.admin = () => {
  if (!currentOfficerUser || !currentOfficerUser.is_staff) {
    return `<div style="max-width:480px;margin:3rem auto;background:#fff;border:1px solid #cbd5e1;border-radius:12px;padding:2.2rem;box-shadow:0 10px 30px rgba(0,0,0,0.08);text-align:center">
      <div style="font-size:3rem;margin-bottom:.5rem">🏛️</div>
      <span class="tag" style="background:#fef3c7;color:#92400e;font-weight:700;padding:4px 10px;border-radius:12px;font-size:0.8rem">RESTRICTED GOVERNMENT PORTAL</span>
      <h2 style="margin:1rem 0 .5rem;color:var(--ink);font-size:1.5rem">Ministry Officer SSO Login</h2>
      <p class="mu" style="font-size:0.9rem;margin-bottom:1.5rem">This administrative console is restricted to authorized Government Officials, Ministry Department Heads, and Portal System Administrators.</p>
      <form id="adm-login-form" style="text-align:left;display:flex;flex-direction:column;gap:1rem">
        <div>
          <label style="font-weight:600;font-size:.88rem;color:var(--ink);display:block;margin-bottom:.3rem">Officer / Admin Username</label>
          <input type="text" id="adm-user" placeholder="Enter government staff username" required style="width:100%;padding:.65rem;border:1px solid var(--line);border-radius:6px;font-size:.95rem">
        </div>
        <div>
          <label style="font-weight:600;font-size:.88rem;color:var(--ink);display:block;margin-bottom:.3rem">Security Password / Passcode</label>
          <input type="password" id="adm-pass" placeholder="••••••••••••" required style="width:100%;padding:.65rem;border:1px solid var(--line);border-radius:6px;font-size:.95rem">
        </div>
        <div id="adm-login-err" style="display:none;color:#b91c1c;font-size:.85rem;background:#fee2e2;padding:.5rem;border-radius:6px"></div>
        <button type="submit" id="adm-login-btn" class="btn pri" style="width:100%;padding:.75rem;font-size:1rem;font-weight:600;margin-top:.5rem">Authenticate as Officer ➔</button>
      </form>
      <p class="mu" style="font-size:.78rem;margin-top:1.5rem;line-height:1.4">Authorized access under IT Security &amp; Compliance Guidelines. Unofficial attempts are logged under cyber security monitoring.</p>
    </div>`;
  }

  const m = ADM(), fb = S.get("fb", []), all = [...D.all.filter(s => !m.deleted.includes(s.id)), ...m.custom], c = { Positive: 0, Neutral: 0, Negative: 0 }; fb.forEach(x => c[x.s]++);
  return `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;border-bottom:1px solid var(--line);padding-bottom:1rem">
    <div>
      <h1 style="margin:0;display:flex;align-items:center;gap:.6rem"><span>⚙️</span> Officer &amp; Admin Command Center</h1>
      <p class="mu" style="margin:.3rem 0 0">Logged in as: <b>${esc(currentOfficerUser.username)}</b> (${currentOfficerUser.is_superuser ? "Super Administrator" : "Ministry Officer"})</p>
    </div>
    <div style="display:flex;gap:.5rem;align-items:center">
      <a href="/admin/" target="_blank" class="btn" style="background:#0f172a;color:#fff;border-color:#0f172a;font-size:.85rem">Django Staff Portal ↗</a>
      <button id="btn-adm-logout" class="btn" style="background:#fee2e2;color:#991b1b;border-color:#fca5a5;font-weight:600;font-size:.85rem">Sign Out</button>
    </div>
  </div>

  <div class="grid" id="adm-kpi-grid">${[["Central & State Schemes", all.length], ["Published & Live", all.length - m.hidden.filter(h => all.some(s => s.id === h)).length], ["Citizen Audits", fb.length], ["Positive Perceptions", c.Positive], ["Neutral Evaluations", c.Neutral], ["Negative / Friction", c.Negative]].map(x => `<div class="card"><span class="mu">${x[0]}</span><h2 style="margin:0">${x[1]}</h2></div>`).join("")}</div>

<div class="sec" style="background:rgba(255,255,255,0.96);border:2px solid var(--accent);border-radius:10px;padding:1.4rem;margin:1.5rem 0;box-shadow:0 4px 16px rgba(0,0,0,0.06)">
  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;margin-bottom:.75rem">
    <h2 style="margin:0;color:var(--accent);display:flex;align-items:center;gap:.5rem">
      <span>🔄</span> <span>Auto-Fetch Government Schemes (AI Simplifier)</span>
    </h2>
    <span class="tag" style="background:#e0f2f1;color:#00695c;font-weight:bold;padding:4px 10px;border-radius:12px">API Setu • data.gov.in • MyGov • Live Feeds</span>
  </div>
  <p class="mu" style="margin-top:0;font-size:.95rem">
    Automatically discover, pull, and simplify Indian government schemes directly from official APIs and announcement feeds. Smarth AI (Qwen / Gemini) simplifies dense bureaucratic text into clean, 2-line English &amp; Hindi summaries, key benefits, and eligibility checklists.
  </p>
  <form id="sync-form" class="f" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">
    <div>
      <label style="font-weight:600;display:block;margin-bottom:.35rem">Data Source:</label>
      <select id="sync-source" style="width:100%;padding:.55rem;border:1px solid var(--line);border-radius:6px;background:#fff">
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
      <select id="sync-limit" style="width:100%;padding:.55rem;border:1px solid var(--line);border-radius:6px;background:#fff">
        <option value="5">5 Schemes</option>
        <option value="10" selected>10 Schemes</option>
        <option value="20">20 Schemes</option>
      </select>
    </div>
    <div style="grid-column:1/-1">
      <details style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:.6rem .9rem">
        <summary style="cursor:pointer;font-weight:600;color:var(--ink)">🔑 API Credentials (Optional for Live Feeds, required for official partner portals)</summary>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.75rem;margin-top:.75rem">
          <div>
            <label style="font-size:.82rem;color:var(--mu);display:block;margin-bottom:.2rem">data.gov.in API Key:</label>
            <input type="text" id="sync-datagov-key" placeholder="Enter OGD API Key" style="width:100%;padding:.4rem">
          </div>
          <div>
            <label style="font-size:.82rem;color:var(--mu);display:block;margin-bottom:.2rem">API Setu Client ID:</label>
            <input type="text" id="sync-apisetu-clientid" placeholder="X-APISETU-CLIENTID" style="width:100%;padding:.4rem">
          </div>
          <div>
            <label style="font-size:.82rem;color:var(--mu);display:block;margin-bottom:.2rem">API Setu API Key:</label>
            <input type="password" id="sync-apisetu-key" placeholder="X-APISETU-APIKEY" style="width:100%;padding:.4rem">
          </div>
          <div>
            <label style="font-size:.82rem;color:var(--mu);display:block;margin-bottom:.2rem">MyGov API Key:</label>
            <input type="text" id="sync-mygov-key" placeholder="MyGov API Key" style="width:100%;padding:.4rem">
          </div>
        </div>
      </details>
    </div>
    <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-top:.5rem">
      <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
        <input type="checkbox" id="sync-use-ai" checked>
        <b>Enable AI Simplification (Qwen / Gemini)</b>
      </label>
      <button type="submit" id="btn-start-sync" class="btn pri" style="padding:.65rem 1.6rem;font-weight:bold;cursor:pointer">
        ⚡ Fetch &amp; Ingest Government Schemes
      </button>
    </div>
  </form>
  <div id="sync-status-box" style="display:none;background:#0f172a;color:#f8fafc;padding:1.1rem;border-radius:8px;font-family:monospace;font-size:.88rem;margin-top:1.1rem">
    <div id="sync-spinner" style="font-weight:bold;color:#38bdf8;margin-bottom:.5rem">⏳ Syncing with official government portals...</div>
    <div id="sync-logs" style="max-height:160px;overflow-y:auto;white-space:pre-wrap;color:#cbd5e1;line-height:1.5"></div>
  </div>
</div>

<div class="sec"><h2>Add scheme manually</h2><form class="f" id="af"><input name="name" placeholder="Scheme name" required><select name="cat">${Object.entries(D.cats).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select><input name="dept" placeholder="Department" required><input name="benefit" placeholder="Main benefit" required><input name="url" type="url" placeholder="Official https:// link" required><textarea name="desc" placeholder="Description" rows="2"></textarea><button class="pri">Add scheme</button></form></div>
<div class="sec">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.6rem;flex-wrap:wrap;gap:.5rem">
    <h2 style="margin:0">Manage schemes (Central &amp; State Catalog)</h2>
    <span class="mu" style="font-size:0.85rem">Live Portal Registry</span>
  </div>
  <div style="overflow:auto"><table><tr><th>Name</th><th>Category</th><th>Status</th><th>Actions</th></tr>${all.map(s => `<tr><td><b>${esc(s.name)}</b><br><span class="mu" style="font-size:.8rem">${esc(s.dept || "")}</span></td><td>${D.cats[s.cat] || s.cat}</td><td><span class="tag" style="background:${m.hidden.includes(s.id) ? '#fee2e2;color:#991b1b' : '#dcfce7;color:#166534'}">${m.hidden.includes(s.id) ? "Draft / Hidden" : "Published"}</span></td><td><button data-tg="${s.id}">${m.hidden.includes(s.id) ? "Publish" : "Unpublish"}</button> <button data-rm="${s.id}">Delete</button></td></tr>`).join("")}</table></div>
</div>
<div class="sec"><h2>Feedback &amp; Citizen Audits</h2>${fb.map((x, i) => `<p>${"★".repeat(x.r)} <span class="tag">${x.s}</span> ${esc(x.c)} <button data-fd="${i}">Delete</button></p>`).join("") || "<p class='mu'>No feedback yet.</p>"}</div>
<div class="sec"><h2>Citizen Problem Reports</h2>${S.get("reports", []).map((x, i) => `<p><b>${esc(byId(x.sid)?.name || x.sid)}</b> · ${esc(x.t)}: ${esc(x.m)} <button data-rp="${i}">Resolve</button></p>`).join("") || "<p class='mu'>No problem reports pending resolution.</p>"}</div>
<div class="row"><button id="e1">Export schemes CSV</button><button id="e2">Export feedback CSV</button><button id="rs">Reset local cache</button></div>`};
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

  const sv = m => { S.set("adm", m); applyAdm(); route() }, csv = (n, rows) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" })); a.download = n; a.click(); URL.revokeObjectURL(a.href) };
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
  $("#af").onsubmit = e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), m = ADM(); m.custom.push({ id: "c" + Date.now(), name: f.name, cat: f.cat, lvl: "Central", dept: f.dept, benefit: f.benefit, desc: f.desc || f.benefit, elig: ["See official website"], docs: ["See official website"], apply: "Apply on the official website.", url: f.url, r: {} }); sv(m) };
  $("#main").onclick = e => {
    const d = e.target.dataset, m = ADM(); if (d.tg) { m.hidden = m.hidden.includes(d.tg) ? m.hidden.filter(x => x !== d.tg) : [...m.hidden, d.tg]; sv(m) }
    else if (d.rm && confirm("Delete this scheme?")) { m.custom = m.custom.filter(s => s.id !== d.rm); if (D.all.some(s => s.id === d.rm)) m.deleted.push(d.rm); sv(m) }
    else if (d.fd !== undefined && confirm("Delete feedback?")) { const f = S.get("fb", []); f.splice(+d.fd, 1); S.set("fb", f); route() }
    else if (d.rp !== undefined) { const r = S.get("reports", []); r.splice(+d.rp, 1); S.set("reports", r); route() }
  };
  $("#e1").onclick = () => csv("schemes.csv", [["Name", "Category", "Department", "Benefit", "URL"], ...[...D.all, ...ADM().custom].map(s => [s.name, s.cat, s.dept, s.benefit, s.url])]);
  $("#e2").onclick = () => csv("feedback.csv", [["Scheme", "Rating", "Sentiment", "Applied", "Comment"], ...S.get("fb", []).map(x => [x.sid, x.r, x.s, x.ap, x.c])]);
  $("#rs").onclick = () => { if (confirm("Reset all local data?")) { Object.keys(localStorage).filter(k => k.startsWith("sm_")).forEach(k => localStorage.removeItem(k)); applyAdm(); applyPrefs(); route() } }
};
/* ===== Shared helpers for Compare + Checklist ===== */
const docList = s => Array.isArray(s.docs) ? s.docs : [String(s.docs || "")];
const realDoc = d => !/official|scheme-specific/i.test(d);               // generic placeholders are not "real" documents
const dkey = d => { const l = d.toLowerCase(); return l.includes("aadhaar") ? "aadhaar" : l.includes("passbook") ? "bank passbook" : l };
const schemeOpts = sel => `<option value="">— Select a scheme —</option>` + Object.entries(D.cats).map(([k, v]) => {
  const l = D.schemes.filter(s => s.cat === k);
  return l.length ? `<optgroup label="${esc(v)}">${l.map(s => `<option value="${esc(s.id)}"${s.id === sel ? " selected" : ""}>${esc(s.name)}</option>`).join("")}</optgroup>` : ""
}).join("");
const pushUrl = u => { try { history.replaceState(null, "", u) } catch { } };
const crit = s => {
  const r = s.r || {}, o = [];
  if (r.a) o.push(r.a[1] >= 120 ? `Age ${r.a[0]}+` : `Age ${r.a[0]}–${r.a[1]}`);
  if (r.g === "f") o.push("Women / girl child only");
  if (r.o) o.push("Usually for: " + r.o.map(x => OCC[x] || x).join(", "));
  if (r.i) o.push(`Annual family income up to ₹${r.i.toLocaleString("en-IN")}`);
  return o.length ? o : ["No age, income or occupation limit in the simplified rules used here"]
};


/* ===== Compare: tick schemes on cards OR pick up to 3 here ===== */
const cmpIds = () => S.get("cmp", []).filter((x, i, r) => x && byId(x) && r.indexOf(x) === i).slice(0, 3);
const cmpUrl = ids => "compare.html" + (ids.length ? "?" + ids.map((x, i) => "abc"[i] + "=" + encodeURIComponent(x)).join("&") : "");
const cmpTable = T => {
  const L = r => `<ul>${r.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const ks = T.map(s => new Set(docList(s).filter(realDoc).map(dkey))), all = [...ks[0]].filter(k => ks.every(z => z.has(k)));
  const common = docList(T[0]).filter(d => realDoc(d) && all.includes(dkey(d)));
  const dl = s => `<ul>${docList(s).map(d => `<li>${esc(d)}${realDoc(d) && all.includes(dkey(d)) ? ' <span class="tag cm">common</span>' : ""}</li>`).join("")}</ul>`;
  const cats = [...new Set(T.map(s => s.cat))];
  const R = [["Who it is for", s => whoOf(s).map(gl).join(", ")], ["Department", s => esc(s.dept)], ["Benefit", s => `<span class="ben">${esc(s.benefit)}</span>`], ["About", s => esc(s.desc)], ["Eligibility", s => L(s.elig)], ["Indicative criteria", s => L(crit(s))], ["Documents", dl], ["How to apply", s => esc(s.apply)], ["Official site", s => `<a href="${safeUrl(s.url)}" target="_blank" rel="noopener noreferrer">Open ↗</a>`], ["Next step", s => `<div class="row"><a class="btn" href="scheme.html?id=${encodeURIComponent(s.id)}">Full details</a><a class="btn" href="checklist.html?id=${encodeURIComponent(s.id)}">📑 Check documents</a></div>`]];
  return `<div class="sec ok"><h2>Quick summary</h2><p>${cats.length === 1 ? `All selected schemes are in the <b>${esc(D.cats[cats[0]] || cats[0])}</b> category.` : `These schemes are in different categories: ${cats.map(c => esc(D.cats[c] || c)).join(", ")}.`}</p>
<p>${common.length ? `<b>${common.length} common document${common.length > 1 ? "s" : ""}:</b> ${esc(common.join(", "))}. Collect these once and use them for all.` : "No common documents are listed. Each scheme needs its own set."}</p></div>
<div style="overflow:auto"><table class="ct"><tr><th></th>${T.map(s => `<th><a href="scheme.html?id=${encodeURIComponent(s.id)}">${esc(s.name)}</a></th>`).join("")}</tr>${R.map(([n, f]) => `<tr><th>${n}</th>${T.map(s => `<td>${f(s)}</td>`).join("")}</tr>`).join("")}</table></div>
<p class="mu">Indicative information only. Confirm eligibility and documents on the official website before applying.</p>`};
V.compare = p => {
  const q = ["a", "b", "c"].some(k => p.has(k)), ids = (q ? ["a", "b", "c"].map(k => p.get(k) || "") : S.get("cmp", [])).filter((x, i, r) => x && byId(x) && r.indexOf(x) === i).slice(0, 3);
  const pairs = [["pm-kisan", "pmfby"], ["apy", "nps"], ["pmkvy", "ddugky"], ["mudra", "pmegp"]].filter(x => byId(x[0]) && byId(x[1]));
  return `<h1>${t("compare")}</h1><p class="mu">Pick 2 or 3 schemes (or tick Compare on scheme cards) to see benefits, eligibility, documents and the application process side by side.</p>
<div class="bar"><select id="ca" aria-label="First scheme">${schemeOpts(ids[0])}</select><select id="cb" aria-label="Second scheme">${schemeOpts(ids[1])}</select><select id="cd" aria-label="Third scheme (optional)">${schemeOpts(ids[2]).replace("— Select a scheme —", "— Optional third —")}</select><button id="ccl">Clear</button></div>
${pairs.length ? `<div class="row" id="cpairs"><span class="mu">Try:</span>${pairs.map(x => `<button class="chip" data-a="${x[0]}" data-b="${x[1]}">${esc(byId(x[0]).name)} vs ${esc(byId(x[1]).name)}</button>`).join("")}</div>` : ""}
<div id="cres"></div>`};
V.compare.after = () => {
  const sel = ["#ca", "#cb", "#cd"].map(x => $(x)), res = $("#cres");
  const draw = () => {
    const v = sel.map(x => x.value).filter(Boolean), ids = v.filter((x, i) => v.indexOf(x) === i); S.set("cmp", ids); pushUrl(cmpUrl(ids));
    if (v.length !== ids.length) { res.innerHTML = `<div class="sec no"><p>Please choose <b>different</b> schemes to compare.</p></div>`; return }
    if (ids.length < 2) { res.innerHTML = `<div class="sec"><p class="mu">Select at least two schemes above to start comparing.</p><a class="btn pri" href="schemes.html">Browse schemes</a></div>`; return }
    res.innerHTML = cmpTable(ids.map(byId)) + `<div class="row"><button id="cpl">🔗 Copy comparison link</button><button id="cpr">Print / PDF</button></div>`;
    $("#cpl").onclick = async () => { try { await navigator.clipboard.writeText(location.href.split(/[?#]/)[0] + cmpUrl(ids).slice(11)); toast("Comparison link copied") } catch { toast("Copy failed") } };
    $("#cpr").onclick = () => print()
  };
  sel.forEach(x => x.onchange = draw);
  $("#ccl").onclick = () => { sel.forEach(x => x.value = ""); draw() };
  const pr = $("#cpairs"); if (pr) pr.onclick = e => { const d = e.target.dataset; if (!d.a) return; sel[0].value = d.a; sel[1].value = d.b; sel[2].value = ""; draw() };
  draw()
};

/* ===== Feature 2: Document Readiness Checker ===== */
const CK = () => S.get("ck", {});
const ckItems = s => docList(s).map(d => /^see official/i.test(d) ? "Documents listed on the official website" : d);
const ckDone = s => { const t = CK()[s.id] || []; return ckItems(s).filter(d => t.includes(d)) };
const ckSave = (s, list) => { const c = CK(); if (list.length) c[s.id] = list; else delete c[s.id]; S.set("ck", c) };
const pbar = pct => `<div class="pb" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>`;
const DH = [[/aadhaar/i, "Keep your mobile number linked. You can download e-Aadhaar from the UIDAI site.", "https://uidai.gov.in/"],
[/\bpan\b/i, "Apply for or download your PAN from the Income Tax portal.", "https://www.incometax.gov.in/"],
[/passbook|bank account/i, "Use an active account, ideally linked with Aadhaar. A passbook first page or cancelled cheque is usually accepted."],
[/income/i, "Usually issued by your Tehsil / e-District office. Check your state portal."],
[/ration/i, "Issued by your state food and civil supplies department."],
[/land|property/i, "Land record (for example Khatauni / Jamabandi) from your state land-records portal or local office."],
[/birth/i, "Available from the municipal body or Registrar of Births and Deaths."],
[/marksheet|education|certificate/i, "Keep a clear copy. DigiLocker can hold verified digital copies.", "https://www.digilocker.gov.in/"],
[/mobile/i, "Use an active number, ideally the one linked with Aadhaar."]];
const hintOf = d => DH.find(x => x[0].test(d));
const ckOverview = () => {
  const rows = Object.keys(CK()).map(id => byId(id)).filter(Boolean).map(s => ({ s, d: ckDone(s).length, n: ckItems(s).length })).filter(x => x.d > 0);
  return rows.length ? rows.map(({ s, d, n }) => { const pct = Math.round(d / n * 100); return `<div class="sec"><div class="ckrow"><a href="checklist.html?id=${encodeURIComponent(s.id)}"><b>${esc(s.name)}</b></a><span class="mu">${d}/${n} ready · ${pct}%</span></div>${pbar(pct)}</div>` }).join("") : "<p class='mu'>No checklist started yet.</p>"
};

V.checklist = p => {
  const id = p.get("id") || S.get("cklast", ""); const saved = S.get("saved", []).map(x => byId(x)).filter(Boolean).slice(0, 6);
  return `<h1>Document readiness checker</h1><p class="mu">Pick a scheme, tick the documents you already have and see how ready you are to apply.</p>
<div class="bar"><select id="ks" aria-label="Scheme">${schemeOpts(id)}</select></div>
${saved.length ? `<div class="row" id="ksv"><span class="mu">Your saved schemes:</span>${saved.map(s => `<button class="chip" data-id="${esc(s.id)}">${esc(s.name)}</button>`).join("")}</div>` : ""}
<div id="kres"></div><h2>Your checklists in progress</h2><div id="kov">${ckOverview()}</div>`
};
V.checklist.after = () => {
  const ks = $("#ks"), res = $("#kres"); let cur = null;
  const paint = () => {
    if (!cur) return; const items = ckItems(cur), done = ckDone(cur), n = items.length, pct = n ? Math.round(done.length / n * 100) : 0, miss = items.filter(d => !done.includes(d));
    $("#kp").innerHTML = `<p><b>${done.length} of ${n}</b> documents ready · <b>${pct}%</b></p>${pbar(pct)}<p class="${pct === 100 ? "ben" : "mu"}">${pct === 100 ? "✅ All documents are ready. You can now apply on the official website." : done.length ? `Still to collect: ${esc(miss.join(", "))}.` : "Start by ticking the documents you already have."}</p>`;
    res.querySelectorAll("input[data-d]").forEach(i => i.closest("label").classList.toggle("done", i.checked));
    $("#kov").innerHTML = ckOverview()
  };
  const sync = () => {
    const before = ckDone(cur).length === ckItems(cur).length; ckSave(cur, [...res.querySelectorAll("input[data-d]:checked")].map(i => i.dataset.d)); paint();
    if (!before && ckDone(cur).length === ckItems(cur).length) toast("All documents ready 🎉")
  };
  const show = id => {
    cur = byId(id) || null; S.set("cklast", cur ? cur.id : "");
    if (!cur) { res.innerHTML = `<div class="sec"><p class="mu">Select a scheme to see its document checklist.</p></div>`; return }
    pushUrl(`checklist.html?id=${encodeURIComponent(cur.id)}`); const t = CK()[cur.id] || [];
    res.innerHTML = `<div class="sec"><h2>${esc(cur.name)}</h2><div><span class="tag">${esc(cur.lvl)}</span><span class="tag">${esc(D.cats[cur.cat] || cur.cat)}</span></div><div id="kp" aria-live="polite"></div>
<div class="cklist">${ckItems(cur).map(d => { const h = hintOf(d); return `<label class="ck"><input type="checkbox" data-d="${esc(d)}"${t.includes(d) ? " checked" : ""}><span><span class="t">${esc(d)}</span>${h ? `<small class="mu">${esc(h[1])}${h[2] ? ` <a href="${h[2]}" target="_blank" rel="noopener noreferrer">Open ↗</a>` : ""}</small>` : ""}</span></label>` }).join("")}</div>
<div class="row"><button id="kall">Mark all ready</button><button id="knone">Clear all</button><button id="kpr">Print / PDF</button></div></div>
<div class="row"><a class="btn pri" href="${esc(cur.url)}" target="_blank" rel="noopener noreferrer">Official website ↗</a><a class="btn" href="scheme.html?id=${encodeURIComponent(cur.id)}">Scheme details</a><a class="btn" href="compare.html?a=${encodeURIComponent(cur.id)}">⚖️ Compare with another</a></div>
<p class="mu">This is a self-check list based on the documents listed for the scheme. The official portal may ask for additional or updated documents.</p>`;
    res.onchange = e => { if (e.target.dataset.d !== undefined) sync() };
    $("#kall").onclick = () => { res.querySelectorAll("input[data-d]").forEach(i => i.checked = true); sync() };
    $("#knone").onclick = () => { res.querySelectorAll("input[data-d]").forEach(i => i.checked = false); sync() };
    $("#kpr").onclick = () => print(); paint()
  };
  ks.onchange = () => show(ks.value);
  const sv = $("#ksv"); if (sv) sv.onclick = e => { const id = e.target.dataset.id; if (!id) return; ks.value = id; show(id) };
  show(ks.value)
};
V.nf = () => `<div class="hero"><h1>404 – Page not found</h1><p>This page does not exist.</p><a class="btn pri" href="index.html">Go home</a></div>`;


const spokes = r => Array.from({ length: 24 }, (_, i) => `<line x2="${(r * Math.cos(i * Math.PI / 12)).toFixed(1)}" y2="${(r * Math.sin(i * Math.PI / 12)).toFixed(1)}" stroke="currentColor" stroke-width="1.4"/>`).join("");
const CHAKRA = `<svg viewBox="-60 -60 120 120"><circle r="52" fill="none" stroke="currentColor" stroke-width="3"/>${spokes(52)}<circle r="6" fill="currentColor"/></svg>`;
const lion = (x, f) => `<g><circle cx="${x}" cy="84" r="23" fill="#0e7c7b"/><circle cx="${x}" cy="84" r="16" fill="url(#g)"/><rect x="${x - 16}" y="96" width="32" height="38" rx="12" fill="url(#g)"/><circle cx="${x - 6}" cy="82" r="2.2" fill="#16324f"/><circle cx="${x + 6}" cy="82" r="2.2" fill="#16324f"/><path d="M${x - 4} 91h8l-4 5z" fill="#16324f"/></g>`;
const STAMBH = `<svg viewBox="0 0 200 330" class="stambh" role="img" aria-label="Ashoka Stambh"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#16324f"/><stop offset=".5" stop-color="#0e7c7b"/><stop offset="1" stop-color="#16324f"/></linearGradient></defs>
<path d="M58 322h84l-10-26H68z" fill="url(#g)"/><path d="M84 298h32l-4-142H88z" fill="url(#g)"/>${lion(64)}${lion(136)}${lion(100)}<rect x="46" y="134" width="108" height="30" rx="7" fill="url(#g)"/><g transform="translate(100 149) scale(.24)" color="#0e7c7b">${CHAKRA.replace(/<\/?svg[^>]*>/g, "")}</g></svg>`;
const M = { x: -999, y: -999 };
function fx() {
  const c = $("#fx"); if (!c) return; const x = c.getContext("2d"); let W, H;
  const rs = () => { W = c.width = innerWidth; H = c.height = innerHeight }; rs(); addEventListener("resize", rs);
  if (matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  const P = Array.from({ length: Math.min(45, innerWidth / 18 | 0) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + .5, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, k: Math.random() < .5 }));
  let active = true;
  document.addEventListener("visibilitychange", () => { active = !document.hidden; if (active) requestAnimationFrame(f) });
  (function f() {
    if (!active) return;
    x.clearRect(0, 0, W, H);
    P.forEach((p, i) => {
      const dx = p.x - M.x, dy = p.y - M.y, d = Math.hypot(dx, dy);
      if (d < 110) { p.x += dx / d * 1.4; p.y += dy / d * 1.4 }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      for (let k = i + 1; k < P.length; k++) {
        const q = P[k], e = Math.hypot(p.x - q.x, p.y - q.y);
        if (e < 95) {
          x.globalAlpha = (1 - e / 95) * .3;
          x.strokeStyle = "#0e7c7b";
          x.shadowBlur = 0;
          x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); x.stroke();
        }
      }
      x.globalAlpha = .35; x.fillStyle = p.k ? "#0e7c7b" : "#16324f";
      x.shadowBlur = 0; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill();
    });
    requestAnimationFrame(f);
  })()
}
function ui3d() {
  const root = document.documentElement, fine = matchMedia("(pointer:fine)").matches, calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  if (fine && !calm) {
    const dot = document.createElement("div"), ring = document.createElement("div"); dot.id = "cdot"; ring.id = "cring"; document.body.append(dot, ring); let rx = 0, ry = 0;
    (function t() { rx += (M.x - rx) * .18; ry += (M.y - ry) * .18; ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`; requestAnimationFrame(t) })();
    addEventListener("mousemove", e => {
      M.x = e.clientX; M.y = e.clientY; dot.style.transform = `translate(${M.x}px,${M.y}px) translate(-50%,-50%)`;
      root.style.setProperty("--px", (e.clientX / innerWidth - .5).toFixed(3)); root.style.setProperty("--py", (e.clientY / innerHeight - .5).toFixed(3));
      ring.classList.toggle("hot", !!e.target.closest("a,button,input,select,textarea,summary,.card"));
      const el = e.target.closest(".card"); if (ui3d.last && ui3d.last !== el) ui3d.last.style.transform = ""; ui3d.last = el;
      if (el) { const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height; el.style.transform = `perspective(700px) rotateX(${((.5 - py) * 12).toFixed(1)}deg) rotateY(${((px - .5) * 14).toFixed(1)}deg) translateZ(10px)`; el.style.setProperty("--mx", px * 100 + "%"); el.style.setProperty("--my", py * 100 + "%") }
    });
    document.addEventListener("mouseleave", () => { M.x = M.y = -999; if (ui3d.last) ui3d.last.style.transform = "" })
  }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target) } }), { threshold: .08 });
  const mark = () => document.querySelectorAll("#main .card:not(.rv),#main .sec:not(.rv),#main h2:not(.rv)").forEach(n => { n.classList.add("rv"); io.observe(n) });
  new MutationObserver(mark).observe($("#main"), { childList: true, subtree: true }); mark()
}
function intro() {
  let seen; try { seen = sessionStorage.getItem("seen_intro") } catch { }
  if (document.body.dataset.page !== "home" || seen) return;
  const d = document.createElement("div"); d.id = "intro";
  d.innerHTML = `<div class="loader-content">
    <div class="flag-frame">
      <img src="/static/img/indian-flag-loader.jpg" alt="National Flag of India" class="loader-flag">
    </div>
    <div class="loader-badge">🇮🇳 भारत सरकार एवं राज्य सरकार नीति पोर्टल</div>
    <h1>SMARTH AI</h1>
    <p class="loader-motto">यतो धर्मस्ततो जयः • राष्ट्र सर्वोपरि</p>
    <p class="loader-sub">Empowering 1.4 Billion Citizens • Access to 1,868+ Official Government Welfare Schemes</p>
    <div class="loader-progress-wrap"><div class="loader-progress-bar" id="loader-bar"></div></div>
    <div class="loader-status" id="loader-status">Initializing National Scheme Directory...</div>
    <button class="loader-skip" id="loader-skip">Enter Portal ➔</button>
  </div>`;
  document.body.append(d);

  const bar = d.querySelector("#loader-bar");
  const st = d.querySelector("#loader-status");
  const startTime = Date.now();
  const totalDuration = 4000; // 4 seconds duration

  const close = () => {
    if (d.classList.contains("out")) return;
    try { sessionStorage.setItem("seen_intro", 1) } catch { }
    d.classList.add("out");
    setTimeout(() => d.remove(), 800);
  };

  d.querySelector("#loader-skip").onclick = close;
  d.onclick = e => { if (e.target === d) close() };

  const timer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
    if (bar) bar.style.width = progress + "%";
    if (elapsed < 1000) {
      if (st) st.textContent = "Connecting to National Scheme Directory (myScheme)...";
    } else if (elapsed < 2400) {
      if (st) st.textContent = "Loaded 1,868+ Central & State Welfare Schemes...";
    } else if (elapsed < 3600) {
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

/* Compare bar */
const cbar = () => {
  let b = $("#cbar"); const n = S.get("cmp", []).length; if (!n || document.body.dataset.page === "compare") { b && b.remove(); return }
  if (!b) { b = document.createElement("div"); b.id = "cbar"; document.body.append(b) } b.innerHTML = `<span>${n} selected</span><a class="btn pri" href="compare.html">${t("compare")}</a><button id="cx">✕</button>`; $("#cx").onclick = () => { S.set("cmp", []); document.querySelectorAll("[data-cmp]").forEach(i => i.checked = false); cbar() }
};
document.addEventListener("change", e => { const id = e.target.dataset && e.target.dataset.cmp; if (!id) return; let a = S.get("cmp", []); if (e.target.checked) { if (a.length >= 3) { e.target.checked = false; return toast("You can compare up to 3 schemes") } a.push(id) } else a = a.filter(x => x !== id); S.set("cmp", a); cbar() });
/* Router (one page per file) */
function route() {
  const name = document.body.dataset.page || "home", p = new URLSearchParams(location.search), id = p.get("id"); const v = V[name] || V.nf;
  const navItems = [...NAV];
  if (currentOfficerUser && currentOfficerUser.is_staff) {
    navItems.push(["admin", "admin"]);
  }
  $("#nav").innerHTML = navItems.map(([h, k]) => `<a href="${h}.html" class="${name === (h === "index" ? "home" : h) ? "on" : ""}">${NI[k] || ""} ${t(k)}</a>`).join("");
  $("#main").innerHTML = v(p, id); if (v.after) v.after(p, id); const HINT = { schemes: "Search, filter by category and tap any card for full details.", services: "Official government portals. Each card opens the real website in a new tab.", feedback: "Rate a scheme and tell others about your experience.", dashboard: "Your saved schemes and activity on this device." }; const h1 = $("#main h1"); if (h1 && HINT[name]) h1.insertAdjacentHTML("afterend", `<p class="mu hint">${HINT[name]}</p>`); cbar(); document.title = "Smarth AI | " + (name === "home" ? "Government Scheme Guide" : name)
}
// Check staff session on startup to refresh officer menu if authenticated
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
applyPrefs(); fx(); route(); intro(); ui3d();
