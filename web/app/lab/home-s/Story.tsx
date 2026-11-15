"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { APP_STORE_URL, SITE_URL } from "@/lib/site";
import { mailLink, sendLink } from "@/lib/platform";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { AiShow } from "./AiShow";
import { BuildShow } from "./Build";
import { FreeLines, SyncMoment } from "./Close";
import { HeroOne } from "./HeroOne";
import { BoardBig, Note } from "./Things";
import { underline } from "./hand";
import s from "./s.module.css";

// Study S, "Editorial colour", round 9 (2026-11-15). The page is a ring binder printed like a
// risograph collage. The first screen is one page of the Lisbon trip note on a torn-paper collage,
// written by two hands: your pencil writes the decision, then ChatGPT's line lands under it, with
// Undo. Below it, each thing is a full-bleed colour divider with a torn top edge. Scrolling lays each
// one over the last, whole, and when it lands its tab rises out of it and stays docked under the
// header. The tabs end at Your AI. Then the notebook's cover closes over everything, tabs and all, in
// one scene: "Pinto Notes is free.", the download, four lines in pencil, and the note on a Mac and an
// iPhone, where ChatGPT's line arrives a moment after the cover lands.
//
// The sheets move by `position: sticky` alone (the browser scrolls them; no script moves them). The
// script measures how far each one is through its stay; the chapters' shows (show.ts) start when they
// dock. With Reduce Motion or `?t=`, everything shows its end state.

type Tone = "write" | "draw" | "build" | "ai" | "cover";
const ORDER: Tone[] = ["write", "draw", "build", "ai", "cover"];
const TAB: Record<Tone, string> = { write: "Notes", draw: "Whiteboards", build: "Apps", ai: "Your AI", cover: "" };

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

/** Where a tab scrolls to: docked, and for the drawing, most of the way through its stay. */
const STAY: Record<Tone, number> = { write: 0.2, draw: 0.85, build: 0.02, ai: 0.02, cover: 0 };
/** A chapter's stay as a show's clock source (see show.ts). */
const stayOf = (tone: Tone) => (fn: (dwell: number, arrive: number) => void) => listen(tone, fn);
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
      // A docked chapter's tab rises out of its page (CSS), so a tab never crosses the page under it.
      for (let i = 0; i < chs.length; i++) if (docked[i] !== (chs[i].dataset.docked !== undefined)) chs[i].toggleAttribute("data-docked", docked[i]);
      // A chapter under a docked one is filed: its contents aren't painted, and its torn top edge
      // goes, so only the front sheet's edge crosses the tabs behind it (each tab stays whole).
      for (let i = 0; i < chs.length; i++) {
        const behind = i + 1 < chs.length && docked[i + 1];
        if (behind !== (chs[i].dataset.behind !== undefined)) chs[i].toggleAttribute("data-behind", behind);
        const cov = behind && (doc[i + 1] - y) <= tt - 40;
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
          {TAB[tone]}
        </a>
      )}
      <div className={s.paper} aria-hidden="true"><i className={s.rim} /><i className={s.sheetBg} /><i className={s.dots} /></div>
      <div data-body className={s.body}>{children}</div>
    </section>
  );
}

/** A chapter's line: the full sentence on wide screens, a shorter one on a phone (both true). */
const Say = ({ long, short }: { long: string; short: string }) => (
  <p className={s.say}><span className={s.long}>{long}</span><span className={s.short}>{short}</span></p>
);

/* ───────────────────────── The first screen ───────────────────────── */

const Cta = () => (
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
);

function Hero() {
  return (
    <section data-hero className={s.hero} aria-labelledby="s-h1">
      <div className={s.heroText}>
        <h1 id="s-h1" className={s.h1}>The notebook for <span className={s.h1You}>you and <span className={s.h1Ai}>your AI.<Underline /></span></span></h1>
        <p className={s.lede}>Write notes, draw on whiteboards and build apps. ChatGPT and Claude work in all three with you, and remember what you decided.</p>
        <Cta />
        <p className={s.fine}>Free on Mac and iPhone. Works with <span className={s.with}><AIGlyph name="openai" size={15} />ChatGPT</span> and <span className={s.with}><AIGlyph name="claude" size={15} color="#d97757" />Claude</span>.</p>
      </div>
      <div className={s.art}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.collage} src="/lab/s/collage-nohand-v1.webp" alt="" width="1122" height="1402" fetchPriority="high" />
        <div className={s.objs}><HeroOne /></div>
      </div>
    </section>
  );
}

