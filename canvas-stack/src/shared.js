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
import { reconcileElements, restoreElements, convertToExcalidrawElements, getCommonBounds, sceneCoordsToViewportCoords, CaptureUpdateAction } from "@excalidraw/excalidraw";

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
  const joined = joinToBoard(steady, full, named);
  const out = restoreElements([...joined.full, ...joined.made], null, { repairBindings: true, refreshDimensions: false });
  return { elements: restamp(out, ids), converted: true, made: ids };
}

/**
 * Short-form arrows joined to shapes the board already has: an AI writes `"end": { "id": "idea" }`
 * for a shape that's on the board (its README says to), and the engine's conversion joins only
 * shapes written along with the arrow. Those are joined here, both ways; the shape's new version
 * is stamped from its id, so every device makes the same (round 13: Claude's arrow from Inbox into
 * Idea came in loose). `made`: the converted elements; `full`: the board's; `skeletons`: as written.
 */
export function joinToBoard(made, full, skeletons) {
  const board = new Map(full.map((e) => [e.id, e]));
  const asked = new Map();
  for (const s of skeletons) if (s && s.type === "arrow" && s.id) asked.set(s.id, s);
  if (!asked.size) return { made, full };
  const onto = new Map();
  const arrows = made.map((e) => {
    const s = asked.get(e.id);
    if (!s || e.type !== "arrow") return e;
    let next = e;
    for (const [end, key] of [["start", "startBinding"], ["end", "endBinding"]]) {
      const id = s[end] && s[end].id, shape = id && board.get(id);
      if (!shape || shape.isDeleted || (next[key] && next[key].elementId)) continue;
      next = { ...next, [key]: { elementId: id, focus: 0, gap: 4 } };
      onto.set(id, [...(onto.get(id) || []), e.id]);
    }
    return next;
  });
  if (!onto.size) return { made, full };
  const shapes = full.map((t) => {
    const ids = onto.get(t.id);
    if (!ids) return t;
    const have = new Set((t.boundElements || []).map((b) => b.id));
    const add = ids.filter((id) => !have.has(id)).map((id) => ({ id, type: "arrow" }));
    if (!add.length) return t;
    const version = (t.version || 1) + 1;
    return { ...t, boundElements: [...(t.boundElements || []), ...add], version, versionNonce: hash(`${t.id}:nonce:${version}`) };
  });
  return { made: arrows, full: shapes };
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

/** The elements that changed since the page last said, or heard: what goes to the app. */
export function changedSince(elements, known) {
  const out = [];
  for (const e of elements) {
    if (!e || !e.id) continue;
    if (known.get(e.id) !== stamp(e)) out.push(e);
  }
  return out;
}

/**
 * The pictures `elements` show that the app hasn't had yet (`sent`: the file ids it has, from this
 * page or from the shared document), from the engine's files: they go with the change, so the app
 * seals each one and sends it before the change that shows it. A deleted picture's aren't sent.
 */
export function newPictures(elements, files, sent) {
  const out = {};
  for (const e of elements) {
    if (!e || e.type !== "image" || e.isDeleted || typeof e.fileId !== "string" || sent.has(e.fileId)) continue;
    const f = files && files[e.fileId];
    if (f && typeof f.dataURL === "string") out[e.fileId] = { id: e.fileId, dataURL: f.dataURL, mimeType: f.mimeType, created: f.created };
  }
  return out;
}

// MARK: Following someone (Pane/Collab/BoardFollow.swift)

/** What of the board is in view, in its own coordinates: x, y, width, height, to the point. */
export function viewOf(s) {
  const z = (s.zoom && s.zoom.value) || 1;
  return [Math.round(-s.scrollX), Math.round(-s.scrollY), Math.round(s.width / z), Math.round(s.height / z)];
}

/**
 * The view moved to what's followed: the frame someone presents (or the whole board, which has no
 * frames), filling the view as Present fills theirs; or what they see, all of it in view, its
 * middle in the middle. At once, no glide (motion restraint). `size`: the view's new size, when
 * the window is changing it. False when there's nothing to show.
 */
export function followTo(api, c, size) {
  const s = api.getAppState(), W = (size && size.width) || s.width, H = (size && size.height) || s.height;
  if (Array.isArray(c.view) && c.view.length === 4 && c.view.every(Number.isFinite) && c.view[2] > 0 && c.view[3] > 0) {
    const [x, y, w, h] = c.view;
    const z = Math.min(30, Math.max(0.1, Math.min(W / w, H / h)));
    api.updateScene({ appState: { zoom: { value: z }, scrollX: -(x + w / 2) + W / 2 / z, scrollY: -(y + h / 2) + H / 2 / z }, captureUpdate: CaptureUpdateAction.NEVER });
    return true;
  }
  const els = api.getSceneElements();
  const target = typeof c.frame === "string" ? els.filter((e) => e.id === c.frame) : c.whole ? els : [];
  if (!target.length) return false;
  fitTo(api, target, { width: W, height: H });
  return true;
}

/**
 * Fills a view of `size` with `els` (90% of it, as Present shows a frame), its middle in the
 * middle. At once, no glide. The size is the one the page has just measured: the engine's own
 * lags a resize (round 13, 25-present-1: step 1 was fitted to the column Full Screen had just
 * hidden, the cards in the left two thirds and the next frame at the right edge).
 */
export function fitTo(api, els, size, factor = 0.9) {
  if (!els.length) return false;
  const s = api.getAppState(), W = (size && size.width) || s.width, H = (size && size.height) || s.height;
  const [x1, y1, x2, y2] = getCommonBounds(els);
  const z = Math.min(30, Math.max(0.1, Math.min(W / Math.max(1, x2 - x1), H / Math.max(1, y2 - y1)) * factor));
  api.updateScene({ appState: { zoom: { value: z }, scrollX: -(x1 + x2) / 2 + W / 2 / z, scrollY: -(y1 + y2) / 2 + H / 2 / z }, captureUpdate: CaptureUpdateAction.NEVER });
  return true;
}

// MARK: Other people on the board

const FLAG = { height: 16, font: 11, radius: 4, in: 150, out: 200 };
const ARROW = "M1.5 1.5 L1.5 15.5 L5.4 11.8 L8.2 18 L10.8 16.9 L8.1 10.8 L13.5 10.8 Z";

/**
 * The layer over the board where other people show: each one's pointer (a solid arrow in their
 * colour, edged white) with their first name on a small solid flag, and an outline in their colour
 * round what they have selected. Nothing in it takes a click or is see-through.
 */
/**
 * Someone's colour in the board's shade of it (the presence palette, CollabSession.palette):
 * `dark` on a dark board, the same hue lighter, else `color`. Pointers, selections and comment
 * pins all take it.
 */
export const shade = (p, theme) => (theme === "dark" && typeof p.dark === "string" ? p.dark : p.color);

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
    // Each person's colour in the board's shade of it: lighter on a dark board, the same hue
    // (round 10: Emil read slate blue in light and mauve in dark).
    const tint = (p) => shade(p, s.theme);
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
        d.style.borderColor = tint(p);
      });
      // The pointer: where they are on the board, wherever your view is.
      let flagAt = null;
      if (typeof p.x === "number" && typeof p.y === "number") {
        const v = sceneCoordsToViewportCoords({ sceneX: p.x, sceneY: p.y }, s);
        // Glides between the beats it arrives on (a tenth of a second); jumps with the view.
        n.pointer.style.transition = moving && n.at && !still() ? "transform 100ms linear" : "none";
        n.pointer.style.transform = `translate(${v.x - 1.5}px, ${v.y - 1.5}px)`;
        n.pointer.style.display = "block";
        n.pointer.querySelector("path").setAttribute("fill", tint(p));
        n.at = [v.x, v.y];
        flagAt = [v.x + 12, v.y + 17];
      } else {
        n.pointer.style.display = "none";
        n.at = null;
        if (rects.length) flagAt = [rects[0][0], rects[0][1] - FLAG.height - 3];
      }
      n.flag.textContent = p.name || "";
      n.flag.style.background = tint(p);
      if (flagAt) {
        n.flag.style.transition = `opacity ${p.flag ? FLAG.in : FLAG.out}ms ease-out` + (moving && typeof p.x === "number" && !still() ? ", transform 100ms linear" : "");
        n.flag.style.transform = `translate(${flagAt[0]}px, ${flagAt[1]}px)`;
      }
      n.flag.style.opacity = flagAt && p.flag ? "1" : "0";
    }
    for (const [id, n] of nodes) if (!seen.has(id)) { n.root.remove(); nodes.delete(id); }
  };

  // Someone's laser: the trail their pointer drew, in the laser's red, fading over a second as
  // the engine's own does. Points come in beats a tenth of a second apart: each beat's are spread
  // over the tenth before it, so the trail draws on rather than in jumps.
  const trails = new Map();
  let paint = null, frame = 0;
  const LASER = { life: 1000, width: 5, color: "255, 59, 48" };
  const drawTrails = () => {
    frame = 0;
    const now = performance.now(), s = api.getAppState();
    if (!paint) {
      paint = document.createElement("canvas");
      paint.className = "pinto-laser";
      layer.prepend(paint);
    }
    const ratio = window.devicePixelRatio || 1, w = layer.clientWidth || s.width, h = layer.clientHeight || s.height;
    if (paint.width !== Math.round(w * ratio) || paint.height !== Math.round(h * ratio)) { paint.width = Math.round(w * ratio); paint.height = Math.round(h * ratio); }
    const g = paint.getContext("2d");
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    g.clearRect(0, 0, w, h);
    g.lineCap = "round";
    g.lineJoin = "round";
    let live = false;
    for (const [id, pts] of trails) {
      while (pts.length && now - pts[0].t > LASER.life) pts.shift();
      if (!pts.length) { trails.delete(id); continue; }
      live = true;
      const v = pts.map((p) => ({ ...sceneCoordsToViewportCoords({ sceneX: p.x, sceneY: p.y }, s), t: p.t }));
      for (let i = 1; i < v.length; i++) {
        if (v[i].t > now) break;
        const left = 1 - (now - v[i].t) / LASER.life;
        g.strokeStyle = `rgba(${LASER.color}, ${Math.max(0, left)})`;
        g.lineWidth = Math.max(1, LASER.width * left);
        g.shadowColor = `rgba(${LASER.color}, ${0.5 * Math.max(0, left)})`;
        g.shadowBlur = 6;
        g.beginPath();
        g.moveTo(v[i - 1].x - s.offsetLeft, v[i - 1].y - s.offsetTop);
        g.lineTo(v[i].x - s.offsetLeft, v[i].y - s.offsetTop);
        g.stroke();
      }
    }
    if (live) frame = requestAnimationFrame(drawTrails);
  };

  const off = api.onChange(() => { if (peers.length) draw(false); });
  const offScroll = api.onScrollChange(() => { if (peers.length) draw(false); });
  return {
    set(list) { peers = Array.isArray(list) ? list.filter((p) => p && typeof p.id === "string" && typeof p.color === "string") : []; draw(true); },
    get peers() { return peers; },
    /** Their laser's newest points (board coordinates). */
    laser(id, points) {
      const pts = (Array.isArray(points) ? points : []).filter((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)).slice(0, 120);
      if (!pts.length) return true;
      const list = trails.get(id) || [];
      const now = performance.now(), step = 100 / pts.length;
      pts.forEach(([x, y], i) => list.push({ x, y, t: now - 100 + step * (i + 1) }));
      trails.set(id, list.slice(-400));
      // Drawn as they come, then fading frame by frame.
      if (!frame) drawTrails();
      return true;
    },
    /** For tests and pictures: each person's trail as it stands (what hasn't faded), in the view's points. */
    get trails() {
      const s = api.getAppState(), now = performance.now();
      return Object.fromEntries([...trails].map(([id, pts]) => [id, pts.filter((p) => now - p.t <= LASER.life).map((p) => sceneCoordsToViewportCoords({ sceneX: p.x, sceneY: p.y }, s))]).filter(([, pts]) => pts.length));
    },
    stop() { off(); offScroll(); if (frame) cancelAnimationFrame(frame); layer.remove(); },
  };
}
