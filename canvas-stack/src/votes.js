// Voting on a whiteboard (round 16; FigJam's retro tools): the page's side. The app
// (Pane/Collab/BoardTeam.swift) or the browser (web/lib/board-team.ts) keeps the votes and tells
// the others; the page draws what it's given and says what was clicked.
//
// - While voting is on, a click on a shape or a sticky votes for it: the page says which
//   ({ vote: { on } }), and the press goes no further, so nothing is selected or moved. A click on
//   one of your dots takes it back ({ vote: { off } }). A click on the empty board does what it
//   always does.
// - Your dots sit in a row along the shape's top edge, from its right corner in, in your colour,
//   made lighter or darker where it would stand less than 3:1 against what it sits on.
// - Ended: each voted shape shows its total in a small badge at its top right corner, or along its
//   edge where a comment pin is in that corner.
// - While voting, the others' pointers and selections go (pinto.css): where someone points would
//   say how they vote. They come back with the results.
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

// MARK: Colours

const hex2 = (n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
const rgbOf = (hex) => {
  const m = /^#?([0-9a-f]{6})/i.exec(String(hex || "").trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hexOf = (rgb) => "#" + rgb.map(hex2).join("");

/** WCAG's relative luminance of a colour ("#rrggbb"). */
export function luminance(hex) {
  const c = rgbOf(hex) || [0, 0, 0];
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
}

/** WCAG's contrast ratio of two colours, 1 to 21. */
export function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** A colour of the drawing as the board shows it: on a dark board the drawing is drawn light and
 *  turned dark by its filter, invert(100%) then hue-rotate(180deg) (pinto.css). */
export function asShown(hex, theme) {
  const c = rgbOf(hex);
  if (!c) return null;
  if (theme !== "dark") return hexOf(c);
  const [r, g, b] = c.map((v) => 255 - v);
  return hexOf([-0.574 * r + 1.43 * g + 0.144 * b, 0.426 * r + 0.43 * g + 0.144 * b, 0.426 * r + 1.43 * g - 0.856 * b]);
}

/** What a dot on this shape sits on, as the board shows it: its fill when it's solid; its fill and
 *  the board between hatched or dotted lines; the board where it has none. */
export function groundsOf(e, s) {
  const board = asShown(s.viewBackgroundColor || "#ffffff", s.theme) || "#ffffff";
  const fill = e && typeof e.backgroundColor === "string" && e.backgroundColor !== "transparent" ? asShown(e.backgroundColor, s.theme) : null;
  if (!fill) return [board];
  return e.fillStyle === "solid" ? [fill] : [fill, board];
}

const toHsl = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
};
const fromHsl = (h, s, l) => {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const t = (x) => { x = x < 0 ? x + 1 : x > 1 ? x - 1 : x; return x < 1 / 6 ? p + (q - p) * 6 * x : x < 1 / 2 ? q : x < 2 / 3 ? p + (q - p) * (2 / 3 - x) * 6 : p; };
  return [t(h + 1 / 3) * 255, t(h) * 255, t(h - 1 / 3) * 255];
};

/** The least contrast a dot keeps against what it sits on: WCAG's for a graphic you have to see. */
export const DOT_CONTRAST = 3;

/**
 * A dot's colour: the voter's, when it stands at least 3:1 against every ground; else the same
 * hue made lighter (on a dark ground) or darker (on a light one) until it does (round 16, 47-1
 * dark: a blue dot on the navy sticky). Black or white when no shade of it can.
 */
export function dotColor(color, grounds) {
  const base = rgbOf(color);
  if (!base || !grounds.length) return color;
  const ok = (hex) => grounds.every((g) => contrast(hex, g) >= DOT_CONTRAST);
  if (ok(hexOf(base))) return hexOf(base);
  const [h, s, l] = toHsl(base);
  // Away from the ground first: lighter on a ground that white stands out on more than black.
  const darkGround = grounds.reduce((a, g) => a + luminance(g), 0) / grounds.length < 0.179;
  for (const dir of darkGround ? [1, -1] : [-1, 1]) {
    for (let k = 1; k <= 25; k++) {
      const next = l + dir * k * 0.04;
      if (next < 0 || next > 1) break;
      const c = hexOf(fromHsl(h, s, next));
      if (ok(c)) return c;
    }
  }
  const least = (hex) => Math.min(...grounds.map((g) => contrast(hex, g)));
  return least("#ffffff") >= least("#000000") ? "#ffffff" : "#000000";
}

// MARK: Where a total goes

/** A total's badge: 22 points high, as wide as its digits. */
export const BADGE = { height: 22, overhang: 10 };
export const badgeWidth = (count) => Math.max(22, 14 + 7 * String(count).length);

/**
 * Where a shape's total goes, in the layer's points: its top right corner, half off the shape; where
 * a comment pin is there (round 16, web-16: the total sat on Emil's pin), along the top edge to the
 * left, then the bottom edge, then out past the right. `pins`: the pins' boxes, [x, y, w, h].
 */
export function badgePlace(box, width, pins = []) {
  const h = BADGE.height, o = BADGE.overhang, gap = 2;
  const clear = (x, y) => !pins.some(([px, py, pw, ph]) => x < px + pw + gap && x + width > px - gap && y < py + ph + gap && y + h > py - gap);
  const right = box.x + box.width - o, top = box.y - o, bottom = box.y + box.height - h + o;
  const step = width + 4;
  const along = [];
  for (let x = right; x >= box.x - o; x -= step) along.push(x);
  if (along[along.length - 1] !== box.x - o) along.push(box.x - o);
  for (const y of [top, bottom]) for (const x of along) if (clear(x, y)) return { x, y };
  for (let k = 1; k <= 8; k++) if (clear(right + k * step, top)) return { x: right + k * step, y: top };
  return { x: right, y: top };
}

export function votesLayer(api, host, post, pinBoxes = () => []) {
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
      // The pins where the comments layer draws them (it lies over the board as this one does).
      const pins = pinBoxes() || [];
      for (const [id, count] of Object.entries(results)) {
        const e = byId.get(id);
        if (!e || e.isDeleted || !(count > 0)) continue;
        const b = viewBox(e, s);
        const n = take("pinto-vote-total");
        n.textContent = String(count);
        n.dataset.on = id;
        const at = badgePlace(b, badgeWidth(count), pins);
        n.style.transform = `translate(${Math.round(at.x)}px, ${Math.round(at.y)}px)`;
      }
    } else {
      const by = new Map();
      for (const d of dots) { if (!by.has(d.on)) by.set(d.on, []); by.get(d.on).push(d); }
      for (const [id, list] of by) {
        const e = byId.get(id);
        if (!e || e.isDeleted) continue;
        const places = dotPlaces(viewBox(e, s), list.length);
        const grounds = groundsOf(e, s);
        list.forEach((d, i) => {
          const n = take("pinto-vote-dot");
          n.dataset.on = id;
          n.style.background = dotColor(shade(d, s.theme), grounds);
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
