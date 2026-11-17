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
import { CARD, cardAt, cardNotes, expandSeeds, isCard, newCards, noteOf, refreshCards, selectedCard } from "./cards.js";
import { changedSince, hash, joinToBoard, newPictures, normalizeShared, peersLayer, reconcile, restamp, stamp, fitTo, followTo, viewOf } from "./shared.js";
import { commentsLayer } from "./comments.js";
import { votesLayer } from "./votes.js";
import { mapLayer } from "./minimap.js";

const amber = window.amber;
const SAVE_DELAY = 300;
// A shared board's changes go out this often while you draw (shared.js): the others see a drag move.
const SHARED_DELAY = 250;
// This page's load: the app sets a shared board up again when the page is new (CanvasController).
const LOAD = Math.random().toString(36).slice(2, 10);
// What the page does with a shared board (set by the Canvas, called by the bridge's commands).
const sharedHooks = { set: null, remote: null, outline: null, find: null, peers: null, pointer: null, refuse: null, follow: null, laser: null, trails: null };
// Deleted elements are kept a while so another device's copy can't bring them back, then dropped.
const KEEP_DELETED_MS = 7 * 24 * 3600 * 1000;

// A pencil line keeps the pointer's moves. The engine adds one point to a pencil line per frame it
// draws (the first move since the frame before), so a frame drawn late loses the moves in between:
// fewer points, farther apart, and the pressure it works out from the gaps pinches the line where
// it went fast and leaves blobs at its ends (Emil, 17 November 2026). The moves are kept here as
// they come, with the ones WebKit merged (getCoalescedEvents), one a frame of the display in the
// pointer's own time: the points the engine keeps when every frame is on time. The engine takes
// them at its next frame and at the pen's lift (build.mjs). window.__pintoPen.off turns it off.
const pencil = { tool: false, kept: false, down: false, id: null, moves: [], t0: 0, last: -1, frame: 1000 / 60 };
window.__pintoPen = {
  off: false,
  take() {
    if (!pencil.kept) return null;
    const moves = pencil.moves;
    pencil.moves = [];
    return moves;
  },
};
addEventListener("pointerdown", (e) => {
  pencil.kept = pencil.down = pencil.tool && e.isPrimary && !window.__pintoPen.off;
  pencil.id = e.pointerId;
  pencil.moves = [];
  pencil.t0 = e.timeStamp;
  pencil.last = -1;
  pencil.frame = 1000 / ((amber && amber._frameRate) || 60);
}, { capture: true, passive: true });
addEventListener("pointermove", (e) => {
  if (!pencil.down || e.pointerId !== pencil.id) return;
  const merged = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
  for (const m of merged.length ? merged : [e]) {
    const frame = Math.floor((m.timeStamp - pencil.t0) / pencil.frame);
    if (frame <= pencil.last) continue;
    pencil.last = frame;
    pencil.moves.push({ clientX: m.clientX, clientY: m.clientY, pressure: m.pressure });
  }
}, { capture: true, passive: true });
const lifted = (e) => { if (e.pointerId === pencil.id) pencil.down = false; };
addEventListener("pointerup", lifted, { capture: true, passive: true });
addEventListener("pointercancel", lifted, { capture: true, passive: true });

const emptyScene = () => ({ type: "excalidraw", version: 2, source: "https://pintonotes.com", elements: [], appState: {}, files: {} });

/**
 * An arrow or line written with a size and no points runs along that size. The engine reads a
 * width or height of 0 as missing and uses 100, so a straight-down arrow (width 0) came out
 * slanting (note cards' pictures, 14 November 2026).
 */
function straight(e) {
  if ((e.type !== "arrow" && e.type !== "line") || Array.isArray(e.points)) return e;
  const w = typeof e.width === "number" ? e.width : null, h = typeof e.height === "number" ? e.height : null;
  if (w === null && h === null) return e;
  if (!(w || h)) return e;
  return { ...e, points: [[0, 0], [w || 0, h || 0]] };
}

