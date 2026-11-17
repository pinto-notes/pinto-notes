"use client";

import { useEffect, useRef } from "react";

// The page's small "shows" (the app being built, ChatGPT's three changes, the sync moment, the hero
// being written) are pure functions of time: `apply(t)` draws the frame for t seconds in. The clock
// starts when the chapter docks and runs on the frame clock. Scrolling through the chapter's stay can
// only push it forward (t = max(t + dt, stay × end)), so the scroll never feels stuck and never
// rewinds a show. `?<name>=<s>` freezes a show at a time (for stills); `?t` or Reduce Motion show its end.

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** How far t is through [a, b], 0 to 1. */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
/** Minimum jerk: rest to rest, the ease everything that travels uses. */
export const mj = (k: number) => { const t = clamp01(k); return t * t * t * (10 - 15 * t + 6 * t * t); };
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export type Pt = [number, number];
export const mix = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

export function frozenAt(name: string): number | null {
  if (typeof location === "undefined") return null;
  const q = new URLSearchParams(location.search);
  const v = q.get(name);
  if (v !== null) return Number.isFinite(parseFloat(v)) ? parseFloat(v) : Infinity;
  if (q.has("t")) return Infinity;
  if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return Infinity;
  return null;
}

type Sub = (fn: (dwell: number, arrive: number) => void) => () => void;

/** Runs a show. `subscribe` reports the chapter's stay; without it the show starts on mount. */
export function useShow({ name, end, subscribe, apply }: { name: string; end: number; subscribe?: Sub; apply: (t: number) => void }) {
  const ref = useRef(apply);
  ref.current = apply;
  useEffect(() => {
    let t = 0, last = 0, raf = 0, started = false, pushed = 0;
    const draw = () => ref.current(t);
    const fz = frozenAt(name);
    const onResize = () => draw();
    addEventListener("resize", onResize);
    document.fonts?.ready.then(draw);
    if (fz !== null) {
      t = Math.min(fz, end);
      draw();
      return () => removeEventListener("resize", onResize);
    }
    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      t = Math.min(end, Math.max(t + dt, pushed));
      draw();
      if (t < end) raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!started) { started = true; raf = requestAnimationFrame(frame); } };
    draw();
    const off = subscribe
      ? subscribe((dwell, arrive) => {
          if (arrive >= 0.995 || dwell > 0) start();
          if (dwell > 0) pushed = Math.max(pushed, dwell * end);
          if (started && t < end && !raf) raf = requestAnimationFrame(frame);
        })
      : (start(), () => {});
    return () => { off(); cancelAnimationFrame(raf); removeEventListener("resize", onResize); };
  }, [name, end, subscribe]);
}

/** Where an element sits inside `box`, as a point: fx, fy are fractions of its own size. */
export function at(box: DOMRect, el: Element | null | undefined, fx = 0, fy = 0.5): Pt | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return [r.left - box.left + r.width * fx, r.top - box.top + r.height * fy];
}

/** A point along an SVG path (0 to 1 of its length), inside `box`. */
export function along(box: DOMRect, p: SVGPathElement | null | undefined, k: number): Pt | null {
  if (!p) return null;
  const len = p.getTotalLength(), q = p.getPointAtLength(len * clamp01(k)), m = p.getScreenCTM();
  if (!m) return null;
  return [m.a * q.x + m.c * q.y + m.e - box.left, m.b * q.x + m.d * q.y + m.f - box.top];
}

/** Puts a named cursor at a point (its arrow's tip), with an opacity. */
export function place(el: HTMLElement | null, p: Pt | null, o: number) {
  if (!el) return;
  if (p) el.style.transform = `translate3d(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px, 0)`;
  el.style.opacity = String(p ? clamp01(o) : 0);
}
