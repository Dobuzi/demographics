#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");

assert.ok(js.includes("prefetchPeriod"), "prefetchPeriod helper missing");
assert.ok(js.includes("buildTimeline"), "buildTimeline helper missing");

console.log("prefetch.test.js passed");
