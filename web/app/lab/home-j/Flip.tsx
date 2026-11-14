"use client";

import { APP_STORE_URL, SITE_URL } from "@/lib/site";
import { mailLink, sendLink } from "@/lib/platform";
import { AIGlyph } from "@/lib/ai-glyphs";
import { useEffect, useRef, useState } from "react";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { Board } from "./Board";
import s from "./j.module.css";

// Study J, "Say it, and it's there". The first screen is a headline, the download, and three paper
// cards: Notes, Whiteboards, Apps. Each card starts on its back, what you said to your AI, then turns
// over to show what it made in Pinto. After that, pointing at a card (or tapping it) turns it back.
// On a phone the cards stack, and each one turns when it scrolls into view.
// `?t=<s>` freezes the opening at that second (every card counted as in view at 0) for stills.
// Reduce Motion: no turning; the fronts show, with what was said as a caption.

type Card = { id: "notes" | "whiteboards" | "apps"; title: string; line: string; ai: { name: string; glyph: "openai" | "claude" }; said: string };
const CARDS: Card[] = [
  { id: "notes", title: "Write.", line: "Notes that feel like Apple Notes, on Mac and iPhone.", ai: { name: "ChatGPT", glyph: "openai" }, said: "Add olive oil to my groceries." },
  { id: "whiteboards", title: "Draw.", line: "A whiteboard next to your notes. Your AI can read it and draw on it.", ai: { name: "Claude Code", glyph: "claude" }, said: "Sketch how a post gets published." },
  { id: "apps", title: "Build.", line: "Small apps in a note, like a habit tracker.", ai: { name: "Claude", glyph: "claude" }, said: "Make me a habit tracker." },
];

/* ── The turn: one angle per card, 180 on its back, 0 on its front ── */
const FIRST = 1.5, APART = 0.42, TURN = 1.15, BACK = 0.8;
const clamp = (v: number) => Math.min(1, Math.max(0, v));
/** Like a hand turning a card: a slow lift, a quicker middle, a soft landing. */
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Tween = { from: number; to: number; t0: number; dur: number };
const at = (w: Tween, now: number) => w.from + (w.to - w.from) * ease(clamp((now - w.t0) / (w.dur * 1000)));

/** Writes the angle, the lift and the shade of a card straight to its style. */
function paint(el: HTMLElement | null, a: number) {
  if (!el) return;
  const r = (a * Math.PI) / 180, side = Math.abs(Math.sin(r));
  el.style.setProperty("--a", `${a.toFixed(2)}deg`);
  el.style.setProperty("--lift", side.toFixed(3));
  el.dataset.side = a > 90 ? "back" : "front";
}

