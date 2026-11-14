// A whiteboard shared with people (Pane/Collab/CollabBoard.swift, 14 November 2026).
//
// The drawing lives in the note's shared document, element by element. The page's side of it:
// - What you draw goes to the app as the elements that changed since the page last heard of them
//   (`changedSince`), a few times a second while you draw, not the whole scene.
// - What others drew comes back as the whole scene and is merged by Excalidraw's own rule (the
//   higher version, then the lower nonce), so every device ends with the same drawing. What you're
//   typing, resizing, drawing or dragging right now stays yours until you let go.
// - The short form an AI writes is filled out the same way on every device (ids, seeds and nonces
//   from the element's own id), so two people with the board open don't each add its label.
// - Other people's pointers and selections are drawn over the board in their colour, in the
//   board's own coordinates, so they land on the same spot whatever each person's zoom and scroll.
import { reconcileElements, restoreElements, convertToExcalidrawElements, getCommonBounds, sceneCoordsToViewportCoords } from "@excalidraw/excalidraw";

/** An element's edit, as Excalidraw tells two apart. */
export const stamp = (e) => `${e.version || 0}:${e.versionNonce || 0}`;

/** A small, steady number from a string (FNV-1a), for ids and nonces every device agrees on. */
export function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0) % 2147483647;
}

/**
 * Full elements as stored, and the short form converted the same way on every device: an element
 * the conversion makes (a shape's label, an arrow with no id) gets an id from what it belongs to,
 * and every converted element a seed and nonce from its id.
 */
export function normalizeShared(elements) {
  const list = Array.isArray(elements) ? elements.filter((e) => e && typeof e === "object" && typeof e.type === "string") : [];
  const full = [], skeletons = [];
  for (const e of list) (typeof e.seed === "number" && typeof e.version === "number" ? full : skeletons).push(e);
  if (!skeletons.length) return { elements: restoreElements(full, null, { repairBindings: true, refreshDimensions: false }), converted: false };
  const named = skeletons.map((e, i) => (e.id ? e : { ...e, id: `ai-${hash(JSON.stringify(e))}-${i}` }));
  const own = new Set(named.map((e) => e.id));
  const made = convertToExcalidrawElements(named.map(straightLine), { regenerateIds: false });
  const rename = new Map();
  let n = 0;
  for (const e of made) {
    if (own.has(e.id)) continue;
    rename.set(e.id, e.containerId ? `${e.containerId}-label` : `${named[0].id}-made-${n++}`);
  }
  const to = (id) => (id && rename.has(id) ? rename.get(id) : id);
  // A short form written over an element the board had (an AI's change, through the server) comes
  // with a version newer than the board's: kept, so it wins, and what it makes (its label) with it.
  const given = new Map(named.map((e) => [e.id, typeof e.version === "number" ? e.version : 1]));
  const steady = made.map((e) => {
    const id = to(e.id);
    const version = given.get(e.id) ?? given.get(e.containerId) ?? 1;
    return {
      ...e, id, seed: hash(`${id}:seed`), versionNonce: hash(`${id}:nonce:${version}`), version,
      containerId: to(e.containerId) ?? e.containerId,
      boundElements: e.boundElements ? e.boundElements.map((b) => ({ ...b, id: to(b.id) })) : e.boundElements,
      ...(e.startBinding ? { startBinding: { ...e.startBinding, elementId: to(e.startBinding.elementId) } } : {}),
      ...(e.endBinding ? { endBinding: { ...e.endBinding, elementId: to(e.endBinding.elementId) } } : {}),
    };
  });
  // Repairing bindings bumps what it touches with a random nonce: stamped again from the id, so
  // every device has the same.
  const ids = new Set(steady.map((e) => e.id));
  const out = restoreElements([...full, ...steady], null, { repairBindings: true, refreshDimensions: false });
  return { elements: restamp(out, ids), converted: true, made: ids };
}

/** The elements in `ids` with the nonce every device gives them at their version. */
export function restamp(elements, ids) {
  return elements.map((e) => {
    if (!ids.has(e.id)) return e;
    const versionNonce = hash(`${e.id}:nonce:${e.version}`);
    return e.versionNonce === versionNonce ? e : { ...e, versionNonce };
  });
}

/** An arrow or line written with a size and no points runs along that size (canvas.jsx `straight`). */
function straightLine(e) {
  if ((e.type !== "arrow" && e.type !== "line") || Array.isArray(e.points)) return e;
  const w = typeof e.width === "number" ? e.width : 0, h = typeof e.height === "number" ? e.height : 0;
  return w || h ? { ...e, points: [[0, 0], [w, h]] } : e;
}

/**
 * Someone else's drawing into yours: Excalidraw's rule for each element, and what you have in hand
 * (being typed in, resized, drawn, or dragged) stays as it is until you let go.
 */
export function reconcile(local, remote, appState) {
  const dragged = appState.selectedElementsAreBeingDragged || appState.isResizing || appState.isRotating
    ? new Set(Object.keys(appState.selectedElementIds || {}).filter((k) => appState.selectedElementIds[k])) : null;
  const theirs = dragged ? remote.filter((e) => !dragged.has(e.id)) : remote;
  return reconcileElements(local, theirs, appState);
}

