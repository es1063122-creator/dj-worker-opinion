/**
 * 동진 종사자 안전보건 의견청취 QR 관리시스템 v1.2
 * - 본사 통합 관리자 대시보드
 * - 전현장 현황 / 현장별 필터 / 현장QR 관리 / 조치상태 관리
 *
 * 설치 순서
 * 1) 새 Google Sheet 생성
 * 2) 확장 프로그램 > Apps Script에 이 코드 붙여넣기
 * 3) CONFIG.SHEET_ID, CONFIG.ADMIN_PIN 수정
 * 4) setupSheets() 1회 실행
 * 5) 배포 > 새 배포 > 웹 앱 > 액세스 권한: 모든 사용자
 */
const CONFIG = {
  SHEET_ID: '여기에_구글시트_ID_입력',
  ADMIN_PIN: '5183',
  SHEET_OPINIONS: '의견접수',
  SHEET_QR: '현장QR',
  SHEET_CHECK: '반기점검'
};

const HEADERS_OPINIONS = [
  '접수번호','접수일시','현장명','소속업체','직종','위험장소','위험유형','의견내용','긴급도','사진URL','작성자','연락처','상태','검토자','검토일','조치내용','담당자','조치예정일','완료일','비고'
];
const HEADERS_QR = ['현장명','관리자','원청/공종','게시위치','QR주소','생성일','사용여부','비고'];
const HEADERS_CHECK = ['점검기간','현장명','접수건수','조치완료','조치중','교육반영','해당없음','미완료','점검자','점검일','대표이사 보고여부','비고'];

function setupSheets() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  setupOneSheet_(ss, CONFIG.SHEET_OPINIONS, HEADERS_OPINIONS);
  setupOneSheet_(ss, CONFIG.SHEET_QR, HEADERS_QR);
  setupOneSheet_(ss, CONFIG.SHEET_CHECK, HEADERS_CHECK);
}

function setupOneSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  const current = sh.getRange(1,1,1,Math.max(sh.getLastColumn(), headers.length)).getDisplayValues()[0];
  headers.forEach(h => {
    if (!current.includes(h)) sh.getRange(1, sh.getLastColumn() + 1).setValue(h);
  });
  sh.getRange(1,1,1,sh.getLastColumn()).setFontWeight('bold').setBackground('#eaf2ff');
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, Math.min(sh.getLastColumn(), 12));
}

function doGet(e) {
  const p = e.parameter || {};
  if (p.page === 'form') return renderForm_(p.site || '');
  if (p.action === 'list') return jsonp_(listOpinions_(p), p.callback);
  if (p.action === 'dashboard') return jsonp_(dashboard_(p), p.callback);
  if (p.action === 'sites') return jsonp_(sites_(p), p.callback);
  if (p.action === 'saveSite') return jsonp_(saveSite_(p), p.callback);
  if (p.action === 'update') return jsonp_(updateOpinion_(p), p.callback);
  return HtmlService.createHtmlOutput('<h2>동진 종사자 의견청취 API v1.2</h2><p>?page=form&site=현장명 으로 접속하세요.</p>');
}

function doPost(e) {
  try {
    const p = e.parameter || {};
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sh = ss.getSheetByName(CONFIG.SHEET_OPINIONS);
    const no = 'OP-' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random()*900+100);
    const rowObj = {
      '접수번호': no,
      '접수일시': Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'),
      '현장명': p.site || '',
      '소속업체': p.company || '',
      '직종': p.job || '',
      '위험장소': p.place || '',
      '위험유형': p.riskType || '',
      '의견내용': p.opinion || '',
      '긴급도': p.urgency || '',
      '사진URL': p.photoUrl || '',
      '작성자': p.writer || '익명',
      '연락처': p.phone || '',
      '상태': '접수',
      '검토자': '',
      '검토일': '',
      '조치내용': '',
      '담당자': '',
      '조치예정일': '',
      '완료일': '',
      '비고': ''
    };
    appendObject_(sh, rowObj);
    return HtmlService.createHtmlOutput(successHtml_()).setTitle('의견 제출 완료');
  } catch (err) {
    return HtmlService.createHtmlOutput('<h2>저장 오류</h2><p>' + escapeHtml_(err.message) + '</p>');
  }
}

