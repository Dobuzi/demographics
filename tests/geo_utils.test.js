#!/usr/bin/env node
const assert = require("assert");
const geoUtils = require("../geo/geo_utils");

const { collectCoords, buildProjection, geometryToPath, geometryCentroid } = geoUtils;

// ─── collectCoords ───

// Polygon: collects all coordinate pairs
{
  const geometry = {
    type: "Polygon",
    coordinates: [[[126, 37], [127, 37], [127, 38], [126, 38], [126, 37]]],
  };
  const coords = [];
  collectCoords(geometry, (c) => coords.push(c));
  assert.strictEqual(coords.length, 5, "Polygon should yield 5 coordinate pairs");
  assert.deepStrictEqual(coords[0], [126, 37]);
  assert.deepStrictEqual(coords[4], [126, 37]);
}

// MultiPolygon: collects from all sub-polygons
{
  const geometry = {
    type: "MultiPolygon",
    coordinates: [
      [[[126, 37], [127, 37], [127, 38], [126, 37]]],
      [[[128, 35], [129, 35], [129, 36], [128, 35]]],
    ],
  };
  const coords = [];
  collectCoords(geometry, (c) => coords.push(c));
  assert.strictEqual(coords.length, 8, "MultiPolygon should yield 8 pairs (4+4)");
}

// Unknown type: no coordinates collected
{
  const coords = [];
  collectCoords({ type: "Point", coordinates: [126, 37] }, (c) => coords.push(c));
  assert.strictEqual(coords.length, 0, "Point type should yield no coords");
}

// ─── buildProjection ───

// Simple square region: projects correctly within bounds
{
  const features = [{
    geometry: {
      type: "Polygon",
      coordinates: [[[126, 33], [130, 33], [130, 38], [126, 38], [126, 33]]],
    },
  }];
  const project = buildProjection(features, 400, 300, 0);
  // Bottom-left corner (min lon, min lat) should map to (0, 300)
  const bl = project([126, 33]);
  assert.ok(Math.abs(bl.x - 0) < 0.01, `bottom-left x should be ~0, got ${bl.x}`);
  assert.ok(Math.abs(bl.y - 300) < 0.01, `bottom-left y should be ~300, got ${bl.y}`);

  // Top-right corner (max lon, max lat)
  const tr = project([130, 38]);
  // y should be near 0 (top of viewport)
  assert.ok(tr.y < 10, `top-right y should be near 0, got ${tr.y}`);
  assert.ok(tr.x > 0, `top-right x should be > 0, got ${tr.x}`);
}

// Padding: projects with margin
{
  const features = [{
    geometry: {
      type: "Polygon",
      coordinates: [[[126, 33], [130, 33], [130, 38], [126, 38], [126, 33]]],
    },
  }];
  const project = buildProjection(features, 400, 300, 30);
  const bl = project([126, 33]);
  assert.ok(bl.x >= 30, `with padding, bottom-left x should be >= 30, got ${bl.x}`);
}

// coordFilter: filters out far-east coordinates from extent calculation
{
  const features = [{
    geometry: {
      type: "Polygon",
      coordinates: [[[126, 35], [128, 35], [128, 36], [126, 36], [126, 35]]],
    },
  }, {
    geometry: {
      type: "Polygon",
      coordinates: [[[131, 37], [132, 37], [132, 40], [131, 40], [131, 37]]],
    },
  }];
  // Use wide viewport so lon span is the limiting factor for scale
  const projectFiltered = buildProjection(features, 200, 600, 0, (lon) => lon <= 130);
  const projectUnfiltered = buildProjection(features, 200, 600, 0);

  // The far-east polygon adds lat 37-40 and lon 131-132 to the extent.
  // With filter, extent is smaller → different scale → different projection.
  const pt = projectFiltered([127, 35.5]);
  const ptU = projectUnfiltered([127, 35.5]);
  assert.ok(
    Math.abs(pt.x - ptU.x) > 0.1 || Math.abs(pt.y - ptU.y) > 0.1,
    "filtered and unfiltered projections should differ"
  );
}

