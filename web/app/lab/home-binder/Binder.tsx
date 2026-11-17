"use client";

import { useEffect, useRef } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import s from "./s.module.css";
import b from "./binder.module.css";

// Round 26, "binder" (2026-11-17): the page is a notebook you open and close. The chapters below are
// already the binder's coloured dividers (Notes red, Whiteboards green, Apps kraft, Your AI ink), each
// docking under its tab. This file adds the binder itself: the first screen shows it closed, scrolling
// opens it onto the red Notes divider, and the page ends with the cover swinging shut.
//
// Hero 1 (`?hero=1`): the closed binder is the picture, front-on beside the headline: its amber cover
// (cut paper, the leaf on it), the four dividers' tabs on its top edge, and two ribbon bookmarks with
// the ChatGPT and Claude marks. Scrolling turns the cover over onto the left (the book comes to the
// middle, open on Notes), then the red divider grows to fill the screen, its tab flying to where the
// Notes tab docks; at that scroll position the real Notes chapter is docked in exactly that place, so
// the page hands over without a seam.
// Hero 2 (`?hero=2`): the first screen IS the cover. The tabs stand where they'll dock, the cover runs
// under them to the screen's edges, the headline is set on it, and the two ribbons hang down over it.
// Scrolling swings the cover away on its spine, and the real Notes chapter is under it.
// Close 1 (`?close=1`): at the end the cover swings shut over Your AI, under the four tabs, with
// "Pinto Notes is free." and the buttons on it.
//
// Every move is a pure function of the scroll position (no timers), eased on minimum jerk per stage, so
// it scrubs both ways. With Reduce Motion the cover fades instead of turning, and nothing scales.
// Art: /lab/binder/*.webp; sources and prompts in ~/content-tools/projects/pinto-site-art/r26-binder/.

export type HeroV = "1" | "2";
export type CloseV = "0" | "1";

/** The binder's dividers, front to back, as the page's chapters. */
const DIV = [
  { tone: "write", tab: "Notes" },
  { tone: "draw", tab: "Whiteboards" },
  { tone: "build", tab: "Apps" },
  { tone: "ai", tab: "Your AI" },
] as const;

/** How far you scroll to open the binder, in screens. */
export const OPEN: Record<HeroV, number> = { "1": 1.05, "2": 0.8 };

/* ───────────────────────── Shared state: is the binder open? ───────────────────────── */

let isOpen = false;
const subs = new Set<(o: boolean) => void>();
/** Story's Notes waits for this before its show starts (hero 2 has Notes docked under the cover). */
export function onOpened(fn: (o: boolean) => void) { subs.add(fn); fn(isOpen); return () => { subs.delete(fn); }; }
function setOpened(o: boolean) { if (o === isOpen) return; isOpen = o; subs.forEach((f) => f(o)); }

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, z: number) => clamp((p - a) / (z - a));
/** Minimum jerk: rest to rest, no step in acceleration (motion-design). */
const mj = (t: number) => t * t * t * (t * (6 * t - 15) + 10);
const lerp = (a: number, z: number, t: number) => a + (z - a) * t;
const calm = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const px = (v: number) => `${Math.round(v * 100) / 100}px`;
const cssPx = (el: Element, name: string) => parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;

/* ───────────────────────── The AI's two bookmarks ───────────────────────── */

/** Two ribbon bookmarks, each ending in a round paper charm with the mark of the AI that works in
 *  these pages: ChatGPT's knot on ink, Claude's spark on its terracotta. */
function Ribbons({ className = "" }: { className?: string }) {
  return (
    <div className={`${b.ribbons} ${className}`} data-ribbons aria-hidden="true">
      <span className={b.ribbon} data-ai="gpt"><span className={b.charm}><AIGlyph name="openai" size={24} color="#fff4e6" /></span></span>
      <span className={b.ribbon} data-ai="claude"><span className={b.charm}><AIGlyph name="claude" size={24} color="#fff4e6" /></span></span>
    </div>
  );
}

