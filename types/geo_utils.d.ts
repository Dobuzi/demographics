/**
 * Type definitions for geo/geo_utils.js
 */

declare module "geo_utils" {
  export type Coordinate = [number, number];

  export interface Point {
    x: number;
    y: number;
  }

  export interface GeoJSONGeometry {
    type: "Polygon" | "MultiPolygon" | string;
    coordinates: number[][][] | number[][][][];
  }

  export interface GeoJSONFeature {
    geometry: GeoJSONGeometry;
    properties?: Record<string, unknown>;
  }

  export type ProjectionFunction = (coord: Coordinate) => Point;

  export type CoordFilter = (lon: number, lat: number) => boolean;

  /** Default longitude threshold for far-east compression. */
  export const FAR_EAST_LON: number;

  /** Default compression ratio for coordinates east of FAR_EAST_LON. */
  export const FAR_EAST_COMPRESS: number;

  /**
   * Iterate over all [lon, lat] coordinate pairs in a GeoJSON geometry.
   * Supports Polygon and MultiPolygon types.
   */
  export function collectCoords(
    geometry: GeoJSONGeometry,
    handler: (coord: Coordinate) => void
  ): void;

  /**
   * Build a projection function that maps [lon, lat] → {x, y} in SVG space.
   * Applies far-east longitude compression to prevent Ulleungdo/Dokdo
   * from distorting the map extent.
   */
  export function buildProjection(
    features: GeoJSONFeature[],
    width: number,
    height: number,
    padding?: number,
    coordFilter?: CoordFilter
  ): ProjectionFunction;

  /**
   * Convert a GeoJSON geometry to an SVG path string.
   */
  export function geometryToPath(
    geometry: GeoJSONGeometry,
    project: ProjectionFunction
  ): string;

  /**
   * Compute the centroid of a GeoJSON geometry in projected SVG space.
   */
  export function geometryCentroid(
    geometry: GeoJSONGeometry,
    project: ProjectionFunction
  ): Point;
}

declare global {
  interface Window {
    geoUtils: typeof import("geo_utils");
  }
}

export {};
