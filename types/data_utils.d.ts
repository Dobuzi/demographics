/**
 * Type definitions for geo/data_utils.js
 */

declare module "data_utils" {
  export interface AgeGroup {
    code: string;
    label: string;
  }

  export interface KOSISRow {
    ITM_ID: string;
    C1: string;
    C2: string;
    C3: string;
    C4: string;
    DT: string | number;
    PRD_DE?: string;
    [key: string]: unknown;
  }

  export interface ValidationResult {
    valid: boolean;
    reason: string | null;
  }

  export interface TimelinePeriod {
    year: number;
    month: string | null;
  }

  export interface NetworkConnection {
    saveData?: boolean;
    downlink?: number;
  }

  /** Age group definitions with KOSIS codes. */
  export const AGE_GROUPS: AgeGroup[];

  /** Keys every data row must contain. */
  export const REQUIRED_ROW_KEYS: string[];

  /** Minimum number of rows for a dataset to be considered valid. */
  export const MIN_DATASET_ROWS: number;

  /** Check whether a single data row has the expected schema. */
  export function validateRow(row: unknown): boolean;

  /** Validate an entire dataset array. */
  export function validateDataset(rows: unknown): ValidationResult;

  /** Safely parse the DT (data value) field from a KOSIS row. */
  export function parseDT(dt: unknown): number;

  /** Build a consistent cache key from year and optional month. */
  export function buildCacheKey(year: number, month: string | null): string;

  /** Build the playback timeline array. */
  export function buildTimeline(
    startYear?: number,
    endYear?: number,
    monthlyYear?: number,
    maxMonth?: number
  ): TimelinePeriod[];

  /** Calculate playback interval in ms for a given period and speed. */
  export function getPlaybackInterval(
    period: TimelinePeriod | null,
    speed?: number,
    yearMs?: number,
    monthMs?: number
  ): number;

  /** Determine how many periods to prefetch based on connection quality. */
  export function getPrefetchCount(connection: NetworkConnection | null): number;

  /** Clamp and validate an age slider index. */
  export function getAgeIndex(value: unknown, maxIndex?: number): number;

  /** Format a number using Korean locale (comma-separated). */
  export function formatNumber(value: number): string;
}

declare global {
  interface Window {
    dataUtils: typeof import("data_utils");
  }
}

export {};
