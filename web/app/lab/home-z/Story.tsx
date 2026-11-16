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
import { HeroArt } from "./HeroArt";
import { BoardBig, CanvasChrome, Note, NotePhone } from "./Things";
import { underline } from "./hand";
import s from "./s.module.css";

// Study Z, round 18 (2026-11-16): option C after the round 13 council. S's binder carrying one
// person's week, several parts of one life. The first screen is that person's table (the still life)
// with one note on it, "This week", all dinner: what they decided ("20-minute weeknight dinners"),
// Tuesday's dinner, and Thursday's, which ChatGPT just added. Over it, the ChatGPT request that changed
// it ("Add a dinner for Thursday."); on load, the decision's "20-minute" takes ChatGPT's underline and
// Thursday's line writes itself in, "Lemon chicken · 20 min", marked "Added by ChatGPT": the AI read
// what you decided. That picture is HeroArt.tsx, one swappable piece. Each chapter shows another part
// of that life: Notes, a book note open in Pinto (vermilion), the notes brought over from Apple Notes;
// Whiteboards, the job offer from Studio North mapped as a decision (deep green); Apps, the habits
// they're building (kraft); Your AI, one request typed in ChatGPT that lands in all three, in Pinto
// Notes (ink). Then the proof, a plain white sheet with no tab (the page's one break in colour and in
// kind): what the study's two numbers show, the measure beside them, a bar each, and in one light line
// each what Claude had. Then the close, on the same table: "Pinto Notes is free.", the download, four
// plain lines, and the Studio North note on a Mac and an iPhone.
//
// Every sheet, the proof and the close too, is torn along its top and laid over the last. The four
// chapters dock under their tabs; the proof and the close, which have no tab, rise on over the tab
// strip and dock under the header, so the tabs end with Your AI. When a sheet lands its tab rises out
// of it and stays docked under the header; as a sheet rises, the words and things on the one under it move up
// ahead of its torn edge, so a tear never cuts through them. Above that, a sheet's contents end where
// its paper does: they're masked by the sheet's own torn edge, fading out just before it, so nothing
// is ever cut by a straight line under the tabs. A heading and its line fade out whole before they
// reach that edge. On a phone each chapter is as long as what's on it: the next sheet waits just
// under the last line, not a screen below.
//
// The sheets move by `position: sticky` alone (the browser scrolls them; no script moves them). The
// script measures how far each one is through its stay; the chapters' shows (show.ts) start when they
// dock. With Reduce Motion or `?t=`, everything shows its end state.

type Tone = "write" | "draw" | "build" | "ai" | "proof" | "cover";
const ORDER: Tone[] = ["write", "draw", "build", "ai", "proof", "cover"];
const TAB: Record<Tone, string> = { write: "Notes", draw: "Whiteboards", build: "Apps", ai: "Your AI", proof: "", cover: "" };
/** On a phone, the chapters whose next sheet waits just under their last line (+ AIR px), so a chapter
 *  is as long as what's on it. Your AI keeps its stay (it fills the screen, and its cards step). */
const SNUG: Tone[] = ["write", "draw", "build", "proof"];
const AIR = 34;
/** On a Mac, Notes is as long as what's on it too (round 19): the whiteboard's sheet waits this far
 *  under the Mac window and its iPhone, so no stretch of empty red follows them. */
