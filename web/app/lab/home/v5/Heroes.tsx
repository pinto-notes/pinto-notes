"use client";

import { useEffect, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { G } from "../../copy";
import { Download } from "../../kit";
import h from "../../home-h/h.module.css";
import x from "./heroes.module.css";

// Three hero studies for version 5. Each is only the first screen; the week film follows below.

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const mj = (v: number) => { const t = clamp(v); return t * t * t * (10 - 15 * t + 6 * t * t); };
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

const Title = ({ className }: { className?: string }) => (
  <h1 className={className}>The notebook <span className={h.mark}>you and your AI</span> share.</h1>
);
const LEDE = "Plan with ChatGPT, check in with Claude, tick things off yourself. It all lands in one notebook that looks and feels like Apple Notes.";

const AIS = [
  { name: "ChatGPT", glyph: "openai" as const, color: "#0d0d0d" },
  { name: "Claude", glyph: "claude" as const, color: "#d97757" },
  { name: "Muse", glyph: "meta" as const, color: "#0866ff" },
  { name: "Claude Code", glyph: "claude" as const, color: "#d97757" },
];

/// A small clock for the first screen: seconds since mount, frozen with `?t=`.
function useClock() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("t");
    if (q !== null) { setT(Number(q)); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setT(99); return; }
    let raf = 0, start = 0;
    const tick = (now: number) => { if (!start) start = now; setT((now - start) / 1000); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}

/// The note that comes alive on its own: ChatGPT writes three lines, then you tick the first, then a
/// line from Claude lands. Plays once, then rests.
const LIVE = [
  { text: "Mon · 5 km easy", by: "ChatGPT", glyph: "openai" as const, at: 0.8 },
  { text: "Wed · Intervals, 6 × 400 m", by: "ChatGPT", glyph: "openai" as const, at: 1.6 },
  { text: "Sat · Long run, 12 km", by: "ChatGPT", glyph: "openai" as const, at: 2.4 },
  { text: "Sun · 5 km easy, moved from Thursday", by: "Claude", glyph: "claude" as const, at: 4.6 },
];
function LiveNote({ t, big = false }: { t: number; big?: boolean }) {
  const tick = span(t, 3.6, 3.9);
  return (
    <figure className={`${x.note} ${big ? x.noteBig : ""}`}>
      <div className={x.bar}><span className={x.lights}><i /><i /><i /></span><span className={x.folder}>Health</span></div>
      <div className={x.paper}>
        <h3 className={x.title}>Running plan</h3>
        <p className={x.sub}>Half marathon on 30 November.</p>
        <ul className={x.lines}>
          {LIVE.map((l, i) => {
            const w = span(t, l.at, l.at + 0.7);
            const shown = l.text.slice(0, Math.round(l.text.length * w));
            const done = i === 0 && tick > 0.5;
            const fresh = w > 0 ? 1 - span(t, l.at + 1.2, l.at + 2.4) : 0;
            return (
              <li key={i} style={{ opacity: w > 0 ? 1 : 0, background: `rgba(240,144,26,${(0.15 * fresh).toFixed(3)})` }}>
                {w <= 0 && <span className={x.ghost} />}
                <span className={x.box} data-on={done || undefined}><svg viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7" /></svg></span>
                <span data-done={done || undefined}>{shown}{w > 0 && w < 1 && <i className={x.caret} />}</span>
                <span className={x.by} style={{ opacity: mj(span(t, l.at + 0.7, l.at + 1)) }}><AIGlyph name={l.glyph} size={11} color={l.glyph === "claude" ? "#d97757" : undefined} />{l.by}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </figure>
  );
}

/// A. A paper world: the first screen is one of our cut-paper scenes, a desk by a window. The headline
/// sits in the calm sky; the live note lies on the desk with every AI threaded to it.
export function WorldHero({ art, calm = false }: { art: "day" | "night"; calm?: boolean }) {
  const t = useClock();
  return (
    <section className={x.world} data-art={art} data-calm={calm || undefined}>
      <img className={x.worldArt} src={art === "day" ? "/home-v5/hero/desk-day.webp" : "/home-v5/hero/desk-night.webp"} alt="" />
      <div className={x.worldWords}>
        <Title className={x.worldH1} />
        <p className={x.worldLede}>{calm ? "ChatGPT, Claude and Muse read and write in it, with your OK. It looks and feels like Apple Notes." : LEDE}</p>
        <Download quiet={G.quiet} />
      </div>
      {!calm && <div className={x.worldNote}>
        <LiveNote t={t} />
        <ul className={x.orbit} aria-label="Works with ChatGPT, Claude, Muse and Claude Code">
          {AIS.map((a, i) => (
            <li key={a.name} style={{ animationDelay: `${(-1.3 * i).toFixed(1)}s` }}>
              <span className={x.disc}><AIGlyph name={a.glyph} size={22} color={a.color} /></span>{a.name}
            </li>
          ))}
        </ul>
      </div>}
    </section>
  );
}

/// B. Big type: the headline across the whole width, set huge; the film starts right under it.
export function TypeHero() {
  return (
    <section className={x.type}>
      <Title className={x.typeH1} />
      <div className={x.typeRow}>
        <p className={x.typeLede}>{LEDE}</p>
        <div className={x.typeCta}><Download quiet={G.quiet} /></div>
      </div>
      <ul className={x.typeAis} aria-label="Works with">
        {AIS.map((a) => <li key={a.name}><AIGlyph name={a.glyph} size={16} color={a.color} />{a.name}</li>)}
      </ul>
    </section>
  );
}

/// C. The note is the hero: one big note, centred, already being written when you arrive.
export function AliveHero() {
  const t = useClock();
  return (
    <section className={x.alive}>
      <Title className={x.aliveH1} />
      <div className={x.aliveStage}>
        <LiveNote t={t} big />
        {AIS.slice(0, 2).map((a, i) => {
          const v = i === 0 ? mj(span(t, 0.3, 0.8)) * (1 - mj(span(t, 3.2, 3.6))) : mj(span(t, 4.2, 4.6));
          return (
            <p key={a.name} className={x.aliveChat} data-side={i === 0 ? "l" : "r"} style={{ opacity: v, transform: `translateY(${((1 - v) * 10).toFixed(1)}px)` }}>
              <span><AIGlyph name={a.glyph} size={13} color={a.color} />{a.name}</span>
              {i === 0 ? "Plan four runs a week in my notes." : "You missed Thursday. I moved it to Sunday."}
            </p>
          );
        })}
      </div>
      <div className={x.aliveCta}><p>{LEDE}</p><Download quiet={G.quiet} /></div>
    </section>
  );
}
