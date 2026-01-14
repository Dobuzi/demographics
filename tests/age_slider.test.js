#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");
const js = fs.readFileSync("app.js", "utf-8");

assert.ok(html.includes('id="age-range"'), "age range input missing");
assert.ok(html.includes('id="age-value"'), "age value missing");
assert.ok(!html.includes('id="age-select"'), "age select should be removed");
assert.ok(js.includes("AGE_RANGE"), "AGE_RANGE not referenced in JS");

console.log("age_slider.test.js passed");
