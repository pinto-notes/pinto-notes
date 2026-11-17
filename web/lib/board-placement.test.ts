// Where the browser opens a comment's thread, as the app places its popover
// (PaneTests/BoardCommentsCanvasTests, comments-2): beside the pin, clear of the shape it's on and
// of what's near. Round 15 (comment-role-2, web-05, web-06): the browser's box covered the commented
// box, the yellow sticky beside it and Emil's pin.
import { describe, expect, it } from "vitest";
import { placeThread, threadArea, type Box, type Rect } from "./board-placement";

const overlaps = (a: Rect, [x, y, w, h]: Box) => a.x < x + w && a.x + a.width > x && a.y < y + h && a.y + a.height > y;
const area = threadArea(1280, 800);

describe("a comment's thread in the browser", () => {
  // comment-role-2 as it was: the app's box (the comment on it), the yellow sticky below and to
  // its right, Emil's pin on the box's corner, in a 1280 by 800 window.
  const box: Box = [318, 291, 200, 104], sticky: Box = [500, 410, 126, 74], emilsPin: Box = [416, 270, 24, 24];
  const pin: Rect = { x: 345, y: 290, width: 24, height: 24 };

  it("opens clear of the commented shape, the sticky beside it and the other pin", () => {
    const at = placeThread(pin, { on: box, near: [sticky, emilsPin] }, { width: 340, height: 160 }, area);
    for (const k of [box, sticky, emilsPin]) expect(overlaps(at, k), JSON.stringify({ at, k })).toBe(false);
    expect(at.x).toBeGreaterThanOrEqual(area.left);
    expect(at.x + at.width).toBeLessThanOrEqual(area.right);
    expect(at.y).toBeGreaterThanOrEqual(area.top);
    expect(at.y + at.height).toBeLessThanOrEqual(area.bottom);
  });

  it("beside the pin first, on its right, when that's clear", () => {
    const at = placeThread({ x: 600, y: 300, width: 24, height: 24 }, { on: null, near: [] }, { width: 340, height: 160 }, area);
    expect(at.side).toBe("right");
    expect(at.x).toBe(600 + 24 + 12);
  });

  it("off the shape's own edge when every side of the pin lands on something", () => {
    // A pin in the middle of a wide shape: right and left of the pin are on the shape.
    const wide: Box = [200, 300, 800, 120];
    const at = placeThread({ x: 590, y: 330, width: 24, height: 24 }, { on: wide, near: [] }, { width: 340, height: 160 }, area);
    expect(overlaps(at, wide)).toBe(false);
  });

  it("with no side clear, the side that covers least, kept in the window", () => {
    const full: Box[] = [[0, 0, 1280, 800]];
    const at = placeThread({ x: 1240, y: 700, width: 24, height: 24 }, { on: null, near: full }, { width: 340, height: 200 }, area);
    expect(at.x + at.width).toBeLessThanOrEqual(area.right);
    expect(at.y + at.height).toBeLessThanOrEqual(area.bottom);
  });
});
