#!/usr/bin/env node
const assert = require("assert");

const state = require("../geo/state");

// --- Cache Management ---
assert.strictEqual(state.hasCacheEntry("test"), false, "cache starts empty");

state.setCacheEntry("key1", { data: 1 });
assert.strictEqual(state.hasCacheEntry("key1"), true, "cache entry exists after set");
assert.deepStrictEqual(state.getCacheEntry("key1"), { data: 1 }, "cache returns correct data");

state.setCacheEntry("key1", { data: 2 });
assert.deepStrictEqual(state.getCacheEntry("key1"), { data: 2 }, "cache updates existing entry");

// LRU eviction
state.setCacheMaxEntries(3);
state.clearCache();
state.setCacheEntry("a", 1);
state.setCacheEntry("b", 2);
state.setCacheEntry("c", 3);
state.setCacheEntry("d", 4); // should evict "a"
assert.strictEqual(state.hasCacheEntry("a"), false, "oldest entry evicted");
assert.strictEqual(state.hasCacheEntry("d"), true, "newest entry exists");

state.clearCache();
assert.strictEqual(state.hasCacheEntry("d"), false, "cache cleared");

// --- Merged Data ---
assert.strictEqual(state.getMergedPeriods(), null, "merged periods starts null");
assert.strictEqual(state.wasMergedAttempted(), false, "merged not attempted initially");

state.setMergedPeriods({ "2024": [] });
assert.deepStrictEqual(state.getMergedPeriods(), { "2024": [] }, "merged periods set");
assert.strictEqual(state.wasMergedAttempted(), true, "merged attempted after set");

state.resetMerged();
assert.strictEqual(state.getMergedPeriods(), null, "merged reset to null");
assert.strictEqual(state.wasMergedAttempted(), false, "merged attempted reset");

// --- Geo Data ---
assert.strictEqual(state.getGeoIndex(), null, "geo index starts null");
state.setGeoIndex({ regions: [] });
assert.deepStrictEqual(state.getGeoIndex(), { regions: [] }, "geo index set");

assert.strictEqual(state.getOfficeCenters(), null, "office centers starts null");
const centers = new Map([["11", { lat: 37.5, lon: 127 }]]);
state.setOfficeCenters(centers);
assert.strictEqual(state.getOfficeCenters().get("11").lat, 37.5, "office centers set");

// --- Playback State ---
assert.strictEqual(state.isPlaying(), false, "not playing initially");
state.setPlaying(true);
assert.strictEqual(state.isPlaying(), true, "playing after setPlaying(true)");
state.setPlaying(false);
assert.strictEqual(state.isPlaying(), false, "stopped after setPlaying(false)");

const loopId1 = state.getLoopId();
const loopId2 = state.incrementLoopId();
assert.strictEqual(loopId2, loopId1 + 1, "loop id increments");

// --- Keyboard Selection ---
const { selectedIndex, flowElements } = state.getKeyboardSelection();
assert.strictEqual(selectedIndex, -1, "no initial selection");
assert.deepStrictEqual(flowElements, [], "no initial elements");

state.setKeyboardSelection(2, ["a", "b", "c"]);
const sel = state.getKeyboardSelection();
assert.strictEqual(sel.selectedIndex, 2, "selection index set");
assert.deepStrictEqual(sel.flowElements, ["a", "b", "c"], "elements set");

state.clearKeyboardSelection();
assert.strictEqual(state.getKeyboardSelection().selectedIndex, -1, "selection cleared");

// --- Navigation Direction ---
state.updateNavigationDirection(2020);
state.updateNavigationDirection(2021);
assert.strictEqual(state.getNavigationDirection(), 1, "forward direction");

state.updateNavigationDirection(2019);
assert.strictEqual(state.getNavigationDirection(), -1, "backward direction");

// --- Viewport (Zoom/Pan) ---
assert.strictEqual(state.getZoom(), 1, "initial zoom");
state.setZoom(2, 0.5, 4);
assert.strictEqual(state.getZoom(), 2, "zoom set to 2");
state.setZoom(10, 0.5, 4);
assert.strictEqual(state.getZoom(), 4, "zoom clamped to max");
state.setZoom(0.1, 0.5, 4);
assert.strictEqual(state.getZoom(), 0.5, "zoom clamped to min");

const pan = state.getPan();
assert.strictEqual(pan.x, 0, "initial pan x");
assert.strictEqual(pan.y, 0, "initial pan y");

state.setPan(10, 20);
assert.deepStrictEqual(state.getPan(), { x: 10, y: 20 }, "pan set");

state.addPan(5, 5);
assert.deepStrictEqual(state.getPan(), { x: 15, y: 25 }, "pan added");

state.resetViewport();
assert.strictEqual(state.getZoom(), 1, "zoom reset");
assert.deepStrictEqual(state.getPan(), { x: 0, y: 0 }, "pan reset");

// --- Drag State ---
assert.strictEqual(state.isDragging(), false, "not dragging initially");
state.setDragging(true, 100, 200);
assert.strictEqual(state.isDragging(), true, "dragging after set");
assert.deepStrictEqual(state.getDragStart(), { x: 100, y: 200 }, "drag start set");

state.setDragStart(150, 250);
assert.deepStrictEqual(state.getDragStart(), { x: 150, y: 250 }, "drag start updated");

state.setDragging(false);
assert.strictEqual(state.isDragging(), false, "not dragging after unset");

// --- Subscription ---
let callCount = 0;
let lastValue = null;
const unsubscribe = state.subscribe("zoom", (value) => {
  callCount++;
  lastValue = value;
});

state.setZoom(1.5, 0.5, 4);
assert.strictEqual(callCount, 1, "subscriber called on zoom change");
assert.strictEqual(lastValue, 1.5, "subscriber receives new value");

unsubscribe();
state.setZoom(2, 0.5, 4);
assert.strictEqual(callCount, 1, "subscriber not called after unsubscribe");

console.log("state.test.js passed");
