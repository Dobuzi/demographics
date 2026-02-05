/**
 * Geo utility functions for coordinate projection and SVG path generation.
 * Pure functions with no DOM or browser dependencies.
 * @module geo/geo_utils
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.geoUtils = factory();
  }
})(this, function () {
  /** Default longitude threshold for far-east compression. */
  const FAR_EAST_LON = 130.0;

  /** Default compression ratio for coordinates east of FAR_EAST_LON. */
  const FAR_EAST_COMPRESS = 0.25;

  /**
   * Iterate over all [lon, lat] coordinate pairs in a GeoJSON geometry.
   * Supports Polygon and MultiPolygon types.
   * @param {{type: string, coordinates: Array}} geometry - GeoJSON geometry object.
   * @param {function([number, number]): void} handler - Called for each coordinate pair.
   */
  function collectCoords(geometry, handler) {
    if (geometry.type === "Polygon") {
      geometry.coordinates.forEach(function (ring) {
        ring.forEach(handler);
      });
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach(function (polygon) {
        polygon.forEach(function (ring) {
          ring.forEach(handler);
        });
      });
    }
  }

  /**
   * Build a projection function that maps [lon, lat] → {x, y} in SVG space.
   * Applies far-east longitude compression to prevent Ulleungdo/Dokdo
   * from distorting the map extent.
   * @param {Array<{geometry: {type: string, coordinates: Array}}>} features - GeoJSON features.
   * @param {number} width - SVG viewport width.
   * @param {number} height - SVG viewport height.
   * @param {number} [padding=30] - Padding around the projected extent.
   * @param {function(number, number): boolean} [coordFilter] - If provided, only coordinates where coordFilter(lon, lat) returns true are used for extent calculation.
   * @returns {function([number, number]): {x: number, y: number}} Projection function.
   */
  function buildProjection(features, width, height, padding, coordFilter) {
    if (padding === undefined || padding === null) padding = 30;
    var minLon = Infinity;
    var maxLon = -Infinity;
    var minLat = Infinity;
    var maxLat = -Infinity;

    features.forEach(function (feature) {
      collectCoords(feature.geometry, function (coord) {
        var lon = coord[0];
        var lat = coord[1];
        if (coordFilter && !coordFilter(lon, lat)) return;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      });
    });

    var lonSpan = maxLon - minLon;
    var latSpan = maxLat - minLat;
    var scaleX = (width - padding * 2) / lonSpan;
    var scaleY = (height - padding * 2) / latSpan;
    var scale = Math.min(scaleX, scaleY);

    var clampLon = function (lon) {
      if (lon <= FAR_EAST_LON) return lon;
      return FAR_EAST_LON + (lon - FAR_EAST_LON) * FAR_EAST_COMPRESS;
    };

    return function (coord) {
      var lon = coord[0];
      var lat = coord[1];
      var adjLon = clampLon(lon);
      var x = padding + (adjLon - minLon) * scale;
      var y = height - padding - (lat - minLat) * scale;
      return { x: x, y: y };
    };
  }

  /**
   * Convert a GeoJSON geometry to an SVG path string.
   * @param {{type: string, coordinates: Array}} geometry - GeoJSON geometry (Polygon or MultiPolygon).
   * @param {function([number, number]): {x: number, y: number}} project - Projection function.
   * @returns {string} SVG path data (M/L/Z commands).
   */
  function geometryToPath(geometry, project) {
    var segments = [];
    var addRing = function (ring) {
      ring.forEach(function (coord, index) {
        var pt = project(coord);
        segments.push((index === 0 ? "M" : "L") + " " + pt.x + " " + pt.y);
      });
      segments.push("Z");
    };

    if (geometry.type === "Polygon") {
      geometry.coordinates.forEach(addRing);
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach(function (polygon) {
        polygon.forEach(addRing);
      });
    }

    return segments.join(" ");
  }

  /**
   * Compute the centroid of a GeoJSON geometry in projected SVG space.
   * Uses arithmetic mean of all coordinate vertices.
   * @param {{type: string, coordinates: Array}} geometry - GeoJSON geometry.
   * @param {function([number, number]): {x: number, y: number}} project - Projection function.
   * @returns {{x: number, y: number}} Centroid in SVG coordinates.
   */
  function geometryCentroid(geometry, project) {
    var sumX = 0;
    var sumY = 0;
    var count = 0;
    collectCoords(geometry, function (coord) {
      var pt = project(coord);
      sumX += pt.x;
      sumY += pt.y;
      count += 1;
    });
    if (!count) return { x: 0, y: 0 };
    return { x: sumX / count, y: sumY / count };
  }

  return {
    FAR_EAST_LON: FAR_EAST_LON,
    FAR_EAST_COMPRESS: FAR_EAST_COMPRESS,
    collectCoords: collectCoords,
    buildProjection: buildProjection,
    geometryToPath: geometryToPath,
    geometryCentroid: geometryCentroid,
  };
});
