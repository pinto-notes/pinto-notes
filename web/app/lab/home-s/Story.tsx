"use client";

import localFont from "next/font/local";
import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { APP_STORE_URL, SITE_URL } from "@/lib/site";
import { mailLink, sendLink } from "@/lib/platform";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { box, curve, ellipse, head, rng } from "./hand";
import s from "./s.module.css";

// Study S, "Editorial colour" (round 5, 2026-11-14). The page is a stack of full-bleed colour
// chapters. Each one slides up over the one before (sticky, rounded top), and the one underneath
// steps back and dims. Every chapter has one oversized piece of the real thing that you can feel:
// a checklist at the size of a hand, one whiteboard arrow across the whole screen that Claude draws
// as you scroll, and a habit tracker's button you can press. Then the AI chapter is only words, and
// the page ends back on cream with the download.
//
// Motion is transform and opacity only, driven by scroll or played once. With Reduce Motion, or
// with `?t=` in the address, everything is shown finished and nothing moves.

const hand = localFont({ src: "./Excalifont-Regular.woff2", display: "block" });

type Tone = "cream" | "write" | "draw" | "build" | "ai";
const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** Called each frame with how far a chapter is through its dwell (0 as it settles, 1 as the next arrives). */
const dwellers = new Map<Element, Set<(v: number) => void>>();

/** The header takes the colour of the chapter under it (its own variables, site.css). */
const HEADER: Record<string, Record<string, string>> = {
  write: { "--bg": "#dc532c", "--ink": "#fff1e2", "--muted": "#ffd9c4", "--soft": "#e8693f", "--line": "rgba(255, 236, 220, 0.2)", "--cta-bg": "#fff1e2", "--cta-ink": "#3a1407" },
  draw: { "--bg": "#18493a", "--ink": "#fff1e2", "--muted": "#cfe0d4", "--soft": "#245a49", "--line": "rgba(220, 255, 235, 0.16)", "--cta-bg": "#fff1e2", "--cta-ink": "#10342a" },
  build: { "--bg": "#dccbf6", "--ink": "#24170d", "--muted": "#5a4a70", "--soft": "#cdb8f0", "--line": "rgba(40, 20, 80, 0.12)", "--cta-bg": "#24170d", "--cta-ink": "#fff4e6" },
  ai: { "--bg": "#26190f", "--ink": "#fff1e2", "--muted": "#d9bf9f", "--soft": "#3a2818", "--line": "rgba(255, 220, 170, 0.14)", "--cta-bg": "#fff1e2", "--cta-ink": "#26190f" },
};
const HEADER_VARS = Object.keys(HEADER.write);
function paintHeader(h: HTMLElement, tone: string) {
  const v = HEADER[tone];
  for (const k of HEADER_VARS) v ? h.style.setProperty(k, v[k]) : h.style.removeProperty(k);
  h.style.color = v ? v["--ink"] : "";
}

/** True with Reduce Motion or a `?t=` freeze: show the finished page. */
function still() {
  return new URLSearchParams(location.search).has("t") || matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The stack: each chapter sticks (tall ones by their bottom edge), the next slides over it. Sets
 *  --cover (0 to 1, the next chapter covering this one) and --dwell on every chapter, and tells the
 *  header which colour is under it. */
function useStack(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current; if (!el) return;
    const chs = [...el.querySelectorAll<HTMLElement>("[data-ch]")];
    const header = document.querySelector<HTMLElement>(".site-header");
    const frozen = still();
    let raf = 0, vh = innerHeight;
    const measure = () => {
      vh = innerHeight;
      for (const c of chs) c.style.top = `${Math.min(0, vh - c.offsetHeight)}px`;
    };
    const frame = () => {
      raf = 0;
      const tops = chs.map((c) => c.getBoundingClientRect().top);
      for (let i = 0; i < chs.length; i++) {
        const c = chs[i], next = chs[i + 1];
        const dwellLen = next ? parseFloat(getComputedStyle(next).marginTop) || 1 : 1;
        const nt = next ? tops[i + 1] : Infinity;
        const cover = next ? clamp((vh - nt) / vh) : 0;
        const dwell = frozen ? 1 : next ? clamp((vh + dwellLen - nt) / dwellLen) : clamp((vh - tops[i]) / vh);
        if (!frozen) c.style.setProperty("--cover", cover.toFixed(4));
        c.style.setProperty("--dwell", dwell.toFixed(4));
        dwellers.get(c)?.forEach((fn) => fn(dwell));
      }
      // The chapter under the header's strip: the last one whose top has reached it.
      let tone: string = "cream";
      for (let i = chs.length - 1; i >= 0; i--) if (tops[i] <= 44) { tone = chs[i].dataset.ch ?? "cream"; break; }
      if (header && header.dataset.sTone !== tone) { header.dataset.sTone = tone; paintHeader(header, tone); }
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const resize = () => { measure(); ask(); };
    measure(); frame();
    addEventListener("scroll", ask, { passive: true });
    addEventListener("resize", resize);
    const ro = new ResizeObserver(resize);
    chs.forEach((c) => ro.observe(c));
    return () => { removeEventListener("scroll", ask); removeEventListener("resize", resize); ro.disconnect(); cancelAnimationFrame(raf); if (header) { delete header.dataset.sTone; paintHeader(header, "cream"); } };
  }, [root]);
}

