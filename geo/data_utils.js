(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.dataUtils = factory();
  }
})(this, function () {
  /** @type {Array<{code: string, label: string}>} */
  const AGE_GROUPS = [
    { code: "000", label: "전체" },
    { code: "020", label: "0-4세" },
    { code: "050", label: "5-9세" },
    { code: "070", label: "10-14세" },
    { code: "100", label: "15-19세" },
    { code: "120", label: "20-24세" },
    { code: "130", label: "25-29세" },
    { code: "150", label: "30-34세" },
    { code: "160", label: "35-39세" },
    { code: "180", label: "40-44세" },
    { code: "190", label: "45-49세" },
    { code: "210", label: "50-54세" },
    { code: "230", label: "55-59세" },
    { code: "260", label: "60-64세" },
    { code: "280", label: "65-69세" },
    { code: "310", label: "70-74세" },
    { code: "330", label: "75-79세" },
    { code: "340", label: "80세 이상" },
  ];

  /** Keys every data row must contain. */
  const REQUIRED_ROW_KEYS = ["ITM_ID", "C1", "C2", "C3", "C4", "DT"];

  /** Minimum number of rows for a dataset to be considered valid. */
  const MIN_DATASET_ROWS = 10;

  /**
   * Check whether a single data row has the expected schema.
   * @param {*} row
   * @returns {boolean}
   */
  function validateRow(row) {
    if (!row || typeof row !== "object") return false;
    return REQUIRED_ROW_KEYS.every(function (key) {
      return key in row;
    });
  }

  /**
   * Validate an entire dataset array.
   * @param {*} rows
   * @returns {{valid: boolean, reason: string|null}}
   */
  function validateDataset(rows) {
    if (!Array.isArray(rows)) {
      return { valid: false, reason: "데이터가 배열이 아닙니다." };
    }
    if (rows.length < MIN_DATASET_ROWS) {
      return { valid: false, reason: "데이터가 너무 적습니다. (" + rows.length + "행)" };
    }
    var sampleSize = Math.min(5, rows.length);
    for (var i = 0; i < sampleSize; i++) {
      if (!validateRow(rows[i])) {
        return { valid: false, reason: "행 " + i + "에 필수 필드가 누락되었습니다." };
      }
    }
    return { valid: true, reason: null };
  }

  /**
   * Safely parse the DT (data value) field from a KOSIS row.
   * Handles commas, nulls, and non-numeric strings.
   * @param {*} dt
   * @returns {number}
   */
  function parseDT(dt) {
    if (dt === null || dt === undefined) return 0;
    var num = Number(String(dt).replace(/,/g, ""));
    return Number.isFinite(num) ? num : 0;
  }

  /**
   * Build a consistent cache key from year and optional month.
   * @param {number} year
   * @param {string|null} month
   * @returns {string}
   */
  function buildCacheKey(year, month) {
    return "" + year + (month || "");
  }

  /**
   * Build the playback timeline array.
   * @param {number} [startYear=1995]
   * @param {number} [endYear=2024]
   * @param {number} [monthlyYear=2025]
   * @param {number} [maxMonth=11]
   * @returns {Array<{year: number, month: string|null}>}
   */
  function buildTimeline(startYear, endYear, monthlyYear, maxMonth) {
    startYear = startYear || 1995;
    endYear = endYear || 2024;
    monthlyYear = monthlyYear || 2025;
    maxMonth = maxMonth || 11;
    var timeline = [];
    for (var year = startYear; year <= endYear; year++) {
      timeline.push({ year: year, month: null });
    }
    for (var month = 1; month <= maxMonth; month++) {
      timeline.push({ year: monthlyYear, month: String(month).padStart(2, "0") });
    }
    return timeline;
  }

  /**
   * Calculate playback interval in ms for a given period and speed.
   * @param {{year: number, month: string|null}|null} period
   * @param {number} [speed=1]
   * @param {number} [yearMs=1000]
   * @param {number} [monthMs=700]
   * @returns {number}
   */
  function getPlaybackInterval(period, speed, yearMs, monthMs) {
    speed = speed || 1;
    yearMs = yearMs || 1000;
    monthMs = monthMs || 700;
    var base = period && period.month ? monthMs : yearMs;
    return Math.max(300, Math.round(base / speed));
  }

  /**
   * Determine how many periods to prefetch based on connection quality.
   * @param {{saveData?: boolean, downlink?: number}|null} connection
   * @returns {number}
   */
  function getPrefetchCount(connection) {
    if (!connection) return 3;
    if (connection.saveData) return 1;
    var downlink = connection.downlink || 0;
    if (downlink && downlink < 2) return 1;
    if (downlink && downlink > 5) return 4;
    return 3;
  }

  /**
   * Clamp and validate an age slider index.
   * @param {*} value
   * @param {number} [maxIndex=17]
   * @returns {number}
   */
  function getAgeIndex(value, maxIndex) {
    var index = Number(value);
    if (!Number.isFinite(index)) return 0;
    var max = maxIndex !== undefined ? maxIndex : AGE_GROUPS.length - 1;
    return Math.min(Math.max(index, 0), max);
  }

  /**
   * Format a number using Korean locale (comma-separated).
   * @param {number} value
   * @returns {string}
   */
  function formatNumber(value) {
    return new Intl.NumberFormat("ko-KR").format(value);
  }

  return {
    AGE_GROUPS: AGE_GROUPS,
    REQUIRED_ROW_KEYS: REQUIRED_ROW_KEYS,
    MIN_DATASET_ROWS: MIN_DATASET_ROWS,
    validateRow: validateRow,
    validateDataset: validateDataset,
    parseDT: parseDT,
    buildCacheKey: buildCacheKey,
    buildTimeline: buildTimeline,
    getPlaybackInterval: getPlaybackInterval,
    getPrefetchCount: getPrefetchCount,
    getAgeIndex: getAgeIndex,
    formatNumber: formatNumber,
  };
});
