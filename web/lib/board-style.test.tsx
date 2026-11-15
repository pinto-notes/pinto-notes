// @vitest-environment happy-dom
// The browser board's bar over a selection and its tools at phone width (round 12: a shape picked
// in the browser had nothing to change it with, and at 390 pt the toolbar ran off the right edge).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { StyleBar, ToolBar, TOOLS } from "@/app/s/[id]/BoardControls";
import type { PageState } from "./board-host";
import { barPlace, FILLS, offers, PHONE, showsBar, STROKES, toolsAt, WIDTHS } from "./board-style";

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

describe("the tools at phone width", () => {
  const all = TOOLS.map((t) => t.tool);

  it("keep every tool where they fit, and the ones used most at 390, the rest in More Tools", () => {
    expect(toolsAt(1280, all)).toEqual({ shown: all, folded: [] });
    const phone = toolsAt(390, all);
    expect(phone.shown).toEqual(["selection", "hand", "freedraw", "text"]);
    expect([...phone.shown, ...phone.folded].sort()).toEqual([...all].sort());
    expect(toolsAt(PHONE + 1, all).folded).toEqual([]);
    // Shown, More Tools, Undo and Redo, at 40 pt each with the gap and the bar's padding, fit 390
    // less the 12 pt margins.
    expect((phone.shown.length + 3) * 42 + 10 + 12 + 12).toBeLessThanOrEqual(390 - 24);
  });

  it("fold the rest into More Tools, with its chevron, and the picked one shows on it", () => {
    const sent: Record<string, unknown>[] = [];
    const h = mount(<ToolBar state={{ tool: "rectangle", canUndo: true }} command={(c) => sent.push(c)} width={390} />);
    const nav = h.querySelector('nav[aria-label="Tools"]')!;
    expect([...nav.querySelectorAll("button")].map((b) => b.getAttribute("aria-label"))).toEqual(["Select (V)", "Hand (H)", "Draw (P)", "Text (T)", "More tools", "Undo", "Redo"]);
    const more = byLabel(h, "More tools")!;
    expect(more.getAttribute("aria-pressed")).toBe("true");
    expect(more.querySelectorAll("svg").length).toBe(2);
    click(more);
    const items = [...h.querySelectorAll('[role="menu"][aria-label="More tools"] button')].map((b) => b.textContent);
    expect(items).toEqual(["RectangleR", "DiamondD", "OvalO", "ArrowA", "LineL", "EraserE", "CommentC", "Zoom to Fit"]);
    click([...h.querySelectorAll('[role="menu"] button')].find((b) => b.textContent === "ArrowA"));
    expect(sent.pop()).toEqual({ op: "tool", tool: "arrow" });
    expect(h.querySelector('[role="menu"]')).toBeNull();
    click(more);
    click([...h.querySelectorAll('[role="menu"] button')].find((b) => b.textContent === "Zoom to Fit"));
    expect(sent.pop()).toEqual({ op: "action", name: "zoomToFit" });
  });

  it("has every tool and no menu on a wide window", () => {
    const h = mount(<ToolBar state={{ tool: "selection" }} command={() => {}} width={1280} />);
    expect(byLabel(h, "More tools")).toBeNull();
    expect(h.querySelectorAll('nav[aria-label="Tools"] button').length).toBe(TOOLS.length + 2);
  });

  it("no longer scroll the toolbar sideways at phone width", () => {
    const css = readFileSync(join(process.cwd(), "app", "s", "[id]", "board.module.css"), "utf8");
    const phone = css.slice(css.indexOf("@media (max-width: 600px) {"), css.indexOf(".toolsWrap"));
    expect(phone).not.toMatch(/\.tools \{/);
  });
});