/** Full elements as stored; the short form an AI may write is converted. */
export function normalize(elements) {
  const list = Array.isArray(elements) ? elements.filter((e) => e && typeof e === "object" && typeof e.type === "string") : [];
  const full = [], skeletons = [];
  for (const e of list) (typeof e.seed === "number" && typeof e.version === "number" ? full : skeletons).push(straight(e));
  // An arrow written without an id gets one from what it says, so it can be joined below.
  const named = skeletons.map((e, i) => (e.id || e.type !== "arrow" ? e : { ...e, id: `ai-${hash(JSON.stringify(e))}-${i}` }));
  const converted = named.length ? convertToExcalidrawElements(named, { regenerateIds: false }) : [];
  // Joined to the shapes the board already has, too (shared.js joinToBoard).
  const joined = joinToBoard(converted, full, named);
  return { elements: restoreElements([...joined.full, ...joined.made], null, { repairBindings: true, refreshDimensions: false }), converted: skeletons.length > 0 };
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

/** Changes that are kept, not pans and zooms: cheap enough for every frame of a stroke. The
 *  engine's scene changes its nonce with every change to an element; before the bridge has reached
 *  the engine, every element's version is added up. */
function changeKey(elements, appState, files) {
  const nonce = sceneNonce();
  let v = nonce;
  if (nonce === null) { v = 0; for (const e of elements) v += e.version; }
  return `${elements.length}|${v}|${appState.viewBackgroundColor}|${appState.gridModeEnabled}|${files ? Object.keys(files).length : 0}`;
}

/** A press in the middle of something: drawing, moving, resizing, rotating or boxing elements. */
const pressing = (s) => !!(s.selectedElementsAreBeingDragged || s.isResizing || s.isRotating || s.newElement || s.multiElement || s.selectionElement);

/** The engine's scene's nonce (it changes with every change to an element), or null before the bridge has the engine. */
function sceneNonce() {
  const n = engine && engine.scene && typeof engine.scene.getSceneNonce === "function" ? engine.scene.getSceneNonce() : undefined;
  return n === undefined ? null : n;
}

// Each element's JSON, kept until it changes (the engine changes its version and nonce on every
// edit): a save after a stroke on a board of 2000 elements writes one element anew, not 2000. The
// drawing goes to the app as text, which crosses whole, where objects were copied one by one into
// the app and back (16 November 2026: 3 MB a save, tens of milliseconds on both sides).
const elementText = new Map(), fileText = new Map();
export function sceneText(scene) {
  const seen = new Set();
  const parts = scene.elements.map((e) => {
    seen.add(e.id);
    const c = elementText.get(e.id);
    if (c && c.e === e && c.version === e.version && c.nonce === e.versionNonce && c.deleted === e.isDeleted) return c.text;
    const text = JSON.stringify(e);
    elementText.set(e.id, { e, version: e.version, nonce: e.versionNonce, deleted: e.isDeleted, text });
    return text;
  });
  if (elementText.size > seen.size) for (const id of elementText.keys()) if (!seen.has(id)) elementText.delete(id);
  const files = Object.entries(scene.files || {}).map(([id, f]) => {
    const c = fileText.get(id);
    if (c && c.f === f && c.url === f.dataURL && c.at === f.lastRetrieved) return c.text;
    const text = JSON.stringify(id) + ":" + JSON.stringify(f);
    fileText.set(id, { f, url: f.dataURL, at: f.lastRetrieved, text });
    return text;
  });
  const { elements: _e, files: _f, ...rest } = scene;
  const head = JSON.stringify(rest);
  return head.slice(0, -1) + (head.length > 2 ? "," : "") + '"elements":[' + parts.join(",") + '],"files":{' + files.join(",") + "}}";
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
  // A picture's crop handles (round 6: "pasted screenshots almost always need trimming").
  crop: "cropEditor",
};
const TOOLS = new Set(["selection", "hand", "rectangle", "diamond", "ellipse", "arrow", "line", "freedraw", "text", "eraser", "frame", "laser"]);
/** What changes the drawing, refused on a board you can only view; and the actions that only look. */
const EDITS = new Set(["style", "insert", "sticky", "grow", "cropDone", "presentOrder", "libraryInsert", "template", "addCards", "image", "background", "cards", "commentHere", "restoreVersion"]);
const LOOKS = new Set(["zoomIn", "zoomOut", "resetZoom", "zoomToFit"]);

/** Keys that would open the engine's own dialogs and panels, which aren't shown here. */
export function blockedKey(e) {
  const cmd = e.metaKey || e.ctrlKey, k = (e.key || "").toLowerCase();
  if (e.key === "?") return true;                                   // help
  if (cmd && (k === "/" || k === "f" || k === "k" || (e.shiftKey && (k === "p" || k === "e")))) return true; // palette, search, link, export
  if (e.altKey && e.code === "Slash") return true;                  // stats
  if (!cmd && !e.altKey && k === "i") return true;                  // image (F and K pick the frame and the laser, as in Excalidraw)
  return false;
}

/**
 * Excalidraw's hint under its toolbar (0.18.1, HintViewer's getHints and its English words), for
 * the line the app shows under its tool palette (CanvasHint). Word for word, with its keys as a Mac
 * names them (getShortcutKey); its line breaks are spaces, as the page shows them.
 */
const HINTS = {
  canvasPanning: "To move canvas, hold mouse wheel or spacebar while dragging, or use the hand tool",
  linearElement: "Click to start multiple points, drag for single line",
  arrowTool: "Click to start multiple points, drag for single line. Press {{arrowShortcut}} again to change arrow type.",
  freeDraw: "Click and drag, release when you're finished",
  text: "Tip: you can also add text by double-clicking anywhere with the selection tool",
  text_selected: "Double-click or press ENTER to edit text",
  text_editing: "Press Escape or CtrlOrCmd+ENTER to finish editing",
  linearElementMulti: "Click on last point or press Escape or Enter to finish",
  lockAngle: "You can constrain angle by holding SHIFT",
  resize: "You can constrain proportions by holding SHIFT while resizing,\nhold ALT to resize from the center",
  resizeImage: "You can resize freely by holding SHIFT,\nhold ALT to resize from the center",
  rotate: "You can constrain angles by holding SHIFT while rotating",
  lineEditor_info: "Hold CtrlOrCmd and Double-click or press CtrlOrCmd + Enter to edit points",
  lineEditor_pointSelected: "Press Delete to remove point(s),\nCtrlOrCmd+D to duplicate, or drag to move",
  lineEditor_nothingSelected: "Select a point to edit (hold SHIFT to select multiple),\nor hold Alt and click to add new points",
  bindTextToElement: "Press enter to add text",
  createFlowchart: "Hold CtrlOrCmd and Arrow key to create a flowchart",
  deepBoxSelect: "Hold CtrlOrCmd to deep select, and to prevent dragging",
  eraserRevert: "Hold Alt to revert the elements marked for deletion",
  disableSnapping: "Hold CtrlOrCmd to disable snapping",
  enterCropEditor: "Double click the image or press ENTER to crop the image",
  leaveCropEditor: "Click outside the image or press ENTER or ESCAPE to finish cropping",
};

/** Excalidraw's getShortcutKey on a Mac: Cmd for CtrlOrCmd, Option for the first Alt. */
export function macKeys(text) {
  return text.replace(/\bAlt\b/i, "Alt").replace(/\bShift\b/i, "Shift").replace(/\b(Enter|Return)\b/i, "Enter")
    .replace(/\bCtrlOrCmd\b/gi, "Cmd").replace(/\bAlt\b/i, "Option");
}

const linear = (e) => !!e && (e.type === "arrow" || e.type === "line");

/**
 * The hint Excalidraw shows for this state (getHints), or null. `selected`: the selected elements.
 * Excalidraw's own panels (search, the sidebar) and tools (embeds, placing a picture) aren't on
 * this board, so their hints aren't either.
 */
export function hintOf(s, selected) {
  const t = s.activeTool || {};
  if (t.type === "eraser") return HINTS.eraserRevert;
  if (t.type === "arrow" || t.type === "line") {
    if (s.multiElement != null) return HINTS.linearElementMulti;
    if (t.type === "arrow") return HINTS.arrowTool.replace("{{arrowShortcut}}", macKeys("A"));
    return HINTS.linearElement;
  }
  if (t.type === "freedraw") return HINTS.freeDraw;
  if (t.type === "text") return HINTS.text;
  const one = selected.length === 1 ? selected[0] : null;
  if (s.isResizing && s.lastPointerDownWith === "mouse" && one) {
    if (linear(one) && one.points.length === 2) return HINTS.lockAngle;
    return one.type === "image" ? HINTS.resizeImage : HINTS.resize;
  }
  if (s.isRotating && s.lastPointerDownWith === "mouse") return HINTS.rotate;
  if (one && one.type === "text") return HINTS.text_selected;
  if (s.editingTextElement) return HINTS.text_editing;
  if (s.croppingElementId) return HINTS.leaveCropEditor;
  if (one && one.type === "image") return HINTS.enterCropEditor;
  if (t.type === "selection") {
    if (s.selectionElement && !selected.length && !s.editingTextElement && !s.editingLinearElement) return HINTS.deepBoxSelect;
    if (s.gridModeEnabled && s.selectedElementsAreBeingDragged) return HINTS.disableSnapping;
    if (!selected.length) return HINTS.canvasPanning;
    if (one && linear(one)) {
      if (s.editingLinearElement) return s.editingLinearElement.selectedPointsIndices ? HINTS.lineEditor_pointSelected : HINTS.lineEditor_nothingSelected;
      return HINTS.lineEditor_info;
    }
    // A box, a diamond or an ellipse: words go in it, and it starts a flowchart.
    if (one && !s.newElement && !s.selectedElementsAreBeingDragged && ["rectangle", "diamond", "ellipse"].includes(one.type)) {
      return [HINTS.bindTextToElement, HINTS.createFlowchart];
    }
  }
  return null;
}

/** The line HintViewer shows for a hint: one, or several joined as sentences. */
export function hintLine(h) {
  if (!h) return null;
  const line = Array.isArray(h) ? h.map((x) => macKeys(x).replace(/\. ?$/, "")).join(". ") : macKeys(h);
  return line.replace(/\s*\n\s*/g, " ");
}

const base64 = (text) => btoa(unescape(encodeURIComponent(text)));

const marked = (e, k) => !!(e.customData && e.customData[k]);
const words = (e) => String(e.originalText ?? e.text ?? "").replace(/\s+/g, " ").trim();

/**
 * What a picture of the board shows. A template's how-to line is left out: it's help for you, not
 * part of the drawing (whiteboard council, round 2, 14-exported-board). The band it stood in goes
 * with it: what's under it moves up by the line's height and the gap above it (round 3: about
 * 75 pt of blank paper between the title and the drawing). `name`: the board's own title text is
 * left out too when it says this name (a shared board's page, whose heading says it; round 3: the
 * title twice), unless nothing else is drawn.
 */
export function pictured(elements, name) {
  const said = name == null ? "" : String(name).replace(/\s+/g, " ").trim();
  let out = elements.filter((e) => !marked(e, "pintoHint"));
  if (said) {
    const untitled = out.filter((e) => !(marked(e, "pintoTitle") && words(e) === said));
    if (untitled.length) out = untitled;
  }
  const hints = elements.filter((e) => marked(e, "pintoHint")).sort((a, b) => b.y - a.y);
  for (const h of hints) out = closeBand(out, h);
  return out;
}

/** `elements` with the band `hint` stood in closed: what's under it moved up to where the space
 *  above the line began. Left as drawn when something stands beside the line (it isn't a band
 *  then), or when nothing is above or below it. */
function closeBand(elements, hint) {
  const [, top, , bottom] = getCommonBounds([hint]);
  let above = -Infinity, below = false;
  const under = new Set();
  for (const e of elements) {
    const [, y1, , y2] = getCommonBounds([e]);
    if (y2 <= top) above = Math.max(above, y2);
    else if (y1 >= bottom) { below = true; under.add(e.id); }
    else return elements;
  }
  if (above === -Infinity || !below) return elements;
  const shift = bottom - above;
  return elements.map((e) => (under.has(e.id) ? { ...e, y: e.y - shift } : e));
}

/**
 * A picture's arrow labels with the gap the canvas draws round them: a patch of paper behind
 * each, over its line (whiteboard council, rounds 4 to 7: in exports "No" sat on its line, as the
 * engine's export left the gap out).
 */
export function gapLabels(elements, paper) {
  const lines = new Set(elements.filter((e) => e.type === "arrow" || e.type === "line").map((e) => e.id));
  const labels = new Map();
  for (const e of elements) if (e.type === "text" && lines.has(e.containerId) && (e.text || "").trim()) labels.set(e.containerId, e);
  if (!labels.size) return elements;
  // The engine draws a label with its line, so a patch over the line would cover the words: in
  // the picture each label stands on its own, over its patch, over its line.
  const out = [];
  for (const e of elements) {
    if (e.type === "text" && labels.get(e.containerId) === e) continue;
    const label = labels.get(e.id);
    if (!label) { out.push(e); continue; }
    out.push({ ...e, boundElements: (e.boundElements || []).filter((b) => b.id !== label.id) });
    const pad = Math.max(3, label.fontSize * 0.25);
    const [patch] = convertToExcalidrawElements([{ type: "rectangle", x: label.x - pad, y: label.y - pad / 2, width: label.width + 2 * pad, height: label.height + pad,
      strokeColor: "transparent", backgroundColor: paper, fillStyle: "solid", strokeWidth: 1, roughness: 0, roundness: null, opacity: 100 }]);
    out.push({ ...patch, id: `${label.id}-gap`, angle: label.angle || 0, groupIds: label.groupIds || [], frameId: label.frameId || null });
    out.push({ ...label, containerId: null });
  }
  return out;
}

/**
 * The board (or only what's selected) as a file, base64: a PNG at 2x, an SVG that carries its
 * scene (Excalidraw opens it again), or the .excalidraw file itself. Always light, as drawn
 * (`light` is kept for the share page's caller; it's the same either way). `page`: made for a
 * shared board's page, whose heading is this name: its picture leaves out the board's title when
 * it says the same, and its scene leaves out the how-to line as a picture does. Export's file
 * keeps everything.
 */
export async function exportScene(api, format, selected, light, page) {
  const all = api.getSceneElements();
  const s = api.getAppState();
  const ids = s.selectedElementIds || {};
  const picked = selected ? all.filter((e) => ids[e.id]) : [];
  const chosen = picked.length ? picked : all;
  const forPage = typeof page === "string";
  let elements = format !== "excalidraw" ? pictured(chosen, forPage ? page : null) : forPage ? pictured(chosen, null) : chosen;
  if (!elements.length) return null;
  const files = api.getFiles();
  // Pictures only: an SVG carries its scene for Excalidraw to open again, without patches.
  if (format === "png") elements = gapLabels(elements, s.viewBackgroundColor || "#ffffff");
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

/**
 * The whole board in view when it fits: at the zoom you have, or zoomed out as far as `minZoom`
 * (never in). Whiteboard council, round 3 (11, 12, 13, 15): after a paste, an AI's change or a
 * bigger window, the view showed only the new thing, the person's own drawing off screen.
 * `onlyIfCut`: leave a board that's already all in view where it is. True when it framed it.
 */
// The zoom the app chose when it zoomed out to fit, and the zoom you had before: while the view
// is still at the app's zoom, it may zoom back in towards yours once there's room (round 4: 12,
// 13 and 15 stayed at 64% with room to spare). Any zoom of your own ends it.
let autoZoom = null;
/** The room kept round a framed board, and the least it keeps in a narrow view. */
export const MARGIN = 48, NARROW_MARGIN = 16;

export function frameBoard(api, { minZoom, onlyIfCut = false, size, floor = false } = {}) {
  const els = api.getSceneElements();
  if (!els.length) return false;
  // The view's size: the engine's, or the one just measured when the engine hasn't caught up.
  const s = { ...api.getAppState(), ...(size || {}) }, z = (s.zoom && s.zoom.value) || 1;
  if (autoZoom && Math.abs(autoZoom.set - z) > 1e-3) autoZoom = null;
  const cap = autoZoom ? autoZoom.from : z;
  const [x1, y1, x2, y2] = getCommonBounds(els);
  const inView = (x1 + s.scrollX) * z >= 0 && (y1 + s.scrollY) * z >= 0 && (x2 + s.scrollX) * z <= s.width && (y2 + s.scrollY) * z <= s.height;
  const fitWith = (m) => Math.min((s.width - 2 * m) / Math.max(1, x2 - x1), (s.height - 2 * m) / Math.max(1, y2 - y1));
  // 48 pt round the drawing; a narrow view gives as little as 16 when that keeps the board whole
  // at `minZoom` (round 12, 15-narrow-760: 44% with 48 pt a side, 52% with 16, and the board
  // stayed cut off at 76%).
  let fit = fitWith(MARGIN);
  if (minZoom !== undefined && fit < minZoom) fit = Math.max(fit, fitWith(NARROW_MARGIN));
  let nz = Math.min(cap, fit);
  // `floor`: a board that was whole and no longer fits even at `minZoom` goes to `minZoom`,
  // centred, so as much of it shows as can (rather than staying at the zoom it had, cut off on
  // both sides).
  if (floor && minZoom !== undefined && nz < minZoom) nz = Math.min(z, minZoom);
  if (onlyIfCut && inView && !(autoZoom && nz > z + 1e-3)) return false;
  if (nz < Math.min(z, minZoom === undefined ? z : minZoom)) return false;
  autoZoom = nz < cap - 1e-3 ? { from: cap, set: nz } : null;
  const scrollX = -(x1 + x2) / 2 + s.width / 2 / nz, scrollY = -(y1 + y2) / 2 + s.height / 2 / nz;
  flushSync(() => api.updateScene({ appState: { scrollX, scrollY, ...(nz !== z ? { zoom: { value: nz } } : {}) }, captureUpdate: CaptureUpdateAction.NEVER }));
  return true;
}

/**
 * An arrow or line as it's drawn, in the view's points: the line through its points, and each
 * arrowhead's two barbs as the engine draws them (25 long at 20° for an arrow, 15 at 25° for the
 * rest, at most half the last segment). Each with how far its ink reaches either side (`r`). For
 * the AI's name tag to keep clear of (round 10, 16: its box was a hairline beside the head).
 */
export function drawnLine(e, s) {
  const z = (s.zoom && s.zoom.value) || 1;
  const pts = (e.points && e.points.length ? e.points : [[0, 0], [e.width, e.height]]).map(([px, py]) => [e.x + px, e.y + py]);
  const view = ([x, y]) => { const p = sceneCoordsToViewportCoords({ sceneX: x, sceneY: y }, s); return [p.x, p.y]; };
  // The stroke's half width and the hand-drawn wobble (about a point and a half a side).
  const r = ((e.strokeWidth || 1) / 2 + 1.5 * (e.roughness || 0) + 1) * z;
  const out = [{ r, p: pts.map(view).flat() }];
  const head = (kind, tip, from) => {
    if (!kind || !tip || !from) return;
    const dx = tip[0] - from[0], dy = tip[1] - from[1], len = Math.hypot(dx, dy);
    if (!len) return;
    const size = kind === "arrow" ? 25 : kind === "diamond" || kind === "diamond_outline" ? 12 : String(kind).startsWith("crowfoot") ? 20 : 15;
    const angle = (kind === "bar" ? 90 : kind === "arrow" ? 20 : 25) * Math.PI / 180;
    const l = Math.min(size, len * (kind === "diamond" || kind === "diamond_outline" ? 0.25 : 0.5));
    const ux = dx / len, uy = dy / len, bx = tip[0] - ux * l, by = tip[1] - uy * l;
    for (const a of [angle, -angle]) {
      const c = Math.cos(a), sn = Math.sin(a);
      const barb = [tip[0] + (bx - tip[0]) * c - (by - tip[1]) * sn, tip[1] + (bx - tip[0]) * sn + (by - tip[1]) * c];
      out.push({ r, p: [...view(tip), ...view(barb)] });
    }
  };
  if (pts.length > 1) {
    head(e.endArrowhead, pts[pts.length - 1], pts[pts.length - 2]);
    head(e.startArrowhead, pts[0], pts[1]);
  }
  return out;
}

/**
 * A note's card, selected and in view ("On boards" at the foot of a note opens the board here):
 * the first card for the note, its whole group selected, centred at a zoom you can read it at
 * (at least 100%, unless the card is bigger than the view). Null when no card names the note.
 */
export function focusCard(api, note) {
  const want = String(note).toLowerCase();
  const els = api.getSceneElements();
  const frame = els.find((e) => isCard(e) && noteOf(e).toLowerCase() === want);
  if (!frame) return null;
  const group = (frame.groupIds || [])[0];
  const parts = group ? els.filter((e) => (e.groupIds || [])[0] === group) : [frame];
  const s = api.getAppState(), z0 = (s.zoom && s.zoom.value) || 1, m = 48;
  const [x1, y1, x2, y2] = getCommonBounds(parts);
  const fit = Math.min((s.width - 2 * m) / Math.max(1, x2 - x1), (s.height - 2 * m) / Math.max(1, y2 - y1));
  const z = Math.max(0.1, Math.min(Math.max(z0, 1), fit));
  autoZoom = null;
  const scrollX = -(x1 + x2) / 2 + s.width / 2 / z, scrollY = -(y1 + y2) / 2 + s.height / 2 / z;
  api.setActiveTool({ type: "selection" });
  flushSync(() => api.updateScene({ appState: { scrollX, scrollY, zoom: { value: z },
    selectedElementIds: Object.fromEntries(parts.map((e) => [e.id, true])), selectedGroupIds: group ? { [group]: true } : {} },
    captureUpdate: CaptureUpdateAction.NEVER }));
  return frame;
}

export const STICKY = { size: 180, color: "#ffec99", gap: 24 };
/** Room above a selection, in points of the view, for the engine's rotate handle (it stands about
 *  20 above the selection's box) and a little paper over it. */
export const HANDLE_ROOM = 40;
/** The engine itself, once the bridge has reached it (for what its API doesn't offer). */
let engine = null;
/** The board's comment pins and the Comment tool (comments.js), once the bridge has made them. */
let comments = null;
/** Voting's dots and totals (votes.js). */
let votes = null;
// The board's map, while it's on (minimap.js).
let map = null;

/**
 * A sticky note (whiteboard council, round 2: retro and kanban boards with no sticky tool): a
 * square yellow card whose words wrap inside it and move with it, next to what's selected (so
 * pressing S again makes a row) or in the middle of the view. It's selected, not typed into:
 * Excalidraw 0.18 has no sticky tool to place one with a click, and typing at once took the next
 * tool keys as words (real-window check, 17 Nov). Return or a double-click types in it.
 */
export function addSticky(api) {
  const s = api.getAppState(), z = (s.zoom && s.zoom.value) || 1;
  const ids = Object.keys(s.selectedElementIds || {});
  const next = ids.length === 1 ? api.getSceneElements().find((e) => e.id === ids[0]) : null;
  // Never on top of another card or shape: the nearest free spot in view, any direction. Big
  // shapes (a retro's lanes, a meeting's sections) don't count: a sticky goes on them, and the
  // next one in a lane goes under the last, as on a real retro board.
  const big = STICKY.size * STICKY.size * 2;
  const lane = next && api.getSceneElements().find((e) => !e.containerId && e.type !== "text" && e.id !== next.id && e.width * e.height >= big
    && next.x >= e.x && next.y >= e.y && next.x + next.width <= e.x + e.width && next.y + next.height <= e.y + e.height);
  // Under a card in a lane it takes that card's size, edge and lettering, in yellow: one board,
  // not two people's (whiteboard council, round 3, 17). Elsewhere a square note.
  const words = next && api.getSceneElements().find((e) => e.containerId === next.id && e.type === "text");
  const w = lane ? next.width : STICKY.size, h = lane ? Math.max(76, next.height) : STICKY.size;
  const gap = lane ? 16 : STICKY.gap;
  const edge = lane ? next.strokeColor : "#e6c84f";
  // In a lane, the lane's card colour (round 4: always yellow, even under a green card).
  const fill = lane && next.backgroundColor && next.backgroundColor !== "transparent" ? next.backgroundColor : STICKY.color;
  const fontSize = lane && words ? words.fontSize : 20;
  const at = !next ? { x: -s.scrollX + s.width / 2 / z - w / 2, y: -s.scrollY + s.height / 2 / z - h / 2 }
    : lane ? { x: next.x, y: next.y + next.height + gap }
    : { x: next.x + next.width + gap, y: next.y };
  // Words on the board (a lane's name, a title) count too: a sticky landed on "Went well".
  const taken = api.getSceneElements().filter((e) => !e.containerId && e.width * e.height < big).map((e) => getCommonBounds([e]));
  const free = (x, y) => !taken.some(([x1, y1, x2, y2]) => x < x2 + 8 && x + w > x1 - 8 && y < y2 + 8 && y + h > y1 - 8);
  const vx = -s.scrollX, vy = -s.scrollY, vw = s.width / z, vh = s.height / z;
  const inView = (x, y) => x >= vx && y >= vy && x + w <= vx + vw && y + h <= vy + vh;
  // In a lane, under the card it stays, and the view follows it (round 4: with no room in view it
  // went to the next lane, or onto the lane's name); elsewhere the nearest free spot in view.
  const keep = lane && free(at.x, at.y);
  if (!keep && (!free(at.x, at.y) || !inView(at.x, at.y))) {
    const sx = (w + gap) / 2, sy = (h + gap) / 2;
    let best = null;
    for (let i = -8; i <= 8; i++) for (let j = -8; j <= 8; j++) {
      const x = at.x + i * sx, y = at.y + j * sy;
      if (!free(x, y)) continue;
      // In view first; then nearest, to the right before the left, below before above.
      const d = (inView(x, y) ? 0 : 1000) + i * i + j * j + (i < 0 ? 0.5 : 0) + (j < 0 ? 0.3 : j > 0 ? 0.1 : 0);
      if (!best || d < best.d) best = { x, y, d };
    }
    if (best) { at.x = best.x; at.y = best.y; }
  }
  // A lane grows to hold a sticky put under its last card, as a retro board fills up.
  let grown = null;
  if (lane && at.y + h + gap > lane.y + lane.height && at.x >= lane.x && at.x + w <= lane.x + lane.width) {
    grown = { ...lane, height: at.y + h + gap - lane.y, version: lane.version + 1, versionNonce: Math.floor(Math.random() * 2 ** 31), updated: Date.now() };
  }
  const [card, ...rest] = convertToExcalidrawElements([{
    type: "rectangle", x: at.x, y: at.y, width: w, height: h, backgroundColor: fill, fillStyle: "solid",
    strokeColor: edge, roundness: { type: 3 }, label: { text: " ", fontSize, verticalAlign: "middle", textAlign: "center", strokeColor: "#2a1d10" },
    customData: { pintoSticky: true },
  }], { regenerateIds: true });
  // Its words in ink.
  for (const e of rest) if (e.type === "text") e.strokeColor = "#2a1d10";
  const before = api.getSceneElementsIncludingDeleted().map((e) => (grown && e.id === grown.id ? grown : e));
  api.updateScene({ elements: [...before, card, ...rest], appState: { selectedElementIds: { [card.id]: true } }, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
  api.setActiveTool({ type: "selection" });
  if (keep && !inView(at.x, at.y)) {
    const m = 24 / z;
    const dy = at.y + h + m > vy + vh ? (vy + vh) - (at.y + h + m) : 0;
    flushSync(() => api.updateScene({ appState: { scrollY: s.scrollY + dy }, captureUpdate: CaptureUpdateAction.NEVER }));
  }
  return card.id;
}

/**
 * A mind map's next branch (whiteboard council, round 6: Tab, as in FigJam and Excalidraw mind
 * maps): a node to the right of `node`, under the branches it has there already, joined to it by
 * an arrow drawn as its other branches are (a mind map's have no heads), in its colour; selected
 * and typed into at once. One step Undo takes back. Returns the new node's id.
 */
export const BRANCH = { gap: 80, step: 24, width: 170, height: 64 };
export function addBranch(api, node) {
  const all = api.getSceneElements();
  const byId = new Map(all.map((e) => [e.id, e]));
  const joins = all.filter((a) => a.type === "arrow" && ((a.startBinding && a.startBinding.elementId === node.id) || (a.endBinding && a.endBinding.elementId === node.id)));
  const other = (a) => byId.get(a.startBinding && a.startBinding.elementId === node.id ? a.endBinding && a.endBinding.elementId : a.startBinding && a.startBinding.elementId);
  // Its branches to the right, the newest last; their arrows set the look of the new one.
  const right = joins.map((a) => ({ a, n: other(a) })).filter((b) => b.n && !b.n.isDeleted && b.n.x >= node.x + node.width);
  const like = (right[right.length - 1] || {}).a || joins[0] || null;
  // A box like the branch it grows from (a mind map's middle is an ellipse: its branches are boxes).
  const boxy = node.type === "rectangle";
  const w = right.length ? right[0].n.width : boxy ? node.width : BRANCH.width;
  const h = right.length ? right[0].n.height : boxy ? node.height : BRANCH.height;
  const words = all.find((e) => e.containerId === node.id && e.type === "text");
  const fontSize = right.length ? (all.find((e) => e.containerId === right[0].n.id && e.type === "text") || {}).fontSize || 20 : words ? words.fontSize : 20;
  const x = right.length ? Math.min(...right.map((b) => b.n.x)) : node.x + node.width + BRANCH.gap;
  let y = right.length ? Math.max(...right.map((b) => b.n.y + b.n.height)) + BRANCH.step : node.y + node.height / 2 - h / 2;
  // Never on top of something: further down until it's clear.
  const taken = all.filter((e) => !e.containerId && e.type !== "arrow" && e.type !== "line").map((e) => getCommonBounds([e]));
  const clear = (yy) => !taken.some(([x1, y1, x2, y2]) => x < x2 + 8 && x + w > x1 - 8 && yy < y2 + 8 && yy + h > y1 - 8);
  for (let i = 0; i < 40 && !clear(y); i++) y += (h + BRANCH.step) / 2;
  const fill = node.backgroundColor && node.backgroundColor !== "transparent" ? node.backgroundColor : "transparent";
  // No words yet: typing starts in it as a double-click does, so leaving it empty leaves no empty
  // words behind for Undo to bring back first.
  const [child] = convertToExcalidrawElements([{
    type: "rectangle", x, y, width: w, height: h, backgroundColor: fill, fillStyle: node.fillStyle || "solid",
    strokeColor: node.strokeColor, strokeWidth: node.strokeWidth, roughness: node.roughness, roundness: { type: 3 },
  }], { regenerateIds: true });
  // From the edge of the branch it grows from, at its middle, to the new one's left edge.
  const g = 4;
  const sx = node.x + node.width + g, sy = node.y + node.height / 2, ex = x - g, ey = y + h / 2;
  const [arrow] = convertToExcalidrawElements([{
    type: "arrow", x: sx, y: sy, width: ex - sx, height: ey - sy, points: [[0, 0], [ex - sx, ey - sy]],
    strokeColor: like ? like.strokeColor : node.strokeColor, strokeWidth: like ? like.strokeWidth : node.strokeWidth,
    strokeStyle: like ? like.strokeStyle : "solid", roughness: like ? like.roughness : node.roughness,
    startArrowhead: like ? like.startArrowhead : null, endArrowhead: like ? like.endArrowhead : "arrow",
  }], { regenerateIds: true });
  const joined = {
    ...arrow, startBinding: { elementId: node.id, focus: 0, gap: g }, endBinding: { elementId: child.id, focus: 0, gap: g },
  };
  const bound = (e, more) => ({ ...e, boundElements: [...(e.boundElements || []), ...more], version: e.version + 1, versionNonce: Math.floor(Math.random() * 2 ** 31), updated: Date.now() });
  const before = api.getSceneElementsIncludingDeleted().map((e) => (e.id === node.id ? bound(e, [{ id: joined.id, type: "arrow" }]) : e));
  const made = bound(child, [{ id: joined.id, type: "arrow" }]);
  api.updateScene({ elements: [...before, made, joined], appState: { selectedElementIds: { [child.id]: true }, selectedGroupIds: {} }, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
  api.setActiveTool({ type: "selection" });
  branchInView(api, node, made);
  typeInto(api, child.id, { fontSize, color: (words && words.strokeColor) || node.strokeColor, family: words && words.fontFamily });
  return child.id;
}

/**
 * The view after Tab grows a branch (round 10, real-mindmap-second-tab: each Tab zoomed out, 90,
 * 75, 60%, and pushed the map to the right edge with empty board on the left). The parent and its
 * new branch in view already: nothing moves. Else, at the zoom you have, the whole map in the
 * middle if it fits; if it doesn't, zoomed out until it does, but for a Tab never below 75% (nor
 * below where you were); still too big, the view moves just far enough for the parent and the
 * new branch to show.
 */
export const BRANCH_VIEW = { minZoom: 0.75, margin: 40, fit: 48 };
export function branchInView(api, node, child) {
  const s = api.getAppState(), z = (s.zoom && s.zoom.value) || 1, W = s.width, H = s.height;
  const m = BRANCH_VIEW.margin, f = BRANCH_VIEW.fit;
  const [p1, q1, p2, q2] = getCommonBounds([node, child]);
  const shows = (sx, sy, zz) => (p1 + sx) * zz >= m && (q1 + sy) * zz >= m && (p2 + sx) * zz <= W - m && (q2 + sy) * zz <= H - m;
  if (shows(s.scrollX, s.scrollY, z)) return;
  const [x1, y1, x2, y2] = getCommonBounds(api.getSceneElements());
  const fits = (zz) => (x2 - x1) * zz <= W - 2 * f && (y2 - y1) * zz <= H - 2 * f;
  let nz = z;
  if (!fits(z)) {
    const fit = Math.min((W - 2 * f) / Math.max(1, x2 - x1), (H - 2 * f) / Math.max(1, y2 - y1));
    nz = Math.min(z, Math.max(fit, Math.min(z, BRANCH_VIEW.minZoom)));
  }
  let scrollX, scrollY;
  if (fits(nz)) {
    scrollX = W / 2 / nz - (x1 + x2) / 2;
    scrollY = H / 2 / nz - (y1 + y2) / 2;
  } else {
    // From where the middle of the view was, only as far as it takes; the new branch in the
    // middle when even the two of them don't fit.
    const along = (lo, hi, scroll, size, mid) => {
      const mm = m / nz;
      if (hi - lo > size - 2 * mm) return size / 2 - mid;
      if (lo + scroll < mm) return mm - lo;
      if (hi + scroll > size - mm) return size - mm - hi;
      return scroll;
    };
    const cx = W / 2 / z - s.scrollX, cy = H / 2 / z - s.scrollY;
    scrollX = along(p1, p2, W / 2 / nz - cx, W / nz, child.x + child.width / 2);
    scrollY = along(q1, q2, H / 2 / nz - cy, H / nz, child.y + child.height / 2);
  }
  // Zoomed out for it: more room later zooms back in towards where you were (frameBoard).
  if (nz < z - 1e-3) autoZoom = { from: autoZoom && Math.abs(autoZoom.set - z) < 1e-3 ? autoZoom.from : z, set: nz };
  flushSync(() => api.updateScene({ appState: { scrollX, scrollY, ...(nz !== z ? { zoom: { value: nz } } : {}) }, captureUpdate: CaptureUpdateAction.NEVER }));
}

// MARK: Templates that grow (round 15)

/**
 * The part of a template that has more of its kind, from what's selected (or being typed in): a
 * Kanban or Retro column (the column, its heading or a card in it; customData.pintoColumn) or a
 * Timeline step (its box or its dot; customData.pintoStep). { kind: "column" | "step", from }, or
 * null. Add Column and Add Step (Tab, the selection bar, the right-click menu) grow from it.
 */
export function growsFrom(api) {
  const s = api.getAppState();
  const ids = Object.keys(s.selectedElementIds || {}).filter((k) => s.selectedElementIds[k]);
  const els = api.getSceneElements();
  let one = ids.length === 1 ? els.find((e) => e.id === ids[0]) : null;
  const typing = s.editingTextElement;
  if (typing && typing.containerId) one = els.find((e) => e.id === typing.containerId) || one;
  if (!one || one.isDeleted || one.type === "arrow" || one.type === "line") return null;
  if (marked(one, "pintoStep")) return { kind: "step", from: one };
  if (marked(one, "pintoColumn")) return { kind: "column", from: one };
  if (isPerson(one, els)) return { kind: "report", from: one };
  const [x1, y1, x2, y2] = getCommonBounds([one]);
  const lane = els.find((e) => marked(e, "pintoColumn") && !e.isDeleted && x1 >= e.x - 1 && x2 <= e.x + e.width + 1 && y1 >= e.y - 1 && y2 <= e.y + e.height + 1);
  return lane ? { kind: "column", from: lane } : null;
}

/** One step's change: these elements changed or new, in one step Undo takes back. */
function commit(api, changed, selected) {
  const byId = new Map(changed.map((e) => [e.id, e]));
  const before = api.getSceneElementsIncludingDeleted();
  const kept = before.map((e) => byId.get(e.id) || e);
  const added = changed.filter((e) => !before.some((b) => b.id === e.id));
  api.updateScene({ elements: [...kept, ...added], appState: { selectedElementIds: { [selected]: true }, selectedGroupIds: {} }, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
  api.setActiveTool({ type: "selection" });
}
const bump = (e, more = {}) => ({ ...e, ...more, version: e.version + 1, versionNonce: Math.floor(Math.random() * 2 ** 31), updated: Date.now() });
const boundTo = (e, ...ids) => bump(e, { boundElements: [...(e.boundElements || []), ...ids.map((id) => ({ id, type: "arrow" }))] });

/**
 * Add Column: a column like the last one of the row the selected one is in, the same gap to its
 * right, with its heading ("New column") being typed over. No cards yet: S adds one. Returns the
 * new column's id.
 */
export const NEW_COLUMN = "New column";
export function addColumn(api, lane) {
  const all = api.getSceneElements();
  const row = all.filter((e) => marked(e, "pintoColumn") && Math.abs(e.y - lane.y) < 24).sort((a, b) => a.x - b.x);
  const last = row[row.length - 1] || lane, prev = row.length > 1 ? row[row.length - 2] : null;
  const x = last.x + (prev ? last.x - prev.x : last.width + 20);
  // Its heading: the words at the column's top, as the template wrote them.
  const head = all.find((e) => e.type === "text" && !e.containerId && e.x >= last.x && e.x < last.x + last.width && e.y >= last.y && e.y < last.y + 48);
  const [col] = convertToExcalidrawElements([{
    type: "rectangle", x, y: last.y, width: last.width, height: Math.min(...row.map((e) => e.height)), strokeColor: last.strokeColor,
    backgroundColor: last.backgroundColor, fillStyle: last.fillStyle, strokeWidth: last.strokeWidth, roughness: last.roughness,
    roundness: last.roundness, customData: { pintoColumn: true },
  }], { regenerateIds: true });
  const [title] = convertToExcalidrawElements([{
    type: "text", x: x + (head ? head.x - last.x : 16), y: head ? head.y : last.y + 14, text: NEW_COLUMN,
    fontSize: head ? head.fontSize : 20, fontFamily: head ? head.fontFamily : undefined, strokeColor: head ? head.strokeColor : "#2a1d10",
  }], { regenerateIds: true });
  const placed = [col, title].map((e) => (last.frameId ? { ...e, frameId: last.frameId } : e));
  commit(api, placed, title.id);
  branchInView(api, last, placed[0]);
  // Typing over its heading at once: the engine selects the words as it starts.
  if (engine && typeof engine.startTextEditing === "function") {
    const t = api.getSceneElements().find((e) => e.id === title.id);
    if (t) engine.startTextEditing({ sceneX: t.x + t.width / 2, sceneY: t.y + t.height / 2 });
  }
  return col.id;
}

/**
 * Add Step: the timeline's next step at its end, the same distance on: a dot on the line, joined
 * to the last by the line, and a box on the side the last one's isn't, joined to its dot, in the
 * colour of the one before on that side; typed into at once. Returns the new box's id.
 */
export function addStep(api, part) {
  const all = api.getSceneElements();
  const kind = (e) => e.customData && e.customData.pintoStep;
  const cx = (e) => e.x + e.width / 2;
  const steps = all.filter((e) => kind(e) === "step");
  const anyDot = kind(part) === "dot" ? part : all.filter((e) => kind(e) === "dot").sort((a, b) => Math.abs(cx(a) - cx(part)) - Math.abs(cx(b) - cx(part)))[0];
  if (!anyDot) return null;
  const dots = all.filter((e) => kind(e) === "dot" && Math.abs(e.y - anyDot.y) < 4).sort((a, b) => a.x - b.x);
  const last = dots[dots.length - 1], prev = dots.length > 1 ? dots[dots.length - 2] : null;
  const stepOf = (d) => d && steps.find((e) => Math.abs(cx(e) - cx(d)) < 4);
  const lastStep = stepOf(last), sameSide = stepOf(prev) || lastStep;
  if (!lastStep) return null;
  const x = last.x + (prev ? last.x - prev.x : 150), mid = x + last.width / 2;
  const lineY = last.y + last.height / 2;
  const above = lastStep.y > lineY;
  // On the other side from the last: where the one before it is, else its mirror across the line.
  const y = sameSide !== lastStep ? sameSide.y : 2 * lineY - lastStep.y - lastStep.height;
  const joins = (a, b) => all.find((e) => e.type === "arrow" && e.startBinding && e.endBinding
    && ((e.startBinding.elementId === a.id && e.endBinding.elementId === b.id) || (e.startBinding.elementId === b.id && e.endBinding.elementId === a.id)));
  const lineLike = (prev && joins(prev, last)) || null, stemLike = joins(lastStep, last) || lineLike;
  const look = (a) => ({
    strokeColor: a ? a.strokeColor : "#2a1d10", strokeWidth: a ? a.strokeWidth : 2, strokeStyle: a ? a.strokeStyle : "solid",
    roughness: a ? a.roughness : 1, startArrowhead: a ? a.startArrowhead : null, endArrowhead: a ? a.endArrowhead : null,
  });
  const [dot] = convertToExcalidrawElements([{
    type: last.type, x, y: last.y, width: last.width, height: last.height, strokeColor: last.strokeColor, backgroundColor: last.backgroundColor,
    fillStyle: last.fillStyle, strokeWidth: last.strokeWidth, roughness: last.roughness, customData: { pintoStep: "dot" },
  }], { regenerateIds: true });
  const [box] = convertToExcalidrawElements([{
    type: "rectangle", x: mid - lastStep.width / 2, y, width: lastStep.width, height: lastStep.height, strokeColor: lastStep.strokeColor,
    backgroundColor: sameSide.backgroundColor, fillStyle: lastStep.fillStyle, strokeWidth: lastStep.strokeWidth, roughness: lastStep.roughness,
    roundness: lastStep.roundness, customData: { pintoStep: "step" },
  }], { regenerateIds: true });
  const arrow = (a, b, sx, sy, ex, ey, like) => {
    const [e] = convertToExcalidrawElements([{ type: "arrow", x: sx, y: sy, width: ex - sx, height: ey - sy, points: [[0, 0], [ex - sx, ey - sy]], ...look(like) }], { regenerateIds: true });
    return { ...e, startBinding: { elementId: a.id, focus: 0, gap: 1 }, endBinding: { elementId: b.id, focus: 0, gap: 1 } };
  };
  // The line on from the last dot; the new box's stem, from the box above the line, else to it.
  const line = arrow(last, dot, last.x + last.width + 1, lineY, x - 1, lineY, lineLike);
  const stem = above ? arrow(box, dot, mid, y + box.height + 1, mid, last.y - 1, stemLike) : arrow(dot, box, mid, last.y + last.height + 1, mid, y - 1, stemLike);
  const placed = [boundTo(dot, line.id, stem.id), boundTo(box, stem.id), line, stem].map((e) => (last.frameId ? { ...e, frameId: last.frameId } : e));
  commit(api, [boundTo(last, line.id), ...placed], box.id);
  const made = api.getSceneElements().find((e) => e.id === box.id);
  branchInView(api, lastStep, made);
  const words = all.find((e) => e.containerId === lastStep.id && e.type === "text");
  typeInto(api, box.id, words ? { fontSize: words.fontSize, color: words.strokeColor, family: words.fontFamily } : null);
  return box.id;
}

/** Add Column or Add Step, from the selection: the new part's id, or null when it has none. */
export function grow(api) {
  const g = growsFrom(api);
  if (!g) return null;
  return g.kind === "step" ? addStep(api, g.from) : g.kind === "report" ? addReport(api, g.from) : addColumn(api, g.from);
}

/**
 * A person on an org chart: a box the template marked (customData.pintoPerson), or, on a chart made
 * before the mark (its how-to line says it's an org chart), a box joined by a line to a box above
 * or below it.
 */
const ORG_HINT = "Double-click a box to write a name.";
export function isPerson(e, all) {
  if (!e || e.isDeleted || e.type !== "rectangle" || e.containerId) return false;
  if (marked(e, "pintoPerson")) return true;
  if (marked(e, "pintoColumn") || marked(e, "pintoStep") || marked(e, "pintoSticky") || marked(e, "pintoNote")) return false;
  if (!all.some((t) => marked(t, "pintoHint") && String(t.text || "").startsWith(ORG_HINT))) return false;
  return joinedBoxes(e, all).some((o) => o.y >= e.y + e.height - 1 || o.y + o.height <= e.y + 1);
}

/** The boxes joined to `e` by a line or an arrow, with the line. */
function joinedBoxes(e, all, withLine = false) {
  const byId = new Map(all.map((x) => [x.id, x]));
  const out = [];
  for (const a of all) {
    if (a.isDeleted || (a.type !== "arrow" && a.type !== "line") || !a.startBinding || !a.endBinding) continue;
    const other = a.startBinding.elementId === e.id ? a.endBinding.elementId : a.endBinding.elementId === e.id ? a.startBinding.elementId : null;
    const o = other && byId.get(other);
    if (o && !o.isDeleted) out.push(withLine ? { box: o, line: a } : o);
  }
  return out;
}

/**
 * Add Report (round 16; FACTS: "Not built yet: org charts that grow"): a person on an org chart
 * gets a report under them, joined by a line as their other reports are, like those in size and
 * colour, beside the last of them (under the person when they have none). What's to the right
 * that's in the way moves right just as far as it must, with its lines, so the chart keeps its
 * layout; nothing above the person moves. Typed into at once; one step Undo takes back. Returns the
 * new box's id.
 */
export const REPORT = { below: 78, gap: 24, room: 40 };
export function addReport(api, person) {
  const all = api.getSceneElements();
  const byId = new Map(all.map((e) => [e.id, e]));
  const below = (o) => o.y >= person.y + person.height - 1;
  const reports = joinedBoxes(person, all, true).filter((j) => below(j.box)).sort((a, b) => a.box.x - b.box.x);
  const last = reports.length ? reports[reports.length - 1].box : null;
  const like = last || person;
  const w = like.width, h = like.height;
  const gap = reports.length >= 2 ? Math.max(REPORT.gap, reports[1].box.x - (reports[0].box.x + reports[0].box.width)) : REPORT.gap;
  let x = last ? last.x + last.width + gap : person.x + person.width / 2 - w / 2;
  let y = last ? last.y : person.y + person.height + REPORT.below;
  // The colour of the row it joins: its sisters', else whoever else is on that row, else the
  // person's. An open role (dashed, unfilled) is a placeholder, not a colour to copy.
  const filled = (e) => e.strokeStyle !== "dashed";
  const rowMate = reports.map((r) => r.box).reverse().find(filled) || all.find((e) => filled(e) && isPerson(e, all) && e.id !== person.id && Math.abs(e.y - y) < 6);
  const fill = (rowMate || person).backgroundColor;
  const lineLike = (reports[reports.length - 1] || {}).line || joinedBoxes(person, all, true).map((j) => j.line)[0] || null;

  // The person's own line upwards: nothing on it moves (their manager, and theirs).
  const above = new Set();
  for (let at = person, i = 0; at && i < 50; i++) {
    const up = joinedBoxes(at, all).find((o) => o.y + o.height <= at.y + 1 && !above.has(o.id));
    if (!up) break;
    above.add(up.id);
    at = up;
  }
  // Something where the new box goes: what's to its right (and level with the person or lower)
  // moves right, far enough to leave the gap.
  const box = (e) => getCommonBounds([e]);
  const free = (e) => !e.isDeleted && !e.containerId && e.type !== "arrow" && e.type !== "line" && !marked(e, "pintoTitle") && !marked(e, "pintoHint") && !isFrame(e);
  const hits = (e, xx) => { const [x1, y1, x2, y2] = box(e); return xx < x2 + gap && xx + w > x1 - gap && y < y2 + 8 && y + h > y1 - 8; };
  const movable = (e) => free(e) && e.id !== person.id && !above.has(e.id) && box(e)[3] > person.y && box(e)[0] + (box(e)[2] - box(e)[0]) / 2 > x + w / 2;
  let dx = 0;
  const blocking = all.filter((e) => free(e) && e.id !== person.id && hits(e, x));
  if (blocking.length && blocking.every(movable)) dx = Math.max(...blocking.map((e) => x + w + REPORT.room - box(e)[0]));
  else if (blocking.length) {
    // Something that doesn't move is there (to the left, or above): further down until it's clear.
    for (let i = 0; i < 40 && all.some((e) => free(e) && e.id !== person.id && hits(e, x)); i++) y += (h + REPORT.gap) / 2;
  }
  const moved = new Set(dx > 0 ? all.filter(movable).map((e) => e.id) : []);
  for (const e of all) if (e.containerId && moved.has(e.containerId)) moved.add(e.id);
  const changed = [];
  for (const e of all) {
    if (moved.has(e.id)) { changed.push(bump(e, { x: e.x + dx })); continue; }
    if ((e.type === "arrow" || e.type === "line") && dx > 0 && e.startBinding && e.endBinding) {
      const a = moved.has(e.startBinding.elementId), b = moved.has(e.endBinding.elementId);
      if (a && b) changed.push(bump(e, { x: e.x + dx }));
      else if (b) changed.push(bump(e, { points: e.points.map((p, i) => (i === e.points.length - 1 ? [p[0] + dx, p[1]] : p)), width: e.width + dx }));
      else if (a) changed.push(bump(e, { x: e.x + dx, points: e.points.map((p, i) => (i === 0 ? p : [p[0] - dx, p[1]])) }));
    }
  }
  const [made] = convertToExcalidrawElements([{
    type: "rectangle", x, y, width: w, height: h, strokeColor: like.strokeColor, backgroundColor: fill, fillStyle: (rowMate || person).fillStyle,
    strokeWidth: like.strokeWidth, roughness: like.roughness, roundness: like.roundness, customData: { pintoPerson: true },
  }], { regenerateIds: true });
  // From the middle of the person's foot to the middle of the new box's top, as the chart's lines run.
  const sx = person.x + person.width / 2, sy = person.y + person.height + 4, ex = x + w / 2, ey = y - 4;
  const [line] = convertToExcalidrawElements([{
    type: "arrow", x: sx, y: sy, width: ex - sx, height: ey - sy, points: [[0, 0], [ex - sx, ey - sy]],
    strokeColor: lineLike ? lineLike.strokeColor : person.strokeColor, strokeWidth: lineLike ? lineLike.strokeWidth : person.strokeWidth,
    strokeStyle: lineLike ? lineLike.strokeStyle : "solid", roughness: lineLike ? lineLike.roughness : person.roughness,
    startArrowhead: lineLike ? lineLike.startArrowhead : null, endArrowhead: lineLike ? lineLike.endArrowhead : null,
  }], { regenerateIds: true });
  const joined = { ...line, startBinding: { elementId: person.id, focus: 0, gap: 4 }, endBinding: { elementId: made.id, focus: 0, gap: 4 } };
  const inFrame = (e) => (person.frameId ? { ...e, frameId: person.frameId } : e);
  const owner = changed.find((e) => e.id === person.id) || byId.get(person.id);
  commit(api, [...changed.filter((e) => e.id !== person.id), boundTo(owner, joined.id), inFrame(boundTo(made, joined.id)), inFrame(joined)], made.id);
  const placed = api.getSceneElements().find((e) => e.id === made.id);
  branchInView(api, person, placed);
  const words = all.find((e) => e.containerId === like.id && e.type === "text");
  typeInto(api, made.id, words ? { fontSize: words.fontSize, color: words.strokeColor, family: words.fontFamily } : null);
  return made.id;
}

/** The node a Tab grows from: one shape selected (a box, an ellipse or a diamond), or the shape
 *  whose words are being typed. */
export function branchFrom(api) {
  const s = api.getAppState();
  const ids = Object.keys(s.selectedElementIds || {}).filter((k) => s.selectedElementIds[k]);
  const els = api.getSceneElements();
  const shape = (e) => !!e && !e.isDeleted && ["rectangle", "ellipse", "diamond"].includes(e.type) && !(e.customData && (e.customData.pintoNote || e.customData.pintoSticky));
  const one = ids.length === 1 ? els.find((e) => e.id === ids[0]) : null;
  if (shape(one)) return one;
  const typing = s.editingTextElement;
  if (typing && typing.containerId) { const c = els.find((e) => e.id === typing.containerId); if (shape(c)) return c; }
  return null;
}

/** Typing starts in a shape at once, as Return does on a selected one, before the next key is
 *  read. It used to start on a timer, 30 to 70 ms after Tab: keys typed in that time went to the
 *  engine instead (E picked the eraser, T the text tool, S added a sticky) and the branch showed
 *  only what came after ("spring" of "Next spring", seen on a Mac, 15 November 2026). The engine
 *  types into what it has selected and reads the font as it starts, so both are in its state
 *  first (flushSync). */
function typeInto(api, id, look = null) {
  const placed = api.getSceneElements().find((e) => e.id === id);
  if (!engine || !placed || typeof engine.startTextEditing !== "function") return;
  flushSync(() => api.updateScene({ appState: { selectedElementIds: { [id]: true }, selectedGroupIds: {} }, captureUpdate: CaptureUpdateAction.NEVER }));
  // The words in the size and ink of the branch it grew from; your own choice back after.
  if (look) wearLook(api, look);
  engine.startTextEditing({ sceneX: placed.x + placed.width / 2, sceneY: placed.y + placed.height / 2, container: placed });
}

/** Your own font settings while a branch is typed in its parent's: kept once for a run of Tabs and
 *  put back when the typing ends. Put back at once, the engine read them after, and the new
 *  branch's words came out bigger than its parent's (round 7, 26-mindmap-tab). Kept again for each
 *  branch of a run, the second kept the first's look as yours. */
let ownFont = null;
function wearLook(api, look) {
  const set = (a) => api.updateScene({ appState: a, captureUpdate: CaptureUpdateAction.NEVER });
  if (!ownFont) {
    const s = api.getAppState();
    ownFont = { currentItemFontSize: s.currentItemFontSize, currentItemStrokeColor: s.currentItemStrokeColor, currentItemFontFamily: s.currentItemFontFamily };
    let waited = 0;
    const back = () => {
      if (api.getAppState().editingTextElement && waited++ < 3000) { setTimeout(back, 100); return; }
      const own = ownFont;
      ownFont = null;
      if (own) set(own);
    };
    setTimeout(back, 100);
  }
  // At once (flushSync): the engine reads them as it starts.
  flushSync(() => set({ currentItemFontSize: look.fontSize, currentItemStrokeColor: look.color, ...(look.family ? { currentItemFontFamily: look.family } : {}) }));
}

// MARK: The library (CanvasLibrary in the app)

/**
 * The selection as one library item, as Excalidraw's "Add to library" takes it: what's selected,
 * the words inside selected shapes and on selected arrows, and the pictures its images show.
 * Joins to anything left behind are cut, so the item stands on its own wherever it goes. JSON
 * ({ elements, files }), or null with nothing selected.
 */
export function libraryPiece(api, also = []) {
  const ids = api.getAppState().selectedElementIds || {};
  const all = api.getSceneElements();
  if (!all.some((e) => ids[e.id])) return null;
  const chosen = new Set([...all.filter((e) => ids[e.id]).map((e) => e.id), ...also]);
  for (const e of all) if (e.containerId && chosen.has(e.containerId)) chosen.add(e.id);
  if (!chosen.size) return null;
  const elements = all.filter((e) => chosen.has(e.id)).map((e) => {
    const c = { ...e };
    if (c.startBinding && !chosen.has(c.startBinding.elementId)) c.startBinding = null;
    if (c.endBinding && !chosen.has(c.endBinding.elementId)) c.endBinding = null;
    if (Array.isArray(c.boundElements)) {
      const kept = c.boundElements.filter((b) => chosen.has(b.id));
      c.boundElements = kept.length ? kept : null;
    }
    if (c.frameId && !chosen.has(c.frameId)) c.frameId = null;
    return c;
  });
  const own = api.getFiles() || {}, files = {};
  for (const e of elements) if (e.fileId && own[e.fileId]) files[e.fileId] = own[e.fileId];
  return JSON.stringify({ elements, files });
}

/**
 * The whole board as one of your templates (the More menu's Save as Template): every element
 * drawn, the how-to line and the title included, and the pictures its images show. JSON
 * ({ elements, files }), or null on an empty board. `selection`: what's selected instead (the
 * right-click menu's Save as Template, round 15), a selected frame with all that's in it.
 */
export function boardPiece(api, selection = false) {
  if (selection) {
    const ids = api.getAppState().selectedElementIds || {};
    const frames = new Set(api.getSceneElements().filter((e) => ids[e.id] && isFrame(e)).map((e) => e.id));
    return libraryPiece(api, api.getSceneElements().filter((e) => e.frameId && frames.has(e.frameId)).map((e) => e.id));
  }
  const elements = api.getSceneElements().filter((e) => !e.isDeleted);
  if (!elements.length) return null;
  const own = api.getFiles() || {}, files = {};
  for (const e of elements) if (e.fileId && own[e.fileId]) files[e.fileId] = own[e.fileId];
  return JSON.stringify({ elements, files });
}

/**
 * One of your templates onto the board, as a built-in template comes in: new ids, its words,
 * joins and pictures kept, one step Undo takes back, nothing selected, shown whole. `title`: the
 * board's own name, which its title line says instead (as a built-in template's does).
 */
export function insertTemplate(api, app, c) {
  let els = restoreElements(Array.isArray(c.elements) ? c.elements : [], null, { repairBindings: true, refreshDimensions: false }).filter((e) => !e.isDeleted);
  if (!els.length || !app || typeof app.addElementsFromPasteOrLibrary !== "function") return false;
  const title = typeof c.title === "string" ? c.title.replace(/\s+/g, " ").trim() : "";
  if (title && title !== "Whiteboard") {
    els = els.map((e) => {
      if (e.type !== "text" || e.containerId || !marked(e, "pintoTitle") || words(e) === title) return e;
      return restoreElements([{ ...e, text: title, originalText: title }], null, { refreshDimensions: true })[0] || e;
    });
  }
  const [x1, y1, x2, y2] = getCommonBounds(els);
  const s = api.getAppState(), z = (s.zoom && s.zoom.value) || 1;
  const p = sceneCoordsToViewportCoords({ sceneX: -s.scrollX + s.width / z / 2, sceneY: -s.scrollY + s.height / z / 2 }, s);
  const files = c.files && typeof c.files === "object" && Object.keys(c.files).length ? c.files : null;
  app.addElementsFromPasteOrLibrary({ elements: els, files, position: { clientX: p.x, clientY: p.y } });
  api.updateScene({ appState: { selectedElementIds: {}, selectedGroupIds: {} }, captureUpdate: CaptureUpdateAction.NEVER });
  api.setActiveTool({ type: "selection" });
  api.scrollToContent(api.getSceneElements(), { fitToViewport: true, viewportZoomFactor: 0.8, animate: false });
  return x2 > x1 || y2 > y1;
}

/** A library item's picture for the app's library grid: a PNG (base64) on a clear background,
 *  about 256 px on its long side, drawn light (the app turns it for dark mode, as the canvas is). */
export async function libraryPreview(elements, files) {
  const els = restoreElements(Array.isArray(elements) ? elements : [], null, { repairBindings: true, refreshDimensions: false }).filter((e) => !e.isDeleted);
  if (!els.length) return null;
  const [x1, y1, x2, y2] = getCommonBounds(els);
  const scale = Math.min(4, 256 / Math.max(1, x2 - x1, y2 - y1));
  const canvas = await exportToCanvas({
    elements: els, files: files && typeof files === "object" ? files : {}, exportPadding: 4,
    appState: { exportBackground: false, viewBackgroundColor: "#ffffff", exportWithDarkMode: false },
    getDimensions: (w, h) => ({ width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)), scale }),
  });
  return canvas.toDataURL("image/png").replace(/^data:[^,]*,/, "");
}

/** A version of the board from its history, drawn as the board draws it, on the board's own
 *  ground, at most `side` pixels on its long side: the History sheet's preview. */
export async function versionPicture(elements, files, dark, background, side = 1600) {
  const els = restoreElements(Array.isArray(elements) ? elements : [], null, { repairBindings: true, refreshDimensions: false }).filter((e) => !e.isDeleted);
  if (!els.length) return null;
  const [x1, y1, x2, y2] = getCommonBounds(els);
  const pad = 32, scale = Math.min(2, side / Math.max(1, x2 - x1 + 2 * pad, y2 - y1 + 2 * pad));
  // Light, on the board's own colour; dark, on nothing (the history's black ground shows, as the
  // board's does), its colours turned as the board turns them.
  const canvas = await exportToCanvas({
    elements: els, files: files && typeof files === "object" ? files : {}, exportPadding: pad,
    appState: { exportBackground: dark !== true, viewBackgroundColor: typeof background === "string" ? background : "#ffffff", exportWithDarkMode: false },
    getDimensions: (w, h) => ({ width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)), scale }),
  });
  if (dark === true) darken(canvas);
  return canvas.toDataURL("image/png").replace(/^data:[^,]*,/, "");
}

/** The board's dark look on a picture: its theme filter, invert(93%) then hue-rotate(180deg), in
 *  the pixels (a canvas's own filter isn't in every WebKit). */
export function darken(canvas) {
  const ctx = canvas.getContext("2d"), img = ctx.getImageData(0, 0, canvas.width, canvas.height), d = img.data;
  const p = 0.93, m = [-0.574, 1.43, 0.144, 0.426, 0.43, 0.144, 0.426, 1.43, -0.856];
  const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
  for (let i = 0; i < d.length; i += 4) {
    const r = p * (255 - d[i]) + (1 - p) * d[i], g = p * (255 - d[i + 1]) + (1 - p) * d[i + 1], b = p * (255 - d[i + 2]) + (1 - p) * d[i + 2];
    d[i] = clamp(m[0] * r + m[1] * g + m[2] * b);
    d[i + 1] = clamp(m[3] * r + m[4] * g + m[5] * b);
    d[i + 2] = clamp(m[6] * r + m[7] * g + m[8] * b);
  }
  ctx.putImageData(img, 0, 0);
}

/** The board as a version from its history had it, in one step Undo takes back: what the version
 *  has comes back as it was, what it didn't have is deleted. Each element's version goes past the
 *  one on the board, so the change syncs and wins a merge as any edit does. */
export function restoreVersion(api, scene) {
  const back = restoreElements(Array.isArray(scene && scene.elements) ? scene.elements : [], null, { repairBindings: true, refreshDimensions: false });
  const now = api.getSceneElementsIncludingDeleted();
  const byId = new Map(now.map((e) => [e.id, e]));
  const ids = new Set(back.map((e) => e.id));
  const bump = (e) => ({ ...e, version: Math.max(e.version || 1, (byId.get(e.id) || {}).version || 0) + 1,
    versionNonce: hash(`${e.id}:restore:${Date.now()}`), updated: Date.now() });
  const gone = now.filter((e) => !ids.has(e.id)).map((e) => (e.isDeleted ? e : bump({ ...e, isDeleted: true })));
  const files = scene && scene.files && typeof scene.files === "object" ? Object.values(scene.files) : [];
  if (files.length) api.addFiles(files);
  const made = back.map(bump);
  api.updateScene({ elements: [...gone, ...made], captureUpdate: CaptureUpdateAction.IMMEDIATELY });
  const shown = made.filter((e) => !e.isDeleted);
  if (shown.length) api.scrollToContent(shown, { fitToViewport: true, viewportZoomFactor: 0.8, animate: false });
  return true;
}

/**
 * Where something w by h goes: at least `gap` (48 pt on screen, never less in the scene) from every
 * shape, line and word drawn, in the roomiest empty part of the view (library council, round 6:
 * "D1 Store" landed 25 pt above an arrowhead in a tight gap). The middle of the view when it has
 * room all round; else the spot in view farthest from anything drawn and from the view's edges,
 * nearest the middle among equals; else just right of the drawing (`inView` false then). Its top
 * left corner, in the scene.
 */
export function freeSpot(api, w, h, gap = FREE_GAP) {
  const s = api.getAppState(), z = (s.zoom && s.zoom.value) || 1;
  const vx = -s.scrollX, vy = -s.scrollY, vw = s.width / z, vh = s.height / z;
  const margin = Math.max(gap, gap / z), roomy = 2.5 * margin;
  const mid = { x: vx + vw / 2 - w / 2, y: vy + vh / 2 - h / 2 };
  // Words on arrows and in shapes count too: a label can reach past its arrow.
  const drawn = api.getSceneElements().map((e) => getCommonBounds([e]));
  // How far a w by h box at x, y is from the nearest thing drawn (Infinity on an empty board).
  const room = (x, y) => {
    let d = Infinity;
    for (const [x1, y1, x2, y2] of drawn) {
      const dx = Math.max(x1 - (x + w), x - x2, 0), dy = Math.max(y1 - (y + h), y - y2, 0);
      d = Math.min(d, Math.hypot(dx, dy));
    }
    return d;
  };
  const edges = (x, y) => Math.min(x - vx, vx + vw - x - w, y - vy, vy + vh - y - h);
  if (room(mid.x, mid.y) >= roomy) return { ...mid, inView: true };
  // Every spot in view on a grid fine enough to find a gap, coarse enough to stay quick.
  const step = Math.max(8 / z, Math.min(w, h) / 4, vw / 60, vh / 60);
  let best = null;
  for (let x = vx + margin / 4; x + w <= vx + vw - margin / 4; x += step) {
    for (let y = vy + margin / 4; y + h <= vy + vh - margin / 4; y += step) {
      const r = room(x, y);
      if (r < margin) continue;
      // The roomiest spot, counting the view's edges as walls; past `roomy` all are as good.
      const score = Math.min(r, edges(x, y) + margin, roomy);
      const d = (x - mid.x) ** 2 + (y - mid.y) ** 2;
      if (!best || score > best.score + 0.5 || (Math.abs(score - best.score) <= 0.5 && d < best.d)) best = { x, y, d, score };
    }
  }
  if (best) return { x: best.x, y: best.y, inView: true };
  const [x1, y1, x2, y2] = getCommonBounds(api.getSceneElements());
  return { x: x2 + Math.max(60, margin), y: Math.max(y1, Math.min(mid.y, y2 - h)), inView: false };
}

/** The least room left around something put on the board for you (freeSpot), in screen points. */
export const FREE_GAP = 48;

/**
 * A library item onto the board, as the engine puts one from its own library: new ids, its words
 * and joins kept, one step Undo takes back, selected. Where `x`, `y` (a point of the page) say,
 * as when it's dropped; else in a free spot in the middle of the view, never on the drawing, and
 * brought into view when the view has no room (whiteboard council, round 5).
 */
export function insertFromLibrary(api, app, c) {
  const els = restoreElements(Array.isArray(c.elements) ? c.elements : [], null, { repairBindings: true, refreshDimensions: false }).filter((e) => !e.isDeleted);
  if (!els.length || !app || typeof app.addElementsFromPasteOrLibrary !== "function") return false;
  const [x1, y1, x2, y2] = getCommonBounds(els);
  const w = Math.max(1, x2 - x1), h = Math.max(1, y2 - y1);
  const s = api.getAppState();
  let position, spot = null;
  if (typeof c.x === "number" && typeof c.y === "number") position = { clientX: c.x, clientY: c.y };
  else {
    spot = freeSpot(api, w, h);
    const p = sceneCoordsToViewportCoords({ sceneX: spot.x + w / 2, sceneY: spot.y + h / 2 }, s);
    position = { clientX: p.x, clientY: p.y };
  }
  const files = c.files && typeof c.files === "object" && Object.keys(c.files).length ? c.files : null;
  app.addElementsFromPasteOrLibrary({ elements: els, files, position });
  if (spot && !spot.inView && !frameBoard(api, { minZoom: 0.5 })) {
    // Too big to show whole: the item in view at the zoom you had.
    const v = api.getAppState(), z = (v.zoom && v.zoom.value) || 1;
    flushSync(() => api.updateScene({ appState: { scrollX: -(spot.x + w / 2) + v.width / 2 / z, scrollY: -(spot.y + h / 2) + v.height / 2 / z }, captureUpdate: CaptureUpdateAction.NEVER }));
  }
  return true;
}

/**
 * Where new note cards go when they weren't dropped somewhere: the middle of the view, or the
 * nearest spot in it that covers nothing drawn. Big shapes (a meeting's sections, a retro's lanes)
 * don't count: a card goes on them. The point is the first card's top middle, plus 40 (newCards).
 */
function clearSpot(api, count) {
  const s = api.getAppState(), z = (s.zoom && s.zoom.value) || 1;
  const w = count * CARD.width + (count - 1) * 24, h = 120;
  const vx = -s.scrollX, vy = -s.scrollY, vw = s.width / z, vh = s.height / z;
  const big = STICKY.size * STICKY.size * 2;
  const taken = api.getSceneElements().filter((e) => !e.containerId && e.width * e.height < big).map((e) => getCommonBounds([e]));
  const box = (x, y) => [x - CARD.width / 2, y - 40, x - CARD.width / 2 + w, y - 40 + h];
  const free = (x, y) => { const [a, b, c, d] = box(x, y); return !taken.some(([x1, y1, x2, y2]) => a < x2 + 12 && c > x1 - 12 && b < y2 + 12 && d > y1 - 12); };
  const inView = (x, y) => { const [a, b, c, d] = box(x, y); return a >= vx && b >= vy && c <= vx + vw && d <= vy + vh; };
  const start = { x: vx + vw / 2 - w / 2 + CARD.width / 2, y: vy + vh / 2 - h / 2 + 40 };
  if (free(start.x, start.y)) return start;
  let best = null;
  for (let i = -10; i <= 10; i++) for (let j = -10; j <= 10; j++) {
    const x = start.x + i * (CARD.width + 24) / 2, y = start.y + j * (h + 24) / 2;
    if (!free(x, y)) continue;
    // In view first; then nearest, to the right before the left.
    const d = (inView(x, y) ? 0 : 1000) + i * i + j * j + (i < 0 ? 0.5 : 0);
    if (!best || d < best.d) best = { x, y, d };
  }
  return best || start;
}

/** What the page tells the app: the tool, what's selected, and the style the controls show. */
/**
 * Present (whiteboard council, rounds 4 and 5: "frames with next and previous for walking a
 * board through in a call"): the board's frames one after another, each filling the view; with
 * no frames, the whole board. The laser pointer is picked; arrow keys, Space and Page Up/Down
 * step, Escape ends.
 *
 * The order is yours (round 7: it was only the order they were made): each frame keeps its place
 * as `customData.presentOrder` (0 first), so it saves with the board and an AI reading the file
 * sees it. Frames without one follow, in the order they were made.
 */
let presenting = null;
/** The view being followed (BoardFollow), while it is: a new size fits it again. */
const followed = { at: null };
const isFrame = (e) => e.type === "frame" || e.type === "magicframe";
// A frame's name sits this far above it, in view points at any zoom (the engine draws it at
// 14 pt, 3 pt up).
const FRAME_NAME = 22;
const frameName = (f, i) => (f.name && String(f.name).trim()) || `Frame ${i + 1}`;
export function framesInOrder(api) {
  const frames = api.getSceneElements().filter(isFrame);
  const place = (f) => (f.customData && typeof f.customData.presentOrder === "number" ? f.customData.presentOrder : Infinity);
  // A frame's default name is by when it was made, whatever its place.
  return frames.map((f, i) => ({ f, i })).sort((a, b) => (place(a.f) - place(b.f)) || (a.i - b.i)).map(({ f, i }) => ({ id: f.id, name: frameName(f, i) }));
}
export function presentSteps(api) {
  const frames = framesInOrder(api);
  return frames.length ? frames : [{ id: null, name: "Whole board" }];
}
/** Puts the frames in this order (ids; frames left out keep theirs, after). One step Undo takes back. */
export function setPresentOrder(api, ids) {
  if (!Array.isArray(ids)) return false;
  const order = framesInOrder(api).map((f) => f.id);
  // Presenting: the frame on screen stays on screen, at its new place.
  const showing = presenting ? order[presenting.index] : null;
  const wanted = ids.filter((id) => order.includes(id));
  const next = [...new Set(wanted), ...order.filter((id) => !wanted.includes(id))];
  const at = new Map(next.map((id, i) => [id, i]));
  const now = Date.now();
  let changed = false;
  const elements = api.getSceneElementsIncludingDeleted().map((e) => {
    if (!at.has(e.id) || e.isDeleted) return e;
    if (e.customData && e.customData.presentOrder === at.get(e.id)) return e;
    changed = true;
    return { ...e, customData: { ...(e.customData || {}), presentOrder: at.get(e.id) }, version: (e.version || 1) + 1, versionNonce: Math.floor(Math.random() * 2 ** 31), updated: now };
  });
  if (changed) api.updateScene({ elements, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
  if (showing && at.has(showing)) presenting.index = at.get(showing);
  return true;
}
/** The step to start from: a frame by id, or (`"selection"`) the selected frame, or the frame what's selected is in. */
function startStep(api, steps, from) {
  let id = from;
  if (from === "selection") {
    const sel = api.getAppState().selectedElementIds || {};
    const chosen = api.getSceneElements().filter((e) => sel[e.id]);
    const frame = chosen.find(isFrame) || chosen.find((e) => e.frameId);
    id = frame ? (isFrame(frame) ? frame.id : frame.frameId) : null;
  }
  const i = id ? steps.findIndex((s) => s.id === id) : -1;
  return i < 0 ? 0 : i;
}
/**
 * A board's first view: the whole drawing, centred in the room the page's own controls leave
 * (`insets`: top, right, bottom, left, in points; the browser's title and toolbar), at no more
 * than 100%, and no less than 10%.
 */
export function openingView(api, insets) {
  const els = api.getSceneElements();
  if (!els.length) return false;
  const m = { top: 24, right: 24, bottom: 24, left: 24, ...(insets && typeof insets === "object" ? insets : {}) };
  const size = viewSize(api), W = Math.max(80, size.width - m.left - m.right), H = Math.max(80, size.height - m.top - m.bottom);
  const [x1, y1, x2, y2] = getCommonBounds(els);
  const z = Math.min(1, Math.max(0.1, Math.min(W / Math.max(1, x2 - x1), H / Math.max(1, y2 - y1))));
  const cx = m.left + W / 2, cy = m.top + H / 2;
  flushSync(() => api.updateScene({ appState: { zoom: { value: z }, scrollX: -(x1 + x2) / 2 + cx / z, scrollY: -(y1 + y2) / 2 + cy / z }, captureUpdate: CaptureUpdateAction.NEVER }));
  return true;
}

/** The board's size as the page lays it out now (the engine's own catches up a frame or more later). */
export function viewSize(api) {
  const area = typeof document !== "undefined" ? document.getElementById("canvas") : null;
  if (area && area.clientWidth > 0 && area.clientHeight > 0) return { width: area.clientWidth, height: area.clientHeight };
  const s = api.getAppState();
  return { width: s.width, height: s.height };
}
/** While presenting, the comment pins go, as the frames' names do: the audience sees the frame
 *  alone (round 16, Opus #4). Back on Done (pinto.css, .pinto-presenting). */
function presentingLook(on) {
  const area = typeof document !== "undefined" ? document.getElementById("canvas") : null;
  if (area) area.classList.toggle("pinto-presenting", on);
}
export function present(api, to, from, size) {
  const v = api.getAppState(), vz = (v.zoom && v.zoom.value) || 1;
  if (to === "stop") {
    if (!presenting) return;
    // Done: the view you had before, its middle in the middle (round 5, 25-present-done: it
    // stayed zoomed into the last frame).
    const b = presenting.back, labels = presenting.labels;
    presenting = null;
    presentingLook(false);
    api.setActiveTool({ type: "selection" });
    if (b) api.updateScene({ appState: { zoom: { value: b.z }, scrollX: -b.cx + v.width / 2 / b.z, scrollY: -b.cy + v.height / 2 / b.z, ...(labels ? { frameRendering: labels } : {}) }, captureUpdate: CaptureUpdateAction.NEVER });
    return;
  }
  const steps = presentSteps(api);
  const at = to === "start" || !presenting ? (from ? startStep(api, steps, from) : 0) : to === "next" ? presenting.index + 1 : to === "prev" ? presenting.index - 1 : +to;
  const index = Math.max(0, Math.min(steps.length - 1, Number.isFinite(at) ? at : 0));
  const back = presenting ? presenting.back : { z: vz, cx: -v.scrollX + v.width / 2 / vz, cy: -v.scrollY + v.height / 2 / vz };
  const first = !presenting;
  // The frame's own name and outline go while presenting: the Present bar names it (round 6:
  // the name showed twice). What runs over its edge is cut there, as only the frame shows.
  const labels = presenting ? presenting.labels : v.frameRendering;
  presenting = { index, back, labels };
  presentingLook(true);
  if (first) {
    api.updateScene({ appState: { selectedElementIds: {}, frameRendering: { ...(labels || {}), enabled: true, name: false, outline: false, clip: true } }, captureUpdate: CaptureUpdateAction.NEVER });
    // Laser on to start; after that the Present bar's toggle decides.
    api.setActiveTool({ type: "laser" });
  }
  const step = steps[index];
  const els = api.getSceneElements();
  const target = step.id ? els.filter((e) => e.id === step.id) : els;
  // At once, no glide (motion restraint; a hidden window never runs the glide), to the size the
  // board has now: every step, the first included, fills it the same way (round 13, 25-present-1).
  fitTo(api, target, size || viewSize(api));
}

/**
 * The shapes whose words hold `query` (case and accents aside), for a search that opened the board:
 * the first match in reading order (top to bottom, then left to right), as the shape that holds
 * the words (a label's box) or the words themselves. A template's how-to line doesn't count.
 */
export function findWords(api, query) {
  const fold = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  const q = fold(query);
  if (!q) return [];
  const all = api.getSceneElements(), byId = new Map(all.map((e) => [e.id, e]));
  const hits = [];
  for (const e of all) {
    if (e.type !== "text" || (e.customData && e.customData.pintoHint)) continue;
    if (!fold(e.originalText || e.text).includes(q)) continue;
    const box = e.containerId && byId.get(e.containerId);
    hits.push(box && box.type !== "arrow" && box.type !== "line" ? box : e);
  }
  // A note card's words are its own elements (cards.js), found the same way.
  hits.sort((a, b) => (a.y - b.y) || (a.x - b.x));
  if (!hits.length) return [];
  const first = hits[0];
  return all.filter((e) => e.id === first.id || e.containerId === first.id);
}

/** How far round the selection what's drawn is listed for its style bar (stateOf), in view points. */
export const NEARBY_REACH = 260;

/** The hint line for this state (hintOf), or null where the app shows none. */
function busyHint(s, selected) {
  return s.viewModeEnabled || (comments && comments.commenting) ? null : hintLine(hintOf(s, selected));
}

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
  // shapes as boxes, arrows and lines as the points they run through (their boxes are mostly air),
  // a frame as its edge and its name (its middle is what's in it). Everything within NEARBY_REACH
  // of the selection is listed: the bar looks for room no further out (CanvasSelectionBar.reach).
  const nearby = [];
  if (bounds) {
    const reach = NEARBY_REACH, z = (s.zoom && s.zoom.value) || 1;
    const view = (x, y) => { const p = sceneCoordsToViewportCoords({ sceneX: x, sceneY: y }, s); return [Math.round(p.x), Math.round(p.y)]; };
    const near = (x1, y1, x2, y2) => x2 >= bounds.x - reach && x1 <= bounds.x + bounds.width + reach && y2 >= bounds.y - reach && y1 <= bounds.y + bounds.height + reach;
    for (const e of api.getSceneElements()) {
      if (nearby.length >= 200) break;
      if (ids[e.id] || (e.containerId && ids[e.containerId])) continue;
      if (isFrame(e)) {
        const [x1, y1, x2, y2] = getCommonBounds([e]);
        const p = view(x1, y1), q = view(x2, y2);
        if (!near(p[0], p[1] - FRAME_NAME, q[0], q[1])) continue;
        nearby.push({ line: [p[0], p[1], q[0], p[1], q[0], q[1], p[0], q[1], p[0], p[1]] });
        // Its name, over its top left corner, as the engine draws it (14 pt, about 7 pt a letter).
        if (s.frameRendering && s.frameRendering.name !== false) {
          const name = frameName(e, 0);
          nearby.push({ box: [p[0], p[1] - FRAME_NAME, Math.min(q[0] - p[0], Math.round(name.length * 7.5) + 8), FRAME_NAME], words: true });
        }
        continue;
      }
      if ((e.type === "arrow" || e.type === "line" || e.type === "freedraw") && Array.isArray(e.points)) {
        const step = Math.max(1, Math.ceil(e.points.length / 24));
        const pts = e.points.filter((_, i) => i % step === 0 || i === e.points.length - 1).map(([px, py]) => view(e.x + px, e.y + py));
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
        if (near(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys))) nearby.push({ line: pts.flat() });
      } else {
        const [x1, y1, x2, y2] = getCommonBounds([e]);
        const p = view(x1, y1), q = view(x2, y2);
        // Words of their own (a how-to line, a heading) are marked: the bar covers a line or a dot
        // before it covers words you'd read (round 15, 43-timeline-1: Add Step sat on the how-to line).
        if (near(p[0], p[1], q[0], q[1])) nearby.push({ box: [p[0], p[1], Math.round((x2 - x1) * z), Math.round((y2 - y1) * z)], ...(e.type === "text" && !e.containerId ? { words: true } : {}) });
      }
    }
  }
  const steps = presenting ? presentSteps(api) : null;
  return {
    // The Comment tool is the page's own, over the engine's selection tool.
    tool: comments && comments.commenting ? "comment" : s.activeTool && s.activeTool.type,
    // The tool stays picked after drawing (Q, or the palette's lock).
    locked: !!(s.activeTool && s.activeTool.locked),
    // Excalidraw's hint for what you're doing, for the line under the app's palette: none in view
    // mode (Excalidraw shows no toolbar there) or with the Comment tool (the page's own).
    hint: busyHint(s, selected),
    cropping: !!s.croppingElementId,
    present: steps ? (() => {
      const i = Math.min(presenting.index, steps.length - 1), f = steps[i].id && api.getSceneElements().find((e) => e.id === steps[i].id);
      // Where the frame is on screen: the app covers the rest, so only this frame shows (round 6:
      // the next frame's edge showed beside it).
      let frame = null;
      if (f) {
        const a = sceneCoordsToViewportCoords({ sceneX: f.x, sceneY: f.y }, s), b = sceneCoordsToViewportCoords({ sceneX: f.x + f.width, sceneY: f.y + f.height }, s);
        frame = [Math.round(a.x), Math.round(a.y), Math.round(b.x - a.x), Math.round(b.y - a.y)];
      }
      return { index: i, count: steps.length, name: steps[i].name, frame };
    })() : null,
    selection: selected.map((e) => e.type),
    // The frames in the order Present walks them (the Order list), and whether the selection is a
    // frame or in one (Present from Here).
    frames: framesInOrder(api),
    inFrame: selected.some((e) => isFrame(e) || !!e.frameId),
    // A template part that has more of its kind: Add Column, Add Step (round 15).
    grows: (() => { const g = growsFrom(api); return g ? g.kind : null; })(),
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
      // The selection's arrows (not its first element, which may be a box: round 3, 10 showed
      // the curved glyph for straight arrows); "mixed" when they differ.
      arrowType: (() => {
        const kinds = [...new Set(selected.filter((e) => e.type === "arrow").map((e) => (e.elbowed ? "elbow" : e.roundness ? "round" : "sharp")))];
        return kinds.length === 1 ? kinds[0] : kinds.length > 1 ? "mixed" : s.currentItemArrowType;
      })(),
      // Shapes with different fills: the fill swatch says so, rather than showing the first one's.
      mixedFill: new Set(selected.filter((e) => ["rectangle", "diamond", "ellipse"].includes(e.type)).map((e) => e.backgroundColor)).size > 1,
    },
    zoom: s.zoom && s.zoom.value,
    background: s.viewBackgroundColor,
    // Nothing drawn yet: the app offers its templates (CanvasStart).
    empty: api.getSceneElements().length === 0,
    // Something's drawn but none of it is in view: the app offers Back to content, as the
    // engine's own "Scroll back to content" (hidden in pinto.css) does.
    lost: !!s.scrolledOutside,
    // One note card selected: the app offers to open its note (cards.js). Only cards: the bar
    // has nothing to style, and lines them up as cards, not as their parts.
    card: selectedCard(selected),
    selectedCards: selected.filter(isCard).length,
    onlyCards: selected.length > 0 && selected.every(noteOf),
    // The notes the board's cards name, for the app to send what each says now.
    cardNotes: cardNotes(api.getSceneElements()),
    load: LOAD,
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
  // Where each bound arrow ran for each place of what it joins. Undo and Redo give the shapes
  // back exactly, but the engine lays their arrows again its own way, and after Align › Undo ›
  // Redo the arrow came back 9 pt off (whiteboard council, round 4, 22-sequence). So the arrow
  // goes back where it ran when its shapes were last where they are now.
  const routes = new Map();
  let replaying = false;
  const routeKey = (a, byId) => {
    const at = (b) => { const e = b && byId.get(b.elementId); return e ? [e.x, e.y, e.width, e.height].map(Math.round).join(":") : "-"; };
    return a.startBinding || a.endBinding ? `${a.id}|${at(a.startBinding)}|${at(a.endBinding)}` : null;
  };
  let rememberedAt;
  const remember = () => {
    if (replaying) return;
    // Nothing drawn has changed since the last time: the routes are as they were.
    const nonce = sceneNonce();
    if (nonce !== null && nonce === rememberedAt) return;
    rememberedAt = nonce;
    const els = api.getSceneElements();
    const byId = new Map(els.map((e) => [e.id, e]));
    for (const a of els) {
      if (a.type !== "arrow") continue;
      const k = routeKey(a, byId);
      if (!k) continue;
      routes.delete(k);
      routes.set(k, { x: a.x, y: a.y, width: a.width, height: a.height, points: a.points });
    }
    while (routes.size > 2000) routes.delete(routes.keys().next().value);
  };
  const putBack = () => {
    const els = api.getSceneElementsIncludingDeleted();
    const byId = new Map(els.map((e) => [e.id, e]));
    let changed = false;
    const next = els.map((a) => {
      if (a.type !== "arrow" || a.isDeleted) return a;
      const k = routeKey(a, byId), r = k && routes.get(k);
      if (!r || (r.x === a.x && r.y === a.y && JSON.stringify(r.points) === JSON.stringify(a.points))) return a;
      changed = true;
      return { ...a, ...r, version: a.version + 1, versionNonce: Math.floor(Math.random() * 2 ** 31), updated: Date.now() };
    });
    if (changed) api.updateScene({ elements: next, captureUpdate: CaptureUpdateAction.NEVER });
  };
  // After Align or Distribute, a straight arrow between two of the shapes that moved runs
  // centre to centre, edge to edge (round 4, 22-sequence-2: it kept its old slant).
  const straighten = (moved) => {
    const els = api.getSceneElementsIncludingDeleted();
    const byId = new Map(els.map((e) => [e.id, e]));
    const edge = (e, dx, dy) => {
      const a = e.width / 2, b = e.height / 2, n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n;
      const t = e.type === "ellipse" ? 1 / Math.hypot(ux / a, uy / b)
        : e.type === "diamond" ? 1 / (Math.abs(ux) / a + Math.abs(uy) / b)
        : Math.min(Math.abs(ux) > 1e-6 ? a / Math.abs(ux) : Infinity, Math.abs(uy) > 1e-6 ? b / Math.abs(uy) : Infinity);
      return { x: e.x + a + ux * (t + 6), y: e.y + b + uy * (t + 6) };
    };
    let changed = false;
    const next = els.map((r) => {
      if (r.type !== "arrow" || r.isDeleted || r.elbowed || (r.points || []).length !== 2 || !r.startBinding || !r.endBinding) return r;
      const A = byId.get(r.startBinding.elementId), B = byId.get(r.endBinding.elementId);
      if (!A || !B || !(moved[A.id] || moved[B.id])) return r;
      const ca = { x: A.x + A.width / 2, y: A.y + A.height / 2 }, cb = { x: B.x + B.width / 2, y: B.y + B.height / 2 };
      const p = edge(A, cb.x - ca.x, cb.y - ca.y), q = edge(B, ca.x - cb.x, ca.y - cb.y);
      changed = true;
      return { ...r, x: p.x, y: p.y, points: [[0, 0], [q.x - p.x, q.y - p.y]], width: Math.abs(q.x - p.x), height: Math.abs(q.y - p.y),
        startBinding: { ...r.startBinding, focus: 0, gap: 6 }, endBinding: { ...r.endBinding, focus: 0, gap: 6 },
        version: r.version + 1, versionNonce: Math.floor(Math.random() * 2 ** 31), updated: Date.now() };
    });
    if (changed) api.updateScene({ elements: next, captureUpdate: CaptureUpdateAction.NEVER });
  };
  const run = (name, value = null) => {
    const action = app && app.actionManager.actions[name];
    if (!action) return;
    if (/^(align|distribute)/.test(name)) {
      const moved = { ...(api.getAppState().selectedElementIds || {}) };
      app.actionManager.executeAction(action, "api", value);
      straighten(moved);
      return;
    }
    if (name === "selectAll") {
      // Everything, then the Select tool, which keeps it (the other way round, the action's
      // state puts the old tool back). The Comment tool goes down too.
      app.actionManager.executeAction(action, "api", value);
      if (api.getAppState().activeTool.type !== "selection") api.setActiveTool({ type: "selection" });
      if (comments && comments.commenting) comments.tool(false);
      return;
    }
    if (name !== "undo" && name !== "redo") { app.actionManager.executeAction(action, "api", value); return; }
    remember();
    replaying = true;
    app.actionManager.executeAction(action, "api", value);
    putBack();
    setTimeout(() => { putBack(); replaying = false; remember(); }, 30);
  };
  let last = null, lastState = null, busySent = false, busyLine = null;
  const report = () => {
    const state = stateOf(api, app);
    const json = JSON.stringify(state);
    busySent = false;
    if (json === last) return;
    last = json;
    lastState = state;
    try { window.webkit.messageHandlers.amberCanvas.postMessage(state); } catch (e) {}
  };
  // While a press draws, moves, resizes or boxes, or the view pans or zooms under a selection: the
  // last state, busy (the app's bar over the selection stands aside), once; again only if the hint
  // changes (a resize's "hold Shift", a line's next point). The selection is looked up by its ids,
  // not over the drawing: this runs on every frame of a drag.
  const reportBusy = () => {
    if (!lastState) return;
    const s = api.getAppState(), ids = Object.keys(s.selectedElementIds || {});
    const byId = app && app.scene && app.scene.getNonDeletedElementsMap ? app.scene.getNonDeletedElementsMap() : null;
    const selected = byId ? ids.map((id) => byId.get(id)).filter(Boolean) : api.getSceneElements().filter((e) => s.selectedElementIds[e.id]);
    const hint = busyHint(s, selected);
    if (busySent ? hint === busyLine : lastState.busy && hint === lastState.hint) return;
    busySent = true;
    busyLine = hint;
    const state = { ...lastState, busy: true, nearby: [], hint };
    last = JSON.stringify(state);
    try { window.webkit.messageHandlers.amberCanvas.postMessage(state); } catch (e) {}
  };
  const command = (c) => {
    if (!c || typeof c !== "object") return false;
    // Can view (a shared board): nothing changes the drawing; looking round it does. Can comment:
    // a comment still goes on it.
    const commentInView = c.op === "commentHere" && comments && comments.inView;
    if (api.getAppState().viewModeEnabled && !commentInView && (EDITS.has(c.op) || (c.op === "action" && !LOOKS.has(c.name)))) return false;
    switch (c.op) {
      case "shared":
        if (!sharedHooks.set) return false;
        sharedHooks.set(c);
        break;
      case "remoteScene":
        if (!sharedHooks.remote || !sharedHooks.remote(c.scene)) return false;
        break;
      case "outline":
        if (!sharedHooks.outline || !Array.isArray(c.ids)) return false;
        if (!sharedHooks.outline(c.ids, { move: c.move !== false, all: c.all === true })) return false;
        break;
      case "find":
        if (!sharedHooks.find || typeof c.query !== "string" || !c.query.trim()) return false;
        if (!sharedHooks.find(c.query.trim())) return false;
        break;
      case "peers":
        if (!sharedHooks.peers) return false;
        sharedHooks.peers(c.peers);
        return true;
      case "refusePictures":
        if (!sharedHooks.refuse || !Array.isArray(c.ids)) return false;
        sharedHooks.refuse(c.ids);
        break;
      case "follow":
        if (!sharedHooks.follow || !sharedHooks.follow(c)) return false;
        return true;
      case "laser":
        if (!sharedHooks.laser || typeof c.id !== "string" || !Array.isArray(c.points)) return false;
        return sharedHooks.laser(c);
      case "tool":
        if (c.tool === "comment") {
          if (!comments) return false;
          // `on: false`: put down (the Comment button pressed again, where it's the only tool).
          if (c.on === false) { comments.tool(false); break; }
          if (!api.getAppState().viewModeEnabled && api.getAppState().activeTool.type !== "selection") api.setActiveTool({ type: "selection" });
          if (!comments.tool(true)) return false;
          break;
        }
        if (!TOOLS.has(c.tool)) return false;
        if (comments) comments.tool(false);
        // View only (Can comment puts the Comment tool down this way): the drawing's tools stay away.
        if (api.getAppState().viewModeEnabled) break;
        api.setActiveTool({ type: c.tool });
        break;
      case "lock": {
        // The tool stays picked after drawing, as Excalidraw's lock (Q) keeps it; off, back to
        // selecting, as Q does.
        if (api.getAppState().viewModeEnabled) return false;
        const t = api.getAppState().activeTool;
        if (!!t.locked !== !!c.on) {
          if (app && typeof app.toggleLock === "function") app.toggleLock("ui");
          else api.setActiveTool(c.on ? { type: t.type, locked: true } : { type: "selection", locked: false });
        }
        break;
      }
      case "minimap":
        // On: the map, where the app's controls leave room for it (right, bottom, in points).
        if (!map) return false;
        if (c.on) map.show({ right: Number(c.right) || 12, bottom: Number(c.bottom) || 68 });
        else map.hide();
        return true;
      case "comments":
        if (!comments) return false;
        comments.set(c);
        // The totals move off a pin that just arrived.
        if (votes) votes.draw();
        return true;
      case "votes":
        if (!votes) return false;
        votes.set(c);
        return true;
      case "commentHere":
        if (!comments || !comments.here(c.x, c.y)) return false;
        break;
      case "focusComment":
        if (!comments || !comments.focus(c.id, c.above)) return false;
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
        // In a browser, Zoom to Fit is the board's first view: whole, centred between the title
        // and the tools (round 16, web-07 to web-08: the engine's own fit left the board smaller
        // and lower on a phone than it opened).
        if (c.name === "zoomToFit" && amber.fitInsets && openingView(api, amber.fitInsets)) break;
        // A zoom from the menus is one step, not a pinch: applied now, so the report after this
        // switch carries it. Left to the engine's next render, it waited for the view to settle
        // (150 ms, and seconds on a test page whose timers were held: 16 November 2026).
        if (LOOKS.has(c.name)) flushSync(() => run(ACTIONS[c.name]));
        else run(ACTIONS[c.name]);
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
          // Short note cards in it are drawn as cards (cards.js).
          const made = expandSeeds(convertToExcalidrawElements(elements, { regenerateIds: true })).elements;
          api.updateScene({ elements: [...api.getSceneElementsIncludingDeleted(), ...made], captureUpdate: CaptureUpdateAction.IMMEDIATELY });
          api.setActiveTool({ type: "selection" });
          api.scrollToContent(made, { fitToViewport: true, viewportZoomFactor: 0.8, animate: false });
        });
        break;
      }
      case "sticky":
        addSticky(api);
        break;
      case "grow":
        if (!grow(api)) return false;
        break;
      case "showLastChange":
        if (!(amber._showLastChange && amber._showLastChange())) return false;
        break;
      case "cropDone":
        // The crop stays as dragged; the picture stays selected.
        api.updateScene({ appState: { croppingElementId: null, isCropping: false }, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
        break;
      case "present":
        present(api, c.to, c.from);
        setTimeout(report, 30);
        break;
      case "presentOrder":
        if (!setPresentOrder(api, c.ids)) return false;
        setTimeout(report, 30);
        break;
      case "libraryInsert":
        if (!insertFromLibrary(api, app, c)) return false;
        break;
      case "restoreVersion":
        // A version from the board's History, back on the board.
        if (!c.scene || typeof c.scene !== "object") return false;
        restoreVersion(api, c.scene);
        break;
      case "template":
        // Measured in the hand-drawn font, as a built-in template is.
        if (!Array.isArray(c.elements) || !c.elements.length) return false;
        document.fonts.load("20px Excalifont").catch(() => {}).then(() => insertTemplate(api, app, c));
        break;
      case "cards": {
        // What each card's note says now ({ <what the card names>: { id, title, preview, deleted } }),
        // laid out in the card's font once it's here. Not a step of yours to undo.
        if (!c.info || typeof c.info !== "object") return false;
        const info = c.info;
        document.fonts.load(`${CARD.title.size}px Nunito`).catch(() => {}).then(() => {
          const next = refreshCards(api.getSceneElementsIncludingDeleted(), info);
          if (!next) return;
          // A part made now (a card's first lines arriving) of a card that's selected is selected
          // with it, so the card stays one selection (a board opened from "On boards").
          const s = api.getAppState(), groups = s.selectedGroupIds || {}, sel = { ...(s.selectedElementIds || {}) };
          let grew = false;
          for (const e of next) if (!e.isDeleted && !sel[e.id] && groups[(e.groupIds || [])[0]]) { sel[e.id] = true; grew = true; }
          api.updateScene({ elements: next, ...(grew ? { appState: { selectedElementIds: sel } } : {}), captureUpdate: CaptureUpdateAction.NEVER });
        });
        break;
      }
      case "focusCard":
        if (typeof c.note !== "string" || !focusCard(api, c.note)) return false;
        break;
      case "addCards": {
        // Notes onto the board as cards: where they were dropped, else in the middle of the view
        // (nudged clear of what's there); one step Undo takes back, selected.
        if (!Array.isArray(c.notes) || !c.notes.length) return false;
        const notes = c.notes.filter((n) => n && typeof n.id === "string");
        if (!notes.length) return false;
        document.fonts.load(`${CARD.title.size}px Nunito`).catch(() => {}).then(() => {
          const s = api.getAppState();
          const at = typeof c.x === "number" ? viewportCoordsToSceneCoords({ clientX: c.x, clientY: c.y }, s) : clearSpot(api, notes.length);
          const made = newCards(notes, at);
          const groups = Object.fromEntries(made.filter((e) => e.groupIds && e.groupIds[0]).map((e) => [e.groupIds[0], true]));
          api.updateScene({ elements: [...api.getSceneElementsIncludingDeleted(), ...made],
            appState: { selectedElementIds: Object.fromEntries(made.map((e) => [e.id, true])), selectedGroupIds: groups },
            captureUpdate: CaptureUpdateAction.IMMEDIATELY });
          api.setActiveTool({ type: "selection" });
        });
        break;
      }
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
        if (moved && !frameBoard(api, { minZoom: 0.5 })) {
          // Too big to show whole: the picture in view at the zoom you had, at once.
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
  // The app hears of a change once it has settled, a frame later, not on every frame of it (a
  // timer: a page off screen gets no animation frames). While a press draws, moves, resizes or boxes
  // something, it hears only that the board is busy, once; the state is worked out over the whole
  // drawing when that ends. While the view pans or zooms, the view alone waits the same way (busy,
  // under a selection), and anything else (a tool, a selection, the next frame of a talk) is said at
  // once, as is a zoom from the menus (`command`). On a board of 2000 elements that was 2 ms of every frame, and the app redrew its controls
  // for every message: drawing and dragging lagged (16 November 2026). A change to nothing the app
  // shows (the pointer over a shape) is let go.
  const shownOf = (s) => [sceneNonce() ?? NaN, s.selectedElementIds, s.selectedGroupIds, s.activeTool && s.activeTool.type, s.cursorButton, pressing(s),
    s.editingTextElement, s.croppingElementId, s.viewModeEnabled, s.viewBackgroundColor, s.frameRendering, s.width, s.height,
    s.currentItemStrokeColor, s.currentItemBackgroundColor, s.currentItemFillStyle,
    s.currentItemStrokeWidth, s.currentItemStrokeStyle, s.currentItemOpacity, s.currentItemFontFamily, s.currentItemFontSize,
    s.currentItemStartArrowhead, s.currentItemEndArrowhead, s.currentItemArrowType, comments && comments.commenting, presenting && presenting.index,
    // What the hint line says (hintOf): the tool's lock, a line's points being edited.
    s.activeTool && s.activeTool.locked, !!s.editingLinearElement, !!(s.editingLinearElement && s.editingLinearElement.selectedPointsIndices)];
  const viewOf = (s) => [s.zoom && s.zoom.value, s.scrollX, s.scrollY];
  const same = (a, b) => !!a && !!b && a.length === b.length && a.every((x, i) => x === b[i]);
  let queued = false, shown = null, view = null, viewMoving = null;
  const settle = () => { queued = false; remember(); dropEmptyGroups(); roomForHandle(); leaveComments(); report(); };
  const soon = () => {
    const s = api.getAppState();
    const selected = Object.keys(s.selectedElementIds || {}).length > 0;
    // A box being drawn over nothing, or a line's next point, changes only the hint.
    if (pressing(s)) { if (selected || s.newElement || s.selectionElement || s.multiElement) reportBusy(); return; }
    const now = shownOf(s), at = viewOf(s), moved = !same(at, view);
    if (same(now, shown) && (!moved || viewMoving)) { if (moved && selected) reportBusy(); return; }
    shown = now;
    view = at;
    if (!queued) { queued = true; setTimeout(settle, 16); }
  };
  // The view moving: settled 150 ms after it last moved.
  const viewMoved = () => {
    clearTimeout(viewMoving);
    viewMoving = setTimeout(() => { viewMoving = null; soon(); }, 150);
    soon();
  };
  // Another tool picked on the board itself (a key the engine takes): the Comment tool goes down.
  // Not in view mode (Can comment), where the engine's only tool is the hand it pans with.
  const leaveComments = () => {
    if (!comments || !comments.commenting) return;
    const s = api.getAppState();
    if (s.activeTool.type !== "selection" && !s.viewModeEnabled) comments.tool(false);
  };
  // A group kept selected with none of its elements selected (cards put on the board are
  // selected as a group; a selection cleared by element only left the group): the engine drew
  // its empty selection box at the drawing's origin, a small dark corner bracket by whatever was
  // there (whiteboard council, round 6, 24-note-card-board). Such a group is let go.
  const dropEmptyGroups = () => {
    const s = api.getAppState();
    const groups = Object.keys(s.selectedGroupIds || {}).filter((g) => s.selectedGroupIds[g]);
    if (!groups.length) return;
    const chosen = api.getSceneElements().filter((e) => s.selectedElementIds && s.selectedElementIds[e.id]);
    const live = groups.filter((g) => chosen.some((e) => (e.groupIds || []).includes(g)));
    if (live.length === groups.length) return;
    api.updateScene({ appState: { selectedGroupIds: Object.fromEntries(live.map((g) => [g, true])) }, captureUpdate: CaptureUpdateAction.NEVER });
  };
  // A selection at the top of the view: the view moves down just enough that its rotate handle
  // shows (whiteboard council, round 6: under the toolbar). Once per selection, when it's settled
  // (not while the pointer is down, dragging, or typing), and only when the whole selection fits.
  let roomed = "";
  const roomForHandle = () => {
    const s = api.getAppState();
    const ids = Object.keys(s.selectedElementIds || {}).filter((k) => s.selectedElementIds[k]).sort().join(",");
    if (!ids) { roomed = ""; return; }
    if (ids === roomed || presenting) return;
    if (s.cursorButton === "down" || s.selectionElement || s.selectedElementsAreBeingDragged || s.isResizing || s.isRotating
      || s.newElement || s.multiElement || s.editingTextElement) return;
    roomed = ids;
    const selected = api.getSceneElements().filter((e) => s.selectedElementIds[e.id]);
    // A lone arrow or line has no rotate handle.
    if (!selected.length || (selected.length === 1 && ["arrow", "line"].includes(selected[0].type))) return;
    const z = (s.zoom && s.zoom.value) || 1;
    const [, y1, , y2] = getCommonBounds(selected);
    const top = (y1 + s.scrollY) * z, bottom = (y2 + s.scrollY) * z;
    if (top >= HANDLE_ROOM || top < -((y2 - y1) * z)) return;
    const dy = HANDLE_ROOM - top;
    if (bottom + dy > s.height - 8) return;
    flushSync(() => api.updateScene({ appState: { scrollY: s.scrollY + dy / z }, captureUpdate: CaptureUpdateAction.NEVER }));
  };
  const off = api.onChange(soon);
  const offScroll = api.onScrollChange(viewMoved);
  const offHistory = app && app.history.onHistoryChangedEmitter.on(report);
  // The Mac or iPhone app's web view, not a browser.
  const inApp = !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.amberCanvas);
  // The engine's own dialogs never open; the app's menus keep their keys (⌘K, ⌘F).
  const keys = (e) => {
    // In the app, Tab never takes the keys off the board (real-window check, 17 Nov: Tab went to
    // the board's name in the window's bar, then P renamed the board "p"); ⌃Tab still moves on, as
    // from a Mac text view. Typing, Tab is the text box's own. In a browser, Tab moves on as usual.
    if (inApp && e.key === "Tab" && !e.metaKey && !e.ctrlKey && !e.altKey) e.preventDefault();
    if (presenting) {
      const k = e.key, to = k === "ArrowRight" || k === "ArrowDown" || k === " " || k === "PageDown" ? "next"
        : k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" ? "prev" : k === "Escape" ? "stop" : null;
      if (to) { e.preventDefault(); e.stopImmediatePropagation(); present(api, to); setTimeout(report, 30); return; }
    }
    if (blockedKey(e)) { e.stopImmediatePropagation(); return; }
    // Can view: no keys of the drawing. Can comment: C (and Escape) still pick the Comment tool.
    const viewing = api.getAppState().viewModeEnabled;
    if (viewing && !(comments && comments.inView)) return;
    // S: a sticky note, as in FigJam (the engine's S opens a panel that isn't shown here).
    const typing = e.target && (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" || e.target.isContentEditable);
    // C: the Comment tool, as in FigJam; Escape (or C again) puts it down.
    if (comments && !typing && !e.metaKey && !e.ctrlKey && !e.altKey && !api.getAppState().editingTextElement) {
      const k = (e.key || "").toLowerCase();
      if ((k === "c" && !e.shiftKey) || (k === "escape" && comments.commenting)) {
        e.preventDefault(); e.stopImmediatePropagation();
        if (k === "escape" || comments.commenting) comments.tool(false);
        else {
          if (!viewing && api.getAppState().activeTool.type !== "selection") api.setActiveTool({ type: "selection" });
          comments.tool(true);
        }
        report();
        return;
      }
    }
    if (viewing) return;
    // ⌘A: everything, with the Select tool, as in Excalidraw (the pen stayed picked).
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && (e.key || "").toLowerCase() === "a" && !typing && !api.getAppState().editingTextElement) {
      e.preventDefault(); e.stopImmediatePropagation();
      run("selectAll");
      report();
      return;
    }
    // Tab: a mind map's next branch off the selected shape, as in FigJam (whiteboard council,
    // round 6). While typing in a shape, its words are kept first, then the branch grows from it.
    if (e.key === "Tab" && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey && selecting()) {
      // A Kanban or Retro column, or a Timeline step: the next of its kind (round 15).
      const part = growsFrom(api);
      if (part && (!typing || api.getAppState().editingTextElement)) {
        e.preventDefault(); e.stopImmediatePropagation();
        const go = () => { if (part.kind === "step") addStep(api, part.from); else if (part.kind === "report") addReport(api, part.from); else addColumn(api, part.from); };
        if (api.getAppState().editingTextElement && e.target && e.target.tagName === "TEXTAREA") {
          e.target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true }));
          const now = api.getSceneElements().find((x) => x.id === part.from.id);
          if (now) { part.from = now; go(); }
        } else {
          go();
        }
        return;
      }
      const node = branchFrom(api);
      const words = api.getAppState().editingTextElement;
      if (node && (!typing || words)) {
        e.preventDefault(); e.stopImmediatePropagation();
        if (words && e.target && e.target.tagName === "TEXTAREA") {
          // Escape, as the engine takes it: the words kept, typing over. Then the branch, at once,
          // so the keys after Tab go into it.
          e.target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true }));
          const now = api.getSceneElements().find((x) => x.id === node.id);
          if (now) addBranch(api, now);
        } else {
          addBranch(api, node);
        }
        return;
      }
    }
    if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && !api.getAppState().editingTextElement) {
      const k = (e.key || "").toLowerCase();
      // N, as the app's tool palette shows it, or S, as in FigJam: a sticky note.
      if (k === "s" || k === "n") { e.preventDefault(); e.stopImmediatePropagation(); addSticky(api); return; }
      // 9, Excalidraw's key for a picture: the app's own file panel (the engine's asks the page).
      if (e.key === "9") { e.preventDefault(); e.stopImmediatePropagation(); post({ pickImage: true }); return; }
    }
  };
  // No right-click menu from the engine or the web view: the app shows its own (Mac).
  const menu = (e) => { e.preventDefault(); e.stopImmediatePropagation(); };
  // A note card opens its note: double-click it (the engine would start typing in its words),
  // ⌘-click it, or tap it twice. The app opens the note, or says it's gone.
  const open = (card, e) => {
    e.preventDefault(); e.stopImmediatePropagation();
    try { window.webkit.messageHandlers.amberCanvas.postMessage({ open: card.customData.pintoNote }); } catch (_) {}
  };
  const selecting = () => { const t = api.getAppState().activeTool; return !t || t.type === "selection"; };
  const twice = (e) => { if (!selecting()) return; const card = cardAt(api, e.clientX, e.clientY); if (card) open(card, e); };
  const commandClick = (e) => {
    if (!e.metaKey || e.button !== 0 || !selecting()) return;
    const card = cardAt(api, e.clientX, e.clientY);
    if (card) open(card, e);
  };
  let tapped = null;
  const tap = (e) => {
    if (!e.touches || e.touches.length !== 1 || !selecting()) { tapped = null; return; }
    const t = e.touches[0], card = cardAt(api, t.clientX, t.clientY), now = Date.now();
    if (card && tapped && tapped.id === card.id && now - tapped.at < 400) { tapped = null; open(card, e); return; }
    tapped = card ? { id: card.id, at: now } : null;
  };
  // The comment pins and the Comment tool (comments.js).
  const post = (m) => { try { window.webkit.messageHandlers.amberCanvas.postMessage(m); } catch (_) {} };
  comments = commentsLayer(api, document.getElementById("canvas") || document.body, post, () => setTimeout(report, 0));
  // A vote's total keeps clear of the comment pins (round 16, web-16).
  votes = votesLayer(api, document.getElementById("canvas") || document.body, post, () => (comments ? comments.boxes() : []));
  // The map, at the bottom left above the zoom, while the app says it's on (off at first).
  map = mapLayer(api, document.getElementById("canvas") || document.body, { nonce: sceneNonce, busy: (s) => s.cursorButton === "down" || pressing(s) });
  window.addEventListener("keydown", keys, true);
  window.addEventListener("contextmenu", menu, true);
  window.addEventListener("dblclick", twice, true);
  window.addEventListener("pointerdown", commandClick, true);
  window.addEventListener("touchstart", tap, { capture: true, passive: false });
  Object.defineProperty(amber, "_canvasCommand", { value: command, configurable: true });
  report();
  return { command, state: () => stateOf(api, app), stop: () => {
    presenting = null;
    presentingLook(false);
    if (comments) { comments.stop(); comments = null; }
    if (votes) { votes.stop(); votes = null; }
    if (map) { map.hide(); map = null; }
    off(); offScroll(); offHistory && offHistory(); window.removeEventListener("keydown", keys, true); window.removeEventListener("contextmenu", menu, true);
    window.removeEventListener("dblclick", twice, true); window.removeEventListener("pointerdown", commandClick, true); window.removeEventListener("touchstart", tap, true);
  } };
}

