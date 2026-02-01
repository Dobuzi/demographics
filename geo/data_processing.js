(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(
      require("./flow_style"),
      require("./data_utils")
    );
  } else {
    root.dataProcessing = factory(root.flowStyle, root.dataUtils);
  }
})(this, function (flowStyle, dataUtils) {
  var shouldRenderPair = flowStyle && flowStyle.shouldRenderPair;
  var shouldRenderFlow = flowStyle && flowStyle.shouldRenderFlow;
  var parseDT = (dataUtils && dataUtils.parseDT) || function (dt) {
    if (dt === null || dt === undefined) return 0;
    var num = Number(String(dt).replace(/,/g, ""));
    return Number.isFinite(num) ? num : 0;
  };

  /**
   * Aggregate migration flow pairs from raw data rows.
   * @param {Array<Object>} data - Raw KOSIS rows.
   * @param {{item: string, sex: string, age: string}} options - Active filters.
   * @param {Map<string, Object>} regionByCode - Region index keyed by Sido code.
   * @returns {{flows: Array<Object>, total: number}}
   */
  function buildFlows(data, options, regionByCode) {
    var totals = new Map();
    var sum = 0;

    data.forEach(function (row) {
      if (row.ITM_ID !== options.item) return;
      if (row.C3 !== options.sex) return;
      if (row.C4 !== options.age) return;
      if (row.C1 === "00" || row.C2 === "00") return;
      if (shouldRenderPair ? !shouldRenderPair(row.C1, row.C2) : row.C1 === row.C2) return;
      if (!regionByCode.has(row.C1) || !regionByCode.has(row.C2)) return;

      var value = parseDT(row.DT);
      if (shouldRenderFlow ? !shouldRenderFlow(value) : value <= 0) return;
      var key = row.C1 + "-" + row.C2;
      totals.set(key, (totals.get(key) || 0) + value);
      sum += value;
    });

    var flows = Array.from(totals.entries())
      .map(function (entry) {
        var key = entry[0];
        var value = entry[1];
        var parts = key.split("-");
        var fromCode = parts[0];
        var toCode = parts[1];
        var from = regionByCode.get(fromCode);
        var to = regionByCode.get(toCode);
        if (!from || !to || !from.name || !to.name) return null;
        return {
          value: value,
          from: from,
          to: to,
          fromCode: fromCode,
          toCode: toCode,
          label: from.name + " → " + to.name,
        };
      })
      .filter(Boolean)
      .sort(function (a, b) { return b.value - a.value; });

    return { flows: flows, total: sum };
  }

  /**
   * Calculate net inflow/outflow per region.
   * @param {Array<Object>} data - Raw KOSIS rows.
   * @param {{item: string, sex: string, age: string}} options - Active filters.
   * @param {Map<string, Object>} regionByCode - Region index keyed by Sido code.
   * @returns {{entries: Array<{code: string, value: number, region: Object}>, total: number}}
   */
  function buildNet(data, options, regionByCode) {
    var net = new Map();
    var total = 0;

    data.forEach(function (row) {
      if (row.ITM_ID !== options.item) return;
      if (row.C3 !== options.sex) return;
      if (row.C4 !== options.age) return;
      if (row.C1 === "00" || row.C2 === "00") return;
      if (!regionByCode.has(row.C1) || !regionByCode.has(row.C2)) return;

      var value = parseDT(row.DT);
      if (!value) return;
      net.set(row.C1, (net.get(row.C1) || 0) - value);
      net.set(row.C2, (net.get(row.C2) || 0) + value);
      total += value;
    });

    var entries = Array.from(net.entries()).map(function (entry) {
      return {
        code: entry[0],
        value: entry[1],
        region: regionByCode.get(entry[0]),
      };
    });
    entries.sort(function (a, b) {
      return Math.abs(b.value) - Math.abs(a.value);
    });

    return { entries: entries, total: total };
  }

  return {
    buildFlows: buildFlows,
    buildNet: buildNet,
  };
});
