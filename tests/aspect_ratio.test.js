#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");
const css = fs.readFileSync("styles.css", "utf-8");

assert.ok(
  html.includes('preserveAspectRatio="xMidYMid meet"'),
  "map svg should use meet preserveAspectRatio"
);
assert.ok(
  html.includes('viewBox="-40 0 980 780"'),
  "map svg should include horizontal padding in viewBox"
);
assert.ok(
  /@media \(max-width: 640px\)[\s\S]*#flow-map\s*{[^}]*transform:\s*scale\(/m.test(css),
  "mobile map should apply a zoom transform"
);
assert.ok(
  css.includes("scale(1.6)"),
  "mobile map should zoom to 1.6x"
);

console.log("aspect_ratio.test.js passed");
