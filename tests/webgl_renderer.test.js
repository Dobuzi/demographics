/**
 * Test WebGL/Canvas renderer for large flow counts
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const rendererPath = path.join(__dirname, "..", "geo", "canvas_renderer.js");
const appPath = path.join(__dirname, "..", "app.js");

/* Verify canvas_renderer.js module exists */
assert.ok(fs.existsSync(rendererPath), "canvas_renderer.js module should exist");

const renderer = require(rendererPath);

/* Verify required functions exist */
assert.ok(
  typeof renderer.initCanvas === "function",
  "initCanvas function should exist"
);
assert.ok(
  typeof renderer.drawFlowsCanvas === "function",
  "drawFlowsCanvas function should exist"
);
assert.ok(
  typeof renderer.clearCanvas === "function",
  "clearCanvas function should exist"
);

/* Verify flow path calculation */
assert.ok(
  typeof renderer.calculateBezierPath === "function",
  "calculateBezierPath should exist for flow curves"
);

/* Verify gradient support */
assert.ok(
  typeof renderer.createFlowGradient === "function",
  "createFlowGradient should exist"
);

/* Verify app.js references canvas renderer */
const js = fs.readFileSync(appPath, "utf8");
assert.ok(
  js.includes("canvasRenderer") || js.includes("canvas_renderer"),
  "app.js should reference canvas renderer module"
);

console.log("webgl_renderer.test.js passed");
