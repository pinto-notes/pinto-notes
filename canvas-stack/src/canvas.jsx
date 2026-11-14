// A canvas note: the drawing board, in the note-page sandbox (Pane/Views/NotePageView.swift).
//
// The drawing is a standard Excalidraw scene ({ type: "excalidraw", elements, appState, files }),
// kept unchanged as the page's data: amber.data.values.scene. The app syncs, seals and versions it
// like any app's data, and an AI reads and edits it as "<Note>.app/data.json".
//
// - Saves after a short pause in drawing, and at once when the page is hidden or the app asks
//   (amber._flush, before the view goes away).
// - A scene changed elsewhere (another device, an AI) is merged in by element id: what changed there
//   since this page last saved comes in; what you changed here stays.
// - Elements an AI wrote in the short "skeleton" form ({ type, x, y, width, height, label }) are
//   filled out on load and saved back in full.
// - Everything you press is the app's own (native) controls: none of the engine's toolbars, menus,
//   hints or dialogs show. The app drives the page through amber._canvasCommand(command) and the page
//   reports what's selected, the active tool and the current style through the amberCanvas message
//   (CanvasBridge.swift has both shapes).
import React, { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import {
  Excalidraw, MainMenu, restore, restoreElements, convertToExcalidrawElements, CaptureUpdateAction,
  getCommonBounds, sceneCoordsToViewportCoords, viewportCoordsToSceneCoords, exportToCanvas, exportToSvg, serializeAsJSON,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import "./pinto.css";

const amber = window.amber;
const SAVE_DELAY = 300;
// Deleted elements are kept a while so another device's copy can't bring them back, then dropped.
const KEEP_DELETED_MS = 7 * 24 * 3600 * 1000;

const emptyScene = () => ({ type: "excalidraw", version: 2, source: "https://pintonotes.com", elements: [], appState: {}, files: {} });

/** Full elements as stored; the short form an AI may write is converted. */
export function normalize(elements) {
  const list = Array.isArray(elements) ? elements.filter((e) => e && typeof e === "object" && typeof e.type === "string") : [];
  const full = [], skeletons = [];
  for (const e of list) (typeof e.seed === "number" && typeof e.version === "number" ? full : skeletons).push(e);
  const converted = skeletons.length ? convertToExcalidrawElements(skeletons, { regenerateIds: false }) : [];
  return { elements: restoreElements([...full, ...converted], null, { repairBindings: true, refreshDimensions: false }), converted: skeletons.length > 0 };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** A scene's fingerprint: each element's id, version and nonce (the engine changes both on every
 *  edit), what's kept of the view, and the files. Cheap next to the whole scene as JSON: the page's
 *  own save comes back to it twice (the store's reply, then the app's push), and with this it's seen
 *  as its own at once instead of merged in again (which redrew every element and saved a second
 *  time: the lag grew with the drawing). */
export function fingerprint(scene) {
  if (!scene || !Array.isArray(scene.elements)) return "";
  const a = scene.appState || {};
  let out = `${a.viewBackgroundColor}|${a.gridSize}|${a.gridStep}|${a.gridModeEnabled}|${Object.keys(scene.files || {}).join(",")}|`;
  for (const e of scene.elements) out += e ? `${e.id}:${e.version}:${e.versionNonce};` : "-;";
  return out;
}

/** Changes that are kept, not pans and zooms: cheap enough for every frame of a stroke. */
function changeKey(elements, appState, files) {
  let v = 0;
  for (const e of elements) v += e.version;
  return `${elements.length}|${v}|${appState.viewBackgroundColor}|${appState.gridModeEnabled}|${files ? Object.keys(files).length : 0}`;
}

/** Three-way, by element id: base is what this page last saved (or received). */
export function merge(local, remote, base) {
  const byId = (l) => new Map(l.map((e) => [e.id, e]));
  const L = byId(local), R = byId(remote), B = byId(base);
  const out = [];
  for (const id of new Set([...L.keys(), ...R.keys()])) {
    const l = L.get(id), r = R.get(id), b = B.get(id);
    if (!r) { if (!b || !same(l, b)) out.push(l); continue; }   // gone there: kept only if new or changed here
    if (!l) { out.push(r); continue; }
    if (same(r, b)) { out.push(l); continue; }                  // unchanged there
    if (same(l, b)) { out.push(r.version > l.version ? r : { ...r, version: l.version + 1 }); continue; }
    out.push(r.version > l.version ? r : l);                    // changed on both: the newer edit
  }
  return restoreElements(out, null, { repairBindings: true, refreshDimensions: false });
}

function sceneFrom(elements, appState, files) {
  const now = Date.now();
  const kept = elements.filter((e) => !e.isDeleted || now - (e.updated || 0) < KEEP_DELETED_MS);
  const used = new Set(kept.filter((e) => !e.isDeleted && e.fileId).map((e) => e.fileId));
  const ownFiles = Object.fromEntries(Object.entries(files || {}).filter(([id]) => used.has(id)));
  return {
    ...emptyScene(),
    elements: kept,
    appState: { viewBackgroundColor: appState.viewBackgroundColor, gridSize: appState.gridSize, gridStep: appState.gridStep, gridModeEnabled: appState.gridModeEnabled },
    files: ownFiles,
  };
}


// MARK: The app's controls

/** What the app's style controls set, as the engine's own actions (so each change is one Undo step). */
const STYLE = {
  strokeColor: (v) => ["changeStrokeColor", { currentItemStrokeColor: v }],
  backgroundColor: (v) => ["changeBackgroundColor", { currentItemBackgroundColor: v }],
  fillStyle: (v) => ["changeFillStyle", v],
  strokeWidth: (v) => ["changeStrokeWidth", v],
  strokeStyle: (v) => ["changeStrokeStyle", v],
  opacity: (v) => ["changeOpacity", v],
  fontFamily: (v) => ["changeFontFamily", { currentItemFontFamily: v }],
  fontSize: (v) => ["changeFontSize", v],
  startArrowhead: (v) => ["changeArrowhead", { position: "start", type: v }],
  endArrowhead: (v) => ["changeArrowhead", { position: "end", type: v }],
  arrowType: (v) => ["changeArrowType", v],
};
/** The app's menu commands, by the engine's action names. */
const ACTIONS = {
  undo: "undo", redo: "redo", bringToFront: "bringToFront", sendToBack: "sendToBack", bringForward: "bringForward",
  sendBackward: "sendBackward", duplicate: "duplicateSelection", delete: "deleteSelectedElements", selectAll: "selectAll",
  zoomIn: "zoomIn", zoomOut: "zoomOut", resetZoom: "resetZoom", zoomToFit: "zoomToFit", clear: "clearCanvas",
  alignLeft: "alignLeft", alignCenter: "alignHorizontallyCentered", alignRight: "alignRight",
  alignTop: "alignTop", alignMiddle: "alignVerticallyCentered", alignBottom: "alignBottom",
  distributeHorizontally: "distributeHorizontally", distributeVertically: "distributeVertically",
};
const TOOLS = new Set(["selection", "hand", "rectangle", "diamond", "ellipse", "arrow", "line", "freedraw", "text", "eraser"]);

/** Keys that would open the engine's own dialogs and panels, which aren't shown here. */
export function blockedKey(e) {
  const cmd = e.metaKey || e.ctrlKey, k = (e.key || "").toLowerCase();
  if (e.key === "?") return true;                                   // help
  if (cmd && (k === "/" || k === "f" || k === "k" || (e.shiftKey && (k === "p" || k === "e")))) return true; // palette, search, link, export
  if (e.altKey && e.code === "Slash") return true;                  // stats
  if (!cmd && !e.altKey && (k === "f" || k === "k" || k === "i")) return true; // frame, laser, image
  return false;
}

const base64 = (text) => btoa(unescape(encodeURIComponent(text)));

/**
 * The board (or only what's selected) as a file, base64: a PNG at 2x, an SVG that carries its
 * scene (Excalidraw opens it again), or the .excalidraw file itself. As it looks, light or dark.
 */
export async function exportScene(api, format, selected) {
  const all = api.getSceneElements();
  const s = api.getAppState();
  const ids = s.selectedElementIds || {};
  const picked = selected ? all.filter((e) => ids[e.id]) : [];
  // A picture of the whole board leaves out a template's how-to line: it's help for you, not
  // part of the drawing (whiteboard council, round 2, 14-exported-board). The file keeps it.
  const help = (e) => format !== "excalidraw" && e.customData && e.customData.pintoHint;
  const elements = (picked.length ? picked : all).filter((e) => !help(e));
  if (!elements.length) return null;
  const files = api.getFiles();
  // Always light, on its background: it goes into documents, slides and chats that are mostly
  // white (whiteboard council, round 2: from dark mode it pasted as a black block).
  const appState = { ...s, exportBackground: true, exportWithDarkMode: false, exportScale: 2, exportEmbedScene: format === "svg" };
  // Drawn to a canvas and read as a data URL: a blob can't be read in the note's sandboxed page
  // (NotReadableError).
  if (format === "png") {
    const canvas = await exportToCanvas({ elements, appState, files, exportPadding: 32, getDimensions: (w, h) => ({ width: w * 2, height: h * 2, scale: 2 }) });
    return canvas.toDataURL("image/png").replace(/^data:[^,]*,/, "");
  }
  if (format === "svg") return base64((await exportToSvg({ elements, appState, files, exportPadding: 32 })).outerHTML);
  if (format === "excalidraw") return base64(serializeAsJSON(elements, s, files, "local"));
  return null;
}

export const STICKY = { size: 180, color: "#ffec99", gap: 24 };
/** The engine itself, once the bridge has reached it (for what its API doesn't offer). */
let engine = null;

/**
 * A sticky note (whiteboard council, round 2: retro and kanban boards with no sticky tool): a
 * square yellow card whose words wrap inside it and move with it, next to what's selected (so
 * pressing S again makes a row) or in the middle of the view, then typed into at once.
 */
export function addSticky(api) {
  const s = api.getAppState(), z = (s.zoom && s.zoom.value) || 1;
  const ids = Object.keys(s.selectedElementIds || {});
  const next = ids.length === 1 ? api.getSceneElements().find((e) => e.id === ids[0]) : null;
  const size = STICKY.size;
  // Never on top of another card or shape: the nearest free spot in view, any direction. Big
  // shapes (a retro's lanes, a meeting's sections) don't count: a sticky goes on them, and the
  // next one in a lane goes under the last, as on a real retro board.
  const big = size * size * 2;
  const lane = next && api.getSceneElements().find((e) => !e.containerId && e.type !== "text" && e.id !== next.id && e.width * e.height >= big
    && next.x >= e.x && next.y >= e.y && next.x + next.width <= e.x + e.width && next.y + next.height <= e.y + e.height);
  const at = !next ? { x: -s.scrollX + s.width / 2 / z - size / 2, y: -s.scrollY + s.height / 2 / z - size / 2 }
    : lane ? { x: next.x, y: next.y + next.height + STICKY.gap }
    : { x: next.x + next.width + STICKY.gap, y: next.y };
  const taken = api.getSceneElements().filter((e) => !e.containerId && e.type !== "text" && e.width * e.height < big).map((e) => getCommonBounds([e]));
  const free = (x, y) => !taken.some(([x1, y1, x2, y2]) => x < x2 + 8 && x + size > x1 - 8 && y < y2 + 8 && y + size > y1 - 8);
  const vx = -s.scrollX, vy = -s.scrollY, vw = s.width / z, vh = s.height / z;
  const inView = (x, y) => x >= vx && y >= vy && x + size <= vx + vw && y + size <= vy + vh;
  if (!free(at.x, at.y) || !inView(at.x, at.y)) {
    const step = (size + STICKY.gap) / 2;
    let best = null;
    for (let i = -8; i <= 8; i++) for (let j = -8; j <= 8; j++) {
      const x = at.x + i * step, y = at.y + j * step;
      if (!free(x, y)) continue;
      // In view first; then nearest, to the right before the left, below before above.
      const d = (inView(x, y) ? 0 : 1000) + i * i + j * j + (i < 0 ? 0.5 : 0) + (j < 0 ? 0.3 : j > 0 ? 0.1 : 0);
      if (!best || d < best.d) best = { x, y, d };
    }
    if (best) { at.x = best.x; at.y = best.y; }
  }
  // A lane grows to hold a sticky put under its last card, as a retro board fills up.
  let grown = null;
  if (lane && at.y + size + STICKY.gap > lane.y + lane.height && at.x >= lane.x && at.x + size <= lane.x + lane.width) {
    grown = { ...lane, height: at.y + size + STICKY.gap - lane.y, version: lane.version + 1, versionNonce: Math.floor(Math.random() * 2 ** 31), updated: Date.now() };
  }
  const [card, ...rest] = convertToExcalidrawElements([{
    type: "rectangle", x: at.x, y: at.y, width: size, height: size, backgroundColor: STICKY.color, fillStyle: "solid",
    strokeColor: "#e6c84f", roundness: { type: 3 }, label: { text: " ", fontSize: 20, verticalAlign: "top", textAlign: "left", strokeColor: "#2a1d10" },
    customData: { pintoSticky: true },
  }], { regenerateIds: true });
  // Its words in ink; only the card's edge is yellow.
  for (const e of rest) if (e.type === "text") e.strokeColor = "#2a1d10";
  const before = api.getSceneElementsIncludingDeleted().map((e) => (grown && e.id === grown.id ? grown : e));
  api.updateScene({ elements: [...before, card, ...rest], appState: { selectedElementIds: { [card.id]: true } }, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
  api.setActiveTool({ type: "selection" });
  // Typing starts in it, as Return does on a selected shape, once the engine has it (a timer, not
  // an animation frame: frames don't come while the window is hidden).
  setTimeout(() => {
    const placed = api.getSceneElements().find((e) => e.id === card.id);
    if (engine && placed && typeof engine.startTextEditing === "function") {
      engine.startTextEditing({ sceneX: placed.x + placed.width / 2, sceneY: placed.y + placed.height / 2, container: placed });
    }
  }, 30);
  return card.id;
}

/** What the page tells the app: the tool, what's selected, and the style the controls show. */
export function stateOf(api, app) {
  const s = api.getAppState();
  const ids = s.selectedElementIds || {};
  const selected = Object.keys(ids).length ? api.getSceneElements().filter((e) => ids[e.id]) : [];
  const first = selected[0];
  const pick = (key, current) => (first && first[key] !== undefined ? first[key] : s[current]);
  const history = app && app.history;
  // Where the selection is on screen, in the page's points: the app floats its style bar above it.
  let bounds = null;
  if (selected.length) {
    const [x1, y1, x2, y2] = getCommonBounds(selected);
    const a = sceneCoordsToViewportCoords({ sceneX: x1, sceneY: y1 }, s), b = sceneCoordsToViewportCoords({ sceneX: x2, sceneY: y2 }, s);
    bounds = { x: Math.round(a.x), y: Math.round(a.y), width: Math.round(b.x - a.x), height: Math.round(b.y - a.y) };
  }
  // What's drawn near the selection, so the style bar can float where it covers none of it:
  // shapes as boxes, arrows and lines as the points they run through (their boxes are mostly air).
  const nearby = [];
  if (bounds) {
    const reach = 260, z = (s.zoom && s.zoom.value) || 1;
    const view = (x, y) => { const p = sceneCoordsToViewportCoords({ sceneX: x, sceneY: y }, s); return [Math.round(p.x), Math.round(p.y)]; };
    const near = (x1, y1, x2, y2) => x2 >= bounds.x - reach && x1 <= bounds.x + bounds.width + reach && y2 >= bounds.y - reach && y1 <= bounds.y + bounds.height + reach;
    for (const e of api.getSceneElements()) {
      if (nearby.length >= 80) break;
      if (ids[e.id] || (e.containerId && ids[e.containerId])) continue;
      if ((e.type === "arrow" || e.type === "line" || e.type === "freedraw") && Array.isArray(e.points)) {
        const step = Math.max(1, Math.ceil(e.points.length / 24));
        const pts = e.points.filter((_, i) => i % step === 0 || i === e.points.length - 1).map(([px, py]) => view(e.x + px, e.y + py));
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
        if (near(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys))) nearby.push({ line: pts.flat() });
      } else {
        const [x1, y1, x2, y2] = getCommonBounds([e]);
        const p = view(x1, y1), q = view(x2, y2);
        if (near(p[0], p[1], q[0], q[1])) nearby.push({ box: [p[0], p[1], Math.round((x2 - x1) * z), Math.round((y2 - y1) * z)] });
      }
    }
  }
  return {
    tool: s.activeTool && s.activeTool.type,
    selection: selected.map((e) => e.type),
    bounds,
    nearby,
    // Moving, resizing or drawing: the style bar stays out of the way.
    busy: !!(s.selectedElementsAreBeingDragged || s.isResizing || s.isRotating || s.newElement || s.multiElement),
    editing: !!s.editingTextElement,
    style: {
      strokeColor: pick("strokeColor", "currentItemStrokeColor"),
      backgroundColor: pick("backgroundColor", "currentItemBackgroundColor"),
      fillStyle: pick("fillStyle", "currentItemFillStyle"),
      strokeWidth: pick("strokeWidth", "currentItemStrokeWidth"),
      strokeStyle: pick("strokeStyle", "currentItemStrokeStyle"),
      opacity: pick("opacity", "currentItemOpacity"),
      fontFamily: pick("fontFamily", "currentItemFontFamily"),
      fontSize: pick("fontSize", "currentItemFontSize"),
      startArrowhead: first && first.type === "arrow" ? first.startArrowhead : s.currentItemStartArrowhead,
      endArrowhead: first && first.type === "arrow" ? first.endArrowhead : s.currentItemEndArrowhead,
      arrowType: first && first.type === "arrow" ? (first.elbowed ? "elbow" : first.roundness ? "round" : "sharp") : s.currentItemArrowType,
      // Shapes with different fills: the fill swatch says so, rather than showing the first one's.
      mixedFill: new Set(selected.filter((e) => ["rectangle", "diamond", "ellipse"].includes(e.type)).map((e) => e.backgroundColor)).size > 1,
    },
    zoom: s.zoom && s.zoom.value,
    background: s.viewBackgroundColor,
    // Nothing drawn yet: the app offers its templates (CanvasStart).
    empty: api.getSceneElements().length === 0,
    canUndo: history ? !history.isUndoStackEmpty : false,
    canRedo: history ? !history.isRedoStackEmpty : false,
  };
}

/** Joins the page to the app: commands in, state out. Returns a function that stops it. */
function bridge(api) {
  let app = null;
  // The engine's action manager: reached through an action of our own, which sees the app on
  // every key and never matches one.
  api.registerAction({ name: "pintoBridge", label: "", trackEvent: false, perform: () => false,
    keyTest: (e, s, els, a) => { app = a; engine = a; return false; } });
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Unidentified", bubbles: true }));
  const run = (name, value = null) => {
    const action = app && app.actionManager.actions[name];
    if (action) app.actionManager.executeAction(action, "api", value);
  };
  let last = null;
  const report = () => {
    const state = stateOf(api, app);
    const json = JSON.stringify(state);
    if (json === last) return;
    last = json;
    try { window.webkit.messageHandlers.amberCanvas.postMessage(state); } catch (e) {}
  };
  const command = (c) => {
    if (!c || typeof c !== "object") return false;
    switch (c.op) {
      case "tool":
        if (!TOOLS.has(c.tool)) return false;
        api.setActiveTool({ type: c.tool });
        break;
      case "style": {
        const f = STYLE[c.key];
        if (!f) return false;
        const [name, value] = f(c.value);
        run(name, value);
        break;
      }
      case "action":
        if (!ACTIONS[c.name]) return false;
        run(ACTIONS[c.name]);
        break;
      case "pan": {
        const s = api.getAppState(), z = (s.zoom && s.zoom.value) || 1;
        // At once: the next move's pan reads the scroll this one set.
        flushSync(() => api.updateScene({ appState: { scrollX: s.scrollX + (+c.dx || 0) / z, scrollY: s.scrollY + (+c.dy || 0) / z }, captureUpdate: CaptureUpdateAction.NEVER }));
        break;
      }
      case "insert": {
        // A template (or any skeleton elements): added in one step you can undo, then shown whole.
        if (!Array.isArray(c.elements) || !c.elements.length) return false;
        // Labels are measured in the hand-drawn font, so it's loaded first (measured in the
        // fallback, "Do the thing" was cut to "o the thin"). Shown whole at once, no animation:
        // an animated fit needs animation frames and left the template at the edge.
        const elements = c.elements;
        document.fonts.load("20px Excalifont").catch(() => {}).then(() => {
          const made = convertToExcalidrawElements(elements, { regenerateIds: true });
          api.updateScene({ elements: [...api.getSceneElementsIncludingDeleted(), ...made], captureUpdate: CaptureUpdateAction.IMMEDIATELY });
          api.setActiveTool({ type: "selection" });
          api.scrollToContent(made, { fitToViewport: true, viewportZoomFactor: 0.8, animate: false });
        });
        break;
      }
      case "sticky":
        addSticky(api);
        break;
      case "image": {
        // A picture the app made ready (CanvasImage): kept in the scene's files, placed where it
        // was dropped or in the middle of the view, at most 60% of the view across, selected.
        if (typeof c.dataURL !== "string" || !c.width || !c.height) return false;
        const s = api.getAppState(), z = (s.zoom && s.zoom.value) || 1;
        const fit = Math.min(1, (s.width * 0.6 / z) / c.width, (s.height * 0.6 / z) / c.height, 900 / Math.max(c.width, c.height));
        const w = c.width * fit, h = c.height * fit;
        let at = typeof c.x === "number"
          ? viewportCoordsToSceneCoords({ clientX: c.x, clientY: c.y }, s)
          : { x: -s.scrollX + s.width / 2 / z, y: -s.scrollY + s.height / 2 / z };
        // Pasted (no point given) onto a drawing: beside it instead, then brought into view
        // (whiteboard council, round 2, 11: a screenshot landed on top of the flowchart).
        let moved = false;
        if (typeof c.x !== "number") {
          const drawn = api.getSceneElements().filter((e) => !e.containerId);
          const over = (x, y) => drawn.some((e) => { const [x1, y1, x2, y2] = getCommonBounds([e]); return x - w / 2 < x2 && x + w / 2 > x1 && y - h / 2 < y2 && y + h / 2 > y1; });
          if (drawn.length && over(at.x, at.y)) {
            const [, y1, x2, y2] = getCommonBounds(drawn);
            at = { x: x2 + 60 + w / 2, y: Math.max(y1 + h / 2, Math.min(at.y, y2 - h / 2)) };
            moved = true;
          }
        }
        const fileId = "pinto-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        api.addFiles([{ id: fileId, dataURL: c.dataURL, mimeType: c.mimeType || "image/jpeg", created: Date.now() }]);
        const [made] = convertToExcalidrawElements([{ type: "image", fileId, x: at.x - w / 2, y: at.y - h / 2, width: w, height: h }], { regenerateIds: true });
        api.updateScene({ elements: [...api.getSceneElementsIncludingDeleted(), made], appState: { selectedElementIds: { [made.id]: true } }, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
        api.setActiveTool({ type: "selection" });
        if (moved) {
          // In view at the zoom you had, at once.
          const v = api.getAppState();
          flushSync(() => api.updateScene({ appState: { scrollX: -(made.x + w / 2) + v.width / 2 / z, scrollY: -(made.y + h / 2) + v.height / 2 / z }, captureUpdate: CaptureUpdateAction.NEVER }));
        }
        break;
      }
      case "background":
        if (typeof c.color !== "string") return false;
        run("changeViewBackgroundColor", { viewBackgroundColor: c.color });
        break;
      default:
        return false;
    }
    report();
    return true;
  };
  // Coalesced to one report a frame (a timer: a page off screen gets no animation frames): a pan or a drag changes the state on every move.
  let queued = false;
  const soon = () => { if (!queued) { queued = true; setTimeout(() => { queued = false; report(); }, 16); } };
  const off = api.onChange(soon);
  const offScroll = api.onScrollChange(soon);
  const offHistory = app && app.history.onHistoryChangedEmitter.on(report);
  // The engine's own dialogs never open; the app's menus keep their keys (⌘K, ⌘F).
  const keys = (e) => {
    if (blockedKey(e)) { e.stopImmediatePropagation(); return; }
    // S: a sticky note, as in FigJam (the engine's S opens a panel that isn't shown here).
    const typing = e.target && (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" || e.target.isContentEditable);
    if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && (e.key || "").toLowerCase() === "s" && !api.getAppState().editingTextElement) {
      e.preventDefault(); e.stopImmediatePropagation();
      addSticky(api);
    }
  };
  // No right-click menu from the engine or the web view: the app shows its own (Mac).
  const menu = (e) => { e.preventDefault(); e.stopImmediatePropagation(); };
  window.addEventListener("keydown", keys, true);
  window.addEventListener("contextmenu", menu, true);
  Object.defineProperty(amber, "_canvasCommand", { value: command, configurable: true });
  report();
  return { command, state: () => stateOf(api, app), stop: () => {
    off(); offScroll(); offHistory && offHistory(); window.removeEventListener("keydown", keys, true); window.removeEventListener("contextmenu", menu, true);
  } };
}

/** Pinto's ink for new strokes (the canvas is drawn light and inverted in dark mode). */
const PINTO_DEFAULTS = { currentItemStrokeColor: "#2a1d10", currentItemFontFamily: 5 };

/**
 * In dark mode the drawing is drawn light and turned dark by a filter (invert, then hue-rotate
 * 180°): the colour to draw so that, through the filter, it shows as `hex`. The selection's outline
 * and handles use it, so they show in the app's accent rather than a dim brown (whiteboard council,
 * round 2, 07-selected-box-dark).
 */
export function throughDarkFilter(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return null;
  const n = parseInt(m[1], 16), want = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  // CSS hue-rotate(180deg) as a matrix, and its inverse (Cramer's rule).
  const H = [[-0.574, 1.43, 0.144], [0.426, 0.43, 0.144], [0.426, 1.43, -0.856]];
  const [[a, b, c], [d, e, f], [g, h, i]] = H;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  const inv = [[e * i - f * h, c * h - b * i, b * f - c * e], [f * g - d * i, a * i - c * g, c * d - a * f], [d * h - e * g, b * g - a * h, a * e - b * d]].map((r) => r.map((v) => v / det));
  const before = inv.map((r) => r[0] * want[0] + r[1] * want[1] + r[2] * want[2]);
  const out = before.map((v) => Math.round(Math.min(255, Math.max(0, 255 - v))));
  // A bright accent can be past what the filter can make: the nearest it can, channel by channel.
  const shown = (x) => H.map((r) => Math.min(255, Math.max(0, r[0] * (255 - x[0]) + r[1] * (255 - x[1]) + r[2] * (255 - x[2]))));
  const off = (x) => Math.max(...shown(x).map((v, k) => Math.abs(v - want[k])));
  for (let pass = 0; pass < 4; pass++) {
    for (let k = 0; k < 3; k++) {
      let best = out[k], err = off(out);
      for (let v = 0; v < 256; v++) { out[k] = v; const e = off(out); if (e < err) { err = e; best = v; } }
      out[k] = best;
    }
  }
  return "#" + out.map((v) => v.toString(16).padStart(2, "0")).join("");
}

const prefersDark = () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

function Canvas({ initial }) {
  const [api, setApi] = useState(null);
  const [theme, setTheme] = useState(prefersDark() ? "dark" : "light");
  useEffect(() => {
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--amber-accent");
    const shown = throughDarkFilter(accent);
    if (shown) document.documentElement.style.setProperty("--pinto-selection-dark", shown);
  }, [theme]);

  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setTheme(m.matches ? "dark" : "light");
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!api) return;
    let timer = null;
    // What this page last saved or received, by fingerprint.
    let lastSent = fingerprint(initial.stored);
    let base = initial.elements;
    let lastVersion = null;

    const save = () => {
      timer = null;
      const scene = sceneFrom(api.getSceneElementsIncludingDeleted(), api.getAppState(), api.getFiles());
      const print = fingerprint(scene);
      if (print === lastSent) return;
      lastSent = print;
      base = scene.elements;
      // Refused (over the size limit): said in the app, and tried again on the next change.
      Promise.resolve(amber.store.set("scene", scene)).catch((e) => {
        lastSent = null;
        try { window.webkit.messageHandlers.amberCanvas.postMessage({ error: "Not saved: " + String((e && e.message) || e) }); } catch (_) {}
      });
    };
    const flush = () => { if (timer) { clearTimeout(timer); save(); } };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(save, SAVE_DELAY); };

    const off = api.onChange((elements, appState, files) => {
      // Pans and zooms change nothing that's kept.
      const v = changeKey(elements, appState, files);
      if (v === lastVersion) return;
      if (lastVersion !== null) schedule();
      lastVersion = v;
    });

    // From elsewhere: another device or an AI.
    const unlisten = amber.onChange((note, data) => {
      const scene = data && data.values && data.values.scene;
      // Its own save, back as the store's reply and the app's push: nothing to merge.
      if (!scene || fingerprint(scene) === lastSent) return;
      const { elements: remote } = normalize(scene.elements);
      // What they changed: their elements that differ from what was last in step (versions move
      // when bindings are repaired, so what each looks like is compared).
      // Arrows and the words on them are re-laid whenever bindings are repaired, so for them
      // where they run doesn't count, only what they join and how they look.
      const relaid = (e) => e.type === "arrow" || e.type === "line" || !!e.containerId;
      const look = (e) => `${relaid(e) ? `${e.startBinding && e.startBinding.elementId}>${e.endBinding && e.endBinding.elementId}` : `${Math.round(e.x)},${Math.round(e.y)},${Math.round(e.width)},${Math.round(e.height)}`},${e.text || ""},${e.strokeColor},${e.backgroundColor},${e.isDeleted}`;
      const before = new Map((base || []).map((e) => [e.id, look(e)]));
      const theirs = new Set(remote.filter((e) => !e.isDeleted && before.get(e.id) !== look(e)).map((e) => e.id));
      const merged = merge(api.getSceneElementsIncludingDeleted(), remote, base);
      const files = Object.values(scene.files || {});
      if (files.length) api.addFiles(files);
      const bg = scene.appState && scene.appState.viewBackgroundColor;
      api.updateScene({ elements: merged, ...(bg ? { appState: { viewBackgroundColor: bg } } : {}), captureUpdate: CaptureUpdateAction.NEVER });
      base = remote;
      lastSent = fingerprint(scene);
      if (scene.elements.some((e) => e && typeof e.seed !== "number")) remeasure();
      showChanged(api.getSceneElements().filter((e) => theirs.has(e.id) || (e.containerId && theirs.has(e.containerId))));
      // Ours had changes theirs didn't (or theirs was in the short form): saved back merged.
      if (!same(merged.map((e) => [e.id, e.version]), remote.map((e) => [e.id, e.version]))) schedule();
    });

    // What came from elsewhere (an AI, another device), for the app to outline: where it is in
    // the view, brought into view first if none of it was.
    const showChanged = (changed) => {
      if (!changed.length) return;
      const where = () => {
        const s = api.getAppState();
        const [x1, y1, x2, y2] = getCommonBounds(changed);
        const a = sceneCoordsToViewportCoords({ sceneX: x1, sceneY: y1 }, s), b = sceneCoordsToViewportCoords({ sceneX: x2, sceneY: y2 }, s);
        return { x: a.x, y: a.y, width: b.x - a.x, height: b.y - a.y, view: s };
      };
      let r = where();
      if (r.x < 0 || r.y < 0 || r.x + r.width > r.view.width || r.y + r.height > r.view.height) {
        // Centred at the zoom you had, at once (the engine's own scroll lands a frame later): the
        // whole board when it fits, so what the AI drew is seen next to what it joins.
        const s = r.view, z = (s.zoom && s.zoom.value) || 1;
        const whole = getCommonBounds(api.getSceneElements());
        const fits = (whole[2] - whole[0]) * z <= s.width - 48 && (whole[3] - whole[1]) * z <= s.height - 48;
        let scrollX, scrollY;
        if (fits) {
          scrollX = -(whole[0] + whole[2]) / 2 + s.width / 2 / z;
          scrollY = -(whole[1] + whole[3]) / 2 + s.height / 2 / z;
        } else {
          // Only as far as it takes to bring the change in, with a margin, so what it joins
          // stays in sight (round 2: centring on it pushed the rest of the board off).
          const [x1, y1, x2, y2] = getCommonBounds(changed), m = 40 / z, W = s.width / z, H = s.height / z;
          const along = (lo, hi, scroll, size) => {
            const a = lo + scroll, b = hi + scroll;
            if (hi - lo > size - 2 * m) return -(lo + hi) / 2 + size / 2;
            if (a < m) return scroll + (m - a);
            if (b > size - m) return scroll - (b - (size - m));
            return scroll;
          };
          scrollX = along(x1, x2, s.scrollX, W);
          scrollY = along(y1, y2, s.scrollY, H);
        }
        flushSync(() => api.updateScene({ appState: { scrollX, scrollY }, captureUpdate: CaptureUpdateAction.NEVER }));
        r = where();
      }
      try { window.webkit.messageHandlers.amberCanvas.postMessage({ remote: { x: r.x, y: r.y, width: r.width, height: r.height, count: changed.length } }); } catch (_) {}
      // While it's shown (the app decides how long), the outline follows the view as you pan,
      // zoom or resize the window (whiteboard council, round 2, 15: it came loose after 8 s).
      outlined = { changed, until: Date.now() + 120000, where };
    };
    let outlined = null;
    const follow = api.onChange(() => {
      if (!outlined) return;
      if (Date.now() > outlined.until) { outlined = null; return; }
      const r = outlined.where();
      try { window.webkit.messageHandlers.amberCanvas.postMessage({ remote: { x: r.x, y: r.y, width: r.width, height: r.height, count: outlined.changed.length, follow: true } }); } catch (_) {}
    });

    // Text an AI wrote was measured before the hand-drawn font arrived: measured again once it has.
    const remeasure = () => document.fonts.load("20px Excalifont").then(() => {
      const els = restoreElements(api.getSceneElementsIncludingDeleted(), null, { refreshDimensions: true, repairBindings: true });
      api.updateScene({ elements: els, captureUpdate: CaptureUpdateAction.NEVER });
    }).catch(() => {});
    if (initial.converted) remeasure().then(schedule);
    const hidden = () => { if (document.visibilityState === "hidden") flush(); };
    addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hidden);
    Object.defineProperty(amber, "_flush", { value: flush, configurable: true });
    const controls = bridge(api);
    // For the app's tests: the scene as it would be saved now, and what the app's controls see.
    // The view stays centred when the board's width or height changes (the sidebar folding away,
    // Full Screen): the engine keeps its left edge, which left a drawing in the left half.
    const area = document.getElementById("canvas");
    let last = area ? { w: area.clientWidth, h: area.clientHeight } : null;
    const keepCentre = new ResizeObserver(() => {
      const w = area.clientWidth, h = area.clientHeight;
      if (!last || !w || !h) { last = { w, h }; return; }
      const dw = w - last.w, dh = h - last.h;
      last = { w, h };
      if (!dw && !dh) return;
      const s = api.getAppState(), z = (s.zoom && s.zoom.value) || 1;
      api.updateScene({ appState: { scrollX: s.scrollX + dw / 2 / z, scrollY: s.scrollY + dh / 2 / z }, captureUpdate: CaptureUpdateAction.NEVER });
    });
    if (area) keepCentre.observe(area);
    Object.defineProperty(amber, "_throughDarkFilter", { value: throughDarkFilter, configurable: true });
    Object.defineProperty(amber, "_canvasExport", { value: (format, selected) => exportScene(api, format, selected), configurable: true });
    Object.defineProperty(amber, "_canvas", { value: { api, scene: () => sceneFrom(api.getSceneElementsIncludingDeleted(), api.getAppState(), api.getFiles()), save, command: controls.command, state: controls.state }, configurable: true });
    return () => { follow(); keepCentre.disconnect(); controls.stop(); off(); unlisten(); removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", hidden); flush(); };
  }, [api]);

  const setRef = useCallback((a) => setApi(a), []);

  return (
    <Excalidraw
      excalidrawAPI={setRef}
      initialData={{ elements: initial.elements, appState: { ...initial.appState, ...PINTO_DEFAULTS, theme }, files: initial.files, scrollToContent: true }}
      theme={theme}
      aiEnabled={false}
      autoFocus
      handleKeyboardGlobally
      detectScroll={false}
      // None of the engine's own controls: the app's toolbar, menus and style popover stand in.
      UIOptions={{
        canvasActions: { loadScene: false, saveToActiveFile: false, export: false, saveAsImage: false, toggleTheme: null, changeViewBackgroundColor: false, clearCanvas: false },
        tools: { image: false },
      }}
      renderTopRightUI={() => null}
      validateEmbeddable={false}
    >
      {/* An empty main menu: no items (its button is hidden with the rest in pinto.css). */}
      <MainMenu />
    </Excalidraw>
  );
}

function start() {
  const stored = (amber && amber.data && amber.data.values && amber.data.values.scene) || emptyScene();
  const { elements, converted } = normalize(stored.elements);
  const restored = restore({ ...stored, elements }, null, null);
  const initial = { stored, elements: restored.elements, appState: { viewBackgroundColor: restored.appState.viewBackgroundColor, gridModeEnabled: restored.appState.gridModeEnabled }, files: restored.files, converted };
  const el = document.getElementById("canvas");
  // Drawn before the page's load event: the app checks something showed.
  flushSync(() => createRoot(el).render(<Canvas initial={initial} />));
}

window.EXCALIDRAW_ASSET_PATH = "amber-lib:///canvas/";
start();