// Far-east compression: coordinates beyond 130° are compressed
{
  const features = [{
    geometry: {
      type: "Polygon",
      coordinates: [[[126, 33], [129, 33], [129, 38], [126, 38], [126, 33]]],
    },
  }];
  const project = buildProjection(features, 400, 300, 0);
  const normalPt = project([129, 35]);
  const farEastPt = project([131, 35]);
  // 131 is 1 degree past the threshold; after compression it should be
  // much closer to 130 than the raw 1-degree difference
  const pt130 = project([130, 35]);
  const rawDiff = farEastPt.x - pt130.x;
  const normalDiff = pt130.x - normalPt.x;
  assert.ok(
    rawDiff < normalDiff,
    "far-east compression should reduce x distance beyond 130°"
  );
}

// ─── geometryToPath ───

// Simple triangle polygon
{
  const identity = (coord) => ({ x: coord[0], y: coord[1] });
  const geometry = {
    type: "Polygon",
    coordinates: [[[0, 0], [10, 0], [5, 10], [0, 0]]],
  };
  const path = geometryToPath(geometry, identity);
  assert.ok(path.startsWith("M"), "path should start with M command");
  assert.ok(path.includes("L"), "path should include L commands");
  assert.ok(path.includes("Z"), "path should end with Z");
  assert.strictEqual(path, "M 0 0 L 10 0 L 5 10 L 0 0 Z");
}

// MultiPolygon produces multiple M commands
{
  const identity = (coord) => ({ x: coord[0], y: coord[1] });
  const geometry = {
    type: "MultiPolygon",
    coordinates: [
      [[[0, 0], [1, 0], [0, 1], [0, 0]]],
      [[[5, 5], [6, 5], [5, 6], [5, 5]]],
    ],
  };
  const path = geometryToPath(geometry, identity);
  const mCount = (path.match(/M /g) || []).length;
  assert.strictEqual(mCount, 2, "MultiPolygon should produce 2 M commands");
  const zCount = (path.match(/Z/g) || []).length;
  assert.strictEqual(zCount, 2, "MultiPolygon should produce 2 Z commands");
}

// Empty polygon
{
  const identity = (coord) => ({ x: coord[0], y: coord[1] });
  const path = geometryToPath({ type: "Polygon", coordinates: [[]] }, identity);
  assert.strictEqual(path, "Z", "empty ring should produce just Z");
}

// ─── geometryCentroid ───

// Square centroid should be at center
{
  const identity = (coord) => ({ x: coord[0], y: coord[1] });
  const geometry = {
    type: "Polygon",
    coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
  };
  const centroid = geometryCentroid(geometry, identity);
  // Mean of 5 vertices: (0+10+10+0+0)/5 = 4, (0+0+10+10+0)/5 = 4
  assert.ok(Math.abs(centroid.x - 4) < 0.01, `centroid x should be 4, got ${centroid.x}`);
  assert.ok(Math.abs(centroid.y - 4) < 0.01, `centroid y should be 4, got ${centroid.y}`);
}

// Empty geometry returns (0, 0)
{
  const identity = (coord) => ({ x: coord[0], y: coord[1] });
  const centroid = geometryCentroid({ type: "Point", coordinates: [5, 5] }, identity);
  assert.strictEqual(centroid.x, 0, "empty centroid x should be 0");
  assert.strictEqual(centroid.y, 0, "empty centroid y should be 0");
}

// MultiPolygon centroid averages all vertices
{
  const identity = (coord) => ({ x: coord[0], y: coord[1] });
  const geometry = {
    type: "MultiPolygon",
    coordinates: [
      [[[0, 0], [2, 0], [2, 2], [0, 0]]],
      [[[10, 10], [12, 10], [12, 12], [10, 10]]],
    ],
  };
  const centroid = geometryCentroid(geometry, identity);
  // All 6 points: (0+2+2+10+12+12)/6 = 6.33, (0+0+2+10+10+12)/6 = 5.67
  assert.ok(centroid.x > 5 && centroid.x < 8, `centroid x should be ~6.33, got ${centroid.x}`);
  assert.ok(centroid.y > 4 && centroid.y < 7, `centroid y should be ~5.67, got ${centroid.y}`);
}

// ─── Constants exported ───

assert.strictEqual(geoUtils.FAR_EAST_LON, 130.0, "FAR_EAST_LON should be 130");
assert.strictEqual(geoUtils.FAR_EAST_COMPRESS, 0.25, "FAR_EAST_COMPRESS should be 0.25");

console.log("geo_utils.test.js passed");
