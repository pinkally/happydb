// script.js

// 1) 설정
const BASE_EP        = 118;
const BASE_DATE      = new Date(2025,4,10);
const SCRIPT_DB_URL  = 'https://script.google.com/macros/s/AKfycbxOQAgAYvylb03m8_jkt5tsbPU_JBbkHOvG_GNmBxyo5bM3gNmNMTHza8MkfvRNfZ4fDw/exec';
const PLAYLIST_URL   = 'https://script.google.com/macros/s/AKfycbzDz0Af1Kzio7X_Adqq4pkgkmlutLkCUN6Qo4tlTwGG-J3VvyxO-O0L0L_j4Oqh2gObxg/exec';
const ATTENDANCE_URL = 'https://script.google.com/macros/s/AKfycbxXWYEgCyeAz1c_JFQGVbn7AASCNU3gZQ5janozphQVD31AE3Wylip2DmWP89Fny0Lxyg/exec';

// 2) 로드 시 오늘 날짜 세팅 & 불러오기
window.onload = () => {
  const now = new Date();
  // (생략) 날짜 세팅, handleDateChange 호출 등…
  document.getElementById("broadcastDate").value = /*…*/;
  handleDateChange();

  // ───────────────────────────────────────────────────────────────────────────
  // ▶ 여기서부터 auto-save draft용 이벤트 리스너 등록
  document.querySelectorAll("textarea").forEach(ta => {
    let timer;
    ta.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(saveDraft, 1000);
    });
  });
  // ───────────────────────────────────────────────────────────────────────────

}; // ← window.onload 끝

// 3) 날짜 변경 핸들러
async function handleDateChange() {
  const date = document.getElementById("broadcastDate").value.trim();
  if (date.length !== 8 || isNaN(+date)) {
    alert("날짜를 8자리 숫자로 입력해 주세요 (예: 20250423)");
    return;
  }

  // EP 계산 & 제목 세팅
  const epNum = calculateEPNumber(date);
  const epText = `EP.${epNum} ♬♪ ${date}`;
  const defaultTitle =
    `🎧 감성 라디오｜[방송주제 입력] 사연+신청곡｜해피투나잇 ${epText}`;
  document.getElementById("titleInput").value = defaultTitle;
  updateEPInfo(defaultTitle);

  // 서버에서 저장된 대본 로드
  try {
    const saved = await fetchSavedScript(date);
    if (saved) fillFields(saved);
  } catch (e) {
    console.error("대본 불러오기 실패:", e);
  }

  // 섹션 보이기
  document.getElementById("contentSections").classList.remove("hidden");

  // 신청곡·출석 체크 로드
  fetchPlaylistAuto();
  loadAttendanceList();
}

