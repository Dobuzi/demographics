#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");

assert.ok(!html.includes('id="year-range"') || html.indexOf('id="year-range"') < html.indexOf('id="settings-panel"'), "year slider should be in summary, not settings");
assert.ok(!html.includes("age-range") || html.indexOf('id="age-range"') < html.indexOf('id="settings-panel"'), "age slider should be in summary, not settings");
assert.ok(html.includes("stat-total"), "total stat missing");

console.log("settings_layout_refresh.test.js passed");
