#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");
const html = fs.readFileSync("index.html", "utf-8");
const css = fs.readFileSync("styles.css", "utf-8");

// --- Retry logic ---
assert.ok(js.includes("FETCH_MAX_RETRIES"), "retry constant missing");
assert.ok(js.includes("FETCH_BASE_DELAY_MS"), "backoff delay constant missing");
assert.ok(
  /for\s*\(\s*let\s+attempt\s*=\s*0/.test(js),
  "retry loop missing in fetchJson"
);

// --- AbortController ---
assert.ok(js.includes("AbortController"), "AbortController missing");
assert.ok(js.includes("refreshAbortController"), "refresh abort controller missing");
assert.ok(js.includes("signal.aborted"), "abort signal check missing");
assert.ok(
  /loadGeoJson\(signal\)/.test(js),
  "loadGeoJson should receive abort signal"
);
assert.ok(
  /loadOfficeCenters\(signal\)/.test(js),
  "loadOfficeCenters should receive abort signal"
);
assert.ok(
  /fetch\(GEOJSON_PATH,\s*\{\s*signal\s*\}/.test(js),
  "GeoJSON fetch should use abort signal"
);
assert.ok(
  /fetch\(OFFICE_CENTERS_PATH,\s*\{\s*signal\s*\}/.test(js),
  "office centers fetch should use abort signal"
);

// --- Data validation ---
assert.ok(js.includes("validateDataset"), "dataset validation missing");

// --- Error UI ---
assert.ok(html.includes("error-banner"), "error banner element missing");
assert.ok(html.includes("error-message"), "error message element missing");
assert.ok(html.includes("error-retry"), "retry button missing");
assert.ok(js.includes("showError"), "showError function missing");
assert.ok(js.includes("hideError"), "hideError function missing");
assert.ok(js.includes("ERROR_RETRY"), "retry button handler missing");

// --- Error banner styling ---
assert.ok(css.includes(".error-banner"), "error banner CSS missing");
assert.ok(css.includes(".error-banner.is-active"), "error banner active state missing");
assert.ok(css.includes(".error-banner__retry"), "retry button CSS missing");

// --- AbortError handling ---
assert.ok(js.includes('"AbortError"'), "AbortError name check missing");
assert.ok(
  js.includes("error.name === \"AbortError\""),
  "refresh should skip error UI on abort"
);

console.log("error_handling.test.js passed");
