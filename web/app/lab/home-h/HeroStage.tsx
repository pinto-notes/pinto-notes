"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { Chat, Term } from "../kit";
import s from "./h.module.css";

/// Where a line sits in the window capture, as fractions of the window's width and height.
type Spot = { left: number; top: number; width: number; height: number; mark: number };

/// One AI, one change. Step 0 is the page's first frame, complete.
const STEPS: { who: "chatgpt" | "claude" | "codex"; name: string; spot: Spot }[] = [
  { who: "chatgpt", name: "ChatGPT", spot: { left: 0.442, top: 0.396, width: 0.196, height: 0.039, mark: 0.552 } },
  { who: "claude", name: "Claude", spot: { left: 0.4455, top: 0.4725, width: 0.21, height: 0.039, mark: 0.5745 } },
  { who: "codex", name: "Codex", spot: { left: 0.4445, top: 0.634, width: 0.21, height: 0.039, mark: 0.5745 } },
];

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => 1 - Math.pow(1 - v, 3);
/// 0 → 1 as `p` runs from `a` to `b`.
const span = (p: number, a: number, b: number) => ease(clamp((p - a) / (b - a)));

/// Scroll progress → where each step is. Step 0 holds at the start; each later step arrives over its
/// own stretch: the old ask leaves, the new one slides in, a thread draws from it to the line, the line
/// fills with the AI's tint, and its name lands. Scrolling scrubs this, so it never runs ahead of you.
function frame(p: number) {
  const edges = [[0.18, 0.5], [0.55, 0.87]];
  return STEPS.map((_, i) => {
    if (i === 0) {
      const out = span(p, edges[0][0], edges[0][0] + 0.08);
      return { card: 1 - out, thread: 1 - out, fill: 1 - out, mark: 1 - out };
    }
    const [a, b] = edges[i - 1];
    const d = b - a;
    const inn = { card: span(p, a + d * 0.05, a + d * 0.3), thread: span(p, a + d * 0.25, a + d * 0.6), fill: span(p, a + d * 0.55, a + d * 0.85), mark: span(p, a + d * 0.8, a + d * 0.95) };
    if (i === STEPS.length - 1) return inn;
    const out = span(p, edges[i][0], edges[i][0] + 0.08);
    return { card: inn.card * (1 - out), thread: inn.thread * (1 - out), fill: inn.fill * (1 - out), mark: inn.mark * (1 - out) };
  });
}

/// The hero: the real app on the paper desk. As you scroll, the window stays and three AIs, one after
/// another, ask from the left and change a line in the same note. Phones and Reduce Motion keep the
/// first step, which is complete on its own.
export function HeroStage() {
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const win = useRef<HTMLElement>(null);
  const asks = useRef<(HTMLElement | null)[]>([]);
  const [p, setP] = useState(0);
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fixed = window.matchMedia("(max-width: 900px), (prefers-reduced-motion: reduce)");
    let raf = 0;
    const read = () => {
      raf = 0;
      if (fixed.matches) return setP(0);
      const r = el.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      setP(travel > 0 ? clamp(-r.top / travel) : 0);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);

  // Threads run from each ask's right edge to the start of its line, in the stage's own pixels.
  useLayoutEffect(() => {
    const measure = () => {
      const st = stage.current?.getBoundingClientRect();
      const w = win.current?.getBoundingClientRect();
      if (!st || !w) return;
      setPaths(STEPS.map((step, i) => {
        const a = asks.current[i]?.getBoundingClientRect();
        if (!a) return "";
        const x1 = a.right - st.left, y1 = a.top - st.top + a.height * 0.42;
        const x2 = w.left - st.left + w.width * step.spot.left - 6, y2 = w.top - st.top + w.height * (step.spot.top + step.spot.height / 2);
        const mx = (x1 + x2) / 2;
        return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
      }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (stage.current) ro.observe(stage.current);
    return () => ro.disconnect();
  }, []);

  const f = frame(p);
  const at = (sp: Spot) => ({ "--l": sp.left, "--t": sp.top, "--w": sp.width, "--h": sp.height, "--m": sp.mark });
  const ref = (i: number) => (el: HTMLElement | null) => { asks.current[i] = el; };

  return (
    <div ref={box} className={s.scroller}>
      <div className={s.sticky}>
        <div ref={stage} className={s.stage}>
          <img className={s.stageArt} src="/home-d/desk.webp" alt="" width={1254} height={1254} fetchPriority="high"
            style={{ transform: `translateY(${(-p * 36).toFixed(1)}px) scale(1.04)` }} />
          <figure ref={win} className={s.window}>
            <img src="/home-h/window-lisbon.webp" srcSet="/home-h/window-lisbon-1100.webp 1100w, /home-h/window-lisbon.webp 2200w" sizes="(min-width: 1240px) 1100px, 92vw" width={2200} height={1375}
              alt="Pinto Notes on a Mac: folders on the left, the note list, and a note called Lisbon with a checklist, places, a hotel booking and a table of food." fetchPriority="high" />
            {STEPS.map((step, i) => (
              <span key={step.who} aria-hidden="true">
                <span className={s.added} style={{ ...at(step.spot), transform: `scaleX(${f[i].fill.toFixed(3)})`, opacity: f[i].fill > 0 ? 1 : 0 } as React.CSSProperties} />
                <span className={s.byline} style={{ ...at(step.spot), opacity: f[i].mark, transform: `translateY(-50%) scale(${(0.85 + 0.15 * f[i].mark).toFixed(3)})` } as React.CSSProperties}>
                  <AIGlyph name={step.who === "claude" ? "claude" : "openai"} size={11} />{step.name}
                </span>
              </span>
            ))}
          </figure>
          <svg className={s.threads} aria-hidden="true">
            {paths.map((d, i) => d && <path key={i} d={d} pathLength={1} style={{ strokeDashoffset: 1 - f[i].thread, opacity: f[i].thread > 0 ? 1 : 0 }} />)}
          </svg>
          <div className={s.asks}>
            {[
              <Chat key="c" app="chatgpt" label="ChatGPT, asked to add a day trip to the Lisbon note"
                turns={[{ me: "Add a day trip to Sintra to my Lisbon note", tool: "Used Pinto Notes", ai: "Added it under Plan." }]} />,
              <Chat key="l" app="claude" label="Claude, told the hotel is booked"
                turns={[{ me: "I booked the hotel. Tick it off in Lisbon.", tool: "Used Pinto Notes", ai: "Ticked Hotel in Príncipe Real." }]} />,
              <Term key="x" app="codex" label="Codex, asked to add Sunday's plan" className={s.askTerm}
                ask="add LX Factory on Sunday to my Lisbon note" call="pinto.edit Travel/Lisbon.md" out={["Added under Places."]} />,
            ].map((card, i) => (
              <div key={i} ref={ref(i)} className={s.ask}
                style={{ opacity: f[i].card, transform: `translateX(${((1 - f[i].card) * -28).toFixed(1)}px)`, pointerEvents: f[i].card > 0.5 ? "auto" : "none" }}>
                {card}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
