"use client";

import { useEffect, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { G } from "../../copy";
import { Download } from "../../kit";
import x from "./heroes2.module.css";

// Hero round 2: six visual ideas with the same headline. Each is the first screen only.

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const mj = (v: number) => { const t = clamp(v); return t * t * t * (10 - 15 * t + 6 * t * t); };
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

const Title = ({ className }: { className?: string }) => (
  <h1 className={className}>The notebook you and your AI share.</h1>
);
const LEDE = "ChatGPT, Claude and Muse read and write in it, with your OK. It looks and feels like Apple Notes.";

/// Seconds since mount, looping every `loop` seconds; frozen with `?t=`, at rest with Reduce Motion.
function useClock(loop = 0) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("t");
    if (q !== null) { setT(Number(q)); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setT(loop ? loop * 0.8 : 99); return; }
    let raf = 0, start = 0;
    const tick = (now: number) => { if (!start) start = now; const s = (now - start) / 1000; setT(loop ? s % loop : s); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loop]);
  return t;
}

const GROK = "M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815";
type Ai = { name: string; glyph?: "openai" | "claude" | "meta"; path?: string; color: string; ink: string };
const AIS: Ai[] = [
  { name: "ChatGPT", glyph: "openai", color: "#0d0d0d", ink: "#2b6b4f" },
  { name: "Claude", glyph: "claude", color: "#d97757", ink: "#c15f3c" },
  { name: "Muse", glyph: "meta", color: "#0866ff", ink: "#2456c9" },
  { name: "Grok", path: GROK, color: "#0d0d0d", ink: "#3b3b3b" },
  { name: "Claude Code", glyph: "claude", color: "#d97757", ink: "#a2482a" },
];
const Mark = ({ a, size }: { a: Ai; size: number }) => a.glyph
  ? <AIGlyph name={a.glyph} size={size} color={a.color} />
  : <svg width={size} height={size} viewBox="0 0 24 24" fill={a.color} aria-hidden="true"><path d={a.path} /></svg>;

// Lines that land on the notebook's page, each written by one AI.
const PAGE = [
  { by: 0, text: "Mon · 5 km easy" },
  { by: 1, text: "Moved Thursday's run to Sunday" },
  { by: 2, text: "Groceries: oats, spinach, feta" },
  { by: 4, text: "Sync fix shipped, tests pass" },
  { by: 3, text: "Lisbon: book the tram tour" },
];

/// 1. Every AI, one notebook: the paper notebook in the middle, every AI threaded to it. Now and then
/// a spark runs down a thread and a line lands on the page in that AI's ink.
export function ThreadsHero() {
  const t = useClock(14);
  const beat = 2.6;
  // Disc positions around the notebook, in % of the stage.
  const spots = [{ x: 16, y: 30 }, { x: 84, y: 26 }, { x: 12, y: 74 }, { x: 88, y: 72 }, { x: 50, y: 92 }];
  const NB = { x: 50, y: 56 };
  return (
    <section className={x.threads}>
      <div className={x.threadsHead}>
        <Title className={x.h1} />
        <p className={x.lede}>{LEDE}</p>
        <Download quiet={G.quiet} />
      </div>
      <div className={x.threadsStage}>
        <img className={x.nbArt} src="/home-v5/hero/notebook.webp" alt="" />
        <svg className={x.strings} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {spots.map((s, i) => <path key={i} d={`M ${s.x} ${s.y} Q ${(s.x + NB.x) / 2} ${Math.min(s.y, NB.y) - 8}, ${NB.x} ${NB.y}`} />)}
        </svg>
        {PAGE.map((l, i) => {
          const at = 0.6 + i * beat;
          const k = mj(span(t, at, at + 0.9));
          const s = spots[l.by], m = { x: (s.x + NB.x) / 2, y: Math.min(s.y, NB.y) - 8 };
          const q = 1 - k;
          const px = q * q * s.x + 2 * q * k * m.x + k * k * NB.x, py = q * q * s.y + 2 * q * k * m.y + k * k * NB.y;
          const v = t > at && t < at + 0.9 ? 1 : 0;
          return <span key={i} className={x.spark} style={{ left: `${px}%`, top: `${py}%`, opacity: v, background: AIS[l.by].ink }} />;
        })}
        <ul className={x.pageLines} aria-hidden="true">
          {PAGE.map((l, i) => {
            const at = 0.6 + i * beat + 0.85;
            const w = span(t, at, at + 0.8);
            return <li key={i} style={{ color: AIS[l.by].ink, opacity: w > 0 ? 1 : 0 }}>{l.text.slice(0, Math.round(l.text.length * w))}</li>;
          })}
        </ul>
        {AIS.map((a, i) => {
          const s = spots[i];
          const live = PAGE.some((l, j) => l.by === i && t > 0.6 + j * beat - 0.2 && t < 0.6 + j * beat + 0.9);
          return (
            <span key={a.name} className={x.node} data-live={live || undefined} style={{ left: `${s.x}%`, top: `${s.y}%`, animationDelay: `${-1.1 * i}s` }}>
              <span className={x.nodeDisc}><Mark a={a} size={24} /></span>{a.name}
            </span>
          );
        })}
      </div>
    </section>
  );
}

