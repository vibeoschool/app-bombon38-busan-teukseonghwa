# 부산 특성화고 한눈에 보기 🎒

중학생(초6~중3)이 **부산 지역 특성화고**를 분야별로 쉽게 탐색할 수 있는 반응형 웹사이트입니다.
프레임워크 없이 **순수 HTML/CSS/JS(바닐라)** 로 만들어, 파일만 올리면 GitHub Pages에서 바로 서비스됩니다.

- 데이터: 부산 특성화고 **32개교** (2026년 7월 기준)
- 기능: 분야별 탐색(10개 분야), 실시간 검색, 다중 필터(분야·지역구·설립), 학교 상세(학과·강점·취업처·협약기업·남녀비율), 라이트/다크 모드, 모바일 우선 반응형, 키보드 접근성

---

## 📁 폴더 구조

```
busan-teukseonghwa/
├── index.html          # 페이지 뼈대(단일 페이지 앱)
├── css/styles.css      # 스타일(라이트/다크·반응형)
├── js/app.js           # 로직(검색/필터/상세/테마)
├── data.json           # ★데이터 원본(학교 32곳). 화면이 fetch로 읽음
├── data.js             # file:// 로 열 때 쓰는 폴백(window.__DATA__). data.json과 내용 동일
├── .nojekyll           # GitHub Pages가 파일을 그대로 서비스하도록
├── tools/
│   ├── merge.mjs       # data.json + '부산 특성화고 정보.csv' 병합 스크립트
│   └── serve.mjs       # 로컬 미리보기용 초경량 정적 서버
└── .github/workflows/deploy.yml   # (선택) 자동 배포
```

> 모든 경로는 **상대경로(`./`)** 입니다. GitHub Pages 하위 경로(`/저장소명/`)에서도 안전하게 열립니다.

---

## ▶️ 로컬에서 실행하기

### 방법 1. 파이썬 정적 서버 (권장)
```bash
python3 -m http.server 8000
```
브라우저에서 <http://localhost:8000> 접속.

### 방법 2. Node 서버 (파이썬이 없을 때)
```bash
node tools/serve.mjs
```
<http://localhost:8123> 접속.

### 방법 3. 그냥 파일 열기
`index.html`을 더블클릭해도 동작합니다. (이때는 `fetch`가 막히므로 자동으로 `data.js`로 폴백합니다.)

---

## 🚀 GitHub Pages 배포

빌드가 필요 없는 정적 사이트라, **저장소에 파일을 올리기만 하면** 됩니다.

### 1) 저장소 준비
`gh` CLI가 있으면 한 번에:
```bash
gh repo create busan-teukseonghwa --public --source=. --push
```
없으면 GitHub 웹에서 새 **public** 저장소를 직접 만드세요.

### 2) 커밋 & 푸시
```bash
git init
git add .
git commit -m "부산 특성화고 탐색 사이트"
git branch -M main
git remote add origin https://github.com/<사용자명>/<저장소명>.git
git push -u origin main
```

### 3) Pages 활성화
저장소 → **Settings → Pages** →
- **Source**: `Deploy from a branch`
- **Branch**: `main` / 폴더 `/(root)` → **Save**

### 4) 접속
1~2분 뒤 아래 주소에서 열립니다.
```
https://<사용자명>.github.io/<저장소명>/
```

> **자동 배포(선택):** `main`에 push할 때마다 배포되게 하려면, Settings → Pages → Source를 **GitHub Actions**로 바꾸세요. `.github/workflows/deploy.yml`이 자동으로 동작합니다. (브랜치 배포와 둘 중 하나만 쓰면 됩니다.)

### 다른 호스팅 (선택)
- **Netlify**: 새 사이트 → 이 폴더 연결 → Build command 비움, Publish directory `.`
- **Vercel**: New Project → 프레임워크 `Other` → Output/Root `.`

---

## ✏️ 데이터 수정 방법

### 간단 수정 (텍스트만)
`data.json`을 열어 해당 학교의 값을 고칩니다. 그리고 **같은 내용을 `data.js`에도** 반영해야 file:// 폴백까지 맞습니다.
`강점특성`·`학과별취업처`·`협약기업`·`변경메모` 안의 줄바꿈은 `\n`으로 넣으면 화면에서 줄바꿈됩니다.

### 원본에서 다시 생성 (권장)
전화번호·남녀비율은 `부산 특성화고 정보.csv`에서 병합됩니다. 원본(`C:/Users/user/Desktop/s_ highschool/`)을 수정한 뒤:
```bash
node tools/merge.mjs
```
그러면 `data.json`과 `data.js`가 함께 다시 만들어집니다.

#### `data.json` 구조
```jsonc
{
  "meta": { "title", "설명", "기준시점", "학교수", "주의사항", "협약안내" },
  "분야": [ { "코드": "A", "이름": "기계·자동차·화학공업" }, ... ],   // 10개
  "학교": [ {
    "name", "설립구분", "지역구", "주소", "홈페이지",
    "학과2026": [...], "학과원문",
    "대표분야코드", "대표분야", "분야코드": [...], "분야": [...],
    "한줄요약", "강점특성", "학과별취업처", "협약기업", "변경메모",
    "교무실전화", "취업상담실전화",                 // CSV에서 병합
    "남녀비율": { "남", "여", "남학생수", "여학생수" }  // CSV에서 계산
  }, ... ]
}
```

---

## ✅ 콘텐츠 정확성 원칙

- 데이터에 없는 사실(통계·순위·연도 등)을 임의로 추가하지 않았습니다.
- `협약기업`에 **"미확인"** 이 있으면 화면에서 "공식 협약기업은 공개되지 않았어요…" 안내 톤으로 바꾸고,
  확정 기업명이 있는 학교는 **원문에 실제로 있는 조직명만** 배지로 강조합니다.
- 각 학교 상세와 푸터에 **"정보는 2026년 기준이며 학과·교명은 바뀔 수 있어요. 정확한 내용은 학교
  홈페이지·학교알리미에서 확인하세요."** 안내를 표기합니다.
- 정확한 협약기업·취업률은 **학교알리미(schoolinfo.go.kr)**, 각 학교 홈페이지 취업지원 게시판,
  **부산교육청 hijob.pen.go.kr** 에서 확인하세요.

---

_학습·진로안내용으로 제작되었습니다._
