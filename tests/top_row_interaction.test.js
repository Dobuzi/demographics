#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const css = fs.readFileSync("styles.css", "utf-8");

assert.ok(
  css.includes(".top-row") && css.includes("position: relative"),
  "top row should establish positioning context"
);
assert.ok(
  css.includes(".top-row") && css.includes("z-index: 5"),
  "top row should sit above the map for interactions"
);
assert.ok(
  css.includes(".top-row") && css.includes("pointer-events: auto"),
  "top row should accept pointer events"
);

console.log("top_row_interaction.test.js passed");
