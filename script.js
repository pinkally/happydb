// ✅ 해피투나잇 템플릿 전용 script.js

// 1) 설정: 회차 계산용 기준, 외부 API URL
const BASE_EP     = 118;
const BASE_DATE   = new Date(2025, 4, 10); // 2025-05-10
const SCRIPT_DB_URL  = 'https://script.google.com/macros/s/YOUR_WEB_APP_ID/exec';
const PLAYLIST_URL   = 'https://script.google.com/macros/s/AKfycbzDz0Af1Kzio7X_Adqq4pkgkmlutLkCUN6Qo4tlTwGG-J3VvyxO-O0L0L_j4Oqh2gObxg/exec';
const ATTENDANCE_URL = 'https://script.google.com/macros/s/AKfycbxXWYEgCyeAz1c_JFQGVbn7AASCNU3gZQ5janozphQVD31AE3Wylip2DmWP89Fny0Lxyg/exec';

// ─────────────────────────────────────────────────────────────────────────────
// 2) 페이지 로드 시 오늘 날짜 자동 세팅 및 초기 호출
window.onload = () => {
  const now = new Date();
  const y = now.getFullYear().toString();
  const m = (now.getMonth()+1).toString().padStart(2,'0');
  const d = now.getDate().toString().padStart(2,'0');
  document.getElementById("broadcastDate").value = `${y}${m}${d}`;
  handleDateChange();
};

// ─────────────────────────────────────────────────────────────────────────────
// 3) 날짜 변경·불러오기 핸들러
async function handleDateChange() {
  const date = document.getElementById("broadcastDate").value.trim();
  if (date.length !== 8 || isNaN(Number(date))) {
    alert("날짜는 8자리 숫자로 입력해 주세요 (예: 20250423)");
    return;
  }

  // 회차 계산 & 기본 제목 세팅
  const epNumber   = calculateEPNumber(date);
  const epText     = `EP.${epNumber} ♬♪ ${date}`;
  const defaultTitle = `🎧 감성 라디오｜[방송주제 입력] 사연+신청곡｜해피투나잇 ${epText}`;
  document.getElementById("titleInput").value = defaultTitle;
  updateEPInfo(defaultTitle);

  // 서버에서 저장된 대본 불러오기
  try {
    const saved = await fetchSavedScript(date);
    if (saved) fillFields(saved);
  } catch (err) {
    console.error("❌ 대본 불러오기 실패:", err);
  }

  // 컨텐츠 섹션 표시
  document.getElementById("contentSections").classList.remove("hidden");

  // 자동 신청곡 & 출석체크
  fetchPlaylistAuto();
  loadAttendanceList();
}

// ─────────────────────────────────────────────────────────────────────────────
// 4) 서버에서 저장된 대본({title,topic,opening,main,story,closing,manualPlaylist}) 가져오기
async function fetchSavedScript(date) {
  const url = `${SCRIPT_DB_URL}?type=getScript&date=${date}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 5) 불러온 대본을 각 필드에 채우기
function fillFields(data) {
  // 매핑: 데이터 키 → 요소 ID or selector
  const map = {
    title:         "#titleInput",
    topic:         "#topic textarea",
    opening:       "#opening textarea",
    main:          "#main textarea",
    story:         "#story textarea",
    closing:       "#closing textarea",
    manualPlaylist:"#playlistMemo"
  };
  for (const key in map) {
    const sel = map[key];
    const el  = document.querySelector(sel);
    if (el) el.value = data[key] || "";
  }
  // 높이 자동 조절
  document.querySelectorAll("textarea").forEach(autoResize);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6) 회차 계산 함수 (수요일·토요일 기준)
function calculateEPNumber(dateStr) {
  const y = +dateStr.slice(0,4), m = +dateStr.slice(4,6)-1, d = +dateStr.slice(6);
  const target = new Date(y,m,d);
  const diff = Math.floor((target - BASE_DATE)/(1000*60*60*24));
  let count = 0;
  for (let i=0; i<=diff; i++) {
    const dt = new Date(BASE_DATE.getTime() + i*86400000);
    if (dt.getDay()===3 || dt.getDay()===6) count++;
  }
  return BASE_EP + count - 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7) EP 정보(제목) 업데이트
function updateEPInfo(txt) {
  const m = txt.match(/EP\.\d+\s[♬♪]+\s\d{8}/);
  document.getElementById("epDisplay").textContent = m ? ` - ${m[0]}` : "";
}

// ─────────────────────────────────────────────────────────────────────────────
// 8) 텍스트영역 자동 높이 조절
function autoResize(ta) {
  ta.style.height = 'auto';
  const maxLines = 33, lineH = 24;
  const lines = ta.value.split('\n').length;
  if (lines <= maxLines) {
    ta.style.overflowY = 'hidden';
    ta.style.height = ta.scrollHeight + 'px';
  } else {
    ta.style.overflowY = 'auto';
    ta.style.height = `${lineH*maxLines + 12}px`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9) 자동 신청곡 불러오기 (기존 로직 유지)
async function fetchPlaylistAuto() {
  const date = document.getElementById("broadcastDate").value.trim();
  const ul = document.getElementById("playlistResult");
  ul.innerHTML = "<li>신청곡 불러오는 중...</li>";
  if (!date) return console.warn("⛔ 방송 날짜 미입력");

  try {
    const res = await fetch(`${PLAYLIST_URL}?type=requestlist&D=${date}`);
    const data = await res.json();
    ul.innerHTML = "";
    if (!data || data.length === 0) {
      ul.innerHTML = "<li>아이쿠 신청곡 미달 사태 😢</li>";
    } else {
      data.forEach(song => {
        const li = document.createElement("li");
        li.textContent = song;
        ul.appendChild(li);
      });
    }
  } catch (e) {
    console.error("🎵 신청곡 불러오기 실패:", e);
    ul.innerHTML = "<li>신청곡 불러오기 중 오류 발생 😢</li>";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10) 출석체크 불러오기 (기존 로직 유지)
function loadAttendanceList() {
  const date = document.getElementById("broadcastDate").value.trim();
  const ul = document.getElementById("attendanceList");
  ul.innerHTML = "<li>출석자 불러오는 중...</li>";
  if (!date) return;
