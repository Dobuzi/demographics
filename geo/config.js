/**
 * Centralized configuration module for Demographics app
 * All magic numbers and configuration values in one place
 * UMD module pattern for Node.js and browser compatibility
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.appConfig = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /**
   * Data source configuration
   */
  const DATA = {
    /** Base URL for KOSIS data (set via window.KOSIS_DATA_BASE_URL) */
    BASE_URL: "",
    /** Merged data filename */
    MERGED_FILENAME: "kosis_all.json.gz",
    /** Directory for yearly data files */
    DATA_DIR: "data/kosis_yearly",
    /** GeoJSON boundaries file path */
    GEOJSON_PATH: "assets/geo/korea_sido.geojson",
    /** Office centers file path */
    OFFICE_CENTERS_PATH: "assets/geo/sido_office_centers.json",
    /** Default month for monthly data */
    DEFAULT_MONTH: "11",
  };

  /**
   * Fetch/network configuration
   */
  const FETCH = {
    /** Maximum retry attempts for failed fetches */
    MAX_RETRIES: 3,
    /** Base delay in ms for exponential backoff */
    BASE_DELAY_MS: 1000,
  };

  /**
   * Cache configuration
   */
  const CACHE = {
    /** Maximum number of data entries to keep in LRU cache */
    MAX_ENTRIES: 12,
  };

  /**
   * Playback configuration
   */
  const PLAYBACK = {
    /** Interval between years in ms during playback */
    YEAR_INTERVAL_MS: 1000,
    /** Interval between months in ms during playback */
    MONTH_INTERVAL_MS: 700,
  };

  /**
   * Zoom and pan configuration
   */
  const ZOOM = {
    /** Minimum zoom level */
    MIN: 0.5,
    /** Maximum zoom level */
    MAX: 4,
    /** Zoom step per action */
    STEP: 0.25,
  };

  /**
   * ViewBox configuration for SVG
   */
  const VIEWBOX = {
    /** Default viewBox x offset */
    X: -40,
    /** Default viewBox y offset */
    Y: 0,
    /** Default viewBox width */
    WIDTH: 980,
    /** Default viewBox height */
    HEIGHT: 780,
  };

  /**
   * Geo/projection configuration
   */
  const GEO = {
    /** Longitude threshold for far-east compression */
    FAR_EAST_LON: 130.0,
    /** Compression factor for far-east regions (Ulleungdo, Dokdo) */
    FAR_EAST_COMPRESS: 0.25,
    /** Map width */
    MAP_WIDTH: 900,
    /** Map height */
    MAP_HEIGHT: 780,
    /** Projection padding */
    PADDING: 30,
  };

  /**
   * UI configuration
   */
  const UI = {
    /** Number of top flows to display in sidebar */
    TOP_FLOW_COUNT: 3,
    /** Swipe threshold for touch navigation */
    SWIPE_THRESHOLD: 50,
    /** Flow transition duration in ms */
    FLOW_TRANSITION_MS: 150,
  };

  /**
   * Initialize configuration from window globals
   * Call this after DOM is ready if using browser globals
   */
  function init() {
    if (typeof window !== "undefined") {
      if (window.KOSIS_DATA_BASE_URL) {
        DATA.BASE_URL = window.KOSIS_DATA_BASE_URL;
        DATA.DATA_DIR = `${window.KOSIS_DATA_BASE_URL}/kosis_yearly`;
      }
    }
  }

  /**
   * Get the full URL for merged data file
   * @returns {string}
   */
  function getMergedDataUrl() {
    const baseDir = DATA.BASE_URL || DATA.DATA_DIR.split("/").slice(0, -1).join("/") || ".";
    return `${baseDir}/${DATA.MERGED_FILENAME}`;
  }

  /**
   * Get the full URL for a period's data file
   * @param {number} year
   * @param {string|null} month
   * @returns {string}
   */
  function getDataUrl(year, month) {
    const filename = month ? `kosis_${year}${month}.json` : `kosis_${year}.json`;
    return `${DATA.DATA_DIR}/${filename}`;
  }

  /**
   * Get base viewBox object
   * @returns {{x: number, y: number, w: number, h: number}}
   */
  function getBaseViewBox() {
    return {
      x: VIEWBOX.X,
      y: VIEWBOX.Y,
      w: VIEWBOX.WIDTH,
      h: VIEWBOX.HEIGHT,
    };
  }

  return {
    DATA,
    FETCH,
    CACHE,
    PLAYBACK,
    ZOOM,
    VIEWBOX,
    GEO,
    UI,
    init,
    getMergedDataUrl,
    getDataUrl,
    getBaseViewBox,
  };
});
