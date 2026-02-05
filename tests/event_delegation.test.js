#!/usr/bin/env node
/**
 * Tests that SVG flow hover uses event delegation instead of per-element listeners.
 * Verifies that flowGroup receives 3 delegated listeners (pointerenter, pointerleave, pointermove)
 * and individual flow paths do NOT have listeners attached.
 */
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");

// ─── Event delegation pattern is used ───

// flowGroup should have addEventListener calls with capture=true
assert.ok(
  js.includes('flowGroup.addEventListener("pointerenter"'),
  "flowGroup should have delegated pointerenter listener"
);
assert.ok(
  js.includes('flowGroup.addEventListener("pointerleave"'),
  "flowGroup should have delegated pointerleave listener"
);
assert.ok(
  js.includes('flowGroup.addEventListener("pointermove"'),
  "flowGroup should have delegated pointermove listener"
);

// Delegation uses capture phase (true as third argument)
const enterMatch = js.match(/flowGroup\.addEventListener\("pointerenter"[\s\S]*?,\s*true\)/);
assert.ok(enterMatch, "pointerenter delegation should use capture phase (true)");

const leaveMatch = js.match(/flowGroup\.addEventListener\("pointerleave"[\s\S]*?,\s*true\)/);
assert.ok(leaveMatch, "pointerleave delegation should use capture phase (true)");

const moveMatch = js.match(/flowGroup\.addEventListener\("pointermove"[\s\S]*?,\s*true\)/);
assert.ok(moveMatch, "pointermove delegation should use capture phase (true)");

// ─── Per-element listeners are NOT used ───

// path.addEventListener("pointerenter") should NOT appear
assert.ok(
  !js.includes('path.addEventListener("pointerenter"'),
  "individual path elements should NOT have pointerenter listeners"
);
assert.ok(
  !js.includes('path.addEventListener("pointerleave"'),
  "individual path elements should NOT have pointerleave listeners"
);
assert.ok(
  !js.includes('path.addEventListener("pointermove"'),
  "individual path elements should NOT have pointermove listeners"
);

// ─── Delegation uses closest() for target resolution ───

assert.ok(
  js.includes('.closest(".flow-line")'),
  "delegation should use closest() to find the flow-line target"
);

// ─── Delegation reads dataset from event target ───

assert.ok(
  js.includes("target.dataset.flowId"),
  "delegation should read flowId from event target dataset"
);
assert.ok(
  js.includes("target.dataset.fromCode"),
  "delegation should read fromCode from event target dataset"
);
assert.ok(
  js.includes("target.dataset.toCode"),
  "delegation should read toCode from event target dataset"
);

// ─── Comment documents the delegation pattern ───

assert.ok(
  js.includes("Event delegation"),
  "drawFlows should document the event delegation pattern"
);

console.log("event_delegation.test.js passed");
