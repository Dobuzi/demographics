/* ─── Configuration ─── */
const DATA_BASE_URL = window.KOSIS_DATA_BASE_URL || "";
const MERGED_FILENAME = "kosis_all.json.gz";
const DATA_DIR = DATA_BASE_URL ? `${DATA_BASE_URL}/kosis_yearly` : "data/kosis_yearly";
const GEOJSON_PATH = "assets/geo/korea_sido.geojson";
const OFFICE_CENTERS_PATH = "assets/geo/sido_office_centers.json";
const DEFAULT_MONTH = "11";
const FAR_EAST_LON = 130.0;
const FAR_EAST_COMPRESS = 0.25;
const PLAY_INTERVAL_YEAR_MS = 1000;
const PLAY_INTERVAL_MONTH_MS = 700;
const MAX_CACHE_ENTRIES = 12;
const TOP_FLOW_COUNT = 3;
const FETCH_MAX_RETRIES = 3;
const FETCH_BASE_DELAY_MS = 1000;

/* ─── DOM References ─── */
const FLOW_MAP = document.getElementById("flow-map");
const FLOW_OVERLAY = document.getElementById("flow-overlay");
const YEAR_RANGE = document.getElementById("year-range");
const YEAR_LABEL = document.getElementById("year-label");
const AGE_RANGE = document.getElementById("age-range");
const AGE_VALUE = document.getElementById("age-value");
const SEX_SELECT = document.getElementById("sex-select");
const ITEM_SELECT = document.getElementById("item-select");
const STAT_YEAR = document.getElementById("stat-year");
const STAT_AGE = document.getElementById("stat-age");
const STAT_TOTAL_LABEL = document.getElementById("stat-total-label");
const STAT_TOTAL = document.getElementById("stat-total");
const BADGE = document.getElementById("badge-period");
const LEGEND_LINE_LABEL = document.getElementById("legend-line-label");
const FLOW_TOOLTIP = document.getElementById("flow-tooltip");
const INDICATOR_INFO = document.getElementById("indicator-info");
const INDICATOR_TOOLTIP = document.getElementById("indicator-tooltip");
const NET_LEGEND = document.getElementById("net-legend");
const SETTINGS_TOGGLE = document.getElementById("settings-toggle");
const SETTINGS_PANEL = document.getElementById("settings-panel");
const PLAY_TOGGLE = document.getElementById("play-toggle");
const PLAY_LOADING = document.getElementById("play-loading");
const PLAY_SPEED = document.getElementById("play-speed");
const PLAY_SPEED_LABEL = document.getElementById("play-speed-label");
const TOP_LIST = document.getElementById("top-flows-list");
const SIDEBAR_TITLE = document.getElementById("sidebar-title");
const ERROR_BANNER = document.getElementById("error-banner");
const ERROR_MESSAGE = document.getElementById("error-message");
const ERROR_RETRY = document.getElementById("error-retry");

/* ─── Module Imports ─── */
const { normalizeSidoName, mapSidoNameToCode } = window.regionMapping || {};
const {
  buildGradientStops,
  FLOW_COLORS,
  flowWidthScale,
  flowGradientAnimation,
  flowDisplayCount,
  flowPulseCount,
  formatFlowLabel,
  shouldRenderFlow,
  shouldRenderPair,
  isFlowMetaValid,
  getRegionHighlightClass,
  getIndicatorInfo,
  getNetItemCode,
  getNetFillEnabled,
  getNetLegendItems,
  shouldUseMergedData,
} = window.flowStyle || {};

const {
  AGE_GROUPS,
  validateDataset,
  parseDT,
  buildCacheKey,
  buildTimeline,
  getPlaybackInterval: computePlaybackInterval,
  getPrefetchCount: computePrefetchCount,
  getAgeIndex,
  formatNumber,
} = window.dataUtils || {};

const {
  buildFlows: computeFlows,
  buildNet: computeNet,
} = window.dataProcessing || {};

const {
  collectCoords: _collectCoords,
  buildProjection: _buildProjection,
  geometryToPath: _geometryToPath,
  geometryCentroid: _geometryCentroid,
} = window.geoUtils || {};

/* ─── State ─── */
const cache = new Map();
const cacheOrder = [];
let mergedPeriods = null;
let mergedAttempted = false;
let geoIndex = null;
let officeCenters = null;
let refreshAbortController = null;
let playState = {
  isPlaying: false,
  timer: null,
  loopId: 0,
};

/* ─── Cache ─── */

function setCacheEntry(key, data) {
  if (cache.has(key)) {
    cache.set(key, data);
    const existingIndex = cacheOrder.indexOf(key);
    if (existingIndex >= 0) cacheOrder.splice(existingIndex, 1);
  } else {
    cache.set(key, data);
  }
  cacheOrder.push(key);
  while (cacheOrder.length > MAX_CACHE_ENTRIES) {
    const oldest = cacheOrder.shift();
    if (oldest) cache.delete(oldest);
  }
}

