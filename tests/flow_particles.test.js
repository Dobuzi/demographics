/**
 * Test animated flow particles along paths
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "..", "styles.css");
const appPath = path.join(__dirname, "..", "app.js");

const css = fs.readFileSync(cssPath, "utf8");
const js = fs.readFileSync(appPath, "utf8");

/* Verify particle animation keyframes */
assert.ok(
  css.includes("@keyframes particle") || css.includes("flow-particle"),
  "CSS should have particle animation keyframes"
);

/* Verify particle class styles */
assert.ok(
  css.includes(".flow-particle") || css.includes(".particle"),
  "CSS should have particle class styles"
);

/* Verify particle creation in JavaScript */
assert.ok(
  js.includes("particle") || js.includes("createParticle"),
  "app.js should have particle creation logic"
);

/* Verify animateMotion or path-based animation */
assert.ok(
  js.includes("animateMotion") || js.includes("getPointAtLength") || js.includes("particleAnimation"),
  "app.js should animate particles along paths"
);

console.log("flow_particles.test.js passed");
