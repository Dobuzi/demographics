/**
 * Type definitions for geo/data_processing.js
 */

declare module "data_processing" {
  import type { KOSISRow } from "data_utils";

  export interface Region {
    name: string;
    code?: string;
    centroid?: { x: number; y: number };
    path?: string;
    [key: string]: unknown;
  }

  export interface FlowOptions {
    item: string;
    sex: string;
    age: string;
  }

  export interface Flow {
    value: number;
    from: Region;
    to: Region;
    fromCode: string;
    toCode: string;
    label: string;
  }

  export interface FlowsResult {
    flows: Flow[];
    total: number;
  }

  export interface NetEntry {
    code: string;
    value: number;
    region: Region;
  }

  export interface NetResult {
    entries: NetEntry[];
    total: number;
  }

  export type RegionIndex = Map<string, Region>;

  /**
   * Aggregate migration flow pairs from raw data rows.
   * @param data - Raw KOSIS rows.
   * @param options - Active filters (item, sex, age codes).
   * @param regionByCode - Region index keyed by Sido code.
   * @returns Sorted flows array and total migration count.
   */
  export function buildFlows(
    data: KOSISRow[],
    options: FlowOptions,
    regionByCode: RegionIndex
  ): FlowsResult;

  /**
   * Calculate net inflow/outflow per region.
   * @param data - Raw KOSIS rows.
   * @param options - Active filters (item, sex, age codes).
   * @param regionByCode - Region index keyed by Sido code.
   * @returns Net entries sorted by absolute value and total.
   */
  export function buildNet(
    data: KOSISRow[],
    options: FlowOptions,
    regionByCode: RegionIndex
  ): NetResult;
}

declare global {
  interface Window {
    dataProcessing: typeof import("data_processing");
  }
}

export {};
