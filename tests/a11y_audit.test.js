#!/usr/bin/env node
/**
 * Comprehensive accessibility audit — structural validation.
 * Checks ARIA patterns, keyboard support, contrast considerations,
 * form labeling, interactive element roles, and heading hierarchy.
 * No external dependencies (runs with Node.js assert only).
 */
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");
const css = fs.readFileSync("styles.css", "utf-8");
const js = fs.readFileSync("app.js", "utf-8");

// ─── Document-level accessibility ───

assert.ok(
  html.includes('lang="ko"'),
  "html element should declare language"
);
assert.ok(
  html.includes("<title>"),
  "page should have a title element"
);
assert.ok(
  html.includes('name="viewport"'),
  "page should have viewport meta for mobile accessibility"
);

// ─── Landmark regions ───

assert.ok(html.includes("<main"), "page should have <main> landmark");
assert.ok(html.includes("<footer"), "page should have <footer> landmark");
assert.ok(html.includes("<section"), "page should use <section> elements");

// ─── Heading hierarchy ───

assert.ok(
  /<h1[^>]*>/.test(html),
  "page should have an h1 heading"
);
assert.ok(
  /<h2[^>]*>/.test(html),
  "page should have h2 headings"
);

// ─── All buttons have accessible names ───

// Extract all <button> tags and check each has text content or aria-label
const buttonRegex = /<button[^>]*>[\s\S]*?<\/button>/g;
const buttons = html.match(buttonRegex) || [];
assert.ok(buttons.length >= 3, "page should have at least 3 buttons");

buttons.forEach((btn, i) => {
  const hasAriaLabel = /aria-label="[^"]+?"/.test(btn);
  const hasTextContent = /<button[^>]*>[^<]*\S[^<]*/.test(btn) ||
    /<button[^>]*>[\s\S]*?<span[^>]*>[^<]+<\/span>/.test(btn);
  assert.ok(
    hasAriaLabel || hasTextContent,
    `button ${i} should have an accessible name (aria-label or text content)`
  );
});

// ─── All inputs have labels or aria-label ───

const inputRegex = /<input[^>]*>/g;
const inputs = html.match(inputRegex) || [];
assert.ok(inputs.length >= 3, "page should have at least 3 inputs");

inputs.forEach((input, i) => {
  const hasAriaLabel = /aria-label="[^"]+?"/.test(input);
  const idMatch = input.match(/id="([^"]+)"/);
  let hasAssociatedLabel = false;
  if (idMatch) {
    const labelPattern = new RegExp(`for="${idMatch[1]}"|<label[^>]*>[\\s\\S]*?id="${idMatch[1]}"`);
    // Also check if input is inside a <label> element
    const inputId = idMatch[1];
    const labelWraps = new RegExp(`<label[^>]*>[\\s\\S]*?id="${inputId}"[\\s\\S]*?<\\/label>`);
    hasAssociatedLabel = labelPattern.test(html) || labelWraps.test(html);
  }
  assert.ok(
    hasAriaLabel || hasAssociatedLabel,
    `input ${i} should have aria-label or associated label`
  );
});

// ─── Select elements have labels ───

const selectRegex = /<select[^>]*id="([^"]+)"[^>]*>/g;
let selectMatch;
while ((selectMatch = selectRegex.exec(html)) !== null) {
  const selectId = selectMatch[1];
  const labelWraps = new RegExp(`<label[^>]*>[\\s\\S]*?id="${selectId}"[\\s\\S]*?<\\/label>`);
  assert.ok(
    labelWraps.test(html),
    `select#${selectId} should be inside a <label> element`
  );
}

// ─── ARIA attributes ───

// role="alert" for error messaging
assert.ok(
  /role="alert"/.test(html),
  "error banner should have role=alert"
);

// aria-live for dynamic content
assert.ok(
  /aria-live="assertive"/.test(html),
  "error banner should have aria-live=assertive"
);

// role="status" for tooltips
assert.ok(
  /role="status"/.test(html),
  "tooltips should have role=status"
);

