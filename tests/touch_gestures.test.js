/**
 * Test mobile touch gestures (pinch zoom, swipe year)
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "..", "app.js");
const js = fs.readFileSync(appPath, "utf8");

/* Verify touch event handlers exist */
assert.ok(
  js.includes("touchstart") || js.includes("pointerdown"),
  "app.js should handle touch start events"
);

assert.ok(
  js.includes("touchmove") || js.includes("pointermove"),
  "app.js should handle touch move events"
);

assert.ok(
  js.includes("touchend") || js.includes("pointerup"),
  "app.js should handle touch end events"
);

/* Verify pinch zoom detection */
assert.ok(
  js.includes("pinch") || js.includes("touches.length") || js.includes("getTouchDistance"),
  "app.js should detect pinch gestures"
);

/* Verify swipe detection for year change */
assert.ok(
  js.includes("swipe") || js.includes("handleSwipe"),
  "app.js should handle swipe gestures"
);

console.log("touch_gestures.test.js passed");
