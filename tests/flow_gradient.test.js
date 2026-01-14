#!/usr/bin/env node
const assert = require("assert");

const {
  buildGradientStops,
  flowWidthScale,
  FLOW_COLORS,
  flowGradientAnimation,
  flowDisplayCount,
  flowPulseCount,
  formatFlowLabel,
  shouldRenderFlow,
  isFlowMetaValid,
  shouldRenderPair,
  getRegionHighlightClass,
  getIndicatorInfo,
  getNetItemCode,
  getNetFillEnabled,
} = require("../geo/flow_style");

const stops = buildGradientStops("#00ff00", "#ff0000");
assert.strictEqual(stops.length, 2);
assert.deepStrictEqual(stops[0], { offset: "0%", color: "#00ff00", opacity: 0.82 });
assert.deepStrictEqual(stops[1], { offset: "100%", color: "#ff0000", opacity: 0.82 });

assert.deepStrictEqual(FLOW_COLORS, { inbound: "#27d17f", outbound: "#f05b4c" });
assert.strictEqual(flowWidthScale(0, 1000), 2.2);
assert.strictEqual(flowWidthScale(1000, 1000), 9.5);

assert.strictEqual(flowGradientAnimation(0, 1000), null);
assert.strictEqual(flowGradientAnimation(1000, 1000), null);
assert.strictEqual(flowDisplayCount(34992), 60);
assert.strictEqual(flowDisplayCount(2000), 40);
assert.strictEqual(flowPulseCount(60), 12);
assert.strictEqual(flowPulseCount(40), 8);
assert.strictEqual(formatFlowLabel("서울", "부산", 12345), "서울 → 부산 · 12,345명");
assert.strictEqual(shouldRenderFlow(0), false);
assert.strictEqual(shouldRenderFlow(10), true);
assert.strictEqual(shouldRenderFlow(NaN), false);
assert.strictEqual(isFlowMetaValid({ from: "서울", to: "부산", value: 10 }), true);
assert.strictEqual(isFlowMetaValid({ from: "", to: "부산", value: 10 }), false);
assert.strictEqual(isFlowMetaValid({ from: "서울", to: "부산", value: 0 }), false);
assert.strictEqual(shouldRenderPair("11", "26"), true);
assert.strictEqual(shouldRenderPair("11", "11"), false);
assert.strictEqual(getRegionHighlightClass("inbound"), "region-highlight inbound");
assert.strictEqual(getRegionHighlightClass("outbound"), "region-highlight outbound");
assert.strictEqual(getIndicatorInfo("T70").title, "이동자수");
assert.strictEqual(getIndicatorInfo("T80").title, "순이동자수");
assert.strictEqual(getNetItemCode(), "T70");
assert.strictEqual(getNetFillEnabled(), true);

console.log("flow_gradient.test.js passed");
