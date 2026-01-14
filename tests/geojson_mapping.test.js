#!/usr/bin/env node
const assert = require("assert");

const { normalizeSidoName, mapSidoNameToCode } = require("../geo/region_mapping");

const cases = [
  ["서울특별시", "11"],
  ["부산광역시", "26"],
  ["대구광역시", "27"],
  ["인천광역시", "28"],
  ["광주광역시", "29"],
  ["대전광역시", "30"],
  ["울산광역시", "31"],
  ["세종특별자치시", "36"],
  ["경기도", "41"],
  ["강원특별자치도", "51"],
  ["충청북도", "43"],
  ["충청남도", "44"],
  ["전북특별자치도", "52"],
  ["전라북도", "52"],
  ["전라남도", "46"],
  ["경상북도", "47"],
  ["경상남도", "48"],
  ["제주특별자치도", "50"],
];

cases.forEach(([name, expected]) => {
  assert.strictEqual(mapSidoNameToCode(name), expected, `code for ${name}`);
});

assert.strictEqual(normalizeSidoName("서울"), "서울특별시");
assert.strictEqual(normalizeSidoName("강원도"), "강원특별자치도");
assert.strictEqual(normalizeSidoName("전북"), "전북특별자치도");

console.log("geojson_mapping.test.js passed");
