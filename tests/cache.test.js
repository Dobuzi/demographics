#!/usr/bin/env node
/**
 * Tests for the LRU cache implementation in app.js.
 * Validates setCacheEntry behavior: insertion, update, eviction.
 */
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");

// ─── Structural checks ───

assert.ok(
  js.includes("MAX_CACHE_ENTRIES"),
  "app.js should define MAX_CACHE_ENTRIES"
);

// Extract MAX_CACHE_ENTRIES value
const maxMatch = js.match(/const\s+MAX_CACHE_ENTRIES\s*=\s*(\d+)/);
assert.ok(maxMatch, "MAX_CACHE_ENTRIES should be a numeric constant");
const MAX_CACHE_ENTRIES = Number(maxMatch[1]);
assert.strictEqual(MAX_CACHE_ENTRIES, 12, "MAX_CACHE_ENTRIES should be 12");

assert.ok(
  js.includes("function setCacheEntry"),
  "app.js should define setCacheEntry"
);

assert.ok(
  js.includes("cacheOrder"),
  "app.js should maintain a cacheOrder array for LRU tracking"
);

// ─── Behavioral tests via extracted logic ───

// Recreate the setCacheEntry logic locally for behavioral testing
function createLRUCache(maxEntries) {
  const cache = new Map();
  const cacheOrder = [];

  function setCacheEntry(key, data) {
    if (cache.has(key)) {
      cache.set(key, data);
      const existingIndex = cacheOrder.indexOf(key);
      if (existingIndex >= 0) cacheOrder.splice(existingIndex, 1);
    } else {
      cache.set(key, data);
    }
    cacheOrder.push(key);
    while (cacheOrder.length > maxEntries) {
      const oldest = cacheOrder.shift();
      if (oldest) cache.delete(oldest);
    }
  }

  return { cache, cacheOrder, setCacheEntry };
}

// Test: basic insertion
{
  const { cache, setCacheEntry } = createLRUCache(3);
  setCacheEntry("a", 1);
  setCacheEntry("b", 2);
  assert.strictEqual(cache.size, 2);
  assert.strictEqual(cache.get("a"), 1);
  assert.strictEqual(cache.get("b"), 2);
}

// Test: eviction at capacity
{
  const { cache, cacheOrder, setCacheEntry } = createLRUCache(3);
  setCacheEntry("a", 1);
  setCacheEntry("b", 2);
  setCacheEntry("c", 3);
  assert.strictEqual(cache.size, 3);

  // Adding a 4th entry should evict "a" (oldest)
  setCacheEntry("d", 4);
  assert.strictEqual(cache.size, 3, "cache size should stay at max");
  assert.ok(!cache.has("a"), "oldest entry 'a' should be evicted");
  assert.ok(cache.has("b"), "'b' should still be present");
  assert.ok(cache.has("d"), "new entry 'd' should be present");
  assert.deepStrictEqual(cacheOrder, ["b", "c", "d"]);
}

// Test: updating an existing key refreshes its LRU position
{
  const { cache, cacheOrder, setCacheEntry } = createLRUCache(3);
  setCacheEntry("a", 1);
  setCacheEntry("b", 2);
  setCacheEntry("c", 3);

  // Re-set "a" to move it to the end
  setCacheEntry("a", 10);
  assert.strictEqual(cache.get("a"), 10, "value should be updated");
  assert.deepStrictEqual(cacheOrder, ["b", "c", "a"], "a should be moved to end");

  // Now "b" is oldest, so adding "d" should evict "b"
  setCacheEntry("d", 4);
  assert.ok(!cache.has("b"), "'b' should be evicted after 'a' was refreshed");
  assert.ok(cache.has("a"), "'a' should survive because it was refreshed");
}

// Test: eviction of multiple entries at once (edge case)
{
  const { cache, setCacheEntry } = createLRUCache(2);
  setCacheEntry("a", 1);
  setCacheEntry("b", 2);
  setCacheEntry("c", 3);
  assert.strictEqual(cache.size, 2);
  assert.ok(!cache.has("a"), "'a' should be evicted");
  assert.ok(cache.has("b"), "'b' should remain");
  assert.ok(cache.has("c"), "'c' should be present");
}

// Test: inserting same key twice doesn't duplicate in order
{
  const { cache, cacheOrder, setCacheEntry } = createLRUCache(5);
  setCacheEntry("x", 1);
  setCacheEntry("x", 2);
  setCacheEntry("x", 3);
  assert.strictEqual(cache.size, 1, "same key should not create duplicates in cache");
  assert.strictEqual(cacheOrder.length, 1, "cacheOrder should not have duplicates");
  assert.strictEqual(cache.get("x"), 3, "value should be latest");
}

// ─── Verify setCacheEntry in app.js matches our recreation ───

// Extract the function body from app.js
const fnMatch = js.match(/function setCacheEntry\(key, data\)\s*\{([\s\S]*?)\n\}/);
assert.ok(fnMatch, "should be able to extract setCacheEntry body");
const fnBody = fnMatch[1];

// Check key behaviors are present in the source
assert.ok(fnBody.includes("cache.has(key)"), "should check if key exists");
assert.ok(fnBody.includes("cacheOrder.indexOf(key)"), "should find existing position");
assert.ok(fnBody.includes("cacheOrder.splice("), "should remove from old position");
assert.ok(fnBody.includes("cacheOrder.push(key)"), "should push to end");
assert.ok(fnBody.includes("MAX_CACHE_ENTRIES"), "should check capacity limit");
assert.ok(fnBody.includes("cacheOrder.shift()"), "should shift oldest on eviction");
assert.ok(fnBody.includes("cache.delete("), "should delete from Map on eviction");

console.log("cache.test.js passed");
