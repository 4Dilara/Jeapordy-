const CAT_COUNT = 6;
const CLUES_PER_CAT = 5;
let categories = [];

// Sound effects
const soundQuestion = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_7757cb9b3e.mp3");
const soundAnswer = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_a334920dd0.mp3");
const soundRestart = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_1b9deef0d1.mp3");

// Preload audio
soundQuestion.preload = "auto";
soundAnswer.preload = "auto";
soundRestart.preload = "auto";

// Play sound safely, avoid overlapping and catch errors
function playSound(sound) {
  try {
    sound.pause();
    sound.currentTime = 0;
    sound.play().catch(() => {
      // Autoplay might be blocked before user interaction
    });
  } catch {
    // Ignore other errors
  }
}

async function getCategoryIds() {
  const res = await axios.get("https://rithm-jeopardy.herokuapp.com/api/categories?count=100");
  const ids = res.data.map(c => c.id);
  return _.sampleSize(ids, CAT_COUNT);
}

async function getCategory(catId) {
  const res = await axios.get(`https://rithm-jeopardy.herokuapp.com/api/category?id=${catId}`);
  const clues = res.data.clues
    .filter(c => c.question && c.answer)
    .slice(0, CLUES_PER_CAT)
    .map(c => ({
      question: c.question,
      answer: c.answer,
      showing: null
    }));
  return {
    title: res.data.title,
    clues: clues
  };
}

async function setupAndStart() {
  // Show loading, hide table and instructions
  document.getElementById('loading').style.display = 'block';
  document.getElementById('jeopardy').style.display = 'none';
  document.getElementById('instructions').style.display = 'none';

  const catIds = await getCategoryIds();
  categories = [];

  for (let id of catIds) {
    const cat = await getCategory(id);
    if (cat.clues.length === CLUES_PER_CAT) {
      categories.push(cat);
    }
  }

  renderTable();

  // Hide loading, show table and instructions
  document.getElementById('loading').style.display = 'none';
  document.getElementById('jeopardy').style.display = 'table';
  document.getElementById('instructions').style.display = 'block';
}

function renderTable() {
  const thead = document.querySelector("#jeopardy thead");
  const tbody = document.querySelector("#jeopardy tbody");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  // Header row
  const headerRow = document.createElement("tr");
  for (let cat of categories) {
    const th = document.createElement("th");
    th.innerText = cat.title.toUpperCase();
    th.tabIndex = 0;  // Make focusable by keyboard
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);

  // Clue cells
  for (let row = 0; row < CLUES_PER_CAT; row++) {
    const tr = document.createElement("tr");
    for (let col = 0; col < CAT_COUNT; col++) {
      const td = document.createElement("td");
      td.innerText = "?";
      td.dataset.row = row;
      td.dataset.col = col;
      td.tabIndex = 0;  // Make focusable by keyboard
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

function handleClick(evt) {
  const cell = evt.target;
  if (cell.tagName !== "TD") return;

  const row = +cell.dataset.row;
  const col = +cell.dataset.col;
  const clue = categories[col].clues[row];

  if (clue.showing === null) {
    cell.innerText = clue.question;
    clue.showing = "question";
    playSound(soundQuestion);
  } else if (clue.showing === "question") {
    cell.innerText = clue.answer;
    clue.showing = "answer";
    playSound(soundAnswer);
  }
}

// Event listeners
document.querySelector("#jeopardy").addEventListener("click", handleClick);
document.querySelector("#restart").addEventListener("click", () => {
  playSound(soundRestart);
  setupAndStart();
});

// Initial load
setupAndStart();
