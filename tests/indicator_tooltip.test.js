#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");

assert.ok(js.includes("indicator-tooltip"), "indicator tooltip not referenced");
assert.ok(js.includes("button.addEventListener(\"click\""), "click handler missing");

console.log("indicator_tooltip.test.js passed");
