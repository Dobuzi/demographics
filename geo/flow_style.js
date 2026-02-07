(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.flowStyle = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ─── i18n helper (falls back to Korean) ─── */
  function t(key, params) {
    const i18n = typeof window !== "undefined" ? window.i18n : null;
    if (i18n && typeof i18n.t === "function") {
      return i18n.t(key, params);
    }
    /* Fallback Korean strings */
    const fallbacks = {
      persons: "명",
      inflow: "유입",
      outflow: "유출",
      netMigrantTitle: "순이동자수",
      netMigrantDesc: "전입자수에서 전출자수를 뺀 값입니다. 양수면 순유입, 음수면 순유출을 의미합니다.",
      totalMigrantTitle: "이동자수",
      totalMigrantDesc: "행정구역 간 이동한 총 인원입니다. 전입과 전출 흐름의 규모를 나타냅니다.",
      modeTitleNet: "인구의 유입과 유출",
      modeTitleDefault: "인구 이동",
    };
    let text = fallbacks[key] || key;
    if (params) {
      Object.keys(params).forEach((param) => {
        text = text.replace(new RegExp(`\\{${param}\\}`, "g"), params[param]);
      });
    }
    return text;
  }

  /**
   * Build SVG gradient stop definitions for a flow line.
   * @param {string} fromColor - CSS color for the start (outbound) end.
   * @param {string} toColor - CSS color for the end (inbound) end.
   * @returns {Array<{offset: string, color: string, opacity: number}>}
   */
  function buildGradientStops(fromColor, toColor) {
    return [
      { offset: "0%", color: fromColor, opacity: 0.82 },
      { offset: "100%", color: toColor, opacity: 0.82 },
    ];
  }

  /** @type {{inbound: string, outbound: string}} */
  const FLOW_COLORS = {
    inbound: "#27d17f",
    outbound: "#f05b4c",
  };

  /**
   * Calculate SVG stroke width for a flow line based on its value.
   * Returns a value between 2.2 (minimum) and 9.5 (maximum).
   * @param {number} value - The flow magnitude.
   * @param {number} maxValue - The maximum flow magnitude in the current dataset.
   * @returns {number} Stroke width in SVG units.
   */
  function flowWidthScale(value, maxValue) {
    const ratio = maxValue ? value / maxValue : 0;
    return 2.2 + ratio * 7.3;
  }

  /**
   * Determine gradient animation parameters for a flow line.
   * Currently returns null (no animation), reserved for future use.
   * @param {number} value - The flow magnitude.
   * @param {number} maxValue - The maximum flow magnitude.
   * @returns {null|{duration: number}} Animation config or null.
   */
  function flowGradientAnimation(value, maxValue) {
    return null;
  }

  /**
   * Determine how many flow lines to display based on dataset size.
   * Larger datasets show more flows for richer visualization.
   * @param {number} rowCount - Number of rows in the current dataset.
   * @returns {number} Number of flow lines to render (40, 50, or 60).
   */
  function flowDisplayCount(rowCount) {
    if (rowCount >= 10000) return 60;
    if (rowCount >= 5000) return 50;
    return 40;
  }

  /**
   * Determine how many flow lines receive the pulse animation.
   * @param {number} displayCount - Total number of displayed flows.
   * @returns {number} Number of flows with pulse animation (8, 10, or 12).
   */
  function flowPulseCount(displayCount) {
    if (displayCount >= 60) return 12;
    if (displayCount >= 50) return 10;
    return 8;
  }

  /**
   * Format a flow tooltip label with region names and value.
   * @param {string} fromName - Origin region name.
   * @param {string} toName - Destination region name.
   * @param {number} value - Migration count.
   * @returns {string} Formatted label, e.g. "서울특별시 → 경기도 · 12,345명".
   */
  function formatFlowLabel(fromName, toName, value) {
    const formatter = new Intl.NumberFormat("ko-KR");
    return `${fromName} → ${toName} · ${formatter.format(value)}${t("persons")}`;
  }

  /**
   * Check whether a flow value is valid for rendering.
   * @param {*} value - The flow magnitude to check.
   * @returns {boolean} True if value is a finite positive number.
   */
  function shouldRenderFlow(value) {
    if (!Number.isFinite(value)) return false;
    return Number(value) > 0;
  }

  /**
   * Validate flow metadata before displaying a tooltip.
   * @param {{from?: string, to?: string, value?: *}|null} meta - Flow metadata.
   * @returns {boolean} True if metadata is valid for display.
   */
  function isFlowMetaValid(meta) {
    if (!meta) return false;
    if (!meta.from || !meta.to) return false;
    const value = Number(meta.value);
    return Number.isFinite(value) && value > 0;
  }

  /**
   * Check whether a region pair should be rendered as a flow.
   * Filters out self-loops (same origin and destination).
   * @param {string} fromCode - Origin Sido code.
   * @param {string} toCode - Destination Sido code.
   * @returns {boolean} True if the pair represents a valid migration flow.
   */
  function shouldRenderPair(fromCode, toCode) {
    if (!fromCode || !toCode) return false;
    return String(fromCode) !== String(toCode);
  }

  /**
   * Build CSS class string for highlighting a region on hover.
   * @param {"inbound"|"outbound"} direction - Highlight direction.
   * @returns {string} Space-separated CSS class names.
   */
  function getRegionHighlightClass(direction) {
    return `region-highlight ${direction}`;
  }

  /**
   * Get descriptive info for an indicator code (used in info tooltip).
   * @param {string} code - Indicator code ("T80" for net, others for total).
   * @returns {{title: string, description: string}}
   */
  function getIndicatorInfo(code) {
    if (code === "T80") {
      return {
        title: t("netMigrantTitle"),
        description: t("netMigrantDesc"),
      };
    }
    return {
      title: t("totalMigrantTitle"),
      description: t("totalMigrantDesc"),
    };
  }

  /**
   * Get the display title for a visualization mode.
   * @param {string} mode - "net" or other mode identifier.
   * @returns {string} Localized title string.
   */
  function getModeTitle(mode) {
    if (mode === "net") {
      return t("modeTitleNet");
    }
    return t("modeTitleDefault");
  }

  /**
   * Get the KOSIS item code used for net inflow/outflow calculation.
   * @returns {string} Item code "T70".
   */
  function getNetItemCode() {
    return "T70";
  }

  /**
   * Whether net fill coloring is enabled for region polygons.
   * @returns {boolean}
   */
  function getNetFillEnabled() {
    return true;
  }

  /**
   * Get legend items for the net inflow/outflow display.
   * @returns {Array<{label: string, color: string}>}
   */
  function getNetLegendItems() {
    return [
      { label: t("inflow"), color: FLOW_COLORS.inbound },
      { label: t("outflow"), color: FLOW_COLORS.outbound },
    ];
  }

  /**
   * Check whether merged data loading is enabled.
   * @param {*} flag - The KOSIS_USE_MERGED window flag.
   * @returns {boolean} True only when flag is strictly `true`.
   */
  function shouldUseMergedData(flag) {
    return flag === true;
  }

  return {
    buildGradientStops,
    FLOW_COLORS,
    flowWidthScale,
    flowGradientAnimation,
    flowDisplayCount,
    flowPulseCount,
    formatFlowLabel,
    shouldRenderFlow,
    isFlowMetaValid,
    shouldRenderPair,
    getRegionHighlightClass,
    getIndicatorInfo,
    getModeTitle,
    getNetItemCode,
    getNetFillEnabled,
    getNetLegendItems,
    shouldUseMergedData,
  };
});
