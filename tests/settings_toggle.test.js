#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");
const js = fs.readFileSync("app.js", "utf-8");

assert.ok(html.includes("settings-toggle"), "settings toggle button missing");
assert.ok(html.includes("settings-panel"), "settings panel missing");
assert.ok(js.includes("settings-toggle"), "settings toggle handler missing");
assert.ok(!js.includes("SETTINGS_TOGGLE.textContent"), "settings toggle should not replace icon text");
assert.ok(js.includes("aria-label"), "settings toggle should update aria-label");

console.log("settings_toggle.test.js passed");
