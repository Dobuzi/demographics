#!/usr/bin/env node
const assert = require("assert");

const { shouldUseMergedData } = require("../geo/flow_style");

assert.strictEqual(shouldUseMergedData(), false);
assert.strictEqual(shouldUseMergedData(false), false);
assert.strictEqual(shouldUseMergedData(true), true);

console.log("merged_data.test.js passed");
