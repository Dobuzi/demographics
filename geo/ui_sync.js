/**
 * UI synchronization module for Demographics app
 * Handles updating UI elements with data state
 * UMD module pattern for Node.js and browser compatibility
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.uiSync = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ─── Dependencies ─── */
  let config = null;
  let dataUtils = null;
  let flowStyle = null;
  let i18n = null;

  /**
   * Initialize module with dependencies
   * @param {object} deps
   */
  function init(deps) {
    config = deps.config || (typeof window !== "undefined" ? window.appConfig : null);
    dataUtils = deps.dataUtils || (typeof window !== "undefined" ? window.dataUtils : null);
    flowStyle = deps.flowStyle || (typeof window !== "undefined" ? window.flowStyle : null);
    i18n = deps.i18n || (typeof window !== "undefined" ? window.i18n : null);
  }

  /**
   * Format number for display (Korean locale)
   * @param {number} num
   * @returns {string}
   */
  function formatNumber(num) {
    if (dataUtils && dataUtils.formatNumber) {
      return dataUtils.formatNumber(num);
    }
    return num.toLocaleString("ko-KR");
  }

  /**
   * Sync age label with slider value
   * @param {number} index - Age group index
   * @param {HTMLElement} ageValue - Label element
   */
  function syncAgeLabel(index, ageValue) {
    if (!ageValue || !dataUtils) return;
    const ageGroups = dataUtils.AGE_GROUPS || [];
    const age = ageGroups[index];
    if (age) {
      ageValue.textContent = age.label;
    }
  }

  /**
   * Toggle age range enabled state
   * @param {HTMLInputElement} ageRange
   */
  function toggleAgeAll(ageRange) {
    if (!ageRange) return;
    ageRange.disabled = false;
  }

  /**
   * Set overlay blocked state (for modal/settings)
   * @param {boolean} isBlocked
   */
  function setOverlayBlocked(isBlocked) {
    document.body.classList.toggle("settings-open", isBlocked);
  }

  /**
   * Set loading state on element
   * @param {HTMLElement} target
   * @param {boolean} isLoading
   */
  function setLoading(target, isLoading) {
    if (!target) return;
    target.classList.toggle("is-active", isLoading);
  }

  /**
   * Show error message
   * @param {string} message
   * @param {object} elements - {banner, messageEl, overlay}
   */
  function showError(message, elements) {
    const { banner, messageEl, overlay } = elements;
    if (banner && messageEl) {
      messageEl.textContent = message;
      banner.classList.add("is-active");
      banner.setAttribute("role", "alert");
    }
    if (overlay) {
      overlay.textContent = message;
      overlay.classList.add("is-active");
    }
  }

  /**
   * Hide error message
   * @param {object} elements - {banner, overlay}
   */
  function hideError(elements) {
    const { banner, overlay } = elements;
    if (banner) {
      banner.classList.remove("is-active");
    }
    if (overlay) {
      overlay.classList.remove("is-active");
      overlay.textContent = "";
    }
  }

  /**
   * Update top flows list
   * @param {Array} flows - Flow data array
   * @param {HTMLElement} listEl - List container
   * @param {HTMLElement} titleEl - Title element
   */
  function updateTopList(flows, listEl, titleEl) {
    if (!listEl) return;

    const topCount = config ? config.UI.TOP_FLOW_COUNT : 3;
    listEl.innerHTML = "";

    if (titleEl) {
      titleEl.textContent = "TOP3";
    }

    const topFlows = flows.slice(0, topCount);
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
      listEl.appendChild(item);
    });
  }

  /**
   * Render net legend
   * @param {HTMLElement} legendEl
   */
  function renderNetLegend(legendEl) {
    if (!legendEl) return;

    const getNetLegendItems = flowStyle ? flowStyle.getNetLegendItems : null;
    if (!getNetLegendItems) return;

    const items = getNetLegendItems();
    legendEl.innerHTML = items
      .map(
        (item) =>
          `<span class="net-legend__item"><span class="net-legend__swatch" style="background:${item.color};"></span>${item.label}</span>`
      )
      .join("");
  }

  /**
   * Sync stats labels with current state
   * @param {object} data - {year, ageCode, total, month, totalLabel}
   * @param {object} elements - DOM elements
   */
  function syncLabels(data, elements) {
    const { year, ageCode, total, month, totalLabel } = data;
    const { statTotalLabel, statYear, statAge, statTotal, badge } = elements;

    const ageGroups = dataUtils ? dataUtils.AGE_GROUPS : [];
    const ageLabel = ageGroups.find((g) => g.code === ageCode)?.label || "-";

    if (statTotalLabel) {
      statTotalLabel.textContent = totalLabel;
    }
    if (statYear) {
      statYear.textContent = month ? `${year}.${month}` : `${year}`;
    }
    if (statAge) {
      statAge.textContent = ageLabel;
    }
    if (statTotal) {
      statTotal.textContent = total ? `${formatNumber(total)}명` : "-";
    }
    if (badge) {
      badge.textContent = month ? `${year}년 ${month}월` : `${year}년`;
    }
  }

  /**
   * Open flow detail modal
   * @param {object} flowData - {from, to, value}
   * @param {object} elements - {modal, route, value, history}
   * @param {number} year
   */
  function openFlowModal(flowData, elements, year) {
    const { modal, route, valueEl, history } = elements;
    if (!modal || !flowData) return;

    route.textContent = `${flowData.from} → ${flowData.to}`;
    valueEl.textContent = `${formatNumber(Number(flowData.value))}명`;
    history.innerHTML = `<p>현재 연도: ${year}년</p><p>이 경로의 이동자 수입니다.</p>`;

    modal.setAttribute("aria-hidden", "false");
    console.log("[modal] open", flowData);
  }

  /**
   * Close flow detail modal
   * @param {HTMLElement} modal
   */
  function closeFlowModal(modal) {
    if (modal) {
      modal.setAttribute("aria-hidden", "true");
    }
  }

  /**
   * Initialize flow modal event handlers
   * @param {object} elements - {modal, backdrop, closeBtn}
   * @returns {object} - {open, close}
   */
  function initFlowModal(elements) {
    const { modal, backdrop, closeBtn } = elements;

    const close = () => closeFlowModal(modal);

    if (backdrop) backdrop.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal && modal.getAttribute("aria-hidden") === "false") {
        close();
      }
    });

    return { close };
  }

  /**
   * Get system theme preference
   * @returns {string} "light" or "dark"
   */
  function getSystemTheme() {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    return "dark";
  }

  /**
   * Set theme
   * @param {string} theme - "light" or "dark"
   * @param {HTMLElement} themeIcon - Icon element
   */
  function setTheme(theme, themeIcon) {
    document.documentElement.setAttribute("data-theme", theme);
    if (themeIcon) {
      themeIcon.textContent = theme === "light" ? "light_mode" : "dark_mode";
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("demographics-theme", theme);
    }
    console.log("[theme] set", theme);
  }

  /**
   * Toggle theme
   * @param {HTMLElement} themeIcon
   */
  function toggleTheme(themeIcon) {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "light" ? "dark" : "light";
    setTheme(next, themeIcon);
  }

  /**
   * Initialize theme
   * @param {HTMLElement} toggleBtn
   * @param {HTMLElement} themeIcon
   */
  function initTheme(toggleBtn, themeIcon) {
    const saved = typeof localStorage !== "undefined"
      ? localStorage.getItem("demographics-theme")
      : null;
    const theme = saved || getSystemTheme();
    setTheme(theme, themeIcon);

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => toggleTheme(themeIcon));
    }

    /* Listen for system theme changes */
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
        if (typeof localStorage !== "undefined" && !localStorage.getItem("demographics-theme")) {
          setTheme(e.matches ? "light" : "dark", themeIcon);
        }
      });
    }
  }

  /**
   * Set color palette for color-blind mode
   * @param {boolean} isColorblind
   */
  function setColorPalette(isColorblind) {
    document.documentElement.setAttribute("data-colorblind", isColorblind ? "true" : "false");
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("demographics-colorblind", isColorblind ? "true" : "false");
    }
    console.log("[colorblind] set", isColorblind);
  }

  /**
   * Initialize colorblind toggle
   * @param {HTMLInputElement} toggle
   */
  function initColorblindToggle(toggle) {
    if (!toggle) return;

    const saved = typeof localStorage !== "undefined"
      ? localStorage.getItem("demographics-colorblind") === "true"
      : false;

    toggle.checked = saved;
    setColorPalette(saved);

    toggle.addEventListener("change", () => {
      setColorPalette(toggle.checked);
    });
  }

  /**
   * Format flow label for tooltip
   * @param {object} meta - {from, to, value}
   * @returns {string}
   */
  function formatFlowLabel(meta) {
    if (flowStyle && flowStyle.formatFlowLabel) {
      return flowStyle.formatFlowLabel(meta.from, meta.to, Number(meta.value));
    }
    return `${meta.from} → ${meta.to} · ${formatNumber(Number(meta.value))}명`;
  }

  /**
   * Validate flow metadata
   * @param {object} meta
   * @returns {boolean}
   */
  function isFlowMetaValid(meta) {
    if (flowStyle && flowStyle.isFlowMetaValid) {
      return flowStyle.isFlowMetaValid(meta);
    }
    return meta.from && meta.to && meta.value;
  }

  /**
   * Get indicator info for tooltip
   * @param {string} itemCode
   * @returns {object|null}
   */
  function getIndicatorInfo(itemCode) {
    if (flowStyle && flowStyle.getIndicatorInfo) {
      return flowStyle.getIndicatorInfo(itemCode);
    }
    return null;
  }

  /**
   * Attach info tooltip to button
   * @param {HTMLElement} button
   * @param {HTMLElement} tooltip
   * @param {function} getInfo
   */
  function attachInfoTooltip(button, tooltip, getInfo) {
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
  }

  return {
    init,
    formatNumber,
    syncAgeLabel,
    toggleAgeAll,
    setOverlayBlocked,
    setLoading,
    showError,
    hideError,
    updateTopList,
    renderNetLegend,
    syncLabels,
    openFlowModal,
    closeFlowModal,
    initFlowModal,
    getSystemTheme,
    setTheme,
    toggleTheme,
    initTheme,
    setColorPalette,
    initColorblindToggle,
    formatFlowLabel,
    isFlowMetaValid,
    getIndicatorInfo,
    attachInfoTooltip,
  };
});