/* ─── UI Helpers ─── */

function syncAgeLabel(index) {
  const age = AGE_GROUPS[index];
  if (!AGE_VALUE || !age) return;
  AGE_VALUE.textContent = age.label;
}

function toggleAgeAll() {
  if (!AGE_RANGE) return;
  AGE_RANGE.disabled = false;
}

function setOverlayBlocked(isBlocked) {
  document.body.classList.toggle("settings-open", isBlocked);
}

function setLoading(target, isLoading) {
  if (!target) return;
  target.classList.toggle("is-active", isLoading);
}

function showError(message) {
  if (ERROR_BANNER && ERROR_MESSAGE) {
    ERROR_MESSAGE.textContent = message;
    ERROR_BANNER.classList.add("is-active");
    ERROR_BANNER.setAttribute("role", "alert");
  }
  if (FLOW_OVERLAY) {
    FLOW_OVERLAY.textContent = message;
    FLOW_OVERLAY.classList.add("is-active");
  }
}

function hideError() {
  if (ERROR_BANNER) {
    ERROR_BANNER.classList.remove("is-active");
  }
  if (FLOW_OVERLAY) {
    FLOW_OVERLAY.classList.remove("is-active");
    FLOW_OVERLAY.textContent = "";
  }
}

/* ─── Playback ─── */

function getPlaybackInterval(period) {
  const speed = PLAY_SPEED ? Number(PLAY_SPEED.value) || 1 : 1;
  return computePlaybackInterval
    ? computePlaybackInterval(period, speed, PLAY_INTERVAL_YEAR_MS, PLAY_INTERVAL_MONTH_MS)
    : Math.max(300, Math.round((period && period.month ? PLAY_INTERVAL_MONTH_MS : PLAY_INTERVAL_YEAR_MS) / speed));
}

function getPrefetchCount() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return computePrefetchCount ? computePrefetchCount(connection) : 3;
}

function setPeriod({ year, month }) {
  YEAR_RANGE.value = String(year);
  YEAR_LABEL.textContent = String(year);
  const isMonthly = year === 2025;
  if (isMonthly && !month) {
    month = DEFAULT_MONTH;
  }
}

function togglePlayback() {
  if (!PLAY_TOGGLE) return;
  if (playState.isPlaying) {
    playState.isPlaying = false;
    playState.loopId += 1;
    PLAY_TOGGLE.innerHTML = '<span class="material-symbols-rounded">play_arrow</span>';
    PLAY_TOGGLE.classList.remove("is-playing");
    PLAY_TOGGLE.setAttribute("aria-label", "재생");
    return;
  }
  playState.isPlaying = true;
  PLAY_TOGGLE.innerHTML = '<span class="material-symbols-rounded">pause</span>';
  PLAY_TOGGLE.classList.add("is-playing");
  PLAY_TOGGLE.setAttribute("aria-label", "일시정지");
  if (FLOW_TOOLTIP) {
    FLOW_TOOLTIP.classList.remove("is-active");
  }
  runPlaybackLoop();
}

async function runPlaybackLoop() {
  const timeline = buildTimeline ? buildTimeline() : [];
  let index = timeline.findIndex((entry) => {
    const year = Number(YEAR_RANGE.value);
    const month = year === 2025 ? DEFAULT_MONTH : null;
    return entry.year === year && entry.month === month;
  });
  if (index < 0) index = 0;
  const loopId = (playState.loopId += 1);
  while (playState.isPlaying && loopId === playState.loopId) {
    const current = timeline[index];
    setPeriod(current);
    await refresh();
    const prefetchCount = getPrefetchCount();
    for (let offset = 1; offset <= prefetchCount; offset += 1) {
      const next = timeline[(index + offset) % timeline.length];
      prefetchPeriod(next);
    }
    index = (index + 1) % timeline.length;
    await new Promise((resolve) =>
      setTimeout(resolve, getPlaybackInterval(current))
    );
  }
}

async function prefetchPeriod({ year, month }) {
  const key = buildCacheKey ? buildCacheKey(year, month) : `${year}${month || ""}`;
  if (cache.has(key)) return;
  try {
    await loadData(year, month);
  } catch (error) {
    console.warn("[prefetch] failed", key, error.message);
  }
}

/* ─── Settings Panel ─── */

