"use client";

import { useEffect, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { Download } from "./Download";
import x from "./hero.module.css";

// The hero: the headline on the left, and over her shoulder at dusk, she plans tomorrow out loud and
// her Pinto note fills in on her phone. Plays once on arrival.

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const mj = (v: number) => { const t = clamp(v); return t * t * t * (10 - 15 * t + 6 * t * t); };
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

/// Seconds since mount; frozen with `?t=`, at rest with Reduce Motion.
function useClock() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("t");
    if (q !== null) { setT(Number(q)); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setT(99); return; }
    let raf = 0, start = 0;
    // Starts as the page has blurred in.
    const tick = (now: number) => { if (!start) start = now; setT(Math.max(0, (now - start) / 1000 - 0.15)); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}

/// The site's entrance (site.css .rise): blur, lift and fade in, in order.
const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

const TOMORROW = [
  { text: "Run, 5 km", at: 1.2 },
  { text: "Call the dentist", at: 1.6 },
  { text: "Book Lisbon flights", at: 2.5 },
];
export function Hero() {
  const t = useClock();
  const said = "Plan tomorrow. Run before work, and the dentist.";
  const k1 = span(t, 0.1, 1.1), v1 = mj(span(t, 0, 0.25));
  const v2 = mj(span(t, 2.0, 2.3));
  return (
    <section className={x.hero}>
      <div className={x.words}>
        <h1 className={`${x.h1} rise`} style={rise(0)}>The notebook <span className={x.mark}>you and your AI</span> share.</h1>
        <p className={`${x.lede} rise`} style={rise(1)}>A notes app for you and every AI you use. It looks and feels like Apple Notes.</p>
        <div className={`${x.ctas} rise`} style={rise(2)}>
          <Download />
          <span className={x.soon} aria-disabled="true">
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
            Coming to iPhone
          </span>
        </div>
        <p className={`${x.fine} rise`} style={rise(3)}>Free for Mac. Brings your Apple Notes over.</p>
      </div>
      <div className={`${x.card} rise`} style={rise(1)} role="img"
        aria-label="Over a woman's shoulder at dusk in San Francisco. She says: Plan tomorrow. Run before work, and the dentist. ChatGPT answers: Done. You also need to book the Lisbon flights by Friday. Added that too. Her Tomorrow note in Pinto Notes fills in on her phone.">
      <div className={x.art}>
        <img className={x.artImg} src="/home-v5/hero/phone-shoulder.webp" alt="" />
        <div className={x.screen} aria-label="Her Tomorrow note in Pinto Notes on her phone, filling in as she talks to ChatGPT.">
          <div className={x.scIn}>
          <p className={x.scStatus}><b>21:40</b><span /></p>
          <p className={x.scBack}>‹ My notebook</p>
          <p className={x.scTitle}>Tomorrow</p>
          <ul className={x.scList}>
            <li><i />Pick up the dry cleaning</li>
            {TOMORROW.map((l) => {
              const v = mj(span(t, l.at, l.at + 0.4)), fresh = v * (1 - span(t, l.at + 1.4, l.at + 2.6));
              return (
                <li key={l.text} style={{ opacity: v, transform: `translateY(${((1 - v) * 6).toFixed(1)}px)`, background: `rgba(240,144,26,${(0.16 * fresh).toFixed(3)})` }}>
                  <i />{l.text}<em><AIGlyph name="openai" size={8} />ChatGPT</em>
                </li>
              );
            })}
          </ul>
          <p className={x.scSection}>This week</p>
          <ul className={x.scList}>
            <li><i data-on="" />Long run, 12 km</li>
            <li><i data-on="" />Read 20 pages</li>
            <li><i />Call mum</li>
          </ul>
        </div>
          {/* Left behind when her note lifts off: the notebook's list of notes. */}
          <div className={x.scBehind} aria-hidden="true">
            <p className={x.scStatus}><b>21:40</b><span /></p>
            <p className={x.scTitle}>My notebook</p>
            <ul className={x.scNotes}>
              {[["Tomorrow", "21:38"], ["Groceries", "Yesterday"], ["Lisbon trip", "Monday"], ["Habit tracker", "Sunday"], ["Gift ideas", "Last week"]].map(([n, d]) => <li key={n}><b>{n}</b><span>{d}</span></li>)}
            </ul>
          </div>
        </div>
        <div className={x.said}>
          <p className={x.me} style={{ opacity: v1, transform: `translateY(${((1 - v1) * 8).toFixed(1)}px)` }}>
            <span className={x.wave} aria-hidden="true"><i /><i /><i /><i /></span>{said.slice(0, Math.round(said.length * k1))}
          </p>
          <p className={x.ai} style={{ opacity: v2, transform: `translateY(${((1 - v2) * 8).toFixed(1)}px)` }}>
            <span><AIGlyph name="openai" size={12} />ChatGPT</span>Done. You also need to book the Lisbon flights by Friday. Added that too.
          </p>
        </div>
      </div>
      </div>
    </section>
  );
}
