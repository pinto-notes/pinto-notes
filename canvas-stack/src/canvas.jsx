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

const amber = window.amber;
const SAVE_DELAY = 300;
// Deleted elements are kept a while so another device's copy can't bring them back, then dropped.
const KEEP_DELETED_MS = 7 * 24 * 3600 * 1000;

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
  // A picture's crop handles (round 6: "pasted screenshots almost always need trimming").
  crop: "cropEditor",
};
const TOOLS = new Set(["selection", "hand", "rectangle", "diamond", "ellipse", "arrow", "line", "freedraw", "text", "eraser", "frame", "laser"]);

/** Keys that would open the engine's own dialogs and panels, which aren't shown here. */
export function blockedKey(e) {
  const cmd = e.metaKey || e.ctrlKey, k = (e.key || "").toLowerCase();
  if (e.key === "?") return true;                                   // help
  if (cmd && (k === "/" || k === "f" || k === "k" || (e.shiftKey && (k === "p" || k === "e")))) return true; // palette, search, link, export
  if (e.altKey && e.code === "Slash") return true;                  // stats
  if (!cmd && !e.altKey && k === "i") return true;                  // image (F and K pick the frame and the laser, as in Excalidraw)
  return false;
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

export function frameBoard(api, { minZoom, onlyIfCut = false, size } = {}) {
  const els = api.getSceneElements();
  if (!els.length) return false;
  // The view's size: the engine's, or the one just measured when the engine hasn't caught up.
  const s = { ...api.getAppState(), ...(size || {}) }, z = (s.zoom && s.zoom.value) || 1, m = 48;
  if (autoZoom && Math.abs(autoZoom.set - z) > 1e-3) autoZoom = null;
  const cap = autoZoom ? autoZoom.from : z;
  const [x1, y1, x2, y2] = getCommonBounds(els);
  const inView = (x1 + s.scrollX) * z >= 0 && (y1 + s.scrollY) * z >= 0 && (x2 + s.scrollX) * z <= s.width && (y2 + s.scrollY) * z <= s.height;
  const fit = Math.min((s.width - 2 * m) / Math.max(1, x2 - x1), (s.height - 2 * m) / Math.max(1, y2 - y1));
  const nz = Math.min(cap, fit);
  if (onlyIfCut && inView && !(autoZoom && nz > z + 1e-3)) return false;
  if (nz < Math.min(z, minZoom === undefined ? z : minZoom)) return false;
  autoZoom = nz < cap - 1e-3 ? { from: cap, set: nz } : null;
  const scrollX = -(x1 + x2) / 2 + s.width / 2 / nz, scrollY = -(y1 + y2) / 2 + s.height / 2 / nz;
  flushSync(() => api.updateScene({ appState: { scrollX, scrollY, ...(nz !== z ? { zoom: { value: nz } } : {}) }, captureUpdate: CaptureUpdateAction.NEVER }));
  return true;
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

/**
 * A sticky note (whiteboard council, round 2: retro and kanban boards with no sticky tool): a
 * square yellow card whose words wrap inside it and move with it, next to what's selected (so
 * pressing S again makes a row) or in the middle of the view, then typed into at once.
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
  // Typing starts in it, as Return does on a selected shape, once the engine has it (a timer, not
  // an animation frame: frames don't come while the window is hidden).
  // The engine edits what it has selected, so wait until that's the sticky, not the card it
  // was put under (typing went into the card otherwise).
  const start = (tries) => {
    const placed = api.getSceneElements().find((e) => e.id === card.id);
    if (!engine || !placed || typeof engine.startTextEditing !== "function") return;
    const sel = Object.keys((engine.state && engine.state.selectedElementIds) || {});
    if ((sel.length !== 1 || sel[0] !== card.id) && tries > 0) {
      api.updateScene({ appState: { selectedElementIds: { [card.id]: true } } });
      setTimeout(() => start(tries - 1), 20);
      return;
    }
    engine.startTextEditing({ sceneX: placed.x + placed.width / 2, sceneY: placed.y + placed.height / 2, container: placed });
  };
  setTimeout(() => start(20), 30);
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
  // Was the whole board in view? Then it stays whole (round 7, 26-mindmap-tab: the view
  // followed the new branch right and cut the title and left branches).
  const whole = (() => { const v = api.getAppState(), vz = (v.zoom && v.zoom.value) || 1, [a1, b1, a2, b2] = getCommonBounds(api.getSceneElements());
    return (a1 + v.scrollX) * vz >= 0 && (b1 + v.scrollY) * vz >= 0 && (a2 + v.scrollX) * vz <= v.width && (b2 + v.scrollY) * vz <= v.height; })();
  const before = api.getSceneElementsIncludingDeleted().map((e) => (e.id === node.id ? bound(e, [{ id: joined.id, type: "arrow" }]) : e));
  const made = bound(child, [{ id: joined.id, type: "arrow" }]);
  api.updateScene({ elements: [...before, made, joined], appState: { selectedElementIds: { [child.id]: true }, selectedGroupIds: {} }, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
  api.setActiveTool({ type: "selection" });
  // In view: the view follows it down or right, as far as it went out.
  const s = api.getAppState(), z = (s.zoom && s.zoom.value) || 1, m = 40 / z;
  const vx = -s.scrollX, vy = -s.scrollY, vw = s.width / z, vh = s.height / z;
  const dx = x + w + m > vx + vw ? x + w + m - (vx + vw) : 0, dy = y + h + m > vy + vh ? y + h + m - (vy + vh) : 0;
  if ((dx || dy) && !(whole && frameBoard(api, { onlyIfCut: true, minZoom: z * 0.6 }))) flushSync(() => api.updateScene({ appState: { scrollX: s.scrollX - dx, scrollY: s.scrollY - dy }, captureUpdate: CaptureUpdateAction.NEVER }));
  typeInto(api, child.id, { fontSize, color: (words && words.strokeColor) || node.strokeColor, family: words && words.fontFamily });
  return child.id;
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

/** Typing starts in a shape, as Return does on a selected one, once the engine has it selected (a
 *  timer, not an animation frame: frames don't come while the window is hidden). */
function typeInto(api, id, look = null, tries = 20) {
  const start = (left) => {
    const placed = api.getSceneElements().find((e) => e.id === id);
    if (!engine || !placed || typeof engine.startTextEditing !== "function") return;
    const sel = Object.keys((engine.state && engine.state.selectedElementIds) || {});
    if ((sel.length !== 1 || sel[0] !== id) && left > 0) {
      api.updateScene({ appState: { selectedElementIds: { [id]: true } } });
      setTimeout(() => start(left - 1), 20);
      return;
    }
    // The words in the size and ink of the branch it grew from; your own choice back after.
    // Your own is put back once the typing ends: put back at once, the engine read it after,
    // and the new branch's words came out bigger than its parent's (round 7, 26-mindmap-tab).
    const was = look && api.getAppState();
    const set = (a) => api.updateScene({ appState: a, captureUpdate: CaptureUpdateAction.NEVER });
    // At once (flushSync): the engine reads them as it starts.
    if (look) flushSync(() => set({ currentItemFontSize: look.fontSize, currentItemStrokeColor: look.color, ...(look.family ? { currentItemFontFamily: look.family } : {}) }));
    engine.startTextEditing({ sceneX: placed.x + placed.width / 2, sceneY: placed.y + placed.height / 2, container: placed });
    if (look) {
      let waited = 0;
      const back = () => {
        if (api.getAppState().editingTextElement && waited++ < 3000) { setTimeout(back, 100); return; }
        set({ currentItemFontSize: was.currentItemFontSize, currentItemStrokeColor: was.currentItemStrokeColor, currentItemFontFamily: was.currentItemFontFamily });
      };
      setTimeout(back, 100);
    }
  };
  setTimeout(() => start(tries), 30);
}

// MARK: The library (CanvasLibrary in the app)

/**
 * The selection as one library item, as Excalidraw's "Add to library" takes it: what's selected,
 * the words inside selected shapes and on selected arrows, and the pictures its images show.
 * Joins to anything left behind are cut, so the item stands on its own wherever it goes. JSON
 * ({ elements, files }), or null with nothing selected.
 */
export function libraryPiece(api) {
  const ids = api.getAppState().selectedElementIds || {};
  const all = api.getSceneElements();
  const chosen = new Set(all.filter((e) => ids[e.id]).map((e) => e.id));
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
const isFrame = (e) => e.type === "frame" || e.type === "magicframe";
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
export function present(api, to, from) {
  const v = api.getAppState(), vz = (v.zoom && v.zoom.value) || 1;
  if (to === "stop") {
    if (!presenting) return;
    // Done: the view you had before, its middle in the middle (round 5, 25-present-done: it
    // stayed zoomed into the last frame).
    const b = presenting.back, labels = presenting.labels;
    presenting = null;
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
  // the name showed twice).
  const labels = presenting ? presenting.labels : v.frameRendering;
  presenting = { index, back, labels };
  if (first) {
    api.updateScene({ appState: { selectedElementIds: {}, frameRendering: { ...(labels || {}), enabled: true, name: false, outline: false } }, captureUpdate: CaptureUpdateAction.NEVER });
    // Laser on to start; after that the Present bar's toggle decides.
    api.setActiveTool({ type: "laser" });
  }
  const step = steps[index];
  const els = api.getSceneElements();
  const target = step.id ? els.filter((e) => e.id === step.id) : els;
  // At once, no glide (motion restraint; a hidden window never runs the glide).
  if (target.length) api.scrollToContent(target, { fitToViewport: true, viewportZoomFactor: 0.9, animate: false });
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
  const steps = presenting ? presentSteps(api) : null;
  return {
    tool: s.activeTool && s.activeTool.type,
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
    // One note card selected: the app offers to open its note (cards.js). Only cards: the bar
    // has nothing to style, and lines them up as cards, not as their parts.
    card: selectedCard(selected),
    selectedCards: selected.filter(isCard).length,
    onlyCards: selected.length > 0 && selected.every(noteOf),
    // The notes the board's cards name, for the app to send what each says now.
    cardNotes: cardNotes(api.getSceneElements()),
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
  const remember = () => {
    if (replaying) return;
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
    if (name !== "undo" && name !== "redo") { app.actionManager.executeAction(action, "api", value); return; }
    remember();
    replaying = true;
    app.actionManager.executeAction(action, "api", value);
    putBack();
    setTimeout(() => { putBack(); replaying = false; remember(); }, 30);
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
  // Coalesced to one report a frame (a timer: a page off screen gets no animation frames): a pan or a drag changes the state on every move.
  let queued = false;
  const soon = () => { if (!queued) { queued = true; setTimeout(() => { queued = false; remember(); dropEmptyGroups(); roomForHandle(); report(); }, 16); } };
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
  const offScroll = api.onScrollChange(soon);
  const offHistory = app && app.history.onHistoryChangedEmitter.on(report);
  // The engine's own dialogs never open; the app's menus keep their keys (⌘K, ⌘F).
  const keys = (e) => {
    if (presenting) {
      const k = e.key, to = k === "ArrowRight" || k === "ArrowDown" || k === " " || k === "PageDown" ? "next"
        : k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" ? "prev" : k === "Escape" ? "stop" : null;
      if (to) { e.preventDefault(); e.stopImmediatePropagation(); present(api, to); setTimeout(report, 30); return; }
    }
    if (blockedKey(e)) { e.stopImmediatePropagation(); return; }
    // S: a sticky note, as in FigJam (the engine's S opens a panel that isn't shown here).
    const typing = e.target && (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" || e.target.isContentEditable);
    // Tab: a mind map's next branch off the selected shape, as in FigJam (whiteboard council,
    // round 6). While typing in a shape, its words are kept first, then the branch grows from it.
    if (e.key === "Tab" && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey && selecting()) {
      const node = branchFrom(api);
      const words = api.getAppState().editingTextElement;
      if (node && (!typing || words)) {
        e.preventDefault(); e.stopImmediatePropagation();
        if (words && e.target && e.target.tagName === "TEXTAREA") {
          // Escape, as the engine takes it: the words kept, typing over.
          e.target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true }));
          setTimeout(() => { const now = api.getSceneElements().find((x) => x.id === node.id); if (now) addBranch(api, now); }, 30);
        } else {
          addBranch(api, node);
        }
        return;
      }
    }
    if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && (e.key || "").toLowerCase() === "s" && !api.getAppState().editingTextElement) {
      e.preventDefault(); e.stopImmediatePropagation();
      addSticky(api);
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
  window.addEventListener("keydown", keys, true);
  window.addEventListener("contextmenu", menu, true);
  window.addEventListener("dblclick", twice, true);
  window.addEventListener("pointerdown", commandClick, true);
  window.addEventListener("touchstart", tap, { capture: true, passive: false });
  Object.defineProperty(amber, "_canvasCommand", { value: command, configurable: true });
  report();
  return { command, state: () => stateOf(api, app), stop: () => {
    presenting = null;
    off(); offScroll(); offHistory && offHistory(); window.removeEventListener("keydown", keys, true); window.removeEventListener("contextmenu", menu, true);
    window.removeEventListener("dblclick", twice, true); window.removeEventListener("pointerdown", commandClick, true); window.removeEventListener("touchstart", tap, true);
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
    const showChanged = (changed) => {
      if (!changed.length) return;
      lastChanged = changed.map((e) => e.id);
      // Each changed thing on its own (round 3, 16: one box round them all took in what the AI
      // didn't touch), and all of them together for bringing into view.
      const ids = new Set(changed.map((e) => e.id));
      const pieces = changed.filter((e) => !(e.containerId && ids.has(e.containerId)));
      // Arrows between outlined shapes go without: a dashed box on each was noise (round 4 check);
      // arrows alone are outlined.
      const linear = (e) => e.type === "arrow" || e.type === "line";
      const tops = pieces.some((e) => !linear(e)) ? pieces.filter((e) => !linear(e)) : pieces;
      const rect = (els, s) => {
        const [x1, y1, x2, y2] = getCommonBounds(els);
        const a = sceneCoordsToViewportCoords({ sceneX: x1, sceneY: y1 }, s), b = sceneCoordsToViewportCoords({ sceneX: x2, sceneY: y2 }, s);
        return [a.x, a.y, b.x - a.x, b.y - a.y];
      };
      const where = () => {
        const s = api.getAppState();
        const [x, y, width, height] = rect(changed, s);
        const boxes = tops.map((e) => rect([e, ...changed.filter((t) => t.containerId === e.id)], s));
        // The rest of what's in view, for the name tag to keep clear of.
        const near = api.getSceneElements().filter((e) => !ids.has(e.id) && !e.containerId).map((e) => rect([e], s))
          .filter(([nx, ny, nw, nh]) => nx + nw > 0 && ny + nh > 0 && nx < s.width && ny < s.height).slice(0, 120);
        return { x, y, width, height, boxes, near, view: s };
      };
      let r = where();
      const out = r.x < 0 || r.y < 0 || r.x + r.width > r.view.width || r.y + r.height > r.view.height;
      // The whole board when it fits, so what the AI drew is seen next to what it joins: zoomed
      // out to half if the change is out of sight, else only scrolled, and only if some of the
      // board was cut off (round 3, 12: the person's flowchart was off screen).
      if (frameBoard(api, out ? { minZoom: 0.5 } : { onlyIfCut: true })) r = where();
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
      try { window.webkit.messageHandlers.amberCanvas.postMessage({ remote: { x: r.x, y: r.y, width: r.width, height: r.height, boxes: r.boxes, near: r.near, count: changed.length } }); } catch (_) {}
      // While it's shown (the app decides how long), the outline follows the view as you pan,
      // zoom or resize the window (whiteboard council, round 2, 15: it came loose after 8 s).
      outlined = { changed, until: Date.now() + 120000, where };
    };
    let outlined = null;
    const follow = api.onChange(() => {
      if (!outlined) return;
      if (Date.now() > outlined.until) { outlined = null; return; }
      const r = outlined.where();
      try { window.webkit.messageHandlers.amberCanvas.postMessage({ remote: { x: r.x, y: r.y, width: r.width, height: r.height, boxes: r.boxes, near: r.near, count: outlined.changed.length, follow: true } }); } catch (_) {}
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
      api.updateScene({ appState: { scrollX: s.scrollX + dw / 2 / z, scrollY: s.scrollY + dh / 2 / z }, captureUpdate: CaptureUpdateAction.NEVER });
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
      if (presenting) present(api, presenting.index);
      else if (shrink.whole) frameBoard(api, { onlyIfCut: true, minZoom: 0.5, size });
      else if (dw > 0 || dh > 0) frameBoard(api, { onlyIfCut: true, size });
    });
    if (area) keepCentre.observe(area);
    Object.defineProperty(amber, "_throughDarkFilter", { value: throughDarkFilter, configurable: true });
    // What the app asks the board and waits for: the selection as a library item, an item's picture.
    const calls = { libraryPiece: () => libraryPiece(api), libraryPreview: (a) => libraryPreview(a && a.elements, a && a.files), freeSpot: (a) => freeSpot(api, a.width, a.height) };
    Object.defineProperty(amber, "_canvasCall", { value: async (name, args) => (calls[name] ? calls[name](args) : null), configurable: true });
    Object.defineProperty(amber, "_canvasExport", { value: (format, selected, light, page) => exportScene(api, format, selected, light === true, typeof page === "string" ? page : undefined), configurable: true });
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
  const normalized = normalize(stored.elements);
  // An AI's short note cards, drawn as cards and saved back (cards.js).
  const drawn = expandSeeds(normalized.elements);
  const elements = drawn.elements, converted = normalized.converted || drawn.changed;
  const restored = restore({ ...stored, elements }, null, null);
  const initial = { stored, elements: restored.elements, appState: { viewBackgroundColor: restored.appState.viewBackgroundColor, gridModeEnabled: restored.appState.gridModeEnabled }, files: restored.files, converted };
  const el = document.getElementById("canvas");
  // Drawn before the page's load event: the app checks something showed.
  flushSync(() => createRoot(el).render(<Canvas initial={initial} />));
}

window.EXCALIDRAW_ASSET_PATH = "amber-lib:///canvas/";
start();
