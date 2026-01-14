#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");

assert.ok(
  js.includes("if (LEGEND_LINE_LABEL)") || js.includes("LEGEND_LINE_LABEL &&"),
  "legend label should be null-guarded"
);

console.log("legend_guard.test.js passed");