/** Pinto's ink for new strokes (the canvas is drawn light and inverted in dark mode). */
const PINTO_DEFAULTS = { currentItemStrokeColor: "#2a1d10", currentItemFontFamily: 5 };

/**
 * Frames as Excalidraw draws them: named, outlined, and cutting what's in them at their edge. The
 * engine keeps a frame's shapes just under the frame and draws the frame's edge over them, so with
 * the cut off (round 15) a shape run out past the edge showed whole with the frame's line drawn
 * through it (round 15, web-04, web-07, web-10, comment-role-2). A shape mostly outside its frame
 * leaves it instead (leaveFrames): drawn whole, above the frame's line.
 */
export const EDIT_FRAMES = { enabled: true, name: true, outline: true, clip: true };

/**
 * What you drew or moved that lies mostly outside the frame it's in leaves the frame, as one
 * dragged wholly out of it does in Excalidraw, and goes just above the frame, so the frame neither
 * cuts it nor draws its edge through it (round 14, web-04: a shape drawn from inside a frame out
 * past its edge showed as a sliver; round 15: whole, with the frame's line through it). At least
 * half inside, it stays in the frame, cut at the edge as Excalidraw cuts it. One the engine took out
 * of its frame as the drag ended stays where the frame kept it, under the frame's line: it goes
 * above the frames whose edge it crosses too. (A shape bigger than the frame, a backdrop, stays
 * under it.) Grouped shapes are left to the engine, which moves a group in and out of a frame
 * whole. Returns the ids that left a frame or went above one.
 */
