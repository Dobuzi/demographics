/**
 * Test mini-map overview for region quick navigation
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "..", "index.html");
const appPath = path.join(__dirname, "..", "app.js");
const cssPath = path.join(__dirname, "..", "styles.css");

const html = fs.readFileSync(indexPath, "utf8");
const js = fs.readFileSync(appPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");

/* Verify mini-map HTML element exists */
assert.ok(
  html.includes("minimap") || html.includes("mini-map"),
  "HTML should have mini-map element"
);

/* Verify mini-map function in JavaScript */
assert.ok(
  js.includes("minimap") || js.includes("initMinimap"),
  "app.js should have mini-map functionality"
);

/* Verify mini-map CSS styles */
assert.ok(
  css.includes(".minimap") || css.includes(".mini-map"),
  "CSS should have mini-map styles"
);

console.log("minimap.test.js passed");
