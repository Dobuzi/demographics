/**
 * Test visual regression test configuration
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const specPath = path.join(__dirname, "..", "e2e", "visual-regression.spec.js");
const configPath = path.join(__dirname, "..", "playwright.config.js");

/* Verify visual-regression.spec.js exists */
assert.ok(fs.existsSync(specPath), "visual-regression.spec.js should exist");

const spec = fs.readFileSync(specPath, "utf8");

/* Verify screenshot tests are present */
assert.ok(
  spec.includes("toHaveScreenshot"),
  "Visual regression tests should use toHaveScreenshot"
);

/* Verify test descriptions for main visual elements */
assert.ok(
  spec.includes("map renders correctly") || spec.includes("map-initial"),
  "Should test initial map rendering"
);

assert.ok(
  spec.includes("flow-lines") || spec.includes("flow lines render"),
  "Should test flow line rendering"
);

assert.ok(
  spec.includes("region") || spec.includes("regions"),
  "Should test region rendering"
);

/* Verify responsive tests */
assert.ok(
  spec.includes("mobile") && spec.includes("tablet"),
  "Should include responsive layout tests"
);

/* Verify playwright config has snapshot settings */
const config = fs.readFileSync(configPath, "utf8");
assert.ok(
  config.includes("snapshotDir") || config.includes("toHaveScreenshot"),
  "Playwright config should have snapshot settings"
);

console.log("visual_regression.test.js passed");