/** A hand-drawn orange stroke under "your AI", drawn in once on arrival. */
function Underline() {
  const [d, d2] = underline();
  return (
    <svg className={s.uline} viewBox="0 0 564 40" preserveAspectRatio="none" aria-hidden="true">
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
        <div className={s.wIn}>
          <div className={s.wHead}>
            <h2 id="s-write-h" className={s.wTitle}>Write <br />notes.</h2>
            <Say long="They feel like Apple Notes, on Mac and iPhone. Bring yours over from Apple Notes." short="Like Apple Notes, on Mac and iPhone. Bring yours over." />
          </div>
          <Note live={live} />
        </div>
      </div>
    </Chapter>
  );
}

/* ───────────────────────── Draw on whiteboards ───────────────────────── */

function Draw() {
  // With Reduce Motion or `?t=`, the arrow is already drawn when the chapter arrives.
  const bind = useCallback((set: (k: number) => void) => listen("draw", (d, p) => set(still() || (calm() && p >= 1) ? 1 : d)), []);
  const wrap = useRef<HTMLDivElement>(null), tip = useRef<SVGCircleElement>(null);
  // Your hand, printed in the board's own cream ink, reaches in from the left edge: its pencil is
  // where it has just drawn the first shape. Claude draws the last arrow.
  useEffect(() => {
    const w = wrap.current, t = tip.current; if (!w || !t) return;
    const place = () => {
      const a = w.getBoundingClientRect(), b = t.getBoundingClientRect();
      if (!b.width && !b.height && !b.left) return;
      w.style.setProperty("--tipx", `${(b.left + b.width / 2 - a.left).toFixed(1)}px`);
      w.style.setProperty("--tipy", `${(b.top + b.height / 2 - a.top).toFixed(1)}px`);
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
          <Say long="A whiteboard beside your notes. Your AI can read it, and draw on it with you." short="Your AI can read it, and draw on it with you." />
        </div>
        <div ref={wrap} className={s.dBoard} role="img" aria-label="A hand-drawn whiteboard, Friday in Lisbon: land at 10:40, bags to Alfama, then if it rains the tile museum, if not Belém by the river, both ending at the sunset at Graça. Your pencil drew the first shape; Claude's cursor draws the last arrow.">
          <span className={s.wideOnly}><BoardBig bind={bind} tipRef={tip} /></span>
          <span className={s.tallOnly}><BoardBig tall bind={bind} /></span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.pencilHand} src="/lab/s/hand-ink-v1.webp" alt="" width="840" height="560" loading="lazy" />
        </div>
      </div>
    </Chapter>
  );
}

/* ───────────────────────── Build apps ───────────────────────── */

function Build() {
  const sub = useCallback(stayOf("build"), []);
  return (
    <Chapter tone="build" label="s-build-h">
      <div className={s.bBody}>
        <div className={s.bIn}>
          <div className={s.bApp}><BuildShow subscribe={sub} /></div>
          <div className={s.bHead}>
            <h2 id="s-build-h" className={s.bTitle}>Build <br />apps.</h2>
            <Say long="A note can be a small app. Pick a template, or describe one and your AI makes it." short="A note can be a small app. Describe one, and your AI makes it." />
          </div>
        </div>
      </div>
    </Chapter>
  );
}

/* ───────────────────────── Your AI ───────────────────────── */

function Ai() {
  const sub = useCallback(stayOf("ai"), []);
  return (
    <Chapter tone="ai" label="s-ai-h">
      <AiShow
        subscribe={sub}
        title={<h2 id="s-ai-h" className={s.aTitle}>Your AI,<br />in all three.</h2>}
        foot={
          <div className={s.aFoot}>
            <p className={s.works}>Connect <span className={s.with}><AIGlyph name="openai" size={17} color="#fff1e2" />ChatGPT</span>, <span className={s.with}><AIGlyph name="claude" size={17} color="#d97757" />Claude</span>, Claude Code or Codex. Every chat starts knowing your notes.</p>
            <p className={s.study}>In a new chat, Claude answered 18% of questions about past chats. With Pinto, 82.5%. <a href="/blog/ai-memory-with-notes">Read the study</a></p>
          </div>
        }
      />
    </Chapter>
  );
}

/* ───────────────────────── The cover: the notebook closes ───────────────────────── */

function Cover() {
  const sub = useCallback(stayOf("cover"), []);
  return (
    <section id="s-cover" data-ch="cover" className={s.cover} aria-labelledby="s-free-h" style={{ zIndex: 9 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={s.coverArt} src="/lab/s/cover-v1.webp" alt="" width="1536" height="1024" loading="lazy" />
      <div data-body className={s.coverBody}>
        <div className={s.coverText}>
          <h2 id="s-free-h" className={s.fTitle}>Pinto Notes<br />is <em>free.</em></h2>
          <div className={s.fCtas}><Cta /></div>
          <p className={s.fReq}>Requires macOS 26 or iOS 26.</p>
          <FreeLines />
        </div>
        <SyncMoment subscribe={sub} />
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
      <Cover />
      <div className={s.tail} aria-hidden="true" />
    </div>
  );
}
