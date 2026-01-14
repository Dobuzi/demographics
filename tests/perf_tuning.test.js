#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");

assert.ok(js.includes("PLAY_INTERVAL_MS"), "PLAY_INTERVAL_MS missing");
assert.ok(js.includes("MAX_CACHE_ENTRIES"), "MAX_CACHE_ENTRIES missing");
assert.ok(js.includes("setCacheEntry"), "setCacheEntry helper missing");
assert.ok(js.includes("runPlaybackLoop"), "runPlaybackLoop helper missing");

console.log("perf_tuning.test.js passed");
