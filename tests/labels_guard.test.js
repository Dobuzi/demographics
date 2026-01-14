#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");

assert.ok(js.includes("if (STAT_YEAR)"), "STAT_YEAR guard missing");
assert.ok(js.includes("if (STAT_TOTAL_LABEL)"), "STAT_TOTAL_LABEL guard missing");

console.log("labels_guard.test.js passed");