/// 2. The real thing: the actual Mac app and the iPhone app, big and well lit. No illustration.
export function ProductHero() {
  return (
    <section className={x.product}>
      <div className={x.productHead}>
        <Title className={x.h1} />
        <p className={x.lede}>{LEDE}</p>
        <Download quiet={G.quiet} />
      </div>
      <div className={x.productStage}>
        <img className={x.mac} src="/home-h/window-lisbon.webp" alt="Pinto Notes on a Mac: a Lisbon trip note with a checklist, places and a table." />
        <div className={x.iphone}><img src="/home-h/iphone-notes.webp" alt="Pinto Notes on an iPhone: All Notes with pinned notes." /></div>
      </div>
    </section>
  );
}

/// 3. Hands and a phone at dusk, on a walk. Human, and it leads into the people below.
export function HandsHero() {
  return (
    <section className={x.hands}>
      <img className={x.handsArt} src="/home-v5/hero/hands.webp" alt="" />
      <div className={x.handsWords}>
        <Title className={x.h1Light} />
        <p className={x.ledeLight}>{LEDE}</p>
        <Download quiet={G.quiet} />
      </div>
    </section>
  );
}

/// 4. Type on a colour field: no picture. Behind the words, faint lines keep writing themselves, each
/// in a different AI's ink, then fade.
const GHOST = ["Mon · 5 km easy", "Call the dentist before ten", "Bench 65 kg next push day", "Pick up the sync rewrite", "Ten pages before work", "Lisbon: tram 28 early", "Groceries 410 kr under", "Moved Thursday to Sunday"];
export function FieldHero() {
  const t = useClock(16);
  return (
    <section className={x.field}>
      <div className={x.fieldLines} aria-hidden="true">
        {GHOST.map((g, i) => {
          const at = i * 1.8, w = span(t, at, at + 1.2), out = span(t, at + 5, at + 6.5);
          return <p key={i} style={{ top: `${8 + i * 11.5}%`, left: `${[6, 52, 18, 60, 4, 44, 28, 66][i]}%`, color: AIS[i % AIS.length].ink, opacity: 0.22 * (w > 0 ? 1 : 0) * (1 - out) }}>{g.slice(0, Math.round(g.length * w))}</p>;
        })}
      </div>
      <div className={x.fieldWords}>
        <Title className={x.fieldH1} />
        <p className={x.lede}>{LEDE}</p>
        <Download quiet={G.quiet} />
      </div>
    </section>
  );
}

