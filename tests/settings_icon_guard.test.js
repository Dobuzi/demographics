#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");

assert.ok(js.includes("ensureSettingsIcon"), "settings icon guard missing");
assert.ok(
  js.includes("material-symbols-rounded"),
  "settings icon class should be enforced"
);

console.log("settings_icon_guard.test.js passed");