function Chapter({ tone, id, className = "", label, children }: { tone: Tone; id?: string; className?: string; label?: string; children: React.ReactNode }) {
  // The id sits on a plain marker in the flow before the chapter: a sticky chapter has no fixed place to jump to.
  return (
    <>
      {id && <span id={id} className={s.anchor} />}
      <section data-ch={tone} className={`${s.ch} ${s[tone]} ${className}`} aria-labelledby={label}>{children}</section>
    </>
  );
}

/* ───────────────────────── The first screen ───────────────────────── */

const Tick = ({ className = "" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 12.4l3.6 3.6 7.4-7.6" /></svg>;

function Hero() {
  const go = (id: string) => (e: React.MouseEvent) => {
    const a = document.getElementById(id), ch = a?.nextElementSibling; if (!a || !ch) return;
    e.preventDefault();
    // Where the chapter has fully arrived: the marker, plus the dwell (its top margin) before it.
    const y = a.getBoundingClientRect().top + scrollY + parseFloat(getComputedStyle(ch).marginTop);
    scrollTo({ top: y, behavior: still() ? "auto" : "smooth" });
  };
  return (
    <Chapter tone="cream" className={s.hero} label="s-h1">
      <div className={s.heroWords}>
        <h1 id="s-h1" className={s.h1}>
          The notebook for <span className={s.h1You}>you and your AI.<Underline /></span>
        </h1>
        <div className={s.heroSide}>
          <p className={s.lede}>Write notes, draw on whiteboards and build apps. Your AI works in all three with you.</p>
          <div className={`${x.ctas} ${s.ctas}`}>
            <Download note={false} />
            <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
              Get it for iPhone
            </a>
            <a className={x.offMac} href="/download">Download for Mac</a>
            <p className={`${x.fine} ${x.offApple}`} data-off-apple>
              Pinto Notes is for iPhone and Mac.{" "}
              <a href={mailLink(SITE_URL)} onClick={(e) => sendLink(navigator, e, SITE_URL)}>Send myself the link</a>
            </p>
          </div>
          <p className={s.fine}>
            Free on Mac and iPhone. Works with <span className={s.with}><AIGlyph name="openai" size={15} />ChatGPT</span> and <span className={s.with}><AIGlyph name="claude" size={15} />Claude</span>.
          </p>
        </div>
      </div>
      {/* The three chapters' tops, waiting at the bottom of the first screen. */}
      <nav className={s.tabs} aria-label="The three things">
        <a href="#s-write" onClick={go("s-write")} className={`${s.tab} ${s.write}`}>
          <span>Write notes<small>Like Apple Notes, on Mac and iPhone.</small></span>
          <i className={s.tabTick}><Tick /></i>
        </a>
        <a href="#s-draw" onClick={go("s-draw")} className={`${s.tab} ${s.draw}`}>
          <span>Draw on whiteboards<small>Your AI can draw on them too.</small></span>
          <svg className={s.tabArrow} viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true"><path d="M6 30 C 80 110, 200 110, 288 40" /><path d="M262 38 L289 39 L282 64" /></svg>
        </a>
        <a href="#s-build" onClick={go("s-build")} className={`${s.tab} ${s.build}`}>
          <span>Build apps<small>A habit tracker, a budget, a trip plan.</small></span>
          <i className={s.tabButton}>Done today</i>
        </a>
      </nav>
    </Chapter>
  );
}

/** A hand-drawn orange stroke under "your AI", drawn in once on arrival. */
function Underline() {
  const r = rng(11);
  const d = curve(r, [4, 22], [160, 4], [380, 30], [560, 12], 3);
  const d2 = curve(r, [30, 26], [200, 12], [400, 34], [548, 18], 3);
  return (
    <svg className={s.under} viewBox="0 0 564 40" preserveAspectRatio="none" aria-hidden="true">
      <defs><mask id="s-under-m"><rect className={s.underWipe} x="0" y="-10" width="564" height="60" fill="#fff" /></mask></defs>
      <g mask="url(#s-under-m)"><path d={d} /><path d={d2} /></g>
    </svg>
  );
}

/* ───────────────────────── Write notes ───────────────────────── */

const ROWS = [
  { text: "Run, 5 km", on: true },
  { text: "Call the dentist", ai: true },
  { text: "Book the Lisbon flights", ai: true },
];

function Write() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState<boolean[]>([true, false, false]);
  const touched = useRef(false);
  // Ticks "Call the dentist" once, a moment after the note is all in view.
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (still()) { setOn([true, true, false]); return; }
    let t = 0;
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting) && !touched.current) { t = window.setTimeout(() => { if (!touched.current) setOn([true, true, false]); }, 700); io.disconnect(); }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);
  const flip = (i: number) => { touched.current = true; setOn((o) => o.map((v, k) => (k === i ? !v : v))); };
  return (
    <Chapter tone="write" id="s-write" className={s.chWrite} label="s-write-h">
      <div className={s.inner}>
        <h2 id="s-write-h" className={s.title}>Write notes.</h2>
        <p className={s.say}>They feel like Apple Notes, on Mac and iPhone. Bring yours over from Apple Notes.</p>
      </div>
      <div ref={ref} className={s.paper}>
        <p className={s.paperTitle}>Tomorrow</p>
        <ul className={s.rows}>
          {ROWS.map((row, i) => (
            <li key={row.text}>
              <button type="button" className={s.row} data-on={on[i] || undefined} onClick={() => flip(i)} aria-pressed={on[i]}>
                <i className={s.box}><Tick /></i>
                <span className={s.rowText}>{row.text}<b className={s.strike} aria-hidden="true" /></span>
              </button>
              {row.ai && <span className={s.chip} title="Added by ChatGPT"><AIGlyph name="openai" size={18} />ChatGPT</span>}
            </li>
          ))}
        </ul>
      </div>
    </Chapter>
  );
}

