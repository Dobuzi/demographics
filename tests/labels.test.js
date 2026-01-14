#!/usr/bin/env node
const assert = require("assert");

const { getModeTitle } = require("../geo/flow_style");

assert.strictEqual(getModeTitle("flow"), "인구 이동");
assert.strictEqual(getModeTitle("net"), "인구의 유입과 유출");

console.log("labels.test.js passed");
