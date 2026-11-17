// @vitest-environment happy-dom
// The browser board's bar over a selection and its tools: the app's palette, in Excalidraw's order
// with its keys, at the top in the middle, at the foot on a phone (round 12: a shape picked in the
// browser had nothing to change it with, and at 390 pt the toolbar ran off the right edge; 17
// November 2026: the same tools as the app).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { HintLine, StyleBar, ToolBar, ZoomControl } from "@/app/s/[id]/BoardControls";
import type { PageState } from "./board-host";
import { barPlace, FILLS, FOLD_ORDER, hintFor, hintParts, keysOf, offers, PALETTE, paletteWidth, PHONE, placePalette, showsBar, STROKES, WIDTHS } from "./board-style";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null, host: HTMLDivElement | null = null;
afterEach(() => { act(() => root?.unmount()); host?.remove(); root = null; host = null; });
function mount(el: React.ReactElement) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root!.render(el));
  return host;
}
const click = (el: Element | null | undefined) => { if (!el) throw new Error("not there"); act(() => (el as HTMLElement).click()); };
const byLabel = (h: HTMLElement, label: string) => h.querySelector(`[aria-label="${label}"]`);

const box: PageState = {
  tool: "selection", selection: ["rectangle"], bounds: { x: 500, y: 400, width: 200, height: 100 }, canUndo: true,
  style: { strokeColor: "#2a1d10", backgroundColor: "#ffec99", fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid", arrowType: "sharp", endArrowhead: "arrow" },
};

describe("what the bar over a selection offers", () => {
  it("is the app's: stroke colour, fill for shapes, width and line, arrow type for arrows, and More", () => {
    expect(offers(["rectangle"])).toEqual({ stroke: true, fill: true, width: true, arrow: false });
    expect(offers(["arrow"])).toEqual({ stroke: true, fill: false, width: true, arrow: true });
    expect(offers(["text"])).toEqual({ stroke: true, fill: false, width: false, arrow: false });
    expect(offers(["image"])).toEqual({ stroke: false, fill: false, width: false, arrow: false });
    expect(offers(["ellipse", "arrow"])).toEqual({ stroke: true, fill: true, width: true, arrow: true });
    // The same choices as the app's CanvasStyle.
    expect(STROKES.map((c) => c.value)).toEqual(["#2a1d10", "#e03131", "#f08c00", "#2f9e44", "#1971c2", "#9c36b5"]);
    expect(FILLS[0].value).toBe("transparent");
    expect(WIDTHS.map((w) => w.value)).toEqual([1, 2, 4]);
    const swift = readFileSync(join(process.cwd(), "..", "Pane", "Model", "CanvasBridge.swift"), "utf8");
    for (const c of [...STROKES, ...FILLS]) expect(swift).toContain(`hex: "${c.value}"`);
  });

  it("shows only while something you can edit is picked and you're not moving, typing or commenting", () => {
    expect(showsBar(box, true)).toBe(true);
    expect(showsBar(box, false)).toBe(false);
    expect(showsBar({ ...box, busy: true }, true)).toBe(false);
    expect(showsBar({ ...box, editing: true }, true)).toBe(false);
    expect(showsBar({ ...box, tool: "comment" }, true)).toBe(false);
    expect(showsBar({ ...box, selection: [], bounds: null }, true)).toBe(false);
  });

  it("floats over the selection, under it when the top bar is in the way, never past the window", () => {
    const view = { width: 1280, height: 800 }, bar = { width: 220, height: 48 };
    expect(barPlace({ x: 500, y: 400, width: 200, height: 100 }, view, bar, false)).toEqual({ left: 490, top: 340 });
    // Near the top: under it.
    expect(barPlace({ x: 500, y: 80, width: 200, height: 100 }, view, bar, false)).toEqual({ left: 490, top: 192 });
    // At the sides: inside the window.
    expect(barPlace({ x: -100, y: 400, width: 80, height: 60 }, view, bar, false)!.left).toBe(12);
    expect(barPlace({ x: 1250, y: 400, width: 80, height: 60 }, view, bar, false)!.left).toBe(1280 - 12 - 220);
    // At phone width it docks over the tools.
    expect(barPlace({ x: 100, y: 400, width: 80, height: 60 }, { width: 390, height: 844 }, bar, true)).toBeNull();
  });

  it("sets the style through the page, and has Duplicate and Delete under More", () => {
    const sent: Record<string, unknown>[] = [];
    const h = mount(<StyleBar state={box} command={(c) => sent.push(c)} width={1280} height={800} />);
    const bar = h.querySelector('[role="toolbar"][aria-label="Selection"]') as HTMLElement;
    expect(bar).not.toBeNull();
    expect([...bar.querySelectorAll(":scope > button")].map((b) => b.getAttribute("aria-label"))).toEqual(["Stroke colour", "Fill", "Stroke width", "More"]);
    // Centred over the box, above it (happy-dom measures nothing, so the bar's first guess of its size).
    const at = barPlace(box.bounds!, { width: 1280, height: 800 }, { width: 240, height: 48 }, false)!;
    expect([bar.style.left, bar.style.top]).toEqual([`${at.left}px`, `${at.top}px`]);
    expect(at.top + 48).toBeLessThanOrEqual(box.bounds!.y);
    click(byLabel(h, "Stroke colour"));
    click(h.querySelector('[role="menu"] [aria-label="Blue"]'));
    expect(sent.pop()).toEqual({ op: "style", key: "strokeColor", value: "#1971c2" });
    click(byLabel(h, "Fill"));
    expect(h.querySelector('[role="menu"] [aria-label="Yellow"]')?.getAttribute("aria-checked")).toBe("true");
    click(h.querySelector('[role="menu"] [aria-label="Green"]'));
    expect(sent.pop()).toEqual({ op: "style", key: "backgroundColor", value: "#b2f2bb" });
    click(byLabel(h, "Stroke width"));
    click([...h.querySelectorAll('[role="menu"] button')].find((b) => b.textContent === "Extra bold"));
    expect(sent.pop()).toEqual({ op: "style", key: "strokeWidth", value: 4 });
    click([...h.querySelectorAll('[role="menu"] button')].find((b) => b.textContent === "Dashed"));
    expect(sent.pop()).toEqual({ op: "style", key: "strokeStyle", value: "dashed" });
    click(byLabel(h, "More"));
    const more = [...h.querySelectorAll('[role="menu"] button')].map((b) => b.textContent);
    expect(more).toEqual(["Duplicate", "Bring to Front", "Send to Back", "Delete"]);
    click([...h.querySelectorAll('[role="menu"] button')].find((b) => b.textContent === "Duplicate"));
    expect(sent.pop()).toEqual({ op: "action", name: "duplicate" });
    expect(h.querySelector('[role="menu"]')).toBeNull();
    click(byLabel(h, "More"));
    click([...h.querySelectorAll('[role="menu"] button')].find((b) => b.textContent === "Delete"));
    expect(sent.pop()).toEqual({ op: "action", name: "delete" });
  });

  it("offers an arrow's type and head for an arrow", () => {
    const sent: Record<string, unknown>[] = [];
    const h = mount(<StyleBar state={{ ...box, selection: ["arrow"] }} command={(c) => sent.push(c)} width={1280} height={800} />);
    expect(byLabel(h, "Fill")).toBeNull();
    click(byLabel(h, "Arrow type"));
    click([...h.querySelectorAll('[role="menu"] button')].find((b) => b.textContent === "Elbow"));
    expect(sent.pop()).toEqual({ op: "style", key: "arrowType", value: "elbow" });
    click([...h.querySelectorAll('[role="menu"] button')].find((b) => b.textContent === "None"));
    expect(sent.pop()).toEqual({ op: "style", key: "endArrowhead", value: null });
  });
});

describe("the palette: the app's tools in Excalidraw's order, with its keys", () => {
  const labels = (h: HTMLElement) => [...h.querySelectorAll('nav[aria-label="Tools"] button')].map((b) => b.getAttribute("aria-label"));

  it("has the lock, the hand and the tools by their numbers, then More, each named with its keys", () => {
    expect(PALETTE).toEqual([["lock"], ["hand", "selection", "rectangle", "diamond", "ellipse", "arrow", "line", "freedraw", "text", "sticky", "image", "eraser", "comment"], ["more"]]);
    // Excalidraw's keys: a letter, and 1 to 0 (9 is a picture); Q the lock, H the hand, N a sticky note.
    expect(PALETTE[1].map(keysOf)).toEqual([["H"], ["V", "1"], ["R", "2"], ["D", "3"], ["O", "4"], ["A", "5"], ["L", "6"], ["P", "7"], ["T", "8"], ["N"], ["9"], ["E", "0"], ["C"]]);
    expect(keysOf("lock")).toEqual(["Q"]);
    const h = mount(<ToolBar state={{ tool: "selection" }} command={() => {}} width={1280} side={200} />);
    expect(labels(h)).toEqual(["Keep selected tool active after drawing (Q)", "Hand (H)", "Select (V or 1)", "Rectangle (R or 2)", "Diamond (D or 3)", "Ellipse (O or 4)",
      "Arrow (A or 5)", "Line (L or 6)", "Pencil (P or 7)", "Text (T or 8)", "Sticky Note (N)", "Insert Image (9)", "Eraser (E or 0)", "Comment (C)", "More tools"]);
    // Each tool's letter in its corner, as Excalidraw's toolbar shows it; none on the hand, a picture, the lock or More.
    const letters = [...h.querySelectorAll('nav[aria-label="Tools"] button')].map((b) => b.querySelector("span")?.textContent ?? "");
    expect(letters).toEqual(["", "", "V", "R", "D", "O", "A", "L", "P", "T", "N", "", "E", "C", ""]);
    // A thin line between the three groups, and no Undo here: it's by the zoom.
    expect(h.querySelectorAll('nav[aria-label="Tools"] [data-rule]').length).toBe(2);
    expect(byLabel(h, "Undo")).toBeNull();
  });

  it("picks a tool, turns the lock, adds a sticky note, asks for a picture; the tool you have is pressed", () => {
    const sent: Record<string, unknown>[] = [];
    let asked = 0;
    const h = mount(<ToolBar state={{ tool: "rectangle", locked: false }} command={(c) => sent.push(c)} width={1280} side={200} pickImage={() => asked++} />);
    expect(byLabel(h, "Rectangle (R or 2)")!.getAttribute("aria-pressed")).toBe("true");
    expect(byLabel(h, "Select (V or 1)")!.getAttribute("aria-pressed")).toBe("false");
    click(byLabel(h, "Arrow (A or 5)"));
    expect(sent.pop()).toEqual({ op: "tool", tool: "arrow" });
    click(byLabel(h, "Keep selected tool active after drawing (Q)"));
    expect(sent.pop()).toEqual({ op: "lock", on: true });
    click(byLabel(h, "Sticky Note (N)"));
    expect(sent.pop()).toEqual({ op: "sticky" });
    // A sticky note and a picture are added, never held.
    expect(byLabel(h, "Sticky Note (N)")!.hasAttribute("aria-pressed")).toBe(false);
    click(byLabel(h, "Insert Image (9)"));
    expect(asked).toBe(1);
    expect(sent).toEqual([]);
  });

  it("More has Excalidraw's more tools, and the one picked from it shows on it", () => {
    const sent: Record<string, unknown>[] = [];
    const h = mount(<ToolBar state={{ tool: "laser" }} command={(c) => sent.push(c)} width={1280} side={200} />);
    const more = byLabel(h, "More tools")!;
    expect(more.getAttribute("aria-pressed")).toBe("true");
    click(more);
    expect([...h.querySelectorAll('[role="menu"][aria-label="More tools"] button')].map((b) => b.textContent)).toEqual(["FrameF", "Laser PointerK"]);
    click([...h.querySelectorAll('[role="menu"] button')].find((b) => b.textContent === "FrameF"));
    expect(sent.pop()).toEqual({ op: "tool", tool: "frame" });
    expect(h.querySelector('[role="menu"]')).toBeNull();
  });

  it("stands at the top in the middle where it fits between the name and the people, else in a row under them, folding what doesn't fit", () => {
    const full = paletteWidth(PALETTE);
    expect(placePalette(1280, 200)).toEqual({ at: "top", groups: PALETTE, folded: [] });
    // Not between them: under them, all of it while it fits the window.
    expect(placePalette(1000, 360)).toMatchObject({ at: "below", folded: [] });
    expect(placePalette(full + 24, 400).folded).toEqual([]);
    // Narrower: the app's order of what waits in More, until it fits.
    const narrow = placePalette(full + 23, 400);
    expect(narrow.folded).toEqual([FOLD_ORDER[0]]);
    expect(paletteWidth(narrow.groups)).toBeLessThanOrEqual(full - 1);
    const h = mount(<ToolBar state={{ tool: "selection" }} command={() => {}} width={1000} side={360} />);
    expect(h.querySelector("[data-palette-place]")!.getAttribute("data-palette-place")).toBe("below");
  });

  it("shows Excalidraw's hint under it, its keys as keys, and none while a menu is open", () => {
    const h = mount(<ToolBar state={{ tool: "selection", hint: "To move canvas, hold mouse wheel or spacebar while dragging, or use the hand tool" }} command={() => {}} width={1280} side={200} />);
    const hint = h.querySelector("[data-hint]")!;
    expect(hint.textContent).toBe("To move canvas, hold mouse wheel or spacebar while dragging, or use the hand tool");
    expect([...hint.querySelectorAll("kbd")].map((k) => k.textContent)).toEqual(["spacebar"]);
    click(byLabel(h, "More tools"));
    expect(h.querySelector("[data-hint]")).toBeNull();
    // On a phone there are no keys to press: no hint.
    const phone = mount(<ToolBar state={{ tool: "selection", hint: "Click and drag" }} command={() => {}} width={390} />);
    expect(phone.querySelector("[data-hint]")).toBeNull();
  });

  it("draws the hint's keys as keys, as the app does, in the visitor's keys", () => {
    expect(hintParts("Press Escape or Cmd+Enter to finish editing")).toEqual([
      { words: "Press " }, { key: "Escape" }, { words: " or " }, { key: "Cmd" }, { words: "+" }, { key: "Enter" }, { words: " to finish editing" },
    ]);
    expect(hintParts("Click to start multiple points, drag for single line. Press A again to change arrow type.")).toEqual([
      { words: "Click to start multiple points, drag for single line. Press " }, { key: "A" }, { words: " again to change arrow type." },
    ]);
    expect(hintParts("Click and drag, release when you're finished")).toEqual([{ words: "Click and drag, release when you're finished" }]);
    for (const line of ["Select a point to edit (hold Shift to select multiple), or hold Option and click to add new points", "Click outside the image or press Enter or ESCAPE to finish cropping"]) {
      expect(hintParts(line).map((p) => ("key" in p ? p.key : p.words)).join("")).toBe(line);
    }
    // The page says the Mac's keys; elsewhere they're Ctrl and Alt.
    expect(hintFor("Hold Cmd and Double-click or press Cmd + Enter, or hold Option", false)).toBe("Hold Ctrl and Double-click or press Ctrl + Enter, or hold Alt");
    expect(hintFor("Cmd+D", true)).toBe("Cmd+D");
    const h = mount(<HintLine text="Press Escape or Cmd+Enter to finish editing" />);
    expect([...h.querySelectorAll("kbd")].length).toBe(3);
  });
});

describe("the tools at phone width", () => {
  it("are the ones used most at the foot, the rest in More Tools, so nothing runs off a 390 pt window", () => {
    const phone = placePalette(390, 0);
    expect(phone.at).toBe("foot");
    expect(phone.groups.flat()).toEqual(["hand", "selection", "freedraw", "text", "more"]);
    expect([...phone.groups.flat(), ...phone.folded].sort()).toEqual([...PALETTE.flat()].sort());
    expect(placePalette(PHONE + 1, 0).at).not.toBe("foot");
    // Shown, More Tools, Undo and Redo, at 40 pt each with the gaps, the line and the bar's
    // padding, fit 390 less the 12 pt margins.
    expect((phone.groups.flat().length + 2) * 42 + 10 + 11 + 12).toBeLessThanOrEqual(390 - 24);
  });

  it("fold the rest into More Tools, with its chevron, and the picked one shows on it", () => {
    const sent: Record<string, unknown>[] = [];
    const h = mount(<ToolBar state={{ tool: "rectangle", canUndo: true }} command={(c) => sent.push(c)} width={390} />);
    const nav = h.querySelector('nav[aria-label="Tools"]')!;
    expect([...nav.querySelectorAll("button")].map((b) => b.getAttribute("aria-label"))).toEqual(["Hand (H)", "Select (V or 1)", "Pencil (P or 7)", "Text (T or 8)", "More tools", "Undo", "Redo"]);
    const more = byLabel(h, "More tools")!;
    expect(more.getAttribute("aria-pressed")).toBe("true");
    expect(more.querySelectorAll("svg").length).toBe(2);
    click(more);
    const items = [...h.querySelectorAll('[role="menu"][aria-label="More tools"] button')].map((b) => b.textContent);
    // Tools only: Zoom to Fit has its own button by the tools (ZoomControl).
    expect(items).toEqual(["Keep selected tool active after drawingQ", "RectangleR", "DiamondD", "EllipseO", "ArrowA", "LineL", "Sticky NoteN", "Insert Image9",
      "EraserE", "CommentC", "FrameF", "Laser PointerK"]);
    click([...h.querySelectorAll('[role="menu"] button')].find((b) => b.textContent === "ArrowA"));
    expect(sent.pop()).toEqual({ op: "tool", tool: "arrow" });
    expect(h.querySelector('[role="menu"]')).toBeNull();
  });

  it("show no keyboard letters on a touch screen", () => {
    const css = readFileSync(join(process.cwd(), "app", "s", "[id]", "board.module.css"), "utf8");
    expect(css).toMatch(/@media \(hover: none\) and \(pointer: coarse\) \{ \.key \{ display: none; \} \}/);
    expect(css).toMatch(/@media \(hover: none\) and \(pointer: coarse\) \{ \.letter \{ display: none; \} \}/);
  });

  it("no longer scroll the toolbar sideways at phone width", () => {
    const css = readFileSync(join(process.cwd(), "app", "s", "[id]", "board.module.css"), "utf8");
    const phone = css.slice(css.indexOf("@media (max-width: 600px) {"), css.indexOf(".toolsWrap"));
    expect(phone).not.toMatch(/\.tools \{/);
  });
});

// Round 14 (web-07, web-08): on a phone the board stayed cut off at the sides, and Zoom to Fit was
// the last row of More Tools. It's one tap away now, on a phone and on a wide window.
describe("Zoom to Fit", () => {
  it("is a button of its own on a wide window, after − the percent +; the percent goes back to 100%", () => {
    const sent: Record<string, unknown>[] = [];
    const h = mount(<ZoomControl zoom={0.42} command={(c) => sent.push(c)} width={1280} overTools />);
    const group = h.querySelector('[role="group"][aria-label="Zoom"]')!;
    expect([...group.querySelectorAll("button")].map((b) => b.getAttribute("aria-label"))).toEqual(["Zoom out", "Zoom to 100%", "Zoom in", "Zoom to fit"]);
    expect(byLabel(h, "Zoom to 100%")!.textContent).toBe("42%");
    click(byLabel(h, "Zoom to fit"));
    expect(sent.pop()).toEqual({ op: "action", name: "zoomToFit" });
    click(byLabel(h, "Zoom to 100%"));
    expect(sent.pop()).toEqual({ op: "action", name: "resetZoom" });
    expect(group.className).not.toMatch(/zoomOverTools/);
  });

  it("has Undo and Redo after it on a wide window, where the palette has none", () => {
    const sent: Record<string, unknown>[] = [];
    const h = mount(<ZoomControl zoom={1} command={(c) => sent.push(c)} width={1280} overTools history={{ canUndo: true, canRedo: false }} />);
    const group = h.querySelector('[role="group"][aria-label="Zoom"]')!;
    expect([...group.querySelectorAll("button")].map((b) => b.getAttribute("aria-label"))).toEqual(["Zoom out", "Zoom to 100%", "Zoom in", "Zoom to fit", "Undo", "Redo"]);
    expect((byLabel(h, "Redo") as HTMLButtonElement).disabled).toBe(true);
    click(byLabel(h, "Undo"));
    expect(sent.pop()).toEqual({ op: "action", name: "undo" });
    // On a phone they're in the tools at the foot.
    const phone = mount(<ZoomControl zoom={1} command={() => {}} width={390} overTools history={{ canUndo: true, canRedo: true }} />);
    expect(phone.querySelectorAll('[aria-label="Undo"]').length).toBe(0);
  });

  it("is the only zoom control on a phone, a full-size button just above the tools", () => {
    const sent: Record<string, unknown>[] = [];
    const h = mount(<ZoomControl zoom={1} command={(c) => sent.push(c)} width={390} overTools />);
    const group = h.querySelector('[role="group"][aria-label="Zoom"]')!;
    expect([...group.querySelectorAll("button")].map((b) => b.getAttribute("aria-label"))).toEqual(["Zoom to fit"]);
    expect(group.className).toMatch(/zoomOverTools/);
    expect(byLabel(h, "Zoom to fit")!.className).toMatch(/fitPhone/);
    click(byLabel(h, "Zoom to fit"));
    expect(sent.pop()).toEqual({ op: "action", name: "zoomToFit" });
    // Someone who can only look has no tools at the foot: it stays in the corner.
    const v = mount(<ZoomControl zoom={1} command={() => {}} width={390} overTools={false} />);
    expect(v.querySelector('[role="group"]')!.className).not.toMatch(/zoomOverTools/);
  });

  it("isn't hidden at phone width any more", () => {
    const css = readFileSync(join(process.cwd(), "app", "s", "[id]", "board.module.css"), "utf8");
    const phone = css.slice(css.indexOf("@media (max-width: 600px) {"), css.indexOf(".toolsWrap"));
    expect(phone).not.toMatch(/\.zoom \{ display: none/);
    // The phone's button stands above the tools (40 pt and the bar's padding), clear of them.
    expect(css).toMatch(/\.zoomOverTools \{ bottom: calc\(max\(14px, env\(safe-area-inset-bottom\)\) \+ 64px\); \}/);
  });
});