// role="img" for SVG
assert.ok(
  /role="img"/.test(html),
  "SVG map should have role=img"
);

// aria-label on SVG
assert.ok(
  /id="flow-map"[\s\S]*?aria-label/.test(html),
  "SVG map should have aria-label"
);

// aria-hidden on decorative elements
assert.ok(
  /aria-hidden="true"/.test(html),
  "decorative elements should have aria-hidden"
);

// ─── Settings panel ARIA ───

assert.ok(
  js.includes('aria-expanded'),
  "settings toggle should manage aria-expanded"
);
assert.ok(
  js.includes('aria-controls'),
  "settings toggle should set aria-controls"
);

// ─── Keyboard support in JS ───

assert.ok(
  js.includes('"Escape"') || js.includes("'Escape'"),
  "should handle Escape key for closing panels"
);
assert.ok(
  js.includes("keydown"),
  "should listen for keydown events"
);

// ─── Focus management ───

assert.ok(
  css.includes(":focus-visible"),
  "should have :focus-visible styles"
);

// Check outline is defined for focus-visible
assert.ok(
  /focus-visible[\s\S]*?outline/.test(css),
  ":focus-visible should define outline style"
);

// Check outline-offset for usability
assert.ok(
  /focus-visible[\s\S]*?outline-offset/.test(css),
  ":focus-visible should set outline-offset"
);

// ─── Motion sensitivity ───

assert.ok(
  css.includes("prefers-reduced-motion"),
  "should respect prefers-reduced-motion"
);

// Check that reduced motion disables animations
assert.ok(
  /prefers-reduced-motion[\s\S]*?animation:\s*none/.test(css),
  "reduced motion should disable animations"
);

// Check that reduced motion disables transitions
assert.ok(
  /prefers-reduced-motion[\s\S]*?transition:\s*none/.test(css),
  "reduced motion should disable transitions"
);

// ─── Color contrast considerations ───

// Check that text colors use high-contrast values (not pure transparent)
assert.ok(
  css.includes("--ink: #f5f6f8") || css.includes("--ink: #fff"),
  "primary text color should be near-white for dark theme"
);

// Check that interactive elements have visible borders
assert.ok(
  /\.play-toggle[\s\S]*?border:/.test(css),
  "play toggle should have a visible border"
);
assert.ok(
  /\.settings-toggle[\s\S]*?border:/.test(css),
  "settings toggle should have a visible border"
);

// ─── No tabindex anti-patterns ───

// Ensure no positive tabindex values (only 0 or -1 are acceptable)
const tabindexRegex = /tabindex="(\d+)"/g;
let tabMatch;
while ((tabMatch = tabindexRegex.exec(html)) !== null) {
  const value = parseInt(tabMatch[1], 10);
  assert.ok(
    value <= 0,
    `tabindex="${value}" is an anti-pattern; use 0 or -1 only`
  );
}

// ─── Images and media ───

// SVG map has aria-label (already checked above, but verify it's descriptive)
const svgAriaLabel = html.match(/id="flow-map"[\s\S]*?aria-label="([^"]+)"/);
assert.ok(svgAriaLabel, "SVG should have aria-label");
assert.ok(
  svgAriaLabel[1].length > 3,
  "SVG aria-label should be descriptive (not empty/short)"
);

// ─── Link accessibility ───

// External links should have rel="noopener noreferrer"
const externalLinks = html.match(/<a[^>]*target="_blank"[^>]*>/g) || [];
externalLinks.forEach((link, i) => {
  assert.ok(
    link.includes("noopener"),
    `external link ${i} should have rel="noopener"`
  );
});

// ─── Form semantics ───

// Ordered list for ranked items
assert.ok(
  html.includes("<ol"),
  "top flows should use <ol> for ranked list"
);

// Buttons use type="button" to prevent form submission
const typeButtons = (html.match(/type="button"/g) || []).length;
assert.ok(
  typeButtons >= 3,
  "interactive buttons should have type='button' to prevent accidental form submission"
);

console.log("a11y_audit.test.js passed");
