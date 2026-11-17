// The browser board's selection bar and tools (app/s/[id]/BoardControls.tsx): what the Mac app's
// selection bar offers (Pane/Views/CanvasControls.swift, CanvasSelectionBar; the choices are
// CanvasStyle's in Pane/Model/CanvasBridge.swift), and the tool palette, as the app's
// (Pane/Views/CanvasToolPalette.swift): its order, keys and letters, where it goes and what folds
// into More at a width, and Excalidraw's hint line under it.

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
 *  above (the top bar, or the palette in a row of its own: `top`); never past the window's sides. At phone width it sits over the
 *  tools at the foot instead (null), as the iPhone app's dock holds the style. */
export function barPlace(sel: Box, view: { width: number; height: number }, bar: { width: number; height: number }, narrow: boolean, top = 72): { left: number; top: number } | null {
  if (narrow) return null;
  const gap = 12, side = 12;
  const left = Math.min(Math.max(side, sel.x + sel.width / 2 - bar.width / 2), view.width - side - bar.width);
  let y = sel.y - gap - bar.height;
  if (y < top) y = sel.y + sel.height + gap;
  // Nor under the tools at the foot.
  y = Math.min(y, view.height - 76 - bar.height);
  return { left: Math.round(left), top: Math.round(Math.max(top, y)) };
}

/** At or under this width the page is a phone's: the tools fold into a menu, the bar docks. */
export const PHONE = 600;

// ── The tool palette (BoardControls.tsx ToolBar), as the Mac app's (Pane/Views/CanvasToolPalette.swift) ──

/** A place on the palette: a tool, the lock, the sticky note, a picture, More. */
export type PaletteId = "lock" | "hand" | "selection" | "rectangle" | "diamond" | "ellipse" | "arrow" | "line" | "freedraw" | "text"
  | "sticky" | "image" | "eraser" | "comment" | "more";

/** Excalidraw's number keys (its SHAPES table): 1 to 8 and 0; 9 is a picture. */
export const NUMBERS: Partial<Record<PaletteId, string>> = {
  selection: "1", rectangle: "2", diamond: "3", ellipse: "4", arrow: "5", line: "6", freedraw: "7", text: "8", image: "9", eraser: "0",
};
/** The letter in a tool's corner, as Excalidraw's toolbar shows its keys (none on the hand, a
 *  picture or the lock, whose keys aren't letters there either). */
export const LETTERS: Partial<Record<PaletteId, string>> = {
  selection: "V", rectangle: "R", diamond: "D", ellipse: "O", arrow: "A", line: "L", freedraw: "P", text: "T", sticky: "N", eraser: "E", comment: "C",
};

/** Its keys, as its help says them: the letter, then Excalidraw's number. */
export function keysOf(id: PaletteId): string[] {
  if (id === "lock") return ["Q"];
  if (id === "hand") return ["H"];
  return [LETTERS[id], NUMBERS[id]].filter((k): k is string => !!k);
}

/** "Rectangle (R or 2)". */
export function helpOf(title: string, keys: string[]): string {
  return keys.length ? `${title} (${keys.join(" or ")})` : title;
}

/** Excalidraw's order, as the app's: the lock; the hand, then the tools by their numbers, with the
 *  sticky note after text and Comment last (the browser has no right-click menu to add one from);
 *  More. Thin lines go between the three. */
export const PALETTE: PaletteId[][] = [
  ["lock"],
  ["hand", "selection", "rectangle", "diamond", "ellipse", "arrow", "line", "freedraw", "text", "sticky", "image", "eraser", "comment"],
  ["more"],
];
/** More's own: Excalidraw's More Tools that the board has. */
export const MORE_TOOLS = ["frame", "laser"] as const;
/** Where a window is too narrow for all of it, the first of these wait in More, until it fits (the
 *  app's foldOrder). */
