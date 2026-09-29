const $ = (s) => document.querySelector(s);

const DEFAULT_QUESTIONS = [
  {id:1, category_id:1, category_name:"General Knowledge", difficulty:"Easy", question:"Which planet is known as the Red Planet?", option_a:"Earth", option_b:"Mars", option_c:"Jupiter", option_d:"Venus", correct_option:"B", explanation:"Mars is commonly called the Red Planet because of its reddish appearance."},
  {id:2, category_id:2, category_name:"Science", difficulty:"Easy", question:"What is the chemical formula for water?", option_a:"CO2", option_b:"O2", option_c:"H2O", option_d:"NaCl", correct_option:"C", explanation:"A water molecule contains two hydrogen atoms and one oxygen atom."},
  {id:3, category_id:3, category_name:"Technology", difficulty:"Easy", question:"What does CPU stand for?", option_a:"Central Processing Unit", option_b:"Computer Personal Unit", option_c:"Core Processing Utility", option_d:"Central Program Utility", correct_option:"A", explanation:"CPU stands for Central Processing Unit."},
  {id:4, category_id:4, category_name:"Programming", difficulty:"Medium", question:"Which JavaScript keyword declares a block-scoped constant?", option_a:"var", option_b:"let", option_c:"const", option_d:"static", correct_option:"C", explanation:"const declares a block-scoped binding that cannot be reassigned."},
  {id:5, category_id:4, category_name:"Programming", difficulty:"Medium", question:"Which HTTP method is commonly used for a partial update?", option_a:"GET", option_b:"POST", option_c:"PATCH", option_d:"HEAD", correct_option:"C", explanation:"PATCH is designed for partial modifications to a resource."},
  {id:6, category_id:1, category_name:"General Knowledge", difficulty:"Easy", question:"How many continents are commonly recognized?", option_a:"5", option_b:"6", option_c:"7", option_d:"8", correct_option:"C", explanation:"The commonly taught model recognizes seven continents."},
  {id:7, category_id:2, category_name:"Science", difficulty:"Medium", question:"Which gas do plants primarily absorb during photosynthesis?", option_a:"Oxygen", option_b:"Carbon dioxide", option_c:"Nitrogen", option_d:"Hydrogen", correct_option:"B", explanation:"Plants absorb carbon dioxide and use it to make glucose during photosynthesis."},
  {id:8, category_id:3, category_name:"Technology", difficulty:"Easy", question:"Which device is mainly used to point and click on a computer?", option_a:"Mouse", option_b:"Monitor", option_c:"Printer", option_d:"Router", correct_option:"A", explanation:"A mouse is a pointing input device."},
  {id:9, category_id:4, category_name:"Programming", difficulty:"Easy", question:"Which symbol is used for a single-line comment in JavaScript?", option_a:"<!-- -->", option_b:"//", option_c:"##", option_d:"**", correct_option:"B", explanation:"JavaScript uses // for single-line comments."},
  {id:10, category_id:1, category_name:"General Knowledge", difficulty:"Medium", question:"Which ocean is the largest?", option_a:"Atlantic Ocean", option_b:"Indian Ocean", option_c:"Arctic Ocean", option_d:"Pacific Ocean", correct_option:"D", explanation:"The Pacific Ocean is the largest ocean on Earth."}
];

const CATEGORIES = [
  {id:1, name:"General Knowledge"},
  {id:2, name:"Science"},
  {id:3, name:"Technology"},
  {id:4, name:"Programming"}
];

let questions = [];
let current = 0;
let answers = {};
let score = 0;
let timerId;
let timeLeft = 15;
let adminLoggedIn = false;

document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  bindEvents();
  loadData();
  renderHistory();
  if (location.hash === "#admin") openAdmin();
});

function loadData() {
  const saved = localStorage.getItem("quizQuestions");
  try {
    questions = saved ? JSON.parse(saved) : structuredClone(DEFAULT_QUESTIONS);
  } catch {
    questions = structuredClone(DEFAULT_QUESTIONS);
  }
  if (!saved) saveQuestions();
  populateCategories();
}

