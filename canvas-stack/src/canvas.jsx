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
  getCommonBounds, sceneCoordsToViewportCoords,
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
};
/** The app's menu commands, by the engine's action names. */
const ACTIONS = {
  undo: "undo", redo: "redo", bringToFront: "bringToFront", sendToBack: "sendToBack", bringForward: "bringForward",
  sendBackward: "sendBackward", duplicate: "duplicateSelection", delete: "deleteSelectedElements", selectAll: "selectAll",
  zoomIn: "zoomIn", zoomOut: "zoomOut", resetZoom: "resetZoom", zoomToFit: "zoomToFit", clear: "clearCanvas",
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
  return {
    tool: s.activeTool && s.activeTool.type,
    selection: selected.map((e) => e.type),
    bounds,
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
    keyTest: (e, s, els, a) => { app = a; return false; } });
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
        const made = convertToExcalidrawElements(c.elements, { regenerateIds: true });
        api.updateScene({ elements: [...api.getSceneElementsIncludingDeleted(), ...made], captureUpdate: CaptureUpdateAction.IMMEDIATELY });
        api.setActiveTool({ type: "selection" });
        api.scrollToContent(made, { fitToViewport: true, viewportZoomFactor: 0.8, animate: true });
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
  const keys = (e) => { if (blockedKey(e)) e.stopImmediatePropagation(); };
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

const prefersDark = () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

function Canvas({ initial }) {
  const [api, setApi] = useState(null);
  const [theme, setTheme] = useState(prefersDark() ? "dark" : "light");

  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setTheme(m.matches ? "dark" : "light");
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!api) return;
    let timer = null;
    let lastSent = JSON.stringify(initial.stored);
    let base = initial.elements;
    let lastVersion = null;

    const save = () => {
      timer = null;
      const scene = sceneFrom(api.getSceneElementsIncludingDeleted(), api.getAppState(), api.getFiles());
      const json = JSON.stringify(scene);
      if (json === lastSent) return;
      lastSent = json;
      base = scene.elements;
      amber.store.set("scene", scene);
    };
    const flush = () => { if (timer) { clearTimeout(timer); save(); } };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(save, SAVE_DELAY); };

    const off = api.onChange((elements, appState, files) => {
      // Pans and zooms change nothing that's kept.
      const v = JSON.stringify([elements.map((e) => [e.id, e.version]), appState.viewBackgroundColor, appState.gridModeEnabled, Object.keys(files || {}).length]);
      if (v === lastVersion) return;
      if (lastVersion !== null) schedule();
      lastVersion = v;
    });

    // From elsewhere: another device or an AI.
    const unlisten = amber.onChange((note, data) => {
      const scene = data && data.values && data.values.scene;
      if (!scene || JSON.stringify(scene) === lastSent) return;
      const { elements: remote } = normalize(scene.elements);
      const merged = merge(api.getSceneElementsIncludingDeleted(), remote, base);
      const files = Object.values(scene.files || {});
      if (files.length) api.addFiles(files);
      const bg = scene.appState && scene.appState.viewBackgroundColor;
      api.updateScene({ elements: merged, ...(bg ? { appState: { viewBackgroundColor: bg } } : {}), captureUpdate: CaptureUpdateAction.NEVER });
      base = remote;
      lastSent = JSON.stringify(scene);
      if (scene.elements.some((e) => e && typeof e.seed !== "number")) remeasure();
      // Ours had changes theirs didn't (or theirs was in the short form): saved back merged.
      if (!same(merged.map((e) => [e.id, e.version]), remote.map((e) => [e.id, e.version]))) schedule();
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
    Object.defineProperty(amber, "_canvas", { value: { api, scene: () => sceneFrom(api.getSceneElementsIncludingDeleted(), api.getAppState(), api.getFiles()), save, command: controls.command, state: controls.state }, configurable: true });
    return () => { controls.stop(); off(); unlisten(); removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", hidden); flush(); };
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
