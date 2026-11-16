"use client";

// The browser board's tools at the foot and the bar over a selection, as the Mac app has them
// (Pane/Views/CanvasControls.swift): the bar's stroke colour, fill, stroke width and line, arrow
// type and heads, and More (Duplicate, Delete, the layer order). At phone width the tools used
// most stay in the toolbar and the rest fold into More Tools; the bar sits over the toolbar.
// What each offers is lib/board-style.ts.
import { useEffect, useRef, useState } from "react";
import type { PageState } from "@/lib/board-host";
import { ARROW_TYPES, ARROWHEADS, barPlace, FILLS, LINES, offers, PHONE, STROKES, toolsAt, WIDTHS } from "@/lib/board-style";
import s from "./board.module.css";

export const TOOLS: { tool: string; label: string; key: string; icon: React.ReactNode }[] = [
  { tool: "selection", label: "Select", key: "V", icon: <path d="M5 3.5l11.5 6.2-5 1.4-2.3 4.9z" /> },
  { tool: "hand", label: "Hand", key: "H", icon: <path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V10m0-.5V4.5a1.5 1.5 0 0 1 3 0V10m0-3.5a1.5 1.5 0 0 1 3 0V13a5.5 5.5 0 0 1-5.5 5.5h-1A5.5 5.5 0 0 1 5 14.6L3.6 12a1.4 1.4 0 0 1 2.3-1.5L8 13" /> },
  { tool: "rectangle", label: "Rectangle", key: "R", icon: <rect x="3.5" y="5" width="15" height="12" rx="2" /> },
  { tool: "diamond", label: "Diamond", key: "D", icon: <path d="M11 3l8 8-8 8-8-8z" /> },
  { tool: "ellipse", label: "Oval", key: "O", icon: <ellipse cx="11" cy="11" rx="8" ry="6.5" /> },
  { tool: "arrow", label: "Arrow", key: "A", icon: <path d="M4 18L18 4m0 0h-8m8 0v8" /> },
  { tool: "line", label: "Line", key: "L", icon: <path d="M4 18L18 4" /> },
  { tool: "freedraw", label: "Draw", key: "P", icon: <path d="M3.5 16c2-3 4-4.5 5.5-3.5s.5 3.5 2.5 3.5 3-5 5-7 2.5-1 2.5-1" /> },
  { tool: "text", label: "Text", key: "T", icon: <path d="M5 5.5h12M11 5.5v12" /> },
  { tool: "eraser", label: "Eraser", key: "E", icon: <path d="M8.5 18.5h10M4.6 13.4l7.8-7.8a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L11 17a2 2 0 0 1-1.4.6H8.3a2 2 0 0 1-1.4-.6l-2.3-2.3a1 1 0 0 1 0-1.3z" /> },
  { tool: "comment", label: "Comment", key: "C", icon: <path d="M4.5 4.5h13a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V15.5h-1A1.5 1.5 0 0 1 3 14V6a1.5 1.5 0 0 1 1.5-1.5z" /> },
];

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
function useDismiss(open: boolean, close: () => void, inside: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const down = (e: PointerEvent) => { if (inside.current && !inside.current.contains(e.target as Node)) close(); };
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", down, true);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("pointerdown", down, true); };
  }, [open, close, inside]);
}

/** Four corners pointing out: the whole board in view. */
export const FIT_ICON = <path d="M4 8V4h4M14 4h4v4M18 14v4h-4M8 18H4v-4" />;

/** The zoom, at the foot's left corner: Zoom to Fit always, one tap away (round 14, web-07 and
 *  web-08: on a phone it was the last row of More Tools, and a board cut off at the sides stayed
 *  so); on a wider window − the percent + before it, the percent back to 100%. On a phone with the
 *  tools at the foot, it sits just above them. */
export function ZoomControl({ zoom, command, width, overTools }: { zoom: number; command: Command; width: number; overTools: boolean }) {
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
    </div>
  );
}

/** The tools at the foot: every one where they fit; at phone width the ones used most, the rest in
 *  More Tools. Undo and Redo always. */
export function ToolBar({ state, command, width }: { state: PageState; command: Command; width: number }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), wrap);
  const { shown, folded } = toolsAt(width, TOOLS.map((t) => t.tool));
  const byTool = (tool: string) => TOOLS.find((t) => t.tool === tool)!;
  const inMenu = folded.includes(state.tool ?? "");
  const pick = (tool: string) => { setOpen(false); command({ op: "tool", tool }); };
  return (
    <div ref={wrap} className={s.toolsWrap}>
      <nav className={s.tools} aria-label="Tools">
        {shown.map(byTool).map((t) => (
          <button key={t.tool} className={s.tool} aria-label={`${t.label} (${t.key})`} title={`${t.label} (${t.key})`} aria-pressed={state.tool === t.tool}
            onClick={() => pick(t.tool)}>
            <Icon>{t.icon}</Icon>
          </button>
        ))}
        {folded.length > 0 && (
          // The tool picked from it shows on it, tinted, with the chevron of a menu (as the Mac's
          // narrow toolbar's Tools button does).
          <button className={`${s.tool} ${s.moreTools}`} aria-label="More tools" title="More tools" aria-haspopup="menu" aria-expanded={open} aria-pressed={inMenu}
            onClick={() => setOpen(!open)}>
            <Icon>{inMenu ? byTool(state.tool!).icon : SHAPES_ICON}</Icon>
            <Chevron />
          </button>
        )}
        <span className={s.gap} />
        <button className={s.tool} aria-label="Undo" title="Undo" disabled={!state.canUndo} onClick={() => command({ op: "action", name: "undo" })}><Icon><path d="M8 5L4 9l4 4M4 9h9a5 5 0 0 1 0 10h-3" /></Icon></button>
        <button className={s.tool} aria-label="Redo" title="Redo" disabled={!state.canRedo} onClick={() => command({ op: "action", name: "redo" })}><Icon><path d="M14 5l4 4-4 4m4-4H9a5 5 0 0 0 0 10h3" /></Icon></button>
      </nav>
      {open && (
        <div className={s.toolMenu} role="menu" aria-label="More tools">
          {folded.map(byTool).map((t) => (
            <button key={t.tool} role="menuitemradio" aria-checked={state.tool === t.tool} className={s.menuRow} onClick={() => pick(t.tool)}>
              <Icon size={18}>{t.icon}</Icon><span>{t.label}</span><kbd className={s.key}>{t.key}</kbd>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Tray = "stroke" | "fill" | "width" | "arrow" | "more";

/** The bar over a selection: what the app's selection bar offers, each choice in a small tray. */
export function StyleBar({ state, command, width, height }: { state: PageState; command: Command; width: number; height: number }) {
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
  const place = state.bounds ? barPlace(state.bounds, { width, height }, size, narrow) : null;
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