function saveQuestions() {
  localStorage.setItem("quizQuestions", JSON.stringify(questions));
}

function populateCategories() {
  const names = [...CATEGORIES];
  const dynamic = questions.map(q => ({id:q.category_id, name:q.category_name}));
  const map = new Map([...names, ...dynamic].map(c => [String(c.id), c]));
  const list = [...map.values()];
  const html = list.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join("");
  $("#categorySelect").insertAdjacentHTML("beforeend", html);
  $("#adminCategory").innerHTML = html;
}

function bindEvents() {
  $("#themeBtn").onclick = toggleTheme;
  $("#startBtn").onclick = startQuiz;
  $("#nextBtn").onclick = nextQuestion;
  $("#prevBtn").onclick = () => { if (current > 0) { current--; renderQuestion(); } };
  $("#quitBtn").onclick = () => { clearInterval(timerId); showScreen("homeScreen"); };
  $("#restartBtn").onclick = startQuiz;
  $("#homeBtn").onclick = () => showScreen("homeScreen");
  $("#clearHistory").onclick = () => { localStorage.removeItem("quizHistory"); renderHistory(); };
  $("#questionForm").onsubmit = saveQuestion;
  $("#resetForm").onclick = resetForm;
  $("#exportBtn").onclick = exportQuestions;
  $("#importFile").onchange = importQuestions;
  $("#loginForm").onsubmit = loginAdmin;
  $("#closeLogin").onclick = () => { $("#loginModal").classList.add("hidden"); location.hash = ""; };
  $("#logoutBtn").onclick = logoutAdmin;
  window.addEventListener("hashchange", () => {
    if (location.hash === "#admin") openAdmin();
    else showScreen("homeScreen");
  });
  $(".admin-link").onclick = (e) => { e.preventDefault(); location.hash = "#admin"; };
}

function startQuiz() {
  try {
    const cat = $("#categorySelect").value;
    const diff = $("#difficultySelect").value;
    const count = Number($("#questionCount").value);
    let pool = questions.filter(q => (!cat || String(q.category_id) === String(cat)) && (!diff || q.difficulty === diff));
    pool = shuffle(pool);
    questionsForQuiz = pool.slice(0, Math.min(count, pool.length));
    if (!questionsForQuiz.length) return alert("No questions match your filters.");
    questions = getStoredQuestions();
    current = 0; answers = {}; score = 0;
    showScreen("quizScreen");
    renderQuestion();
  } catch (e) {
    alert(e.message || "Could not start quiz.");
  }
}

let questionsForQuiz = [];

function getStoredQuestions() {
  try { return JSON.parse(localStorage.getItem("quizQuestions")) || structuredClone(DEFAULT_QUESTIONS); }
  catch { return structuredClone(DEFAULT_QUESTIONS); }
}

function renderQuestion() {
  clearInterval(timerId);
  const q = questionsForQuiz[current], chosen = answers[q.id];
  $("#questionNumber").textContent = `Question ${current + 1} of ${questionsForQuiz.length}`;
  $("#progressBar").style.width = `${((current + 1) / questionsForQuiz.length) * 100}%`;
  $("#categoryLabel").textContent = q.category_name;
  $("#difficultyBadge").textContent = q.difficulty;
  $("#questionText").textContent = q.question;
  $("#scoreValue").textContent = score;
  $("#prevBtn").disabled = current === 0;
  $("#nextBtn").textContent = current === questionsForQuiz.length - 1 ? "Finish →" : "Next →";
  const opts = [["A", q.option_a], ["B", q.option_b], ["C", q.option_c], ["D", q.option_d]];
  $("#options").innerHTML = opts.map(([letter, text]) => `
    <button class="option ${chosen === letter ? "selected" : ""}" data-option="${letter}">
      <b>${letter}.</b> ${escapeHtml(text)}
    </button>`).join("");
  document.querySelectorAll(".option").forEach(b => b.onclick = () => selectAnswer(b.dataset.option));
  startTimer();
}