export const FOLD_ORDER: PaletteId[] = ["line", "diamond", "image", "hand", "lock", "ellipse", "sticky", "eraser", "comment"];
/** On a phone, at the foot: the tools used most, the rest in More (round 12: the toolbar ran off
 *  the right edge at 390 pt). */
export const PHONE_KEEP: PaletteId[] = ["selection", "hand", "freedraw", "text"];

/** Its measures: a cell for each, a little between them, a line (with room each side) between the
 *  groups. */
export const CELL = 36, CELL_GAP = 2, PALETTE_PAD = 5, RULE = 11;

export function paletteWidth(groups: PaletteId[][]): number {
  const shown = groups.filter((g) => g.length);
  const n = shown.reduce((a, g) => a + g.length, 0), g = shown.length;
  return 2 * PALETTE_PAD + n * CELL + Math.max(0, n - g) * CELL_GAP + Math.max(0, g - 1) * RULE;
}

export type PalettePlace = { at: "top" | "below" | "foot"; groups: PaletteId[][]; folded: PaletteId[] };

/** Where the palette goes, and what waits in More. At the top in the middle, where Excalidraw has
 *  it, between the board's name and the people on it (`side`: the wider of the two, with its
 *  margin); where it isn't wide enough there, in a row of its own under them, folding what doesn't
 *  fit; on a phone at the foot, as Excalidraw's phone layout has it, with the tools used most. */
export function placePalette(width: number, side: number): PalettePlace {
  if (width <= PHONE) {
    const groups = PALETTE.map((g) => g.filter((i) => i === "more" || PHONE_KEEP.includes(i)));
    return { at: "foot", groups, folded: PALETTE.flat().filter((i) => i !== "more" && !PHONE_KEEP.includes(i)) };
  }
  if (paletteWidth(PALETTE) <= width - 2 * (side + 12)) return { at: "top", groups: PALETTE, folded: [] };
  const folded: PaletteId[] = [];
  const now = () => PALETTE.map((g) => g.filter((i) => !folded.includes(i)));
  for (const id of FOLD_ORDER) {
    if (paletteWidth(now()) <= width - 24) break;
    folded.push(id);
  }
  return { at: "below", groups: now(), folded };
}

// ── Excalidraw's hint line under the palette (the page works it out: canvas.jsx hintOf) ──

export type HintPart = { words: string } | { key: string };

/** The words a key stands for in Excalidraw's hints, as they're written there. */
const KEY_WORDS = new Set(["Shift", "Option", "Alt", "Cmd", "Ctrl", "Enter", "Escape", "ESCAPE", "Delete", "spacebar"]);

/** The hint in words and keys, as the app draws it (CanvasHint.parts): a key's name, a letter after
 *  "Press" or a "+" ("Press A again", "Cmd+D"). */
export function hintParts(text: string): HintPart[] {
  const out: HintPart[] = [];
  let words = "";
  const tokens = text.split(" ");
  tokens.forEach((token, i) => {
    if (i > 0) words += " ";
    const pieces = token.split("+");
    pieces.forEach((piece, j) => {
      if (j > 0) words += "+";
      const bare = piece.replace(/^\p{P}+|\p{P}+$/gu, "");
      const letterKey = /^\p{Lu}$/u.test(bare) && (pieces.length > 1 || (i > 0 && tokens[i - 1] === "Press"));
      if (bare && (KEY_WORDS.has(bare) || letterKey)) {
        const at = piece.indexOf(bare);
        words += piece.slice(0, at);
        if (words) { out.push({ words }); words = ""; }
        out.push({ key: bare });
        words += piece.slice(at + bare.length);
      } else {
        words += piece;
      }
    });
  });
  if (words) out.push({ words });
  return out;
}

/** The page says the Mac's keys; elsewhere they're Ctrl and Alt. */
export function hintFor(text: string, mac: boolean): string {
  return mac ? text : text.replace(/\bCmd\b/g, "Ctrl").replace(/\bOption\b/g, "Alt");
}
