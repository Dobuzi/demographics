#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");
const js = fs.readFileSync("app.js", "utf-8");

assert.ok(
  html.includes("KOSIS_USE_MERGED"),
  "index should enable merged data for hosted dataset"
);
assert.ok(
  html.includes("KOSIS_DATA_BASE_URL"),
  "index should define a data base URL"
);
assert.ok(
  js.includes("KOSIS_DATA_BASE_URL"),
  "app should read the data base URL"
);
assert.ok(
  js.includes("kosis_all.json.gz"),
  "app should fetch merged gzip data file"
);
assert.ok(
  js.includes("DecompressionStream"),
  "app should support gzip decompression"
);

console.log("data_hosting.test.js passed");
