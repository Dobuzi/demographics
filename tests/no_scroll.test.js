#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const css = fs.readFileSync("styles.css", "utf-8");

assert.ok(css.includes("body {\n  margin: 0;"), "body block missing");
assert.ok(css.includes("overflow: hidden"), "overflow hidden missing");
assert.ok(css.includes(".page {") && css.includes("height: 100vh"), "page height missing");
assert.ok(
  /\.map-stage\s*{[^}]*flex:\s*1[^}]*min-height:\s*0/m.test(css),
  "map-stage should flex without forcing scroll"
);
assert.ok(
  /\.map-wrap\s*{[^}]*min-height:\s*0/m.test(css),
  "map-wrap should avoid fixed min-height"
);

console.log("no_scroll.test.js passed");
