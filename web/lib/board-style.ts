// The browser board's selection bar and tools (app/s/[id]/BoardControls.tsx): what the Mac app's
// selection bar offers (Pane/Views/CanvasControls.swift, CanvasSelectionBar; the choices are
// CanvasStyle's in Pane/Model/CanvasBridge.swift), and which tools fit the toolbar at a width.

export type Swatch = { name: string; value: string };

/** Strokes: Pinto's ink first, then a short palette (CanvasStyle.strokes). */
export const STROKES: Swatch[] = [
  { name: "Ink", value: "#2a1d10" }, { name: "Red", value: "#e03131" }, { name: "Orange", value: "#f08c00" },
  { name: "Green", value: "#2f9e44" }, { name: "Blue", value: "#1971c2" }, { name: "Purple", value: "#9c36b5" },
];
/** Fills: none, then soft tints of the same (CanvasStyle.fills). */
export const FILLS: Swatch[] = [
  { name: "None", value: "transparent" }, { name: "Pink", value: "#ffc9c9" }, { name: "Yellow", value: "#ffec99" },
  { name: "Green", value: "#b2f2bb" }, { name: "Blue", value: "#a5d8ff" }, { name: "Lilac", value: "#eebefa" },
];
export const WIDTHS: { name: string; value: number }[] = [{ name: "Thin", value: 1 }, { name: "Bold", value: 2 }, { name: "Extra bold", value: 4 }];
export const LINES: { name: string; value: string }[] = [{ name: "Solid", value: "solid" }, { name: "Dashed", value: "dashed" }, { name: "Dotted", value: "dotted" }];
export const ARROW_TYPES: { name: string; value: string }[] = [{ name: "Straight", value: "sharp" }, { name: "Curved", value: "round" }, { name: "Elbow", value: "elbow" }];
/** null is no arrowhead. */
export const ARROWHEADS: { name: string; value: string | null }[] = [
  { name: "None", value: null }, { name: "Arrow", value: "arrow" }, { name: "Triangle", value: "triangle" }, { name: "Bar", value: "bar" }, { name: "Circle", value: "circle" },
];

const SHAPES = new Set(["rectangle", "diamond", "ellipse", "frame"]);
const LINE_LIKE = new Set(["arrow", "line"]);

/** What the bar offers for a selection (the element types the page says are selected): a fill for
 *  shapes, the arrow's kind and heads for arrows, the stroke's colour, width and line for anything
 *  drawn with one (not a picture alone). */
export function offers(selection: string[]): { stroke: boolean; fill: boolean; width: boolean; arrow: boolean } {
  const drawn = selection.filter((t) => t !== "image");
  return {
    stroke: drawn.length > 0,
    fill: selection.some((t) => SHAPES.has(t)),
    width: drawn.some((t) => t !== "text"),
    arrow: selection.some((t) => t === "arrow"),
  };
}

/** Whether the bar shows: something you can edit is selected and you're not moving, drawing or
 *  typing in it, and not commenting. */
export function showsBar(state: { selection?: string[]; busy?: boolean; editing?: boolean; tool?: string; bounds?: unknown }, canEdit: boolean): boolean {
  return canEdit && !!state.bounds && (state.selection?.length ?? 0) > 0 && !state.busy && !state.editing && state.tool !== "comment";
}

export type Box = { x: number; y: number; width: number; height: number };

/** Where the bar goes: centred over the selection, a gap above it; under it when there's no room
 *  above (the top bar is there); never past the window's sides. At phone width it sits over the
 *  tools at the foot instead (null), as the iPhone app's dock holds the style. */
export function barPlace(sel: Box, view: { width: number; height: number }, bar: { width: number; height: number }, narrow: boolean): { left: number; top: number } | null {
  if (narrow) return null;
  const gap = 12, top = 72, side = 12;
  const left = Math.min(Math.max(side, sel.x + sel.width / 2 - bar.width / 2), view.width - side - bar.width);
  let y = sel.y - gap - bar.height;
  if (y < top) y = sel.y + sel.height + gap;
  // Nor under the tools at the foot.
  y = Math.min(y, view.height - 76 - bar.height);
  return { left: Math.round(left), top: Math.round(Math.max(top, y)) };
}

/** At or under this width the page is a phone's: the tools fold into a menu, the bar docks. */
export const PHONE = 600;

/** The tools the toolbar shows at a width, the rest in its More Tools menu: all of them where
 *  they fit; at phone width the ones used most (as the Mac's narrow toolbar keeps them), so the
 *  bar is never wider than the window (round 12: the phone's toolbar ran off the right edge). */
export function toolsAt(width: number, all: string[]): { shown: string[]; folded: string[] } {
  if (width > PHONE) return { shown: all, folded: [] };
  const keep = new Set(["selection", "hand", "freedraw", "text"]);
  return { shown: all.filter((t) => keep.has(t)), folded: all.filter((t) => !keep.has(t)) };
}