function initSettingsToggle() {
  if (!SETTINGS_TOGGLE || !SETTINGS_PANEL) return;
  console.log("[settings] init");
  const ensureSettingsIcon = () => {
    let icon = SETTINGS_TOGGLE.querySelector(".material-symbols-rounded");
    if (!icon) {
      SETTINGS_TOGGLE.innerHTML = "";
      icon = document.createElement("span");
      icon.className = "material-symbols-rounded";
      SETTINGS_TOGGLE.appendChild(icon);
    }
    icon.textContent = "settings";
  };
  ensureSettingsIcon();
  SETTINGS_TOGGLE.setAttribute("aria-expanded", "false");
  SETTINGS_TOGGLE.setAttribute("aria-label", "설정 열기");
  SETTINGS_TOGGLE.setAttribute("aria-controls", "settings-panel");
  const closeSettings = () => {
    SETTINGS_PANEL.classList.add("is-collapsed");
    SETTINGS_TOGGLE.setAttribute("aria-expanded", "false");
    SETTINGS_TOGGLE.setAttribute("aria-label", "설정 열기");
    ensureSettingsIcon();
    setOverlayBlocked(false);
  };
  const openSettings = () => {
    SETTINGS_PANEL.classList.remove("is-collapsed");
    SETTINGS_TOGGLE.setAttribute("aria-expanded", "true");
    SETTINGS_TOGGLE.setAttribute("aria-label", "설정 닫기");
    ensureSettingsIcon();
    setOverlayBlocked(true);
  };
  SETTINGS_TOGGLE.addEventListener("click", () => {
    const isCollapsed = SETTINGS_PANEL.classList.contains("is-collapsed");
    if (isCollapsed) {
      openSettings();
    } else {
      closeSettings();
    }
  });

  document.addEventListener("click", (event) => {
    if (SETTINGS_PANEL.classList.contains("is-collapsed")) return;
    const target = event.target;
    if (SETTINGS_PANEL.contains(target) || SETTINGS_TOGGLE.contains(target)) {
      return;
    }
    closeSettings();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (SETTINGS_PANEL.classList.contains("is-collapsed")) return;
    closeSettings();
  });
}

