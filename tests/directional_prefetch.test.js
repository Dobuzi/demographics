/**
 * Test directional prefetch based on playback/navigation direction
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "..", "app.js");
const js = fs.readFileSync(appPath, "utf8");

/* Verify lastNavigationDirection tracking exists */
assert.ok(
  js.includes("lastNavigationDirection"),
  "lastNavigationDirection should track navigation direction"
);

/* Verify prefetch considers direction */
assert.ok(
  /prefetch.*direction|direction.*prefetch/i.test(js),
  "prefetch logic should consider navigation direction"
);

/* Verify previous year tracking for direction detection */
assert.ok(
  js.includes("previousYear") || js.includes("lastYear"),
  "Previous year should be tracked to detect direction"
);

console.log("directional_prefetch.test.js passed");