/** The elements that changed since the page last said, or heard: what goes to the app. Pictures
 *  don't (their bytes aren't shared yet). */
export function changedSince(elements, known) {
  const out = [];
  for (const e of elements) {
    if (!e || !e.id || e.type === "image") continue;
    if (known.get(e.id) !== stamp(e)) out.push(e);
  }
  return out;
}

// MARK: Other people on the board

const FLAG = { height: 16, font: 11, radius: 4, in: 150, out: 200 };
const ARROW = "M1.5 1.5 L1.5 15.5 L5.4 11.8 L8.2 18 L10.8 16.9 L8.1 10.8 L13.5 10.8 Z";

/**
 * The layer over the board where other people show: each one's pointer (a solid arrow in their
 * colour, edged white) with their first name on a small solid flag, and an outline in their colour
 * round what they have selected. Nothing in it takes a click or is see-through.
 */
export function peersLayer(api, host) {
  const layer = document.createElement("div");
  layer.className = "pinto-peers";
  layer.setAttribute("aria-hidden", "true");
  host.appendChild(layer);
  const nodes = new Map();
  let peers = [];
  const still = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const node = (id) => {
    let n = nodes.get(id);
    if (n) return n;
    const root = document.createElement("div");
    root.className = "pinto-peer";
    root.dataset.peer = id;
    const boxes = document.createElement("div");
    const pointer = document.createElement("div");
    pointer.className = "pinto-peer-pointer";
    pointer.innerHTML = `<svg width="16" height="20" viewBox="0 0 16 20"><path d="${ARROW}" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
    const flag = document.createElement("div");
    flag.className = "pinto-peer-flag";
    root.append(boxes, pointer, flag);
    layer.appendChild(root);
    n = { root, boxes, pointer, flag, at: null };
    nodes.set(id, n);
    return n;
  };

  const draw = (moving) => {
    const s = api.getAppState();
    const all = api.getSceneElements();
    const byId = new Map(all.map((e) => [e.id, e]));
    const seen = new Set();
    for (const p of peers) {
      seen.add(p.id);
      const n = node(p.id);
      // The selection: one outline per thing, not each word inside a shape it holds.
      const chosen = new Set(p.sel || []);
      const rects = [];
      for (const id of chosen) {
        const e = byId.get(id);
        if (!e || (e.containerId && chosen.has(e.containerId))) continue;
        const [x1, y1, x2, y2] = getCommonBounds([e]);
        const a = sceneCoordsToViewportCoords({ sceneX: x1, sceneY: y1 }, s), b = sceneCoordsToViewportCoords({ sceneX: x2, sceneY: y2 }, s);
        rects.push([a.x - 4, a.y - 4, b.x - a.x + 8, b.y - a.y + 8]);
        if (rects.length >= 60) break;
      }
      while (n.boxes.children.length > rects.length) n.boxes.lastChild.remove();
      while (n.boxes.children.length < rects.length) { const d = document.createElement("div"); d.className = "pinto-peer-box"; n.boxes.appendChild(d); }
      rects.forEach(([x, y, w, h], i) => {
        const d = n.boxes.children[i];
        d.style.transform = `translate(${x}px, ${y}px)`;
        d.style.width = `${Math.max(0, w)}px`;
        d.style.height = `${Math.max(0, h)}px`;
        d.style.borderColor = p.color;
      });
      // The pointer: where they are on the board, wherever your view is.
      let flagAt = null;
      if (typeof p.x === "number" && typeof p.y === "number") {
        const v = sceneCoordsToViewportCoords({ sceneX: p.x, sceneY: p.y }, s);
        // Glides between the beats it arrives on (a tenth of a second); jumps with the view.
        n.pointer.style.transition = moving && n.at && !still() ? "transform 100ms linear" : "none";
        n.pointer.style.transform = `translate(${v.x - 1.5}px, ${v.y - 1.5}px)`;
        n.pointer.style.display = "block";
        n.pointer.querySelector("path").setAttribute("fill", p.color);
        n.at = [v.x, v.y];
        flagAt = [v.x + 12, v.y + 17];
      } else {
        n.pointer.style.display = "none";
        n.at = null;
        if (rects.length) flagAt = [rects[0][0], rects[0][1] - FLAG.height - 3];
      }
      n.flag.textContent = p.name || "";
      n.flag.style.background = p.color;
      if (flagAt) {
        n.flag.style.transition = `opacity ${p.flag ? FLAG.in : FLAG.out}ms ease-out` + (moving && typeof p.x === "number" && !still() ? ", transform 100ms linear" : "");
        n.flag.style.transform = `translate(${flagAt[0]}px, ${flagAt[1]}px)`;
      }
      n.flag.style.opacity = flagAt && p.flag ? "1" : "0";
    }
    for (const [id, n] of nodes) if (!seen.has(id)) { n.root.remove(); nodes.delete(id); }
  };

  const off = api.onChange(() => { if (peers.length) draw(false); });
  const offScroll = api.onScrollChange(() => { if (peers.length) draw(false); });
  return {
    set(list) { peers = Array.isArray(list) ? list.filter((p) => p && typeof p.id === "string" && typeof p.color === "string") : []; draw(true); },
    get peers() { return peers; },
    stop() { off(); offScroll(); layer.remove(); },
  };
}
