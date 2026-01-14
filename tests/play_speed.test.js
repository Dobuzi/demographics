#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");
const js = fs.readFileSync("app.js", "utf-8");

assert.ok(html.includes('id="play-speed"'), "play speed slider missing");
assert.ok(html.includes('id="play-speed-label"'), "play speed label missing");
assert.ok(js.includes("PLAY_SPEED"), "PLAY_SPEED not referenced in JS");

console.log("play_speed.test.js passed");
