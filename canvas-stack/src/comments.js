// Comments on a whiteboard (Pane/Collab/BoardComments.swift, 15 November 2026): the page's side.
//
// - Each open thread is a small solid pin in its writer's colour with their initial, its point on
//   the spot it's about. A pin on a shape stands at a place on the shape's box (a fraction of its
//   width and height), so it moves and grows with it; a pin on a spot stays on that spot of the
//   board. Both in the board's own coordinates: the same place at every zoom and scroll.
// - The layer takes no click; each pin takes clicks on itself only, and opens its thread (a
//   native popover the app shows by the pin, which the page tells where the pin is as it moves).
// - The Comment tool (C): the next click on the board places a comment there, on the shape under
//   it if there is one. Escape puts the tool down.
// Comments are never elements: pictures, the share page and the .excalidraw file leave them out.
import { getCommonBounds, sceneCoordsToViewportCoords, viewportCoordsToSceneCoords } from "@excalidraw/excalidraw";
import { shade } from "./shared.js";

/** A pin: 24 points square, its point (the lower left corner) on the spot. */
export const PIN = { size: 24 };
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** Where a comment points, in the board's coordinates; null when the shape it's on is gone. */
export function pinPoint(pin, byId) {
  if (pin.on) {
    const e = byId.get(pin.on);
    if (!e || e.isDeleted) return null;
    const [x1, y1, x2, y2] = getCommonBounds([e]);
    const fx = clamp01(Number.isFinite(pin.x) ? pin.x : 1), fy = clamp01(Number.isFinite(pin.y) ? pin.y : 0);
    return { x: x1 + fx * (x2 - x1), y: y1 + fy * (y2 - y1) };
  }
  return Number.isFinite(pin.x) && Number.isFinite(pin.y) ? { x: pin.x, y: pin.y } : null;
}

/**
 * What a comment at a point of the board is on: the topmost shape there (a shape's words count as
 * the shape), or nothing. Lines, arrows and frames aren't taken: a comment there is on the spot.
 */
export function shapeAt(elements, x, y) {
  const byId = new Map(elements.map((e) => [e.id, e]));
  for (let i = elements.length - 1; i >= 0; i--) {
    let e = elements[i];
    if (!e || e.isDeleted || ["arrow", "line", "frame", "magicframe", "selection"].includes(e.type)) continue;
    const [x1, y1, x2, y2] = getCommonBounds([e]);
    if (x < x1 || x > x2 || y < y1 || y > y2) continue;
    if (e.containerId) {
      const c = byId.get(e.containerId);
      if (!c || c.type === "arrow" || c.type === "line") continue;
      e = c;
    }
    return e;
  }
  return null;
}

/** Where a new comment at a point of the board goes: on the shape there, as a fraction of its box,
 *  or on the spot. */
export function placeAt(elements, x, y) {
  const e = shapeAt(elements, x, y);
  if (!e) return { x, y };
  const [x1, y1, x2, y2] = getCommonBounds([e]);
  const w = Math.max(1, x2 - x1), h = Math.max(1, y2 - y1);
  const r = (v) => Math.round(v * 1000) / 1000;
  return { on: e.id, x: r(clamp01((x - x1) / w)), y: r(clamp01((y - y1) / h)) };
}

/** A new comment on the selection: on its first shape (not the words inside one), at the top
 *  right corner. Null with nothing selected. */
export function placeOnSelection(api) {
  const s = api.getAppState(), ids = s.selectedElementIds || {};
  const all = api.getSceneElements(), byId = new Map(all.map((e) => [e.id, e]));
  const chosen = all.filter((e) => ids[e.id]);
  const top = chosen.find((e) => !e.containerId) || chosen[0];
  if (!top) return null;
  const e = top.containerId && byId.get(top.containerId) ? byId.get(top.containerId) : top;
  return { on: e.id, x: 1, y: 0 };
}

const BUBBLE = "M4 3.5h16a2.5 2.5 0 0 1 2.5 2.5v9a2.5 2.5 0 0 1-2.5 2.5H10l-5.5 4.2v-4.2H4A2.5 2.5 0 0 1 1.5 15V6A2.5 2.5 0 0 1 4 3.5Z";
/** The Comment tool's pointer: a small speech bubble, solid white edged in ink, its tail on the spot. */
export const CURSOR = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="${BUBBLE}" fill="#ffffff" stroke="#1d1d1f" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 10.5h8M12 6.5v8" stroke="#1d1d1f" stroke-width="1.6" stroke-linecap="round"/></svg>`)}") 4 21, crosshair`;

/**
 * The pins over the board. `post` hands a message to the app. Returns what the bridge drives:
 * `set` (the pins, from the app), the Comment tool (`commenting`), `here` (a comment on the
 * selection or at a point) and `focus` (a pin into view).
 */
