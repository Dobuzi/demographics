/**
 * Test loading skeleton placeholder during data fetch
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "..", "styles.css");
const appPath = path.join(__dirname, "..", "app.js");

const css = fs.readFileSync(cssPath, "utf8");
const js = fs.readFileSync(appPath, "utf8");

/* Verify skeleton CSS class exists */
assert.ok(
  css.includes(".skeleton") || css.includes("skeleton-"),
  "CSS should have skeleton loading styles"
);

/* Verify skeleton animation (shimmer effect) */
assert.ok(
  css.includes("@keyframes skeleton") || css.includes("shimmer"),
  "CSS should have skeleton animation keyframes"
);

/* Verify app.js shows/hides skeleton */
assert.ok(
  js.includes("showSkeleton") || js.includes("skeleton"),
  "app.js should have skeleton display logic"
);

console.log("loading_skeleton.test.js passed");
