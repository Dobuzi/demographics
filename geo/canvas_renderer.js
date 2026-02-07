/**
 * Canvas renderer for high-performance flow visualization
 * Provides faster rendering for large flow counts compared to SVG
 * UMD module pattern for Node.js and browser compatibility
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.canvasRenderer = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  let canvas = null;
  let ctx = null;
  let width = 0;
  let height = 0;
  let devicePixelRatio = 1;

  /**
   * Initialize canvas element
   * @param {HTMLCanvasElement} canvasEl - Canvas element to use
   * @param {number} w - Width in CSS pixels
   * @param {number} h - Height in CSS pixels
   */
  function initCanvas(canvasEl, w, h) {
    canvas = canvasEl;
    ctx = canvas.getContext("2d");
    width = w;
    height = h;
    devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    /* Set canvas size with devicePixelRatio for sharp rendering */
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    return { width, height, ctx };
  }

  /**
   * Clear the canvas
   */
  function clearCanvas() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
  }

  /**
   * Calculate quadratic Bezier control point for curved flow
   * @param {object} source - Source point {x, y}
   * @param {object} target - Target point {x, y}
   * @returns {object} Control point {x, y}
   */
  function calculateBezierPath(source, target) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(0.3, 50 / dist);
    /* Perpendicular offset for curve */
    const mx = (source.x + target.x) / 2;
    const my = (source.y + target.y) / 2;
    const nx = -dy / dist;
    const ny = dx / dist;
    const offset = dist * curvature;
    return {
      x: mx + nx * offset,
      y: my + ny * offset,
    };
  }

  /**
   * Create a gradient for flow line
   * @param {object} source - Source point {x, y}
   * @param {object} target - Target point {x, y}
   * @param {string} startColor - Start color
   * @param {string} endColor - End color
   * @returns {CanvasGradient} Canvas gradient
   */
  function createFlowGradient(source, target, startColor, endColor) {
    if (!ctx) return null;
    const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    return gradient;
  }

  /**
   * Draw a single flow line
   * @param {object} source - Source point {x, y}
   * @param {object} target - Target point {x, y}
   * @param {number} lineWidth - Line width
   * @param {string|CanvasGradient} strokeStyle - Stroke color or gradient
   * @param {number} [opacity=0.8] - Line opacity
   */
  function drawFlowLine(source, target, lineWidth, strokeStyle, opacity) {
    if (!ctx) return;
    const control = calculateBezierPath(source, target);
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.quadraticCurveTo(control.x, control.y, target.x, target.y);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.globalAlpha = opacity || 0.8;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /**
   * Draw multiple flows on canvas
   * @param {Array} flows - Array of flow objects
   * @param {object} options - Rendering options
   * @param {string} [options.outboundColor="#f05b4c"] - Outbound color
   * @param {string} [options.inboundColor="#27d17f"] - Inbound color
   * @param {function} [options.widthScale] - Function to scale width based on value
   */
  function drawFlowsCanvas(flows, options) {
    if (!ctx || !flows || flows.length === 0) return;

    const opts = options || {};
    const outboundColor = opts.outboundColor || "#f05b4c";
    const inboundColor = opts.inboundColor || "#27d17f";
    const widthScale = opts.widthScale || ((value, max) => Math.max(1, 8 * (value / max)));

    clearCanvas();

    const maxValue = Math.max(...flows.map((f) => f.value), 1);

    /* Draw flows from back to front (largest first for proper layering) */
    const sortedFlows = flows.slice().sort((a, b) => b.value - a.value);

    sortedFlows.forEach((flow) => {
      const source = flow.from.centroid;
      const target = flow.to.centroid;
      if (!source || !target) return;

      const lineWidth = widthScale(flow.value, maxValue);
      const gradient = createFlowGradient(source, target, outboundColor, inboundColor);

      drawFlowLine(source, target, lineWidth, gradient, 0.8);
    });
  }

  /**
   * Draw region polygons on canvas
   * @param {Array} regions - Array of region objects with paths
   * @param {Map} netValues - Map of region code to net value
   * @param {object} options - Rendering options
   */
  function drawRegionsCanvas(regions, netValues, options) {
    if (!ctx || !regions) return;

    const opts = options || {};
    const inboundColor = opts.inboundColor || "#27d17f";
    const outboundColor = opts.outboundColor || "#f05b4c";
    const neutralColor = opts.neutralColor || "#2a2d35";

    regions.forEach((region) => {
      if (!region.path) return;

      const value = netValues ? netValues.get(region.code) : 0;
      let fillColor = neutralColor;
      if (value > 0) {
        fillColor = inboundColor;
      } else if (value < 0) {
        fillColor = outboundColor;
      }

      ctx.fillStyle = fillColor;
      ctx.globalAlpha = Math.min(0.8, Math.abs(value) / 50000 + 0.2);
      ctx.fill(new Path2D(region.path));
      ctx.globalAlpha = 1;

      /* Draw border */
      ctx.strokeStyle = "#3a3d45";
      ctx.lineWidth = 1;
      ctx.stroke(new Path2D(region.path));
    });
  }

  /**
   * Check if canvas rendering is supported
   * @returns {boolean} True if canvas is supported
   */
  function isSupported() {
    if (typeof document === "undefined") return false;
    const testCanvas = document.createElement("canvas");
    return !!(testCanvas.getContext && testCanvas.getContext("2d"));
  }

  /**
   * Get current canvas dimensions
   * @returns {object} {width, height}
   */
  function getDimensions() {
    return { width, height };
  }

  return {
    initCanvas,
    clearCanvas,
    calculateBezierPath,
    createFlowGradient,
    drawFlowLine,
    drawFlowsCanvas,
    drawRegionsCanvas,
    isSupported,
    getDimensions,
  };
});
