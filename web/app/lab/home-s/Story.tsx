"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { APP_STORE_URL, SITE_URL } from "@/lib/site";
import { mailLink, sendLink } from "@/lib/platform";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { AiCards } from "./AiCards";
import { AppFace, BoardBig, BoardFace, HabitApp, hand, Note, NoteFace } from "./Things";
import { underline } from "./hand";
import s from "./s.module.css";

// Study S, "Editorial colour", round 6 (2026-11-14). The page is a ring binder. Each thing is a
// full-bleed colour chapter that arrives as its card from the first screen, rising and widening to
// fill the window. When the next chapter comes over it, it's filed: all that stays is its tab, docked
// under the header beside the others, the way divider tabs stack in a binder. One trip, Lisbon in
// May, runs through the note, the whiteboard, the app and the AI's change to all three.
//
// Motion is transform and opacity only. With Reduce Motion the chapters still arrive, but each change
// is instant; with `?t=` the timed pieces (the typing, the AI's changes) show their end state.

type Tone = "write" | "draw" | "build" | "ai" | "free";
const ORDER: Tone[] = ["write", "draw", "build", "ai", "free"];
const TAB: Record<Tone, string> = { write: "Notes", draw: "Whiteboards", build: "Apps", ai: "Your AI", free: "Free" };

const clamp = (v: number) => Math.min(1, Math.max(0, v));
/** Minimum jerk, rest to rest. */
const mj = (p: number) => p * p * p * (10 - 15 * p + 6 * p * p);

/** Who wants to know how far each chapter is through its stay (0 as it docks, 1 as the next one covers it). */
type Listener = (dwell: number, arrive: number) => void;
const listeners = new Map<Tone, Set<Listener>>();
function listen(tone: Tone, fn: Listener) {
  const set = listeners.get(tone) ?? new Set();
  set.add(fn); listeners.set(tone, set);
  return () => { set.delete(fn); };
}

export function still() {
  return typeof location !== "undefined" && new URLSearchParams(location.search).has("t");
}
function calm() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Where to scroll to see a chapter: docked, and for the drawing and the AI, most of the way through its stay. */
const STAY: Record<Tone, number> = { write: 0.25, draw: 0.85, build: 0.2, ai: 0.8, free: 0 };
let jump: (tone: Tone) => void = () => {};

/* ───────────────────────── The binder: scroll engine ───────────────────────── */

