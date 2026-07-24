/* =========================================================
   부산 특성화고 한눈에 보기 — app.js (바닐라 JS)
   데이터: fetch('./data.json') → 실패 시 window.__DATA__ 폴백
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 분야 아이콘/색상 ---------- */
  var FIELD_META = {
    A: { emoji: "⚙️", short: "기계·자동차·화학", 계열: "공업 계열" },
    B: { emoji: "🔌", short: "전기·전자·반도체", 계열: "공업 계열" },
    C: { emoji: "💻", short: "IT·SW·게임", 계열: "정보·IT 계열" },
    D: { emoji: "🎨", short: "디자인·콘텐츠·뷰티", 계열: "디자인·콘텐츠 계열" },
    E: { emoji: "🏗️", short: "건축·토목·공간", 계열: "공업 계열" },
    F: { emoji: "✈️", short: "항공·국방·안전", 계열: "공업·국방 계열" },
    G: { emoji: "🍳", short: "관광·조리·외식", 계열: "가사·서비스 계열" },
    H: { emoji: "💼", short: "경영·금융·상업", 계열: "상업(경영) 계열" },
    I: { emoji: "🩺", short: "보건·간호", 계열: "보건·복지 계열" },
    J: { emoji: "🌱", short: "농생명·원예·조경", 계열: "농생명 계열" }
  };

  /* ---------- 어려운 용어 사전 (한 줄 툴팁) ---------- */
  var GLOSSARY = {
    "MRO": "MRO=항공기 정비·수리·점검(Maintenance, Repair, Overhaul)",
    "NCS": "NCS=국가가 정리한 직무 능력 표준(현장에 필요한 능력을 정리한 기준)",
    "도제학교": "도제학교=학교와 기업을 오가며 일하듯 배우는 산학일체형 교육",
    "P-TECH": "P-TECH=고교+전문대 연계로 전문학사까지 잇는 교육 과정",
    "K-MOVE": "K-MOVE=정부가 돕는 청년 해외 취업 지원 사업",
    "MICE": "MICE=회의·포상관광·전시 등 비즈니스 관광 산업",
    "FFK": "FFK=한국영농학생연합회(농업계고 학생 활동 단체)",
    "CIS": "CIS=케임브리지 국제학교 인증(국제 교육과정 인증)",
    "IoT": "IoT=사물인터넷(기기들이 인터넷으로 연결되는 기술)",
    "산학협력": "산학협력=학교와 기업이 함께 교육·연구·취업을 돕는 것",
    "선취업 후진학": "선취업 후진학=먼저 취업한 뒤 나중에 대학에 진학하는 길",
    "부사관": "부사관=군에서 병과 장교 사이의 간부(직업 군인)"
  };
  // 길이가 긴 단어부터 매칭
  var GLOSSARY_KEYS = Object.keys(GLOSSARY).sort(function (a, b) { return b.length - a.length; });

  /* ---------- 유틸 ---------- */
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function normalize(s) { return String(s == null ? "" : s).toLowerCase().replace(/\s+/g, ""); }
  function fixUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) u = "https://" + u.replace(/^\/+/, "");
    return u;
  }
  // 텍스트를 이스케이프한 뒤, 줄바꿈→<br>, 용어→<abbr> 툴팁 적용
  function richText(s) {
    var safe = esc(s);
    for (var i = 0; i < GLOSSARY_KEYS.length; i++) {
      var k = GLOSSARY_KEYS[i];
      var re = new RegExp("(" + k.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&") + ")", "g");
      safe = safe.replace(re, function (m) {
        return '<abbr class="term" title="' + esc(GLOSSARY[k]) + '" tabindex="0">' + m + "</abbr>";
      });
    }
    return safe.replace(/\n/g, "<br>");
  }

  /* ---------- 상태 ---------- */
  var DATA = null, SCHOOLS = [], FIELDS = [];
  var FIELD_COUNT = {}, DISTRICTS = [];
  var state = { q: "", field: null, districts: new Set(), types: new Set() };

  /* ---------- 데이터 로딩 ---------- */
  function boot(data) {
    DATA = data;
    SCHOOLS = data["학교"] || [];
    FIELDS = data["분야"] || [];
    // 분야별 학교 수
    FIELDS.forEach(function (f) { FIELD_COUNT[f["코드"]] = 0; });
    var dset = {};
    SCHOOLS.forEach(function (s) {
      (s["분야코드"] || []).forEach(function (c) { if (FIELD_COUNT[c] != null) FIELD_COUNT[c]++; });
      if (s["지역구"]) dset[s["지역구"]] = (dset[s["지역구"]] || 0) + 1;
    });
    DISTRICTS = Object.keys(dset).sort(function (a, b) { return a.localeCompare(b, "ko"); })
      .map(function (d) { return { name: d, n: dset[d] }; });

    document.getElementById("heroCount").textContent = SCHOOLS.length;
    var meta = data.meta || {};
    document.getElementById("footNote").textContent =
      (meta["협약안내"] ? meta["협약안내"] + "\n\n" : "") + (meta["주의사항"] || "");

    renderFieldChips();
    renderFieldGrid();
    renderDistrictChips();
    renderTypeChips();
    bindControls();
    apply();
  }

  function loadData() {
    fetch("./data.json", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(boot)
      .catch(function () {
        if (window.__DATA__) { boot(window.__DATA__); }
        else {
          document.getElementById("schoolGrid").innerHTML =
            '<div class="empty-state"><div class="empty-emoji">⚠️</div>' +
            "<p><b>데이터를 불러오지 못했어요.</b></p>" +
            '<p class="muted">data.json / data.js 파일이 같은 폴더에 있는지 확인해 주세요.</p></div>';
        }
      });
  }

  /* ---------- 필터 UI ---------- */
  function renderFieldChips() {
    var bar = document.getElementById("chipsFieldBar");
    bar.innerHTML = "";
    FIELDS.forEach(function (f) {
      var m = FIELD_META[f["코드"]] || {};
      var b = el('<button class="chip" type="button" aria-pressed="false"></button>');
      b.innerHTML = '<span aria-hidden="true">' + (m.emoji || "•") + "</span> " +
        esc(f["이름"]) + ' <span class="chip-count">' + (FIELD_COUNT[f["코드"]] || 0) + "</span>";
      b.addEventListener("click", function () {
        state.field = (state.field === f["코드"]) ? null : f["코드"];
        apply(); syncChips();
      });
      b.dataset.code = f["코드"];
      bar.appendChild(b);
    });
  }
  function renderFieldGrid() {
    var grid = document.getElementById("fieldGrid");
    grid.innerHTML = "";
    FIELDS.forEach(function (f) {
      var code = f["코드"], m = FIELD_META[code] || {};
      var card = el('<button class="field-card" type="button" aria-pressed="false"></button>');
      card.style.setProperty("--fbg", "var(--f-" + code + "-bg)");
      card.style.setProperty("--fink", "var(--f-" + code + "-ink)");
      card.innerHTML =
        '<span class="field-emoji" aria-hidden="true">' + (m.emoji || "•") + "</span>" +
        '<span class="field-name">' + esc(f["이름"]) + "</span>" +
        '<span class="field-count">학교 ' + (FIELD_COUNT[code] || 0) + "곳 보기</span>";
      card.dataset.code = code;
      card.addEventListener("click", function () {
        state.field = (state.field === code) ? null : code;
        apply(); syncChips();
        document.getElementById("schools").scrollIntoView({ behavior: "smooth", block: "start" });
      });
      grid.appendChild(card);
    });
  }
  function renderDistrictChips() {
    var box = document.getElementById("chipsDistrict");
    box.innerHTML = "";
    DISTRICTS.forEach(function (d) {
      var b = el('<button class="chip" type="button" aria-pressed="false"></button>');
      b.innerHTML = esc(d.name) + ' <span class="chip-count">' + d.n + "</span>";
      b.dataset.district = d.name;
      b.addEventListener("click", function () {
        if (state.districts.has(d.name)) state.districts.delete(d.name); else state.districts.add(d.name);
        apply(); syncChips();
      });
      box.appendChild(b);
    });
  }
  function renderTypeChips() {
    var box = document.getElementById("chipsType");
    box.innerHTML = "";
    ["공립", "사립"].forEach(function (t) {
      var n = SCHOOLS.filter(function (s) { return s["설립구분"] === t; }).length;
      var b = el('<button class="chip" type="button" aria-pressed="false"></button>');
      b.innerHTML = esc(t) + ' <span class="chip-count">' + n + "</span>";
      b.dataset.type = t;
      b.addEventListener("click", function () {
        if (state.types.has(t)) state.types.delete(t); else state.types.add(t);
        apply(); syncChips();
      });
      box.appendChild(b);
    });
  }

  function bindControls() {
    var input = document.getElementById("searchInput");
    var clearBtn = document.getElementById("searchClear");
    input.addEventListener("input", function () {
      state.q = input.value;
      clearBtn.hidden = !input.value;
      apply();
    });
    clearBtn.addEventListener("click", function () {
      input.value = ""; state.q = ""; clearBtn.hidden = true; apply(); input.focus();
    });
    document.getElementById("filterReset").addEventListener("click", resetAll);
    document.querySelectorAll("[data-reset]").forEach(function (b) { b.addEventListener("click", resetAll); });
  }
  function resetAll() {
    state.q = ""; state.field = null; state.districts.clear(); state.types.clear();
    var i = document.getElementById("searchInput"); i.value = "";
    document.getElementById("searchClear").hidden = true;
    apply(); syncChips();
  }
  function syncChips() {
    document.querySelectorAll("#chipsFieldBar .chip").forEach(function (c) {
      c.setAttribute("aria-pressed", String(c.dataset.code === state.field));
    });
    document.querySelectorAll("#fieldGrid .field-card").forEach(function (c) {
      c.setAttribute("aria-pressed", String(c.dataset.code === state.field));
    });
    document.querySelectorAll("#chipsDistrict .chip").forEach(function (c) {
      c.setAttribute("aria-pressed", String(state.districts.has(c.dataset.district)));
    });
    document.querySelectorAll("#chipsType .chip").forEach(function (c) {
      c.setAttribute("aria-pressed", String(state.types.has(c.dataset.type)));
    });
  }

  /* ---------- 필터 적용 ---------- */
  function matches(s) {
    if (state.field && (s["분야코드"] || []).indexOf(state.field) === -1) return false;
    if (state.districts.size && !state.districts.has(s["지역구"])) return false;
    if (state.types.size && !state.types.has(s["설립구분"])) return false;
    if (state.q) {
      var q = normalize(state.q);
      var hay = normalize([
        s["name"], s["지역구"], s["설립구분"], s["대표분야"],
        (s["분야"] || []).join(" "), (s["학과2026"] || []).join(" "),
        s["학과원문"], s["한줄요약"], s["강점특성"], s["학과별취업처"], s["협약기업"]
      ].join(" "));
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  function apply() {
    var list = SCHOOLS.filter(matches);
    renderSchoolCards(list);
    renderActiveFilters();
    var rc = document.getElementById("resultCount");
    if (list.length === SCHOOLS.length && !state.field && !state.districts.size && !state.types.size && !state.q) {
      rc.textContent = "전체 학교를 보여주고 있어요 (" + SCHOOLS.length + "곳)";
    } else {
      rc.innerHTML = "지금 <b>" + list.length + "곳</b>의 학교가 보여요 (전체 " + SCHOOLS.length + "곳 중)";
    }
    document.getElementById("emptyState").hidden = list.length !== 0;
    document.getElementById("schoolGrid").hidden = list.length === 0;
  }

  function renderActiveFilters() {
    var box = document.getElementById("activeFilters");
    box.innerHTML = "";
    function tag(label, onRemove) {
      var t = el('<span class="active-tag">' + esc(label) + '<button type="button" aria-label="필터 제거">✕</button></span>');
      t.querySelector("button").addEventListener("click", function () { onRemove(); apply(); syncChips(); });
      box.appendChild(t);
    }
    if (state.q) tag('검색: "' + state.q + '"', function () {
      state.q = ""; document.getElementById("searchInput").value = ""; document.getElementById("searchClear").hidden = true;
    });
    if (state.field) {
      var f = FIELDS.filter(function (x) { return x["코드"] === state.field; })[0];
      if (f) tag("분야: " + f["이름"], function () { state.field = null; });
    }
    state.districts.forEach(function (d) { tag("지역: " + d, function () { state.districts.delete(d); }); });
    state.types.forEach(function (t) { tag("설립: " + t, function () { state.types.delete(t); }); });
  }

  /* ---------- 학교 카드 ---------- */
  function logoText(name) { return (name || "?").replace(/(고등학교|학교)$/, "").slice(0, 2); }
  function renderSchoolCards(list) {
    var grid = document.getElementById("schoolGrid");
    grid.innerHTML = "";
    list.forEach(function (s) {
      var code = s["대표분야코드"];
      var card = el('<button class="school-card" type="button"></button>');
      card.style.setProperty("--fbg", "var(--f-" + code + "-bg)");
      card.style.setProperty("--fink", "var(--f-" + code + "-ink)");
      card.setAttribute("aria-label", s["name"] + " 상세 보기");
      var pubCls = s["설립구분"] === "공립" ? "badge-pub" : "badge-pri";
      card.innerHTML =
        '<div class="sc-head">' +
          '<span class="sc-logo" aria-hidden="true">' + esc(logoText(s["name"])) + "</span>" +
          '<h3 class="sc-name">' + esc(s["name"]) + "</h3>" +
        "</div>" +
        '<div class="badges">' +
          '<span class="badge ' + pubCls + '">' + esc(s["설립구분"]) + "</span>" +
          '<span class="badge">' + esc(s["지역구"]) + "</span>" +
          '<span class="badge badge-field">' + (FIELD_META[code] ? FIELD_META[code].emoji + " " : "") + esc(s["대표분야"]) + "</span>" +
        "</div>" +
        '<p class="sc-summary">' + richText(s["한줄요약"]) + "</p>" +
        '<span class="sc-more">자세히 보기 →</span>';
      card.addEventListener("click", function () { openModal(s); });
      grid.appendChild(card);
    });
  }

  /* ---------- 협약기업 렌더 ----------
     - "미확인" 포함: 부드러운 안내 톤 + 목표 산업군
     - 그 외(확정 정보): 초록 박스로 강조 + 조직명 배지 + 원문 전체(정보 손실 없이)
     조직명 배지는 원문에 실제로 있는 토큰만 사용(지어내지 않음). */
  var ORG_SUFFIX = /(공사|은행|발전|공단|협회|협의회|사령부|본부|센터|대학교|의료원|병원|약품|중공업|조선해양|테크노파크|테크|솔루션|그룹|공업|교육청|광역시|재단|통운|프랜지|캐스팅|정비센터|연구원|우주산업|난방공사|보증공사|인력공단|장학재단|도시공사|수출입은행|기업협회|관광공사|컨벤션산업협회|철도공사|자원공사|항만공사|중부발전)$/;
  // 조직명처럼 보여도 실제로는 '분야' 일반어인 토큰은 제외
  var ORG_STOP = { "전기전자":1,"전자":1,"항공":1,"산업":1,"해양":1,"공업":1,"반도체":1,"조선":1,"기계":1,"전기":1,"통신":1,"건설":1,"토목":1,"물류":1,"금융":1,"제조":1,"디자인":1,"콘텐츠":1,"소방":1 };
  function extractOrgBadges(text) {
    // '목표'(목표 산업군=분야 설명) 이전, 출처 괄호 이전까지만 대상으로
    var work = String(text).split(/목표\s*(산업군)?\s*[:：]/)[0];
    work = work.replace(/\([^)]*\)/g, " ");        // 괄호 안 부연설명 제거
    work = work.replace(/\[[^\]]*\]/g, " ");        // [공기업] 등 라벨 제거
    var badges = [];
    work.split(/[·,/.\n:：;]/).forEach(function (tok) {
      var t = tok.replace(/㈜|\(주\)/g, "").replace(/\s*등\s*$/, "").trim();
      if (!t || /\s/.test(t)) return;               // 공백 포함(문장 조각) 제외
      if (t.length < 2 || t.length > 18) return;
      if (ORG_STOP[t]) return;
      var isOrg = ORG_SUFFIX.test(t) || /^[A-Z][A-Za-z&.\-]{1,}$/.test(t) || /대학교?$/.test(t) || /(전자|항공|산업)$/.test(t) && t.length >= 4;
      if (isOrg) badges.push(t);
    });
    return badges.filter(function (v, i) { return badges.indexOf(v) === i; }).slice(0, 24);
  }
  function renderPartnership(raw) {
    var text = String(raw || "").trim();
    if (!text) return "";
    if (text.indexOf("미확인") !== -1) {
      var rest = text.replace(/^[^.]*미확인[.\s]*/, "").trim(); // "…협약기업 미확인." 제거
      return '<div class="partner-soft">' +
        '<span class="p-lab">🏢 공식 협약기업은 공개되지 않았어요. 대신 이런 분야로 많이 진출해요 👉</span>' +
        (rest ? richText(rest) : richText(text)) +
        "</div>";
    }
    var badges = extractOrgBadges(text);
    var label = badges.length
      ? "✅ 확정 협약·취업처가 공개된 학교예요"
      : "🏢 협약·취업 관련 안내";
    return '<div class="partner-confirmed">' +
      '<span class="p-lab">' + label + "</span>" +
      (badges.length ? '<div class="company-badges">' +
        badges.map(function (b) { return '<span class="company-badge">' + esc(b) + "</span>"; }).join("") +
        "</div>" : "") +
      '<p class="partner-note">' + richText(text) + "</p>" +
      "</div>";
  }

  /* ---------- 상세 모달 ---------- */
  var lastFocused = null;
  function openModal(s) {
    lastFocused = document.activeElement;
    var code = s["대표분야코드"], m = FIELD_META[code] || {};
    var body = document.getElementById("modalBody");
    var root = document.getElementById("modalRoot");

    var pubCls = s["설립구분"] === "공립" ? "badge-pub" : "badge-pri";
    var 계열 = (m["계열"] || "") ;
    var homeUrl = fixUrl(s["홈페이지"]);

    var badges = '<div class="badges md-badges">' +
      '<span class="badge ' + pubCls + '">' + esc(s["설립구분"]) + "</span>" +
      (계열 ? '<span class="badge badge-field">' + esc(계열) + "</span>" : "") +
      '<span class="badge">' + esc(s["지역구"]) + "</span>" +
      (s["분야"] || []).map(function (fn, i) {
        var c = (s["분야코드"] || [])[i] || code;
        return '<span class="badge" style="background:var(--f-' + c + '-bg);color:var(--f-' + c + '-ink);border-color:transparent">' +
          (FIELD_META[c] ? FIELD_META[c].emoji + " " : "") + esc(fn) + "</span>";
      }).join("") +
      "</div>";

    // 남녀비율
    var r = s["남녀비율"], ratioHtml;
    if (r && (r["남"] + r["여"]) > 0) {
      ratioHtml =
        '<div class="ratio-bar" role="img" aria-label="남학생 ' + r["남"] + '퍼센트, 여학생 ' + r["여"] + '퍼센트">' +
          '<div class="ratio-m" style="width:' + r["남"] + '%">' + (r["남"] >= 12 ? "남 " + r["남"] + "%" : "") + "</div>" +
          '<div class="ratio-f" style="width:' + r["여"] + '%">' + (r["여"] >= 12 ? "여 " + r["여"] + "%" : "") + "</div>" +
        "</div>" +
        '<div class="ratio-legend"><span><span class="dot dot-m"></span>남학생 ' + r["남"] + "%</span>" +
        '<span><span class="dot dot-f"></span>여학생 ' + r["여"] + "%</span></div>";
    } else {
      ratioHtml = '<p class="ratio-none">남녀 비율 집계 정보가 없어요.</p>';
    }

    // 강점: 첫 줄 요약 + 펼치기
    var strengths = String(s["강점특성"] || "").split("\n").filter(Boolean);
    var firstStrength = strengths[0] || s["한줄요약"] || "";
    var restStrength = strengths.slice(1);

    body.innerHTML =
      '<div class="md-hero">' +
        "<div>" +
          '<div class="md-titlewrap">' +
            '<span class="md-logo" style="--fbg:var(--f-' + code + '-bg);--fink:var(--f-' + code + '-ink)" aria-hidden="true">' + esc(logoText(s["name"])) + "</span>" +
            '<h2 class="md-title" id="modalTitle">' + esc(s["name"]) + "</h2>" +
          "</div>" + badges +
        "</div>" +
        '<div class="md-photo" role="img" aria-label="' + esc(s["name"]) + ' 대표 이미지 자리(준비 중)">' +
          '<span aria-hidden="true">' + (m.emoji || "🏫") + "</span>학교 대표 이미지<br>(준비 중)</div>" +
      "</div>" +

      '<div class="md-oneliner"><span class="lab">✏️ 우리 학교의 강점</span>' + richText(firstStrength) + "</div>" +

      '<div class="md-facts">' +
        fact("🏫 설립구분", esc(s["설립구분"]) + (계열 ? " · " + esc(계열) : "")) +
        fact("📍 지역", esc(s["지역구"])) +
        fact("☎️ 교무실", telHtml(s["교무실전화"])) +
        fact("💬 취업상담실", telHtml(s["취업상담실전화"])) +
        factWide("🏠 주소", esc(s["주소"] || "정보 없음")) +
        factWide("👩‍👦 남녀 비율 (남 : 여)", ratioHtml) +
      "</div>" +

      '<div class="md-block"><h4>🎓 2026 개설 학과</h4><div class="tags">' +
        (s["학과2026"] || []).map(function (d) { return '<span class="tag">' + esc(d) + "</span>"; }).join("") +
      "</div></div>" +

      // 강점 자세히
      (restStrength.length ?
        '<details class="disclosure"><summary>💪 학교 강점 자세히 보기 <span class="chev">▾</span></summary>' +
          '<div class="body"><p>' + richText(restStrength.join("\n")) + "</p></div></details>" : "") +

      // 취업처 (아래쪽, 펼치기)
      (s["학과별취업처"] ?
        '<details class="disclosure"><summary>💼 학과별 취업처 자세히 보기 <span class="chev">▾</span>' +
          '<span class="oneline-peek">— 학과마다 진출 분야가 달라요</span></summary>' +
          '<div class="body">' + richText(s["학과별취업처"]) + "</div></details>" : "") +

      // 협약기업
      '<div class="md-block"><h4>🤝 협약·취업처</h4>' + renderPartnership(s["협약기업"]) + "</div>" +

      // 변경메모
      (s["변경메모"] ? '<div class="memo"><b>📌 알아두기:</b> ' + richText(s["변경메모"]) + "</div>" : "") +

      // 홈페이지
      (homeUrl ? '<a class="md-home-link btn-ghost" href="' + esc(homeUrl) + '" target="_blank" rel="noopener noreferrer">🔗 학교 홈페이지 바로가기</a>' : "") +

      // 협약 안내 (PDF 멘트)
      '<div class="md-guide">' + richText((DATA.meta && DATA.meta["협약안내"]) || "") + "</div>" +

      // 면책
      '<p class="md-disclaimer">정보는 2026년 기준이며 학과·교명은 바뀔 수 있어요. 정확한 내용은 학교 홈페이지·학교알리미에서 확인하세요.</p>';

    root.hidden = false;
    document.body.style.overflow = "hidden";
    document.querySelector(".modal-close").focus();
    document.addEventListener("keydown", onKeydown);
  }
  function fact(label, valHtml) {
    return '<div class="fact"><div class="flab">' + label + '</div><div class="fval">' + valHtml + "</div></div>";
  }
  function factWide(label, valHtml) {
    return '<div class="fact wide"><div class="flab">' + label + '</div><div class="fval">' + valHtml + "</div></div>";
  }
  function telHtml(t) {
    t = String(t || "").trim();
    if (!t) return '<span class="muted">정보 없음</span>';
    var first = t.split(/[,~]/)[0].trim();
    return '<a href="tel:' + esc(first.replace(/[^0-9]/g, "")) + '">' + esc(t) + "</a>";
  }
  function closeModal() {
    var root = document.getElementById("modalRoot");
    root.hidden = true;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  function onKeydown(e) {
    if (e.key === "Escape") { closeModal(); return; }
    if (e.key === "Tab") { // 포커스 트랩
      var f = document.querySelectorAll(".modal a[href], .modal button, .modal summary, .modal [tabindex]");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  document.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", closeModal); });

  /* ---------- 테마 토글 ---------- */
  (function themeInit() {
    var btn = document.getElementById("themeToggle");
    var saved = null;
    try { saved = localStorage.getItem("bsvhs-theme"); } catch (e) {}
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    function icon() {
      var dark = document.documentElement.getAttribute("data-theme") === "dark" ||
        (!document.documentElement.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
      btn.querySelector(".theme-icon").textContent = dark ? "☀️" : "🌙";
    }
    icon();
    btn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("bsvhs-theme", next); } catch (e) {}
      icon();
    });
  })();

  /* ---------- 시작 ---------- */
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadData);
  else loadData();
})();
