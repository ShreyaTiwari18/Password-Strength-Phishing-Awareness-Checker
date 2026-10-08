// Run with: node --test tests/password.test.js
const test = require("node:test");
const assert = require("node:assert");
const pw = require("../js/password.js");

const failedIds = (p) => pw.runChecks(p).filter((c) => !c.passed).map((c) => c.id);

test("password123 is Weak and hits the common list", () => {
  assert.strictEqual(pw.rateStrength("password123"), "Weak");
  assert.ok(failedIds("password123").includes("common"));
});

test("common-list match is case-insensitive", () => {
  assert.strictEqual(pw.isNotCommon("PASSWORD123"), false);
});

test("empty input has no rating", () => {
  assert.strictEqual(pw.rateStrength(""), null);
});

test("short mixed password is not Strong", () => {
  assert.notStrictEqual(pw.rateStrength("Tr0ub4d&3x"), "Strong");
  assert.ok(failedIds("Tr0ub4d&3x").includes("length"));
});

test("long unique passphrase is Strong with all checks passing", () => {
  const p = "Correct-Horse-9-Battery!";
  assert.strictEqual(pw.rateStrength(p), "Strong");
  assert.deepStrictEqual(failedIds(p), []);
});

test("repeated characters are flagged", () => {
  assert.strictEqual(pw.hasNoRepeats("xaaaay"), false);
  assert.strictEqual(pw.hasNoRepeats("xaay"), true);
});

test("sequences and keyboard patterns are flagged", () => {
  for (const s of ["x1234y", "xabcdy", "xdcbay", "myqwertyx", "9876zz"]) {
    assert.strictEqual(pw.hasNoSequences(s), false, s);
  }
  assert.strictEqual(pw.hasNoSequences("a1c3e5g7"), true);
});

test("each character class check works", () => {
  assert.deepStrictEqual(failedIds("abcdefghijkl").sort(), ["number", "sequence", "special", "upper"]);
});

test("entropy grows with length and pool size", () => {
  assert.ok(pw.estimateEntropy("abcdefgh") < pw.estimateEntropy("abcdefghij"));
  assert.ok(pw.estimateEntropy("abcdefgh") < pw.estimateEntropy("Abcdefg1"));
  assert.strictEqual(pw.estimateEntropy(""), 0);
});

test("common password cracks instantly; strong one takes very long", () => {
  assert.strictEqual(pw.formatDuration(pw.estimateCrackSeconds("password123")), "instantly");
  assert.match(pw.analyse("Correct-Horse-9-Battery!").crackTime, /billions|years/);
});

test("formatDuration units", () => {
  assert.strictEqual(pw.formatDuration(0.2), "instantly");
  assert.strictEqual(pw.formatDuration(90), "about 1 minute");
  assert.strictEqual(pw.formatDuration(7200), "about 2 hours");
});

test("suggestions are 1-3 items and specific", () => {
  const s = pw.analyse("password").suggestions;
  assert.ok(s.length >= 1 && s.length <= 3);
  assert.match(s[0], /common/i);
  assert.strictEqual(pw.analyse("Correct-Horse-9-Battery!").suggestions.length, 1);
});
