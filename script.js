// ✅ 해피투나잇 템플릿 전용 script.js

const BASE_EP = 118;
const BASE_DATE = new Date(2025, 4, 10); // 2025-05-10

function handleDateChange() {
  const dateStr = document.getElementById("broadcastDate").value.trim();
  if (dateStr.length !== 8 || isNaN(Number(dateStr))) {
    alert("날짜는 8자리 숫자로 입력해 주세요 (예: 20250423)");
    return;
  }

  const epNumber = calculateEPNumber(dateStr);
  const epText = `EP.${epNumber} ♬♪ ${dateStr}`;
  const defaultTitle = `🎧 감성 라디오｜[방송주제 입력] 사연+신청곡｜해피투나이 ${epText}`;
  const titleInput = document.getElementById("titleInput");

  titleInput.value = defaultTitle;
  updateEPInfo(defaultTitle);

  document.getElementById("contentSections")?.classList.remove("hidden");
  clearFields();

  loadFromGoogleSheet();
  fetchPlaylistAuto();
  loadAttendanceList();
}

function calculateEPNumber(dateStr) {
  const target = new Date(
    Number(dateStr.substring(0, 4)),
    Number(dateStr.substring(4, 6)) - 1,
    Number(dateStr.substring(6, 8))
  );
  const diffDays = Math.floor((target - BASE_DATE) / (1000 * 60 * 60 * 24));
  let count = 0;
  for (let i = 0; i <= diffDays; i++) {
    const d = new Date(BASE_DATE.getTime() + i * 86400000);
    if (d.getDay() === 3 || d.getDay() === 6) count++;
  }
  return BASE_EP + count - 1;
}

function clearFields() {
  const ids = ['topic', 'opening', 'main', 'story', 'closing'];
  ids.forEach(id => {
    const textarea = document.querySelector(`#${id} textarea`);
    if (textarea) textarea.value = '';
  });
  document.getElementById("playlistMemo").value = "";
  document.getElementById("playlistResult").innerHTML = "<li>아이쿠 신청곡 미달 사태 😭</li>";
  document.getElementById("attendanceList").innerHTML = "<li>아직은 출근 전이라 😭</li>";
}

function updateEPInfo(titleText) {
  const match = titleText.match(/EP\.\d{1,4}\s[\u266c\u266a]+\s\d{8}/);
  const display = document.getElementById("epDisplay");
  display.textContent = match ? ` - ${match[0]}` : '';
}

function autoResize(textarea) {
  textarea.style.height = 'auto';
  const lineCount = textarea.value.split('\n').length;
  if (lineCount <= 33) {
    textarea.style.overflowY = 'hidden';
    textarea.style.height = textarea.scrollHeight + 'px';
  } else {
    textarea.style.overflowY = 'auto';
    const lineHeight = 24;
    const maxHeight = lineHeight * 33 + 12;
    textarea.style.height = `${maxHeight}px`;
  }
}

function toggleSection(id) {
  const section = document.getElementById(id);
  section.classList.toggle("open");
}

function toggleAll() {
  const sections = document.querySelectorAll(".section-content");
  const shouldOpen = ![...sections].every(sec => sec.classList.contains("open"));
  sections.forEach(sec => sec.classList.toggle("open", shouldOpen));
}

function renderList(selector, items) {
  const ul = document.querySelector(selector);
  ul.innerHTML = '';
  if (!items || items.length === 0) {
    ul.innerHTML = '<li>데이터 없음 😭</li>';
    return;
  }
  items.forEach(txt => {
    const li = document.createElement('li');
    li.textContent = txt;
    ul.appendChild(li);
  });
} // 이후 시트 저장 및 불러오기 함수는 별도 제공
