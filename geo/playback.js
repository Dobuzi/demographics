/**
 * Playback controller module for Demographics app
 * Handles timeline playback, speed control, and prefetching
 * UMD module pattern for Node.js and browser compatibility
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.playbackController = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ─── Dependencies ─── */
  let config = null;
  let state = null;
  let dataUtils = null;
  let dataLoader = null;

  /* ─── Callbacks ─── */
  let onRefresh = null;
  let onPeriodChange = null;
  let onPlayStateChange = null;

  /**
   * Initialize module with dependencies
   * @param {object} deps
   * @param {object} callbacks
   */
  function init(deps, callbacks) {
    config = deps.config || (typeof window !== "undefined" ? window.appConfig : null);
    state = deps.state || (typeof window !== "undefined" ? window.appState : null);
    dataUtils = deps.dataUtils || (typeof window !== "undefined" ? window.dataUtils : null);
    dataLoader = deps.dataLoader || (typeof window !== "undefined" ? window.dataLoader : null);

    if (callbacks) {
      onRefresh = callbacks.onRefresh;
      onPeriodChange = callbacks.onPeriodChange;
      onPlayStateChange = callbacks.onPlayStateChange;
    }
  }

  /**
   * Get playback interval based on period and speed
   * @param {object} period - {year, month}
   * @param {number} speed - Speed multiplier
   * @returns {number} Interval in ms
   */
  function getPlaybackInterval(period, speed = 1) {
    const yearMs = config ? config.PLAYBACK.YEAR_INTERVAL_MS : 1000;
    const monthMs = config ? config.PLAYBACK.MONTH_INTERVAL_MS : 700;

    if (dataUtils && dataUtils.getPlaybackInterval) {
      return dataUtils.getPlaybackInterval(period, speed, yearMs, monthMs);
    }

    const baseMs = period && period.month ? monthMs : yearMs;
    return Math.max(300, Math.round(baseMs / speed));
  }

  /**
   * Get prefetch count based on network connection
   * @returns {number}
   */
  function getPrefetchCount() {
    const connection = typeof navigator !== "undefined"
      ? navigator.connection || navigator.mozConnection || navigator.webkitConnection
      : null;

    if (dataUtils && dataUtils.getPrefetchCount) {
      return dataUtils.getPrefetchCount(connection);
    }

    return 3;
  }

  /**
   * Build timeline of all periods
   * @returns {Array<{year: number, month?: string}>}
   */
  function buildTimeline() {
    if (dataUtils && dataUtils.buildTimeline) {
      return dataUtils.buildTimeline();
    }

    /* Fallback: 1995-2024 yearly, 2025 monthly */
    const timeline = [];
    for (let year = 1995; year <= 2024; year++) {
      timeline.push({ year });
    }
    for (let month = 1; month <= 12; month++) {
      timeline.push({ year: 2025, month: String(month).padStart(2, "0") });
    }
    return timeline;
  }

  /**
   * Set current period (year/month)
   * @param {{year: number, month?: string}} period
   * @param {object} elements - DOM elements {yearRange, yearLabel}
   */
  function setPeriod(period, elements) {
    const { yearRange, yearLabel } = elements;
    const defaultMonth = config ? config.DATA.DEFAULT_MONTH : "11";

    if (yearRange) {
      yearRange.value = String(period.year);
    }
    if (yearLabel) {
      yearLabel.textContent = String(period.year);
    }

    const isMonthly = period.year === 2025;
    if (isMonthly && !period.month) {
      period.month = defaultMonth;
    }

    if (onPeriodChange) {
      onPeriodChange(period);
    }
  }

  /**
   * Toggle playback on/off
   * @param {HTMLElement} toggleBtn - Play/pause button
   * @param {HTMLElement} tooltip - Flow tooltip to hide during playback
   * @param {object} elements - {yearRange, yearLabel}
   * @param {number} speed - Playback speed multiplier
   */
  function togglePlayback(toggleBtn, tooltip, elements, speed = 1) {
    if (!state || !toggleBtn) return;

    if (state.isPlaying()) {
      /* Stop playback */
      state.setPlaying(false);
      toggleBtn.innerHTML = '<span class="material-symbols-rounded">play_arrow</span>';
      toggleBtn.classList.remove("is-playing");
      toggleBtn.setAttribute("aria-label", "재생");
      if (onPlayStateChange) onPlayStateChange(false);
      return;
    }

    /* Start playback */
    state.setPlaying(true);
    toggleBtn.innerHTML = '<span class="material-symbols-rounded">pause</span>';
    toggleBtn.classList.add("is-playing");
    toggleBtn.setAttribute("aria-label", "일시정지");

    if (tooltip) {
      tooltip.classList.remove("is-active");
    }

    if (onPlayStateChange) onPlayStateChange(true);
    runPlaybackLoop(elements, speed);
  }

  /**
   * Run the main playback loop
   * @param {object} elements - {yearRange, yearLabel}
   * @param {number} speed - Playback speed multiplier
   */
  async function runPlaybackLoop(elements, speed = 1) {
    if (!state) return;

    const timeline = buildTimeline();
    const { yearRange } = elements;
    const defaultMonth = config ? config.DATA.DEFAULT_MONTH : "11";

    /* Find current position in timeline */
    let index = timeline.findIndex((entry) => {
      const year = Number(yearRange.value);
      const month = year === 2025 ? defaultMonth : null;
      return entry.year === year && entry.month === month;
    });
    if (index < 0) index = 0;

    const loopId = state.incrementLoopId();

    while (state.isPlaying() && loopId === state.getLoopId()) {
      const current = timeline[index];
      setPeriod(current, elements);

      if (onRefresh) {
        await onRefresh();
      }

      /* Prefetch upcoming periods */
      const prefetchCount = getPrefetchCount();
      for (let offset = 1; offset <= prefetchCount; offset++) {
        const next = timeline[(index + offset) % timeline.length];
        prefetchPeriod(next);
      }

      index = (index + 1) % timeline.length;
      await new Promise((resolve) =>
        setTimeout(resolve, getPlaybackInterval(current, speed))
      );
    }
  }

  /**
   * Prefetch a period's data
   * @param {{year: number, month?: string}} period
   */
  async function prefetchPeriod(period) {
    if (dataLoader) {
      await dataLoader.prefetchPeriod(period);
    }
  }

  /**
   * Directional prefetch based on navigation direction
   * @param {number} year
   * @param {string|null} month
   * @param {object} elements - {yearRange}
   */
  async function directionalPrefetch(year, month, elements) {
    if (!state || state.isPlaying()) return;

    state.updateNavigationDirection(year);
    const direction = state.getNavigationDirection();
    const timeline = buildTimeline();

    const currentIndex = timeline.findIndex(
      (entry) => entry.year === year && entry.month === month
    );

    if (currentIndex >= 0) {
      const prefetchCount = getPrefetchCount();
      for (let offset = 1; offset <= prefetchCount; offset++) {
        const targetIndex = currentIndex + offset * direction;
        if (targetIndex >= 0 && targetIndex < timeline.length) {
          prefetchPeriod(timeline[targetIndex]);
        }
      }
      console.log("[refresh] directional prefetch", direction > 0 ? "forward" : "backward");
    }
  }

  /**
   * Get current speed from speed slider
   * @param {HTMLInputElement} speedSlider
   * @returns {number}
   */
  function getSpeed(speedSlider) {
    return speedSlider ? Number(speedSlider.value) || 1 : 1;
  }

  /**
   * Update speed label
   * @param {HTMLInputElement} speedSlider
   * @param {HTMLElement} speedLabel
   */
  function syncSpeedLabel(speedSlider, speedLabel) {
    if (!speedSlider || !speedLabel) return;
    const value = Number(speedSlider.value) || 1;
    speedLabel.textContent = `${value.toFixed(1)}x`;
  }

  return {
    init,
    getPlaybackInterval,
    getPrefetchCount,
    buildTimeline,
    setPeriod,
    togglePlayback,
    runPlaybackLoop,
    prefetchPeriod,
    directionalPrefetch,
    getSpeed,
    syncSpeedLabel,
  };
});