/// 5. The page, close up: an open paper notebook filling the stage; lines arrive in different hands.
export function PageHero() {
  const t = useClock(13);
  return (
    <section className={x.page}>
      <div className={x.pageWords}>
        <Title className={x.h1} />
        <p className={x.lede}>{LEDE}</p>
        <Download quiet={G.quiet} />
      </div>
      <div className={x.pageStage}>
        <img src="/home-v5/hero/notebook.webp" alt="" />
        <ul className={x.pageBig} aria-hidden="true">
          {PAGE.map((l, i) => {
            const at = 0.5 + i * 2.2, w = span(t, at, at + 1);
            return (
              <li key={i} style={{ opacity: w > 0 ? 1 : 0 }}>
                <span style={{ color: AIS[l.by].ink }}>{l.text.slice(0, Math.round(l.text.length * w))}</span>
                <em style={{ opacity: mj(span(t, at + 1, at + 1.4)) }}><Mark a={AIS[l.by]} size={11} />{AIS[l.by].name}</em>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/// 6. Tell it once: one message box, centred. You type, it's saved to the notebook, and a second AI
/// already knows it.
export function AskHero() {
  const t = useClock(11);
  const msg = "Remember: I'm vegetarian, and I run on Sundays.";
  const typed = span(t, 0.6, 2.6), sent = mj(span(t, 2.8, 3.2)), saved = mj(span(t, 3.4, 3.9)), other = mj(span(t, 5, 5.6));
  return (
    <section className={x.ask}>
      <Title className={x.askH1} />
      <div className={x.askStage}>
        <div className={x.askBox} data-sent={sent > 0.5 || undefined}>
          <span className={x.askApp}><AIGlyph name="openai" size={16} />ChatGPT</span>
          <p>{msg.slice(0, Math.round(msg.length * typed))}{typed < 1 && <i className={x.askCaret} />}</p>
        </div>
        <p className={x.askSaved} style={{ opacity: saved, transform: `translateY(${((1 - saved) * 10).toFixed(1)}px)` }}>
          <span className={x.askTick}><svg viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7" /></svg></span>Saved to <b>About me</b> in your notebook
        </p>
        <div className={x.askOther} style={{ opacity: other, transform: `translateY(${((1 - other) * 12).toFixed(1)}px)` }}>
          <span className={x.askApp}><AIGlyph name="claude" size={16} color="#d97757" />Claude, the next day</span>
          <p>Five vegetarian dinners, and pasta on Saturday before your Sunday run.</p>
        </div>
      </div>
      <div className={x.askCta}><Download quiet={G.quiet} /></div>
    </section>
  );
}

/// 3b. Hands at dusk, with the moment: she plans tomorrow out loud, and her Pinto note fills in on the
/// phone in her hands (each line marked ChatGPT). What she says floats beside the phone. Plays once.
const TOMORROW = [
  { text: "Run, 5 km", at: 2.2 },
  { text: "Call the dentist", at: 3.0 },
  { text: "Book Lisbon flights", at: 5.6 },
];
export function PhoneMomentHero() {
  const t = useClock();
  const said = "Plan tomorrow. Run before work, and the dentist.";
  const k1 = span(t, 0.5, 2.0), v1 = mj(span(t, 0.3, 0.6));
  const v2 = mj(span(t, 4.2, 4.6));
  return (
    <section className={`${x.moment} ${x.shoulder}`} data-dark-band="">
      <div className={x.momentFit}>
        <img className={x.momentArt} src="/home-v5/hero/phone-shoulder.webp" alt="" />
        <div className={x.screen} aria-label="Her Tomorrow note in Pinto Notes on her phone, filling in as she talks to ChatGPT.">
          <div className={x.scIn}>
          <p className={x.scStatus}><b>21:40</b><span /></p>
          <p className={x.scBack}>‹ Plans</p>
          <h3 className={x.scTitle}>Tomorrow</h3>
          <ul className={x.scList}>
            <li><i />Pick up the dry cleaning</li>
            {TOMORROW.map((l) => {
              const v = mj(span(t, l.at, l.at + 0.5)), fresh = v * (1 - span(t, l.at + 1.6, l.at + 3));
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
        </div>
        <div className={x.saidBox}>
          <p className={x.saidMe} style={{ opacity: v1, transform: `translateY(${((1 - v1) * 8).toFixed(1)}px)` }}>
            <span className={x.scWave} aria-hidden="true"><i /><i /><i /><i /></span>{said.slice(0, Math.round(said.length * k1))}
          </p>
          <p className={x.saidAi} style={{ opacity: v2, transform: `translateY(${((1 - v2) * 8).toFixed(1)}px)` }}>
            <span><AIGlyph name="openai" size={12} />ChatGPT</span>Done. You also need to book the Lisbon flights by Friday. Added that too.
          </p>
        </div>
      </div>
      <div className={x.momentWords}>
        <Title className={x.h1Light} />
        <p className={x.ledeLight}>ChatGPT, Claude and Muse read and write in it, with your OK.</p>
        <Download quiet={G.quiet} />
      </div>
    </section>
  );
}
