#!/usr/bin/env node
const assert = require("assert");
const fs = require("fs");

// --- Type definition files exist ---
const expectedTypes = [
  "types/region_mapping.d.ts",
  "types/flow_style.d.ts",
  "types/geo_utils.d.ts",
  "types/data_utils.d.ts",
  "types/data_processing.d.ts",
];

expectedTypes.forEach((file) => {
  assert.ok(fs.existsSync(file), `${file} should exist`);
});

// --- jsconfig.json exists with correct settings ---
assert.ok(fs.existsSync("jsconfig.json"), "jsconfig.json should exist");
const jsconfig = JSON.parse(fs.readFileSync("jsconfig.json", "utf-8"));
assert.ok(jsconfig.compilerOptions, "jsconfig should have compilerOptions");
assert.ok(jsconfig.compilerOptions.checkJs, "checkJs should be enabled");
assert.ok(jsconfig.compilerOptions.typeRoots.includes("./types"), "typeRoots should include ./types");

// --- Type definitions declare window globals ---
const regionMappingDts = fs.readFileSync("types/region_mapping.d.ts", "utf-8");
assert.ok(
  regionMappingDts.includes("interface Window"),
  "region_mapping.d.ts should declare Window interface"
);
assert.ok(
  regionMappingDts.includes("regionMapping"),
  "region_mapping.d.ts should declare regionMapping"
);

const flowStyleDts = fs.readFileSync("types/flow_style.d.ts", "utf-8");
assert.ok(
  flowStyleDts.includes("FLOW_COLORS"),
  "flow_style.d.ts should export FLOW_COLORS"
);
assert.ok(
  flowStyleDts.includes("flowWidthScale"),
  "flow_style.d.ts should export flowWidthScale"
);

const geoUtilsDts = fs.readFileSync("types/geo_utils.d.ts", "utf-8");
assert.ok(
  geoUtilsDts.includes("buildProjection"),
  "geo_utils.d.ts should export buildProjection"
);
assert.ok(
  geoUtilsDts.includes("geometryToPath"),
  "geo_utils.d.ts should export geometryToPath"
);

const dataUtilsDts = fs.readFileSync("types/data_utils.d.ts", "utf-8");
assert.ok(
  dataUtilsDts.includes("AGE_GROUPS"),
  "data_utils.d.ts should export AGE_GROUPS"
);
assert.ok(
  dataUtilsDts.includes("validateDataset"),
  "data_utils.d.ts should export validateDataset"
);

const dataProcessingDts = fs.readFileSync("types/data_processing.d.ts", "utf-8");
assert.ok(
  dataProcessingDts.includes("buildFlows"),
  "data_processing.d.ts should export buildFlows"
);
assert.ok(
  dataProcessingDts.includes("buildNet"),
  "data_processing.d.ts should export buildNet"
);

console.log("typescript_defs.test.js passed");
