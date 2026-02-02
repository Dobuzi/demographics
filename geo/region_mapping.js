(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.regionMapping = factory();
  }
})(this, function () {
  /**
   * Canonical Sido name → two-digit administrative code.
   * Covers all 17 current South Korean Sido-level regions.
   * @type {Object<string, string>}
   */
  const NAME_TO_CODE = {
    서울특별시: "11",
    부산광역시: "26",
    대구광역시: "27",
    인천광역시: "28",
    광주광역시: "29",
    대전광역시: "30",
    울산광역시: "31",
    세종특별자치시: "36",
    경기도: "41",
    강원특별자치도: "51",
    충청북도: "43",
    충청남도: "44",
    전북특별자치도: "52",
    전라남도: "46",
    경상북도: "47",
    경상남도: "48",
    제주특별자치도: "50",
  };

  /**
   * Short/variant names → canonical Sido names.
   * Maps common abbreviations and older administrative names
   * (e.g. "강원도" → "강원특별자치도", "전라북도" → "전북특별자치도")
   * to their current canonical forms used in GeoJSON and KOSIS data.
   * @type {Object<string, string>}
   */
  const ALIASES = {
    서울: "서울특별시",
    부산: "부산광역시",
    대구: "대구광역시",
    인천: "인천광역시",
    광주: "광주광역시",
    대전: "대전광역시",
    울산: "울산광역시",
    세종: "세종특별자치시",
    경기: "경기도",
    강원도: "강원특별자치도",
    강원: "강원특별자치도",
    충북: "충청북도",
    충남: "충청남도",
    전북: "전북특별자치도",
    전라북도: "전북특별자치도",
    전남: "전라남도",
    경북: "경상북도",
    경남: "경상남도",
    제주: "제주특별자치도",
  };

  /**
   * Normalize a region name to its canonical Sido form.
   * If the input is an alias (short or legacy name), it is expanded.
   * If already canonical or unknown, returned as-is.
   * @param {string} name - Raw region name from GeoJSON or user input.
   * @returns {string} Canonical Sido name, or empty string if falsy input.
   */
  function normalizeSidoName(name) {
    if (!name) return "";
    return ALIASES[name] || name;
  }

  /**
   * Map a region name (canonical or alias) to its two-digit Sido code.
   * @param {string} name - Region name (any form recognized by normalizeSidoName).
   * @returns {string|null} Two-digit code (e.g. "11" for Seoul), or null if not found.
   */
  function mapSidoNameToCode(name) {
    const normalized = normalizeSidoName(name);
    return NAME_TO_CODE[normalized] || null;
  }

  return {
    normalizeSidoName,
    mapSidoNameToCode,
    NAME_TO_CODE,
  };
});
