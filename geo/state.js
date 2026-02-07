/**
 * Centralized state management module for Demographics app
 * Provides a single source of truth for all application state
 * UMD module pattern for Node.js and browser compatibility
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.appState = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /**
   * Application state container
   * @private
   */
  const state = {
    /** LRU data cache */
    cache: {
      data: new Map(),
      order: [],
      maxEntries: 12,
    },
    /** Merged data buffer */
    merged: {
      periods: null,
      attempted: false,
    },
    /** Geo data */
    geo: {
      index: null,
      officeCenters: null,
    },
    /** Current refresh controller */
    refresh: {
      abortController: null,
    },
    /** Playback state */
    playback: {
      isPlaying: false,
      timer: null,
      loopId: 0,
    },
    /** Keyboard flow selection */
    keyboard: {
      selectedIndex: -1,
      flowElements: [],
    },
    /** Navigation state */
    navigation: {
      previousYear: null,
      direction: 1, /* 1 = forward, -1 = backward */
    },
    /** Zoom and pan state */
    viewport: {
      zoom: 1,
      pan: { x: 0, y: 0 },
      isDragging: false,
      dragStart: { x: 0, y: 0 },
    },
  };

  /**
   * State change listeners
   * @private
   */
  const listeners = new Map();

  /**
   * Notify listeners of state change
   * @param {string} key - State key that changed
   * @param {*} value - New value
   * @private
   */
  function notify(key, value) {
    const keyListeners = listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach((callback) => callback(value));
    }
  }

  /* ─── Cache Management ─── */

  /**
   * Set a cache entry with LRU eviction
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  function setCacheEntry(key, data) {
    const { cache } = state;
    if (cache.data.has(key)) {
      cache.data.set(key, data);
      const idx = cache.order.indexOf(key);
      if (idx >= 0) cache.order.splice(idx, 1);
    } else {
      cache.data.set(key, data);
    }
    cache.order.push(key);
    while (cache.order.length > cache.maxEntries) {
      const oldest = cache.order.shift();
      if (oldest) cache.data.delete(oldest);
    }
  }

  /**
   * Get a cache entry
   * @param {string} key - Cache key
   * @returns {*} Cached data or undefined
   */
  function getCacheEntry(key) {
    return state.cache.data.get(key);
  }

  /**
   * Check if cache has entry
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  function hasCacheEntry(key) {
    return state.cache.data.has(key);
  }

  /**
   * Clear all cache entries
   */
  function clearCache() {
    state.cache.data.clear();
    state.cache.order = [];
  }

  /**
   * Set maximum cache entries
   * @param {number} max
   */
  function setCacheMaxEntries(max) {
    state.cache.maxEntries = max;
  }

  /* ─── Merged Data ─── */

  /**
   * Set merged periods data
   * @param {object|null} periods
   */
  function setMergedPeriods(periods) {
    state.merged.periods = periods;
    state.merged.attempted = true;
  }

  /**
   * Get merged periods data
   * @returns {object|null}
   */
  function getMergedPeriods() {
    return state.merged.periods;
  }

  /**
   * Check if merged data load was attempted
   * @returns {boolean}
   */
  function wasMergedAttempted() {
    return state.merged.attempted;
  }

  /**
   * Reset merged data state (for retry)
   */
  function resetMerged() {
    state.merged.periods = null;
    state.merged.attempted = false;
  }

  /* ─── Geo Data ─── */

  /**
   * Set geo index
   * @param {object} index
   */
  function setGeoIndex(index) {
    state.geo.index = index;
  }

  /**
   * Get geo index
   * @returns {object|null}
   */
  function getGeoIndex() {
    return state.geo.index;
  }

  /**
   * Set office centers
   * @param {Map} centers
   */
  function setOfficeCenters(centers) {
    state.geo.officeCenters = centers;
  }

  /**
   * Get office centers
   * @returns {Map|null}
   */
  function getOfficeCenters() {
    return state.geo.officeCenters;
  }

  /* ─── Refresh Control ─── */

  /**
   * Create new abort controller for refresh, aborting any previous
   * @returns {AbortController}
   */
  function createRefreshController() {
    if (state.refresh.abortController) {
      state.refresh.abortController.abort();
    }
    state.refresh.abortController = new AbortController();
    return state.refresh.abortController;
  }

  /**
   * Get current refresh signal
   * @returns {AbortSignal|null}
   */
  function getRefreshSignal() {
    return state.refresh.abortController?.signal || null;
  }

  /* ─── Playback State ─── */

  /**
   * Get playback state
   * @returns {{isPlaying: boolean, timer: *, loopId: number}}
   */
  function getPlayback() {
    return { ...state.playback };
  }

  /**
   * Set playing state
   * @param {boolean} isPlaying
   */
  function setPlaying(isPlaying) {
    state.playback.isPlaying = isPlaying;
    if (!isPlaying) {
      state.playback.loopId += 1;
    }
    notify("playback", state.playback);
  }

  /**
   * Increment loop ID (used to cancel stale loops)
   * @returns {number} New loop ID
   */
  function incrementLoopId() {
    state.playback.loopId += 1;
    return state.playback.loopId;
  }

  /**
   * Get current loop ID
   * @returns {number}
   */
  function getLoopId() {
    return state.playback.loopId;
  }

  /**
   * Check if playback is active
   * @returns {boolean}
   */
  function isPlaying() {
    return state.playback.isPlaying;
  }

  /* ─── Keyboard Selection ─── */

  /**
   * Set keyboard selection state
   * @param {number} index
   * @param {Element[]} elements
   */
  function setKeyboardSelection(index, elements) {
    state.keyboard.selectedIndex = index;
    state.keyboard.flowElements = elements;
  }

  /**
   * Get keyboard selection
   * @returns {{selectedIndex: number, flowElements: Element[]}}
   */
  function getKeyboardSelection() {
    return { ...state.keyboard };
  }

  /**
   * Clear keyboard selection
   */
  function clearKeyboardSelection() {
    state.keyboard.selectedIndex = -1;
    state.keyboard.flowElements = [];
  }

  /* ─── Navigation Direction ─── */

  /**
   * Update navigation direction based on year change
   * @param {number} year
   */
  function updateNavigationDirection(year) {
    if (state.navigation.previousYear !== null && year !== state.navigation.previousYear) {
      state.navigation.direction = year > state.navigation.previousYear ? 1 : -1;
    }
    state.navigation.previousYear = year;
  }

  /**
   * Get navigation direction
   * @returns {number} 1 for forward, -1 for backward
   */
  function getNavigationDirection() {
    return state.navigation.direction;
  }

  /* ─── Viewport (Zoom/Pan) ─── */

  /**
   * Get current zoom level
   * @returns {number}
   */
  function getZoom() {
    return state.viewport.zoom;
  }

  /**
   * Set zoom level (clamped to min/max)
   * @param {number} zoom
   * @param {number} min
   * @param {number} max
   */
  function setZoom(zoom, min = 0.5, max = 4) {
    state.viewport.zoom = Math.max(min, Math.min(max, zoom));
    notify("zoom", state.viewport.zoom);
  }

  /**
   * Get pan offset
   * @returns {{x: number, y: number}}
   */
  function getPan() {
    return { ...state.viewport.pan };
  }

  /**
   * Set pan offset
   * @param {number} x
   * @param {number} y
   */
  function setPan(x, y) {
    state.viewport.pan.x = x;
    state.viewport.pan.y = y;
    notify("pan", state.viewport.pan);
  }

  /**
   * Add to pan offset
   * @param {number} dx
   * @param {number} dy
   */
  function addPan(dx, dy) {
    state.viewport.pan.x += dx;
    state.viewport.pan.y += dy;
    notify("pan", state.viewport.pan);
  }

  /**
   * Reset viewport to default
   */
  function resetViewport() {
    state.viewport.zoom = 1;
    state.viewport.pan = { x: 0, y: 0 };
    notify("zoom", state.viewport.zoom);
    notify("pan", state.viewport.pan);
  }

  /**
   * Get/set drag state
   */
  function isDragging() {
    return state.viewport.isDragging;
  }

  function setDragging(dragging, startX, startY) {
    state.viewport.isDragging = dragging;
    if (startX !== undefined && startY !== undefined) {
      state.viewport.dragStart = { x: startX, y: startY };
    }
  }

  function getDragStart() {
    return { ...state.viewport.dragStart };
  }

  function setDragStart(x, y) {
    state.viewport.dragStart = { x, y };
  }

  /* ─── State Change Subscription ─── */

  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch
   * @param {function} callback - Called with new value on change
   * @returns {function} Unsubscribe function
   */
  function subscribe(key, callback) {
    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    listeners.get(key).add(callback);
    return () => listeners.get(key).delete(callback);
  }

  return {
    /* Cache */
    setCacheEntry,
    getCacheEntry,
    hasCacheEntry,
    clearCache,
    setCacheMaxEntries,
    /* Merged */
    setMergedPeriods,
    getMergedPeriods,
    wasMergedAttempted,
    resetMerged,
    /* Geo */
    setGeoIndex,
    getGeoIndex,
    setOfficeCenters,
    getOfficeCenters,
    /* Refresh */
    createRefreshController,
    getRefreshSignal,
    /* Playback */
    getPlayback,
    setPlaying,
    incrementLoopId,
    getLoopId,
    isPlaying,
    /* Keyboard */
    setKeyboardSelection,
    getKeyboardSelection,
    clearKeyboardSelection,
    /* Navigation */
    updateNavigationDirection,
    getNavigationDirection,
    /* Viewport */
    getZoom,
    setZoom,
    getPan,
    setPan,
    addPan,
    resetViewport,
    isDragging,
    setDragging,
    getDragStart,
    setDragStart,
    /* Subscription */
    subscribe,
  };
});