function selectAnswer(letter) {
  const q = questionsForQuiz[current];
  answers[q.id] = letter;
  document.querySelectorAll(".option").forEach(b => b.classList.toggle("selected", b.dataset.option === letter));
}

function startTimer() {
  timeLeft = 15;
  $("#timerValue").textContent = timeLeft;
  timerId = setInterval(() => {
    timeLeft--;
    $("#timerValue").textContent = timeLeft;
    if (timeLeft <= 0) { clearInterval(timerId); nextQuestion(); }
  }, 1000);
}

function nextQuestion() {
  clearInterval(timerId);
  if (current < questionsForQuiz.length - 1) { current++; renderQuestion(); }
  else finishQuiz();
}

function finishQuiz() {
  score = questionsForQuiz.reduce((sum, q) => sum + (answers[q.id] === q.correct_option ? 1 : 0), 0);
  const pct = Math.round(score / questionsForQuiz.length * 100);
  $("#finalScore").textContent = pct + "%";
  $("#correctCount").textContent = score;
  $("#incorrectCount").textContent = questionsForQuiz.length - score;
  $("#totalCount").textContent = questionsForQuiz.length;
  $("#resultMessage").textContent = pct >= 80 ? "Excellent performance — you have a strong command of this topic." : pct >= 50 ? "Good attempt. Review the missed questions and try again." : "Keep practicing. Every attempt is progress.";
  $("#analysis").innerHTML = `<strong>Performance analysis</strong><br>You answered ${score} of ${questionsForQuiz.length} questions correctly (${pct}%). ${pct >= 70 ? "Your accuracy is solid." : "Focus on reviewing explanations and retrying the quiz."}`;
  saveHistory(pct);
  showScreen("resultScreen");
}

function saveHistory(pct) {
  const h = JSON.parse(localStorage.getItem("quizHistory") || "[]");
  h.unshift({score, pct, total: questionsForQuiz.length, date: new Date().toLocaleString()});
  localStorage.setItem("quizHistory", JSON.stringify(h.slice(0, 8)));
  renderHistory();
}

function renderHistory() {
  const h = JSON.parse(localStorage.getItem("quizHistory") || "[]");
  $("#historyList").innerHTML = h.length
    ? h.map(x => `<div class="history-item"><span><b>${x.pct}%</b> · ${x.score}/${x.total}</span><small>${escapeHtml(x.date)}</small></div>`).join("")
    : `<p style="color:var(--muted)">No attempts yet. Start your first quiz!</p>`;
}

function openAdmin() {
  if (!adminLoggedIn) {
    $("#loginModal").classList.remove("hidden");
    $("#loginUsername").focus();
    return;
  }
  loadAdmin();
}

function loginAdmin(e) {
  e.preventDefault();
  $("#loginError").textContent = "";
  const user = $("#loginUsername").value.trim();
  const pass = $("#loginPassword").value;
  if (user === "admin" && pass === "Admin@12345") {
    adminLoggedIn = true;
    $("#loginModal").classList.add("hidden");
    resetLogin();
    loadAdmin();
  } else {
    $("#loginError").textContent = "Invalid username or password.";
  }
}

function logoutAdmin() {
  adminLoggedIn = false;
  location.hash = "";
  showScreen("homeScreen");
}

function resetLogin() {
  $("#loginForm").reset();
  $("#loginError").textContent = "";
}

function loadAdmin() {
  showScreen("adminScreen");
  const qs = getStoredQuestions();
  populateCategories();
  $("#adminQuestions").innerHTML = qs.map(q => `
    <div class="admin-item">
      <small>${escapeHtml(q.category_name)} · ${escapeHtml(q.difficulty)}</small>
      <p><b>${escapeHtml(q.question)}</b></p>
      <div class="admin-item-actions">
        <button class="secondary-btn" data-edit="${q.id}">Edit</button>
        <button class="secondary-btn danger" data-delete="${q.id}">Delete</button>
      </div>
    </div>`).join("") || "<p>No questions.</p>";

  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = () => editQuestion(Number(btn.dataset.edit));
  });
  document.querySelectorAll("[data-delete]").forEach(btn => {
    btn.onclick = () => deleteQuestion(Number(btn.dataset.delete));
  });
}

