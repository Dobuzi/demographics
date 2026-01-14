#!/usr/bin/env node
const assert = require("assert");

const { getNetLegendItems } = require("../geo/flow_style");

const items = getNetLegendItems();
assert.strictEqual(items.length, 2);
assert.deepStrictEqual(items[0], { label: "유입", color: "#27d17f" });
assert.deepStrictEqual(items[1], { label: "유출", color: "#f05b4c" });

console.log("net_legend.test.js passed");
