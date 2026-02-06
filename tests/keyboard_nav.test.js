/**
 * Test keyboard navigation for flow selection
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "..", "app.js");
const indexPath = path.join(__dirname, "..", "index.html");

const js = fs.readFileSync(appPath, "utf8");
const html = fs.readFileSync(indexPath, "utf8");

/* Verify keyboard flow state object exists */
assert.ok(
  js.includes("keyboardFlowState"),
  "keyboardFlowState object should exist for tracking selected flow"
);

/* Verify arrow key handling is present */
assert.ok(
  /ArrowUp|ArrowDown/.test(js),
  "Arrow key handling should be present for flow navigation"
);

/* Verify selectFlowByKeyboard function exists */
assert.ok(
  /function\s+selectFlowByKeyboard|selectFlowByKeyboard\s*=/.test(js),
  "selectFlowByKeyboard function should exist"
);

/* Verify clearFlowKeyboardSelection function exists */
assert.ok(
  /function\s+clearFlowKeyboardSelection|clearFlowKeyboardSelection\s*=/.test(js),
  "clearFlowKeyboardSelection function should exist"
);

/* Verify Escape key clears flow selection */
assert.ok(
  /Escape[\s\S]*?clearFlowKeyboardSelection|clearFlowKeyboardSelection[\s\S]*?Escape/.test(js),
  "Escape key should clear keyboard flow selection"
);

/* Verify ARIA live region for keyboard selection announcements */
assert.ok(
  html.includes('aria-live') || html.includes('role="status"'),
  "Page should have ARIA live region for accessibility announcements"
);

console.log("keyboard_nav.test.js passed");
