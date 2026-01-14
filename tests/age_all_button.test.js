#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");
const js = fs.readFileSync("app.js", "utf-8");

assert.ok(!html.includes('id="age-all"'), "age all button should be removed");
assert.ok(js.includes("toggleAgeAll"), "toggleAgeAll helper missing");

console.log("age_all_button.test.js passed");
