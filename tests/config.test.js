#!/usr/bin/env node
const assert = require("assert");

const {
  DATA,
  FETCH,
  CACHE,
  PLAYBACK,
  ZOOM,
  VIEWBOX,
  GEO,
  UI,
  getBaseViewBox,
} = require("../geo/config");

// --- DATA config ---
assert.strictEqual(typeof DATA.MERGED_FILENAME, "string", "MERGED_FILENAME should be string");
assert.strictEqual(DATA.MERGED_FILENAME, "kosis_all.json.gz", "merged filename");
assert.strictEqual(DATA.GEOJSON_PATH, "assets/geo/korea_sido.geojson", "geojson path");
assert.strictEqual(DATA.OFFICE_CENTERS_PATH, "assets/geo/sido_office_centers.json", "office centers path");
assert.strictEqual(DATA.DEFAULT_MONTH, "11", "default month");

// --- FETCH config ---
assert.strictEqual(FETCH.MAX_RETRIES, 3, "max retries");
assert.strictEqual(FETCH.BASE_DELAY_MS, 1000, "base delay");

// --- CACHE config ---
assert.strictEqual(CACHE.MAX_ENTRIES, 12, "max cache entries");

// --- PLAYBACK config ---
assert.strictEqual(PLAYBACK.YEAR_INTERVAL_MS, 1000, "year interval");
assert.strictEqual(PLAYBACK.MONTH_INTERVAL_MS, 700, "month interval");

// --- ZOOM config ---
assert.strictEqual(ZOOM.MIN, 0.5, "zoom min");
assert.strictEqual(ZOOM.MAX, 4, "zoom max");
assert.strictEqual(ZOOM.STEP, 0.25, "zoom step");

// --- VIEWBOX config ---
assert.strictEqual(VIEWBOX.X, -40, "viewbox x");
assert.strictEqual(VIEWBOX.Y, 0, "viewbox y");
assert.strictEqual(VIEWBOX.WIDTH, 980, "viewbox width");
assert.strictEqual(VIEWBOX.HEIGHT, 780, "viewbox height");

// --- GEO config ---
assert.strictEqual(GEO.FAR_EAST_LON, 130.0, "far east lon");
assert.strictEqual(GEO.FAR_EAST_COMPRESS, 0.25, "far east compress");
assert.strictEqual(GEO.MAP_WIDTH, 900, "map width");
assert.strictEqual(GEO.MAP_HEIGHT, 780, "map height");
assert.strictEqual(GEO.PADDING, 30, "padding");

// --- UI config ---
assert.strictEqual(UI.TOP_FLOW_COUNT, 3, "top flow count");
assert.strictEqual(UI.SWIPE_THRESHOLD, 50, "swipe threshold");
assert.strictEqual(UI.FLOW_TRANSITION_MS, 150, "flow transition");

// --- getBaseViewBox ---
const vb = getBaseViewBox();
assert.strictEqual(vb.x, VIEWBOX.X, "base viewbox x");
assert.strictEqual(vb.y, VIEWBOX.Y, "base viewbox y");
assert.strictEqual(vb.w, VIEWBOX.WIDTH, "base viewbox w");
assert.strictEqual(vb.h, VIEWBOX.HEIGHT, "base viewbox h");

console.log("config.test.js passed");
