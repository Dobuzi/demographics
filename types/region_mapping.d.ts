/**
 * Type definitions for geo/region_mapping.js
 */

declare module "region_mapping" {
  /**
   * Canonical Sido name → two-digit administrative code.
   * Covers all 17 current South Korean Sido-level regions.
   */
  export const NAME_TO_CODE: Record<string, string>;

  /**
   * Normalize a region name to its canonical Sido form.
   * If the input is an alias (short or legacy name), it is expanded.
   * If already canonical or unknown, returned as-is.
   * @param name - Raw region name from GeoJSON or user input.
   * @returns Canonical Sido name, or empty string if falsy input.
   */
  export function normalizeSidoName(name: string): string;

  /**
   * Map a region name (canonical or alias) to its two-digit Sido code.
   * @param name - Region name (any form recognized by normalizeSidoName).
   * @returns Two-digit code (e.g. "11" for Seoul), or null if not found.
   */
  export function mapSidoNameToCode(name: string): string | null;
}

declare global {
  interface Window {
    regionMapping: typeof import("region_mapping");
  }
}

export {};
