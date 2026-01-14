#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const css = fs.readFileSync("styles.css", "utf-8");
const js = fs.readFileSync("app.js", "utf-8");

assert.ok(css.includes(".region-shape"), "region transition styles missing");
assert.ok(css.includes("transition"), "transition styles missing");

console.log("map_transition.test.js passed");
