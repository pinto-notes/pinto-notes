// The board's map (Emil, 17 November 2026): optional, off at first, and the app remembers it for
// every board. The whole drawing, small, at the board's bottom right above the zoom, with the part
// in view outlined in the accent; a click or a drag on it moves the view there.
//
// - Drawn here from the scene's shapes: no export and no pictures, so it's cheap.
// - Off, it costs nothing: it listens to nothing.
// - On, the drawing redraws at most every quarter second while the board changes, and never while
//   a press draws, moves or resizes something (the lag work of 16 and 17 November 2026); the box
//   of the view moves on its own, as a style change, when the view does.
// - Dark mode turns it as the board is turned (invert, then hue-rotate 180°: pinto.css).
import { CaptureUpdateAction, getCommonBounds } from "@excalidraw/excalidraw";

export const MAP = { width: 200, height: 128, pad: 10, every: 250 };

/** The view's box on the board, in the board's units: [x1, y1, x2, y2]. */
export function viewBox(s) {
  const z = (s.zoom && s.zoom.value) || 1;
  return [-s.scrollX, -s.scrollY, -s.scrollX + s.width / z, -s.scrollY + s.height / z];
}

/** The board to the map: the drawing and the view together, centred in the map inside its padding. */
export function fitMap(content, view, size = MAP) {
  const box = content
    ? [Math.min(content[0], view[0]), Math.min(content[1], view[1]), Math.max(content[2], view[2]), Math.max(content[3], view[3])]
    : view;
  const w = Math.max(1, box[2] - box[0]), h = Math.max(1, box[3] - box[1]);
  const scale = Math.min((size.width - 2 * size.pad) / w, (size.height - 2 * size.pad) / h);
  const ox = (size.width - w * scale) / 2 - box[0] * scale, oy = (size.height - h * scale) / 2 - box[1] * scale;
  return { scale, ox, oy, box };
}

/** A point of the map, on the board. */
export function mapToBoard(fit, x, y) {
  return { x: (x - fit.ox) / fit.scale, y: (y - fit.oy) / fit.scale };
}

/** The shapes, small: boxes, diamonds and ovals filled and outlined, lines and pen strokes as
 *  lines, words as bars (too small to read), pictures as grey boxes, frames as their outline. */
export function drawShapes(ctx, elements, fit) {
  const s = fit.scale, px = 1 / s;
  ctx.save();
  ctx.translate(fit.ox, fit.oy);
  ctx.scale(s, s);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const e of elements) {
    if (e.isDeleted) continue;
    const stroke = e.strokeColor && e.strokeColor !== "transparent" ? e.strokeColor : null;
    const fill = e.backgroundColor && e.backgroundColor !== "transparent" ? e.backgroundColor : null;
    ctx.save();
    ctx.globalAlpha = (e.opacity == null ? 100 : e.opacity) / 100;
    if (e.angle) {
      const cx = e.x + e.width / 2, cy = e.y + e.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate(e.angle);
      ctx.translate(-cx, -cy);
    }
    // At least a point of the map wide, so a thin line still shows.
    ctx.lineWidth = Math.max(px, Math.min(e.strokeWidth || 1, 4));
    const paint = () => {
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
    };
    switch (e.type) {
      case "rectangle": case "embeddable": case "iframe":
        ctx.beginPath();
        ctx.rect(e.x, e.y, e.width, e.height);
        paint();
        break;
      case "frame": case "magicframe":
        ctx.beginPath();
        ctx.rect(e.x, e.y, e.width, e.height);
        ctx.strokeStyle = "#adb5bd";
        ctx.lineWidth = px;
        ctx.stroke();
        break;
      case "image":
        ctx.fillStyle = "#dee2e6";
        ctx.fillRect(e.x, e.y, e.width, e.height);
        break;
      case "diamond":
        ctx.beginPath();
        ctx.moveTo(e.x + e.width / 2, e.y);
        ctx.lineTo(e.x + e.width, e.y + e.height / 2);
        ctx.lineTo(e.x + e.width / 2, e.y + e.height);
        ctx.lineTo(e.x, e.y + e.height / 2);
        ctx.closePath();
        paint();
        break;
      case "ellipse":
        ctx.beginPath();
        ctx.ellipse(e.x + e.width / 2, e.y + e.height / 2, Math.max(0.5, e.width / 2), Math.max(0.5, e.height / 2), 0, 0, 2 * Math.PI);
        paint();
        break;
      case "line": case "arrow": case "freedraw": {
        const pts = e.points || [];
        if (pts.length < 2 || !stroke) break;
        ctx.beginPath();
        ctx.moveTo(e.x + pts[0][0], e.y + pts[0][1]);
        // A long pen line: some of its points are plenty at this size.
        const step = Math.max(1, Math.floor(pts.length / 48));
        for (let i = step; i < pts.length; i += step) ctx.lineTo(e.x + pts[i][0], e.y + pts[i][1]);
        const last = pts[pts.length - 1];
        ctx.lineTo(e.x + last[0], e.y + last[1]);
        ctx.strokeStyle = stroke;
        ctx.stroke();
        break;
      }
      case "text": {
        if (!stroke) break;
        const size = (e.fontSize || 20) * (e.lineHeight || 1.25);
        const lines = Math.max(1, Math.round(e.height / size)), h = e.height / lines;
        ctx.globalAlpha *= 0.4;
        ctx.fillStyle = stroke;
        for (let i = 0; i < lines; i++) ctx.fillRect(e.x, e.y + i * h + h * 0.25, e.width, Math.max(px, h * 0.5));
        break;
      }
      default:
        break;
    }
    ctx.restore();
  }
  ctx.restore();
}

