/**
 * Test PWA manifest configuration
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const manifestPath = path.join(__dirname, "..", "manifest.json");
const indexPath = path.join(__dirname, "..", "index.html");

/* Verify manifest.json exists */
assert.ok(fs.existsSync(manifestPath), "manifest.json should exist");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

/* Verify required PWA fields */
assert.ok(manifest.name, "manifest should have name");
assert.ok(manifest.short_name, "manifest should have short_name");
assert.ok(manifest.start_url, "manifest should have start_url");
assert.ok(manifest.display, "manifest should have display mode");
assert.ok(manifest.background_color, "manifest should have background_color");
assert.ok(manifest.theme_color, "manifest should have theme_color");
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0, "manifest should have icons array");

/* Verify icons have required properties */
manifest.icons.forEach((icon, index) => {
  assert.ok(icon.src, `icon ${index} should have src`);
  assert.ok(icon.sizes, `icon ${index} should have sizes`);
  assert.ok(icon.type, `icon ${index} should have type`);
});

/* Verify index.html links to manifest */
const html = fs.readFileSync(indexPath, "utf8");
assert.ok(
  html.includes('rel="manifest"') && html.includes("manifest.json"),
  "index.html should link to manifest.json"
);

/* Verify theme-color meta tag */
assert.ok(
  html.includes('name="theme-color"'),
  "index.html should have theme-color meta tag"
);

console.log("pwa_manifest.test.js passed");
