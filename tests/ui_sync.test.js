#!/usr/bin/env node
const assert = require("assert");

const uiSync = require("../geo/ui_sync");

// --- formatNumber ---
assert.strictEqual(uiSync.formatNumber(0), "0", "zero");
assert.strictEqual(uiSync.formatNumber(1000), "1,000", "thousands");
assert.strictEqual(uiSync.formatNumber(1234567), "1,234,567", "millions");
assert.strictEqual(uiSync.formatNumber(42), "42", "small number");

// --- formatFlowLabel ---
const label = uiSync.formatFlowLabel({ from: "서울", to: "경기", value: "1000" });
assert.ok(label.includes("서울"), "label includes from");
assert.ok(label.includes("경기"), "label includes to");
assert.ok(label.includes("→"), "label includes arrow");

// --- isFlowMetaValid ---
assert.strictEqual(uiSync.isFlowMetaValid(null), false, "null is invalid");
assert.ok(!uiSync.isFlowMetaValid({}), "empty object is invalid");
assert.ok(!uiSync.isFlowMetaValid({ from: "A", to: "B" }), "missing value is invalid");
assert.ok(
  uiSync.isFlowMetaValid({ from: "A", to: "B", value: "100" }),
  "complete meta is valid"
);

// --- getSystemTheme ---
// In Node.js without window, should return "dark"
const theme = uiSync.getSystemTheme();
assert.strictEqual(theme, "dark", "defaults to dark without window");

console.log("ui_sync.test.js passed");
