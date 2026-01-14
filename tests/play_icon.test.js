#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");
const js = fs.readFileSync("app.js", "utf-8");

assert.ok(html.includes("material-symbols-rounded"), "material symbols font missing");
assert.ok(js.includes("play_arrow") && js.includes("pause"), "play/pause symbols missing in JS");

console.log("play_icon.test.js passed");
