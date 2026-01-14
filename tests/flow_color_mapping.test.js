#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

const js = fs.readFileSync("app.js", "utf-8");

assert.ok(
  js.includes("buildGradientStops(outboundColor, inboundColor)") ||
    js.includes("buildGradientStops ? buildGradientStops(outboundColor, inboundColor)"),
  "flow gradient should run outbound -> inbound"
);
assert.ok(
  js.includes("netFillInbound") && js.includes("netFillOutbound"),
  "net fill colors should use inbound/outbound mapping"
);

console.log("flow_color_mapping.test.js passed");