const SNUG_WIDE: Tone[] = ["write"];
const AIR_WIDE = 44;
/** The gap between the tabs, which are as wide as their labels (round 19), on a Mac and on a phone. */
const TAB_GAP = 8, TAB_GAP_NARROW = 6;
const narrowNow = () => typeof matchMedia === "function" && matchMedia("(max-width: 760px)").matches;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
/** How far (px) above its clip line a headline starts to fade; it's gone by the time it gets there. */
const FADE = 64;

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
const STAY: Record<Tone, number> = { write: 0.2, draw: 0.85, build: 0.02, ai: 0.02, proof: 0, cover: 0 };
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
    const probe = el.querySelector<HTMLElement>("[data-probe]")!;
    const reduced = calm();
    /** Each chapter's words that fade before they reach its clip line (headlines and their lines). */
    const fades = chs.map((c) => [...c.querySelectorAll<HTMLElement>("[data-fade]")]);
    let vh = 0, tt = 0, hh = 0, tear = 0, raf = 0;
    /** Where a sheet docks: a chapter under its tab, the proof and the close (no tab) under the header,
     *  over the tab strip, so the tabs end with Your AI. */
    const topOf = (i: number) => (TAB[ORDER[i]] ? tt : hh);
    let doc: number[] = [], mt: number[] = [];
    const covered = chs.map(() => false);
    const lifts = chs.map(() => 0);
    /** How far down the sheet its words and things reach (from its top, without any lift). */
    const reach = (i: number) => {
      const c = chs[i], top = c.getBoundingClientRect().top;
      const kids = c.querySelectorAll<HTMLElement>("[data-body] > * > *");
      let b = 0;
      kids.forEach((k) => { const r = k.getBoundingClientRect(); if (r.height > 0 && getComputedStyle(k).display !== "none") b = Math.max(b, r.bottom); });
      return b - top + lifts[i];
    };

    const measure = () => {
      vh = innerHeight; tt = probe.offsetHeight;
      const cs = getComputedStyle(el);
      tear = parseFloat(cs.getPropertyValue("--tearH")) || 0;
      hh = parseFloat(cs.getPropertyValue("--hh")) || 0;
      // On a phone the next sheet waits just under a chapter's last line: its margin (the stay) is
      // taken back by the room left empty under the words. Wide windows keep the stylesheet's stays.
      const narrow = narrowNow();
      chs.forEach((c, i) => {
        const next = chs[i + 1]; if (!next) return;
        const snug = narrow ? SNUG.includes(ORDER[i]) : SNUG_WIDE.includes(ORDER[i]);
        const want = snug ? `${-Math.max(0, Math.round(c.offsetHeight - reach(i) - (narrow ? AIR : AIR_WIDE)))}px` : "";
        if (next.style.marginTop !== want) next.style.marginTop = want;
      });
      // The tabs are as wide as their labels, side by side from the page's left edge.
      let l = 0;
      chs.forEach((c) => {
        const tab = c.querySelector<HTMLElement>("[data-tab]"); if (!tab) return;
        c.style.setProperty("--l", `${l}px`);
        l += tab.offsetWidth + (narrow ? TAB_GAP_NARROW : TAB_GAP);
      });
      let end = hero.getBoundingClientRect().bottom + scrollY;
      doc = []; mt = [];
      chs.forEach((c, i) => { const m = parseFloat(getComputedStyle(c).marginTop) || 0; mt.push(m); doc.push(end + m); end = doc[i] + c.offsetHeight; });
    };

    const frame = () => {
      raf = 0;
      const y = scrollY;
      const docked: boolean[] = [];
      for (let i = 0; i < chs.length; i++) {
        const nt = doc[i] - y, top = topOf(i);
        const arrive = clamp((vh - nt) / Math.max(1, vh - top));
        docked.push(nt <= top + 0.5);
        // A stay is at least 35% of a screen of scroll, so a phone's snug chapter still plays its show.
        const dwellLen = i + 1 < chs.length ? Math.max(vh * 0.35, mt[i + 1]) : vh * 0.4;
        const dwell = clamp((top - nt) / dwellLen);
        listeners.get(ORDER[i])?.forEach((fn) => fn(dwell, arrive));
      }
      // A docked chapter's tab rises out of its page (CSS), so a tab never crosses the page under it.
      for (let i = 0; i < chs.length; i++) if (docked[i] !== (chs[i].dataset.docked !== undefined)) chs[i].toggleAttribute("data-docked", docked[i]);
      // The chapter you're in (the front one docked under its tab) raises its tab; the others sit lower.
      let front = -1;
      for (let i = 0; i < chs.length; i++) if (docked[i]) front = TAB[ORDER[i]] ? i : -1;
      for (let i = 0; i < chs.length; i++) if ((i === front) !== (chs[i].dataset.front !== undefined)) chs[i].toggleAttribute("data-front", i === front);
      // As the next sheet rises, this one's words and things move up ahead of its torn edge (the gap
      // never closes), so a tear never cuts through a line or a card: every chapter has finished, all
      // of it in view, before the next sheet reaches it.
      for (let i = 0; i + 1 < chs.length; i++) {
        const nt = doc[i + 1] - y;
        let lift = 0;
        if (docked[i] && nt < vh) lift = Math.max(0, Math.round(topOf(i) + reach(i) - (nt - 18)));
        if (lift !== lifts[i]) { lifts[i] = lift; chs[i].style.setProperty("--lift", `${lift}px`); chs[i].toggleAttribute("data-lifted", lift > 0); }
        // A headline is never sliced: as a chapter's heading and its line move up to its torn edge,
        // they fade out together, whole, before they reach it. (The cards fade out into the edge.)
        const heads = fades[i];
        if (!heads.length) continue;
        const clipY = topOf(i) + tear;
        heads.forEach((h) => {
          if (!lift) { if (h.style.opacity) h.style.opacity = ""; return; }
          // Over the last FADE px before the clip line, or over all the room it had, if less (a phone's
          // heading sits just under the tear), so it starts fading from full as the lift begins.
          const top = h.getBoundingClientRect().top, gap = top - clipY - 4;
          const o = clamp(gap / Math.max(1, Math.min(FADE, gap + lift))).toFixed(3);
          if (h.style.opacity !== o) h.style.opacity = o;
        });
      }
      // A chapter under a docked one is filed: its contents aren't painted, and its torn top edge
      // goes, so only the front sheet's edge crosses the tabs behind it (each tab stays whole).
      for (let i = 0; i < chs.length; i++) {
        const behind = i + 1 < chs.length && docked[i + 1];
        if (behind !== (chs[i].dataset.behind !== undefined)) chs[i].toggleAttribute("data-behind", behind);
        const cov = behind && (doc[i + 1] - y) <= topOf(i + 1) - 40;
        if (cov !== covered[i]) { covered[i] = cov; chs[i].toggleAttribute("data-covered", cov); }
        // Once a sheet with no tab has docked under the header, everything under it is put away, tabs
        // and all, so only the page's own cream shows through the gaps in its torn edge.
        let gone = false;
        for (let j = i + 1; j < chs.length; j++) if (!TAB[ORDER[j]] && docked[j]) { gone = true; break; }
        if (gone !== (chs[i].dataset.gone !== undefined)) chs[i].toggleAttribute("data-gone", gone);
      }
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const resize = () => { measure(); frame(); };
    jump = (tone) => {
      const i = ORDER.indexOf(tone);
      const stay = i + 1 < chs.length ? Math.max(0, mt[i + 1]) * STAY[tone] : 0;
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
      chs.forEach((c) => { c.style.marginTop = ""; });
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
        <p className={s.lede}>Simple notes, whiteboards and apps. ChatGPT and Claude work in all three with you, and can read what you decided.</p>
        <Cta />
        {/* On a phone, the price in a short line under the buttons (the line below is the Mac's). */}
        <p className={s.freeLine}>Free on iPhone and Mac.</p>
        <p className={s.fine}>Free on Mac and iPhone. Works with <span className={s.with}><AIGlyph name="openai" size={15} />ChatGPT</span> and <span className={s.with}><AIGlyph name="claude" size={15} color="#d97757" />Claude</span>.</p>
      </div>
      {/* The picture: swap HeroArt (and its heroArt.module.css) for another first screen. */}
      <div className={s.art}><div className={s.artTop}><HeroArt /></div></div>
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
          <div className={s.wHead} data-fade>
            <h2 id="s-write-h" className={s.wTitle}>Write <br />notes.</h2>
            <Say long="They feel like Apple Notes, on Mac and iPhone, and you can bring yours over." short="Like Apple Notes, on Mac and iPhone. Bring yours over." />
          </div>
          {/* The note on a Mac, and the same note on an iPhone laid over the window's corner. */}
          <div className={s.wDevices}>
            <Note live={live} />
            <NotePhone />
          </div>
        </div>
      </div>
    </Chapter>
  );
}

