/**
 * Data loading module for Demographics app
 * Handles fetching, caching, and validation of KOSIS data
 * UMD module pattern for Node.js and browser compatibility
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.dataLoader = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ─── Dependencies (injected or from window) ─── */
  let config = null;
  let state = null;
  let dataUtils = null;
  let flowStyle = null;
  let regionMapping = null;
  let geoUtils = null;

  /**
   * Initialize module with dependencies
   * @param {object} deps - Dependencies object
   */
  function init(deps) {
    config = deps.config || (typeof window !== "undefined" ? window.appConfig : null);
    state = deps.state || (typeof window !== "undefined" ? window.appState : null);
    dataUtils = deps.dataUtils || (typeof window !== "undefined" ? window.dataUtils : null);
    flowStyle = deps.flowStyle || (typeof window !== "undefined" ? window.flowStyle : null);
    regionMapping = deps.regionMapping || (typeof window !== "undefined" ? window.regionMapping : null);
    geoUtils = deps.geoUtils || (typeof window !== "undefined" ? window.geoUtils : null);
  }

  /**
   * Fetch JSON from a URL with retry logic and exponential backoff.
   * Supports gzip-compressed files via DecompressionStream.
   * @param {string} url
   * @param {object} [options]
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<any>}
   */
  async function fetchJson(url, options) {
    const signal = options && options.signal;
    const maxRetries = config ? config.FETCH.MAX_RETRIES : 3;
    const baseDelay = config ? config.FETCH.BASE_DELAY_MS : 1000;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (signal && signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      try {
        const response = await fetch(url, signal ? { signal } : undefined);
        console.log("[fetchJson] fetch", url, response.status);
        if (!response.ok) {
          throw new Error(`데이터를 불러올 수 없습니다. (${response.status})`);
        }
        if (!url.endsWith(".gz")) {
          return response.json();
        }
        if (typeof DecompressionStream === "undefined" || !response.body) {
          throw new Error("브라우저에서 gzip 해제를 지원하지 않습니다.");
        }
        const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
        const text = await new Response(stream).text();
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (parseErr) {
          throw new Error("데이터 형식이 올바르지 않습니다. (JSON 파싱 실패)");
        }
        return parsed;
      } catch (error) {
        lastError = error;
        if (error.name === "AbortError") throw error;
        /* Do not retry client errors (4xx) */
        if (error.message && error.message.includes("(4")) throw error;
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.warn("[fetchJson] retry", attempt + 1, "after", delay, "ms");
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }

  /**
   * Load merged KOSIS data (all periods in one gzip file)
   * @param {AbortSignal} [signal]
   * @returns {Promise<object|null>} Merged periods object or null
   */
  async function loadMergedData(signal) {
    if (!state) return null;
    if (state.wasMergedAttempted()) return state.getMergedPeriods();

    console.log("[loadMergedData] start");

    /* Check if merged data should be used */
    if (flowStyle && flowStyle.shouldUseMergedData) {
      const useMerged = typeof window !== "undefined" ? window.KOSIS_USE_MERGED : true;
      if (!flowStyle.shouldUseMergedData(useMerged)) {
        console.log("[loadMergedData] disabled via flag");
        state.setMergedPeriods(null);
        return null;
      }
    }

    try {
      const url = config ? config.getMergedDataUrl() : "kosis_all.json.gz";
      const payload = await fetchJson(url, { signal });
      console.log("[loadMergedData] payload keys", Object.keys(payload || {}));
      const periods = payload.periods || null;
      state.setMergedPeriods(periods);
      return periods;
    } catch (error) {
      if (error.name === "AbortError") throw error;
      console.error("[loadMergedData] error", error);
      state.setMergedPeriods(null);
      return null;
    }
  }

  /**
   * Load office center coordinates
   * @param {AbortSignal} [signal]
   * @returns {Promise<Map|null>}
   */
  async function loadOfficeCenters(signal) {
    if (!state) return null;
    const existing = state.getOfficeCenters();
    if (existing) return existing;

    console.log("[loadOfficeCenters] start");
    try {
      const path = config ? config.DATA.OFFICE_CENTERS_PATH : "assets/geo/sido_office_centers.json";
      const response = await fetch(path, { signal });
      console.log("[loadOfficeCenters] fetch", response.status);
      if (!response.ok) return null;
      const payload = await response.json();
      console.log("[loadOfficeCenters] count", payload.length || 0);
      const centers = new Map(
        payload.map((item) => [item.code, { lat: item.lat, lon: item.lon }])
      );
      state.setOfficeCenters(centers);
      return centers;
    } catch (error) {
      console.error("[loadOfficeCenters] error", error);
      return null;
    }
  }

  /**
   * Build region index from GeoJSON features
   * @param {object} geojson
   * @param {number} width
   * @param {number} height
   * @param {Map} centers
   * @returns {object}
   */
  function buildRegionIndex(geojson, width, height, centers) {
    if (!regionMapping || !geoUtils) {
      throw new Error("필요한 모듈을 불러오지 못했습니다.");
    }

    const { normalizeSidoName, mapSidoNameToCode } = regionMapping;
    const { buildProjection, geometryToPath, geometryCentroid } = geoUtils;

    const farEastLon = config ? config.GEO.FAR_EAST_LON : 130.0;
    const padding = config ? config.GEO.PADDING : 30;

    const project = buildProjection(
      geojson.features,
      width,
      height,
      padding,
      (lon) => lon <= farEastLon
    );

    const regions = [];
    geojson.features.forEach((feature) => {
      const rawName = feature.properties.name || feature.properties.NAME || "";
      const normalized = normalizeSidoName(rawName);
      const code = mapSidoNameToCode(normalized);
      if (!code) return;
      let centroid = geometryCentroid(feature.geometry, project);
      if (centers && centers.has(code)) {
        const center = centers.get(code);
        centroid = project([center.lon, center.lat]);
      }
      regions.push({
        code,
        name: normalized,
        path: geometryToPath(feature.geometry, project),
        centroid,
      });
    });

    const byCode = new Map(regions.map((region) => [region.code, region]));
    return { regions, byCode };
  }

  /**
   * Load GeoJSON boundaries and build region index
   * @param {AbortSignal} [signal]
   * @returns {Promise<object>}
   */
  async function loadGeoJson(signal) {
    if (!state) throw new Error("State module not initialized");

    const existing = state.getGeoIndex();
    if (existing) return existing;

    if (!regionMapping) {
      throw new Error("지역 매핑 스크립트를 불러오지 못했습니다.");
    }

    console.log("[loadGeoJson] start");
    const path = config ? config.DATA.GEOJSON_PATH : "assets/geo/korea_sido.geojson";
    const response = await fetch(path, { signal });
    console.log("[loadGeoJson] fetch", response.status);
    if (!response.ok) {
      throw new Error("GeoJSON 경계 파일을 불러올 수 없습니다.");
    }
    const geojson = await response.json();
    console.log("[loadGeoJson] features", geojson?.features?.length || 0);

    const centers = await loadOfficeCenters(signal);
    const width = config ? config.GEO.MAP_WIDTH : 900;
    const height = config ? config.GEO.MAP_HEIGHT : 780;
    const geoIndex = buildRegionIndex(geojson, width, height, centers);
    state.setGeoIndex(geoIndex);
    return geoIndex;
  }

  /**
   * Load data for a specific period (year and optional month)
   * @param {number} year
   * @param {string|null} month
   * @param {AbortSignal} [signal]
   * @returns {Promise<Array>}
   */
  async function loadData(year, month, signal) {
    if (!state) throw new Error("State module not initialized");

    console.log("[loadData] start", { year, month });
    const buildCacheKey = dataUtils ? dataUtils.buildCacheKey : (y, m) => `${y}${m || ""}`;
    const key = buildCacheKey(year, month);

    /* Check cache first */
    if (state.hasCacheEntry(key)) {
      return state.getCacheEntry(key);
    }

    /* Try merged data */
    const merged = await loadMergedData(signal);
    if (merged && merged[key]) {
      console.log("[loadData] merged hit", key, merged[key].length);
      const rows = merged[key];
      if (dataUtils && dataUtils.validateDataset) {
        const check = dataUtils.validateDataset(rows);
        if (!check.valid) {
          console.warn("[loadData] validation failed for merged key", key, check.reason);
        }
      }
      state.setCacheEntry(key, rows);
      return rows;
    }

    /* Fetch individual file */
    const url = config ? config.getDataUrl(year, month) : `data/kosis_yearly/kosis_${year}.json`;
    const data = await fetchJson(url, { signal });
    console.log("[loadData] fetch", url);
    console.log("[loadData] rows", data.length || 0);

    if (dataUtils && dataUtils.validateDataset) {
      const check = dataUtils.validateDataset(data);
      if (!check.valid) {
        throw new Error(`데이터 검증 실패: ${check.reason}`);
      }
    }

    state.setCacheEntry(key, data);
    return data;
  }

  /**
   * Prefetch a period's data for faster access
   * @param {{year: number, month?: string}} period
   * @returns {Promise<void>}
   */
  async function prefetchPeriod({ year, month }) {
    if (!state) return;
    const buildCacheKey = dataUtils ? dataUtils.buildCacheKey : (y, m) => `${y}${m || ""}`;
    const key = buildCacheKey(year, month);
    if (state.hasCacheEntry(key)) return;
    try {
      await loadData(year, month);
    } catch (error) {
      console.warn("[prefetch] failed", key, error.message);
    }
  }

  return {
    init,
    fetchJson,
    loadMergedData,
    loadOfficeCenters,
    loadGeoJson,
    loadData,
    prefetchPeriod,
    buildRegionIndex,
  };
});
