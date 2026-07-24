/* =========================================================
   부산 특성화고 · Editorial Edition (v2) — app.js
   데이터: fetch('../data.json') → 실패 시 window.__DATA__(../data.js) 폴백
   ========================================================= */
(function () {
  "use strict";

  var FIELD_META = {
    A: { 계열: "공업 계열" }, B: { 계열: "공업 계열" }, C: { 계열: "정보·IT 계열" },
    D: { 계열: "디자인·콘텐츠 계열" }, E: { 계열: "공업 계열" }, F: { 계열: "공업·국방 계열" },
    G: { 계열: "가사·서비스 계열" }, H: { 계열: "상업(경영) 계열" }, I: { 계열: "보건·복지 계열" },
    J: { 계열: "농생명 계열" }
  };
  var GLOSSARY = {
    "MRO": "MRO=항공기 정비·수리·점검(Maintenance, Repair, Overhaul)",
    "NCS": "NCS=국가가 정리한 직무 능력 표준(현장에 필요한 능력 기준)",
    "도제학교": "도제학교=학교와 기업을 오가며 일하듯 배우는 산학일체형 교육",
    "P-TECH": "P-TECH=고교+전문대 연계로 전문학사까지 잇는 과정",
    "K-MOVE": "K-MOVE=정부가 돕는 청년 해외 취업 지원 사업",
    "MICE": "MICE=회의·포상관광·전시 등 비즈니스 관광 산업",
    "FFK": "FFK=한국영농학생연합회(농업계고 학생 활동 단체)",
    "CIS": "CIS=케임브리지 국제학교 인증(국제 교육과정 인증)",
    "IoT": "IoT=사물인터넷(기기들이 인터넷으로 연결되는 기술)",
    "산학협력": "산학협력=학교와 기업이 함께 교육·취업을 돕는 것",
    "선취업 후진학": "선취업 후진학=먼저 취업한 뒤 나중에 대학에 진학하는 길",
    "부사관": "부사관=군에서 병과 장교 사이의 간부(직업 군인)"
  };
  var GKEYS = Object.keys(GLOSSARY).sort(function (a, b) { return b.length - a.length; });

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function norm(s) { return String(s == null ? "" : s).toLowerCase().replace(/\s+/g, ""); }
  function el(h) { var t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstElementChild; }
  function fixUrl(u) { u = String(u || "").trim(); if (!u) return ""; if (!/^https?:\/\//i.test(u)) u = "https://" + u.replace(/^\/+/, ""); return u; }
  function richText(s) {
    var safe = esc(s);
    for (var i = 0; i < GKEYS.length; i++) {
      var k = GKEYS[i], re = new RegExp("(" + k.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&") + ")", "g");
      safe = safe.replace(re, function (m) { return '<abbr class="term" title="' + esc(GLOSSARY[k]) + '" tabindex="0">' + m + "</abbr>"; });
    }
    return safe.replace(/\n/g, "<br>");
  }

  var DATA = null, SCHOOLS = [], FIELDS = [], FCOUNT = {}, DISTRICTS = [];
  var state = { q: "", field: null, districts: new Set(), types: new Set() };

  function boot(data) {
    DATA = data; SCHOOLS = data["학교"] || []; FIELDS = data["분야"] || [];
    FIELDS.forEach(function (f) { FCOUNT[f["코드"]] = 0; });
    var dset = {};
    SCHOOLS.forEach(function (s) {
      (s["분야코드"] || []).forEach(function (c) { if (FCOUNT[c] != null) FCOUNT[c]++; });
      if (s["지역구"]) dset[s["지역구"]] = (dset[s["지역구"]] || 0) + 1;
    });
    DISTRICTS = Object.keys(dset).sort(function (a, b) { return a.localeCompare(b, "ko"); }).map(function (d) { return { name: d, n: dset[d] }; });

    document.getElementById("statSchools").textContent = SCHOOLS.length;
    document.getElementById("statDistricts").textContent = DISTRICTS.length;
    var meta = data.meta || {};
    document.getElementById("footNote").textContent = (meta["협약안내"] ? meta["협약안내"] + "\n\n" : "") + (meta["주의사항"] || "");

    renderFieldChips(); renderDistrictChips(); renderTypeChips(); renderFieldIndex();
    bindControls(); apply();
  }
  function load() {
    fetch("../data.json", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(boot)
      .catch(function () {
        if (window.__DATA__) boot(window.__DATA__);
        else document.getElementById("schoolIndex").innerHTML = '<p style="padding:40px 0;color:var(--muted)">데이터를 불러오지 못했어요. ../data.json 또는 ../data.js를 확인해 주세요.</p>';
      });
  }

  function chip(label, n, pressed) {
    return '<button class="chip" type="button" aria-pressed="' + (pressed ? "true" : "false") + '">' + esc(label) + (n != null ? ' <span class="n">' + n + "</span>" : "") + "</button>";
  }
  function renderFieldChips() {
    var box = document.getElementById("chipsField"); box.innerHTML = "";
    FIELDS.forEach(function (f) {
      var b = el(chip(f["이름"], FCOUNT[f["코드"]] || 0, false)); b.dataset.code = f["코드"];
      b.addEventListener("click", function () { state.field = state.field === f["코드"] ? null : f["코드"]; apply(); sync(); });
      box.appendChild(b);
    });
  }
  function renderDistrictChips() {
    var box = document.getElementById("chipsDistrict"); box.innerHTML = "";
    DISTRICTS.forEach(function (d) {
      var b = el(chip(d.name, d.n, false)); b.dataset.district = d.name;
      b.addEventListener("click", function () { state.districts.has(d.name) ? state.districts.delete(d.name) : state.districts.add(d.name); apply(); sync(); });
      box.appendChild(b);
    });
  }
  function renderTypeChips() {
    var box = document.getElementById("chipsType"); box.innerHTML = "";
    ["공립", "사립"].forEach(function (t) {
      var n = SCHOOLS.filter(function (s) { return s["설립구분"] === t; }).length;
      var b = el(chip(t, n, false)); b.dataset.type = t;
      b.addEventListener("click", function () { state.types.has(t) ? state.types.delete(t) : state.types.add(t); apply(); sync(); });
      box.appendChild(b);
    });
  }
  function renderFieldIndex() {
    var box = document.getElementById("fieldIndex"); box.innerHTML = "";
    FIELDS.forEach(function (f, i) {
      var code = f["코드"];
      var row = el('<button class="field-row" type="button" aria-pressed="false"></button>');
      row.style.setProperty("--fc", "var(--f-" + code + ")");
      row.dataset.code = code;
      row.innerHTML =
        '<span class="fnum serif">' + String(i + 1).padStart(2, "0") + "</span>" +
        '<span class="fname serif"><span class="fdot"></span>' + esc(f["이름"]) + "</span>" +
        '<span class="fcount">학교 ' + (FCOUNT[code] || 0) + "곳</span>" +
        '<span class="farrow" aria-hidden="true">→</span>';
      row.addEventListener("click", function () {
        state.field = state.field === code ? null : code; apply(); sync();
        document.getElementById("schools").scrollIntoView({ behavior: "smooth", block: "start" });
      });
      box.appendChild(row);
    });
  }

  function bindControls() {
    var input = document.getElementById("searchInput"), clr = document.getElementById("searchClear");
    input.addEventListener("input", function () { state.q = input.value; clr.hidden = !input.value; apply(); });
    clr.addEventListener("click", function () { input.value = ""; state.q = ""; clr.hidden = true; apply(); input.focus(); });
    document.getElementById("filterReset").addEventListener("click", resetAll);
    document.querySelectorAll("[data-reset]").forEach(function (b) { b.addEventListener("click", resetAll); });
  }
  function resetAll() {
    state.q = ""; state.field = null; state.districts.clear(); state.types.clear();
    var i = document.getElementById("searchInput"); i.value = ""; document.getElementById("searchClear").hidden = true;
    apply(); sync();
  }
  function sync() {
    document.querySelectorAll("#chipsField .chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.code === state.field)); });
    document.querySelectorAll("#fieldIndex .field-row").forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.code === state.field)); });
    document.querySelectorAll("#chipsDistrict .chip").forEach(function (c) { c.setAttribute("aria-pressed", String(state.districts.has(c.dataset.district))); });
    document.querySelectorAll("#chipsType .chip").forEach(function (c) { c.setAttribute("aria-pressed", String(state.types.has(c.dataset.type))); });
  }

  function matches(s) {
    if (state.field && (s["분야코드"] || []).indexOf(state.field) === -1) return false;
    if (state.districts.size && !state.districts.has(s["지역구"])) return false;
    if (state.types.size && !state.types.has(s["설립구분"])) return false;
    if (state.q) {
      var q = norm(state.q);
      var hay = norm([s["name"], s["지역구"], s["설립구분"], s["대표분야"], (s["분야"] || []).join(" "), (s["학과2026"] || []).join(" "), s["학과원문"], s["한줄요약"], s["강점특성"], s["학과별취업처"], s["협약기업"]].join(" "));
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }
  function apply() {
    var list = SCHOOLS.filter(matches);
    renderRows(list); renderActive();
    var rc = document.getElementById("resultCount");
    var clean = !state.field && !state.districts.size && !state.types.size && !state.q;
    rc.innerHTML = clean ? "전체 " + SCHOOLS.length + "곳" : "<b>" + list.length + "곳</b> / 전체 " + SCHOOLS.length + "곳";
    document.getElementById("empty").hidden = list.length !== 0;
    document.getElementById("schoolIndex").hidden = list.length === 0;
  }
  function renderActive() {
    var box = document.getElementById("activeFilters"); box.innerHTML = "";
    function tag(t, rm) { var e = el('<span class="atag">' + esc(t) + '<button type="button" aria-label="필터 제거">✕</button></span>'); e.querySelector("button").addEventListener("click", function () { rm(); apply(); sync(); }); box.appendChild(e); }
    if (state.q) tag('검색 “' + state.q + '”', function () { state.q = ""; document.getElementById("searchInput").value = ""; document.getElementById("searchClear").hidden = true; });
    if (state.field) { var f = FIELDS.filter(function (x) { return x["코드"] === state.field; })[0]; if (f) tag("분야 · " + f["이름"], function () { state.field = null; }); }
    state.districts.forEach(function (d) { tag("지역 · " + d, function () { state.districts.delete(d); }); });
    state.types.forEach(function (t) { tag("설립 · " + t, function () { state.types.delete(t); }); });
  }

  function renderRows(list) {
    var box = document.getElementById("schoolIndex"); box.innerHTML = "";
    list.forEach(function (s, i) {
      var code = s["대표분야코드"];
      var row = el('<button class="school-row" type="button"></button>');
      row.style.setProperty("--fc", "var(--f-" + code + ")");
      row.setAttribute("aria-label", s["name"] + " 상세 보기");
      row.innerHTML =
        '<span class="snum serif">' + String(i + 1).padStart(2, "0") + "</span>" +
        "<span><span class=\"sname serif\">" + esc(s["name"]) + "</span>" +
          '<span class="smeta">' +
            '<span class="tagline ' + (s["설립구분"] === "공립" ? "pub" : "") + '">' + esc(s["설립구분"]) + "</span>" +
            '<span class="tagline">' + esc(s["지역구"]) + "</span>" +
            '<span class="tagline field">' + esc(s["대표분야"]) + "</span>" +
          "</span></span>" +
        '<span class="ssum scol3">' + richText(s["한줄요약"]) + "</span>" +
        '<span class="sgo" aria-hidden="true">→</span>';
      row.addEventListener("click", function () { openPanel(s); });
      box.appendChild(row);
    });
  }

  /* ---------- 협약기업 ---------- */
  var ORG_SUFFIX = /(공사|은행|발전|공단|협회|협의회|사령부|본부|센터|대학교|의료원|병원|약품|중공업|조선해양|테크노파크|테크|솔루션|그룹|공업|교육청|광역시|재단|통운|프랜지|캐스팅|정비센터|연구원|우주산업|난방공사|보증공사|인력공단|장학재단|도시공사|수출입은행|기업협회|관광공사|컨벤션산업협회|철도공사|자원공사|항만공사|중부발전)$/;
  var ORG_STOP = { "전기전자":1,"전자":1,"항공":1,"산업":1,"해양":1,"공업":1,"반도체":1,"조선":1,"기계":1,"전기":1,"통신":1,"건설":1,"토목":1,"물류":1,"금융":1,"제조":1,"디자인":1,"콘텐츠":1,"소방":1 };
  function extractOrg(text) {
    var work = String(text).split(/목표\s*(산업군)?\s*[:：]/)[0].replace(/\([^)]*\)/g, " ").replace(/\[[^\]]*\]/g, " ");
    var out = [];
    work.split(/[·,/.\n:：;]/).forEach(function (tok) {
      var t = tok.replace(/㈜|\(주\)/g, "").replace(/\s*등\s*$/, "").trim();
      if (!t || /\s/.test(t) || t.length < 2 || t.length > 18 || ORG_STOP[t]) return;
      if (ORG_SUFFIX.test(t) || /^[A-Z][A-Za-z&.\-]{1,}$/.test(t) || /대학교?$/.test(t) || (/(전자|항공|산업)$/.test(t) && t.length >= 4)) out.push(t);
    });
    return out.filter(function (v, i) { return out.indexOf(v) === i; }).slice(0, 24);
  }
  function renderPartner(raw) {
    var text = String(raw || "").trim(); if (!text) return "";
    if (text.indexOf("미확인") !== -1) {
      var rest = text.replace(/^[^.]*미확인[.\s]*/, "").trim();
      return '<div class="partner-soft"><span class="l">공식 협약기업은 공개되지 않았어요. 대신 이런 분야로 많이 진출해요 →</span>' + (rest ? richText(rest) : richText(text)) + "</div>";
    }
    var b = extractOrg(text);
    return '<div class="partner-yes"><div class="l">' + (b.length ? "확정 협약·취업처가 공개된 학교예요" : "협약·취업 관련 안내") + "</div>" +
      (b.length ? '<div class="co-badges">' + b.map(function (x) { return '<span class="co">' + esc(x) + "</span>"; }).join("") + "</div>" : "") +
      '<p class="partner-note">' + richText(text) + "</p></div>";
  }

  /* ---------- 상세 패널 ---------- */
  var lastFocused = null;
  function row(k, v) { return '<div class="row"><div class="k">' + k + '</div><div class="v">' + v + "</div></div>"; }
  function tel(t) { t = String(t || "").trim(); if (!t) return '<span style="color:var(--muted)">정보 없음</span>'; var f = t.split(/[,~]/)[0]; return '<a href="tel:' + esc(f.replace(/[^0-9]/g, "")) + '">' + esc(t) + "</a>"; }
  function openPanel(s) {
    lastFocused = document.activeElement;
    var code = s["대표분야코드"], m = FIELD_META[code] || {}, 계열 = m["계열"] || "", home = fixUrl(s["홈페이지"]);
    var pub = s["설립구분"] === "공립";
    var meta = '<div class="p-meta">' +
      '<span class="tagline ' + (pub ? "pub" : "") + '">' + esc(s["설립구분"]) + "</span>" +
      (계열 ? '<span class="tagline">' + esc(계열) + "</span>" : "") +
      '<span class="tagline">' + esc(s["지역구"]) + "</span>" +
      (s["분야"] || []).map(function (fn, i) { var c = (s["분야코드"] || [])[i] || code; return '<span class="tagline" style="border-color:var(--f-' + c + ');color:var(--f-' + c + ')">' + esc(fn) + "</span>"; }).join("") +
      "</div>";

    var r = s["남녀비율"], ratio;
    if (r && (r["남"] + r["여"]) > 0) {
      ratio = '<div class="ratio-bar" role="img" aria-label="남학생 ' + r["남"] + '퍼센트, 여학생 ' + r["여"] + '퍼센트">' +
        '<div class="ratio-m" style="width:' + r["남"] + '%">' + (r["남"] >= 14 ? "남 " + r["남"] + "%" : "") + "</div>" +
        '<div class="ratio-f" style="width:' + r["여"] + '%">' + (r["여"] >= 14 ? "여 " + r["여"] + "%" : "") + "</div></div>" +
        '<div class="ratio-legend"><span><span class="dot dot-m"></span>남 ' + r["남"] + "%</span><span><span class=\"dot dot-f\"></span>여 " + r["여"] + "%</span></div>";
    } else ratio = '<span class="ratio-none">집계 정보 없음</span>';

    var st = String(s["강점특성"] || "").split("\n").filter(Boolean);
    var first = st[0] || s["한줄요약"] || "", rest = st.slice(1);

    document.getElementById("panelBody").innerHTML =
      '<span class="p-kicker serif">부산 · ' + esc(s["지역구"]) + "</span>" +
      '<h2 class="p-title serif" id="pTitle">' + esc(s["name"]) + "</h2>" + meta +
      '<div class="p-photo" role="img" aria-label="' + esc(s["name"]) + ' 대표 이미지 자리(준비 중)">학교 대표 이미지 · 준비 중</div>' +
      '<blockquote class="pull serif">' + richText(first) + "</blockquote>" +
      '<div class="dl">' +
        row("설립 · 계열", esc(s["설립구분"]) + (계열 ? " · " + esc(계열) : "")) +
        row("교무실", tel(s["교무실전화"])) +
        row("취업상담실", tel(s["취업상담실전화"])) +
        row("주소", esc(s["주소"] || "정보 없음")) +
        row("남녀 비율", ratio) +
      "</div>" +
      '<div class="p-block"><h3 class="serif">2026 개설 학과</h3><div class="dept-tags">' +
        (s["학과2026"] || []).map(function (d) { return '<span class="dept">' + esc(d) + "</span>"; }).join("") + "</div></div>" +
      '<div class="p-block"><h3 class="serif">더 알아보기</h3>' +
        (rest.length ? '<details class="disc"><summary>학교 강점 자세히 <span class="chev">▾</span></summary><div class="inner"><p>' + richText(rest.join("\n")) + "</p></div></details>" : "") +
        (s["학과별취업처"] ? '<details class="disc"><summary>학과별 취업처 <span class="peek">— 학과마다 진출 분야가 달라요</span> <span class="chev">▾</span></summary><div class="inner">' + richText(s["학과별취업처"]) + "</div></details>" : "") +
      "</div>" +
      '<div class="p-block"><h3 class="serif">협약 · 취업처</h3>' + renderPartner(s["협약기업"]) + "</div>" +
      (s["변경메모"] ? '<div class="memo"><b>알아두기 —</b> ' + richText(s["변경메모"]) + "</div>" : "") +
      (home ? '<a class="p-home" href="' + esc(home) + '" target="_blank" rel="noopener noreferrer">학교 홈페이지 →</a>' : "") +
      '<div class="p-guide">' + richText((DATA.meta && DATA.meta["협약안내"]) || "") + "</div>" +
      '<p class="p-disclaimer">정보는 2026년 기준이며 학과·교명은 바뀔 수 있어요. 정확한 내용은 학교 홈페이지·학교알리미에서 확인하세요.</p>';

    var root = document.getElementById("panelRoot");
    root.hidden = false; document.body.style.overflow = "hidden";
    document.querySelector(".panel-close").focus();
    document.addEventListener("keydown", onKey);
  }
  function closePanel() {
    document.getElementById("panelRoot").hidden = true; document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  function onKey(e) {
    if (e.key === "Escape") return closePanel();
    if (e.key === "Tab") {
      var f = document.querySelectorAll(".panel a[href], .panel button, .panel summary, .panel [tabindex]");
      if (!f.length) return; var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  document.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", closePanel); });

  /* ---------- 테마 ---------- */
  (function () {
    var btn = document.getElementById("themeToggle"), saved = null;
    try { saved = localStorage.getItem("bsvhs2-theme"); } catch (e) {}
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    function ic() { var dark = document.documentElement.getAttribute("data-theme") === "dark" || (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches); btn.querySelector(".theme-icon").textContent = dark ? "☀︎" : "🌙"; }
    ic();
    btn.addEventListener("click", function () { var n = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"; document.documentElement.setAttribute("data-theme", n); try { localStorage.setItem("bsvhs2-theme", n); } catch (e) {} ic(); });
  })();

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load); else load();
})();
