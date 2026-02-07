/**
 * Test color-blind friendly palette option
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "..", "styles.css");
const appPath = path.join(__dirname, "..", "app.js");
const indexPath = path.join(__dirname, "..", "index.html");

const css = fs.readFileSync(cssPath, "utf8");
const js = fs.readFileSync(appPath, "utf8");
const html = fs.readFileSync(indexPath, "utf8");

/* Verify color-blind palette CSS exists */
assert.ok(
  css.includes("colorblind") || css.includes("color-blind") || css.includes("accessible-colors"),
  "CSS should have color-blind palette styles"
);

/* Verify color-blind toggle in settings */
assert.ok(
  html.includes("colorblind") || html.includes("accessible"),
  "HTML should have color-blind toggle option"
);

/* Verify color-blind toggle function */
assert.ok(
  js.includes("colorblind") || js.includes("accessibleColors") || js.includes("setColorPalette"),
  "app.js should have color-blind toggle functionality"
);

console.log("colorblind.test.js passed");
