#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const source = fs.readFileSync("app.js", "utf-8");

assert.ok(source.includes("FLOW_MAP"), "FLOW_MAP should be referenced");
assert.ok(!source.includes("MAP_SVG"), "MAP_SVG should not be referenced");

console.log("app_reference.test.js passed");