/* ─── Data Loading ─── */

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
  let lastError;
  for (let attempt = 0; attempt <= FETCH_MAX_RETRIES; attempt++) {
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
      if (attempt < FETCH_MAX_RETRIES) {
        const delay = FETCH_BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn("[fetchJson] retry", attempt + 1, "after", delay, "ms");
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

async function loadMergedData(signal) {
  if (mergedAttempted) return mergedPeriods;
  mergedAttempted = true;
  console.log("[loadMergedData] start");
  if (shouldUseMergedData && !shouldUseMergedData(window.KOSIS_USE_MERGED)) {
    console.log("[loadMergedData] disabled via flag");
    return null;
  }
  try {
    const baseDir = DATA_BASE_URL || DATA_DIR.split("/").slice(0, -1).join("/") || ".";
    const payload = await fetchJson(`${baseDir}/${MERGED_FILENAME}`, { signal });
    console.log("[loadMergedData] payload keys", Object.keys(payload || {}));
    mergedPeriods = payload.periods || null;
    return mergedPeriods;
  } catch (error) {
    if (error.name === "AbortError") throw error;
    console.error("[loadMergedData] error", error);
    return null;
  }
}

async function loadOfficeCenters() {
  if (officeCenters) return officeCenters;
  console.log("[loadOfficeCenters] start");
  try {
    const response = await fetch(OFFICE_CENTERS_PATH);
    console.log("[loadOfficeCenters] fetch", response.status);
    if (!response.ok) return null;
    const payload = await response.json();
    console.log("[loadOfficeCenters] count", payload.length || 0);
    officeCenters = new Map(
      payload.map((item) => [item.code, { lat: item.lat, lon: item.lon }])
    );
    return officeCenters;
  } catch (error) {
    console.error("[loadOfficeCenters] error", error);
    return null;
  }
}

async function loadGeoJson() {
  if (geoIndex) return geoIndex;
  if (!normalizeSidoName || !mapSidoNameToCode) {
    throw new Error("지역 매핑 스크립트를 불러오지 못했습니다.");
  }
  console.log("[loadGeoJson] start");
  const response = await fetch(GEOJSON_PATH);
  console.log("[loadGeoJson] fetch", response.status);
  if (!response.ok) {
    throw new Error("GeoJSON 경계 파일을 불러올 수 없습니다.");
  }
  const geojson = await response.json();
  console.log("[loadGeoJson] features", geojson?.features?.length || 0);
  const centers = await loadOfficeCenters();
  geoIndex = buildRegionIndex(geojson, 900, 780, centers);
  return geoIndex;
}

async function loadData(year, month, signal) {
  console.log("[loadData] start", { year, month });
  const key = buildCacheKey ? buildCacheKey(year, month) : `${year}${month || ""}`;
  if (cache.has(key)) return cache.get(key);
  const merged = await loadMergedData(signal);
  if (merged && merged[key]) {
    console.log("[loadData] merged hit", key, merged[key].length);
    const rows = merged[key];
    if (validateDataset) {
      const check = validateDataset(rows);
      if (!check.valid) {
        console.warn("[loadData] validation failed for merged key", key, check.reason);
      }
    }
    setCacheEntry(key, rows);
    return rows;
  }
  const filename = month ? `kosis_${year}${month}.json` : `kosis_${year}.json`;
  const url = `${DATA_DIR}/${filename}`;
  const data = await fetchJson(url, { signal });
  console.log("[loadData] fetch", url);
  console.log("[loadData] rows", data.length || 0);
  if (validateDataset) {
    const check = validateDataset(data);
    if (!check.valid) {
      throw new Error(`데이터 검증 실패: ${check.reason}`);
    }
  }
  setCacheEntry(key, data);
  return data;
}

/* ─── Geo / Projection (delegates to geo_utils module) ─── */

const collectCoords = _collectCoords || function (geometry, handler) {
  if (geometry.type === "Polygon") {
    geometry.coordinates.forEach((ring) => ring.forEach(handler));
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((polygon) =>
      polygon.forEach((ring) => ring.forEach(handler))
    );
  }
};

const buildProjection = _buildProjection || function (features, width, height, padding = 30, coordFilter) {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  features.forEach((f) => collectCoords(f.geometry, ([lon, lat]) => {
    if (coordFilter && !coordFilter(lon, lat)) return;
    minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
  }));
  const scale = Math.min((width - padding * 2) / (maxLon - minLon), (height - padding * 2) / (maxLat - minLat));
  return ([lon, lat]) => {
    const adjLon = lon <= FAR_EAST_LON ? lon : FAR_EAST_LON + (lon - FAR_EAST_LON) * FAR_EAST_COMPRESS;
    return { x: padding + (adjLon - minLon) * scale, y: height - padding - (lat - minLat) * scale };
  };
};

const geometryToPath = _geometryToPath || function (geometry, project) {
  const segments = [];
  const addRing = (ring) => {
    ring.forEach(([lon, lat], i) => segments.push(`${i === 0 ? "M" : "L"} ${project([lon, lat]).x} ${project([lon, lat]).y}`));
    segments.push("Z");
  };
  if (geometry.type === "Polygon") geometry.coordinates.forEach(addRing);
  else if (geometry.type === "MultiPolygon") geometry.coordinates.forEach((p) => p.forEach(addRing));
  return segments.join(" ");
};

const geometryCentroid = _geometryCentroid || function (geometry, project) {
  let sumX = 0, sumY = 0, count = 0;
  collectCoords(geometry, ([lon, lat]) => { const { x, y } = project([lon, lat]); sumX += x; sumY += y; count += 1; });
  return count ? { x: sumX / count, y: sumY / count } : { x: 0, y: 0 };
};

function buildRegionIndex(geojson, width, height, centers) {
  const project = buildProjection(
    geojson.features,
    width,
    height,
    30,
    (lon) => lon <= FAR_EAST_LON
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

/* ─── Data Processing (delegates to module) ─── */

function buildFlows(data, options, regionIndex) {
  if (computeFlows) {
    return computeFlows(data, options, regionIndex.byCode);
  }
  /* Inline fallback (keeps tests happy if module not loaded) */
  const totals = new Map();
  let sum = 0;
  data.forEach((row) => {
    if (row.ITM_ID !== options.item) return;
    if (row.C3 !== options.sex) return;
    if (row.C4 !== options.age) return;
    if (row.C1 === "00" || row.C2 === "00") return;
    if (shouldRenderPair ? !shouldRenderPair(row.C1, row.C2) : row.C1 === row.C2) return;
    if (!regionIndex.byCode.has(row.C1) || !regionIndex.byCode.has(row.C2)) return;
    const value = parseDT ? parseDT(row.DT) : (Number(String(row.DT).replace(/,/g, "")) || 0);
    if (shouldRenderFlow ? !shouldRenderFlow(value) : value <= 0) return;
    const key = `${row.C1}-${row.C2}`;
    totals.set(key, (totals.get(key) || 0) + value);
    sum += value;
  });
  const flows = Array.from(totals.entries())
    .map(([key, value]) => {
      const [fromCode, toCode] = key.split("-");
      const from = regionIndex.byCode.get(fromCode);
      const to = regionIndex.byCode.get(toCode);
      if (!from || !to || !from.name || !to.name) return null;
      return { value, from, to, fromCode, toCode, label: `${from.name} → ${to.name}` };
    })
    .filter(Boolean)
    .sort((a, b) => b.value - a.value);
  return { flows, total: sum };
}

function buildNet(data, options, regionIndex) {
  if (computeNet) {
    return computeNet(data, options, regionIndex.byCode);
  }
  /* Inline fallback */
  const net = new Map();
  let total = 0;
  data.forEach((row) => {
    if (row.ITM_ID !== options.item) return;
    if (row.C3 !== options.sex) return;
    if (row.C4 !== options.age) return;
    if (row.C1 === "00" || row.C2 === "00") return;
    if (!regionIndex.byCode.has(row.C1) || !regionIndex.byCode.has(row.C2)) return;
    const value = parseDT ? parseDT(row.DT) : (Number(String(row.DT).replace(/,/g, "")) || 0);
    if (!value) return;
    net.set(row.C1, (net.get(row.C1) || 0) - value);
    net.set(row.C2, (net.get(row.C2) || 0) + value);
    total += value;
  });
  const entries = Array.from(net.entries()).map(([code, value]) => ({
    code, value, region: regionIndex.byCode.get(code),
  }));
  entries.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return { entries, total };
}

/* ─── SVG Rendering ─── */

function drawBaseMap(svg, regions, mode, netValues, height) {
  const width = 900;
  svg.innerHTML = "";

  const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  background.setAttribute("width", width);
  background.setAttribute("height", height);
  background.setAttribute("fill", "#101218");
  svg.appendChild(background);

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const inboundGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  inboundGradient.setAttribute("id", "net-inbound-gradient");
  inboundGradient.setAttribute("x1", "0");
  inboundGradient.setAttribute("y1", "0");
  inboundGradient.setAttribute("x2", "1");
  inboundGradient.setAttribute("y2", "1");
  inboundGradient.innerHTML =
    '<stop offset="0%" stop-color="rgba(39, 209, 127, 1)"/>' +
    '<stop offset="100%" stop-color="rgba(39, 209, 127, 0.2)"/>';
  const outboundGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  outboundGradient.setAttribute("id", "net-outbound-gradient");
  outboundGradient.setAttribute("x1", "0");
  outboundGradient.setAttribute("y1", "0");
  outboundGradient.setAttribute("x2", "1");
  outboundGradient.setAttribute("y2", "1");
  outboundGradient.innerHTML =
    '<stop offset="0%" stop-color="rgba(240, 91, 76, 1)"/>' +
    '<stop offset="100%" stop-color="rgba(240, 91, 76, 0.2)"/>';
  defs.appendChild(inboundGradient);
  defs.appendChild(outboundGradient);
  svg.appendChild(defs);

  const values = Array.from(netValues.values());
  const maxAbs = Math.max(...values.map((value) => Math.abs(value)), 1);
  const polygonGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  polygonGroup.setAttribute("id", "region-polygons");
  const netFillInbound = FLOW_COLORS ? FLOW_COLORS.inbound : "#27d17f";
  const netFillOutbound = FLOW_COLORS ? FLOW_COLORS.outbound : "#f05b4c";

  regions.forEach((region) => {
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "path");
    polygon.setAttribute("d", region.path);
    polygon.setAttribute("stroke", "rgba(255,255,255,0.18)");
    polygon.setAttribute("stroke-width", "1");
    polygon.dataset.code = region.code;
    polygon.classList.add("region-shape");
    let fill = "rgba(255,255,255,0.04)";
    if (mode === "net") {
      const value = netValues.get(region.code) || 0;
      const intensity = Math.min(Math.abs(value) / maxAbs, 1);
      const alpha = 0.25 + intensity * 0.6;
      fill = value >= 0 ? "url(#net-inbound-gradient)" : "url(#net-outbound-gradient)";
      polygon.setAttribute("fill-opacity", String(alpha));
    } else {
      polygon.setAttribute("fill-opacity", "1");
    }
    polygon.setAttribute("fill", fill);
    polygonGroup.appendChild(polygon);
  });

  svg.appendChild(polygonGroup);

  const dotGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  dotGroup.setAttribute("id", "region-dots");
  regions.forEach((region) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", region.centroid.x);
    dot.setAttribute("cy", region.centroid.y);
    dot.setAttribute("r", region.code === "50" ? 9 : 7);
    dot.setAttribute("fill", "#ef6a41");
    dot.setAttribute("opacity", "0.9");
    dotGroup.appendChild(dot);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", region.centroid.x + 10);
    label.setAttribute("y", region.centroid.y - 6);
    label.setAttribute("fill", "#f6efe6");
    label.setAttribute("font-size", "12");
    label.setAttribute("font-family", "IBM Plex Sans, sans-serif");
    label.textContent = region.name.replace("특별자치", "").replace("광역시", "").replace("특별시", "");
    dotGroup.appendChild(label);
  });
  svg.appendChild(dotGroup);
}

/**
 * Generate a quadratic Bezier SVG path between two points.
 * Guards against NaN when source and target overlap (distance = 0).
 */
function flowPath(source, target) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.01) {
    return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
  }
  const curve = Math.min(120, distance * 0.35);
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  const normX = -dy / distance;
  const normY = dx / distance;
  const controlX = midX + normX * curve;
  const controlY = midY + normY * curve;
  return `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`;
}

