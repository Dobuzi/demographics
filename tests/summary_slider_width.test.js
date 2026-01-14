#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const css = fs.readFileSync("styles.css", "utf-8");

assert.ok(
  css.includes(".summary-age .control-range") && css.includes("flex: 0 0 120px"),
  "summary age slider should have fixed width"
);
assert.ok(
  css.includes(".year-control .control-range") && css.includes("flex: 0 0 120px"),
  "year slider should have fixed width"
);
assert.ok(
  css.includes("@media (max-width: 640px)") && css.includes("flex: 0 0 90px"),
  "mobile sliders should use compact width"
);
assert.ok(
  /@media \(max-width: 640px\)[\s\S]*\.summary-age\s+\.age-value\s*{[^}]*text-align:\s*right/m.test(css),
  "mobile age label should right-align"
);
assert.ok(
  css.includes(".summary-age .control-range") && css.includes("margin-left: 6px"),
  "summary age slider should shift right"
);
assert.ok(
  css.includes(".year-control .control-range") && css.includes("margin-left: 6px"),
  "year slider should shift right"
);

console.log("summary_slider_width.test.js passed");
