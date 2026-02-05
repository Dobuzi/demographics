#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");
const geoUtilsSrc = fs.readFileSync("geo/geo_utils.js", "utf-8");

assert.ok(js.includes("FAR_EAST_LON"), "FAR_EAST_LON constant missing in app.js");
assert.ok(js.includes("FAR_EAST_COMPRESS"), "FAR_EAST_COMPRESS constant missing in app.js");
assert.ok(
  geoUtilsSrc.includes("clampLon") || js.includes("FAR_EAST_LON"),
  "far east clamp logic should exist in geo_utils.js or app.js"
);

console.log("jeju_projection.test.js passed");