function drawFlows(flows, regions, pulseCount, netValues) {
  drawBaseMap(FLOW_MAP, regions, "net", netValues, 780);

  const maxValue = Math.max(...flows.map((flow) => flow.value), 1);
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const flowGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  flowGroup.setAttribute("id", "flow-lines");

  const clearRegionHighlights = () => {
    FLOW_MAP.querySelectorAll(".region-shape.region-highlight").forEach((el) => {
      el.classList.remove("region-highlight", "inbound", "outbound");
    });
  };
  const highlightRegions = (fromCode, toCode) => {
    clearRegionHighlights();
    if (!fromCode || !toCode) return;
    const outbound = FLOW_MAP.querySelector(`.region-shape[data-code="${fromCode}"]`);
    const inbound = FLOW_MAP.querySelector(`.region-shape[data-code="${toCode}"]`);
    if (outbound) {
      outbound.className = `region-shape ${getRegionHighlightClass ? getRegionHighlightClass("outbound") : "region-highlight outbound"}`;
    }
    if (inbound) {
      inbound.className = `region-shape ${getRegionHighlightClass ? getRegionHighlightClass("inbound") : "region-highlight inbound"}`;
    }
  };
  flows.forEach((flow, index) => {
    const source = flow.from.centroid;
    const target = flow.to.centroid;
    const gradientId = `flow-gradient-${index}`;
    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    gradient.setAttribute("id", gradientId);
    gradient.setAttribute("gradientUnits", "userSpaceOnUse");
    gradient.setAttribute("x1", source.x);
    gradient.setAttribute("y1", source.y);
    gradient.setAttribute("x2", target.x);
    gradient.setAttribute("y2", target.y);
    gradient.setAttribute("spreadMethod", "repeat");
    const inboundColor = FLOW_COLORS ? FLOW_COLORS.inbound : "#27d17f";
    const outboundColor = FLOW_COLORS ? FLOW_COLORS.outbound : "#f05b4c";
    const stops = buildGradientStops ? buildGradientStops(outboundColor, inboundColor) : [
      { offset: "0%", color: outboundColor, opacity: 0.82 },
      { offset: "100%", color: inboundColor, opacity: 0.82 },
    ];
    stops.forEach((stop) => {
      const stopEl = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stopEl.setAttribute("offset", stop.offset);
      stopEl.setAttribute("stop-color", stop.color);
      stopEl.setAttribute("stop-opacity", stop.opacity);
      gradient.appendChild(stopEl);
    });
    const anim_dx = target.x - source.x;
    const anim_dy = target.y - source.y;
    const animation = flowGradientAnimation
      ? flowGradientAnimation(flow.value, maxValue)
      : null;
    if (animation) {
      const anim = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
      anim.setAttribute("attributeName", "gradientTransform");
      anim.setAttribute("type", "translate");
      anim.setAttribute("values", `0 0; ${anim_dx * 0.2} ${anim_dy * 0.2}; 0 0`);
      anim.setAttribute("dur", `${animation.duration}s`);
      anim.setAttribute("repeatCount", "indefinite");
      gradient.appendChild(anim);
    }

    defs.appendChild(gradient);

    const widthScale = flowWidthScale
      ? flowWidthScale(flow.value, maxValue)
      : 2.2 + (flow.value / maxValue) * 7.3;
    const pathD = flowPath(source, target);
    const pathGlow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathGlow.setAttribute("d", pathD);
    pathGlow.setAttribute("stroke-width", widthScale + 2.5);
    pathGlow.setAttribute("stroke", "rgba(120, 255, 200, 0.25)");
    pathGlow.setAttribute("fill", "none");
    pathGlow.setAttribute("stroke-linecap", "round");
    pathGlow.setAttribute("stroke-linejoin", "round");
    pathGlow.dataset.flowId = `flow-${index}`;
    pathGlow.classList.add("flow-line--glow");
    pathGlow.style.setProperty("--flow-speed", "0s");
    flowGroup.appendChild(pathGlow);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathD);
    path.setAttribute("stroke-width", widthScale);
    path.setAttribute("stroke", `url(#${gradientId})`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("opacity", "0.9");
    path.dataset.flowId = `flow-${index}`;
    path.dataset.label = flow.label;
    path.dataset.value = String(flow.value);
    path.dataset.from = flow.from.name;
    path.dataset.to = flow.to.name;
    path.dataset.fromCode = flow.from.code || flow.fromCode;
    path.dataset.toCode = flow.to.code || flow.toCode;
    path.classList.add("flow-line");
    path.style.setProperty("--pulse-width", `${widthScale}px`);
    if (index < pulseCount) {
      path.classList.add("flow-line--pulse");
    }
    path.style.setProperty("--flow-speed", "0s");
    flowGroup.appendChild(path);
  });

  /* ─── Event delegation on flowGroup (3 listeners instead of N×3) ─── */

  flowGroup.addEventListener("pointerenter", (event) => {
    const target = event.target.closest(".flow-line");
    if (!target || playState.isPlaying) return;
    const flowId = target.dataset.flowId;
    if (!flowId) return;
    flowGroup.classList.add("is-muted");
    flowGroup.querySelectorAll(`[data-flow-id="${flowId}"]`).forEach((node) =>
      node.classList.add("is-highlight")
    );
    highlightRegions(target.dataset.fromCode, target.dataset.toCode);
  }, true);

  flowGroup.addEventListener("pointerleave", (event) => {
    const target = event.target.closest(".flow-line");
    if (!target) return;
    const flowId = target.dataset.flowId;
    if (!flowId) return;
    flowGroup.querySelectorAll(`[data-flow-id="${flowId}"]`).forEach((node) =>
      node.classList.remove("is-highlight")
    );
    flowGroup.classList.remove("is-muted");
    clearRegionHighlights();
    if (FLOW_TOOLTIP) {
      FLOW_TOOLTIP.classList.remove("is-active");
    }
  }, true);

  flowGroup.addEventListener("pointermove", (event) => {
    if (playState.isPlaying || !FLOW_TOOLTIP) return;
    const target = event.target.closest(".flow-line");
    if (!target) return;
    const meta = {
      from: target.dataset.from,
      to: target.dataset.to,
      value: target.dataset.value,
    };
    if (isFlowMetaValid && !isFlowMetaValid(meta)) {
      FLOW_TOOLTIP.classList.remove("is-active");
      return;
    }
    const label = formatFlowLabel
      ? formatFlowLabel(meta.from, meta.to, Number(meta.value))
      : `${meta.from} → ${meta.to} · ${formatNumber(Number(meta.value))}명`;
    FLOW_TOOLTIP.textContent = label;
    FLOW_TOOLTIP.classList.add("is-active");
    const rect = FLOW_MAP.getBoundingClientRect();
    const x = event.clientX - rect.left + 12;
    const y = event.clientY - rect.top + 12;
    FLOW_TOOLTIP.style.transform = `translate(${x}px, ${y}px)`;
  }, true);

  FLOW_MAP.appendChild(defs);
  FLOW_MAP.appendChild(flowGroup);
}

