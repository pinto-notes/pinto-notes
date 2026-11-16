// Voting on a whiteboard (round 16; FigJam's retro tools): the page's side. The app
// (Pane/Collab/BoardTeam.swift) or the browser (web/lib/board-team.ts) keeps the votes and tells
// the others; the page draws what it's given and says what was clicked.
//
// - While voting is on, a click on a shape or a sticky votes for it: the page says which
//   ({ vote: { on } }), and the press goes no further, so nothing is selected or moved. A click on
//   one of your dots takes it back ({ vote: { off } }). A click on the empty board does what it
//   always does.
// - Your dots sit in a row along the shape's top edge, from its right corner in, in your colour.
// - Ended: each voted shape shows its total in a small badge at its top right corner.
// Votes are never elements: the drawing file, its pictures and the share page leave them out.
import { getCommonBounds, sceneCoordsToViewportCoords, viewportCoordsToSceneCoords } from "@excalidraw/excalidraw";
import { shade } from "./shared.js";
import { shapeAt } from "./comments.js";

export const DOT = { size: 14, gap: 4, inset: 6 };

/** What a vote at this point of the board is for: the topmost shape there (a shape's words count as
 *  the shape), never a line, an arrow, a frame, the board's title or its how-to line. */
export function voteTarget(elements, x, y) {
  const e = shapeAt(elements, x, y);
  if (!e || (e.customData && (e.customData.pintoTitle || e.customData.pintoHint))) return null;
  return e;
}

/**
 * Where a shape's dots go, in the view's points: a row along the top edge from the right corner
 * in, another row under it when the shape is narrow. `box` is the shape's box in the view.
 */
export function dotPlaces(box, n) {
  const step = DOT.size + DOT.gap, inner = Math.max(step, box.width - 2 * DOT.inset);
  const perRow = Math.max(1, Math.floor((inner + DOT.gap) / step));
  const out = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / perRow), col = i % perRow;
    out.push({ x: box.x + box.width - DOT.inset - DOT.size - col * step, y: box.y + DOT.inset + row * step });
  }
  return out;
}

export function votesLayer(api, host, post) {
  const layer = document.createElement("div");
  layer.className = "pinto-votes";
  host.appendChild(layer);
  let on = false, dots = [], results = null;
  const nodes = [];

  const viewBox = (e, s) => {
    const [x1, y1, x2, y2] = getCommonBounds([e]);
    const a = sceneCoordsToViewportCoords({ sceneX: x1, sceneY: y1 }, s), b = sceneCoordsToViewportCoords({ sceneX: x2, sceneY: y2 }, s);
    return { x: a.x - s.offsetLeft, y: a.y - s.offsetTop, width: b.x - a.x, height: b.y - a.y };
  };

  const draw = () => {
    const s = api.getAppState();
    const byId = new Map(api.getSceneElements().map((e) => [e.id, e]));
    let used = 0;
    const take = (cls) => {
      let n = nodes[used];
      if (!n) { n = document.createElement("span"); layer.appendChild(n); nodes.push(n); }
      used++;
      // A node kept from before can have been a dot: nothing of that carries over (a total in the
      // colour of the dot it was, round 16).
      n.className = cls;
      n.style.background = "";
      n.textContent = "";
      n.style.display = "block";
      return n;
    };
    if (results) {
      for (const [id, count] of Object.entries(results)) {
        const e = byId.get(id);
        if (!e || e.isDeleted || !(count > 0)) continue;
        const b = viewBox(e, s);
        const n = take("pinto-vote-total");
        n.textContent = String(count);
        n.dataset.on = id;
        n.style.transform = `translate(${Math.round(b.x + b.width - 10)}px, ${Math.round(b.y - 10)}px)`;
      }
    } else {
      const by = new Map();
      for (const d of dots) { if (!by.has(d.on)) by.set(d.on, []); by.get(d.on).push(d); }
      for (const [id, list] of by) {
        const e = byId.get(id);
        if (!e || e.isDeleted) continue;
        const places = dotPlaces(viewBox(e, s), list.length);
        list.forEach((d, i) => {
          const n = take("pinto-vote-dot");
          n.dataset.on = id;
          n.style.background = shade(d, s.theme);
          n.style.transform = `translate(${Math.round(places[i].x)}px, ${Math.round(places[i].y)}px)`;
        });
      }
    }
    for (let i = used; i < nodes.length; i++) nodes[i].style.display = "none";
    host.classList.toggle("pinto-voting", on);
    layer.classList.toggle("dark", s.theme === "dark");
  };

  // While voting is on: a press on a shape votes for it, on your dot takes it back.
  const press = (e) => {
    if (!on || e.button !== 0) return;
    const t = e.target;
    if (!t || !t.closest) return;
    const dot = t.closest(".pinto-vote-dot");
    if (dot) { e.preventDefault(); e.stopImmediatePropagation(); post({ vote: { off: dot.dataset.on } }); return; }
    if (!t.closest(".excalidraw") || t.closest(".pinto-pin")) return;
    const p = viewportCoordsToSceneCoords({ clientX: e.clientX, clientY: e.clientY }, api.getAppState());
    const target = voteTarget(api.getSceneElements(), p.x, p.y);
    if (!target) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    post({ vote: { on: target.id } });
  };
  window.addEventListener("pointerdown", press, true);
  const off = api.onChange(() => { if (dots.length || results) draw(); });
  const offScroll = api.onScrollChange(() => { if (dots.length || results) draw(); });

  return {
    /** `{ on, dots: [{ on, color, dark }], results: { id: count } | null }` */
    set(c) {
      on = c.on === true;
      dots = Array.isArray(c.dots) ? c.dots.filter((d) => d && typeof d.on === "string" && typeof d.color === "string").slice(0, 200) : [];
      results = c.results && typeof c.results === "object" ? c.results : null;
      draw();
    },
    get state() { return { on, dots: dots.length, results }; },
    draw,
    stop() { off(); offScroll(); window.removeEventListener("pointerdown", press, true); layer.remove(); host.classList.remove("pinto-voting"); },
  };
}