const LABEL = "A closed notebook with four coloured tabs, Notes, Whiteboards, Apps and Your AI, and two bookmarks in it marked ChatGPT and Claude.";

/* ───────────────────────── Hero 1: the closed binder beside the headline ───────────────────────── */

function HeroObject({ children, page }: { children: React.ReactNode; page?: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = root.current; if (!el) return;
    const stack = el.closest<HTMLElement>("[data-stack]");
    const text = el.querySelector<HTMLElement>("[data-text]")!;
    const desk = el.querySelector<HTMLElement>("[data-desk]")!;
    const bd = el.querySelector<HTMLElement>("[data-bd]")!;
    const red = el.querySelector<HTMLElement>("[data-red]")!;
    const redTab = el.querySelector<HTMLElement>("[data-red] [data-tab]")!;
    const under = el.querySelector<HTMLElement>("[data-under]")!;
    const cover = el.querySelector<HTMLElement>("[data-cover]")!;
    const spine = el.querySelector<HTMLElement>("[data-spine]")!;
    const ribbons = el.querySelector<HTMLElement>("[data-ribbons]")!;
    const shades = [...el.querySelectorAll<HTMLElement>("[data-shade]")];
    const faces = [...el.querySelectorAll<HTMLElement>("[data-face]")];
    const mini = el.querySelector<HTMLElement>("[data-mini]");
    const stage = el.querySelector<HTMLElement>("[data-stage]")!;
    const reduced = calm();
    let vw = 0, vh = 0, tt = 0, pad = 0, range = 1, raf = 0;
    // The binder's resting geometry, in its own box (bd), measured without any of the moves applied.
    let chH = 0, bx = 0, by = 0, rx = 0, ry = 0, rw = 0, rh = 0, tabX = 0, tabY = 0, kt = 1, tearH = 42, tabDock = -30;

    const measure = () => {
      vw = document.documentElement.clientWidth; vh = innerHeight;
      const host = stack ?? el;
      const hh = cssPx(host, "--hh") || 72, tabH = cssPx(host, "--tabH") || 34;
      tt = hh + tabH; tabDock = 4 - tabH;
      pad = text.offsetLeft;
      tearH = cssPx(host, "--tearH") || 42;
      // The opening runs until Notes docks: the section's flow (its height and its negative margin)
      // ends --tt past it, so this is exactly the scroll at which the real chapter is in place.
      range = Math.max(1, el.offsetHeight + (parseFloat(getComputedStyle(el).marginBottom) || 0) - tt);
      chH = Math.max(stage.offsetHeight - tt, 560);
      if (mini) { mini.style.width = `${vw}px`; mini.style.height = `${chH}px`; }
      bx = bd.offsetLeft; by = bd.offsetTop;
      rx = red.offsetLeft; ry = red.offsetTop; rw = red.offsetWidth; rh = red.offsetHeight;
      tabX = redTab.offsetLeft; tabY = redTab.offsetTop;
      kt = parseFloat(getComputedStyle(bd).getPropertyValue("--kt")) || 0.86;
    };

    const frame = () => {
      raf = 0;
      const p = clamp(-el.getBoundingClientRect().top / range);
      const open = p >= 0.999;
      setOpened(open);
      stack?.toggleAttribute("data-shut", !open);
      el.toggleAttribute("data-open", open);
      // 1. The words leave first, up and out; the desk's sprig and pen and the bookmarks go with them.
      const tp = mj(seg(p, 0, 0.22));
      text.style.opacity = (1 - tp).toFixed(3);
      text.style.transform = tp ? `translateY(${px(-48 * tp)})` : "";
      const dp = seg(p, 0, 0.2);
      desk.style.opacity = (1 - dp).toFixed(3);
      ribbons.style.opacity = (1 - dp).toFixed(3);
      ribbons.style.transform = dp ? `translateY(${px(16 * dp)})` : "";
      // 2. The cover turns over onto the left, and the book slides to the middle as it opens.
      const a = mj(seg(p, 0.03, 0.46));
      const spineX0 = bx + rx;
      const shift = reduced ? 0 : (vw / 2 - spineX0) * a;
      // 3. The red divider grows to fill the screen; its tab flies to where the Notes tab docks.
      const g = mj(seg(p, 0.5, 1));
      const L0 = rx + shift, L1 = -bx, T1 = tt - by;
      const W1 = vw, H1 = chH;
      const L = lerp(L0, L1, g), T = lerp(ry, T1, g), W = lerp(rw, W1, g), H = lerp(rh, H1, g);
      if (reduced) {
        // Reduce Motion: the binder fades out and the red page fades in, full size, in place.
        const f = seg(p, 0.35, 0.9);
        red.style.cssText = f ? `left:${px(L1)};top:${px(T1)};width:${px(W1)};height:${px(H1)};opacity:${f.toFixed(3)};--k:1` : "";
        redTab.style.transform = f ? `translate(${px(pad - tabX)},${px(tabDock - tabY)}) scale(${(1 / kt).toFixed(4)})` : "";
        if (mini) mini.style.transform = "";
        cover.style.opacity = spine.style.opacity = under.style.opacity = (1 - seg(p, 0.1, 0.5)).toFixed(3);
        return;
      }
      const k = W / vw;
      red.style.cssText = (shift || g ? `left:${px(L)};top:${px(T)};width:${px(W)};height:${px(H)};` : "") + `--k:${k.toFixed(4)}`;
      // Notes' own page, still, scaled to the divider and centred on it, reaching its real place at 1.
      // Where the divider is taller for its width than the screen (a phone), the page sits at its top
      // and is clipped at its foot, so it never spills over the tabs or out of the binder.
      if (mini) {
        mini.style.transform = `translateY(${px(Math.max(0, (H - chH * k) / 2))}) scale(${k.toFixed(4)})`;
        const over = chH - H / k;
        mini.style.clipPath = over > 0.5 ? `inset(0 0 ${px(over)} 0)` : "";
      }
      // The tab: from its slot on the binder (at kt of its docked size) to the docked Notes tab.
      if (g) {
        const ts = lerp(1, 1 / kt, g);
        const tx = lerp(tabX, pad, g) - tabX; // the page's own left edge reaches the screen's at g = 1
        const ty = lerp(tabY, tabDock, g) - tabY;
        redTab.style.transform = `translate(${px(tx)},${px(ty)}) scale(${ts.toFixed(4)})`;
      } else redTab.style.transform = "";
      // The other dividers (behind it) and the spine move with the book, and go as the page grows.
      under.style.transform = shift ? `translateX(${px(shift)})` : "";
      under.style.opacity = (1 - seg(p, 0.5, 0.72)).toFixed(3);
      spine.style.opacity = (1 - seg(p, 0.55, 0.8)).toFixed(3);
      // The cover hangs on the spine (the red page's left edge) all the way: turned, then carried
      // off to the left as the page grows, at the page's scale.
      const sc = H / rh;
      const dx = L - (rx), dy = T - ry + (H - rh) / 2;
      cover.style.transform = a || g ? `translate(${px(dx)},${px(dy)}) scale(${sc.toFixed(4)}) rotateY(${(-180 * a).toFixed(2)}deg)` : "";
      spine.style.transform = shift || g ? `translate(${px(dx)},${px(dy)}) scale(${sc.toFixed(4)})` : "";
      // (Faded face by face: opacity on the turning element itself would flatten it, and its outside
      // would show through, mirrored.)
      const fo = (1 - seg(p, 0.6, 0.85)).toFixed(3);
      faces.forEach((f) => { f.style.opacity = fo; });
      // Light: the cover darkens as it stands up off the page and lightens as it lies down again.
      const lift = Math.sin(Math.PI * a);
      shades.forEach((sh) => { sh.style.opacity = (0.22 * lift).toFixed(3); });
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const resize = () => {
      // Measure at rest: clear the moves, read the boxes, then put the frame back.
      for (const n of [red, redTab, cover, spine, under, text, ...(mini ? [mini] : [])]) n.style.transform = "";
      red.style.cssText = "";
      measure(); frame();
    };
    resize();
    addEventListener("scroll", ask, { passive: true });
    addEventListener("resize", resize);
    document.fonts?.ready.then(resize);
    return () => {
      removeEventListener("scroll", ask); removeEventListener("resize", resize); cancelAnimationFrame(raf);
      stack?.removeAttribute("data-shut"); setOpened(false);
    };
  }, []);

  return (
    <section ref={root} data-hero className={`${b.hero} ${b.hv1}`} aria-labelledby="s-h1">
      <div className={b.stage} data-stage>
        <div className={b.text} data-text>{children}</div>
        <div className={b.bd} data-bd role="img" aria-label={LABEL}>
          <div className={b.desk} data-desk aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={b.sprig} src="/lab/binder/sprig-v1.webp" alt="" width={721} height={805} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={b.pen} src="/lab/binder/pen-v2.webp" alt="" width={723} height={803} />
          </div>
          {/* The dividers behind Notes, with their tabs along the top edge. */}
          <div className={b.under} data-under aria-hidden="true">
            {DIV.slice(1).reverse().map((d) => <i key={d.tone} className={b.page} data-tone={d.tone} />)}
            <div className={b.tabs}>
              {DIV.map((d) => <span key={d.tone} className={b.tab} data-tone={d.tone} data-slot={d.tone === "write" || undefined}>{d.tab}</span>)}
            </div>
          </div>
          {/* Notes, the first divider: the page that grows into the Notes chapter. */}
          <div className={b.red} data-red aria-hidden="true">
            <div className={s.paper}><i className={s.rim} /><i className={s.sheetBg} /></div>
            {page && <div className={`${s.write} ${b.mini}`} data-mini inert><div className={s.body}>{page}</div></div>}
            <span className={b.tab} data-tone="write" data-tab>Notes</span>
          </div>
          <Ribbons />
          <i className={b.spine} data-spine aria-hidden="true" />
          {/* The cover: its outside (the art) and its inside (the endpaper), turned on the spine. */}
          <div className={b.cover} data-cover aria-hidden="true">
            <div className={b.front} data-face>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/lab/binder/cover-v1.webp" alt="" width={1000} height={1390} fetchPriority="high" />
              <i className={b.shade} data-shade />
            </div>
            <div className={b.back} data-face><i className={b.shade} data-shade /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Hero 2: the first screen is the cover ───────────────────────── */

function HeroCover({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = root.current; if (!el) return;
    const stack = el.closest<HTMLElement>("[data-stack]");
    const stage = el.querySelector<HTMLElement>("[data-stage]")!;
    const cover = el.querySelector<HTMLElement>("[data-cover]")!;
    const shade = el.querySelector<HTMLElement>("[data-shade]")!;
    const tabs = el.querySelector<HTMLElement>("[data-tabs]")!;
    const reduced = calm();
    let range = 1, raf = 0;
    const frame = () => {
      raf = 0;
      const p = clamp(scrollY / range);
      const open = p >= 0.999;
      setOpened(open);
      stage.toggleAttribute("data-gone", open);
      // The dividers behind Notes sink under its page as the cover starts to move.
      const sink = mj(seg(p, 0, 0.3));
      tabs.style.setProperty("--sink", sink.toFixed(3));
      if (reduced) { cover.style.opacity = (1 - seg(p, 0.05, 0.7)).toFixed(3); return; }
      // The cover swings away on its spine (the left edge), and the real Notes page is under it.
      const a = mj(seg(p, 0.02, 0.9));
      // Hinged at the left edge and seen along it (the projection's centre is the hinge), so at 90
      // degrees it's edge-on and gone; it fades over the last stretch so it never ends as a sliver.
      cover.style.transform = a ? `perspective(1500px) rotateY(${(90 * a).toFixed(2)}deg)` : "";
      cover.style.opacity = (1 - seg(a, 0.78, 0.97)).toFixed(3);
      shade.style.opacity = (0.42 * Math.sin((Math.PI / 2) * a)).toFixed(3);
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const resize = () => { range = Math.max(1, OPEN["2"] * innerHeight); frame(); };
    resize();
    addEventListener("scroll", ask, { passive: true });
    addEventListener("resize", resize);
    return () => { removeEventListener("scroll", ask); removeEventListener("resize", resize); cancelAnimationFrame(raf); setOpened(false); void stack; };
  }, []);

  return (
    <section ref={root} data-hero className={`${b.hero} ${b.hv2}`} aria-labelledby="s-h1">
      <div className={b.stage2} data-stage>
        {/* The tabs of the dividers behind Notes, where they dock. Notes' own is the real chapter's. */}
        <div className={b.tabs2} data-tabs aria-hidden="true">
          {DIV.map((d) => <span key={d.tone} className={b.tab2} data-tone={d.tone} data-slot={d.tone === "write" || undefined}>{d.tab}</span>)}
        </div>
        <div className={b.cover2} data-cover>
          <i className={b.c2spine} aria-hidden="true" />
          <i className={b.c2band} aria-hidden="true" />
          <div className={b.text2}>{children}</div>
          <Ribbons className={b.r2} />
          <i className={b.c2shade} data-shade aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

export function BinderHero({ v, children, page }: { v: HeroV; children: React.ReactNode; page?: React.ReactNode }) {
  return v === "2" ? <HeroCover>{children}</HeroCover> : <HeroObject page={page}>{children}</HeroObject>;
}

/* ───────────────────────── Close 1: the cover swings shut ───────────────────────── */

export function CloseCover({ cta }: { cta: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = root.current; if (!el) return;
    const stack = el.closest<HTMLElement>("[data-stack]");
    const face = el.querySelector<HTMLElement>("[data-face]")!;
    const shade = el.querySelector<HTMLElement>("[data-shade]")!;
    const reduced = calm();
    let raf = 0;
    const frame = () => {
      raf = 0;
      const vh = innerHeight, host = stack ?? el, tt = (cssPx(host, "--hh") || 72) + (cssPx(host, "--tabH") || 34);
      const nt = el.getBoundingClientRect().top;
      // How far the cover has come, from the foot of the screen to docked under the tabs. Its face is
      // held under the tabs the whole way (the section's box is what scrolls), and turns shut on its
      // spine over the first 80% of that.
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
    // The footer's torn edge sits on the cover at the page's end: the footer is pulled up over the
    // cover by its own height (binder.module.css), so the cover stays docked under the tabs.
    const resize = () => {
      const foot = document.querySelector<HTMLElement>(".site-footer");
      if (stack && foot) stack.style.setProperty("--footH", `${foot.offsetHeight}px`);
      if (foot) document.documentElement.style.setProperty("--binderFootH", `${foot.offsetHeight}px`);
      frame();
    };
    resize();
    // The footer's height can change after the fonts load or its links wrap; keep the overlap exact.
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
        <i className={b.c2spine} aria-hidden="true" />
        <i className={b.c2band} aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={b.leaf} src="/lab/binder/leaf-v1.webp" alt="" width={894} height={1102} loading="lazy" />
        <div data-body className={b.closeBody}>
          <div className={b.closeText}>
            <h2 id="s-free-h" className={b.closeTitle}>Pinto Notes<br />is free.</h2>
            <div className={b.closeCtas}>{cta}</div>
            <p className={b.closeReq}>Requires macOS 26 or iOS 26.</p>
          </div>
        </div>
        <i className={b.c2shade} data-shade aria-hidden="true" />
      </div>
    </section>
  );
}
