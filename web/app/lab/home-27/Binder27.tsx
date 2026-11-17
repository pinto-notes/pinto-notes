"use client";

import { useEffect, useRef } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import b from "./b27.module.css";

// Round 27: the binder's cover, from round 26's `binder` (home-binder/Binder.tsx), in two places.
//
// Hero c (`?hero=c`): the first screen is the closed cover, inset on the cream page, with the headline
// on it and the two AIs' bookmarks hanging from its top edge. A window is die-cut in it, and through it
// you see the Deep Work note inside, being edited (the first screen's picture, Pic.tsx, lies under the
// cover). Scrolling swings the cover open on its spine onto that note, which is then carried into Notes
// (Story.tsx moves the cover; this file only draws it).
//
// Close b (`?close=b`): at the end the cover swings shut over Your AI, under the four tabs, with "Pinto
// Notes is free.", the buttons and one line of small print on it.

/** Two ribbon bookmarks, each ending in a round paper charm with the mark of the AI that works in these
 *  pages: ChatGPT's knot on ink, Claude's spark on its terracotta. They swing once as the page opens. */
export function Ribbons({ className = "" }: { className?: string }) {
  return (
    <div className={`${b.ribbons} ${className}`} data-ribbons aria-hidden="true">
      <span className={b.ribbon} data-ai="gpt"><span className={b.charm}><AIGlyph name="openai" size={24} color="#fff4e6" /></span></span>
      <span className={b.ribbon} data-ai="claude"><span className={b.charm}><AIGlyph name="claude" size={24} color="#fff4e6" /></span></span>
    </div>
  );
}

/** Hero c's cover: the board, its spine (the hinge) and elastic band, the window cut in it, the words
 *  and the bookmarks. Story.tsx turns it (`data-cover`) as you scroll. */
export function CoverC({ children }: { children: React.ReactNode }) {
  return (
    <div className={b.cover} data-cover>
      <div className={b.board} aria-hidden="true">
        <i className={b.spine} />
        <i className={b.band} />
        {/* The die-cut window's edge: a thin bevel, the board's thickness. */}
        <i className={b.cut} />
      </div>
      <div className={b.words}>{children}</div>
      <Ribbons className={b.r1} />
      <i className={b.shade} data-shade aria-hidden="true" />
    </div>
  );
}

const calm = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, z: number) => clamp((p - a) / (z - a));
const mj = (t: number) => t * t * t * (t * (6 * t - 15) + 10);
const px = (v: number) => `${Math.round(v * 100) / 100}px`;
const cssPx = (el: Element, name: string) => parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;

/** Close b: the cover swings shut over Your AI, docked under the four tabs. */
export function CloseCover({ cta, fine }: { cta: React.ReactNode; fine: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = root.current; if (!el) return;
    const stack = el.closest<HTMLElement>("[data-stack]");
    const face = el.querySelector<HTMLElement>("[data-face]")!;
    const shade = el.querySelector<HTMLElement>("[data-shade]")!;
    const reduced = calm() || new URLSearchParams(location.search).has("t");
    let raf = 0;
    const frame = () => {
      raf = 0;
      const vh = innerHeight, host = stack ?? el, tt = (cssPx(host, "--hh") || 72) + (cssPx(host, "--tabH") || 34);
      const nt = el.getBoundingClientRect().top;
      // How far the cover has come, from the foot of the screen to docked under the tabs. Its face is held
      // under the tabs the whole way (the section's box is what scrolls), and turns shut on its spine over
      // the first 80% of that.
      const q = clamp((vh - nt) / Math.max(1, vh - tt));
      const hold = Math.max(0, nt - tt);
      if (reduced) { face.style.transform = hold ? `translateY(${px(-hold)})` : ""; face.style.opacity = seg(q, 0.2, 0.8).toFixed(3); return; }
      const a = mj(seg(q, 0.02, 0.82));
      face.style.transform = `translateY(${px(-hold)}) perspective(1500px) rotateY(${(90 * (1 - a)).toFixed(2)}deg)`;
      face.style.opacity = seg(a, 0.03, 0.22).toFixed(3);
      face.style.visibility = a <= 0 ? "hidden" : "";
      shade.style.opacity = (0.42 * Math.sin((Math.PI / 2) * (1 - a))).toFixed(3);
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(frame); };
    // The footer's torn edge sits on the cover at the page's end: the footer is pulled up over the cover by
    // its own height (b27.module.css), so the cover stays docked under the tabs.
    const resize = () => {
      const foot = document.querySelector<HTMLElement>(".site-footer");
      if (stack && foot) stack.style.setProperty("--footH", `${foot.offsetHeight}px`);
      if (foot) document.documentElement.style.setProperty("--binderFootH", `${foot.offsetHeight}px`);
      frame();
    };
    resize();
    const foot = document.querySelector<HTMLElement>(".site-footer");
    const ro = foot && typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (foot) ro?.observe(foot);
    addEventListener("scroll", ask, { passive: true });
    addEventListener("resize", resize);
    return () => { ro?.disconnect(); removeEventListener("scroll", ask); removeEventListener("resize", resize); cancelAnimationFrame(raf); document.documentElement.style.removeProperty("--binderFootH"); };
  }, []);
  return (
    <section ref={root} id="s-cover" data-ch="cover" className={b.close} aria-labelledby="s-free-h" style={{ zIndex: 9 }}>
      <div className={b.face} data-face>
        <i className={b.spine} aria-hidden="true" />
        <i className={b.band} aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={b.leaf} src="/lab/27/leaf-v1.webp" alt="" width={894} height={1102} loading="lazy" />
        <div data-body className={b.closeBody}>
          <div className={b.closeText}>
            <h2 id="s-free-h" className={b.closeTitle}>Pinto Notes<br />is free.</h2>
            <div className={b.closeCtas}>{cta}</div>
            <p className={b.closeFine}>{fine}</p>
          </div>
        </div>
        <i className={b.shade} data-shade aria-hidden="true" />
      </div>
    </section>
  );
}
