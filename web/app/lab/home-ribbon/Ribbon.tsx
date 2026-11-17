"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AI_GLYPHS } from "@/lib/ai-glyphs";
import r from "./ribbon.module.css";

// Round 26 (`ribbon`): the first screen's one device, Wispr's lesson in Pinto's words. A line of a real
// chat (what you'd type to ChatGPT or Claude, casually) runs in from the left on the dark of a chat
// message, passes through a small pill holding the Pinto Notes icon, and comes out on the right as a
// strip of torn paper carrying the tidy note it became. Over the pill, the note's mark in the app's own
// words (Pane/Model/AIEdit.swift: "Written by ChatGPT" for a note it wrote, "Edited by Claude" for one it
// changed).
//
// Each chat line and its note share one span of the stream, both ending at its right end, so the note
// comes out as its line goes in. The stream moves right at a constant speed; everything is a pure
// function of time, so `?t=<s>` freezes a frame and Reduce Motion shows the resting one.

export type Item = {
  ai: "openai" | "claude";
  /** What you typed in the chat, as you'd type it. */
  ask: string;
  /** The note's name, set in bold, then its lines (each gets Pinto's round checkbox). */
  title: string;
  lines: string[];
  /** The app's mark for it: "Written by ChatGPT" (it wrote the note) or "Edited by Claude". */
  mark: string;
};

type Pt = [number, number];
/** A ribbon's shape in px for a box w × h: the chat side ends at the pill, the paper side starts there. */
export type Shape = { a: [Pt, Pt, Pt, Pt]; b: [Pt, Pt, Pt, Pt]; band: number; paper: number; font: number;
  /** At rest, how much of the first line (px) is still on its way in. */
  restOut?: number };

const NAME = { openai: "ChatGPT", claude: "Claude" } as const;
const GLYPH_COLOR = { openai: "#f4f1ec", claude: "#d97757" } as const;
const MARK_COLOR = { openai: "#a85700", claude: "#a85700" } as const;
const d = ([p0, c1, c2, p1]: [Pt, Pt, Pt, Pt]) => `M${p0[0]} ${p0[1]}C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p1[0]} ${p1[1]}`;
const mod = (a: number, n: number) => ((a % n) + n) % n;
/** The pill: its height against the paper's width, and its width against its height. */
const PILL_H = 1.32, PILL_AR = 1.7;

function nowT() {
  if (typeof location === "undefined") return null;
  const q = new URLSearchParams(location.search).get("t");
  return q !== null && q !== "" && Number.isFinite(+q) ? +q : null;
}

