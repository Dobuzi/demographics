/**
 * SVG Renderer module for Demographics app
 * Handles all SVG rendering: base map, flows, gradients, animations
 * UMD module pattern for Node.js and browser compatibility
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.renderer = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ─── Dependencies ─── */
  let flowStyle = null;
  let dataUtils = null;
  let config = null;

  /**
   * Initialize module with dependencies
   * @param {object} deps
   */
  function init(deps) {
    flowStyle = deps.flowStyle || (typeof window !== "undefined" ? window.flowStyle : null);
    dataUtils = deps.dataUtils || (typeof window !== "undefined" ? window.dataUtils : null);
    config = deps.config || (typeof window !== "undefined" ? window.appConfig : null);
  }

  /**
   * Schedule a callback to run on the next animation frame
   * Batches DOM updates to avoid layout thrashing
   * @param {function} callback
   */
  function scheduleRender(callback) {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(callback);
    } else {
      callback();
    }
  }

  /**
   * Create SVG namespace element
   * @param {string} tag
   * @returns {SVGElement}
   */
  function createSvgElement(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
  }

  /**
   * Generate a quadratic Bezier SVG path between two points
   * Guards against NaN when source and target overlap
   * @param {{x: number, y: number}} source
   * @param {{x: number, y: number}} target
   * @returns {string} SVG path d attribute
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

  /**
   * Create animated particle elements for a flow path
   * @param {string} pathD - SVG path d attribute
   * @param {number} particleCount - Number of particles
   * @returns {SVGElement[]}
   */
  function createFlowParticles(pathD, particleCount = 3) {
    const particles = [];
    const duration = 2 + Math.random() * 2;

    for (let i = 0; i < particleCount; i++) {
      const particle = createSvgElement("circle");
      particle.setAttribute("r", "3");
      particle.setAttribute("class", "flow-particle");
      particle.style.offsetPath = `path("${pathD}")`;
      particle.style.setProperty("--particle-duration", `${duration}s`);
      particle.style.setProperty("--particle-delay", `${(i / particleCount) * duration}s`);
      particles.push(particle);
    }

    return particles;
  }

  /**
   * Draw base map with region polygons and labels
   * @param {SVGElement} svg - Target SVG element
   * @param {Array} regions - Region data array
   * @param {string} mode - Display mode ("net" or default)
   * @param {Map} netValues - Net values per region code
   * @param {number} height - Map height
   */
  function drawBaseMap(svg, regions, mode, netValues, height) {
    const width = config ? config.GEO.MAP_WIDTH : 900;
    const fragment = document.createDocumentFragment();

    /* Background */
    const background = createSvgElement("rect");
    background.setAttribute("width", width);
    background.setAttribute("height", height);
    background.setAttribute("fill", "#101218");
    fragment.appendChild(background);

    /* Gradient definitions */
    const defs = createSvgElement("defs");
    const inboundGradient = createSvgElement("linearGradient");
    inboundGradient.setAttribute("id", "net-inbound-gradient");
    inboundGradient.setAttribute("x1", "0");
    inboundGradient.setAttribute("y1", "0");
    inboundGradient.setAttribute("x2", "1");
    inboundGradient.setAttribute("y2", "1");
    inboundGradient.innerHTML =
      '<stop offset="0%" stop-color="rgba(39, 209, 127, 1)"/>' +
      '<stop offset="100%" stop-color="rgba(39, 209, 127, 0.2)"/>';

    const outboundGradient = createSvgElement("linearGradient");
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
    fragment.appendChild(defs);

    /* Region polygons */
    const values = Array.from(netValues.values());
    const maxAbs = Math.max(...values.map((v) => Math.abs(v)), 1);
    const polygonGroup = createSvgElement("g");
    polygonGroup.setAttribute("id", "region-polygons");

    regions.forEach((region) => {
      const polygon = createSvgElement("path");
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
    fragment.appendChild(polygonGroup);

    /* Region dots and labels */
    const dotGroup = createSvgElement("g");
    dotGroup.setAttribute("id", "region-dots");

    regions.forEach((region) => {
      const dot = createSvgElement("circle");
      dot.setAttribute("cx", region.centroid.x);
      dot.setAttribute("cy", region.centroid.y);
      dot.setAttribute("r", region.code === "50" ? 9 : 7);
      dot.setAttribute("fill", "#ef6a41");
      dot.setAttribute("opacity", "0.9");
      dotGroup.appendChild(dot);

      const label = createSvgElement("text");
      label.setAttribute("x", region.centroid.x + 10);
      label.setAttribute("y", region.centroid.y - 6);
      label.setAttribute("fill", "#f6efe6");
      label.setAttribute("font-size", "12");
      label.setAttribute("font-family", "IBM Plex Sans, sans-serif");
      label.textContent = region.name
        .replace("특별자치", "")
        .replace("광역시", "")
        .replace("특별시", "");
      dotGroup.appendChild(label);
    });
    fragment.appendChild(dotGroup);

    /* Commit to DOM */
    scheduleRender(() => {
      svg.innerHTML = "";
      svg.appendChild(fragment);
    });
  }

  /**
   * Create flow gradient element
   * @param {object} flow - Flow data
   * @param {number} index - Flow index
   * @param {number} maxValue - Maximum flow value
   * @returns {SVGElement}
   */
  function createFlowGradient(flow, index, maxValue) {
    const source = flow.from.centroid;
    const target = flow.to.centroid;
    const gradientId = `flow-gradient-${index}`;

    const gradient = createSvgElement("linearGradient");
    gradient.setAttribute("id", gradientId);
    gradient.setAttribute("gradientUnits", "userSpaceOnUse");
    gradient.setAttribute("x1", source.x);
    gradient.setAttribute("y1", source.y);
    gradient.setAttribute("x2", target.x);
    gradient.setAttribute("y2", target.y);
    gradient.setAttribute("spreadMethod", "repeat");

    const FLOW_COLORS = flowStyle ? flowStyle.FLOW_COLORS : { inbound: "#27d17f", outbound: "#f05b4c" };
    const buildGradientStops = flowStyle ? flowStyle.buildGradientStops : null;

    const inboundColor = FLOW_COLORS.inbound;
    const outboundColor = FLOW_COLORS.outbound;

    const stops = buildGradientStops
      ? buildGradientStops(outboundColor, inboundColor)
      : [
          { offset: "0%", color: outboundColor, opacity: 0.82 },
          { offset: "100%", color: inboundColor, opacity: 0.82 },
        ];

    stops.forEach((stop) => {
      const stopEl = createSvgElement("stop");
      stopEl.setAttribute("offset", stop.offset);
      stopEl.setAttribute("stop-color", stop.color);
      stopEl.setAttribute("stop-opacity", stop.opacity);
      gradient.appendChild(stopEl);
    });

    /* Add animation if supported */
    const flowGradientAnimation = flowStyle ? flowStyle.flowGradientAnimation : null;
    const animation = flowGradientAnimation ? flowGradientAnimation(flow.value, maxValue) : null;
    const prefersReducedMotion = typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (animation && !prefersReducedMotion) {
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const anim = createSvgElement("animateTransform");
      anim.setAttribute("attributeName", "gradientTransform");
      anim.setAttribute("type", "translate");
      anim.setAttribute("values", `0 0; ${dx * 0.2} ${dy * 0.2}; 0 0`);
      anim.setAttribute("dur", `${animation.duration}s`);
      anim.setAttribute("repeatCount", "indefinite");
      gradient.appendChild(anim);
    }

    return gradient;
  }

  /**
   * Create flow line elements (glow and main path)
   * @param {object} flow - Flow data
   * @param {number} index - Flow index
   * @param {number} maxValue - Maximum flow value
   * @param {boolean} hasPulse - Whether to add pulse animation
   * @param {SVGElement} flowGroup - Parent group for particles
   * @returns {{glow: SVGElement, path: SVGElement}}
   */
  function createFlowLine(flow, index, maxValue, hasPulse, flowGroup) {
    const source = flow.from.centroid;
    const target = flow.to.centroid;
    const gradientId = `flow-gradient-${index}`;

    const flowWidthScale = flowStyle ? flowStyle.flowWidthScale : (v, m) => 2.2 + (v / m) * 7.3;
    const widthScale = flowWidthScale(flow.value, maxValue);
    const pathD = flowPath(source, target);

    /* Glow effect */
    const pathGlow = createSvgElement("path");
    pathGlow.setAttribute("d", pathD);
    pathGlow.setAttribute("stroke-width", widthScale + 2.5);
    pathGlow.setAttribute("stroke", "rgba(120, 255, 200, 0.25)");
    pathGlow.setAttribute("fill", "none");
    pathGlow.setAttribute("stroke-linecap", "round");
    pathGlow.setAttribute("stroke-linejoin", "round");
    pathGlow.dataset.flowId = `flow-${index}`;
    pathGlow.classList.add("flow-line--glow");
    pathGlow.style.setProperty("--flow-speed", "0s");

    /* Main path */
    const path = createSvgElement("path");
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
    path.style.setProperty("--flow-speed", "0s");

    if (hasPulse) {
      path.classList.add("flow-line--pulse");
      /* Add particles for top flows */
      const prefersReducedMotion = typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!prefersReducedMotion && flowGroup) {
        const particles = createFlowParticles(pathD, 2);
        particles.forEach((p) => flowGroup.appendChild(p));
      }
    }

    return { glow: pathGlow, path };
  }

  /**
   * Draw flow lines on map
   * @param {SVGElement} svg - Target SVG element
   * @param {Array} flows - Flow data array
   * @param {Array} regions - Region data array
   * @param {number} pulseCount - Number of flows to pulse
   * @param {Map} netValues - Net values for region coloring
   * @param {object} callbacks - Event callbacks {onHighlight, onClearHighlight}
   */
  function drawFlows(svg, flows, regions, pulseCount, netValues, callbacks) {
    const height = config ? config.GEO.MAP_HEIGHT : 780;
    drawBaseMap(svg, regions, "net", netValues, height);

    const maxValue = Math.max(...flows.map((f) => f.value), 1);
    const defs = createSvgElement("defs");
    const flowGroup = createSvgElement("g");
    flowGroup.setAttribute("id", "flow-lines");

    /* Create gradients and flow lines */
    flows.forEach((flow, index) => {
      const gradient = createFlowGradient(flow, index, maxValue);
      defs.appendChild(gradient);

      const hasPulse = index < pulseCount;
      const { glow, path } = createFlowLine(flow, index, maxValue, hasPulse, flowGroup);
      flowGroup.appendChild(glow);
      flowGroup.appendChild(path);
    });

    svg.appendChild(defs);
    svg.appendChild(flowGroup);

    return flowGroup;
  }

  /**
   * Fade out existing flow lines
   * @param {number} duration - Fade duration in ms
   * @returns {Promise}
   */
  function fadeOutFlows(duration = 200) {
    const flowLines = document.getElementById("flow-lines");
    if (!flowLines) return Promise.resolve();
    flowLines.style.opacity = "0";
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  /**
   * Animate transition of flows by fading
   * @param {function} renderCallback
   */
  async function animateTransition(renderCallback) {
    const transitionMs = config ? config.UI.FLOW_TRANSITION_MS : 150;
    await fadeOutFlows(transitionMs);
    renderCallback();
    const flowLines = document.getElementById("flow-lines");
    if (flowLines) {
      flowLines.style.opacity = "1";
    }
  }

  /**
   * Show skeleton loading state
   * @param {SVGElement} svg
   */
  function showSkeleton(svg) {
    const skeleton = createSvgElement("g");
    skeleton.setAttribute("id", "skeleton-loader");
    skeleton.setAttribute("class", "skeleton");

    const placeholderPaths = [
      "M450 200 L500 180 L550 200 L530 260 L470 260 Z",
      "M380 300 L430 280 L480 320 L450 380 L390 350 Z",
      "M520 350 L580 320 L620 370 L590 430 L530 400 Z",
    ];

    placeholderPaths.forEach((d) => {
      const path = createSvgElement("path");
      path.setAttribute("d", d);
      path.setAttribute("class", "skeleton-region");
      skeleton.appendChild(path);
    });

    const flowPlaceholders = [
      "M450 230 Q500 180 530 280",
      "M400 320 Q480 250 550 370",
    ];

    flowPlaceholders.forEach((d) => {
      const path = createSvgElement("path");
      path.setAttribute("d", d);
      path.setAttribute("class", "skeleton-flow");
      path.setAttribute("fill", "none");
      skeleton.appendChild(path);
    });

    svg.appendChild(skeleton);
  }

  /**
   * Hide skeleton loading state
   */
  function hideSkeleton() {
    const skeleton = document.getElementById("skeleton-loader");
    if (skeleton) {
      skeleton.remove();
    }
  }

  /**
   * Update viewBox for zoom/pan
   * @param {SVGElement} svg
   * @param {number} zoom
   * @param {{x: number, y: number}} pan
   */
  function updateViewBox(svg, zoom, pan) {
    if (!svg) return;
    const base = config ? config.getBaseViewBox() : { x: -40, y: 0, w: 980, h: 780 };
    const w = base.w / zoom;
    const h = base.h / zoom;
    const x = base.x + (base.w - w) / 2 - pan.x;
    const y = base.y + (base.h - h) / 2 - pan.y;
    svg.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
  }

  /**
   * Highlight/unhighlight regions
   * @param {SVGElement} svg
   * @param {string} fromCode
   * @param {string} toCode
   */
  function highlightRegions(svg, fromCode, toCode) {
    clearRegionHighlights(svg);
    if (!fromCode || !toCode) return;

    const getClass = flowStyle?.getRegionHighlightClass || ((t) => `region-highlight ${t}`);
    const outbound = svg.querySelector(`.region-shape[data-code="${fromCode}"]`);
    const inbound = svg.querySelector(`.region-shape[data-code="${toCode}"]`);

    if (outbound) {
      outbound.className = `region-shape ${getClass("outbound")}`;
    }
    if (inbound) {
      inbound.className = `region-shape ${getClass("inbound")}`;
    }
  }

  /**
   * Clear all region highlights
   * @param {SVGElement} svg
   */
  function clearRegionHighlights(svg) {
    svg.querySelectorAll(".region-shape.region-highlight").forEach((el) => {
      el.classList.remove("region-highlight", "inbound", "outbound");
    });
  }

  return {
    init,
    scheduleRender,
    createSvgElement,
    flowPath,
    createFlowParticles,
    drawBaseMap,
    drawFlows,
    fadeOutFlows,
    animateTransition,
    showSkeleton,
    hideSkeleton,
    updateViewBox,
    highlightRegions,
    clearRegionHighlights,
  };
});
