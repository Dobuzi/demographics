#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");
const css = fs.readFileSync("styles.css", "utf-8");
const js = fs.readFileSync("app.js", "utf-8");

// --- ARIA labels on range inputs ---
assert.ok(
  /id="age-range"[^>]*aria-label/.test(html),
  "age-range input should have aria-label"
);
assert.ok(
  /id="year-range"[^>]*aria-label/.test(html),
  "year-range input should have aria-label"
);
assert.ok(
  /id="play-speed"[^>]*aria-label/.test(html),
  "play-speed input should have aria-label"
);

// --- ARIA on play toggle ---
assert.ok(
  /id="play-toggle"[^>]*aria-label/.test(html),
  "play-toggle button should have aria-label"
);

// --- ARIA on error banner ---
assert.ok(
  /id="error-banner"[^>]*role="alert"/.test(html),
  "error banner should have role=alert"
);

// --- Settings toggle ARIA controls ---
assert.ok(
  js.includes('aria-controls'),
  "settings toggle should set aria-controls"
);

// --- Playback toggles ARIA label ---
assert.ok(
  js.includes('setAttribute("aria-label", "일시정지")'),
  "play toggle should set pause aria-label"
);

// --- Focus-visible styles ---
assert.ok(
  css.includes(":focus-visible"),
  "focus-visible styles should exist"
);

// --- Prefers-reduced-motion ---
assert.ok(
  css.includes("prefers-reduced-motion"),
  "prefers-reduced-motion media query should exist"
);
assert.ok(
  /prefers-reduced-motion[\s\S]*animation:\s*none/.test(css),
  "reduced motion should disable animations"
);

// --- SVG has role and aria-label ---
assert.ok(
  /role="img"/.test(html),
  "SVG should have role=img"
);
assert.ok(
  /aria-label="인구 이동 지도"/.test(html),
  "SVG should have descriptive aria-label"
);

// --- Semantic HTML check ---
assert.ok(html.includes("<main"), "should use main element");
assert.ok(html.includes("<footer"), "should use footer element");
assert.ok(html.includes('<html lang="ko"'), "should declare language");

console.log("accessibility.test.js passed");
