#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");

assert.ok(js.includes("[init]"), "init debug log missing");
assert.ok(js.includes("[refresh]"), "refresh debug log missing");
assert.ok(js.includes("[loadData]"), "loadData debug log missing");
assert.ok(js.includes("[settings]"), "settings debug log missing");

console.log("debug_logs.test.js passed");
