// Password Strength Checker - all logic runs locally in the browser.
// The password is never stored, logged or sent anywhere.

// In the browser COMMON_PASSWORDS is a global from data/common-passwords.js;
// under Node (tests) we load it with require().
const COMMON_LIST =
  typeof COMMON_PASSWORDS !== "undefined"
    ? COMMON_PASSWORDS
    : require("../data/common-passwords.js").COMMON_PASSWORDS;
const COMMON_SET = new Set(COMMON_LIST);

const MIN_LENGTH = 12;

// Assumed attacker speed: 10 billion guesses/second, typical of an offline
// attack on a fast hash with GPUs. This is a rough, worst-case-style figure.
const GUESSES_PER_SECOND = 1e10;

const KEYBOARD_PATTERNS = ["qwerty", "qwertz", "azerty", "asdfgh", "zxcvbn", "1qaz2wsx", "qazwsx"];

// ---- Individual checks (each returns true when the password PASSES) ----

const hasMinLength = (pw) => pw.length >= MIN_LENGTH;
const hasUppercase = (pw) => /[A-Z]/.test(pw);
const hasLowercase = (pw) => /[a-z]/.test(pw);
const hasNumber = (pw) => /[0-9]/.test(pw);
const hasSpecial = (pw) => /[^A-Za-z0-9]/.test(pw);

// Dictionary attacks try common passwords first, so a hit means "unsafe".
const isNotCommon = (pw) => !COMMON_SET.has(pw.toLowerCase());

// Three or more identical characters in a row, e.g. "aaaa" or "1111".
const hasNoRepeats = (pw) => !/(.)\1{2,}/.test(pw);

// Detects runs of 4 consecutive characters ("1234", "abcd", "dcba") and
// common keyboard patterns ("qwerty"). Attackers try these patterns early.
function hasNoSequences(pw) {
  const lower = pw.toLowerCase();
  if (KEYBOARD_PATTERNS.some((p) => lower.includes(p))) return false;
  for (let i = 0; i + 3 < lower.length; i++) {
    const step = lower.charCodeAt(i + 1) - lower.charCodeAt(i);
    if (Math.abs(step) !== 1) continue;
    const isRun = [2, 3].every(
      (k) => lower.charCodeAt(i + k) - lower.charCodeAt(i + k - 1) === step
    );
    if (isRun && /[a-z0-9]/.test(lower[i])) return false;
  }
  return true;
}

// Ordered list of rules shown in the UI checklist.
const CHECKS = [
  { id: "length", label: `At least ${MIN_LENGTH} characters`, test: hasMinLength },
  { id: "upper", label: "Contains an uppercase letter", test: hasUppercase },
  { id: "lower", label: "Contains a lowercase letter", test: hasLowercase },
  { id: "number", label: "Contains a number", test: hasNumber },
  { id: "special", label: "Contains a special character", test: hasSpecial },
  { id: "common", label: "Not in the common-passwords list", test: isNotCommon },
  { id: "repeats", label: "No repeated characters (e.g. aaaa)", test: hasNoRepeats },
  { id: "sequence", label: "No simple sequences (1234, abcd, qwerty)", test: hasNoSequences },
];

function runChecks(pw) {
  return CHECKS.map((c) => ({ id: c.id, label: c.label, passed: c.test(pw) }));
}

// ---- Entropy & crack-time estimate ----

// Size of the character pool the password appears to draw from.
function poolSize(pw) {
  let pool = 0;
  if (hasLowercase(pw)) pool += 26;
  if (hasUppercase(pw)) pool += 26;
  if (hasNumber(pw)) pool += 10;
  if (hasSpecial(pw)) pool += 33;
  return pool;
}

// Entropy in bits = length * log2(pool size). Assumes random characters, so
// it OVER-estimates strength for predictable passwords (handled in rating).
function estimateEntropy(pw) {
  const pool = poolSize(pw);
  return pool === 0 ? 0 : pw.length * Math.log2(pool);
}