/* ───────────────────────── Draw on whiteboards ───────────────────────── */

type Geo = { view: [number, number]; idea: [number, number, number, number]; pub: [number, number, number, number]; a: [number, number]; c1: [number, number]; c2: [number, number]; b: [number, number]; ready: [number, number]; vertical: boolean; font: number };
// Wide: Idea cut by the left edge, Publish cut by the right, one arrow dipping across the screen.
const WIDE: Geo = { view: [1440, 470], idea: [70, 230, 190, 100], pub: [1190, 120, 360, 190], a: [282, 262], c1: [520, 500], c2: [940, 500], b: [1160, 236], ready: [730, 330], vertical: false, font: 66 };
// Tall, for a phone: Idea at the top left, the arrow swinging down to Publish at the bottom right.
const TALL: Geo = { view: [390, 640], idea: [70, 84, 140, 74], pub: [210, 506, 230, 110], a: [150, 170], c1: [380, 250], c2: [-40, 420], b: [262, 494], ready: [304, 290], vertical: true, font: 44 };

function Arrow({ g, seed }: { g: Geo; seed: number }) {
  const r = rng(seed);
  const [W, H] = g.view;
  const [ix, iy, irx, iry] = g.idea, [px, py, pw, ph] = g.pub;
  const shaft = curve(r, g.a, g.c1, g.c2, g.b, 5), shaft2 = curve(r, g.a, g.c1, g.c2, g.b, 7);
  const tip = head(r, g.c2, g.b, g.vertical ? 30 : 58);
  const path = useRef<SVGPathElement>(null), wipe = useRef<SVGRectElement>(null), cur = useRef<SVGGElement>(null), tipRef = useRef<SVGGElement>(null);
  const box1 = useRef<HTMLDivElement>(null);
  const mid = `s-arrow-${seed}`;
  useEffect(() => {
    const p = path.current, ch = box1.current?.closest("[data-ch]");
    if (!p || !ch) return;
    const len = p.getTotalLength();
    const set = (dwell: number) => {
      // Claude draws the arrow over most of the dwell, then lets go.
      const k = clamp((dwell - 0.08) / 0.72), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      const pt = p.getPointAtLength(len * e);
      const w = wipe.current, c = cur.current, t = tipRef.current;
      if (w) w.setAttribute("transform", g.vertical ? `translate(0 ${(pt.y - H - 40 + 14).toFixed(1)})` : `translate(${(pt.x - W - 40 + 14).toFixed(1)} 0)`);
      if (t) t.style.opacity = e > 0.985 ? "1" : "0";
      if (c) { c.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`); c.style.opacity = k <= 0 ? "0" : k >= 1 ? String(clamp(1 - (dwell - 0.8) / 0.15)) : "1"; }
    };
    set(still() ? 1 : 0);
    const fns = dwellers.get(ch) ?? new Set();
    fns.add(set); dwellers.set(ch, fns);
    return () => { fns.delete(set); };
  }, [g, H, W]);
  return (
    <div ref={box1} className={`${s.arrowBox} ${g.vertical ? s.tall : s.wide}`}>
      <svg className={`${s.arrowSvg} ${hand.className}`} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <defs><mask id={mid} maskUnits="userSpaceOnUse" x="-50" y="-50" width={W + 100} height={H + 100}><rect ref={wipe} x="-40" y="-40" width={W + 80} height={H + 80} fill="#fff" /></mask></defs>
        <ellipse cx={ix} cy={iy} rx={irx} ry={iry} fill="#ffec99" />
        <path className={s.ink} d={ellipse(r, ix, iy, irx, iry)} />
        <text className={s.boardWord} x={ix + (g.vertical ? 4 : 30)} y={iy + g.font * 0.32} fontSize={g.font} textAnchor="middle">Idea</text>
        <rect x={px} y={py} width={pw} height={ph} rx={g.vertical ? 18 : 26} fill="#b2f2bb" />
        <path className={s.ink} d={box(r, px, py, pw, ph, g.vertical ? 18 : 26)} />
        <text className={s.boardWord} x={px + (g.vertical ? 84 : 124)} y={py + ph / 2 + g.font * 0.32} fontSize={g.font} textAnchor="middle">Publish</text>
        <path ref={path} d={`M${g.a[0]} ${g.a[1]} C${g.c1[0]} ${g.c1[1]} ${g.c2[0]} ${g.c2[1]} ${g.b[0]} ${g.b[1]}`} fill="none" stroke="none" />
        <g mask={`url(#${mid})`} className={s.chalk}>
          <path d={shaft} /><path d={shaft2} />
          {g.vertical
            ? <text className={s.boardNote} x={g.ready[0]} y={g.ready[1]} fontSize={30} textAnchor="middle">when it&apos;s<tspan x={g.ready[0]} dy="34">ready</tspan></text>
            : <text className={s.boardNote} x={g.ready[0]} y={g.ready[1]} fontSize={44} textAnchor="middle">when it&apos;s ready</text>}
        </g>
        <g ref={tipRef} className={s.chalk} style={{ opacity: 0 }}><path d={tip} /></g>
        <g ref={cur} style={{ opacity: 0 }}>
          <g className={s.cursor} transform={g.vertical ? "scale(1.1)" : "scale(1.6)"}>
            <path d="M0 0 L0 17 L4.6 12.6 L8 20 L11 18.6 L7.7 11.4 L13.6 11.2 Z" fill="#d97757" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
            <rect x="14" y="15" width="56" height="22" rx="7" fill="#d97757" />
            <text x="42" y="30.5" className={s.cursorName} textAnchor="middle">Claude</text>
          </g>
        </g>
      </svg>
    </div>
  );
}

function Draw() {
  return (
    <Chapter tone="draw" id="s-draw" className={s.chDraw} label="s-draw-h">
      <div className={`${s.inner} ${s.drawHead}`}>
        <h2 id="s-draw-h" className={s.title}>Draw on<br />whiteboards.</h2>
        <p className={s.say}>A whiteboard next to your notes. Your AI can read it, and draw on it with you.</p>
      </div>
      <div role="img" aria-label="A hand-drawn whiteboard: Idea on the left, Publish on the right. Claude's cursor draws the arrow between them, marked when it's ready.">
        <Arrow g={WIDE} seed={5} />
        <Arrow g={TALL} seed={9} />
      </div>
    </Chapter>
  );
}

/* ───────────────────────── Build apps ───────────────────────── */

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];

function Build() {
  const [done, setDone] = useState(false);
  const n = done ? 5 : 4;
  return (
    <Chapter tone="build" id="s-build" className={s.chBuild} label="s-build-h">
      <div className={`${s.inner} ${s.buildHead}`}>
        <h2 id="s-build-h" className={s.title}>Build apps.</h2>
        <p className={s.say}>A note can be a small app, like this habit tracker. Pick a template, or ask your AI to make one.</p>
      </div>
      <div className={s.app} data-done={done || undefined}>
        <p className={s.appTop}><b>Habit tracker</b><span>App</span></p>
        <p className={s.habit}>Morning run</p>
        <div className={s.week} aria-hidden="true">
          {WEEK.map((d, i) => (
            <span key={i} data-on={i < 4 || undefined} data-now={i === 4 || undefined}>
              <small>{d}</small><i><Tick /></i>
            </span>
          ))}
        </div>
        <p className={s.streak} aria-live="polite">
          <span className={s.num}><span className={s.numRoll}><b>4</b><b>5</b></span></span>
          <span className={s.streakWords}>days in<br />a row</span>
          <span className={s.vh}>{n} days in a row</span>
        </p>
        <div className={s.pressRow}>
          <button type="button" className={s.press} onClick={() => setDone((d) => !d)} aria-pressed={done}>
            <span className={s.pressA}>Done today</span>
            <span className={s.pressB}><Tick />Done</span>
          </button>
          <p className={`${s.nudge} ${hand.className}`} aria-hidden="true">
            go on,<br />press it
            <svg viewBox="0 0 120 90"><path d="M112 30 C 80 10, 40 20, 12 52" /><path d="M10 30 L10 54 L34 58" /></svg>
          </p>
        </div>
      </div>
    </Chapter>
  );
}

/* ───────────────────────── Your AI ───────────────────────── */

const SAID: { said: string; ai: "openai" | "claude"; who: string; where: string; tone: Tone }[] = [
  { said: "Add the dentist to tomorrow.", ai: "openai", who: "ChatGPT", where: "added it to your Tomorrow note", tone: "write" },
  { said: "Sketch how we publish.", ai: "claude", who: "Claude", where: "drew it on a whiteboard", tone: "draw" },
  { said: "I trained 120 kg this week.", ai: "openai", who: "ChatGPT", where: "logged it in your Workout log app", tone: "build" },
];

function Ai() {
  return (
    <Chapter tone="ai" id="s-ai" className={s.chAi} label="s-ai-h">
      <div className={s.inner}>
        <h2 id="s-ai-h" className={s.title}>Your AI,<br />in all three.</h2>
        <ol className={s.said}>
          {SAID.map((l, i) => (
            <li key={l.said} style={{ "--i": i } as React.CSSProperties}>
              <q className={s.quote}>{l.said}</q>
              <p className={`${s.did} ${s[l.tone]}`}><span className={s.didChip}><AIGlyph name={l.ai} size={16} />{l.who}</span>{l.where}</p>
            </li>
          ))}
        </ol>
        <div className={s.aiFoot}>
          <p className={s.works}>
            Connect <span className={s.with}><AIGlyph name="openai" size={18} />ChatGPT</span>, <span className={s.with}><AIGlyph name="claude" size={18} />Claude</span>, Claude Code or Codex. Every chat starts knowing your notes.
          </p>
          <p className={s.study}>In a new chat, Claude got 18% of questions about past chats right. With Pinto, 82.5%. <a href="/blog/ai-memory-with-notes">Read the study</a></p>
        </div>
      </div>
    </Chapter>
  );
}

/* ───────────────────────── The close ───────────────────────── */

const EXTRAS = [
  ["Private", "Encrypted on your device before it syncs."],
  ["Every change says who", "You or which AI. Undo takes it back."],
  ["Lock a note", "A separate password for the private ones."],
  ["Mac and iPhone", "Always in sync, and works offline."],
  ["Bring your notes", "From Apple Notes, Obsidian, Bear, Evernote and Keep."],
  ["Open source", "Anyone can check the code."],
];

function Close() {
  return (
    <Chapter tone="cream" className={s.chClose} label="s-close-h">
      <div className={s.inner}>
        <h2 id="s-close-h" className={s.closeTitle}>Pinto Notes is <em>free.</em></h2>
        <div className={`${x.ctas} ${s.ctas}`}>
          <Download note={false} />
          <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
            Get it for iPhone
          </a>
          <a className={x.offMac} href="/download">Download for Mac</a>
        </div>
        <p className={s.fine}>Requires macOS 26 or iOS 26.</p>
        <ul className={s.extras}>
          {EXTRAS.map(([t, say]) => <li key={t}><b>{t}</b><span>{say}</span></li>)}
        </ul>
      </div>
    </Chapter>
  );
}

export function Story({ className }: { className: string }) {
  const root = useRef<HTMLDivElement>(null);
  useStack(root);
  return (
    <div ref={root} className={`${s.stack} ${className}`}>
      <Hero />
      <Write />
      <Draw />
      <Build />
      <Ai />
      <Close />
    </div>
  );
}
