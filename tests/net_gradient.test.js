#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");

assert.ok(js.includes("net-inbound-gradient"), "inbound gradient id missing");
assert.ok(js.includes("net-outbound-gradient"), "outbound gradient id missing");

console.log("net_gradient.test.js passed");