// Average attacker finds it after trying half of all 2^bits possibilities.
function estimateCrackSeconds(pw) {
  if (!pw) return 0;
  if (!isNotCommon(pw)) return 0; // found immediately in a dictionary
  return Math.pow(2, estimateEntropy(pw) - 1) / GUESSES_PER_SECOND;
}

function formatDuration(seconds) {
  if (seconds < 1) return "instantly";
  const units = [
    ["year", 365 * 24 * 3600],
    ["day", 24 * 3600],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
  ];
  if (seconds >= 1e9 * units[0][1]) return "billions of years or more";
  for (const [name, size] of units) {
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      return `about ${n.toLocaleString("en-US")} ${name}${n === 1 ? "" : "s"}`;
    }
  }
  return "instantly";
}

// ---- Rating & suggestions ----

// Weak: common password, low entropy, or half the rules failed.
// Strong: every rule passed. Otherwise Medium.
function rateStrength(pw) {
  if (!pw) return null;
  const results = runChecks(pw);
  const passedCount = results.filter((r) => r.passed).length;
  if (!isNotCommon(pw) || estimateEntropy(pw) < 40 || passedCount <= 4) return "Weak";
  return passedCount === results.length ? "Strong" : "Medium";
}

function getSuggestions(pw) {
  const failed = new Set(runChecks(pw).filter((r) => !r.passed).map((r) => r.id));
  const tips = [];
  if (failed.has("common")) tips.push("Avoid common passwords - attackers try them first. Pick something unique to you.");
  if (failed.has("length")) tips.push(`Make it longer: aim for ${MIN_LENGTH}+ characters. A passphrase of 4 random words works well.`);
  if (failed.has("sequence") || failed.has("repeats")) tips.push("Remove repeated characters and sequences like 1234, abcd or qwerty.");
  if (failed.has("upper") || failed.has("lower")) tips.push("Mix uppercase and lowercase letters.");
  if (failed.has("number") || failed.has("special")) tips.push("Add numbers and symbols, ideally in the middle rather than only at the end.");
  if (tips.length === 0) tips.push("Great! Use a different password for every account and store it in a password manager.");
  return tips.slice(0, 3);
}

function analyse(pw) {
  return {
    rating: rateStrength(pw),
    checks: runChecks(pw),
    entropyBits: Math.round(estimateEntropy(pw)),
    crackTime: formatDuration(estimateCrackSeconds(pw)),
    suggestions: getSuggestions(pw),
  };
}

// ---- Browser UI (skipped when running under Node) ----

function renderResult(pw) {
  const result = analyse(pw);
  const meter = document.getElementById("meter-fill");
  const label = document.getElementById("strength-label");
  const details = document.getElementById("details");

  details.hidden = !pw;
  meter.className = "meter-fill" + (result.rating ? ` ${result.rating.toLowerCase()}` : "");
  label.textContent = result.rating ? `Strength: ${result.rating}` : "Strength: type a password to begin";
  if (!pw) return;

  const list = document.getElementById("checklist");
  list.replaceChildren(
    ...result.checks.map((c) => {
      const li = document.createElement("li");
      li.className = c.passed ? "pass" : "fail";
      li.textContent = `${c.passed ? "✔" : "✘"} ${c.label}`;
      return li;
    })
  );

  document.getElementById("crack-time").textContent =
    `${result.crackTime} (approximate; ~${result.entropyBits} bits of entropy)`;
  document.getElementById("suggestions").replaceChildren(
    ...result.suggestions.map((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      return li;
    })
  );
}

function initPasswordPage() {
  const input = document.getElementById("password");
  const toggle = document.getElementById("toggle");
  input.addEventListener("input", () => renderResult(input.value));
  toggle.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    toggle.textContent = show ? "Hide" : "Show";
    toggle.setAttribute("aria-pressed", String(show));
  });
  renderResult("");
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initPasswordPage);
}

if (typeof module !== "undefined") {
  module.exports = { analyse, runChecks, rateStrength, estimateEntropy, estimateCrackSeconds, formatDuration, hasNoSequences, hasNoRepeats, isNotCommon };
}
