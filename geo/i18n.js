/**
 * Internationalization (i18n) module for Demographics app
 * Supports Korean (ko) and English (en) languages
 * UMD module pattern for Node.js and browser compatibility
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.i18n = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const translations = {
    ko: {
      title: "인구의 이동",
      totalFlow: "총 이동 규모",
      ageLabel: "연령대",
      ageAll: "전체 연령",
      play: "재생",
      pause: "일시정지",
      settings: "설정",
      settingsOpen: "설정 열기",
      settingsClose: "설정 닫기",
      year: "년",
      month: "월",
      sex: "성별",
      sexAll: "전체",
      sexMale: "남성",
      sexFemale: "여성",
      item: "항목",
      itemTotal: "총이동",
      itemIn: "전입",
      itemOut: "전출",
      top3: "TOP3",
      legend: "이동 규모 (선 두께)",
      netInflow: "순유입",
      netOutflow: "순유출",
      inflow: "유입",
      outflow: "유출",
      kosisData: "KOSIS 데이터 기반",
      persons: "명",
      loading: "로딩 중...",
      error: "오류가 발생했습니다",
      retry: "다시 시도",
      speed: "배속",
      fromTo: "→",
      flowFormat: "{from} → {to} · {value}명",
      netMigrantTitle: "순이동자수",
      netMigrantDesc: "전입자수에서 전출자수를 뺀 값입니다. 양수면 순유입, 음수면 순유출을 의미합니다.",
      totalMigrantTitle: "이동자수",
      totalMigrantDesc: "행정구역 간 이동한 총 인원입니다. 전입과 전출 흐름의 규모를 나타냅니다.",
      modeTitleNet: "인구의 유입과 유출",
      modeTitleDefault: "인구 이동",
      currentYear: "현재 연도",
      migrationCount: "이 경로의 이동자 수입니다.",
      dataLoadError: "데이터를 불러올 수 없습니다",
      gzipNotSupported: "브라우저에서 gzip 해제를 지원하지 않습니다.",
      jsonParseError: "데이터 형식이 올바르지 않습니다. (JSON 파싱 실패)",
      regionMappingError: "지역 매핑 스크립트를 불러오지 못했습니다.",
      geojsonError: "GeoJSON 경계 파일을 불러올 수 없습니다.",
      validationError: "데이터 검증 실패",
      zoomIn: "확대",
      zoomOut: "축소",
      zoomReset: "원래 크기",
    },
    en: {
      title: "Population Migration",
      totalFlow: "Total Migration",
      ageLabel: "Age Group",
      ageAll: "All Ages",
      play: "Play",
      pause: "Pause",
      settings: "Settings",
      settingsOpen: "Open settings",
      settingsClose: "Close settings",
      year: "Year",
      month: "Month",
      sex: "Sex",
      sexAll: "All",
      sexMale: "Male",
      sexFemale: "Female",
      item: "Item",
      itemTotal: "Total",
      itemIn: "Inflow",
      itemOut: "Outflow",
      top3: "TOP 3",
      legend: "Migration Scale (Line Width)",
      netInflow: "Net Inflow",
      netOutflow: "Net Outflow",
      inflow: "Inflow",
      outflow: "Outflow",
      kosisData: "Based on KOSIS Data",
      persons: "persons",
      loading: "Loading...",
      error: "An error occurred",
      retry: "Retry",
      speed: "Speed",
      fromTo: "→",
      flowFormat: "{from} → {to} · {value} persons",
      netMigrantTitle: "Net Migration",
      netMigrantDesc: "The difference between inflow and outflow. Positive means net inflow, negative means net outflow.",
      totalMigrantTitle: "Total Migration",
      totalMigrantDesc: "Total number of people who moved between administrative regions.",
      modeTitleNet: "Population Inflow and Outflow",
      modeTitleDefault: "Population Migration",
      currentYear: "Current year",
      migrationCount: "Number of migrants on this route.",
      dataLoadError: "Failed to load data",
      gzipNotSupported: "Browser does not support gzip decompression.",
      jsonParseError: "Invalid data format (JSON parse failed)",
      regionMappingError: "Failed to load region mapping module.",
      geojsonError: "Failed to load GeoJSON boundaries.",
      validationError: "Data validation failed",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      zoomReset: "Reset view",
    },
  };

  let currentLocale = "ko";

  /**
   * Get translation for a key
   * @param {string} key - Translation key
   * @param {object} [params] - Optional parameters for interpolation
   * @returns {string} Translated string
   */
  function t(key, params) {
    const locale = translations[currentLocale] || translations.ko;
    let text = locale[key] || translations.ko[key] || key;
    if (params) {
      Object.keys(params).forEach((param) => {
        text = text.replace(new RegExp(`\\{${param}\\}`, "g"), params[param]);
      });
    }
    return text;
  }

  /**
   * Set current locale
   * @param {string} locale - Locale code (ko or en)
   */
  function setLocale(locale) {
    if (translations[locale]) {
      currentLocale = locale;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("demographics-locale", locale);
      }
    }
  }

  /**
   * Get current locale
   * @returns {string} Current locale code
   */
  function getLocale() {
    return currentLocale;
  }

  /**
   * Initialize locale from localStorage or browser preference
   */
  function initLocale() {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("demographics-locale");
      if (saved && translations[saved]) {
        currentLocale = saved;
        return;
      }
    }
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language || navigator.userLanguage;
      if (browserLang && browserLang.startsWith("en")) {
        currentLocale = "en";
      }
    }
  }

  /**
   * Get list of available locales
   * @returns {string[]} Array of locale codes
   */
  function getAvailableLocales() {
    return Object.keys(translations);
  }

  return {
    translations,
    t,
    setLocale,
    getLocale,
    initLocale,
    getAvailableLocales,
  };
});
