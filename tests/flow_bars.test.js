#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");
const js = fs.readFileSync("app.js", "utf-8");

assert.ok(html.includes("top-flows-title"), "top flows title missing");
assert.ok(html.includes("top-flows-list"), "top flows list missing");
assert.ok(js.includes("updateTopList"), "top flows update missing");
assert.ok(js.includes("TOP_FLOW_COUNT"), "top flow count constant missing");
assert.ok(!js.includes("flow-bar__fill"), "flow bar fill should be removed");

console.log("flow_bars.test.js passed");
