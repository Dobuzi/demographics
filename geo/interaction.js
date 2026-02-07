/**
 * Interaction controller module for Demographics app
 * Handles zoom, pan, keyboard navigation, and touch gestures
 * UMD module pattern for Node.js and browser compatibility
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.interaction = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ─── Dependencies ─── */
  let config = null;
  let state = null;
  let renderer = null;

  /* ─── Callbacks ─── */
  let onRefresh = null;
  let onViewBoxUpdate = null;
  let onMinimapUpdate = null;

  /**
   * Initialize module with dependencies
   * @param {object} deps
   * @param {object} callbacks
   */
  function init(deps, callbacks) {
    config = deps.config || (typeof window !== "undefined" ? window.appConfig : null);
    state = deps.state || (typeof window !== "undefined" ? window.appState : null);
    renderer = deps.renderer || (typeof window !== "undefined" ? window.renderer : null);

    if (callbacks) {
      onRefresh = callbacks.onRefresh;
      onViewBoxUpdate = callbacks.onViewBoxUpdate;
      onMinimapUpdate = callbacks.onMinimapUpdate;
    }
  }

  /**
   * Update SVG viewBox based on current zoom/pan state
   * @param {SVGElement} svg
   */
  function updateViewBox(svg) {
    if (!svg || !state) return;
    const zoom = state.getZoom();
    const pan = state.getPan();

    if (renderer) {
      renderer.updateViewBox(svg, zoom, pan);
    } else {
      const base = config ? config.getBaseViewBox() : { x: -40, y: 0, w: 980, h: 780 };
      const w = base.w / zoom;
      const h = base.h / zoom;
      const x = base.x + (base.w - w) / 2 - pan.x;
      const y = base.y + (base.h - h) / 2 - pan.y;
      svg.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
    }

    if (onViewBoxUpdate) onViewBoxUpdate();
    if (onMinimapUpdate) onMinimapUpdate();
  }

  /**
   * Zoom in
   * @param {SVGElement} svg
   */
  function zoomIn(svg) {
    if (!state) return;
    const step = config ? config.ZOOM.STEP : 0.25;
    const max = config ? config.ZOOM.MAX : 4;
    const current = state.getZoom();
    state.setZoom(Math.min(max, current + step), config?.ZOOM.MIN, max);
    updateViewBox(svg);
    console.log("[zoom] in", state.getZoom());
  }

  /**
   * Zoom out
   * @param {SVGElement} svg
   */
  function zoomOut(svg) {
    if (!state) return;
    const step = config ? config.ZOOM.STEP : 0.25;
    const min = config ? config.ZOOM.MIN : 0.5;
    const current = state.getZoom();
    state.setZoom(Math.max(min, current - step), min, config?.ZOOM.MAX);
    updateViewBox(svg);
    console.log("[zoom] out", state.getZoom());
  }

  /**
   * Reset zoom and pan to default
   * @param {SVGElement} svg
   */
  function zoomReset(svg) {
    if (!state) return;
    state.resetViewport();
    updateViewBox(svg);
    console.log("[zoom] reset");
  }

  /**
   * Handle pan movement
   * @param {SVGElement} svg
   * @param {number} clientX
   * @param {number} clientY
   */
  function handlePan(svg, clientX, clientY) {
    if (!state || !state.isDragging()) return;
    const dragStart = state.getDragStart();
    const zoom = state.getZoom();
    const dx = (clientX - dragStart.x) / zoom;
    const dy = (clientY - dragStart.y) / zoom;
    state.addPan(dx, dy);
    state.setDragStart(clientX, clientY);
    updateViewBox(svg);
  }

  /**
   * Initialize zoom/pan controls on an SVG element
   * @param {SVGElement} svg
   * @param {object} elements - DOM elements {zoomIn, zoomOut, zoomReset}
   * @param {object} options - Options {onYearChange}
   */
  function initZoomPan(svg, elements, options) {
    if (!svg) return;

    /* Zoom buttons */
    if (elements.zoomIn) {
      elements.zoomIn.addEventListener("click", () => zoomIn(svg));
    }
    if (elements.zoomOut) {
      elements.zoomOut.addEventListener("click", () => zoomOut(svg));
    }
    if (elements.zoomReset) {
      elements.zoomReset.addEventListener("click", () => zoomReset(svg));
    }

    /* Mouse drag */
    svg.addEventListener("mousedown", (e) => {
      if (e.target.closest(".flow-line")) return;
      state.setDragging(true, e.clientX, e.clientY);
      svg.style.cursor = "grabbing";
    });

    svg.addEventListener("mousemove", (e) => handlePan(svg, e.clientX, e.clientY));

    svg.addEventListener("mouseup", () => {
      state.setDragging(false);
      svg.style.cursor = "";
    });

    svg.addEventListener("mouseleave", () => {
      state.setDragging(false);
      svg.style.cursor = "";
    });

    /* Mouse wheel */
    svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn(svg);
      } else {
        zoomOut(svg);
      }
    }, { passive: false });

    /* Touch gestures */
    initTouchGestures(svg, options);
  }

  /**
   * Initialize touch gesture handling
   * @param {SVGElement} svg
   * @param {object} options - {onYearChange}
   */
  function initTouchGestures(svg, options) {
    if (!svg || !state) return;

    let touchStartDistance = 0;
    let touchStartZoom = 1;
    let swipeStartX = 0;
    let swipeStartY = 0;
    const swipeThreshold = config ? config.UI.SWIPE_THRESHOLD : 50;

    function getTouchDistance(touches) {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function handleSwipe(deltaX, deltaY) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
        if (options && options.onYearChange) {
          const direction = deltaX > 0 ? -1 : 1;
          options.onYearChange(direction);
        }
      }
    }

    svg.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        touchStartDistance = getTouchDistance(e.touches);
        touchStartZoom = state.getZoom();
      } else if (e.touches.length === 1) {
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    svg.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2 && touchStartDistance > 0) {
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches);
        const scale = currentDistance / touchStartDistance;
        const min = config ? config.ZOOM.MIN : 0.5;
        const max = config ? config.ZOOM.MAX : 4;
        state.setZoom(Math.max(min, Math.min(max, touchStartZoom * scale)), min, max);
        updateViewBox(svg);
      }
    }, { passive: false });

    svg.addEventListener("touchend", (e) => {
      if (e.changedTouches.length === 1 && touchStartDistance === 0) {
        const deltaX = e.changedTouches[0].clientX - swipeStartX;
        const deltaY = e.changedTouches[0].clientY - swipeStartY;
        handleSwipe(deltaX, deltaY);
      }
      touchStartDistance = 0;
    }, { passive: true });
  }

  /**
   * Initialize minimap interaction
   * @param {HTMLElement} minimap
   * @param {SVGElement} svg
   */
  function initMinimap(minimap, svg) {
    if (!minimap || !state) return;

    minimap.addEventListener("click", (e) => {
      const rect = minimap.getBoundingClientRect();
      const base = config ? config.getBaseViewBox() : { x: -40, y: 0, w: 980, h: 780 };
      const x = (e.clientX - rect.left - 4) / rect.width * base.w;
      const y = (e.clientY - rect.top - 4) / rect.height * base.h;
      state.setPan(x - base.w / 2, y - base.h / 2);
      updateViewBox(svg);
    });

    console.log("[minimap] initialized");
  }

  /**
   * Update minimap viewport indicator
   * @param {HTMLElement} viewport
   * @param {HTMLElement} minimap
   */
  function updateMinimapViewport(viewport, minimap) {
    if (!viewport || !minimap || !state) return;

    const base = config ? config.getBaseViewBox() : { x: -40, y: 0, w: 980, h: 780 };
    const zoom = state.getZoom();
    const pan = state.getPan();
    const minimapRect = minimap.getBoundingClientRect();
    const scale = minimapRect.width / base.w;

    const viewW = (base.w / zoom) * scale;
    const viewH = (base.h / zoom) * scale;
    const viewX = ((base.w - base.w / zoom) / 2 - pan.x) * scale;
    const viewY = ((base.h - base.h / zoom) / 2 - pan.y) * scale;

    viewport.style.width = `${viewW}px`;
    viewport.style.height = `${viewH}px`;
    viewport.style.left = `${4 + viewX}px`;
    viewport.style.top = `${4 + viewY}px`;
  }

  /**
   * Initialize keyboard navigation for flows
   * @param {object} elements - {flowGroup, tooltip}
   * @param {object} callbacks - {onSelect, onClear, formatLabel}
   */
  function initKeyboardNavigation(elements, callbacks) {
    if (!state) return;

    function selectFlowByKeyboard(index) {
      if (state.isPlaying()) return;

      const { flowGroup, tooltip } = elements;
      if (!flowGroup) return;

      const flowLines = flowGroup.querySelectorAll(".flow-line");
      if (flowLines.length === 0) return;

      const clampedIndex = ((index % flowLines.length) + flowLines.length) % flowLines.length;
      clearFlowKeyboardSelection(elements);

      state.setKeyboardSelection(clampedIndex, Array.from(flowLines));
      const target = flowLines[clampedIndex];
      if (!target) return;

      const flowId = target.dataset.flowId;
      flowGroup.classList.add("is-muted");
      flowGroup.querySelectorAll(`[data-flow-id="${flowId}"]`).forEach((node) =>
        node.classList.add("is-highlight", "is-keyboard-selected")
      );

      if (callbacks.onSelect) {
        callbacks.onSelect(target.dataset.fromCode, target.dataset.toCode);
      }

      if (tooltip && callbacks.formatLabel) {
        const meta = {
          from: target.dataset.from,
          to: target.dataset.to,
          value: target.dataset.value,
        };
        tooltip.textContent = callbacks.formatLabel(meta);
        tooltip.classList.add("is-active");
        tooltip.style.transform = "translate(50%, 50%)";
      }

      console.log("[keyboard] selected flow", clampedIndex, target.dataset.label);
    }

    function clearFlowKeyboardSelection(els) {
      const { flowGroup, tooltip } = els || elements;
      if (flowGroup) {
        flowGroup.querySelectorAll(".is-keyboard-selected").forEach((node) => {
          node.classList.remove("is-highlight", "is-keyboard-selected");
        });
        flowGroup.classList.remove("is-muted");
      }
      if (callbacks.onClear) {
        callbacks.onClear();
      }
      if (tooltip) {
        tooltip.classList.remove("is-active");
      }
      state.clearKeyboardSelection();
    }

    /* Expose for global keyboard handler */
    return {
      selectFlowByKeyboard,
      clearFlowKeyboardSelection,
    };
  }

  /**
   * Initialize settings panel toggle
   * @param {HTMLElement} toggle
   * @param {HTMLElement} panel
   * @param {object} callbacks - {onOpen, onClose}
   */
  function initSettingsToggle(toggle, panel, callbacks) {
    if (!toggle || !panel) return;

    const ensureSettingsIcon = () => {
      let icon = toggle.querySelector(".material-symbols-rounded");
      if (!icon) {
        toggle.innerHTML = "";
        icon = document.createElement("span");
        icon.className = "material-symbols-rounded";
        toggle.appendChild(icon);
      }
      icon.textContent = "settings";
    };

    ensureSettingsIcon();
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "설정 열기");
    toggle.setAttribute("aria-controls", panel.id);

    const closeSettings = () => {
      panel.classList.add("is-collapsed");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "설정 열기");
      ensureSettingsIcon();
      if (callbacks && callbacks.onClose) callbacks.onClose();
    };

    const openSettings = () => {
      panel.classList.remove("is-collapsed");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "설정 닫기");
      ensureSettingsIcon();
      if (callbacks && callbacks.onOpen) callbacks.onOpen();
    };

    toggle.addEventListener("click", () => {
      const isCollapsed = panel.classList.contains("is-collapsed");
      if (isCollapsed) {
        openSettings();
      } else {
        closeSettings();
      }
    });

    document.addEventListener("click", (event) => {
      if (panel.classList.contains("is-collapsed")) return;
      if (panel.contains(event.target) || toggle.contains(event.target)) return;
      closeSettings();
    });

    return { openSettings, closeSettings };
  }

  /**
   * Initialize global keyboard handlers
   * @param {object} handlers - {onEscape, onArrowKey}
   */
  function initGlobalKeyboard(handlers) {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (handlers.onEscape) handlers.onEscape();
        return;
      }
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const delta = event.key === "ArrowUp" ? -1 : 1;
        if (handlers.onArrowKey) handlers.onArrowKey(delta);
      }
    });
  }

  /**
   * Initialize flow line interactions (hover, click)
   * @param {SVGElement} flowGroup
   * @param {object} elements - {tooltip, svg}
   * @param {object} callbacks - {onHighlight, onClearHighlight, formatLabel, isValidMeta, onClick, isPlaying}
   */
  function initFlowInteractions(flowGroup, elements, callbacks) {
    if (!flowGroup) return;

    const { tooltip, svg } = elements;

    flowGroup.addEventListener("pointerenter", (event) => {
      const target = event.target.closest(".flow-line");
      if (!target || (callbacks.isPlaying && callbacks.isPlaying())) return;

      const flowId = target.dataset.flowId;
      if (!flowId) return;

      flowGroup.classList.add("is-muted");
      flowGroup.querySelectorAll(`[data-flow-id="${flowId}"]`).forEach((node) =>
        node.classList.add("is-highlight")
      );

      if (callbacks.onHighlight) {
        callbacks.onHighlight(target.dataset.fromCode, target.dataset.toCode);
      }
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

      if (callbacks.onClearHighlight) callbacks.onClearHighlight();
      if (tooltip) tooltip.classList.remove("is-active");
    }, true);

    flowGroup.addEventListener("pointermove", (event) => {
      if (!tooltip || (callbacks.isPlaying && callbacks.isPlaying())) return;

      const target = event.target.closest(".flow-line");
      if (!target) return;

      const meta = {
        from: target.dataset.from,
        to: target.dataset.to,
        value: target.dataset.value,
      };

      if (callbacks.isValidMeta && !callbacks.isValidMeta(meta)) {
        tooltip.classList.remove("is-active");
        return;
      }

      if (callbacks.formatLabel) {
        tooltip.textContent = callbacks.formatLabel(meta);
      }
      tooltip.classList.add("is-active");

      const rect = svg.getBoundingClientRect();
      const x = event.clientX - rect.left + 12;
      const y = event.clientY - rect.top + 12;
      tooltip.style.transform = `translate(${x}px, ${y}px)`;
    }, true);

    flowGroup.addEventListener("click", (event) => {
      const target = event.target.closest(".flow-line");
      if (!target || (callbacks.isPlaying && callbacks.isPlaying())) return;

      if (callbacks.onClick) {
        callbacks.onClick({
          from: target.dataset.from,
          to: target.dataset.to,
          value: target.dataset.value,
        });
      }
    }, true);
  }

  return {
    init,
    updateViewBox,
    zoomIn,
    zoomOut,
    zoomReset,
    handlePan,
    initZoomPan,
    initTouchGestures,
    initMinimap,
    updateMinimapViewport,
    initKeyboardNavigation,
    initSettingsToggle,
    initGlobalKeyboard,
    initFlowInteractions,
  };
});
