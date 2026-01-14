(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.flowStyle = factory();
  }
})(this, function () {
  function buildGradientStops(fromColor, toColor) {
    return [
      { offset: "0%", color: fromColor, opacity: 0.82 },
      { offset: "100%", color: toColor, opacity: 0.82 },
    ];
  }

  const FLOW_COLORS = {
    inbound: "#27d17f",
    outbound: "#f05b4c",
  };

  function flowWidthScale(value, maxValue) {
    const ratio = maxValue ? value / maxValue : 0;
    return 2.2 + ratio * 7.3;
  }

  function flowGradientAnimation(value, maxValue) {
    return null;
  }

  function flowDisplayCount(rowCount) {
    if (rowCount >= 10000) return 60;
    if (rowCount >= 5000) return 50;
    return 40;
  }

  function flowPulseCount(displayCount) {
    if (displayCount >= 60) return 12;
    if (displayCount >= 50) return 10;
    return 8;
  }

  function formatFlowLabel(fromName, toName, value) {
    const formatter = new Intl.NumberFormat("ko-KR");
    return `${fromName} → ${toName} · ${formatter.format(value)}명`;
  }

  function shouldRenderFlow(value) {
    if (!Number.isFinite(value)) return false;
    return Number(value) > 0;
  }

  function isFlowMetaValid(meta) {
    if (!meta) return false;
    if (!meta.from || !meta.to) return false;
    const value = Number(meta.value);
    return Number.isFinite(value) && value > 0;
  }

  function shouldRenderPair(fromCode, toCode) {
    if (!fromCode || !toCode) return false;
    return String(fromCode) !== String(toCode);
  }

  function getRegionHighlightClass(direction) {
    return `region-highlight ${direction}`;
  }

  function getIndicatorInfo(code) {
    if (code === "T80") {
      return {
        title: "순이동자수",
        description:
          "전입자수에서 전출자수를 뺀 값입니다. 양수면 순유입, 음수면 순유출을 의미합니다.",
      };
    }
    return {
      title: "이동자수",
      description:
        "행정구역 간 이동한 총 인원입니다. 전입과 전출 흐름의 규모를 나타냅니다.",
    };
  }

  function getModeTitle(mode) {
    if (mode === "net") {
      return "인구의 유입과 유출";
    }
    return "인구 이동";
  }

  function getNetItemCode() {
    return "T70";
  }

  function getNetFillEnabled() {
    return true;
  }

  function getNetLegendItems() {
    return [
      { label: "유입", color: FLOW_COLORS.inbound },
      { label: "유출", color: FLOW_COLORS.outbound },
    ];
  }

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
