// data.json(원본) + "부산 특성화고 정보.csv"(CP949) 병합기
// - data.json은 학교의 텍스트 정보(학과/강점/취업처/협약기업/변경메모 등)의 원천
// - CSV에서 교무실전화·취업상담실전화·학년별 남녀 학생수만 추출해 학교명으로 매칭 병합
// - 결과물: ../data.json(덮어씀, 원본 필드 유지 + 신규 필드 추가), ../data.js(window.__DATA__)
// 없는 값은 지어내지 않고 비워둔다.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = 'C:/Users/user/Desktop/s_ highschool';
const OUT_DIR = path.join(__dirname, '..');

// 1) 원본 data.json 로드 (UTF-8)
const data = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'data.json'), 'utf8'));

// 2) CSV 로드 (CP949/EUC-KR → UTF-8 디코드)
const csvBuf = fs.readFileSync(path.join(SRC_DIR, '부산 특성화고 정보.csv'));
const csvText = new TextDecoder('euc-kr').decode(csvBuf);

// 3) 따옴표·개행 포함 CSV 파서
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

const rows = parseCSV(csvText).filter(r => r.length > 1 && r[0].trim());
const header = rows.shift();

// 열 인덱스 (0:학교명 1:설립 2:교무실전화 3:취업상담실전화 4:홈피 5:주소
//  6:1남 7:1여 8:2남 9:2여 10:3남 11:3여 ...)
const norm = s => (s || '').replace(/\s+/g, '').replace(/등학교$/, '').replace(/학교$/, '');
const toInt = v => { const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10); return Number.isFinite(n) ? n : 0; };

const csvByName = new Map();
for (const r of rows) {
  const name = r[0].trim();
  csvByName.set(norm(name), {
    교무실전화: (r[2] || '').trim(),
    취업상담실전화: (r[3] || '').trim(),
    male: toInt(r[6]) + toInt(r[8]) + toInt(r[10]),
    female: toInt(r[7]) + toInt(r[9]) + toInt(r[11]),
  });
}

// 4) 병합
const unmatched = [];
for (const s of data.학교) {
  const hit = csvByName.get(norm(s.name));
  if (!hit) { unmatched.push(s.name); continue; }
  s.교무실전화 = hit.교무실전화 || '';
  s.취업상담실전화 = hit.취업상담실전화 || '';
  const total = hit.male + hit.female;
  if (total > 0) {
    s.남녀비율 = {
      남: Math.round((hit.male / total) * 100),
      여: Math.round((hit.female / total) * 100),
      남학생수: hit.male,
      여학생수: hit.female,
    };
  } else {
    s.남녀비율 = null; // 데이터 없음 → 화면에서 '집계 정보 없음' 처리
  }
}

// 5) 출처 안내문(협약기업 멘트 PDF 내용) 메타에 추가
data.meta.협약안내 =
  '정확한 협약기업·실제 취업처·연도별 취업률은 아래에서 확인하는 것이 가장 정확해요.\n' +
  '· 학교알리미(schoolinfo.go.kr): ‘졸업생의 진로 현황’ 공시 항목에 취업률·진학률이 매년 공개돼요.\n' +
  '· 각 학교 홈페이지의 취업지원 게시판, 또는 대표전화(취업지원부).\n' +
  '· 부산진로진학지원센터·부산교육청 취업지원 페이지(hijob.pen.go.kr).';

// 6) 저장
const json = JSON.stringify(data, null, 2);
fs.writeFileSync(path.join(OUT_DIR, 'data.json'), json, 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'data.js'),
  '/* file:// 로 열 때 fetch 폴백용. tools/merge.mjs가 생성함. 직접 수정하지 마세요. */\n' +
  'window.__DATA__ = ' + json + ';\n', 'utf8');

console.log('학교 수:', data.학교.length);
console.log('전화/남녀비율 매칭 실패:', unmatched.length ? unmatched.join(', ') : '없음');
console.log('예시(경남공고):', JSON.stringify(data.학교[0].남녀비율), data.학교[0].교무실전화);
