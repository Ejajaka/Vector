"use strict";

/**
 * Per-control precision / recall / F1 across the labelled evaluation sets.
 *
 * run-eval.js reports a single aggregate score. This breaks the same results
 * down by control so weak spots are visible (e.g. a control with low recall),
 * which is more useful for an NLP report than one headline number.
 *
 * Labelling convention (see dataset.json):
 *   mustFlag    -> control should be reported as MISSING (positive label)
 *   mustNotFlag -> control is stated / not applicable and must NOT be flagged
 *   controls in neither list are unlabelled and are ignored.
 *
 * Run: node engine/eval/per-control.js   (or: npm run eval:controls)
 */

const fs = require("fs");
const path = require("path");
const V = require(path.join(__dirname, "..", "src", "analyzer.js"));

const FILES = ["dataset.json", "dataset2.json", "heldout.json"];
const stats = {}; // id -> { tp, fp, fn }
const seen = new Set();

function row(id) {
  if (!stats[id]) stats[id] = { tp: 0, fp: 0, fn: 0 };
  return stats[id];
}

for (const file of FILES) {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) continue;
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const c of data.cases || []) {
    const key = file + "::" + c.id;
    if (seen.has(key)) continue;
    seen.add(key);
    const r = V.analyze(c.prompt, { strictMode: false });
    const predicted = new Set((r.missing || []).map((m) => m.id));
    const mustFlag = new Set(c.mustFlag || []);
    const mustNot = new Set(c.mustNotFlag || []);

    for (const id of mustFlag) {
      if (predicted.has(id)) row(id).tp += 1;
      else row(id).fn += 1;
    }
    for (const id of mustNot) {
      if (predicted.has(id)) row(id).fp += 1;
    }
  }
}

function ratio(a, b) {
  return b ? a / b : 0;
}
function f1(p, rec) {
  return p + rec ? (2 * p * rec) / (p + rec) : 0;
}
function pct(x) {
  return (x * 100).toFixed(1) + "%";
}

const rows = Object.keys(stats).map((id) => {
  const s = stats[id];
  const p = ratio(s.tp, s.tp + s.fp);
  const rec = ratio(s.tp, s.tp + s.fn);
  return { id, ...s, p, r: rec, f1: f1(p, rec), support: s.tp + s.fn };
});

rows.sort((a, b) => b.fn - a.fn || a.f1 - b.f1);

console.log("Per-control metrics (labelled sets: " + FILES.join(", ") + ")");
console.log(
  "control".padEnd(26) + "P".padStart(8) + "R".padStart(8) + "F1".padStart(8) +
  "TP".padStart(5) + "FP".padStart(5) + "FN".padStart(5) + "support".padStart(9)
);
for (const x of rows) {
  console.log(
    x.id.padEnd(26) +
    pct(x.p).padStart(8) + pct(x.r).padStart(8) + pct(x.f1).padStart(8) +
    String(x.tp).padStart(5) + String(x.fp).padStart(5) + String(x.fn).padStart(5) +
    String(x.support).padStart(9)
  );
}

const total = rows.reduce(
  (a, x) => ({ tp: a.tp + x.tp, fp: a.fp + x.fp, fn: a.fn + x.fn }),
  { tp: 0, fp: 0, fn: 0 }
);
const P = ratio(total.tp, total.tp + total.fp);
const R = ratio(total.tp, total.tp + total.fn);
console.log(
  "\nMicro average: P " + pct(P) + "  R " + pct(R) + "  F1 " + pct(f1(P, R)) +
  "  (TP " + total.tp + ", FP " + total.fp + ", FN " + total.fn + ")"
);
console.log("Weakest recall: " + rows.slice(0, 3).map((x) => x.id + " (" + pct(x.r) + ")").join(", "));
