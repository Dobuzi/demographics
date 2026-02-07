/**
 * Test i18n support for language switching
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const i18nPath = path.join(__dirname, "..", "geo", "i18n.js");
const indexPath = path.join(__dirname, "..", "index.html");
const appPath = path.join(__dirname, "..", "app.js");

/* Verify i18n.js module exists */
assert.ok(fs.existsSync(i18nPath), "i18n.js module should exist");

const i18n = require(i18nPath);

/* Verify translations for both languages */
assert.ok(i18n.translations, "translations object should exist");
assert.ok(i18n.translations.ko, "Korean translations should exist");
assert.ok(i18n.translations.en, "English translations should exist");

/* Verify core translation keys exist */
const requiredKeys = ["title", "totalFlow", "ageLabel", "play", "pause"];
requiredKeys.forEach((key) => {
  assert.ok(
    i18n.translations.ko[key],
    `Korean translation for "${key}" should exist`
  );
  assert.ok(
    i18n.translations.en[key],
    `English translation for "${key}" should exist`
  );
});

/* Verify translate function */
assert.ok(typeof i18n.t === "function", "t() translation function should exist");
assert.ok(typeof i18n.setLocale === "function", "setLocale() should exist");
assert.ok(typeof i18n.getLocale === "function", "getLocale() should exist");

/* Test translation function */
i18n.setLocale("ko");
assert.strictEqual(i18n.getLocale(), "ko", "getLocale should return current locale");

i18n.setLocale("en");
assert.strictEqual(i18n.getLocale(), "en", "locale should be changeable to English");

/* Verify language switcher in HTML */
const html = fs.readFileSync(indexPath, "utf8");
assert.ok(
  html.includes("lang-switch") || html.includes("language"),
  "HTML should have language switcher element"
);

console.log("i18n.test.js passed");
