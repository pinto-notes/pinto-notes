// Where a comment's thread (or a new comment's box) opens in the browser: beside its pin, clear of
// the shape it's on and of what's drawn near it, as the app places its popover
// (Pane/Views/BoardCommentViews.swift, CanvasCommentAnchor.placement). Round 15 (comment-role-2,
// web-05, web-06): the browser's box opened over the commented shape, the sticky beside it and
// Emil's pin, while the Mac's thread opened clear of them.
//
// The page (canvas-stack/src/comments.js, around) says where the open pin is, the box of the shape
// it's on, and the boxes of what's near (other shapes, arrows as boxes, other pins), all in the
// frame's points, which are the page's: the board's frame fills the window.

export type Box = [number, number, number, number];
export type Rect = { x: number; y: number; width: number; height: number };
export type Side = "right" | "left" | "above" | "below";

/** The room a thread may use: the window less the title bar at the top and the tools at the foot. */
export type Area = { left: number; top: number; right: number; bottom: number };

const GAP = 12;
const SIDES: Side[] = ["right", "left", "above", "below"];

const rect = ([x, y, width, height]: Box): Rect => ({ x, y, width, height });
const intersection = (a: Rect, b: Rect) => {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x), h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
};
const grow = (r: Rect, by: number): Rect => ({ x: r.x - by, y: r.y - by, width: r.width + 2 * by, height: r.height + 2 * by });

/** The card's frame on one side of `anchor`, slid along that side to stay in the area. */
export function sideFrame(side: Side, anchor: Rect, size: { width: number; height: number }, area: Area): Rect {
  let f: Rect;
  switch (side) {
    case "right": f = { x: anchor.x + anchor.width + GAP, y: anchor.y + anchor.height / 2 - size.height / 2, ...size }; break;
    case "left": f = { x: anchor.x - GAP - size.width, y: anchor.y + anchor.height / 2 - size.height / 2, ...size }; break;
    case "above": f = { x: anchor.x + anchor.width / 2 - size.width / 2, y: anchor.y - GAP - size.height, ...size }; break;
    case "below": f = { x: anchor.x + anchor.width / 2 - size.width / 2, y: anchor.y + anchor.height + GAP, ...size }; break;
  }
  if (side === "above" || side === "below") f.x = Math.min(Math.max(f.x, area.left), Math.max(area.left, area.right - f.width));
  else f.y = Math.min(Math.max(f.y, area.top), Math.max(area.top, area.bottom - f.height));
  return f;
}

/** The part of the shape's box inside the area, so a shape running off screen anchors where it shows. */
function placed(r: Rect, area: Area): Rect {
  const x1 = Math.max(r.x, area.left), y1 = Math.max(r.y, area.top), x2 = Math.min(r.x + r.width, area.right), y2 = Math.min(r.y + r.height, area.bottom);
  return x2 > x1 && y2 > y1 ? { x: x1, y: y1, width: x2 - x1, height: y2 - y1 } : r;
}

/**
 * Where the card goes: beside its pin (right, left, above, below), else off the commented shape's
 * own edges, on the first side where it covers none of the shape and nothing near it and stays in
 * the area. With no side clear, the side beside the pin that covers least (the shape counting four
 * times what's near it).
 */
export function placeThread(pin: Rect, around: { on?: Box | null; near?: Box[] }, size: { width: number; height: number }, area: Area): Rect & { side: Side } {
  const on = around.on ? rect(around.on) : null;
  const near = (around.near ?? []).map(rect);
  const fits = (f: Rect) => f.x >= area.left && f.y >= area.top && f.x + f.width <= area.right && f.y + f.height <= area.bottom;
  const covered = (f: Rect) => {
    let sum = 0;
    for (const k of near) { const i = intersection(f, grow(k, 6)); if (i) sum += Math.max(i, 1); }
    if (on) { const i = intersection(f, grow(on, 6)); if (i) sum += Math.max(i, 1) * 4; }
    return sum;
  };
  const anchors = [pin];
  if (on) anchors.push(placed(on, area));
  // On each side, slid along it (up to half the card, so it still meets its anchor) when the
  // middle lands on something: a pin standing on the shape's corner (comment-role-2) needn't push
  // the card off that side altogether.
  const slides = (along: number) => [0, ...Array.from({ length: Math.floor(along / 2 / 20) }, (_, i) => [-(i + 1) * 20, (i + 1) * 20]).flat()];
  for (const a of anchors) {
    for (const side of SIDES) {
      const base = sideFrame(side, a, size, area), across = side === "above" || side === "below";
      for (const o of slides(across ? size.width : size.height)) {
        const f = across ? { ...base, x: base.x + o } : { ...base, y: base.y + o };
        if (fits(f) && covered(f) === 0) return { ...f, side };
      }
    }
  }
  const scored = SIDES.map((side) => { const f = sideFrame(side, pin, size, area); return { side, f, c: covered(f), fits: fits(f) }; });
  const pool = scored.some((x) => x.fits) ? scored.filter((x) => x.fits) : scored;
  const best = pool.reduce((a, b) => (b.c < a.c ? b : a));
  // Kept in the window whatever happens.
  const x = Math.min(Math.max(best.f.x, area.left), Math.max(area.left, area.right - size.width));
  const y = Math.min(Math.max(best.f.y, area.top), Math.max(area.top, area.bottom - size.height));
  return { x, y, width: size.width, height: size.height, side: best.side };
}

/** The room a thread has in a window of this size: under the title bar, above the tools. */
export function threadArea(width: number, height: number): Area {
  return { left: 12, top: 72, right: width - 12, bottom: height - 84 };
}