/**
 * The map, put on `host` while it's on (`show`, `hide`). `nonce()` is the scene's (it changes
 * with every change to an element); `busy(appState)` is a press drawing, moving or resizing
 * something.
 */
export function mapLayer(api, host, { nonce, busy }) {
  let el = null, canvas = null, box = null, offChange = null, offScroll = null;
  let fit = null, drawnNonce = undefined, drawnAt = -Infinity, sceneTimer = null, boxTimer = null, dragging = false;
  // How often it drew, and when (the last forty, by performance.now): the tests read them.
  const counts = { scene: 0, box: 0, times: [] };

  const drawScene = () => {
    if (!el) return;
    const s = api.getAppState();
    const elements = api.getSceneElements();
    const view = viewBox(s);
    fit = fitMap(elements.length ? getCommonBounds(elements) : null, view);
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    if (canvas.width !== MAP.width * dpr) { canvas.width = MAP.width * dpr; canvas.height = MAP.height * dpr; }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, MAP.width, MAP.height);
    drawShapes(ctx, elements, fit);
    drawnNonce = nonce();
    drawnAt = performance.now();
    counts.scene++;
    counts.times.push(Math.round(drawnAt));
    if (counts.times.length > 40) counts.times.shift();
    placeBox();
  };

  // The drawing again: no sooner than a quarter second after the last time, and not mid-press.
  const sceneSoon = () => {
    if (!el || sceneTimer) return;
    const run = () => {
      sceneTimer = null;
      if (!el) return;
      if (busy(api.getAppState()) && !dragging) { sceneTimer = setTimeout(run, 100); return; }
      drawScene();
    };
    sceneTimer = setTimeout(run, Math.max(0, MAP.every - (performance.now() - drawnAt)));
  };

  // The view's box, where the view is; past the map's edges, the drawing is fitted again.
  const placeBox = () => {
    if (!el || !fit) return;
    const v = viewBox(api.getAppState()), b = fit.box;
    if (!dragging && (v[0] < b[0] - 1 || v[1] < b[1] - 1 || v[2] > b[2] + 1 || v[3] > b[3] + 1)) sceneSoon();
    const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
    const x1 = clamp(fit.ox + v[0] * fit.scale, 0, MAP.width), y1 = clamp(fit.oy + v[1] * fit.scale, 0, MAP.height);
    const x2 = clamp(fit.ox + v[2] * fit.scale, 0, MAP.width), y2 = clamp(fit.oy + v[3] * fit.scale, 0, MAP.height);
    box.style.transform = `translate(${x1.toFixed(1)}px, ${y1.toFixed(1)}px)`;
    box.style.width = `${Math.max(4, x2 - x1).toFixed(1)}px`;
    box.style.height = `${Math.max(4, y2 - y1).toFixed(1)}px`;
    counts.box++;
  };
  const boxSoon = () => {
    if (!el || boxTimer) return;
    boxTimer = setTimeout(() => { boxTimer = null; placeBox(); }, 16);
  };

  const changed = () => {
    if (nonce() !== drawnNonce) sceneSoon();
    boxSoon();
  };

  // A click or a drag on the map: the view's middle goes there.
  const moveTo = (e) => {
    if (!fit) return;
    const r = el.getBoundingClientRect();
    const p = mapToBoard(fit, e.clientX - r.left, e.clientY - r.top);
    const s = api.getAppState(), z = (s.zoom && s.zoom.value) || 1;
    api.updateScene({ appState: { scrollX: -p.x + s.width / 2 / z, scrollY: -p.y + s.height / 2 / z }, captureUpdate: CaptureUpdateAction.NEVER });
    placeBox();
  };
  const down = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    try { el.setPointerCapture(e.pointerId); } catch (x) {}
    moveTo(e);
  };
  const move = (e) => { if (dragging) { e.preventDefault(); e.stopPropagation(); moveTo(e); } };
  const up = (e) => {
    if (!dragging) return;
    e.stopPropagation();
    dragging = false;
    try { el.releasePointerCapture(e.pointerId); } catch (x) {}
    sceneSoon();
  };
  const stop = (e) => e.stopPropagation();

  return {
    counts,
    get fit() { return fit; },
    get shown() { return !!el; },
    show({ right = 12, bottom = 68 } = {}) {
      if (!el) {
        el = document.createElement("div");
        el.className = "pinto-map";
        el.setAttribute("role", "img");
        el.setAttribute("aria-label", "Map of the board");
        canvas = document.createElement("canvas");
        box = document.createElement("div");
        box.className = "pinto-map-view";
        el.append(canvas, box);
        el.addEventListener("pointerdown", down);
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", up);
        el.addEventListener("pointercancel", up);
        el.addEventListener("wheel", stop, { passive: true });
        el.addEventListener("dblclick", stop);
        el.addEventListener("contextmenu", (e) => { e.preventDefault(); e.stopPropagation(); });
        host.appendChild(el);
        offChange = api.onChange(changed);
        offScroll = api.onScrollChange(boxSoon);
      }
      el.style.right = `${right}px`;
      el.style.bottom = `${bottom}px`;
      drawScene();
    },
    hide() {
      if (!el) return;
      clearTimeout(sceneTimer);
      clearTimeout(boxTimer);
      sceneTimer = boxTimer = null;
      if (offChange) offChange();
      if (offScroll) offScroll();
      offChange = offScroll = null;
      el.remove();
      el = canvas = box = null;
      fit = null;
      drawnNonce = undefined;
    },
  };
}
