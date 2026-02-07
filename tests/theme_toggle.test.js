/**
 * Test light/dark theme toggle with system preference detection
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "..", "styles.css");
const appPath = path.join(__dirname, "..", "app.js");
const indexPath = path.join(__dirname, "..", "index.html");

const css = fs.readFileSync(cssPath, "utf8");
const js = fs.readFileSync(appPath, "utf8");
const html = fs.readFileSync(indexPath, "utf8");

/* Verify light theme CSS variables exist */
assert.ok(
  css.includes("[data-theme=\"light\"]") || css.includes(".theme-light"),
  "CSS should have light theme styles"
);

/* Verify theme toggle button in HTML */
assert.ok(
  html.includes("theme-toggle") || html.includes("dark_mode") || html.includes("light_mode"),
  "HTML should have theme toggle button"
);

/* Verify theme toggle function in JavaScript */
assert.ok(
  js.includes("toggleTheme") || js.includes("setTheme"),
  "app.js should have theme toggle function"
);

/* Verify system preference detection */
assert.ok(
  js.includes("prefers-color-scheme") || js.includes("matchMedia"),
  "app.js should detect system color scheme preference"
);

/* Verify localStorage for theme persistence */
assert.ok(
  js.includes("localStorage") && js.includes("theme"),
  "app.js should persist theme preference in localStorage"
);

console.log("theme_toggle.test.js passed");
