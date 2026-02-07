/**
 * Test flow detail modal with historical comparison
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "..", "index.html");
const appPath = path.join(__dirname, "..", "app.js");
const cssPath = path.join(__dirname, "..", "styles.css");

const html = fs.readFileSync(indexPath, "utf8");
const js = fs.readFileSync(appPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");

/* Verify modal HTML element exists */
assert.ok(
  html.includes("flow-modal") || html.includes("detail-modal"),
  "HTML should have flow detail modal element"
);

/* Verify modal open/close functions */
assert.ok(
  js.includes("openFlowModal") || js.includes("showFlowModal"),
  "app.js should have function to open flow modal"
);

assert.ok(
  js.includes("closeFlowModal") || js.includes("hideFlowModal"),
  "app.js should have function to close flow modal"
);

/* Verify modal CSS styles */
assert.ok(
  css.includes(".flow-modal") || css.includes(".detail-modal"),
  "CSS should have modal styles"
);

console.log("flow_modal.test.js passed");