export function Ribbon({
  items, shape, speed = 64, restAt = 1, lead = 3, className = "", label, onActive, children,
}: {
  items: Item[];
  /** The ribbon's shape for its box (px). */
  shape: (w: number, h: number) => Shape;
  speed?: number;
  /** The resting frame (Reduce Motion): 1 is item 0's line just gone in; less is earlier. */
  restAt?: number;
  /** On load the stream is this many seconds before the resting frame; `?t=` counts from load. */
  lead?: number;
  className?: string;
  label: string;
  onActive?: (i: number) => void;
  children?: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<[number, number] | null>(null);
  const [active, setActive] = useState(0);
  const [lens, setLens] = useState<{ ask: number[]; note: number[] } | null>(null);

  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const fit = () => { const w = Math.round(el.clientWidth), h = Math.round(el.clientHeight); setSize((s) => (s && s[0] === w && s[1] === h ? s : [w, h])); };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = size ? shape(size[0], size[1]) : null;
  const fontKey = geo?.font ?? 0;

  // Measure each line and note once the fonts are in (and again when the type size changes).
  useEffect(() => {
    if (!svg.current || !fontKey) return;
    let off = false;
    const run = () => {
      if (off || !svg.current) return;
      const m = svg.current.querySelectorAll<SVGTextElement>("[data-measure]");
      const ask: number[] = [], note: number[] = [];
      m.forEach((t) => { const i = +t.dataset.i!; if (t.dataset.measure === "ask") ask[i] = t.getComputedTextLength(); else note[i] = t.getBBox().width; });
      setLens({ ask, note });
    };
    run();
    document.fonts?.ready.then(run);
    return () => { off = true; };
  }, [fontKey, items]);

  // The stream.
  useEffect(() => {
    const el = svg.current; if (!el || !geo || !lens) return;
    const pa = el.querySelector<SVGPathElement>("[data-a]")!, pb = el.querySelector<SVGPathElement>("[data-b]")!;
    const LA = pa.getTotalLength(), LB = pb.getTotalLength();
    const g = geo.font, glyph = g * 1.15, gGap = g * 0.6, pad = g * 0.45, gapA = g * 5, gapB = g * 2.6;
    // Crossing is counted at the pill's edges (half its width from the join), not at the join.
    const edge = geo.paper * PILL_H * PILL_AR / 2 + 6;
    // Each item takes a span on each side: its line and the AI's glyph on the chat side, its note on the
    // paper. Item i's two spans cross the pill together, so a line goes in as its note comes out; the
    // paper moves slower than the chat (a note is shorter than what was said), easing between items.
    const aW = items.map((_, i) => lens.ask[i] + glyph + gGap + gapA);
    const bW = items.map((_, i) => lens.note[i] + pad * 2 + gapB);
    const sum = (v: number[]) => v.reduce((x, y) => x + y, 0);
    // One pass on each side must be longer than that side plus an item, so an item shows once.
    const wantA = LA + Math.max(...aW) + edge + 40, wantB = LB + Math.max(...bW) + edge + 40;
    let reps = 1;
    while ((sum(aW) * reps < wantA || sum(bW) * reps < wantB) && reps < 3) reps++;
    // Still short with three copies: more room between the items on that side.
    const grow = (w: number[], want: number) => { const need = want - sum(w) * reps; if (need > 0) w.forEach((_, i) => { w[i] += need / (w.length * reps); }); };
    grow(aW, wantA); grow(bW, wantB);
    /** The paper side's window: an item is drawn from just before it crosses to after it has left. */
    const WB = LB + Math.max(...bW) + 20;
    const seq: { i: number; a: number; b: number; A: number; B: number }[] = [];
    let A = 0, B = 0;
    for (let r0 = 0; r0 < reps; r0++) items.forEach((_, i) => { seq.push({ i, a: aW[i], b: bW[i], A, B }); A += aW[i]; B += bW[i]; });
    const TA = A, TB = B, N = seq.length;
    const ratio = (j: number) => seq[mod(j, N)].b / seq[mod(j, N)].a;
    /** How far the paper has moved when the chat has moved X: within an item, a cubic that meets its
     *  neighbours' speeds at the joins (no jolt where the speed changes). */
    const paperAt = (X: number) => {
      const n = Math.floor(X / TA), xm = X - n * TA;
      let j = 0; while (j < N - 1 && xm >= seq[j + 1].A) j++;
      const it = seq[j], u = (xm - it.A) / it.a, k = it.b / it.a;
      const m0 = ((ratio(j - 1) + k) / 2) / k, m1 = ((k + ratio(j + 1)) / 2) / k;
      const h = (u ** 3 - 2 * u ** 2 + u) * m0 + (-2 * u ** 3 + 3 * u ** 2) + (u ** 3 - u ** 2) * m1;
      return { Y: n * TB + it.B + it.b * h, j };
    };
    const nodes = seq.map((_, j) => ({
      ask: el.querySelector<SVGTextPathElement>(`[data-ask="${j}"]`)!,
      askT: el.querySelector<SVGTextElement>(`[data-askt="${j}"]`)!,
      note: el.querySelector<SVGTextPathElement>(`[data-note="${j}"]`)!,
      noteT: el.querySelector<SVGTextElement>(`[data-notet="${j}"]`)!,
      tint: el.querySelector<SVGPathElement>(`[data-tint="${j}"]`)!,
      glyph: el.querySelector<SVGGElement>(`[data-glyph="${j}"]`)!,
    }));
    const show = (n: Element, on: boolean) => { const v = on ? "" : "none"; if ((n as SVGElement).style.display !== v) (n as SVGElement).style.display = v; };
    let last = -1;
    const pose = (t: number) => {
      const X = speed * t, { Y, j: now } = paperAt(X);
      seq.forEach((sp, j) => {
        const n = nodes[j], i = sp.i;
        // e: how far this item's chat span has crossed the pill (its right end reaches it at 0). A span is
        // its glyph, its line, then a gap; the paper's is its note, then a gap.
        const e = mod(X - sp.A - sp.a, TA) - TA + sp.a;
        const askLen = lens.ask[i], noteLen = lens.note[i];
        const a1 = LA - edge + e - gapA, a0 = a1 - askLen, gc = a0 - gGap - glyph / 2;
        const askOn = a1 > 0 && a0 < LA;
        show(n.askT, askOn); show(n.glyph, a1 > 0 && gc < LA - 4);
        if (askOn) n.ask.setAttribute("startOffset", a0.toFixed(1));
        if (a1 > 0 && gc < LA - 4) {
          const p = pa.getPointAtLength(Math.max(0, gc)), p2 = pa.getPointAtLength(Math.min(LA, Math.max(0, gc) + 1));
          const ang = (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI;
          n.glyph.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(2)}) translate(${(-glyph / 2).toFixed(1)} ${(-glyph / 2).toFixed(1)}) scale(${(glyph / 24).toFixed(3)})`);
        }
        // f: the same for its paper span; its note sits at the span's right end.
        const f = mod(Y - sp.B - WB, TB) - TB + WB;
        const b1 = f + edge - gapB + g * 1.6, b0 = b1 - noteLen;
        const noteOn = b1 > 0 && b0 < LB;
        show(n.noteT, noteOn); show(n.tint, noteOn);
        if (noteOn) {
          n.note.setAttribute("startOffset", b0.toFixed(1));
          const s0 = Math.max(0, b0 - pad), s1 = Math.min(LB, b1 + pad);
          n.tint.setAttribute("stroke-dasharray", `0 ${s0.toFixed(1)} ${Math.max(0, s1 - s0).toFixed(1)} ${(LB + 999).toFixed(0)}`);
        }
      });
      // The pill's mark is the item crossing now.
      const i = seq[now].i;
      if (i !== last) { last = i; setActive(i); onActive?.(i); }
    };
    // The resting frame: item 0's line wholly in, only its AI's glyph still outside the pill, and its
    // note wholly out beside it (restAt moves it along: 1 is that frame).
    const rest = ((gapA + lens.ask[0] + 6 - (geo.restOut ?? 0)) * restAt) / speed, start = rest - lead;
    const frozen = nowT();
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (frozen !== null || calm) { pose(frozen !== null ? start + frozen : rest); return; }
    let raf = 0, t0 = 0, seen = true, base = start;
    const tick = (now: number) => {
      if (!t0) t0 = now;
      pose(base + (now - t0) / 1000);
      raf = seen ? requestAnimationFrame(tick) : 0;
    };
    pose(base);
    raf = requestAnimationFrame(tick);
    // Stop when off screen; carry on from the same point when it comes back.
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !seen) { seen = true; t0 = 0; raf = requestAnimationFrame(tick); }
      else if (!e.isIntersecting && seen) { seen = false; if (t0) base += (performance.now() - t0) / 1000; t0 = 0; cancelAnimationFrame(raf); raf = 0; }
    });
    io.observe(el);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo?.a.join(), geo?.b.join(), lens, speed, restAt, lead]);

  const it = items[active];
  const seqN = (() => {
    // Enough copies for the longest screen; extra ones simply stay hidden.
    return items.length * 3;
  })();
  return (
    <div ref={box} className={`${r.ribbon} ${className}`} role="img" aria-label={label}>
      {geo && (
        <svg ref={svg} className={r.svg} width={size![0]} height={size![1]} viewBox={`0 0 ${size![0]} ${size![1]}`} aria-hidden="true" style={{ "--rf": `${geo.font}px` } as React.CSSProperties}>
          <defs>
            <path id="rb-a" d={d(geo.a)} />
            <path id="rb-b" d={d(geo.b)} />
            {/* The paper's torn edges: its outline pushed about by a little noise. */}
            <filter id="rb-torn" x="-10%" y="-60%" width="120%" height="220%">
              <feTurbulence type="fractalNoise" baseFrequency="0.07 0.11" numOctaves="3" seed="7" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={Math.max(5, geo.paper * 0.14)} xChannelSelector="R" yChannelSelector="G" result="t" />
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#3c1e08" floodOpacity="0.16" />
              <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#3c1e08" floodOpacity="0.12" />
            </filter>
            <filter id="rb-soft" x="-10%" y="-60%" width="120%" height="220%">
              <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#1a0d02" floodOpacity="0.18" />
            </filter>
          </defs>
          {/* The chat: a message's dark, its words, and the AI it was typed to. */}
          <path data-a d={d(geo.a)} className={r.chat} strokeWidth={geo.band} filter="url(#rb-soft)" />
          <g className={r.askText}>
            {Array.from({ length: seqN }, (_, j) => {
              const k = items[j % items.length];
              return (
                <text key={j} data-askt={j} style={{ display: "none" }} dominantBaseline="central">
                  <textPath data-ask={j} href="#rb-a" startOffset={-9999}>{k.ask}</textPath>
                </text>
              );
            })}
          </g>
          <g>
            {Array.from({ length: seqN }, (_, j) => {
              const k = items[j % items.length];
              return <g key={j} data-glyph={j} style={{ display: "none" }}><path d={AI_GLYPHS[k.ai]} fill={GLYPH_COLOR[k.ai]} /></g>;
            })}
          </g>
          {/* The note: a strip of paper, the tint the app lays on what an AI wrote, and the note itself. */}
          <path data-b d={d(geo.b)} className={r.paper} strokeWidth={geo.paper} filter="url(#rb-torn)" />
          <g>
            {Array.from({ length: seqN }, (_, j) => (
              <path key={j} data-tint={j} d={d(geo.b)} className={r.tint} strokeWidth={geo.font * 1.6} style={{ display: "none" }} />
            ))}
          </g>
          <g className={r.noteText}>
            {Array.from({ length: seqN }, (_, j) => {
              const k = items[j % items.length];
              return (
                <text key={j} data-notet={j} style={{ display: "none" }} dominantBaseline="central">
                  <textPath data-note={j} href="#rb-b" startOffset={-9999}><NoteSpans k={k} /></textPath>
                </text>
              );
            })}
          </g>
          {/* For measuring only. */}
          <g className={r.measure}>
            {items.map((k, i) => (
              <g key={i}>
                <text data-measure="ask" data-i={i} className={r.askText}>{k.ask}</text>
                <text data-measure="note" data-i={i} className={r.noteText}><NoteSpans k={k} /></text>
              </g>
            ))}
          </g>
        </svg>
      )}
      {geo && (
        <div className={r.pill} style={{ left: geo.a[3][0], top: geo.a[3][1], "--pillH": `${Math.round(geo.paper * PILL_H)}px` } as React.CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark-256.png" alt="" width={256} height={256} />
          <span key={active} className={r.mark} data-ai={it.ai}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={AI_GLYPHS[it.ai]} fill={it.ai === "claude" ? "#d97757" : MARK_COLOR[it.ai]} /></svg>
            {it.mark}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

function NoteSpans({ k }: { k: Item }) {
  return (
    <>
      <tspan className={r.nTitle}>{k.title}</tspan>
      {k.lines.map((l) => (
        <tspan key={l}>
          <tspan className={r.box} dx="1.3em">○</tspan>
          <tspan dx="0.4em">{l}</tspan>
        </tspan>
      ))}
    </>
  );
}

export { NAME };