export function Flip() {
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const tweens = useRef<Tween[]>(CARDS.map(() => ({ from: 180, to: 180, t0: 0, dur: 0 })));
  const raf = useRef(0);
  const [still, setStill] = useState(false);
  const [back, setBack] = useState<boolean[]>([true, true, true]);
  const hover = useRef(false);

  const run = () => {
    cancelAnimationFrame(raf.current);
    const tick = () => {
      const now = performance.now();
      let busy = false;
      tweens.current.forEach((w, i) => {
        paint(cards.current[i], at(w, now));
        if (now < w.t0 + w.dur * 1000) busy = true;
      });
      if (busy) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  /** Turns card i to its back (180) or front (0), from wherever it is now, after `wait` seconds. */
  const turn = (i: number, to: number, wait = 0) => {
    const now = performance.now(), w = tweens.current[i];
    const from = at(w, now);
    const dur = (to === 0 && w.to === 180 && from === 180 ? TURN : BACK) * Math.max(0.35, Math.abs(to - from) / 180);
    tweens.current[i] = { from, to, t0: now + wait * 1000, dur };
    setBack((b) => b.map((v, k) => (k === i ? to === 180 : v)));
    run();
  };

  useEffect(() => {
    hover.current = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const q = new URLSearchParams(location.search);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true);
      tweens.current = CARDS.map(() => ({ from: 0, to: 0, t0: 0, dur: 0 }));
      cards.current.forEach((el) => paint(el, 0));
      setBack([false, false, false]);
      return;
    }
    if (q.get("t") !== null) {
      // A still: every card counted as in view at 0, each turning on the opening's schedule.
      const t = Number(q.get("t")) || 0;
      CARDS.forEach((_, i) => {
        const p = clamp((t - (FIRST + i * APART)) / TURN), a = 180 * (1 - ease(p));
        tweens.current[i] = { from: a, to: a, t0: 0, dur: 0 };
        paint(cards.current[i], a);
      });
      setBack(CARDS.map((_, i) => t < FIRST + i * APART + TURN / 2));
      return;
    }
    // The opening: each card turns once it's well in view, a beat after the one before.
    cards.current.forEach((el) => paint(el, 180));
    let next = 0;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const i = cards.current.indexOf(e.target as HTMLLIElement);
        io.unobserve(e.target);
        const now = performance.now() / 1000;
        const when = Math.max(now + (next ? 0.9 : FIRST), next + APART);
        next = when;
        turn(i, 0, when - now);
      }
    }, { threshold: 0.6 });
    cards.current.forEach((el) => el && io.observe(el));
    return () => { io.disconnect(); cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

  return (
    <section className={s.hero} data-still={still ? "" : undefined} aria-labelledby="j-h1">
      <div className={s.head}>
        <h1 id="j-h1" className={`${s.h1} rise`} style={rise(0)}>Write. Draw. Build. <span style={{ display: "block", marginTop: "0.22em", fontSize: "0.56em", letterSpacing: "-0.025em", color: "#9a7650", textWrap: "balance" }}>The notebook for you and your AI.</span></h1>
        <div className={`${s.side} rise`} style={rise(1)}>
          <p className={s.lede}>A free notes app for Mac and iPhone, with whiteboards and small apps. Connect ChatGPT or Claude and they work in all of it.</p>
          <div className={x.ctas}>
            <Download note={false} />
            <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
              Get it for iPhone
            </a>
            <a className={x.offMac} href="/download">Download for Mac</a>
            <p className={`${x.fine} ${x.offApple}`} data-off-apple>
              Pinto Notes is for iPhone and Mac.{" "}
              <a href={mailLink(SITE_URL)} onClick={(ev) => sendLink(navigator, ev, SITE_URL)}>Send myself the link</a>
            </p>
          </div>
        </div>
      </div>

      <ul className={`${s.cards} rise`} style={rise(2)}>
        {CARDS.map((c, i) => (
          <li key={c.id} ref={(el) => { cards.current[i] = el; }} className={s.card} data-card={c.id} data-side="back"
            onPointerEnter={(e) => { if (!still && hover.current && e.pointerType === "mouse") turn(i, 180, 0.06); }}
            onPointerLeave={(e) => { if (!still && hover.current && e.pointerType === "mouse") turn(i, 0); }}>
            <span className={s.shadow} aria-hidden="true" />
            <div className={s.turner}>
              {/* The front: what it made, as Pinto draws it. */}
              <div className={`${s.face} ${s.front}`} aria-hidden={back[i] && !still}>
                <h2 className={s.cardHead}><b>{c.title}</b> {c.line}</h2>
                <div className={s.pic}>
                  {c.id === "notes" && <Note />}
                  {c.id === "whiteboards" && <div className={s.boardWrap}><p className={s.boardBar}><span aria-hidden="true">‹</span>Publishing flow</p><Board /></div>}
                  {c.id === "apps" && <Habits />}
                </div>
                <p className={s.caption}><AIGlyph name={c.ai.glyph} size={15} /><span>{c.ai.name}:</span> “{c.said}”</p>
              </div>
              {/* The back: what you said to your AI. */}
              <div className={`${s.face} ${s.back}`} aria-hidden={!back[i] || still}>
                <p className={s.who}><span className={s.glyph} data-ai={c.ai.glyph}><AIGlyph name={c.ai.glyph} size={20} /></span>{c.ai.name}</p>
                <p className={s.said}>{c.said}</p>
              </div>
            </div>
            {!still && (
              <button type="button" className={s.hit} aria-pressed={back[i]}
                aria-label={back[i] ? `${c.ai.name}: “${c.said}” Show what it made.` : `${c.title.replace(".", "")}: show what was said to ${c.ai.name}.`}
                onClick={(e) => {
                  // A mouse turns it by pointing; a tap, a click with no hover, or the keyboard turns it here.
                  if (hover.current && e.detail > 0) return;
                  turn(i, back[i] ? 0 : 180);
                }}>
                <span className={s.turnIcon} aria-hidden="true">
                  <svg viewBox="0 0 20 20"><path d="M15.5 8.2A6 6 0 0 0 4.7 6.6M4.5 11.8a6 6 0 0 0 10.8 1.6" /><path d="M4.4 3.6v3.2h3.2M15.6 16.4v-3.2h-3.2" /></svg>
                </span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

const Chip = ({ ai, name }: { ai: "openai" | "claude"; name: string }) => <em className={s.chip}><AIGlyph name={ai} size={10} />{name}</em>;

/** The Groceries note as the Mac app draws it, with olive oil just added by ChatGPT. */
function Note() {
  const rows: [string, boolean, boolean][] = [
    ["Oat milk", false, false], ["Lemons", false, false], ["Coffee beans", false, false], ["Fresh basil", false, false],
    ["Burrata", false, false], ["Cherry tomatoes", false, false], ["Olive oil", false, true],
    ["Sourdough", true, false], ["Eggs", true, false], ["Spinach", true, false],
  ];
  return (
    <div className={s.note} role="img" aria-label="A note called Groceries with a checklist. Olive oil was just added by ChatGPT.">
      <p className={s.noteTitle}>Groceries</p>
      <p className={s.noteText}>For the weekend, and Sunday dinner with Sara and Jonas.</p>
      <ul className={s.check}>
        {rows.map(([t, on, ai]) => (
          <li key={t} data-on={on || undefined} data-new={ai || undefined}>
            <i>{on && <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 6.2l2 2 4-4.4" /></svg>}</i>{t}
            {ai && <Chip ai="openai" name="ChatGPT" />}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The Habit tracker template's Today screen, as the app draws it. */
function Habits() {
  const week = ["M", "T", "W", "T", "F", "S", "S"];
  const rows: [string, string, "done" | "count" | "open"][] = [
    ["Morning walk", "5 days in a row", "done"],
    ["Read 20 pages", "4 of 7 this week", "done"],
    ["Water", "5 of 8 glasses", "count"],
    ["No phone after 22", "3 of 7 this week", "open"],
  ];
  const C = 2 * Math.PI * 40;
  return (
    <div className={s.app} role="img" aria-label="A habit tracker app in a note: Today, 2 of 4 done, a week of dots, and four habits.">
      <p className={s.aTop}><b>Habit tracker</b><span>App</span></p>
      <p className={s.aTitle}>Today</p>
      <div className={s.aRing}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="40" />
          <circle cx="50" cy="50" r="40" data-on="" strokeDasharray={`${(C * 0.62).toFixed(1)} ${C.toFixed(1)}`} />
          <text x="50" y="51" textAnchor="middle" dominantBaseline="central">62%</text>
        </svg>
        <div><small>This week</small><b>2 of 4 done today</b><span>8 of 13 since Monday</span></div>
      </div>
      <div className={s.aWeek}>{week.map((w, k) => <span key={k} data-on={k < 5 ? "" : undefined} data-now={k === 5 ? "" : undefined}><small>{w}</small><i /></span>)}</div>
      <ul className={s.aList}>
        {rows.map(([t, sub, st]) => (
          <li key={t}>
            <span><b>{t}</b><small>{sub}</small></span>
            {st === "count" ? <span className={s.aCount}><i>–</i><i data-ring="">+</i></span>
              : <i className={s.aTick} data-on={st === "done" ? "" : undefined}><svg viewBox="0 0 16 16"><path d="M4 8.4l2.6 2.6L12 5.4" /></svg></i>}
          </li>
        ))}
      </ul>
    </div>
  );
}
