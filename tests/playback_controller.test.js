#!/usr/bin/env node
const assert = require("assert");

const playbackController = require("../geo/playback");

// --- buildTimeline ---
const timeline = playbackController.buildTimeline();
assert.ok(Array.isArray(timeline), "timeline is an array");
assert.ok(timeline.length > 0, "timeline has entries");
assert.strictEqual(timeline[0].year, 1995, "timeline starts at 1995");
assert.ok(timeline.some((e) => e.year === 2025 && e.month), "timeline includes 2025 months");

// --- getPlaybackInterval ---
// Without config injected, uses defaults
const yearInterval = playbackController.getPlaybackInterval({ year: 2020 }, 1);
assert.strictEqual(typeof yearInterval, "number", "returns number");
assert.ok(yearInterval >= 300, "interval at least 300ms");

const monthInterval = playbackController.getPlaybackInterval({ year: 2025, month: "03" }, 1);
assert.ok(monthInterval < yearInterval || monthInterval === yearInterval, "month interval <= year");

const fastInterval = playbackController.getPlaybackInterval({ year: 2020 }, 2);
assert.ok(fastInterval < yearInterval, "faster speed = shorter interval");

// --- getPrefetchCount ---
const prefetchCount = playbackController.getPrefetchCount();
assert.strictEqual(typeof prefetchCount, "number", "prefetch count is number");
assert.ok(prefetchCount >= 1 && prefetchCount <= 5, "prefetch count in reasonable range");

// --- getSpeed ---
const mockSlider = { value: "1.5" };
assert.strictEqual(playbackController.getSpeed(mockSlider), 1.5, "reads speed from slider");
assert.strictEqual(playbackController.getSpeed(null), 1, "defaults to 1 without slider");

console.log("playback_controller.test.js passed");
