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
      kosisData: "KOSIS 데이터 기반",
      persons: "명",
      loading: "로딩 중...",
      error: "오류가 발생했습니다",
      retry: "다시 시도",
      speed: "배속",
      fromTo: "→",
    },
    en: {
      title: "Population Migration",
      totalFlow: "Total Migration",
      ageLabel: "Age Group",
      ageAll: "All Ages",
      play: "Play",
      pause: "Pause",
      settings: "Settings",
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
      kosisData: "Based on KOSIS Data",
      persons: "persons",
      loading: "Loading...",
      error: "An error occurred",
      retry: "Retry",
      speed: "Speed",
      fromTo: "→",
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
