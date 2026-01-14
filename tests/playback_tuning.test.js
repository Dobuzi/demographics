#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");

assert.ok(js.includes("PLAY_INTERVAL_YEAR_MS"), "year interval constant missing");
assert.ok(js.includes("PLAY_INTERVAL_MONTH_MS"), "month interval constant missing");
assert.ok(js.includes("getPlaybackInterval"), "playback interval helper missing");
assert.ok(js.includes("getPrefetchCount"), "prefetch count helper missing");

console.log("playback_tuning.test.js passed");
