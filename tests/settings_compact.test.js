#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");

assert.ok(html.includes("controls is-compact"), "compact controls class missing");
assert.ok(html.includes("field-sex"), "sex field class missing");
assert.ok(html.includes("field-item"), "item field class missing");
assert.ok(html.includes("field-speed"), "speed field class missing");

console.log("settings_compact.test.js passed");
