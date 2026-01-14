#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const css = fs.readFileSync("styles.css", "utf-8");

assert.ok(
  /\.stat-grid \.stat--total\s*{[^}]*gap:\s*6px/m.test(css),
  "stat total should use a tight gap"
);
assert.ok(
  /\.stat-grid \.stat--total\s*{[^}]*justify-content:\s*flex-end/m.test(css),
  "stat total should keep label/value together"
);
assert.ok(
  /\.stat-grid \.stat--total \.stat__label\s*{[^}]*white-space:\s*nowrap/m.test(css),
  "stat total label should not wrap"
);

console.log("summary_total_inline.test.js passed");
