"use client";

// The browser board's tools and the bar over a selection, as the Mac app has them. The tools are
// the app's palette (Pane/Views/CanvasToolPalette.swift): Excalidraw's tools in its order with its
// keys, at the top in the middle, the hint line under them; on a phone at the foot, with the tools
// used most and the rest in More. The bar's stroke colour, fill, stroke width and line, arrow type
// and heads, and More (Duplicate, Delete, the layer order). What each offers and where the palette
// goes is lib/board-style.ts.
import { Fragment, useEffect, useRef, useState } from "react";
import type { PageState } from "@/lib/board-host";
import {
  ARROW_TYPES, ARROWHEADS, barPlace, FILLS, helpOf, hintFor, hintParts, keysOf, LETTERS, LINES, MORE_TOOLS, offers, PHONE,
  type PaletteId, placePalette, STROKES, WIDTHS,
} from "@/lib/board-style";
import s from "./board.module.css";

/** The tools, by the app's names for them (CanvasTool.title), with their letters. */
export const TOOLS: { tool: string; label: string; key: string; icon: React.ReactNode }[] = [
  { tool: "selection", label: "Select", key: "V", icon: <path d="M5 3.5l11.5 6.2-5 1.4-2.3 4.9z" /> },
  { tool: "hand", label: "Hand", key: "H", icon: <path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V10m0-.5V4.5a1.5 1.5 0 0 1 3 0V10m0-3.5a1.5 1.5 0 0 1 3 0V13a5.5 5.5 0 0 1-5.5 5.5h-1A5.5 5.5 0 0 1 5 14.6L3.6 12a1.4 1.4 0 0 1 2.3-1.5L8 13" /> },
  { tool: "rectangle", label: "Rectangle", key: "R", icon: <rect x="3.5" y="5" width="15" height="12" rx="2" /> },
  { tool: "diamond", label: "Diamond", key: "D", icon: <path d="M11 3l8 8-8 8-8-8z" /> },
  { tool: "ellipse", label: "Ellipse", key: "O", icon: <ellipse cx="11" cy="11" rx="8" ry="6.5" /> },
  { tool: "arrow", label: "Arrow", key: "A", icon: <path d="M4 18L18 4m0 0h-8m8 0v8" /> },
  { tool: "line", label: "Line", key: "L", icon: <path d="M4 18L18 4" /> },
  { tool: "freedraw", label: "Pencil", key: "P", icon: <path d="M3.5 16c2-3 4-4.5 5.5-3.5s.5 3.5 2.5 3.5 3-5 5-7 2.5-1 2.5-1" /> },
  { tool: "text", label: "Text", key: "T", icon: <path d="M5 5.5h12M11 5.5v12" /> },
  { tool: "eraser", label: "Eraser", key: "E", icon: <path d="M8.5 18.5h10M4.6 13.4l7.8-7.8a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L11 17a2 2 0 0 1-1.4.6H8.3a2 2 0 0 1-1.4-.6l-2.3-2.3a1 1 0 0 1 0-1.3z" /> },
  { tool: "comment", label: "Comment", key: "C", icon: <path d="M4.5 4.5h13a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V15.5h-1A1.5 1.5 0 0 1 3 14V6a1.5 1.5 0 0 1 1.5-1.5z" /> },
  // More's own (MORE_TOOLS).
  { tool: "frame", label: "Frame", key: "F", icon: <path d="M7 3.5v15M15 3.5v15M3.5 7h15M3.5 15h15" /> },
  { tool: "laser", label: "Laser Pointer", key: "K", icon: <><path d="M5 3.5l9.5 5.1-4.1 1.2-1.9 4z" /><path d="M14.5 14.5l3.5 3.5M16.5 11.5h3M11.5 16.5v3" /></> },
];

/** The rest of the palette: the lock, the sticky note, a picture and More (Excalidraw's ⋮). */
const PLACES: Record<"lock" | "sticky" | "image" | "more", { label: string; icon: React.ReactNode }> = {
  lock: { label: "Keep selected tool active after drawing", icon: <><rect x="5" y="10" width="12" height="8.5" rx="2" /><path d="M8 10V7.5a3 3 0 0 1 5.8-1.1" /></> },
  sticky: { label: "Sticky Note", icon: <><path d="M4.5 4.5h13v8.5l-4.5 4.5h-8.5z" /><path d="M17.5 13h-4.5v4.5M7.5 8.5h7M7.5 11.5h4" /></> },
  image: { label: "Insert Image", icon: <><rect x="3.5" y="4.5" width="15" height="13" rx="2" /><circle cx="8" cy="9" r="1.5" /><path d="M18.5 14.5l-4-4-7.5 7" /></> },
  more: { label: "More tools", icon: <path d="M11 5h.01M11 11h.01M11 17h.01" strokeWidth="2.6" /> },
};
const LOCKED_ICON = <><rect x="5" y="10" width="12" height="8.5" rx="2" /><path d="M8 10V7.5a3 3 0 0 1 6 0V10" /></>;

/** A place's name and drawing. */
function placeOf(id: string): { label: string; icon: React.ReactNode } {
  return (PLACES as Record<string, { label: string; icon: React.ReactNode }>)[id] ?? TOOLS.find((t) => t.tool === id)!;
}

/** More Tools before one of its tools is picked: the shapes (a square on a circle, as the Mac's
 *  Tools button and the iPhone's Shapes show), not two lines that read as a stroke width (round 13,
 *  web-08). */
export const SHAPES_ICON = <><circle cx="13.5" cy="8.5" r="5" /><rect x="3.5" y="9.5" width="9" height="9" rx="1.5" /></>;

export const Icon = ({ children, size = 22 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const Chevron = () => (
  <svg className={s.chevron} width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3.5l3 3 3-3" /></svg>
);

type Command = (c: Record<string, unknown>) => void;

/** The window's width, kept as it changes. */
export function useWidth(): number {
  const [w, setW] = useState(() => (typeof window === "undefined" ? 1280 : window.innerWidth));
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

/** A menu that closes on Escape or a click anywhere else. */
export function useDismiss(open: boolean, close: () => void, inside: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const down = (e: PointerEvent) => { if (inside.current && !inside.current.contains(e.target as Node)) close(); };
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", down, true);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("pointerdown", down, true); };
  }, [open, close, inside]);
}

/** Can comment: the Comment tool alone at the foot, where an editor's tools are (as FigJam gives a
 *  commenter). C picks it too, and Escape puts it down. */
export function CommentBar({ state, command }: { state: PageState; command: Command }) {
  const t = TOOLS.find((x) => x.tool === "comment")!;
  const on = state.tool === "comment";
  return (
    <nav className={s.tools} aria-label="Tools" data-comment-bar>
      <button className={s.tool} aria-label={`${t.label} (${t.key})`} title={`${t.label} (${t.key})`} aria-pressed={on}
        onClick={() => command({ op: "tool", tool: "comment", on: !on })}>
        <Icon>{t.icon}</Icon>
      </button>
    </nav>
  );
}

/** Four corners pointing out: the whole board in view. */
export const FIT_ICON = <path d="M4 8V4h4M14 4h4v4M18 14v4h-4M8 18H4v-4" />;

/** The zoom, at the foot's left corner: Zoom to Fit always, one tap away (round 14, web-07 and
 *  web-08: on a phone it was the last row of More Tools, and a board cut off at the sides stayed
 *  so); on a wider window − the percent + before it, the percent back to 100%, and Undo and Redo
 *  after it (`history`), as the app's corner has them (Excalidraw's place for them). On a phone with
 *  the tools at the foot, it sits just above them, and Undo and Redo are in the tools. */
export function ZoomControl({ zoom, command, width, overTools, history }: {
  zoom: number; command: Command; width: number; overTools: boolean; history?: { canUndo: boolean; canRedo: boolean };
}) {
  const phone = width <= PHONE;
  return (
    <div className={phone && overTools ? `${s.zoom} ${s.zoomOverTools}` : s.zoom} role="group" aria-label="Zoom">
      {!phone && (<>
        <button className={s.zoomButton} aria-label="Zoom out" title="Zoom out" onClick={() => command({ op: "action", name: "zoomOut" })}>−</button>
        <button className={s.zoomValue} aria-label="Zoom to 100%" title="Zoom to 100%" onClick={() => command({ op: "action", name: "resetZoom" })}>{Math.round(zoom * 100)}%</button>
        <button className={s.zoomButton} aria-label="Zoom in" title="Zoom in" onClick={() => command({ op: "action", name: "zoomIn" })}>+</button>
      </>)}
      <button className={phone ? `${s.zoomButton} ${s.fitPhone}` : s.zoomButton} aria-label="Zoom to fit" title="Zoom to fit" onClick={() => command({ op: "action", name: "zoomToFit" })}>
        <Icon size={phone ? 20 : 18}>{FIT_ICON}</Icon>
      </button>
      {!phone && history && (<>
        <span className={s.zoomRule} aria-hidden="true" />
        <button className={s.zoomButton} aria-label="Undo" title="Undo (⌘Z)" disabled={!history.canUndo} onClick={() => command({ op: "action", name: "undo" })}><Icon size={18}>{UNDO_ICON}</Icon></button>
        <button className={s.zoomButton} aria-label="Redo" title="Redo (⇧⌘Z)" disabled={!history.canRedo} onClick={() => command({ op: "action", name: "redo" })}><Icon size={18}>{REDO_ICON}</Icon></button>
      </>)}
    </div>
  );
}

const UNDO_ICON = <path d="M8 5L4 9l4 4M4 9h9a5 5 0 0 1 0 10h-3" />;
const REDO_ICON = <path d="M14 5l4 4-4 4m4-4H9a5 5 0 0 0 0 10h3" />;

/** The visitor's on a Mac: the hint says ⌘'s keys, else Ctrl's. */
const onMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Excalidraw's hint line, word for word (the page works it out: canvas.jsx hintOf), its keys drawn
 *  as keys. It takes no clicks. */
export function HintLine({ text }: { text: string }) {
  const line = hintFor(text, onMac());
  return (
    <p className={s.hint} aria-label={line} data-hint>
      {hintParts(line).map((p, i) => ("key" in p ? <kbd key={i} className={s.cap}>{p.key}</kbd> : <Fragment key={i}>{p.words}</Fragment>))}
    </p>
  );
}

/** The tools (the app's palette): the lock, a line, the hand and the tools, a line, More. Each
 *  tool's letter sits in its corner and its keys are in its name; the tool you have is a filled chip
 *  in the accent. At the top in the middle, where it fits between the board's name and the people on
 *  it (`side`: the wider of the two), else in a row under them; Excalidraw's hint line under it. On a
 *  phone, at the foot, with the tools used most, the rest in More, and Undo and Redo. */
export function ToolBar({ state, command, width, side = 0, pickImage, hint = true }: {
  state: PageState; command: Command; width: number; side?: number; pickImage?: () => void; hint?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), wrap);
  const place = placePalette(width, side);
  const foot = place.at === "foot";
  const tool = state.tool ?? "";
  const fromMore = (MORE_TOOLS as readonly string[]).includes(tool) || place.folded.includes(tool as PaletteId);
  const run = (id: string) => {
    setOpen(false);
    if (id === "lock") command({ op: "lock", on: !state.locked });
    else if (id === "sticky") command({ op: "sticky" });
    else if (id === "image") pickImage?.();
    else command({ op: "tool", tool: id });
  };
  const help = (id: PaletteId) => helpOf(placeOf(id).label, keysOf(id));
  const cell = (id: PaletteId) => {
    const p = placeOf(id), picked = id === "lock" ? !!state.locked : tool === id;
    // A sticky note and a picture are things you add, never held.
    const pressable = id !== "sticky" && id !== "image";
    return (
      <button key={id} className={foot ? s.tool : s.cell} data-tool={id} data-soft={id === "lock" || undefined} aria-label={help(id)} title={help(id)}
        aria-pressed={pressable ? picked : undefined} onClick={() => run(id)}>
        <Icon size={foot ? 22 : 20}>{id === "lock" && state.locked ? LOCKED_ICON : p.icon}</Icon>
        {!foot && LETTERS[id] && <span className={s.letter} aria-hidden="true">{LETTERS[id]}</span>}
      </button>
    );
  };
  const more = (
    // The tool picked from it shows on it, filled (as the app's More does).
    <button key="more" className={foot ? `${s.tool} ${s.moreTools}` : s.cell} data-tool="more" aria-label="More tools" title="More tools" aria-haspopup="menu"
      aria-expanded={open} aria-pressed={fromMore} onClick={() => setOpen(!open)}>
      <Icon size={foot ? 22 : 20}>{fromMore ? placeOf(tool).icon : foot ? SHAPES_ICON : PLACES.more.icon}</Icon>
      {foot && <Chevron />}
    </button>
  );
  const nav = (
    <nav className={foot ? s.tools : s.palette} aria-label="Tools" data-palette={place.at}>
      {place.groups.map((group, i) => (
        <Fragment key={i}>
          {i > 0 && group.length > 0 && place.groups.slice(0, i).some((g) => g.length > 0) && <span className={s.rule} aria-hidden="true" data-rule />}
          {group.map((id) => (id === "more" ? more : cell(id)))}
        </Fragment>
      ))}
      {foot && (<>
        <span className={s.gap} />
        <button className={s.tool} aria-label="Undo" title="Undo" disabled={!state.canUndo} onClick={() => command({ op: "action", name: "undo" })}><Icon>{UNDO_ICON}</Icon></button>
        <button className={s.tool} aria-label="Redo" title="Redo" disabled={!state.canRedo} onClick={() => command({ op: "action", name: "redo" })}><Icon>{REDO_ICON}</Icon></button>
      </>)}
    </nav>
  );
  const row = (id: string) => {
    const p = placeOf(id), keys = id in PLACES ? keysOf(id as PaletteId) : [TOOLS.find((t) => t.tool === id)?.key ?? ""];
    const lock = id === "lock";
    return (
      <button key={id} role={lock ? "menuitemcheckbox" : id === "sticky" || id === "image" ? "menuitem" : "menuitemradio"}
        aria-checked={lock ? !!state.locked : id === "sticky" || id === "image" ? undefined : tool === id} className={s.menuRow} onClick={() => run(id)}>
        <Icon size={18}>{p.icon}</Icon><span>{p.label}</span><kbd className={s.key}>{keys[0]}</kbd>
      </button>
    );
  };
  return (
    <div ref={wrap} className={foot ? s.toolsWrap : `${s.paletteWrap} ${place.at === "below" ? s.paletteBelow : ""}`} data-palette-place={place.at}>
      {nav}
      {open && (
        <div className={foot ? s.toolMenu : s.paletteMenu} role="menu" aria-label="More tools">
          {place.folded.map(row)}
          {place.folded.length > 0 && <hr className={s.menuGap} />}
          {MORE_TOOLS.map(row)}
        </div>
      )}
      {!foot && hint && !open && typeof state.hint === "string" && state.hint && <HintLine text={state.hint} />}
    </div>
  );
}

type Tray = "stroke" | "fill" | "width" | "arrow" | "more";

/** The bar over a selection: what the app's selection bar offers, each choice in a small tray. */
export function StyleBar({ state, command, width, height, top }: { state: PageState; command: Command; width: number; height: number; top?: number }) {
  const [tray, setTray] = useState<Tray | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 240, height: 48 });
  const selection = state.selection ?? [];
  const sel = selection.join(",");
  // A new selection closes what was open, as the app's bar does.
  useEffect(() => setTray(null), [sel]);
  useDismiss(tray !== null, () => setTray(null), bar);
  useEffect(() => {
    const r = bar.current?.getBoundingClientRect();
    if (r && r.width && (Math.abs(r.width - size.width) > 1 || Math.abs(r.height - size.height) > 1)) setSize({ width: r.width, height: r.height });
  });
  const o = offers(selection);
  const st = (state.style ?? {}) as Record<string, unknown>;
  const narrow = width <= 600;
  const place = state.bounds ? barPlace(state.bounds, { width, height }, size, narrow, top) : null;
  const set = (key: string, value: unknown) => command({ op: "style", key, value });
  const act = (name: string) => { setTray(null); command({ op: "action", name }); };
  const toggle = (t: Tray) => setTray(tray === t ? null : t);
  const fill = st.mixedFill ? "mixed" : String(st.backgroundColor ?? "transparent");
  const chip = (t: Tray, label: string, face: React.ReactNode) => (
    <button className={s.chip} aria-label={label} title={label} aria-haspopup="true" aria-expanded={tray === t} onClick={() => toggle(t)}>{face}</button>
  );
  const choice = (label: string, on: boolean, run: () => void, face?: React.ReactNode) => (
    <button key={label} role="menuitemradio" aria-checked={on} className={s.choice} title={label} aria-label={face ? label : undefined} onClick={run}>{face ?? label}</button>
  );
  return (
    <div ref={bar} className={narrow ? `${s.styleBar} ${s.styleDock}` : s.styleBar} style={place ?? undefined} role="toolbar" aria-label="Selection">
      {o.stroke && chip("stroke", "Stroke colour", <span className={s.swatch} style={{ background: String(st.strokeColor ?? "#2a1d10") }} />)}
      {o.fill && chip("fill", "Fill", <span className={s.swatch} data-fill={fill === "transparent" ? "none" : fill === "mixed" ? "mixed" : undefined} style={{ background: fill === "transparent" || fill === "mixed" ? undefined : fill }} />)}
      {o.width && chip("width", "Stroke width", <Icon size={20}><path d={st.strokeStyle === "dashed" ? "M4 11h3m3 0h3m3 0h2" : st.strokeStyle === "dotted" ? "M4 11h.5m3.5 0h.5m3.5 0h.5m3.5 0h.5" : "M4 7h14M4 11h14M4 15h14"} strokeWidth={Number(st.strokeWidth ?? 2) >= 4 ? 2.8 : 1.6} /></Icon>)}
      {o.arrow && chip("arrow", "Arrow type", <Icon size={20}>{st.arrowType === "round" ? <path d="M5 17c0-7 5-11 12-11m0 0l-3-3m3 3l-3 3" /> : st.arrowType === "elbow" ? <path d="M5 5v8h12m0 0l-3-3m3 3l-3 3" /> : <path d="M5 17L17 5m0 0h-7m7 0v7" />}</Icon>)}
      {chip("more", "More", <Icon size={20}><path d="M5 11h.01M11 11h.01M17 11h.01" strokeWidth="2.6" /></Icon>)}
      {tray && (
        <div className={s.tray} role="menu" aria-label={{ stroke: "Stroke colour", fill: "Fill", width: "Stroke width", arrow: "Arrow type", more: "More" }[tray]}>
          {tray === "stroke" && <div className={s.swatches}>{STROKES.map((c) => choice(c.name, st.strokeColor === c.value, () => set("strokeColor", c.value), <span className={s.swatch} style={{ background: c.value }} />))}</div>}
          {tray === "fill" && <div className={s.swatches}>{FILLS.map((c) => choice(c.name, fill === c.value, () => { if (c.value !== "transparent" && st.fillStyle !== "solid") set("fillStyle", "solid"); set("backgroundColor", c.value); },
            <span className={s.swatch} data-fill={c.value === "transparent" ? "none" : undefined} style={{ background: c.value === "transparent" ? undefined : c.value }} />))}</div>}
          {tray === "width" && (<>
            <p className={s.trayHead}>Stroke width</p>
            <div className={s.choices}>{WIDTHS.map((w) => choice(w.name, Number(st.strokeWidth) === w.value, () => set("strokeWidth", w.value)))}</div>
            <p className={s.trayHead}>Line</p>
            <div className={s.choices}>{LINES.map((l) => choice(l.name, st.strokeStyle === l.value, () => set("strokeStyle", l.value)))}</div>
          </>)}
          {tray === "arrow" && (<>
            <p className={s.trayHead}>Arrow type</p>
            <div className={s.choices}>{ARROW_TYPES.map((a) => choice(a.name, st.arrowType === a.value, () => set("arrowType", a.value)))}</div>
            <p className={s.trayHead}>End</p>
            <div className={s.choices}>{ARROWHEADS.map((h) => choice(h.name, (st.endArrowhead ?? null) === h.value, () => set("endArrowhead", h.value)))}</div>
          </>)}
          {tray === "more" && (
            <div className={s.moreRows}>
              <button role="menuitem" className={s.menuRow} onClick={() => act("duplicate")}><span>Duplicate</span></button>
              <button role="menuitem" className={s.menuRow} onClick={() => act("bringToFront")}><span>Bring to Front</span></button>
              <button role="menuitem" className={s.menuRow} onClick={() => act("sendToBack")}><span>Send to Back</span></button>
              <hr className={s.menuGap} />
              <button role="menuitem" className={`${s.menuRow} ${s.menuDanger}`} onClick={() => act("delete")}><span>Delete</span></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
