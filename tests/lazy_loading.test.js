#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");
const js = fs.readFileSync("app.js", "utf-8");

// --- Preload hints for GeoJSON assets ---
assert.ok(
  html.includes('rel="preload"') && html.includes("korea_sido.geojson"),
  "GeoJSON should have preload link"
);
assert.ok(
  html.includes('rel="preload"') && html.includes("sido_office_centers.json"),
  "Office centers should have preload link"
);
assert.ok(
  html.includes('as="fetch"'),
  "Preload should use as=fetch for JSON"
);

// --- Deferred initial refresh ---
assert.ok(
  js.includes("requestIdleCallback"),
  "init should use requestIdleCallback for deferred loading"
);
assert.ok(
  js.includes("deferredRefresh"),
  "init should have deferred refresh function"
);
assert.ok(
  /setTimeout\(deferredRefresh/.test(js),
  "init should have setTimeout fallback for requestIdleCallback"
);

// --- GeoJSON caching ---
assert.ok(
  js.includes("if (geoIndex) return geoIndex"),
  "loadGeoJson should cache result"
);
assert.ok(
  js.includes("if (officeCenters) return officeCenters"),
  "loadOfficeCenters should cache result"
);

console.log("lazy_loading.test.js passed");
