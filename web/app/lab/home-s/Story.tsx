"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { APP_STORE_URL, SITE_URL } from "@/lib/site";
import { mailLink, sendLink } from "@/lib/platform";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { AiCards } from "./AiCards";
import { Devices } from "./Devices";
import { AppFace, BoardBig, BoardFace, HabitApp, hand, HeroNote, Note } from "./Things";
import { underline } from "./hand";
import s from "./s.module.css";

// Study S, "Editorial colour", round 7 (2026-11-14). The page is a ring binder printed like a
// risograph collage. The first screen is the Lisbon trip on a torn-paper collage: the note (with the
// decision you made and the line ChatGPT added because of it), the whiteboard and the app. Below it,
// each thing is a full-bleed colour divider with a torn top edge. Scrolling lays each one over the
// last, whole, and when it lands its tab stays docked under the header, beside the others. The same
// Lisbon things run through every chapter. At the end the trip is on a Mac and an iPhone, and the
// notebook's cover closes over everything, tabs and all: "Pinto Notes is free."
//
// The sheets move by `position: sticky` alone (the browser scrolls them; no script moves them). The
// script only measures how far each one is through its stay, to time the typing, Claude's arrow and
// ChatGPT's changes. With Reduce Motion or `?t=`, those show their end state.

type Tone = "write" | "draw" | "build" | "ai" | "sync" | "cover";
const ORDER: Tone[] = ["write", "draw", "build", "ai", "sync", "cover"];
const TAB: Record<Tone, string> = { write: "Notes", draw: "Whiteboards", build: "Apps", ai: "Your AI", sync: "Mac and iPhone", cover: "" };

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** Who wants to know how far each chapter is through its stay (0 as it docks, 1 as the next one rises). */
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
const STAY: Record<Tone, number> = { write: 0.2, draw: 0.85, build: 0.15, ai: 0.8, sync: 0.1, cover: 0 };
let jump: (tone: Tone) => void = () => {};

/* ───────────────────────── The binder: what the script does ───────────────────────── */

