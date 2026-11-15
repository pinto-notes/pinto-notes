// Presenting from the browser (board-present.ts): what Present will walk, its keys, and the style
// bar beside an open thread.
import { describe, expect, it } from "vitest";
import { presentHint, presentKey, styleBarShows } from "./board-present";

describe("presenting a shared board from the browser", () => {
  it("says what Present walks", () => {
    expect(presentHint(3)).toBe("3 frames");
    expect(presentHint(1)).toBe("1 frame");
    expect(presentHint(0)).toBe("Whole board");
  });

  it("steps with the arrows, Space and Page keys, and ends with Escape", () => {
    for (const k of ["ArrowRight", "ArrowDown", "PageDown", " "]) expect(presentKey(k)).toBe("next");
    for (const k of ["ArrowLeft", "ArrowUp", "PageUp"]) expect(presentKey(k)).toBe("prev");
    expect(presentKey("Escape")).toBe("stop");
    expect(presentKey("a")).toBeNull();
  });

  it("never puts the style bar over an open thread (round 13, web-06)", () => {
    const selected = { selection: ["s1"], bounds: { x: 100, y: 100, width: 80, height: 40 }, tool: "selection" };
    expect(styleBarShows(selected, true, false)).toBe(true);
    expect(styleBarShows(selected, true, true)).toBe(false);
    expect(styleBarShows(selected, false, false)).toBe(false);
  });
});
