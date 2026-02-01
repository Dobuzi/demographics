#!/usr/bin/env node
const assert = require("assert");

const {
  AGE_GROUPS,
  REQUIRED_ROW_KEYS,
  MIN_DATASET_ROWS,
  validateRow,
  validateDataset,
  parseDT,
  buildCacheKey,
  buildTimeline,
  getPlaybackInterval,
  getPrefetchCount,
  getAgeIndex,
  formatNumber,
} = require("../geo/data_utils");

// --- AGE_GROUPS ---
assert.ok(Array.isArray(AGE_GROUPS), "AGE_GROUPS should be an array");
assert.strictEqual(AGE_GROUPS.length, 18, "should have 18 age groups");
assert.strictEqual(AGE_GROUPS[0].code, "000", "first group is all ages");
assert.strictEqual(AGE_GROUPS[17].code, "340", "last group is 80+");

// --- validateRow ---
assert.strictEqual(validateRow(null), false, "null row is invalid");
assert.strictEqual(validateRow({}), false, "empty object is invalid");
assert.strictEqual(validateRow("string"), false, "string is invalid");
assert.strictEqual(
  validateRow({ ITM_ID: "T70", C1: "11", C2: "26", C3: "0", C4: "000", DT: "100" }),
  true,
  "complete row is valid"
);
assert.strictEqual(
  validateRow({ ITM_ID: "T70", C1: "11" }),
  false,
  "partial row is invalid"
);

// --- validateDataset ---
assert.strictEqual(validateDataset(null).valid, false, "null dataset is invalid");
assert.strictEqual(validateDataset("string").valid, false, "string dataset is invalid");
assert.strictEqual(validateDataset([]).valid, false, "empty array is invalid");

const validRow = { ITM_ID: "T70", C1: "11", C2: "26", C3: "0", C4: "000", DT: "100" };
const smallDataset = Array(MIN_DATASET_ROWS).fill(validRow);
assert.strictEqual(validateDataset(smallDataset).valid, true, "minimum-size valid dataset");

const badDataset = [validRow, validRow, { bad: true }, validRow, validRow];
// Dataset under min count but first rows valid; still fails on count
const tinyBad = Array(MIN_DATASET_ROWS - 1).fill(validRow);
assert.strictEqual(tinyBad.length < MIN_DATASET_ROWS, true);
assert.strictEqual(validateDataset(tinyBad).valid, false, "below minimum row count");

// Dataset with invalid row in sample range
const mixedDataset = Array(MIN_DATASET_ROWS + 5).fill(validRow);
mixedDataset[2] = { bad: true };
assert.strictEqual(validateDataset(mixedDataset).valid, false, "invalid row in sample fails");

// --- parseDT ---
assert.strictEqual(parseDT("1,234"), 1234, "parses comma-separated numbers");
assert.strictEqual(parseDT("0"), 0, "parses zero");
assert.strictEqual(parseDT("100"), 100, "parses plain number");
assert.strictEqual(parseDT("-500"), -500, "parses negative");
assert.strictEqual(parseDT(null), 0, "null returns 0");
assert.strictEqual(parseDT(undefined), 0, "undefined returns 0");
assert.strictEqual(parseDT("abc"), 0, "non-numeric returns 0");
assert.strictEqual(parseDT(""), 0, "empty string returns 0");

// --- buildCacheKey ---
assert.strictEqual(buildCacheKey(2024, null), "2024", "year-only key");
assert.strictEqual(buildCacheKey(2025, "03"), "202503", "year+month key");
assert.strictEqual(buildCacheKey(2025, ""), "2025", "empty month treated as year-only");

// --- buildTimeline ---
const timeline = buildTimeline();
assert.ok(Array.isArray(timeline), "timeline is an array");
assert.strictEqual(timeline[0].year, 1995, "starts at 1995");
assert.strictEqual(timeline[0].month, null, "years have null month");
const lastYear = timeline.filter((t) => t.month === null);
assert.strictEqual(lastYear[lastYear.length - 1].year, 2024, "last year entry is 2024");
const months = timeline.filter((t) => t.month !== null);
assert.strictEqual(months.length, 11, "11 months for 2025");
assert.strictEqual(months[0].year, 2025, "monthly entries are 2025");
assert.strictEqual(months[0].month, "01", "first month is 01");
assert.strictEqual(months[10].month, "11", "last month is 11");
assert.strictEqual(timeline.length, 30 + 11, "30 years + 11 months = 41 entries");

// Custom timeline
const custom = buildTimeline(2020, 2022, 2023, 3);
assert.strictEqual(custom.length, 3 + 3, "custom: 3 years + 3 months");
assert.strictEqual(custom[0].year, 2020);
assert.strictEqual(custom[3].year, 2023);
assert.strictEqual(custom[3].month, "01");

// --- getPlaybackInterval ---
assert.strictEqual(getPlaybackInterval({ year: 2020, month: null }, 1), 1000, "year at 1x = 1000ms");
assert.strictEqual(getPlaybackInterval({ year: 2025, month: "03" }, 1), 700, "month at 1x = 700ms");
assert.strictEqual(getPlaybackInterval({ year: 2020, month: null }, 2), 500, "year at 2x = 500ms");
assert.strictEqual(getPlaybackInterval({ year: 2020, month: null }, 10), 300, "clamped to 300ms minimum");
assert.strictEqual(getPlaybackInterval(null, 1), 1000, "null period defaults to year interval");

// --- getPrefetchCount ---
assert.strictEqual(getPrefetchCount(null), 3, "no connection info = 3");
assert.strictEqual(getPrefetchCount({ saveData: true }), 1, "save data mode = 1");
assert.strictEqual(getPrefetchCount({ downlink: 1 }), 1, "slow connection = 1");
assert.strictEqual(getPrefetchCount({ downlink: 10 }), 4, "fast connection = 4");
assert.strictEqual(getPrefetchCount({ downlink: 3 }), 3, "medium connection = 3");

// --- getAgeIndex ---
assert.strictEqual(getAgeIndex(0), 0, "index 0");
assert.strictEqual(getAgeIndex(17), 17, "index 17 (max)");
assert.strictEqual(getAgeIndex(99), 17, "clamped to max");
assert.strictEqual(getAgeIndex(-1), 0, "clamped to 0");
assert.strictEqual(getAgeIndex("5"), 5, "string coerced");
assert.strictEqual(getAgeIndex("abc"), 0, "NaN defaults to 0");

// --- formatNumber ---
assert.strictEqual(formatNumber(0), "0", "zero");
assert.strictEqual(formatNumber(1234567), "1,234,567", "millions");
assert.strictEqual(formatNumber(42), "42", "small number");

console.log("data_utils.test.js passed");