function useBinder(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current; if (!el) return;
    // The header is the binder's top on this page: solid cream, no frost, no line (inline, so the
    // scrolled state's frost can't win).
    const header = document.querySelector<HTMLElement>(".site-header");
    const HEADER = { backgroundColor: "#fff4e6", boxShadow: "none", backdropFilter: "none", webkitBackdropFilter: "none" } as const;
    if (header) Object.assign(header.style, HEADER);
    el.dataset.live = "";
    const chs = ORDER.map((t) => el.querySelector<HTMLElement>(`[data-ch="${t}"]`)!);
    const hero = el.querySelector<HTMLElement>("[data-hero]")!;
    const probe = el.querySelector<HTMLElement>("[data-probe]")!, probeHh = el.querySelector<HTMLElement>("[data-probe-hh]")!;
    const reduced = calm();
    let vh = 0, tt = 0, hh = 0, raf = 0;
    let doc: number[] = [], mt: number[] = [];
    const covered = chs.map(() => false);

    const measure = () => {
      vh = innerHeight; tt = probe.offsetHeight; hh = probeHh.offsetHeight;
      let end = hero.getBoundingClientRect().bottom + scrollY;
      doc = []; mt = [];
      chs.forEach((c, i) => { const m = parseFloat(getComputedStyle(c).marginTop) || 0; mt.push(m); doc.push(end + m); end = doc[i] + c.offsetHeight; });
    };

    const frame = () => {
      raf = 0;
      const y = scrollY;
      const docked: boolean[] = [];
      for (let i = 0; i < chs.length; i++) {
        const nt = doc[i] - y;
        const stick = ORDER[i] === "cover" ? hh : tt;
        const arrive = clamp((vh - nt) / Math.max(1, vh - stick));
        docked.push(nt <= stick + 0.5);
        const dwellLen = i + 1 < chs.length ? Math.max(1, mt[i + 1]) : vh * 0.4;
        const dwell = clamp((stick - nt) / dwellLen);
        listeners.get(ORDER[i])?.forEach((fn) => fn(dwell, arrive));
      }
      // A chapter under a docked one is filed: its page stays (its colour shows through the next
      // one's torn edge) but its contents aren't painted.
      for (let i = 0; i < chs.length; i++) {
        const cov = i + 1 < chs.length && docked[i + 1] && (doc[i + 1] - y) <= tt - 40;
        if (cov !== covered[i]) { covered[i] = cov; chs[i].toggleAttribute("data-covered", cov); }
      }
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const resize = () => { measure(); frame(); };
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

function Chapter({ tone, label, className = "", children }: { tone: Tone; label: string; className?: string; children: React.ReactNode }) {
  const i = ORDER.indexOf(tone);
  return (
    <section id={`s-${tone}`} data-ch={tone} className={`${s.ch} ${s[tone]} ${className}`} aria-labelledby={label} style={{ zIndex: i + 2 }}>
      {TAB[tone] && (
        <a data-tab className={s.tab} href={`#s-${tone}`} onClick={(e) => { e.preventDefault(); jump(tone); }} style={{ "--slot": i } as React.CSSProperties}>
          <span className={s.tabLong}>{TAB[tone]}</span><span className={s.tabShort}>{tone === "sync" ? "iPhone" : TAB[tone]}</span>
        </a>
      )}
      <div className={s.paper} aria-hidden="true"><i className={s.under} /><i className={s.rim} /><i className={s.sheetBg} /><i className={s.dots} /></div>
      <div data-body className={s.body}>{children}</div>
    </section>
  );
}

/* ───────────────────────── The first screen ───────────────────────── */

function Hero() {
  return (
    <section data-hero className={s.hero} aria-labelledby="s-h1">
      <div className={s.heroText}>
        <h1 id="s-h1" className={s.h1}>The notebook for <span className={s.h1You}>you and <span className={s.h1Ai}>your AI.<Underline /></span></span></h1>
        <p className={s.lede}>Write notes, draw on whiteboards and build apps. ChatGPT and Claude work in all three with you, and remember what you decided.</p>
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
        <p className={s.fine}>Free on Mac and iPhone. Works with <span className={s.with}><AIGlyph name="openai" size={15} />ChatGPT</span> and <span className={s.with}><AIGlyph name="claude" size={15} color="#d97757" />Claude</span>.</p>
      </div>
      <div className={s.art}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.collage} src="/lab/s/collage-v1.webp" alt="" width="1122" height="1402" fetchPriority="high" />
        <div className={s.objs}>
          <a className={`${s.obj} ${s.oBoard}`} href="#s-draw" onClick={(e) => { e.preventDefault(); jump("draw"); }} aria-label="Draw on whiteboards: Friday in Lisbon, with Claude drawing an arrow">
            <BoardFace />
          </a>
          <div className={`${s.obj} ${s.oNote}`}><HeroNote /></div>
          <a className={`${s.obj} ${s.oApp}`} href="#s-build" onClick={(e) => { e.preventDefault(); jump("build"); }} aria-label="Build apps: a habit tracker for the trip">
            <AppFace />
          </a>
        </div>
      </div>
    </section>
  );
}

/** A hand-drawn orange stroke under "your AI", drawn in once on arrival. */
function Underline() {
  const [d, d2] = underline();
  return (
    <svg className={s.under} viewBox="0 0 564 40" preserveAspectRatio="none" aria-hidden="true">
      <defs><mask id="s-under"><rect className={s.underWipe} x="0" y="-10" width="564" height="60" fill="#fff" /></mask></defs>
      <g mask="url(#s-under)"><path d={d} /><path d={d2} /></g>
    </svg>
  );
}

/* ───────────────────────── Write notes ───────────────────────── */

function Write() {
  const [live, setLive] = useState(false);
  useEffect(() => listen("write", (_d, p) => { if (p >= 0.92) setLive(true); }), []);
  return (
    <Chapter tone="write" label="s-write-h">
      <div className={s.wBody}>
        <div className={s.wHead}>
          <h2 id="s-write-h" className={s.wTitle}>Write <br />notes.</h2>
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
  const wrap = useRef<HTMLDivElement>(null), title = useRef<SVGTextElement>(null);
  // The pencil hand underlines the board's title: its tip sits at the start of "Friday in Lisbon".
  useEffect(() => {
    const w = wrap.current, t = title.current; if (!w || !t) return;
    const place = () => {
      const a = w.getBoundingClientRect(), b = t.getBoundingClientRect();
      if (!b.width) return;
      w.style.setProperty("--tipx", `${(b.left - a.left + 2).toFixed(1)}px`);
      w.style.setProperty("--tipy", `${(b.bottom - a.top - b.height * 0.06).toFixed(1)}px`);
    };
    place();
    const ro = new ResizeObserver(place); ro.observe(w);
    document.fonts?.ready.then(place);
    return () => ro.disconnect();
  }, []);
  return (
    <Chapter tone="draw" label="s-draw-h">
      <div className={s.dBody}>
        <div className={s.dHead}>
          <h2 id="s-draw-h" className={s.dTitle}>Draw on whiteboards.</h2>
          <p className={s.say}>A whiteboard beside your notes. Your AI can read it, and draw on it with you.</p>
        </div>
        <div ref={wrap} className={s.dBoard} role="img" aria-label="A hand-drawn whiteboard, Friday in Lisbon: land at 10:40, bags to Alfama, then if it rains the tile museum, if not Belém by the river, both ending at the sunset at Graça. A hand writes the title; Claude's cursor draws the last arrow.">
          <span className={s.wideOnly}><BoardBig bind={bind} titleRef={title} /></span>
          <span className={s.tallOnly}><BoardBig tall bind={bind} /></span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.pencilHand} src="/lab/s/hand-v1.webp" alt="" width="1000" height="667" loading="lazy" />
        </div>
      </div>
    </Chapter>
  );
}

/* ───────────────────────── Build apps ───────────────────────── */

function Build() {
  const nudge = (
    <span className={`${s.nudge} ${hand.className}`} aria-hidden="true">
      <span>it works.<br />tap today</span>
      <svg className={s.nudgeWide} viewBox="0 0 90 80"><path d="M80 8 C 70 34, 50 52, 14 66" /><path d="M14 66 L 30 52 M14 66 L 33 72" /></svg>
      {/* On a phone the note sits above the card, and the arrow threads between the habit's name and
          its count to land on today's circle. Drawn 1:1 from the circle's top. */}
      <svg className={s.nudgeNarrow} viewBox="-60 -150 100 160"><path d="M14 -138 C -30 -100, -40 -40, -17 3" /><path d="M-17 3 L -16.5 -11 M-17 3 L -29 -4.5" /></svg>
    </span>
  );
  return (
    <Chapter tone="build" label="s-build-h">
      <div className={s.bBody}>
        <div className={s.bApp}><HabitApp nudge={nudge} /></div>
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
    <Chapter tone="ai" label="s-ai-h">
      <div className={s.aBody}>
        <div className={s.aTop}>
          <h2 id="s-ai-h" className={s.aTitle}>Your AI,<br />in all three.</h2>
          <div className={s.askWrap}>
            <p className={s.ask}><span className={s.askMark}><AIGlyph name="openai" size={22} color="#fff" /></span>“Add a day in Sintra to my Lisbon trip.”</p>
            <p className={s.askSub}>One request in ChatGPT. It knows you decided on no car, changes all three, and says so.</p>
          </div>
        </div>
        <AiCards subscribe={subscribe} />
        <div className={s.aFoot}>
          <p className={s.works}>Connect <span className={s.with}><AIGlyph name="openai" size={17} color="#fff1e2" />ChatGPT</span>, <span className={s.with}><AIGlyph name="claude" size={17} color="#d97757" />Claude</span>, Claude Code or Codex. Every chat starts knowing your notes.</p>
          <p className={s.study}>In a new chat, Claude answered 18% of questions about past chats. With Pinto, 82.5%. <a href="/blog/ai-memory-with-notes">Read the study</a></p>
        </div>
      </div>
    </Chapter>
  );
}

/* ───────────────────────── Mac and iPhone ───────────────────────── */

function Sync() {
  return (
    <Chapter tone="sync" label="s-sync-h">
      <div className={s.yBody}>
        <div className={s.yHead}>
          <h2 id="s-sync-h" className={s.yTitle}>The same trip, on your Mac and&nbsp;iPhone.</h2>
          <ul className={s.yFacts}>
            <li>Always in sync, and it works offline.</li>
            <li>Encrypted on your device before it syncs.</li>
            <li>Bring your notes from Apple Notes, Obsidian, Bear, Evernote and Keep.</li>
            <li>Open source. Anyone can check the code.</li>
          </ul>
        </div>
        <Devices />
      </div>
    </Chapter>
  );
}

/* ───────────────────────── The cover: the notebook closes ───────────────────────── */

function Cover() {
  return (
    <section id="s-cover" data-ch="cover" className={s.cover} aria-labelledby="s-free-h" style={{ zIndex: 9 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={s.coverArt} src="/lab/s/cover-v1.webp" alt="" width="1536" height="1024" loading="lazy" />
      <div data-body className={s.coverBody}>
        <h2 id="s-free-h" className={s.fTitle}>Pinto Notes<br />is <em>free.</em></h2>
        <div className={`${x.ctas} ${s.ctas} ${s.fCtas}`}>
          <Download note={false} />
          <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
            Get it for iPhone
          </a>
          <a className={x.offMac} href="/download">Download for Mac</a>
        </div>
        <p className={s.fReq}>Requires macOS 26 or iOS 26.</p>
      </div>
    </section>
  );
}

export function Story({ className }: { className: string }) {
  const root = useRef<HTMLDivElement>(null);
  useBinder(root);
  return (
    <div ref={root} className={`${s.stack} ${className}`}>
      <span data-probe className={s.probe} aria-hidden="true" />
      <span data-probe-hh className={s.probeHh} aria-hidden="true" />
      <Hero />
      <Write />
      <Draw />
      <Build />
      <Ai />
      <Sync />
      <Cover />
      <div className={s.tail} aria-hidden="true" />
    </div>
  );
}
