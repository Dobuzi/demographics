#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");

// --- scheduleRender utility exists ---
assert.ok(
  js.includes("function scheduleRender"),
  "scheduleRender utility function should exist"
);
assert.ok(
  js.includes("requestAnimationFrame"),
  "scheduleRender should use requestAnimationFrame"
);

// --- DocumentFragment batching in drawBaseMap ---
assert.ok(
  /drawBaseMap[\s\S]*?createDocumentFragment/.test(js),
  "drawBaseMap should use DocumentFragment for batching"
);
assert.ok(
  /fragment\.appendChild/.test(js),
  "drawBaseMap should append to fragment"
);

// --- Single DOM write at end of drawBaseMap ---
assert.ok(
  /scheduleRender\(\(\)\s*=>\s*\{[\s\S]*?svg\.innerHTML[\s\S]*?svg\.appendChild\(fragment\)[\s\S]*?\}\)/.test(js),
  "drawBaseMap should use scheduleRender for final DOM write"
);

// --- SVG groups for efficient updates ---
assert.ok(
  js.includes('setAttribute("id", "region-polygons")'),
  "region polygons should be in a group"
);
assert.ok(
  js.includes('setAttribute("id", "region-dots")'),
  "region dots should be in a group"
);
assert.ok(
  js.includes('setAttribute("id", "flow-lines")'),
  "flow lines should be in a group"
);

console.log("svg_rendering.test.js passed");
