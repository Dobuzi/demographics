/**
 * Test zoom and pan controls for map navigation
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

/* Verify zoom controls exist in HTML */
assert.ok(
  html.includes("zoom-in") || html.includes("zoom-controls"),
  "HTML should have zoom controls"
);

assert.ok(
  html.includes("zoom-out"),
  "HTML should have zoom out button"
);

/* Verify zoom functions in JavaScript */
assert.ok(
  js.includes("zoomIn") || js.includes("handleZoom"),
  "app.js should have zoom function"
);

assert.ok(
  js.includes("zoomOut") || js.includes("zoomLevel"),
  "app.js should track zoom level"
);

/* Verify pan functionality */
assert.ok(
  js.includes("panMap") || js.includes("handlePan") || js.includes("isDragging"),
  "app.js should have pan functionality"
);

/* Verify CSS styles for zoom controls */
assert.ok(
  css.includes("zoom-controls") || css.includes("zoom-in"),
  "CSS should style zoom controls"
);

console.log("zoom_pan.test.js passed");
