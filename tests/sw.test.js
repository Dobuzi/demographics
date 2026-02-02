#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const sw = fs.readFileSync("sw.js", "utf-8");
const html = fs.readFileSync("index.html", "utf-8");

// --- Service Worker file exists and has expected structure ---
assert.ok(sw.length > 100, "sw.js should not be empty");

// --- Cache name constant ---
assert.ok(
  sw.includes('CACHE_NAME'),
  "sw.js should define a CACHE_NAME constant"
);

// --- Static assets list includes core files ---
assert.ok(
  sw.includes("index.html"),
  "static assets should include index.html"
);
assert.ok(
  sw.includes("app.js"),
  "static assets should include app.js"
);
assert.ok(
  sw.includes("styles.css"),
  "static assets should include styles.css"
);
assert.ok(
  sw.includes("korea_sido.geojson"),
  "static assets should include GeoJSON"
);
assert.ok(
  sw.includes("sido_office_centers.json"),
  "static assets should include office centers"
);
assert.ok(
  sw.includes("data_utils.js"),
  "static assets should include data_utils.js"
);
assert.ok(
  sw.includes("data_processing.js"),
  "static assets should include data_processing.js"
);

// --- Event listeners ---
assert.ok(
  sw.includes('"install"'),
  "sw.js should handle install event"
);
assert.ok(
  sw.includes('"activate"'),
  "sw.js should handle activate event"
);
assert.ok(
  sw.includes('"fetch"'),
  "sw.js should handle fetch event"
);

// --- Cache strategies ---
assert.ok(
  sw.includes("skipWaiting"),
  "sw.js should call skipWaiting on install"
);
assert.ok(
  sw.includes("clients.claim"),
  "sw.js should call clients.claim on activate"
);

// --- Data cache management ---
assert.ok(
  sw.includes("MAX_DATA_ENTRIES"),
  "sw.js should define MAX_DATA_ENTRIES for cache trimming"
);
assert.ok(
  sw.includes("trimDataCache"),
  "sw.js should implement data cache trimming"
);

// --- isDataRequest checks for KOSIS files ---
assert.ok(
  sw.includes("isDataRequest"),
  "sw.js should have isDataRequest helper"
);
assert.ok(
  sw.includes("kosis_"),
  "isDataRequest should match kosis_ files"
);

// --- Old cache cleanup ---
assert.ok(
  /caches\.keys\(\)/.test(sw),
  "activate should enumerate caches for cleanup"
);
assert.ok(
  /caches\.delete/.test(sw),
  "activate should delete old caches"
);

// --- Registration in index.html ---
assert.ok(
  html.includes("serviceWorker"),
  "index.html should reference serviceWorker"
);
assert.ok(
  html.includes("sw.js"),
  "index.html should register sw.js"
);

console.log("sw.test.js passed");
