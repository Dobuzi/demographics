#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");

assert.ok(html.includes('id="sidebar-title">TOP'), "Top flows label should start with TOP");
assert.ok(
  !html.includes('id="sidebar-title">주요 이동 경로'),
  "Top flows title should be shortened"
);

console.log("top_flows.test.js passed");
