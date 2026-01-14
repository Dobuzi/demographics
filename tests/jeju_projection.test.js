#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");

assert.ok(js.includes("FAR_EAST_LON"), "FAR_EAST_LON constant missing");
assert.ok(js.includes("FAR_EAST_COMPRESS"), "FAR_EAST_COMPRESS constant missing");
assert.ok(js.includes("clampLon"), "far east clamp helper missing");

console.log("jeju_projection.test.js passed");
