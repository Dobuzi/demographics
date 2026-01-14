#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");
const js = fs.readFileSync("app.js", "utf-8");

assert.ok(html.includes('id="play-loading"'), "play loading indicator missing");
assert.ok(js.includes("PLAY_LOADING"), "PLAY_LOADING reference missing");

console.log("loading_indicator.test.js passed");
