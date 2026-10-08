// Phishing Awareness Quiz - runs entirely in the browser; nothing is sent anywhere.
// Links in the sample emails are shown as plain text and are never clickable.

const QUIZ_EMAILS =
  typeof EMAILS !== "undefined" ? EMAILS : require("../data/emails.js").EMAILS;

// Summary shown on the results screen (the course's common phishing signs).
const COMMON_SIGNS = [
  "Sender domain is slightly wrong (extra words, hyphens, look-alike spelling).",
  "Urgency or threats: \"act now\", \"account suspended\", \"within 24 hours\".",
  "Requests for passwords, OTPs or card details - legitimate firms never ask by email.",
  "Spelling and grammar mistakes or generic greetings like \"Dear Customer\".",
  "Link text that does not match where the link really goes.",
  "Unexpected attachments, especially macro files such as .xlsm or .docm.",
];

// ---- Pure quiz logic (unit-tested) ----

// Fisher-Yates shuffle on a copy, so the original data is never changed.
function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// The user answers "phishing" or "genuine".
function isCorrect(email, answer) {
  return (answer === "phishing") === email.isPhishing;
}

// Counts the red-flag types in phishing emails the user got wrong.
function missedFlagTypes(missedEmails) {
  const counts = {};
  missedEmails
    .filter((e) => e.isPhishing)
    .forEach((e) => e.flags.forEach((f) => (counts[f.type] = (counts[f.type] || 0) + 1)));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([type]) => type);
}

function scoreMessage(score, total) {
  const ratio = score / total;
  if (ratio >= 0.9) return "Excellent! You have a sharp eye for phishing.";
  if (ratio >= 0.6) return "Good effort. Review the signs below and try again.";
  return "Keep practising - spotting phishing gets easier with experience.";
}

// ---- Browser UI ----

const state = { order: [], index: 0, score: 0, missed: [] };

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function startQuiz() {
  state.order = shuffle(QUIZ_EMAILS);
  state.index = 0;
  state.score = 0;
  state.missed = [];
  showQuestion();
}

function renderEmail(email) {
  const box = el("article", "email");
  const head = el("div", "email-head");
  [["From", `${email.senderName} <${email.senderAddress}>`], ["Subject", email.subject]].forEach(([k, v]) => {
    const p = el("p");
    p.append(el("strong", "", `${k}: `), v);
    head.append(p);
  });
  box.append(head, el("div", "email-body", email.body));
  if (email.link) box.append(el("div", "email-link", `Link (text only): ${email.link}`));
  if (email.linkNote) box.append(el("p", "note email-note", email.linkNote));
  if (email.attachment) box.append(el("div", "email-attachment", `Attachment: ${email.attachment}`));
  return box;
}

function showQuestion() {
  const email = state.order[state.index];
  const quiz = document.getElementById("quiz");
  const answers = el("div", "answers actions");
  [["genuine", "Genuine"], ["phishing", "Phishing"]].forEach(([value, text]) => {
    const btn = el("button", "btn", text);
    btn.type = "button";
    btn.addEventListener("click", () => submitAnswer(email, value));
    answers.append(btn);
  });
  const feedback = el("div");
  feedback.id = "feedback";
  feedback.setAttribute("aria-live", "polite");
  quiz.replaceChildren(
    el("p", "progress", `Email ${state.index + 1} of ${state.order.length}`),
    renderEmail(email), answers, feedback
  );
}

function submitAnswer(email, answer) {
  const correct = isCorrect(email, answer);
  if (correct) state.score++;
  else state.missed.push(email);

  document.querySelectorAll(".answers button").forEach((b) => (b.disabled = true));
  const fb = document.getElementById("feedback");
  fb.className = `feedback ${correct ? "correct" : "incorrect"}`;
  const verdict = email.isPhishing ? "phishing" : "genuine";
  const list = el("ul");
  email.flags.forEach((f) => {
    const li = el("li");
    li.append(el("strong", "", `${f.type}: `), f.detail);
    list.append(li);
  });
  const isLast = state.index === state.order.length - 1;
  const next = el("button", "btn", isLast ? "See results" : "Next email");
  next.type = "button";
  next.addEventListener("click", () => {
    state.index++;
    isLast ? showResults() : showQuestion();
  });
  fb.replaceChildren(
    el("h2", "", `${correct ? "✔ Correct!" : "✘ Not quite."} This email is ${verdict}.`),
    el("p", "", email.isPhishing ? "Red flags:" : "Why it looks genuine:"),
    list, next
  );
  next.focus();
}

function showResults() {
  const total = state.order.length;
  const quiz = document.getElementById("quiz");
  const signs = el("ul");
  COMMON_SIGNS.forEach((s) => signs.append(el("li", "", s)));
  const restart = el("button", "btn", "Restart quiz");
  restart.type = "button";
  restart.addEventListener("click", startQuiz);

  const nodes = [
    el("h2", "", "Your result"),
    el("p", "score", `${state.score} / ${total}`),
    el("p", "", scoreMessage(state.score, total)),
  ];
  const missedTypes = missedFlagTypes(state.missed);
  if (missedTypes.length) {
    nodes.push(el("p", "", `Signs you missed most: ${missedTypes.join(", ")}.`));
  }
  nodes.push(el("h3", "", "Most common signs of phishing"), signs, restart);
  quiz.replaceChildren(...nodes);
  restart.focus();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", startQuiz);
}

if (typeof module !== "undefined") {
  module.exports = { shuffle, isCorrect, missedFlagTypes, scoreMessage };
}