/* ─── UI Updates ─── */

function updateTopList(flows) {
  if (!TOP_LIST) return;
  TOP_LIST.innerHTML = "";
  if (SIDEBAR_TITLE) {
    SIDEBAR_TITLE.textContent = "TOP3";
  }
  const topFlows = flows.slice(0, TOP_FLOW_COUNT);
  topFlows.forEach((flow) => {
    const item = document.createElement("li");
    item.className = "top-flow-item";
    const label = document.createElement("span");
    label.className = "top-flow-item__label";
    label.textContent = flow.label;
    const value = document.createElement("span");
    value.className = "top-flow-item__value";
    value.textContent = `${formatNumber(flow.value)}명`;
    item.appendChild(label);
    item.appendChild(value);
    TOP_LIST.appendChild(item);
  });
}

function renderNetLegend() {
  if (!NET_LEGEND || !getNetLegendItems) return;
  const items = getNetLegendItems();
  NET_LEGEND.innerHTML = items
    .map(
      (item) =>
        `<span class="net-legend__item"><span class="net-legend__swatch" style="background:${item.color};"></span>${item.label}</span>`
    )
    .join("");
}

function syncLabels(year, ageCode, total, month, totalLabel) {
  const ageLabel = AGE_GROUPS.find((group) => group.code === ageCode)?.label || "-";
  if (STAT_TOTAL_LABEL) {
    STAT_TOTAL_LABEL.textContent = totalLabel;
  }
  if (STAT_YEAR) {
    STAT_YEAR.textContent = month ? `${year}.${month}` : `${year}`;
  }
  if (STAT_AGE) {
    STAT_AGE.textContent = ageLabel;
  }
  if (STAT_TOTAL) {
    STAT_TOTAL.textContent = total ? `${formatNumber(total)}명` : "-";
  }
  if (BADGE) {
    BADGE.textContent = month ? `${year}년 ${month}월` : `${year}년`;
  }
}