/* ───────────────────────── Draw on whiteboards ───────────────────────── */

function Draw() {
  // With Reduce Motion or `?t=`, the arrow is already drawn when the chapter arrives. On a Mac, Claude
  // draws it as you scroll through the chapter's stay. On a phone the chapter is only as long as the
  // board, so it draws on a clock once the board docks (2.4 s), or sooner if you scroll on.
  const bind = useCallback((set: (k: number) => void) => {
    let d0 = 0, t0 = 0, raf = 0, k = 0;
    const show = (v: number) => { if (v !== k) { k = v; set(v); } };
    const tick = (now: number) => {
      if (!t0) t0 = now;
      const tk = Math.min(1, (now - t0) / 2400);
      show(Math.max(tk, d0));
      raf = tk < 1 ? requestAnimationFrame(tick) : 0;
    };
    const off = listen("draw", (d, p) => {
      if (still() || (calm() && p >= 1)) { show(1); return; }
      d0 = d;
      if (narrowNow() && p >= 0.995 && !t0 && !raf) raf = requestAnimationFrame(tick);
      if (!raf) show(Math.max(d, t0 ? 1 : 0));
    });
    return () => { off(); cancelAnimationFrame(raf); };
  }, []);
  return (
    <Chapter tone="draw" label="s-draw-h">
      <div className={s.dBody}>
        <div className={s.dHead} data-fade>
          <h2 id="s-draw-h" className={s.dTitle}>Draw on whiteboards.</h2>
          <Say long="Map out a decision beside your notes. Your AI can read the board and draw on it with you." short="Map out a decision. Your AI can read it, and draw on it with you." />
        </div>
        <div className={s.dBoard} role="img" aria-label="A whiteboard, Studio North: now or March? The offer leads to a question, take it now? Yes, dashed as the path not taken, means starting in January with the launch half done. The path chosen is finishing the launch, shipping in February, then talking again in March. Claude's cursor draws the last arrow, the no, from the question to the path chosen.">
          {/* The board in Pinto's canvas: a thin frame, the drawing, the dock of tools at its foot. */}
          <div className={s.canvas}>
            <div className={s.canvasArea}>
              <span className={s.wideOnly}><BoardBig bind={bind} /></span>
              <span className={s.tallOnly}><BoardBig tall bind={bind} /></span>
            </div>
            <CanvasChrome />
          </div>
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
          <div className={s.bHead} data-fade>
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
        title={<h2 id="s-ai-h" className={s.aTitle}>Your AI,<br />{" "}in all three.</h2>}
        foot={
          <div className={s.aFoot}>
            <p className={s.works}>Connect <span className={s.with}><AIGlyph name="openai" size={17} color="#fff1e2" />ChatGPT</span>, <span className={s.with}><AIGlyph name="claude" size={17} color="#d97757" />Claude</span>, Claude Code or Codex. Every chat starts knowing your notes.</p>
          </div>
        }
      />
    </Chapter>
  );
}