function useBinder(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current; if (!el) return;
    const html = document.documentElement;
    // The header is the binder's top on this page: solid cream, no frost, no line (inline, so the
    // scrolled state's frost can't win).
    const header = document.querySelector<HTMLElement>(".site-header");
    const HEADER = { backgroundColor: "#fff4e6", boxShadow: "none", backdropFilter: "none", webkitBackdropFilter: "none" } as const;
    if (header) Object.assign(header.style, HEADER);
    el.dataset.live = "";
    const chs = ORDER.map((t) => el.querySelector<HTMLElement>(`[data-ch="${t}"]`)!);
    const parts = chs.map((c) => ({
      l: c.querySelector<HTMLElement>("[data-l]")!, m: c.querySelector<HTMLElement>("[data-m]")!, r: c.querySelector<HTMLElement>("[data-r]")!,
      face: c.querySelector<HTMLElement>("[data-face]"), body: c.querySelector<HTMLElement>("[data-body]")!, tab: c.querySelector<HTMLElement>("[data-tab]")!,
    }));
    const hero = el.querySelector<HTMLElement>("[data-hero]")!;
    const heroText = hero.querySelector<HTMLElement>("[data-hero-text]");
    const slots = [...hero.querySelectorAll<HTMLElement>("[data-slot]")];
    const probe = el.querySelector<HTMLElement>("[data-probe]")!;
    const reduced = calm();
    let vh = 0, W = 0, tt = 0, R = 40, phone = false, raf = 0;
    let doc: number[] = [], mt: number[] = [], cols: [number, number][] = [];
    const last: { p: number; shown: boolean; covered: boolean }[] = chs.map(() => ({ p: -1, shown: false, covered: false }));

    const measure = () => {
      vh = innerHeight; W = html.clientWidth;
      tt = probe.offsetHeight; R = probe.offsetWidth;
      phone = matchMedia("(max-width: 760px)").matches;
      let end = hero.getBoundingClientRect().bottom + scrollY;
      doc = []; mt = [];
      chs.forEach((c, i) => { const m = parseFloat(getComputedStyle(c).marginTop) || 0; mt.push(m); doc.push(end + m); end = doc[i] + c.offsetHeight; });
      const rect = (k: number): [number, number] => { const r = slots[k]?.getBoundingClientRect(); return r ? [r.left, r.right] : [0, W]; };
      cols = ORDER.map((_, i) => rect(phone ? 0 : [0, 1, 2, 1, 1][i]));
      parts.forEach((p, i) => { if (p.face) { p.face.style.left = `${cols[i][0]}px`; p.face.style.width = `${cols[i][1] - cols[i][0]}px`; } });
      chs.forEach((c) => c.style.setProperty("--W", `${W}px`));
    };

    const frame = () => {
      raf = 0;
      const y = scrollY;
      const ps: number[] = [];
      for (let i = 0; i < chs.length; i++) {
        const nt = doc[i] - y;
        // The card stage: it rises as its card, then widens into the page as it docks under the tabs.
        const overlap = i === 0 && !phone;
        const from = overlap ? doc[0] : tt + 0.55 * (vh - tt);
        let p = from <= tt + 1 ? 1 : clamp((from - nt) / (from - tt));
        if (reduced) p = p > 0.5 ? 1 : 0;
        ps.push(p);
        const L = last[i];
        if (Math.abs(L.p - p) > 1e-4) {
          L.p = p;
          const e = mj(p), [c0, c1] = cols[i];
          const x0 = c0 * (1 - e), x1 = c1 + (W - c1) * e;
          const pt = parts[i];
          pt.l.style.transform = `translate3d(${x0.toFixed(2)}px,0,0)`;
          pt.m.style.transform = `translate3d(${(x0 + R - 2).toFixed(2)}px,0,0) scaleX(${Math.max(0, (x1 - x0 - 2 * R + 4) / 100).toFixed(4)})`;
          pt.r.style.transform = `translate3d(${(x1 - R).toFixed(2)}px,0,0)`;
          // On a phone the card barely widens, so the card stays until the page's words arrive.
          const [fa, fb, ba, bb] = phone ? [0.6, 0.001, 0.6, 0.3] : [0.36, 0.24, 0.64, 0.3];
          if (pt.face) { const f = 1 - clamp((p - fa) / fb); pt.face.style.opacity = f.toFixed(3); pt.face.style.visibility = f > 0 ? "" : "hidden"; }
          const q = clamp((p - ba) / bb);
          pt.body.style.opacity = q.toFixed(3);
          pt.body.style.transform = q >= 1 ? "" : `translate3d(0,${((1 - mj(q)) * 26).toFixed(1)}px,0)`;
          const shown = q > 0;
          if (shown !== L.shown) { L.shown = shown; pt.body.toggleAttribute("data-shown", shown); }
          const tq = clamp((p - 0.62) / 0.3);
          pt.tab.style.opacity = tq.toFixed(3);
          pt.tab.style.transform = tq >= 1 ? "" : `translate3d(0,${((1 - mj(tq)) * 18).toFixed(1)}px,0)`;
          pt.tab.toggleAttribute("data-docked", p >= 1);
        }
        const dwellLen = i + 1 < chs.length ? Math.max(1, mt[i + 1]) : vh * 0.4;
        const dwell = clamp((tt - nt) / dwellLen);
        listeners.get(ORDER[i])?.forEach((fn) => fn(dwell, p));
      }
      // A chapter under a docked one is filed: only its tab still shows (and is painted).
      for (let i = 0; i < chs.length; i++) {
        const cov = i + 1 < chs.length && ps[i + 1] >= 1;
        if (cov !== last[i].covered) { last[i].covered = cov; chs[i].toggleAttribute("data-covered", cov); }
      }
      // The first screen steps back as the first chapter takes it over.
      const p0 = ps[0];
      if (!phone) slots.forEach((sl, k) => { if (k > 0) sl.style.opacity = (1 - clamp((p0 - 0.8) / 0.2)).toFixed(3); });
      if (heroText) heroText.style.opacity = phone ? "" : (1 - clamp((p0 - 0.55) / 0.4)).toFixed(3);
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const resize = () => { measure(); last.forEach((l) => (l.p = -1)); frame(); };
    jump = (tone) => {
      const i = ORDER.indexOf(tone);
      const stay = i + 1 < chs.length ? mt[i + 1] * STAY[tone] : 0;
      scrollTo({ top: Math.max(0, doc[i] - tt + stay + 1), behavior: reduced ? "auto" : "smooth" });
    };
    measure(); frame();
    addEventListener("scroll", ask, { passive: true });
    addEventListener("resize", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    document.fonts?.ready.then(resize);
    return () => {
      removeEventListener("scroll", ask); removeEventListener("resize", resize); ro.disconnect(); cancelAnimationFrame(raf);
      if (header) for (const k of Object.keys(HEADER)) header.style.removeProperty(k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`));
      delete el.dataset.live; jump = () => {};
    };
  }, [root]);
}

/* ───────────────────────── A chapter (a divider) ───────────────────────── */

function Chapter({ tone, face, label, className = "", children }: { tone: Tone; face?: React.ReactNode; label: string; className?: string; children: React.ReactNode }) {
  const i = ORDER.indexOf(tone);
  return (
    <section data-ch={tone} className={`${s.ch} ${s[tone]} ${className}`} aria-labelledby={label} style={{ zIndex: i + 2 }}>
      <div className={s.bg} aria-hidden="true"><i data-l /><i data-m /><i data-r /></div>
      <a data-tab className={s.tab} href={`#s-${tone}`} onClick={(e) => { e.preventDefault(); jump(tone); }} style={{ "--slot": i } as React.CSSProperties}>
        <span>{TAB[tone]}</span>
      </a>
      {face && <div data-face className={s.face}>{face}</div>}
      <div data-body className={s.body}>{children}</div>
    </section>
  );
}

/* ───────────────────────── The first screen ───────────────────────── */

const CARDS: { tone: Tone; title: string; face: React.ReactNode }[] = [
  { tone: "write", title: "Write notes", face: <NoteFace /> },
  { tone: "draw", title: "Draw on whiteboards", face: <BoardFace /> },
  { tone: "build", title: "Build apps", face: <AppFace /> },
];

function CardFace({ tone, title, children }: { tone: Tone; title: string; children: React.ReactNode }) {
  return (
    <a className={`${s.card} ${s[tone]}`} href={`#s-${tone}`} onClick={(e) => { e.preventDefault(); jump(tone); }}>
      <span className={s.cardTitle}>{title}</span>
      <span className={s.cardThing}>{children}</span>
    </a>
  );
}

function Hero() {
  return (
    <section data-hero className={s.hero} aria-labelledby="s-h1">
      <div data-hero-text className={s.heroText}>
        <h1 id="s-h1" className={s.h1}>The notebook for <span className={s.h1You}>you and <span className={s.h1Ai}>your AI.<Underline id="s-under-p" /></span><Underline id="s-under-m" /></span></h1>
        <div className={s.heroRow}>
          <div className={s.ledeWrap}>
            <p className={s.lede}>Write notes, draw on whiteboards and build apps. Your AI works in all three with you.</p>
            <p className={s.fine}>Free on Mac and iPhone. Works with <span className={s.with}><AIGlyph name="openai" size={15} />ChatGPT</span> and <span className={s.with}><AIGlyph name="claude" size={15} color="#d97757" />Claude</span>.</p>
          </div>
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
        </div>
      </div>
      <nav className={s.cards} aria-label="The three things">
        {CARDS.map((c) => <div key={c.tone} data-slot className={s.slot}><CardFace tone={c.tone} title={c.title}>{c.face}</CardFace></div>)}
      </nav>
    </section>
  );
}

/** A hand-drawn orange stroke under "your AI", drawn in once on arrival. */
function Underline({ id }: { id: string }) {
  const [d, d2] = underline();
  return (
    <svg className={`${s.under} ${id === "s-under-p" ? s.underPhone : s.underWide}`} viewBox="0 0 564 40" preserveAspectRatio="none" aria-hidden="true">
      <defs><mask id={id}><rect className={s.underWipe} x="0" y="-10" width="564" height="60" fill="#fff" /></mask></defs>
      <g mask={`url(#${id})`}><path d={d} /><path d={d2} /></g>
    </svg>
  );
}

/* ───────────────────────── Write notes ───────────────────────── */

function Write() {
  const [live, setLive] = useState(false);
  useEffect(() => listen("write", (_d, p) => { if (p >= 0.98) setLive(true); }), []);
  return (
    <Chapter tone="write" label="s-write-h" face={<CardFace tone="write" title="Write notes"><NoteFace /></CardFace>}>
      <div className={s.wBody}>
        <div className={s.wHead}>
          <h2 id="s-write-h" className={s.wTitle}>Write notes.</h2>
          <p className={s.say}>They feel like Apple Notes, on Mac and iPhone. Bring yours over from Apple Notes.</p>
        </div>
        <Note live={live} />
      </div>
    </Chapter>
  );
}

/* ───────────────────────── Draw on whiteboards ───────────────────────── */

function Draw() {
  // With Reduce Motion or `?t=`, the arrow is already drawn when the chapter arrives.
  const bind = useCallback((set: (k: number) => void) => listen("draw", (d, p) => set(still() || (calm() && p >= 1) ? 1 : d)), []);
  return (
    <Chapter tone="draw" label="s-draw-h" face={<CardFace tone="draw" title="Draw on whiteboards"><BoardFace /></CardFace>}>
      <div className={s.dBody}>
        <div className={s.dHead}>
          <h2 id="s-draw-h" className={s.dTitle}>Draw on whiteboards.</h2>
          <p className={s.say}>A whiteboard beside your notes. Your AI can read it, and draw on it with you.</p>
        </div>
        <div className={s.dBoard} role="img" aria-label="A hand-drawn whiteboard, Friday in Lisbon: land at 10:40, bags to Alfama, then if it rains the tile museum, if not Belém by the river, both ending at the sunset at Graça. Claude's cursor draws the last arrow.">
          <span className={s.wideOnly}><BoardBig bind={bind} /></span>
          <span className={s.tallOnly}><BoardBig tall bind={bind} /></span>
        </div>
      </div>
    </Chapter>
  );
}

/* ───────────────────────── Build apps ───────────────────────── */

function Build() {
  return (
    <Chapter tone="build" label="s-build-h" face={<CardFace tone="build" title="Build apps"><AppFace /></CardFace>}>
      <div className={s.bBody}>
        <div className={s.bApp}>
          <HabitApp />
          <p className={`${s.nudge} ${hand.className}`} aria-hidden="true">
            it works.<br />tap today
            <svg viewBox="0 0 120 90"><path d="M112 34 C 84 12, 44 18, 14 50" /><path d="M10 28 L12 54 L36 56" /></svg>
          </p>
        </div>
        <div className={s.bHead}>
          <h2 id="s-build-h" className={s.bTitle}>Build <br />apps.</h2>
          <p className={s.say}>A note can be a small app, like this habit tracker. Pick a template, or ask your AI to make one.</p>
        </div>
      </div>
    </Chapter>
  );
}

/* ───────────────────────── Your AI ───────────────────────── */

function Ai() {
  const subscribe = useCallback((fn: (d: number) => void) => listen("ai", (d, p) => fn(still() || (calm() && p >= 1) ? 1 : d)), []);
  return (
    <Chapter tone="ai" label="s-ai-h" face={<FaceWords tone="ai">Your AI, in all three</FaceWords>}>
      <div className={s.aBody}>
        <div className={s.aTop}>
          <h2 id="s-ai-h" className={s.aTitle}>Your AI,<br />in all three.</h2>
          <div className={s.askWrap}>
            <p className={s.ask}><span className={s.askMark}><AIGlyph name="openai" size={22} color="#fff" /></span>“Add a day in Sintra to my Lisbon trip.”</p>
            <p className={s.askSub}>One request in ChatGPT. It changes all three, and says so.</p>
          </div>
        </div>
        <AiCards subscribe={subscribe} />
        <div className={s.aFoot}>
          <p className={s.works}>Connect <span className={s.with}><AIGlyph name="openai" size={17} />ChatGPT</span>, <span className={s.with}><AIGlyph name="claude" size={17} color="#d97757" />Claude</span>, Claude Code or Codex. Every chat starts knowing your notes.</p>
          <p className={s.study}>In a new chat, Claude answered 18% of questions about past chats. With Pinto, 82.5%. <a href="/blog/ai-memory-with-notes">Read the study</a></p>
        </div>
      </div>
    </Chapter>
  );
}

function FaceWords({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`${s.card} ${s.cardPlain} ${s[tone]}`}><span className={s.cardTitle}>{children}</span></span>;
}

/* ───────────────────────── Free ───────────────────────── */

const EXTRAS = [
  ["Private", "Encrypted on your device before it syncs."],
  ["Every change says who", "You or which AI. Undo takes it back."],
  ["Lock a note", "A separate password for the private ones."],
  ["Mac and iPhone", "Always in sync, and works offline."],
  ["Bring your notes", "From Apple Notes, Obsidian, Bear, Evernote and Keep."],
  ["Open source", "Anyone can check the code."],
];

function Free() {
  return (
    <Chapter tone="free" label="s-free-h" face={<FaceWords tone="free">Pinto Notes is free</FaceWords>}>
      <div className={s.fBody}>
        <h2 id="s-free-h" className={s.fTitle}>Pinto Notes<br />is <em>free.</em></h2>
        <div className={s.fGet}>
          <div className={`${x.ctas} ${s.ctas}`}>
            <Download note={false} />
            <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
              Get it for iPhone
            </a>
            <a className={x.offMac} href="/download">Download for Mac</a>
          </div>
          <p className={s.fReq}>Requires macOS 26 or iOS 26.</p>
        </div>
        <ul className={s.extras}>
          {EXTRAS.map(([t, say]) => <li key={t}><b>{t}</b><span>{say}</span></li>)}
        </ul>
      </div>
    </Chapter>
  );
}

export function Story({ className }: { className: string }) {
  const root = useRef<HTMLDivElement>(null);
  useBinder(root);
  return (
    <div ref={root} className={`${s.stack} ${className}`}>
      <span data-probe className={s.probe} aria-hidden="true" />
      <Hero />
      <Write />
      <Draw />
      <Build />
      <Ai />
      <Free />
      <div className={s.tail} aria-hidden="true" />
    </div>
  );
}
