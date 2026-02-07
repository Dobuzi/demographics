/**
 * Test smooth animated transitions between year changes
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "..", "styles.css");
const appPath = path.join(__dirname, "..", "app.js");

const css = fs.readFileSync(cssPath, "utf8");
const js = fs.readFileSync(appPath, "utf8");

/* Verify CSS transition properties for flow lines */
assert.ok(
  css.includes(".flow-line") && css.includes("transition"),
  "flow-line should have CSS transition property"
);

/* Verify opacity transition for smooth fade */
assert.ok(
  /\.flow-line[\s\S]*?transition[\s\S]*?opacity/.test(css) ||
    css.includes("transition: opacity"),
  "flow-line should transition opacity"
);

/* Verify region shape transitions */
assert.ok(
  /\.region-shape[\s\S]*?transition/.test(css),
  "region-shape should have transition property"
);

/* Verify app.js has transition-related logic */
assert.ok(
  js.includes("fadeOut") || js.includes("transitionFlows") || js.includes("animateTransition"),
  "app.js should have transition animation logic"
);

console.log("smooth_transitions.test.js passed");
