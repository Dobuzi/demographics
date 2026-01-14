#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");

assert.ok(html.includes("map-shell"), "map-shell layout missing");
assert.ok(html.includes("map-card"), "map card missing");
assert.ok(html.includes("map-wrap"), "map wrap missing");
assert.ok(html.includes("map-stage"), "map stage missing");
assert.ok(html.includes("controls"), "controls missing");
assert.ok(html.includes("map-header"), "map header missing");
assert.ok(html.includes("glass-panel"), "glass panel class missing");
assert.ok(
  html.includes("panel-settings glass-panel"),
  "settings panel not glass"
);
assert.ok(html.includes("panel-summary glass-panel"), "summary panel not glass");
assert.ok(html.includes("panel-flows glass-panel"), "flows panel not glass");
assert.ok(html.includes("top-row"), "top row missing");
assert.ok(html.includes("top-row__spacer"), "top row spacer missing");
assert.ok(html.includes("map-tags"), "map tags missing");
assert.ok(html.includes("map-tags"), "map tags missing");
assert.ok(html.includes("year-range"), "year range missing");
assert.ok(html.includes("year-label"), "year label missing");
assert.ok(html.includes("control-range"), "control range class missing");
assert.ok(html.includes("play-speed"), "play speed missing");
assert.ok(!html.includes("panel__header\">\\n                      <h2>설정</h2>\\n                      <p>"), "settings description should be removed");
assert.ok(html.includes("flow-map"), "flow map missing");

console.log("layout.test.js passed");