/* ─── Main Refresh ─── */

async function refresh() {
  console.log("[refresh] start");

  /* Cancel any in-flight refresh */
  if (refreshAbortController) {
    refreshAbortController.abort();
  }
  refreshAbortController = new AbortController();
  const signal = refreshAbortController.signal;

  const year = Number(YEAR_RANGE.value);
  const isMonthly = year === 2025;
  const month = isMonthly ? DEFAULT_MONTH : null;
  const ageIndex = getAgeIndex ? getAgeIndex(AGE_RANGE.value) : 0;
  const useAllAge = false;
  const options = {
    sex: SEX_SELECT.value,
    age: useAllAge ? "000" : AGE_GROUPS[ageIndex].code,
    item: ITEM_SELECT.value,
  };

  setLoading(PLAY_LOADING, true);
  hideError();
  try {
    const regionIndex = await loadGeoJson();
    if (signal.aborted) return;
    const data = await loadData(year, month, signal);
    if (signal.aborted) return;
    console.log("[refresh] data loaded", data.length);
    if (LEGEND_LINE_LABEL) {
      LEGEND_LINE_LABEL.textContent = "이동 규모 (선 두께)";
    }
    const { flows, total } = buildFlows(data, options, regionIndex);
    const baseCount = flowDisplayCount ? flowDisplayCount(data.length) : 60;
    const displayCount = playState.isPlaying ? Math.min(30, baseCount) : baseCount;
    const pulseCount = flowPulseCount ? flowPulseCount(displayCount) : 10;
    const topFlows = flows.slice(0, displayCount);
    const netOptions = { ...options, item: getNetItemCode ? getNetItemCode() : "T70" };
    const { entries } = buildNet(data, netOptions, regionIndex);
    const netValues = new Map(entries.map((entry) => [entry.code, entry.value]));
    drawFlows(topFlows, regionIndex.regions, pulseCount, netValues);
    updateTopList(flows);
    syncLabels(year, options.age, total, month, "총 이동 규모");
    renderNetLegend();
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("[refresh] aborted");
      return;
    }
    console.error("[refresh] error", error);
    FLOW_MAP.innerHTML = "";
    showError(error.message);
  } finally {
    setLoading(PLAY_LOADING, false);
  }
}

