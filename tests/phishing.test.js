// Run with: node --test tests/phishing.test.js
const test = require("node:test");
const assert = require("node:assert");
const { EMAILS } = require("../data/emails.js");
const q = require("../js/phishing.js");

test("dataset has 10 emails: 5 phishing and 5 genuine", () => {
  assert.strictEqual(EMAILS.length, 10);
  assert.strictEqual(EMAILS.filter((e) => e.isPhishing).length, 5);
});

test("every email has the required fields and flags", () => {
  for (const e of EMAILS) {
    for (const k of ["senderName", "senderAddress", "subject", "body"]) assert.ok(e[k], `${e.id} ${k}`);
    assert.ok(e.flags.length >= 1);
  }
});

test("no real brand names are used", () => {
  const real = /gmail|yahoo|paypal|amazon|google|microsoft|apple|netflix|hdfc|icici/i;
  for (const e of EMAILS) assert.ok(!real.test(JSON.stringify(e)), `email ${e.id}`);
});

test("shuffle keeps all items and does not mutate the input", () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const out = q.shuffle(input);
  assert.deepStrictEqual([...out].sort((a, b) => a - b), input);
  assert.deepStrictEqual(input, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test("isCorrect marks answers properly", () => {
  const phish = EMAILS.find((e) => e.isPhishing);
  const good = EMAILS.find((e) => !e.isPhishing);
  assert.ok(q.isCorrect(phish, "phishing"));
  assert.ok(!q.isCorrect(phish, "genuine"));
  assert.ok(q.isCorrect(good, "genuine"));
  assert.ok(!q.isCorrect(good, "phishing"));
});

test("missedFlagTypes ignores genuine emails and ranks by frequency", () => {
  const types = q.missedFlagTypes(EMAILS);
  assert.strictEqual(types[0], "Fake domain");
  assert.ok(!types.includes("Good sign"));
});

test("scoreMessage bands", () => {
  assert.match(q.scoreMessage(10, 10), /Excellent/);
  assert.match(q.scoreMessage(7, 10), /Good/);
  assert.match(q.scoreMessage(2, 10), /practising/);
});
