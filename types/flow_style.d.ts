/**
 * Type definitions for geo/flow_style.js
 */

declare module "flow_style" {
  export interface GradientStop {
    offset: string;
    color: string;
    opacity: number;
  }

  export interface FlowColors {
    inbound: string;
    outbound: string;
  }

  export interface IndicatorInfo {
    title: string;
    description: string;
  }

  export interface NetLegendItem {
    label: string;
    color: string;
  }

  export interface FlowMeta {
    from?: string;
    to?: string;
    value?: number;
  }

  export interface GradientAnimation {
    duration: number;
  }

  /** Inbound/outbound colors for flow visualization. */
  export const FLOW_COLORS: FlowColors;

  /** Build SVG gradient stop definitions for a flow line. */
  export function buildGradientStops(fromColor: string, toColor: string): GradientStop[];

  /** Calculate SVG stroke width for a flow line based on its value. */
  export function flowWidthScale(value: number, maxValue: number): number;

  /** Determine gradient animation parameters for a flow line. */
  export function flowGradientAnimation(value: number, maxValue: number): GradientAnimation | null;

  /** Determine how many flow lines to display based on dataset size. */
  export function flowDisplayCount(rowCount: number): number;

  /** Determine how many flow lines receive the pulse animation. */
  export function flowPulseCount(displayCount: number): number;

  /** Format a flow tooltip label with region names and value. */
  export function formatFlowLabel(fromName: string, toName: string, value: number): string;

  /** Check whether a flow value is valid for rendering. */
  export function shouldRenderFlow(value: unknown): boolean;

  /** Validate flow metadata before displaying a tooltip. */
  export function isFlowMetaValid(meta: FlowMeta | null): boolean;

  /** Check whether a region pair should be rendered as a flow. */
  export function shouldRenderPair(fromCode: string, toCode: string): boolean;

  /** Build CSS class string for highlighting a region on hover. */
  export function getRegionHighlightClass(direction: "inbound" | "outbound"): string;

  /** Get descriptive info for an indicator code. */
  export function getIndicatorInfo(code: string): IndicatorInfo;

  /** Get the display title for a visualization mode. */
  export function getModeTitle(mode: string): string;

  /** Get the KOSIS item code used for net inflow/outflow calculation. */
  export function getNetItemCode(): string;

  /** Whether net fill coloring is enabled for region polygons. */
  export function getNetFillEnabled(): boolean;

  /** Get legend items for the net inflow/outflow display. */
  export function getNetLegendItems(): NetLegendItem[];

  /** Check whether merged data loading is enabled. */
  export function shouldUseMergedData(flag: unknown): boolean;
}

declare global {
  interface Window {
    flowStyle: typeof import("flow_style");
  }
}

export {};
