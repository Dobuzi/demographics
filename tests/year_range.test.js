#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");

assert.ok(html.includes('id="year-range"'), "year range input missing");
assert.ok(html.includes('min="1995"'), "year range min should be 1995");

console.log("year_range.test.js passed");