/* ───────────────────────── The proof: the study, as a comparison ───────────────────────── */

/** The study's result, and what each condition had (see /blog/ai-memory-with-notes: Claude Haiku 5.5
 *  both times, LoCoMo, 1,540 questions about months of earlier chats, asked in a new chat; with nothing
 *  else it answered 18% right; with Pinto Notes connected, where after each chat it had kept its own
 *  notes, 82.5%). The measure, "questions answered correctly", is the study's "share right". */
const STUDY = [
  { who: "Claude in a new chat", had: "It had only the new chat.", v: 18, shown: "18%" },
  { who: "Claude with Pinto", had: "It could also read the notes it kept in Pinto after each chat.", v: 82.5, shown: "82.5%" },
] as const;

/** A plain white sheet with no tab, torn like the rest, that rises over the tab strip: the page's one
 *  break in colour and in kind (no card, no show). A heading that says what the numbers show, a line on
 *  what was asked (both times a new chat, the same model), the measure, then the two results as bars,
 *  each number at the end of its bar, so the gap reads at a glance, each with one light line on what
 *  Claude had; then who ran it, and the link. The bars grow once as the page lands (with Reduce Motion
 *  they're already full). */
function Proof() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (still() || calm()) { setOn(true); return; }
    return listen("proof", (_d, p) => { if (p >= 0.6) setOn(true); });
  }, []);
  return (
    <Chapter tone="proof" label="s-proof-h">
      <div className={s.proofBody}>
        <div className={s.proofIn}>
          <div className={s.proofHead} data-fade>
            <h2 id="s-proof-h" className={s.proofTitle}>Claude got far more right when it could read the notes.</h2>
            <p className={s.proofSay}>1,540 questions about months of earlier chats. Same model both times.</p>
          </div>
          {/* The measure, once, over the bars. Each number sits at the end of its bar (round 19), so the
              heading leads and the numbers don't repeat the bars. Like the heading, each row fades out
              whole before the next sheet's torn edge reaches it. */}
          <p className={s.barMeasure} data-fade>Questions answered correctly</p>
          <dl className={s.bars} data-on={on || undefined}>
            {STUDY.map((r, i) => (
              <div key={r.who} className={s.barRow} data-pinto={i === 1 || undefined} data-fade>
                <dt className={s.barWho}><b>{r.who}</b><span>{r.had}</span></dt>
                <dd className={s.barLine} style={{ "--v": r.v / 100 } as React.CSSProperties}>
                  <i className={s.barFill} aria-hidden="true" />
                  <span className={s.barNum}>{r.shown}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className={s.proofFoot} data-fade>
            <span>Claude Haiku 5.5 on the LoCoMo test. Run by the maker of Pinto Notes; the code and every answer are public.</span>
            <a className={s.proofLink} href="/blog/ai-memory-with-notes">Read the study<span aria-hidden="true">→</span></a>
          </p>
        </div>
      </div>
    </Chapter>
  );
}

/* ───────────────────────── The cover: the notebook closes ───────────────────────── */

function Cover() {
  const sub = useCallback(stayOf("cover"), []);
  return (
    <section id="s-cover" data-ch="cover" className={s.cover} aria-labelledby="s-free-h" style={{ zIndex: 9 }}>
      {/* The close's paper, torn along its top like every sheet above it, with the still life on it. */}
      <div className={s.coverPaper} aria-hidden="true">
        <div className={s.coverSheet}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.coverArt} src="/lab/z/close-life-v1.webp" alt="" width="1536" height="1024" loading="lazy" />
        </div>
      </div>
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
      <Hero />
      <Write />
      <Draw />
      <Build />
      <Ai />
      <Proof />
      <Cover />
      <div className={s.tail} aria-hidden="true" />
    </div>
  );
}