// 4) 서버에서 대본 가져오기
async function fetchSavedScript(date) {
  const res = await fetch(`${SCRIPT_DB_URL}?type=getScript&date=${date}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// 5) 폼에 채워 넣기
function fillFields(data) {
  const map = {
    title:         "#titleInput",
    topic:         "#topic textarea",
    opening:       "#opening textarea",
    main:          "#main textarea",
    story:         "#story textarea",
    closing:       "#closing textarea",
    manualPlaylist:"#playlistMemo"
  };
  Object.entries(map).forEach(([key, sel]) => {
    const el = document.querySelector(sel);
    if (el) el.value = data[key]||"";
  });
  document.querySelectorAll("textarea").forEach(autoResize);
}

function fillFields(data) {
// 1) 제목은 서버에 값이 있을 때만 덮어쓰기
if (data.title && data.title.trim()) {
    const ti = document.getElementById("titleInput");
    ti.value = data.title;
    updateEPInfo(data.title);
  }

  // 2) 나머지 항목은 기존과 동일하게 처리
  const fields = {
    topic:         "#topic textarea",
    opening:       "#opening textarea",
    main:          "#main textarea",
    story:         "#story textarea",
    closing:       "#closing textarea",
    manualPlaylist:"#playlistMemo"
  };
  Object.entries(fields).forEach(([key, sel]) => {
    const el = document.querySelector(sel);
    if (el) el.value = data[key] || "";
  });
  document.querySelectorAll("textarea").forEach(autoResize);
}

// 6) EP 계산 (수·토 기준)
function calculateEPNumber(dateStr) {
  const y = +dateStr.slice(0,4),
        M = +dateStr.slice(4,6)-1,
        d = +dateStr.slice(6);
  const target = new Date(y,M,d);
  const diff = Math.floor((target - BASE_DATE)/(1000*60*60*24));
  let cnt=0;
  for (let i=0; i<=diff; i++) {
    const day = new Date(BASE_DATE.getTime() + i*86400000).getDay();
    if (day===3||day===6) cnt++;
  }
  return BASE_EP + cnt - 1;
}

// 7) EP 정보 업데이트
function updateEPInfo(txt) {
  const m = txt.match(/EP\.\d+\s[♬♪]+\s\d{8}/);
  document.getElementById("epDisplay").textContent = m?` - ${m[0]}`:"";
}

// 8) 자동 높이 조절
function autoResize(ta) {
  ta.style.height='auto';
  if (ta.value.split('\n').length <= 33) {
    ta.style.overflowY='hidden';
    ta.style.height = ta.scrollHeight+'px';
  } else {
    ta.style.overflowY='auto';
    ta.style.height = `${24*33+12}px`;
  }
}

// 9) 신청곡 불러오기
async function fetchPlaylistAuto() {
  const date = document.getElementById("broadcastDate").value.trim();
  const ul = document.getElementById("playlistResult");
  ul.innerHTML = "<li>신청곡 불러오는 중...</li>";
  if (!date) return;

  try {
    const res = await fetch(`${PLAYLIST_URL}?type=requestlist&D=${date}`);
    const list = await res.json();
    ul.innerHTML = "";
    if (!list || list.length===0) {
      ul.innerHTML = "<li>신청곡이 없어요 😢</li>";
    } else {
      list.forEach(song => {
        const li = document.createElement("li");
        li.textContent = song;
        ul.appendChild(li);
      });
    }
  } catch (e) {
    console.error("신청곡 로드 실패:", e);
    ul.innerHTML = "<li>불러오기 오류 😢</li>";
  }
}

// 10) 출석체크 불러오기
function loadAttendanceList() {
  const date = document.getElementById("broadcastDate").value.trim();
  const ul = document.getElementById("attendanceList");
  ul.innerHTML = "<li>출석 불러오는 중...</li>";
  if (!date) return;

  fetch(`${ATTENDANCE_URL}?L=${date}&type=list`)
    .then(r=>r.json())
    .then(arr=>{
      ul.innerHTML = "";
      if (!arr||arr.length===0) {
        ul.innerHTML = "<li>아직 아무도 없네요 😭</li>";
      } else {
        arr.forEach(u=>{
          const li = document.createElement("li");
          li.textContent = u;
          ul.appendChild(li);
        });
      }
    })
    .catch(e=>{
      console.error("출석 로드 실패:", e);
      ul.innerHTML = "<li>불러오기 오류 😢</li>";
    });
}

// 11) 저장하기
// 1) 임시 저장: 스프레드 시트에만 저장
async function saveDraft() {
  const payload = collectParams();
  payload.mode = 'draft';
  await postPayload(payload);
  alert("임시 저장 완료되었습니다.");
}

// 2) 최종 저장: 스프레드 + Docs
async function saveFinal() {
  const payload = collectParams();
  payload.mode = 'final';
  await postPayload(payload);
  alert("방송 기록이 Docs에 저장되었습니다.");
}

// 파라미터 수집 함수
function collectParams() {
  const date  = document.getElementById('broadcastDate').value.trim();
  const title = document.getElementById('titleInput').value.trim();
  const topic = document.querySelector('#topic textarea').value.trim();
  const opening = document.querySelector('#opening textarea').value.trim();
  const main    = document.querySelector('#main textarea').value.trim();
  const story   = document.querySelector('#story textarea').value.trim();
  const closing = document.querySelector('#closing textarea').value.trim();
  const manual  = document.getElementById('playlistMemo').value.trim();
  const auto    = Array.from(document.querySelectorAll('#playlistResult li'))
                       .map(li => li.textContent.trim());
  const attend = Array.from(document.querySelectorAll('#attendanceList li'))
                       .map(li => li.textContent.trim());

  return {
    date, title, topic, opening, main, story,
    closing, manualPlaylist: manual,
    autoPlaylist: auto,
    attendanceList: attend
  };
}

// 공통 POST 함수
async function postPayload(payload) {
  const res = await fetch(SCRIPT_DB_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

// 아코디언(섹션 열고 닫기) 기능 ------------------------------------------------
// 단일 섹션 토글
function toggleSection(id) {
  const section = document.getElementById(id);
  if (section) {
    section.classList.toggle("open");
  }
}

// 전체 섹션 열기/닫기
function toggleAll() {
  const sections = document.querySelectorAll(".section-content");
  // 하나라도 열려 있지 않다면 모두 열고, 모두 열려 있으면 닫기
  const shouldOpen = ![...sections].every(sec => sec.classList.contains("open"));
  sections.forEach(sec => sec.classList.toggle("open", shouldOpen));
}

// ▶ 방송주제 입력값으로 제목 업데이트
function updateBroadcastTitle() {
  const topic = document.querySelector("#topic textarea").value.trim() || "[방송주제 입력]";
  const date  = document.getElementById("broadcastDate").value.trim();
  const epNum = calculateEPNumber(date);
  const epText = `EP.${epNum} ♬♪ ${date}`;

  const newTitle = `🎧 감성 라디오｜${topic} 사연+신청곡｜해피투나잇 ${epText}`;
  const ti = document.getElementById("titleInput");
  ti.value = newTitle;
  updateEPInfo(newTitle);
}
