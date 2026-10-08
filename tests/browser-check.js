// Headless browser check (Playwright). Opens the pages via file:// exactly as a
// user would, fails on any console/page error, and saves screenshots.
// Setup:  npm install --no-save playwright && npx playwright install chromium
// Run:    node tests/browser-check.js
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const url = (file) => pathToFileURL(path.join(ROOT, file)).href;
const shot = (name) => ({ path: path.join(ROOT, "screenshots", name), fullPage: true });

const problems = [];
const results = [];
function check(name, ok) {
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) problems.push(name);
}

async function launch() {
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ channel: "chrome" }); // fall back to installed Chrome
  }
}

async function newPage(browser, viewport) {
  const page = await browser.newPage({ viewport });
  page.on("console", (m) => m.type() === "error" && problems.push(`console error: ${m.text()}`));
  page.on("pageerror", (e) => problems.push(`page error: ${e.message}`));
  return page;
}

async function checkPassword(browser) {
  const page = await newPage(browser, { width: 900, height: 900 });
  await page.goto(url("password.html"));
  const label = () => page.textContent("#strength-label");

  await page.fill("#password", "password123");
  check("password123 -> Weak", (await label()).includes("Weak"));
  check("password123 flagged as common", (await page.textContent("#checklist")).includes("✘ Not in the common-passwords list"));
  await page.screenshot(shot("password-weak.png"));

  await page.fill("#password", "Tr0ub4dor&3x");
  check("12-char mixed password -> Medium or Strong", /Medium|Strong/.test(await label()));

  await page.fill("#password", "Correct-Horse-9-Battery!");
  check("long passphrase -> Strong", (await label()).includes("Strong"));
  check("crack time shown", (await page.textContent("#crack-time")).length > 0);
  check("suggestions shown", (await page.locator("#suggestions li").count()) >= 1);

  await page.click("#toggle");
  check("show toggle reveals password", (await page.getAttribute("#password", "type")) === "text");
  await page.click("#toggle");
  check("hide toggle masks password", (await page.getAttribute("#password", "type")) === "password");
  await page.screenshot(shot("password-strong.png"));

  await page.fill("#password", "");
  check("empty input resets meter", (await page.isHidden("#details")));
  await page.close();
}

async function checkQuiz(browser) {
  const page = await newPage(browser, { width: 900, height: 900 });
  await page.goto(url("phishing.html"));
  check("quiz shows first email", (await page.textContent(".progress")).includes("1 of 10"));
  check("email links are not clickable", (await page.locator("#quiz a").count()) === 0);
  await page.screenshot(shot("phishing-question.png"));

  for (let i = 0; i < 10; i++) {
    await page.click(".answers button >> nth=1"); // always answer "Phishing"
    if (i === 0) await page.screenshot(shot("phishing-feedback.png"));
    check(`feedback shown for email ${i + 1}`, (await page.locator(".feedback li").count()) >= 1);
    await page.click(".feedback .btn");
  }
  const score = await page.textContent(".score");
  check(`final score screen (${score.trim()})`, /^\d+ \/ 10$/.test(score.trim()));
  check("score is 5/10 when always answering Phishing", score.trim() === "5 / 10");
  await page.screenshot(shot("phishing-results.png"));

  await page.click("text=Restart quiz");
  check("restart returns to email 1", (await page.textContent(".progress")).includes("1 of 10"));
  await page.close();
}

async function checkHomeAndNav(browser) {
  const page = await newPage(browser, { width: 390, height: 800 }); // phone width
  await page.goto(url("index.html"));
  await page.screenshot(shot("home-mobile.png"));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check("no horizontal scroll at phone width", !overflow);
  await page.click("nav >> text=Password Checker");
  check("nav -> password page", page.url().endsWith("password.html"));
  await page.click("nav >> text=Phishing Quiz");
  check("nav -> phishing page", page.url().endsWith("phishing.html"));
  await page.click("nav >> text=Home");
  check("nav -> home page", page.url().endsWith("index.html"));
  await page.close();
}

(async () => {
  const browser = await launch();
  await checkHomeAndNav(browser);
  await checkPassword(browser);
  await checkQuiz(browser);
  await browser.close();
  results.forEach((r) => console.log(r));
  check("no console or page errors", problems.filter((p) => /error/.test(p)).length === 0);
  console.log(problems.length ? `\nProblems:\n${problems.join("\n")}` : "\nAll browser checks passed.");
  process.exit(problems.length ? 1 : 0);
})();