export function leaveFrames(api, ids) {
  const all = api.getSceneElementsIncludingDeleted();
  const byId = new Map(all.map((e) => [e.id, e]));
  const index = new Map(all.map((e, i) => [e.id, i]));
  const frames = all.filter((f) => isFrame(f) && !f.isDeleted);
  const area = (b) => Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
  const within = (b, f) => Math.max(0, Math.min(b[2], f.x + f.width) - Math.max(b[0], f.x)) * Math.max(0, Math.min(b[3], f.y + f.height) - Math.max(b[1], f.y));
  const moving = new Map(); // id → { leaves, above: the frame it goes just over }
  for (const id of ids) {
    const e = byId.get(id);
    if (!e || e.isDeleted || isFrame(e) || e.containerId || (e.groupIds && e.groupIds.length)) continue;
    const b = getCommonBounds([e]), size = Math.max(1, area(b));
    const own = e.frameId ? byId.get(e.frameId) : null;
    if (own && !own.isDeleted) {
      if (within(b, own) * 2 >= size) continue;
      moving.set(e.id, { leaves: true, above: own });
      continue;
    }
    if (e.frameId) continue;
    // Out of any frame, under a frame whose edge it crosses (part in, part out, smaller than it).
    const under = frames.filter((f) => index.get(f.id) > index.get(e.id) && within(b, f) > 0 && within(b, f) < size && size < f.width * f.height);
    if (under.length) moving.set(e.id, { leaves: false, above: under.reduce((a, f) => (index.get(f.id) > index.get(a.id) ? f : a)) });
  }
  if (!moving.size) return [];
  const going = new Set(moving.keys());
  // The words in a shape go with it.
  for (const e of all) if (e.containerId && going.has(e.containerId)) going.add(e.id);
  const tops = new Set([...moving.values()].map((m) => m.above.id));
  const rest = all.filter((e) => !going.has(e.id));
  // Just above the last of the frames they go over (the engine keeps a frame above what's in it).
  let at = -1;
  rest.forEach((e, i) => { if (tops.has(e.id)) at = i; });
  const moved = all.filter((e) => going.has(e.id)).map((e) => bump(e, e.frameId ? { frameId: null } : {}));
  api.updateScene({ elements: [...rest.slice(0, at + 1), ...moved, ...rest.slice(at + 1)], captureUpdate: CaptureUpdateAction.NEVER });
  return [...moving.keys()];
}

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

    // Shared with people (shared.js): the app turns it on. The drawing then goes to the app as the
    // elements that changed, and comes back from it whole; the page's own store isn't written.
    let shared = null;
    const post = (m) => { try { window.webkit.messageHandlers.amberCanvas.postMessage(m); } catch (_) {} };
    const settingsOf = (a) => ({ viewBackgroundColor: a.viewBackgroundColor, gridModeEnabled: !!a.gridModeEnabled });
    const sendShared = () => {
      if (!shared) return;
      clearTimeout(shared.timer);
      shared.timer = null;
      // Nothing goes out until the page has had the document's drawing: what it holds before
      // that may be older than the document's.
      if (!shared.ready || api.getAppState().viewModeEnabled) return;
      const changed = changedSince(api.getSceneElementsIncludingDeleted(), shared.known);
      const settings = settingsOf(api.getAppState());
      const moved = JSON.stringify(settings) !== shared.settings;
      if (!changed.length && !moved) return;
      for (const e of changed) shared.known.set(e.id, stamp(e));
      shared.settings = JSON.stringify(settings);
      // A new picture's bytes go with the change that shows it (pasted, dropped, from the Image
      // button or the library): the app seals them and sends them first.
      const files = newPictures(changed, api.getFiles(), shared.files);
      for (const id of Object.keys(files)) shared.files.add(id);
      post({ board: Object.keys(files).length ? { elements: changed, settings, files } : { elements: changed, settings } });
    };
    // A few times a second while you draw, not once you stop: the others see it move.
    const sharedSoon = () => { if (shared && !shared.timer) shared.timer = setTimeout(sendShared, SHARED_DELAY); };

    const save = (now) => {
      if (shared) { sendShared(); return; }
      timer = null;
      // Never in the middle of a stroke or a drag (a pencil stroke changes its points without the
      // scene's nonce, so nothing put the save off while it was drawn): once it ends. Unless the
      // board is going (flush): what's there is kept.
      if (now !== true && pressing(api.getAppState())) { schedule(); return; }
      const scene = sceneFrom(api.getSceneElementsIncludingDeleted(), api.getAppState(), api.getFiles());
      const print = fingerprint(scene);
      if (print === lastSent) return;
      lastSent = print;
      base = scene.elements;
      // Refused (over the size limit): said in the app, and tried again on the next change.
      const kept = amber.store.setJSON ? amber.store.setJSON("scene", sceneText(scene)) : amber.store.set("scene", scene);
      Promise.resolve(kept).then((r) => { if (r && r.ok === false) throw new Error(r.error || "the app refused it"); }).catch((e) => {
        lastSent = null;
        try { window.webkit.messageHandlers.amberCanvas.postMessage({ error: "Not saved: " + String((e && e.message) || e) }); } catch (_) {}
      });
    };
    const flush = () => { if (shared) { if (shared.timer) sendShared(); return; } if (timer) { clearTimeout(timer); save(true); } };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(save, SAVE_DELAY); };

    let wasPressing = false;
    const off = api.onChange((elements, appState, files) => {
      // Pans and zooms change nothing that's kept. A press that just ended is saved whatever the
      // key says: the engine may finish a stroke without a change to the scene's nonce.
      const v = changeKey(elements, appState, files), p = pressing(appState), ended = wasPressing && !p;
      wasPressing = p;
      if (v === lastVersion && !ended) return;
      if (shared) sharedSoon(); else if (lastVersion !== null) schedule();
      lastVersion = v;
    });

    // A picture the shared board couldn't take (no room, or its bytes didn't come with it): off
    // this page again, as it never reached the others. The app says why.
    const refusePictures = (ids) => {
      if (!shared) return;
      const gone = new Set(ids);
      for (const id of gone) shared.known.delete(id);
      api.updateScene({ elements: api.getSceneElementsIncludingDeleted().filter((e) => !gone.has(e.id)), captureUpdate: CaptureUpdateAction.NEVER });
    };

    // Someone else's drawing (the app, from the note's shared document): merged by Excalidraw's own
    // rule, what you have in hand kept. What came is known, so it isn't sent back as yours.
    const takeShared = (scene) => {
      if (!shared || !scene || !Array.isArray(scene.elements)) return false;
      // The board's drawing arriving on an empty page (a link opened in a browser, a board you just
      // joined): shown whole and centred once, at no more than 100% (round 13, web-01: it opened at
      // 100% with its first shape under the title, the rest of the page empty).
      const opening = !shared.opened && !api.getSceneElements().length;
      const { elements: remote, converted, made } = normalizeShared(scene.elements);
      const drawn = expandSeeds(remote);
      for (const e of scene.elements) if (e && typeof e.id === "string") shared.known.set(e.id, stamp(e));
      // The pictures the page doesn't have yet (the app sends each once): drawn as they arrive.
      const files = Object.values(scene.files || {}).filter((f) => f && typeof f.id === "string" && typeof f.dataURL === "string");
      for (const f of files) shared.files.add(f.id);
      if (files.length) api.addFiles(files);
      const merged = reconcile(api.getSceneElementsIncludingDeleted(), drawn.elements, api.getAppState());
      const bg = scene.appState && scene.appState.viewBackgroundColor;
      api.updateScene({ elements: merged, ...(bg ? { appState: { viewBackgroundColor: bg } } : {}), captureUpdate: CaptureUpdateAction.NEVER });
      shared.settings = JSON.stringify(settingsOf(api.getAppState()));
      shared.ready = true;
      if (api.getSceneElements().length) {
        if (opening) openingView(api, amber.fitInsets);
        shared.opened = true;
      }
      // The short form filled out here, or what you have in hand: goes back as yours. Measuring a
      // label bumps it with a random nonce: stamped again, the same on every device.
      if (converted || drawn.changed) {
        remeasure().then(() => {
          if (!shared) return;
          if (made && made.size) {
            const now = api.getSceneElementsIncludingDeleted(), again = restamp(now, made);
            if (again.some((e, i) => e !== now[i])) api.updateScene({ elements: again, captureUpdate: CaptureUpdateAction.NEVER });
          }
          sharedSoon();
        });
      } else sharedSoon();
      return true;
    };

    // Your pointer and selection, for the others (a few times a second at most). With them, for
    // following you (Pane/Collab/BoardFollow.swift): what of the board you see, the frame you're
    // presenting, and your laser's trail since the last time (its points go once).
    let pointer = null, presenceSent = "", presenceTimer = null, laserOn = false;
    const trail = [];
    const presenceNow = () => {
      presenceTimer = null;
      if (!shared) return;
      const s = api.getAppState();
      const sel = Object.keys(s.selectedElementIds || {}).filter((k) => s.selectedElementIds[k]).sort();
      const m = { pointer: pointer ? [Math.round(pointer.x * 10) / 10, Math.round(pointer.y * 10) / 10] : null, sel, view: viewOf(s) };
      if (presenting) {
        const steps = presentSteps(api), i = Math.min(presenting.index, steps.length - 1);
        m.present = { frame: steps[i].id || null, i, n: steps.length };
      }
      if (laserOn || trail.length) m.laser = trail.splice(0);
      const j = JSON.stringify(m);
      if (j === presenceSent) return;
      presenceSent = j;
      post({ presence: m });
    };
    const presenceSoon = () => { if (shared && !presenceTimer) presenceTimer = setTimeout(presenceNow, 50); };
    const offSelection = api.onChange(() => { if (shared) presenceSoon(); });
    const offViewMoved = api.onScrollChange(() => { if (shared) presenceSoon(); });

    // Following someone's view (their presenting, or their avatar's Follow): the app says where to
    // look; moving the board yourself (scrolling, zooming, a press on it, a key that moves it, or
    // Escape) ends it, and the app is told.
    let followingNow = null;
    const unfollow = () => { if (!followingNow) return; followingNow = null; followed.at = null; post({ unfollow: true }); };
    const wheel = () => unfollow();
    const press = (e) => { if (followingNow && !(e.target && e.target.closest && e.target.closest(".pinto-pin"))) unfollow(); };
    const moveKeys = new Set(["Escape", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "+", "-", "=", "0", "1", "2"]);
    const key = (e) => {
      if (!followingNow || !moveKeys.has(e.key)) return;
      const typing = e.target && (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" || e.target.isContentEditable);
      if (typing) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); }
      unfollow();
    };
    window.addEventListener("wheel", wheel, { capture: true, passive: true });
    window.addEventListener("pointerdown", press, true);
    window.addEventListener("keydown", key, true);
    // A shape drawn or moved mostly out of its frame leaves it, once the engine has settled what's
    // in which frame at the end of the press (leaveFrames).
    const released = () => setTimeout(() => {
      const s = api.getAppState();
      if (s.viewModeEnabled || s.newElement || s.selectedElementsAreBeingDragged) return;
      const ids = Object.keys(s.selectedElementIds || {}).filter((k) => s.selectedElementIds[k]);
      if (ids.length) leaveFrames(api, ids);
    }, 0);
    window.addEventListener("pointerup", released, true);
    sharedHooks.follow = (c) => {
      if (!shared) return false;
      if (c.off) { followingNow = null; followed.at = null; return true; }
      followingNow = c;
      followed.at = c;
      return followTo(api, c, viewSize(api));
    };
    sharedHooks.laser = (c) => { if (shared) shared.layer.laser(c.id, c.points); return !!shared; };
    sharedHooks.trails = () => (shared ? shared.layer.trails : {});
    const host = document.getElementById("canvas") || document.body;
    const left = () => { if (pointer) { pointer = null; presenceSoon(); } };
    host.addEventListener("pointerleave", left);

    sharedHooks.set = (c) => {
      if (!c.on) {
        if (shared) { clearTimeout(shared.timer); shared.layer.stop(); }
        shared = null;
        api.updateScene({ appState: { viewModeEnabled: false }, captureUpdate: CaptureUpdateAction.NEVER });
        return;
      }
      if (!shared) { flush(); shared = { known: new Map(), files: new Set(), timer: null, settings: null, ready: false, layer: peersLayer(api, host) }; }
      const view = !!c.viewOnly;
      if (api.getAppState().viewModeEnabled !== view) {
        api.updateScene({ appState: { viewModeEnabled: view, ...(view ? { selectedElementIds: {}, editingTextElement: null } : {}) }, captureUpdate: CaptureUpdateAction.NEVER });
        if (view) api.setActiveTool({ type: "hand" });
        else api.setActiveTool({ type: "selection" });
      }
    };
    sharedHooks.remote = takeShared;
    sharedHooks.refuse = refusePictures;
    // `move: false`: a person's change, outlined where it is; the view stays yours (round 14).
    sharedHooks.outline = (ids, opts = {}) => {
      const want = new Set(ids);
      const all = api.getSceneElements();
      for (const e of all) if (e.containerId && want.has(e.id)) want.add(e.containerId);
      const els = all.filter((e) => want.has(e.id) || (e.containerId && want.has(e.containerId)));
      if (!els.length) return false;
      showChanged(els, opts);
      return true;
    };
    // Opened from a search: the first shape whose words hold it, brought into view and outlined
    // for a moment (round 14: search found a board, and the board opened wherever it was).
    sharedHooks.find = (query) => {
      const els = findWords(api, query);
      if (!els.length) return false;
      showChanged(els, { find: true });
      return true;
    };
    sharedHooks.peers = (list) => { if (shared) shared.layer.set(list); };
    sharedHooks.pointer = (p) => {
      if (!shared || !p || !p.pointer) return;
      pointer = { x: p.pointer.x, y: p.pointer.y };
      // The laser draws while it's pressed: its points go with the next beat.
      laserOn = p.pointer.tool === "laser";
      if (laserOn && p.button === "down" && trail.length < 120) trail.push([Math.round(pointer.x * 10) / 10, Math.round(pointer.y * 10) / 10]);
      presenceSoon();
    };

    // From elsewhere: another device or an AI.
    const unlisten = amber.onChange((note, data) => {
      // A shared board's drawing comes from its document, through the app (takeShared).
      if (shared) return;
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
      // An AI's short note cards are drawn as cards (cards.js).
      const drawn = expandSeeds(merge(api.getSceneElementsIncludingDeleted(), remote, base));
      const merged = drawn.elements;
      const files = Object.values(scene.files || {});
      if (files.length) api.addFiles(files);
      const bg = scene.appState && scene.appState.viewBackgroundColor;
      api.updateScene({ elements: merged, ...(bg ? { appState: { viewBackgroundColor: bg } } : {}), captureUpdate: CaptureUpdateAction.NEVER });
      base = remote;
      lastSent = fingerprint(scene);
      if (scene.elements.some((e) => e && typeof e.seed !== "number")) remeasure();
      // A shape whose words changed counts as changed: its outline goes round the shape, not
      // through it (whiteboard council, round 3, 16).
      const all = api.getSceneElements();
      for (const e of all) if (e.containerId && theirs.has(e.id)) theirs.add(e.containerId);
      showChanged(all.filter((e) => theirs.has(e.id) || (e.containerId && theirs.has(e.containerId))));
      // Ours had changes theirs didn't (or theirs was in the short form): saved back merged.
      if (drawn.changed || !same(merged.map((e) => [e.id, e.version]), remote.map((e) => [e.id, e.version]))) schedule();
    });

    // What came from elsewhere (an AI, another device), for the app to outline: where it is in
    // the view, brought into view first if none of it was.
    // The last change from elsewhere, to show again (whiteboard council, round 7: "a returning
    // user should still be able to see what the AI changed").
    let lastChanged = [];
    Object.defineProperty(amber, "_showLastChange", { configurable: true, value: () => {
      const ids = new Set(lastChanged), els = api.getSceneElements().filter((e) => ids.has(e.id));
      if (!els.length) return false;
      showChanged(els);
      return true;
    } });
    const showChanged = (changed, opts = {}) => {
      if (!changed.length) return;
      if (!opts.find) lastChanged = changed.map((e) => e.id);
      // Each changed thing on its own (round 3, 16: one box round them all took in what the AI
      // didn't touch), and all of them together for bringing into view.
      const ids = new Set(changed.map((e) => e.id));
      // What's in a frame that came too goes in the frame's box (round 14, follow-0: a box in a
      // box in a box when someone drew whole frames).
      const pieces = changed.filter((e) => !(e.containerId && ids.has(e.containerId)) && !(e.frameId && ids.has(e.frameId)));
      // Arrows between outlined shapes go without: a dashed box on each was noise (round 4 check);
      // arrows alone are outlined. `all` (Show change on an AI's comment, which names exactly what
      // its write changed): the arrows too (round 14, comments-4).
      const linear = (e) => e.type === "arrow" || e.type === "line";
      const tops = opts.all || !pieces.some((e) => !linear(e)) ? pieces : pieces.filter((e) => !linear(e));
      const rect = (els, s) => {
        const [x1, y1, x2, y2] = getCommonBounds(els);
        const a = sceneCoordsToViewportCoords({ sceneX: x1, sceneY: y1 }, s), b = sceneCoordsToViewportCoords({ sceneX: x2, sceneY: y2 }, s);
        return [a.x, a.y, b.x - a.x, b.y - a.y];
      };
      const where = () => {
        const s = api.getAppState();
        const [x, y, width, height] = rect(changed, s);
        // A frame's box takes in its name, drawn above it at a fixed size, so the name tag goes
        // above the name, not on it (round 14, follow-0: "Sara" hid "The problem").
        const boxes = tops.map((e) => {
          const b = rect([e, ...changed.filter((t) => t.containerId === e.id)], s);
          return isFrame(e) ? [b[0], b[1] - FRAME_NAME, b[2], b[3] + FRAME_NAME] : b;
        });
        // The rest of what's in view, for the name tag to keep clear of: shapes and words as their
        // boxes, arrows and lines as the lines they draw, heads and all (round 10, 16: an arrow's box
        // is a hairline, and the tag sat against the head of the arrow coming into the shape).
        // Arrows it changed too (round 8, 16: the tag sat on the head of an arrow the AI added).
        const outlined = new Set(tops.map((e) => e.id));
        const all = api.getSceneElements(), byId = new Map(all.map((e) => [e.id, e]));
        const shown = ([nx, ny, nw, nh]) => nx + nw > -40 && ny + nh > -40 && nx < s.width + 40 && ny < s.height + 40;
        const onLine = (e) => e.containerId && byId.get(e.containerId) && linear(byId.get(e.containerId));
        const near = all.filter((e) => !outlined.has(e.id) && !linear(e) && (!e.containerId || onLine(e))).map((e) => rect([e], s))
          .filter(shown).slice(0, 120);
        const lines = all.filter((e) => linear(e) && shown(rect([e], s))).slice(0, 120).map((e) => drawnLine(e, s));
        // Lines of words on their own, which the tag never shares a row with (round 15, 12-ai-drew:
        // "ChatGPT" sat just past the end of the how-to line, four rounds running).
        const rows = all.filter((e) => e.type === "text" && !e.containerId && !outlined.has(e.id)).map((e) => rect([e], s))
          .filter(shown).slice(0, 40);
        return { x, y, width, height, boxes, near, lines: lines.flat(), rows, view: s };
      };
      let r = where();
      const out = opts.move !== false && (r.x < 0 || r.y < 0 || r.x + r.width > r.view.width || r.y + r.height > r.view.height);
      // The whole board when it fits, so what the AI drew is seen next to what it joins: zoomed
      // out to half if the change is out of sight, else only scrolled, and only if some of the
      // board was cut off (round 3, 12: the person's flowchart was off screen).
      if (opts.move === false) {}
      else if (opts.find) {
        // A search's match: in the middle of the view, readable (your zoom when it's near 100%,
        // else 100%), so it isn't found at the board's edge under its controls (round 14).
        const s = r.view, z0 = (s.zoom && s.zoom.value) || 1, z = z0 >= 0.75 && z0 <= 1.5 ? z0 : 1;
        const [x1, y1, x2, y2] = getCommonBounds(changed);
        flushSync(() => api.updateScene({ appState: { zoom: { value: z }, scrollX: -(x1 + x2) / 2 + s.width / 2 / z, scrollY: -(y1 + y2) / 2 + s.height / 2 / z }, captureUpdate: CaptureUpdateAction.NEVER }));
        r = where();
      }
      else if (frameBoard(api, out ? { minZoom: 0.5 } : { onlyIfCut: true })) r = where();
      else if (out) {
        // At the zoom you had, at once (the engine's own scroll lands a frame later).
        const s = r.view, z = (s.zoom && s.zoom.value) || 1;
        let scrollX, scrollY;
        {
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
      // With the ids, so the app can show this change again later (Show Last AI Change, an AI's
      // reply in a thread: round 14), and whether it's a search's match.
      try { window.webkit.messageHandlers.amberCanvas.postMessage({ remote: { x: r.x, y: r.y, width: r.width, height: r.height, boxes: r.boxes, near: r.near, lines: r.lines, rows: r.rows, view: [r.view.width, r.view.height], count: changed.length, ids: changed.filter((e) => !e.containerId).map((e) => e.id), ...(opts.find ? { find: true } : {}) } }); } catch (_) {}
      // While it's shown (the app decides how long), the outline follows the view as you pan,
      // zoom or resize the window (whiteboard council, round 2, 15: it came loose after 8 s).
      outlined = { changed, until: Date.now() + 120000, where };
    };
    let outlined = null;
    // Draw shows a pen where it draws, as FigJam's marker does; the engine's own cursors stay for
    // the rest (crosshair for shapes, grab for the hand, its eraser).
    const pen = api.onChange((_, s) => {
      pencil.tool = !!(s.activeTool && s.activeTool.type === "freedraw") && !s.viewModeEnabled;
      host.classList.toggle("pinto-drawing", pencil.tool);
    });
    const follow = api.onChange(() => {
      if (!outlined) return;
      if (Date.now() > outlined.until) { outlined = null; return; }
      const r = outlined.where();
      try { window.webkit.messageHandlers.amberCanvas.postMessage({ remote: { x: r.x, y: r.y, width: r.width, height: r.height, boxes: r.boxes, near: r.near, lines: r.lines, rows: r.rows, view: [r.view.width, r.view.height], count: outlined.changed.length, follow: true } }); } catch (_) {}
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
    const shrink = { whole: null, timer: 0 };
    const keepCentre = new ResizeObserver(() => {
      const w = area.clientWidth, h = area.clientHeight;
      if (!last || !w || !h) { last = { w, h }; return; }
      const dw = w - last.w, dh = h - last.h, was = last;
      last = { w, h };
      if (!dw && !dh) return;
      const s = api.getAppState(), z = (s.zoom && s.zoom.value) || 1;
      // Was the whole board in view before the window narrowed?
      const els = api.getSceneElements();
      const whole = els.length > 0 && (() => { const [x1, y1, x2, y2] = getCommonBounds(els);
        return (x1 + s.scrollX) * z >= 0 && (y1 + s.scrollY) * z >= 0 && (x2 + s.scrollX) * z <= was.w && (y2 + s.scrollY) * z <= was.h; })();
      // Taken at once: the next step reads it (round 11: a step that came before the engine had
      // taken the last one's scroll lost it, and the drawing settled half that step off centre).
      flushSync(() => api.updateScene({ appState: { scrollX: s.scrollX + dw / 2 / z, scrollY: s.scrollY + dh / 2 / z }, captureUpdate: CaptureUpdateAction.NEVER }));
      // A window resizes in several steps (narrower, wider again as columns settle): whether the
      // board was whole is read at the first, and holds until the steps stop.
      if (shrink.whole === null) shrink.whole = whole;
      clearTimeout(shrink.timer);
      shrink.timer = setTimeout(() => { shrink.whole = null; }, 400);
      const size = { width: w, height: h };
      // A board that was whole stays whole, down to half size (round 4, 15: a narrower window
      // cut the flowchart on both sides); one cut off already stays as it is. More room (Full
      // Screen, a wider window): the whole board if it now fits and was cut off (round 3, 13).
      // Presenting: the step fits the new size (round 6, 25-present-1: step 1 was fitted
      // before Full Screen hid the columns, under-zoomed with the next frame at the edge).
      if (presenting) present(api, presenting.index, undefined, size);
      // Following someone: their view again, at the new size.
      else if (followed.at) followTo(api, followed.at, size);
      else if (shrink.whole) frameBoard(api, { onlyIfCut: true, minZoom: 0.5, size, floor: true });
      else if (dw > 0 || dh > 0) frameBoard(api, { onlyIfCut: true, size });
    });
    if (area) keepCentre.observe(area);
    // For the app's pictures and tests: where the view is, and whether it has taken the board's
    // latest size (the resize steps above all seen, and the engine's own size caught up). A
    // picture taken before then shows the view centred for a size the board no longer has
    // (round 10, 13-fullscreen-dark: 100 pt left of centre).
    Object.defineProperty(amber, "_canvasView", { configurable: true, value: () => {
      const s = api.getAppState(), w = area ? area.clientWidth : s.width, h = area ? area.clientHeight : s.height;
      const els = api.getSceneElements(), z = (s.zoom && s.zoom.value) || 1;
      const b = els.length ? getCommonBounds(els) : null;
      return { width: w, height: h, scrollX: s.scrollX, scrollY: s.scrollY, zoom: z,
        drawing: b ? [(b[0] + s.scrollX) * z, (b[1] + s.scrollY) * z, (b[2] - b[0]) * z, (b[3] - b[1]) * z] : null,
        settled: !!last && last.w === w && last.h === h && s.width === w && s.height === h };
    } });
    Object.defineProperty(amber, "_throughDarkFilter", { value: throughDarkFilter, configurable: true });
    // What the app asks the board and waits for: the selection as a library item, an item's picture.
    const calls = { libraryPiece: () => libraryPiece(api), boardPiece: (a) => boardPiece(api, !!(a && a.selection)), libraryPreview: (a) => libraryPreview(a && a.elements, a && a.files), versionPicture: (a) => versionPicture(a && a.elements, a && a.files, a && a.dark, a && a.background), freeSpot: (a) => freeSpot(api, a.width, a.height) };
    Object.defineProperty(amber, "_canvasCall", { value: async (name, args) => (calls[name] ? calls[name](args) : null), configurable: true });
    Object.defineProperty(amber, "_canvasExport", { value: (format, selected, light, page) => exportScene(api, format, selected, light === true, typeof page === "string" ? page : undefined), configurable: true });
    Object.defineProperty(amber, "_canvas", { value: { api, scene: () => sceneFrom(api.getSceneElementsIncludingDeleted(), api.getAppState(), api.getFiles()), save, command: controls.command, state: controls.state, trails: () => (sharedHooks.trails ? sharedHooks.trails() : {}), votes: () => (votes ? votes.state : null), map: () => map }, configurable: true });
    return () => {
      follow(); pen(); keepCentre.disconnect(); controls.stop(); off(); offSelection(); offViewMoved(); unlisten(); removeEventListener("pagehide", flush);
      window.removeEventListener("wheel", wheel, { capture: true }); window.removeEventListener("pointerdown", press, true); window.removeEventListener("keydown", key, true); window.removeEventListener("pointerup", released, true);
      document.removeEventListener("visibilitychange", hidden); host.removeEventListener("pointerleave", left); flush();
      if (shared) shared.layer.stop();
      for (const k of Object.keys(sharedHooks)) sharedHooks[k] = null;
    };
  }, [api]);

  const setRef = useCallback((a) => setApi(a), []);

  return (
    <Excalidraw
      excalidrawAPI={setRef}
      initialData={{ elements: initial.elements, appState: { ...initial.appState, ...PINTO_DEFAULTS, frameRendering: EDIT_FRAMES, theme }, files: initial.files, scrollToContent: true }}
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
      // Your pointer on a shared board, in the board's own coordinates (shared.js).
      onPointerUpdate={(p) => sharedHooks.pointer && sharedHooks.pointer(p)}
    >
      {/* An empty main menu: no items (its button is hidden with the rest in pinto.css). */}
      <MainMenu />
    </Excalidraw>
  );
}

// Where an open's time goes, for the board benchmark (PaneBench): a mark costs microseconds.
const mark = (name) => { try { performance.mark("amber:" + name); } catch (_) {} };

function start() {
  mark("start");
  const stored = (amber && amber.data && amber.data.values && amber.data.values.scene) || emptyScene();
  const normalized = normalize(stored.elements);
  // An AI's short note cards, drawn as cards and saved back (cards.js).
  const drawn = expandSeeds(normalized.elements);
  const elements = drawn.elements, converted = normalized.converted || drawn.changed;
  const restored = restore({ ...stored, elements }, null, null);
  mark("restored");
  const initial = { stored, elements: restored.elements, appState: { viewBackgroundColor: restored.appState.viewBackgroundColor, gridModeEnabled: restored.appState.gridModeEnabled }, files: restored.files, converted };
  const el = document.getElementById("canvas");
  // Drawn before the page's load event: the app checks something showed.
  const mount = () => { mark("mount"); flushSync(() => createRoot(el).render(<Canvas initial={initial} />)); mark("mounted"); };
  if (!amber || !amber._standby) return mount();
  // A page made ahead (NotePageSandbox.standBy) gets its board before it's on screen, at no size:
  // the engine fits the drawing to the view as it starts, so it starts once the view has its size
  // (or after half a second, as an ordinary page would at any size). The app hears of it after.
  const until = Date.now() + 500;
  let done = false;
  const go = () => {
    if (done || (!(innerWidth > 0 && innerHeight > 0) && Date.now() < until)) return;
    done = true;
    removeEventListener("resize", go);
    try { mount(); } finally { amber._mounted(); }
  };
  addEventListener("resize", go);
  const poll = () => { go(); if (!done) setTimeout(poll, 4); };
  poll();
}

window.EXCALIDRAW_ASSET_PATH = "amber-lib:///canvas/";
// A board's page made ahead of time waits for its board (amber._open); any other page starts now.
if (amber && amber._standby && !amber._opened) {
  amber._whenOpened = start;
  try { window.webkit.messageHandlers.amberReady.postMessage({ standby: true }); } catch (_) {}
} else start();
