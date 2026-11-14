"use client";

import { APP_STORE_URL, SITE_URL } from "@/lib/site";
import { mailLink, sendLink } from "@/lib/platform";
import { useEffect, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import q from "./q.module.css";

// Study Q's hero: today's live hero (app/_home/Hero.tsx), copied with round 4's words. The headline
// on the left; on the right the tall painting of the same dusk, where her phone fills the frame, so
// the note she is filling in by talking to ChatGPT can be read. Plays once on arrival; `?t=` freezes it.

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
  { text: "Lisbon flights", at: 2.5 },
];
export function Hero() {
  const t = useClock();
  const said = "Plan tomorrow. Run before work, and the dentist.";
  const k1 = span(t, 0.1, 1.1), v1 = mj(span(t, 0, 0.25));
  const v2 = mj(span(t, 2.0, 2.3));
  return (
    <section className={`${x.hero} ${q.hero}`}>
      <div className={x.words}>
        <h1 className={`${x.h1} ${q.h1} rise`} style={rise(0)}>The notebook for <em className={q.h1Em}>you and your AI</em>.</h1>
        {/* Write, draw and build name the three things next to their nouns (Emil, 11-14). */}
        <p className={`${x.lede} rise`} style={rise(1)}>Write notes, draw on whiteboards and build small apps, with your AI.</p>
        <div className={`${x.ctas} rise`} style={rise(2)}>
          <Download note={false} />
          <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
            Get it for iPhone
          </a>
          {/* Off a Mac (an iPhone, Windows, Android): the iPhone button leads, the Mac download is a link under it. */}
          <a className={x.offMac} href="/download">Download for Mac</a>
          {/* On Windows, Android or Linux: say plainly what it runs on, and offer the link for a device it runs on. */}
          <p className={`${x.fine} ${x.offApple}`} data-off-apple>
            Pinto Notes is for iPhone and Mac.{" "}
            <a href={mailLink(SITE_URL)} onClick={(e) => sendLink(navigator, e, SITE_URL)}>Send myself the link</a>
          </p>
        </div>
        <p className={`${x.fine} rise pi-apple pi-not-ios`} style={rise(3)}>Free on Mac and iPhone. Works with ChatGPT and Claude.</p>
      </div>
      <div className={`${q.heroFrame} rise`} style={rise(1)}>
      <div className={`${x.card} ${q.heroCard}`} role="img"
        aria-label="Over a woman's shoulder at dusk in San Francisco. She says: Plan tomorrow. Run before work, and the dentist. ChatGPT answers: Done. You also need to book the Lisbon flights by Friday. Added that too. Her Tomorrow note in Pinto Notes fills in on her phone.">
      <div className={q.heroArt}>
        {/* The tall painting, 1024 x 1536, drawn at most 512 CSS px wide so it stays sharp on a 2x screen. */}
        <img className={q.heroImg} src="/lab/q/shoulder-tall.webp" width={1024} height={1536} alt="" fetchPriority="high" />
        {/* Laid exactly over the painted screen (x 324-619, y 611-1221 of the painting). */}
        <div className={q.heroScreen} aria-label="Her Tomorrow note in Pinto Notes on her phone, filling in as she talks to ChatGPT.">
          <p className={q.hsStatus}><b>21:40</b></p>
          <p className={q.hsBack}>‹ My notebook</p>
          <p className={q.hsTitle}>Tomorrow</p>
          <ul className={q.hsList}>
            <li><i />Dry cleaning</li>
            {TOMORROW.map((l) => {
              const v = mj(span(t, l.at, l.at + 0.4)), fresh = v * (1 - span(t, l.at + 1.4, l.at + 2.6));
              return (
                <li key={l.text} style={{ opacity: v, transform: `translateY(${((1 - v) * 6).toFixed(1)}px)`, background: `rgba(240,144,26,${(0.16 * fresh).toFixed(3)})` }}>
                  <i />{l.text}<em title="Added by ChatGPT"><AIGlyph name="openai" size={10} /></em>
                </li>
              );
            })}
          </ul>
          <p className={q.hsSection}>This week</p>
          <ul className={q.hsList}>
            <li data-on=""><i />Long run, 12 km</li>
            <li data-on=""><i />Read 20 pages</li>
            <li><i />Call mum</li>
          </ul>
        </div>
      </div>
      </div>
        {/* What's said, in the sky above her phone. */}
        <div className={`${x.said} ${q.heroSaid}`}>
          <p className={x.me} style={{ opacity: v1, transform: `translateY(${((1 - v1) * 8).toFixed(1)}px)` }}>
            <span className={x.wave} aria-hidden="true"><i /><i /><i /><i /></span>{said.slice(0, Math.round(said.length * k1))}
          </p>
          <p className={x.ai} style={{ opacity: v2, transform: `translateY(${((1 - v2) * 8).toFixed(1)}px)` }}>
            <span><AIGlyph name="openai" size={14} />ChatGPT</span>Done. You also need to book the Lisbon flights by Friday. Added that too.
          </p>
        </div>
      </div>
    </section>
  );
}
