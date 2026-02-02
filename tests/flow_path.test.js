#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");

// --- NaN guard when source and target overlap ---
assert.ok(
  js.includes("distance < 0.01"),
  "flowPath should guard against zero distance"
);

// --- flowPath should produce valid SVG for overlapping points ---
// The guard should return a simple line instead of NaN control points
assert.ok(
  /if\s*\(distance\s*<\s*[\d.]+\)\s*\{[\s\S]*?return\s+`M/.test(js),
  "flowPath should return fallback path for overlapping points"
);

// --- flowPath should still produce Q (quadratic bezier) for normal points ---
assert.ok(
  js.includes("Q ${controlX} ${controlY}"),
  "flowPath should produce quadratic bezier for normal distances"
);

console.log("flow_path.test.js passed");