/* ─── Control Bindings ─── */

function bindControls() {
  YEAR_RANGE.addEventListener("input", () => {
    YEAR_LABEL.textContent = YEAR_RANGE.value;
  });
  YEAR_RANGE.addEventListener("change", refresh);
  AGE_RANGE.addEventListener("input", () => {
    syncAgeLabel(getAgeIndex ? getAgeIndex(AGE_RANGE.value) : 0);
  });
  AGE_RANGE.addEventListener("change", refresh);
  if (PLAY_TOGGLE) {
    PLAY_TOGGLE.addEventListener("click", (event) => {
      console.log("[play] click", event.target);
      togglePlayback();
    });
  }
  if (PLAY_SPEED && PLAY_SPEED_LABEL) {
    const syncSpeed = () => {
      const value = Number(PLAY_SPEED.value) || 1;
      PLAY_SPEED_LABEL.textContent = `${value.toFixed(1)}x`;
    };
    PLAY_SPEED.addEventListener("input", syncSpeed);
    syncSpeed();
  }

  document.addEventListener("click", (event) => {
    if (!PLAY_TOGGLE) return;
    if (event.target === PLAY_TOGGLE) return;
    const isInside = PLAY_TOGGLE.contains(event.target);
    if (isInside) {
      console.log("[play] delegated click", event.target);
      togglePlayback();
    }
  });
  SEX_SELECT.addEventListener("change", refresh);
  ITEM_SELECT.addEventListener("change", refresh);
  const attachInfo = (button, tooltip, getInfo) => {
    if (!button || !tooltip) return;
    const showInfo = () => {
      const info = getInfo();
      if (!info) return;
      tooltip.innerHTML = `<strong>${info.title}</strong><p>${info.description}</p>`;
      tooltip.classList.add("is-active");
    };
    const hideInfo = () => {
      tooltip.classList.remove("is-active");
    };
    button.addEventListener("mouseenter", showInfo);
    button.addEventListener("focus", showInfo);
    button.addEventListener("mouseleave", hideInfo);
    button.addEventListener("blur", hideInfo);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (tooltip.classList.contains("is-active")) {
        hideInfo();
      } else {
        showInfo();
      }
    });
  };

  attachInfo(INDICATOR_INFO, INDICATOR_TOOLTIP, () => {
    return getIndicatorInfo ? getIndicatorInfo(ITEM_SELECT.value) : null;
  });

  /* Retry button */
  if (ERROR_RETRY) {
    ERROR_RETRY.addEventListener("click", () => {
      hideError();
      mergedAttempted = false;
      mergedPeriods = null;
      refresh();
    });
  }
}

/* ─── Init ─── */

function init() {
  console.log("[init] start");
  console.log("[init] play toggle", PLAY_TOGGLE);
  const allIndex = AGE_GROUPS.findIndex((group) => group.code === "000");
  const safeIndex = allIndex >= 0 ? allIndex : 0;
  AGE_RANGE.value = String(safeIndex);
  syncAgeLabel(safeIndex);
  toggleAgeAll();
  initSettingsToggle();
  SEX_SELECT.value = "0";
  ITEM_SELECT.value = "T80";
  YEAR_LABEL.textContent = YEAR_RANGE.value;
  if (PLAY_TOGGLE) {
    PLAY_TOGGLE.innerHTML = '<span class="material-symbols-rounded">play_arrow</span>';
  }
  bindControls();
  refresh();
}

init();
