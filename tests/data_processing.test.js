#!/usr/bin/env node
const assert = require("assert");

const { buildFlows, buildNet } = require("../geo/data_processing");

// --- Test fixtures ---
const regionByCode = new Map([
  ["11", { code: "11", name: "서울특별시", centroid: { x: 100, y: 100 } }],
  ["26", { code: "26", name: "부산광역시", centroid: { x: 200, y: 200 } }],
  ["41", { code: "41", name: "경기도", centroid: { x: 150, y: 90 } }],
]);

const baseOptions = { item: "T70", sex: "0", age: "000" };

// --- buildFlows: basic aggregation ---
const data1 = [
  { ITM_ID: "T70", C1: "11", C2: "26", C3: "0", C4: "000", DT: "1,000" },
  { ITM_ID: "T70", C1: "11", C2: "26", C3: "0", C4: "000", DT: "500" },
  { ITM_ID: "T70", C1: "26", C2: "11", C3: "0", C4: "000", DT: "200" },
];
const result1 = buildFlows(data1, baseOptions, regionByCode);
assert.strictEqual(result1.flows.length, 2, "two distinct flow pairs");
assert.strictEqual(result1.total, 1700, "total sums all matched values");
assert.strictEqual(result1.flows[0].value, 1500, "highest flow first (aggregated)");
assert.strictEqual(result1.flows[0].fromCode, "11", "from code preserved");
assert.strictEqual(result1.flows[0].toCode, "26", "to code preserved");
assert.strictEqual(result1.flows[0].label, "서울특별시 → 부산광역시", "label uses region names");

// --- buildFlows: filters by item, sex, age ---
const data2 = [
  { ITM_ID: "T70", C1: "11", C2: "26", C3: "0", C4: "000", DT: "100" },
  { ITM_ID: "T80", C1: "11", C2: "26", C3: "0", C4: "000", DT: "50" },
  { ITM_ID: "T70", C1: "11", C2: "26", C3: "1", C4: "000", DT: "30" },
  { ITM_ID: "T70", C1: "11", C2: "26", C3: "0", C4: "020", DT: "20" },
];
const result2 = buildFlows(data2, baseOptions, regionByCode);
assert.strictEqual(result2.total, 100, "only matching item/sex/age counted");

// --- buildFlows: excludes same-region pairs ---
const data3 = [
  { ITM_ID: "T70", C1: "11", C2: "11", C3: "0", C4: "000", DT: "999" },
  { ITM_ID: "T70", C1: "11", C2: "26", C3: "0", C4: "000", DT: "50" },
];
const result3 = buildFlows(data3, baseOptions, regionByCode);
assert.strictEqual(result3.flows.length, 1, "same-region pair excluded");
assert.strictEqual(result3.total, 50);

// --- buildFlows: excludes code "00" (national) ---
const data4 = [
  { ITM_ID: "T70", C1: "00", C2: "26", C3: "0", C4: "000", DT: "999" },
  { ITM_ID: "T70", C1: "11", C2: "00", C3: "0", C4: "000", DT: "888" },
  { ITM_ID: "T70", C1: "11", C2: "26", C3: "0", C4: "000", DT: "10" },
];
const result4 = buildFlows(data4, baseOptions, regionByCode);
assert.strictEqual(result4.total, 10, "national code 00 excluded");

// --- buildFlows: excludes unknown regions ---
const data5 = [
  { ITM_ID: "T70", C1: "11", C2: "99", C3: "0", C4: "000", DT: "100" },
];
const result5 = buildFlows(data5, baseOptions, regionByCode);
assert.strictEqual(result5.flows.length, 0, "unknown region code excluded");
assert.strictEqual(result5.total, 0);

// --- buildFlows: zero and negative values ---
const data6 = [
  { ITM_ID: "T70", C1: "11", C2: "26", C3: "0", C4: "000", DT: "0" },
  { ITM_ID: "T70", C1: "26", C2: "41", C3: "0", C4: "000", DT: "-5" },
];
const result6 = buildFlows(data6, baseOptions, regionByCode);
assert.strictEqual(result6.total, 0, "zero and negative values excluded");

// --- buildFlows: non-numeric DT handled ---
const data7 = [
  { ITM_ID: "T70", C1: "11", C2: "26", C3: "0", C4: "000", DT: "abc" },
  { ITM_ID: "T70", C1: "26", C2: "41", C3: "0", C4: "000", DT: "200" },
];
const result7 = buildFlows(data7, baseOptions, regionByCode);
assert.strictEqual(result7.total, 200, "non-numeric DT safely parsed as 0");

// --- buildFlows: empty dataset ---
const result8 = buildFlows([], baseOptions, regionByCode);
assert.strictEqual(result8.flows.length, 0, "empty data yields no flows");
assert.strictEqual(result8.total, 0);

// --- buildFlows: sort order (descending) ---
const data9 = [
  { ITM_ID: "T70", C1: "11", C2: "26", C3: "0", C4: "000", DT: "50" },
  { ITM_ID: "T70", C1: "26", C2: "41", C3: "0", C4: "000", DT: "300" },
  { ITM_ID: "T70", C1: "11", C2: "41", C3: "0", C4: "000", DT: "150" },
];
const result9 = buildFlows(data9, baseOptions, regionByCode);
assert.strictEqual(result9.flows[0].value, 300, "sorted descending by value");
assert.strictEqual(result9.flows[1].value, 150);
assert.strictEqual(result9.flows[2].value, 50);

// --- buildNet: basic calculation ---
const netData = [
  { ITM_ID: "T70", C1: "11", C2: "26", C3: "0", C4: "000", DT: "100" },
  { ITM_ID: "T70", C1: "26", C2: "11", C3: "0", C4: "000", DT: "300" },
];
const net1 = buildNet(netData, baseOptions, regionByCode);
// Seoul: -100 (out to Busan) + 300 (in from Busan) = +200 net
// Busan: +100 (in from Seoul) - 300 (out to Seoul) = -200 net
assert.strictEqual(net1.total, 400, "net total counts all movements");
const seoulNet = net1.entries.find((e) => e.code === "11");
const busanNet = net1.entries.find((e) => e.code === "26");
assert.strictEqual(seoulNet.value, 200, "Seoul net inflow = +200");
assert.strictEqual(busanNet.value, -200, "Busan net outflow = -200");

// --- buildNet: sorted by absolute value ---
assert.strictEqual(
  Math.abs(net1.entries[0].value) >= Math.abs(net1.entries[1].value),
  true,
  "sorted by abs value descending"
);

// --- buildNet: excludes code "00" ---
const netData2 = [
  { ITM_ID: "T70", C1: "00", C2: "26", C3: "0", C4: "000", DT: "999" },
  { ITM_ID: "T70", C1: "11", C2: "26", C3: "0", C4: "000", DT: "50" },
];
const net2 = buildNet(netData2, baseOptions, regionByCode);
assert.strictEqual(net2.total, 50, "national code 00 excluded from net");

// --- buildNet: empty dataset ---
const net3 = buildNet([], baseOptions, regionByCode);
assert.strictEqual(net3.entries.length, 0, "empty data yields no net entries");
assert.strictEqual(net3.total, 0);

console.log("data_processing.test.js passed");
