#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");
const js = fs.readFileSync("app.js", "utf-8");

assert.ok(html.includes('id="play-toggle"'), "play toggle button missing");
assert.ok(js.includes("togglePlayback"), "togglePlayback handler missing");
assert.ok(js.includes("playState"), "playState state missing");

console.log("play_toggle.test.js passed");