function renderForm_(site) {
  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>종사자 의견청취</title><style>
  body{font-family:system-ui,'Noto Sans KR',sans-serif;background:#f1f5f9;margin:0;color:#0f172a}.wrap{max-width:640px;margin:0 auto;padding:16px 14px 40px}.head{background:linear-gradient(135deg,#0f172a,#2563eb);color:#fff;padding:22px 16px;text-align:center}.head h1{font-size:22px;margin:0}.head p{font-size:13px;opacity:.9;line-height:1.55}.card{background:#fff;border-radius:18px;padding:18px;margin-top:14px;box-shadow:0 8px 24px rgba(15,23,42,.12)}label{display:block;font-weight:800;font-size:13px;margin:12px 0 6px}input,select,textarea{width:100%;box-sizing:border-box;padding:13px;border:1px solid #cbd5e1;border-radius:12px;font-size:15px}textarea{min-height:120px}button{width:100%;border:0;border-radius:14px;padding:15px;margin-top:16px;background:#2563eb;color:#fff;font-weight:900;font-size:16px}.note{font-size:12.5px;color:#64748b;line-height:1.55;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px}</style></head><body>
  <div class="head"><h1>종사자 안전보건 의견청취</h1><p>${escapeHtml_(site)}<br>익명 제출 가능 · 사진 링크 입력 가능</p></div>
  <div class="wrap"><form class="card" method="post" action="${ScriptApp.getService().getUrl()}">
    <input type="hidden" name="site" value="${escapeHtml_(site)}">
    <div class="note">현장에서 위험하다고 느낀 사항, 개선이 필요한 안전시설, 작업방법, 장비운행, 보호구, 통로, 추락·낙하·붕괴·끼임 위험 등을 자유롭게 제출해 주세요. 긴급위험은 즉시 현장 관리자에게 함께 알려주세요.</div>
    <label>소속 업체</label><input name="company" placeholder="예: 철근팀 / 동진토건 / 협력업체명">
    <label>직종</label><input name="job" placeholder="예: 형틀, 철근, 토공, 장비, 신호수">
    <label>위험 장소</label><input name="place" required placeholder="예: B1 계단실, 3공구 흙막이 구간">
    <label>위험 유형</label><select name="riskType" required><option value="">선택</option><option>추락</option><option>낙하</option><option>끼임</option><option>붕괴</option><option>장비</option><option>전기</option><option>화재</option><option>질식</option><option>통로</option><option>보호구</option><option>기타</option></select>
    <label>위험요인 또는 개선의견</label><textarea name="opinion" required placeholder="위험한 상황이나 개선이 필요한 내용을 적어주세요."></textarea>
    <label>긴급도</label><select name="urgency" required><option>일반 개선</option><option>빠른 조치 필요</option><option>즉시조치 필요</option></select>
    <label>사진 URL 선택 입력</label><input name="photoUrl" placeholder="사진은 카톡/드라이브 등에 올린 뒤 링크 입력 가능">
    <label>작성자</label><input name="writer" placeholder="익명 가능">
    <label>연락처 선택 입력</label><input name="phone" placeholder="회신 필요 시 입력">
    <button type="submit">의견 제출하기</button>
  </form></div></body></html>`;
  return HtmlService.createHtmlOutput(html).setTitle('종사자 의견청취').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function successHtml_() {
  return `<!DOCTYPE html><html lang="ko"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,'Noto Sans KR',sans-serif;background:#f8fafc;text-align:center;padding:50px 16px;color:#0f172a}.card{max-width:520px;margin:auto;background:white;border-radius:20px;padding:28px;box-shadow:0 8px 24px rgba(15,23,42,.12)}h1{color:#059669}</style></head><body><div class="card"><h1>제출 완료</h1><p>안전보건 의견이 접수되었습니다.</p><p>재해예방에 필요한 사항은 검토 후 개선조치하겠습니다.</p></div></body></html>`;
}

function listOpinions_(p) {
  if (p.pin !== CONFIG.ADMIN_PIN) return {ok:false, message:'관리자 PIN이 맞지 않습니다.'};
  const site = (p.site || '').trim();
  const rowsAll = getRows_(CONFIG.SHEET_OPINIONS).reverse();
  const rows = site ? rowsAll.filter(r => r.현장명 === site) : rowsAll;
  return {ok:true, rows, summary: makeSummary_(rows)};
}

function dashboard_(p) {
  if (p.pin !== CONFIG.ADMIN_PIN) return {ok:false, message:'관리자 PIN이 맞지 않습니다.'};
  const rows = getRows_(CONFIG.SHEET_OPINIONS);
  const sites = sitesFromData_();
  const bySite = {};
  sites.forEach(s => bySite[s.현장명] = {site:s.현장명, manager:s.관리자||'', total:0, urgent:0, done:0, inProgress:0, notDone:0, recent:''});
  rows.forEach(r => {
    const name = r.현장명 || '미지정';
    if (!bySite[name]) bySite[name] = {site:name, manager:'', total:0, urgent:0, done:0, inProgress:0, notDone:0, recent:''};
    const b = bySite[name];
    b.total++;
    if (r.긴급도 === '즉시조치 필요') b.urgent++;
    if (r.상태 === '조치완료') b.done++;
    if (['접수','검토중','조치필요','조치중'].includes(r.상태)) b.inProgress++;
    b.notDone = b.total - b.done;
    if (!b.recent || String(r.접수일시) > String(b.recent)) b.recent = r.접수일시;
  });
  const siteRows = Object.values(bySite).sort((a,b)=>b.notDone-a.notDone || b.total-a.total || String(a.site).localeCompare(String(b.site),'ko'));
  return {ok:true, company: makeSummary_(rows), sites: siteRows, recent: rows.slice(-5).reverse()};
}

function sites_(p) {
  if (p.pin !== CONFIG.ADMIN_PIN) return {ok:false, message:'관리자 PIN이 맞지 않습니다.'};
  return {ok:true, sites: sitesFromData_()};
}

function saveSite_(p) {
  if (p.pin !== CONFIG.ADMIN_PIN) return {ok:false, message:'관리자 PIN이 맞지 않습니다.'};
  const site = (p.site || '').trim();
  if (!site) return {ok:false, message:'현장명이 없습니다.'};
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sh = ss.getSheetByName(CONFIG.SHEET_QR);
  const rows = sh.getDataRange().getDisplayValues();
  const headers = rows[0];
  const idxSite = headers.indexOf('현장명');
  const rowObj = {
    '현장명': site,
    '관리자': p.manager || '',
    '원청/공종': p.project || '',
    '게시위치': p.postPlace || '',
    'QR주소': p.qrUrl || '',
    '생성일': Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'),
    '사용여부': '사용',
    '비고': p.memo || ''
  };
  for (let i=1; i<rows.length; i++) {
    if (rows[i][idxSite] === site) {
      writeObject_(sh, i+1, rowObj);
      return {ok:true, message:'현장QR 정보를 수정했습니다.'};
    }
  }
  appendObject_(sh, rowObj);
  return {ok:true, message:'현장QR 정보를 등록했습니다.'};
}

function updateOpinion_(p) {
  if (p.pin !== CONFIG.ADMIN_PIN) return {ok:false, message:'관리자 PIN이 맞지 않습니다.'};
  const no = p.no;
  if (!no) return {ok:false, message:'접수번호가 없습니다.'};
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sh = ss.getSheetByName(CONFIG.SHEET_OPINIONS);
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  const idxNo = headers.indexOf('접수번호');
  for (let i=1;i<values.length;i++) {
    if (String(values[i][idxNo]) === String(no)) {
      const row = i + 1;
      setByHeader_(sh, headers, row, '상태', p.status || '검토중');
      setByHeader_(sh, headers, row, '검토자', p.reviewer || '관리자');
      setByHeader_(sh, headers, row, '검토일', Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'));
      if (p.memo) setByHeader_(sh, headers, row, '조치내용', p.memo);
      if (p.manager) setByHeader_(sh, headers, row, '담당자', p.manager);
      if (p.due) setByHeader_(sh, headers, row, '조치예정일', p.due);
      if (p.status === '조치완료') setByHeader_(sh, headers, row, '완료일', Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd'));
      return {ok:true};
    }
  }
  return {ok:false, message:'해당 접수번호를 찾지 못했습니다.'};
}

function getRows_(sheetName) {
  const sh = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(sheetName);
  const values = sh.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  const headers = values.shift();
  return values.filter(r => r.join('')).map(r => Object.fromEntries(headers.map((h,i)=>[h,r[i] || ''])));
}

function sitesFromData_() {
  const saved = getRows_(CONFIG.SHEET_QR).filter(r => r.현장명).map(r => ({현장명:r.현장명, 관리자:r.관리자, 원청공종:r['원청/공종'], 게시위치:r.게시위치, QR주소:r.QR주소, 사용여부:r.사용여부}));
  const names = new Set(saved.map(r => r.현장명));
  getRows_(CONFIG.SHEET_OPINIONS).forEach(r => { if (r.현장명 && !names.has(r.현장명)) { names.add(r.현장명); saved.push({현장명:r.현장명, 관리자:'', 원청공종:'', 게시위치:'', QR주소:'', 사용여부:'사용'}); } });
  return saved.sort((a,b)=>String(a.현장명).localeCompare(String(b.현장명),'ko'));
}

function makeSummary_(rows) {
  const total = rows.length;
  const urgent = rows.filter(r => r.긴급도 === '즉시조치 필요').length;
  const done = rows.filter(r => r.상태 === '조치완료').length;
  const inProgress = rows.filter(r => ['접수','검토중','조치필요','조치중'].includes(r.상태)).length;
  const edu = rows.filter(r => r.상태 === '교육반영').length;
  const none = rows.filter(r => r.상태 === '해당없음').length;
  const notDone = total - done;
  return {total, urgent, done, inProgress, edu, none, notDone};
}

function appendObject_(sh, obj) {
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
  sh.appendRow(headers.map(h => obj[h] || ''));
}
function writeObject_(sh, row, obj) {
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
  headers.forEach((h,i)=>{ if (Object.prototype.hasOwnProperty.call(obj,h)) sh.getRange(row,i+1).setValue(obj[h]); });
}
function setByHeader_(sh, headers, row, header, value) {
  const idx = headers.indexOf(header);
  if (idx >= 0) sh.getRange(row, idx + 1).setValue(value);
}
function jsonp_(obj, callback) {
  const text = callback ? `${callback}(${JSON.stringify(obj)});` : JSON.stringify(obj);
  return ContentService.createTextOutput(text).setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}
function escapeHtml_(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