export function commentsLayer(api, host, post, changed = () => {}) {
  const layer = document.createElement("div");
  layer.className = "pinto-comments";
  host.appendChild(layer);
  const nodes = new Map();
  let pins = [], me = { color: "#2D639A", dark: "#3677B9", letter: "" }, open = null, draft = null, can = true, commenting = false, sent = "";

  const node = (id) => {
    let n = nodes.get(id);
    if (n) return n;
    const b = document.createElement("button");
    b.className = "pinto-pin";
    b.type = "button";
    b.tabIndex = -1;
    b.dataset.comment = id;
    b.setAttribute("aria-label", "Comment");
    // Its own click only: the board under it never sees the press, so nothing is selected or drawn.
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); });
    b.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      if (id === "draft") return;
      const r = b.getBoundingClientRect();
      post({ comment: { open: id, at: [r.left, r.top, r.width, r.height] } });
    });
    layer.appendChild(b);
    nodes.set(id, b);
    return b;
  };

  const draw = () => {
    const s = api.getAppState();
    const byId = new Map(api.getSceneElements().map((e) => [e.id, e]));
    const list = draft ? [...pins.filter((p) => p.id !== "draft"), { ...draft, id: "draft", color: me.color, dark: me.dark, letter: me.letter, open: true }] : pins;
    const seen = new Set();
    let at = null;
    for (const p of list) {
      seen.add(p.id);
      const b = node(p.id);
      const point = pinPoint(p, byId);
      if (!point) { b.style.display = "none"; continue; }
      const v = sceneCoordsToViewportCoords({ sceneX: point.x, sceneY: point.y }, s);
      b.style.display = "block";
      b.style.transform = `translate(${v.x}px, ${v.y - PIN.size}px)`;
      // The writer's colour, as their pointer has it: the dark shade on a dark board.
      const tint = shade(p, s.theme);
      b.style.background = tint;
      b.style.setProperty("--pin", tint);
      b.textContent = p.letter || "";
      b.classList.toggle("open", p.id === open);
      if (p.id === open) at = { id: p.id, x: v.x, y: v.y - PIN.size, width: PIN.size, height: PIN.size };
    }
    for (const [id, b] of nodes) if (!seen.has(id)) { b.remove(); nodes.delete(id); }
    // Where the open pin is, for the app's popover: when it moved.
    const key = open ? JSON.stringify(at) : "";
    if (open && key !== sent) { sent = key; post({ commentAt: at ? { ...at, x: Math.round(at.x), y: Math.round(at.y) } : { id: open } }); }
    if (!open) sent = "";
  };

  const setCommenting = (on) => {
    const was = commenting;
    commenting = !!on && can && !api.getAppState().viewModeEnabled;
    host.classList.toggle("pinto-commenting", commenting);
    if (commenting) host.style.setProperty("--pinto-comment-cursor", CURSOR);
    if (was !== commenting) changed();
  };

  // A new comment where it goes: drawn at once in your colour, and the app opens its composer.
  const place = (where) => {
    draft = where;
    open = "draft";
    sent = "";
    setCommenting(false);
    post({ comment: { new: where } });
    draw();
  };

  // The Comment tool: a click on the board places a comment; one on a pin opens that pin.
  const press = (e) => {
    if (!commenting || e.button !== 0) return;
    const t = e.target;
    if (!t || !t.closest || t.closest(".pinto-pin") || !t.closest(".excalidraw")) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const p = viewportCoordsToSceneCoords({ clientX: e.clientX, clientY: e.clientY }, api.getAppState());
    place(placeAt(api.getSceneElements(), p.x, p.y));
  };
  window.addEventListener("pointerdown", press, true);

  const off = api.onChange(() => { if (nodes.size || pins.length || draft) draw(); });
  const offScroll = api.onScrollChange(() => { if (nodes.size || pins.length || draft) draw(); });

  return {
    /** The app's pins: `{ pins, me, open, draft, can }`. */
    set(c) {
      pins = Array.isArray(c.pins) ? c.pins.filter((p) => p && typeof p.id === "string" && typeof p.color === "string") : [];
      if (c.me && typeof c.me.color === "string") me = { color: c.me.color, dark: typeof c.me.dark === "string" ? c.me.dark : undefined, letter: String(c.me.letter || "") };
      const was = open;
      open = typeof c.open === "string" ? c.open : null;
      if (open !== was) sent = "";
      draft = c.draft && typeof c.draft === "object" && Number.isFinite(c.draft.x) ? c.draft : null;
      can = c.can !== false;
      if (!can) setCommenting(false);
      draw();
    },
    get pins() { return pins; },
    get commenting() { return commenting; },
    /** The Comment tool, on or off. False when you can't comment here. */
    tool(on) { setCommenting(on); return commenting === !!on; },
    /** A comment on the selection, or at a point of the page (`x`, `y`). */
    here(x, y) {
      if (!can || api.getAppState().viewModeEnabled) return false;
      let where = null;
      if (Number.isFinite(x) && Number.isFinite(y)) {
        const p = viewportCoordsToSceneCoords({ clientX: x, clientY: y }, api.getAppState());
        where = placeAt(api.getSceneElements(), p.x, p.y);
      } else where = placeOnSelection(api);
      if (!where) return false;
      place(where);
      return true;
    },
    /** Brings a pin into view when none of it shows, at the zoom you have; then says where it is. */
    focus(id) {
      const p = pins.find((x) => x.id === id);
      if (!p) return false;
      const point = pinPoint(p, new Map(api.getSceneElements().map((e) => [e.id, e])));
      if (!point) return false;
      const s = api.getAppState(), z = (s.zoom && s.zoom.value) || 1;
      const v = sceneCoordsToViewportCoords({ sceneX: point.x, sceneY: point.y }, s);
      const m = 60;
      if (v.x < s.offsetLeft + m || v.y < s.offsetTop + m + PIN.size || v.x > s.offsetLeft + s.width - m || v.y > s.offsetTop + s.height - m) {
        api.updateScene({ appState: { scrollX: -point.x + s.width / 2 / z, scrollY: -point.y + s.height / 2 / z } });
      }
      sent = "";
      draw();
      return true;
    },
    draw,
    stop() { off(); offScroll(); window.removeEventListener("pointerdown", press, true); layer.remove(); },
  };
}