function editQuestion(id) {
  const q = getStoredQuestions().find(x => x.id === id);
  if (!q) return;
  $("#editId").value = q.id;
  $("#formTitle").textContent = "Edit question";
  $("#qText").value = q.question;
  $("#adminCategory").value = q.category_id;
  $("#adminDifficulty").value = q.difficulty;
  $("#optA").value = q.option_a;
  $("#optB").value = q.option_b;
  $("#optC").value = q.option_c;
  $("#optD").value = q.option_d;
  $("#correctOpt").value = q.correct_option;
  $("#explanation").value = q.explanation || "";
  window.scrollTo({top:0, behavior:"smooth"});
}

function saveQuestion(e) {
  e.preventDefault();
  const list = getStoredQuestions();
  const categoryId = Number($("#adminCategory").value);
  const category = [...CATEGORIES, ...list.map(q => ({id:q.category_id, name:q.category_name}))]
    .find(c => Number(c.id) === categoryId);
  const body = {
    id: Number($("#editId").value) || Date.now(),
    category_id: categoryId,
    category_name: category ? category.name : "Custom",
    question: $("#qText").value.trim(),
    option_a: $("#optA").value.trim(),
    option_b: $("#optB").value.trim(),
    option_c: $("#optC").value.trim(),
    option_d: $("#optD").value.trim(),
    correct_option: $("#correctOpt").value,
    difficulty: $("#adminDifficulty").value,
    explanation: $("#explanation").value.trim()
  };
  if (!body.question || !body.option_a || !body.option_b || !body.option_c || !body.option_d) {
    return alert("Please fill all required fields.");
  }
  const idx = list.findIndex(q => q.id === body.id);
  if (idx >= 0) list[idx] = body; else list.push(body);
  localStorage.setItem("quizQuestions", JSON.stringify(list));
  resetForm();
  loadData();
  loadAdmin();
  alert("Question saved.");
}

function deleteQuestion(id) {
  if (!confirm("Delete this question?")) return;
  const list = getStoredQuestions().filter(q => q.id !== id);
  localStorage.setItem("quizQuestions", JSON.stringify(list));
  loadData();
  loadAdmin();
}

function resetForm() {
  $("#questionForm").reset();
  $("#editId").value = "";
  $("#formTitle").textContent = "Add question";
}

function exportQuestions() {
  const blob = new Blob([JSON.stringify(getStoredQuestions(), null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "quiznova-questions.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importQuestions(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const list = Array.isArray(data) ? data : data.questions;
    if (!Array.isArray(list) || !list.length) throw new Error("Invalid JSON question list.");
    const normalized = list.map((q, i) => ({
      id: Number(q.id) || Date.now() + i,
      category_id: Number(q.category_id) || 1,
      category_name: q.category_name || "General Knowledge",
      difficulty: q.difficulty || "Easy",
      question: String(q.question || ""),
      option_a: String(q.option_a || ""),
      option_b: String(q.option_b || ""),
      option_c: String(q.option_c || ""),
      option_d: String(q.option_d || ""),
      correct_option: String(q.correct_option || "A").toUpperCase(),
      explanation: String(q.explanation || "")
    }));
    if (normalized.some(q => !q.question || !q.option_a || !q.option_b || !q.option_c || !q.option_d)) {
      throw new Error("Some questions are missing required fields.");
    }
    localStorage.setItem("quizQuestions", JSON.stringify(normalized));
    loadData();
    loadAdmin();
    alert("Import complete.");
  } catch (err) {
    alert(err.message || "Invalid JSON.");
  }
  e.target.value = "";
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $("#" + id).classList.add("active");
  window.scrollTo({top:0, behavior:"smooth"});
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function escapeHtml(v) {
  return String(v).replace(/[&<>"']/g, m => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[m]));
}

function loadTheme() {
  if (localStorage.getItem("theme") === "light") document.body.classList.add("light");
  $("#themeBtn").textContent = document.body.classList.contains("light") ? "☀" : "☾";
}

function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
  loadTheme();
}
