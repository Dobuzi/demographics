/**
 * Test glow effect on region hover
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "..", "styles.css");
const css = fs.readFileSync(cssPath, "utf8");

/* Verify hover state for region-shape */
assert.ok(
  css.includes(".region-shape:hover") || css.includes(".region-shape:focus"),
  "CSS should have region-shape hover state"
);

/* Verify glow/filter effect on hover */
assert.ok(
  /\.region-shape:hover[\s\S]*?(filter|box-shadow|drop-shadow)/.test(css) ||
    /\.region-shape[\s\S]*?:hover[\s\S]*?(filter|glow)/.test(css),
  "region-shape hover should have glow effect (filter or shadow)"
);

/* Verify transition for smooth glow animation */
assert.ok(
  /\.region-shape[\s\S]*?transition[\s\S]*?filter/.test(css) ||
    css.includes("transition: fill"),
  "region-shape should have transition for smooth effect"
);

console.log("region_glow.test.js passed");
