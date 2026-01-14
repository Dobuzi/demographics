#!/usr/bin/env node
const assert = require("assert");
const data = require("../assets/geo/sido_office_centers.json");

const requiredCodes = [
  "11",
  "26",
  "27",
  "28",
  "29",
  "30",
  "31",
  "36",
  "41",
  "43",
  "44",
  "46",
  "47",
  "48",
  "50",
  "51",
  "52",
];

assert.ok(Array.isArray(data), "office centers should be an array");
requiredCodes.forEach((code) => {
  const entry = data.find((item) => item.code === code);
  assert.ok(entry, `missing code ${code}`);
  assert.ok(Number.isFinite(entry.lat), `invalid lat for ${code}`);
  assert.ok(Number.isFinite(entry.lon), `invalid lon for ${code}`);
});

console.log("office_centers.test.js passed");
