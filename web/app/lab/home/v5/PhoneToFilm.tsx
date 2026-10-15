"use client";

import { useEffect, useState } from "react";
import o from "./phonetofilm.module.css";

// The hand-off from the hero to the week film: on her phone she starts a new note (the old one clears,
// the title "Running plan" is typed), then that empty note lifts off the phone and grows into the film's
// own empty note window, landing exactly on it. Both ends are the same empty note, so nothing has to
// cross-fade. Until it lands, the film's stage keeps quiet (no chats, caption or day strip).
// Wide screens only; phones and Reduce Motion keep the still hero and the film.

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const mj = (v: number) => { const t = clamp(v); return t * t * t * (10 - 15 * t + 6 * t * t); };
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const GHOSTS = [52, 66, 48, 58];

type Rect = { x: number; y: number; w: number; h: number };
type State = { q: number; ph: Rect; fm: Rect; s: number };

export function PhoneToFilm() {
  const [st, setSt] = useState<State | null>(null);
  useEffect(() => {
    if (!matchMedia("(min-width: 901px)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    let raf = 0;
    const phoneEl = () => document.querySelector('[aria-label^="Her Tomorrow note"]') as HTMLElement | null;
    const filmFig = () => document.querySelector('[class*="film_noteWrap"] figure') as HTMLElement | null;
    const read = () => {
      raf = 0;
      const pe = phoneEl(), ff = filmFig(); if (!pe || !ff) return;
      const film = ff.closest('[class*="film_film"]') as HTMLElement | null; if (!film) return;
      const end = film.getBoundingClientRect().top + scrollY - 100;
      const q = clamp((scrollY - 10) / Math.max(1, end - 10));
      const a = pe.getBoundingClientRect(), b = ff.getBoundingClientRect();
      const s = b.width / ff.offsetWidth;
      const wrap = ff.parentElement as HTMLElement;
      const flying = q > 0.05 && q < 1;
      wrap.style.opacity = q >= 1 ? "" : "0";
      // Her phone's note stays as it is until the lift; then it fades to a blank screen under the flying note.
      (pe.firstElementChild as HTMLElement | null)?.style.setProperty("opacity", String(1 - mj(span(q, 0.05, 0.12))));
      root.toggleAttribute("data-note-flying", q < 1);
      setSt(flying ? { q, ph: { x: a.left, y: a.top, w: a.width, h: a.height }, fm: { x: b.left, y: b.top, w: b.width, h: b.height }, s } : null);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    const t = setTimeout(read, 200);
    addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => {
      clearTimeout(t); removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf);
      root.removeAttribute("data-note-flying");
      const ff = filmFig(); if (ff?.parentElement) ff.parentElement.style.opacity = "";
      (phoneEl()?.firstElementChild as HTMLElement | null)?.style.removeProperty("opacity");
    };
  }, []);
  if (!st) return null;

  const { q, ph, fm, s } = st;
  // 1. Nothing happens to her note at first. Then (q 0.28 .. 0.36) it fades to a blank note with a skeleton.
  const appear = mj(span(q, 0.05, 0.12));
  // 2. The blank note lifts and grows into the film's window (q 0.36 .. 1).
  const k = mj(span(q, 0.12, 1));
  // 3. As it lands, the skeleton title becomes the real one.
  const real = mj(span(k, 0.8, 1));
  const pw = ph.w;
  const L = (phone: number, film: number) => lerp(phone, film * s, k);
  const box = { left: lerp(ph.x, fm.x, k), top: lerp(ph.y, fm.y, k), width: lerp(ph.w, fm.w, k), height: lerp(ph.h, fm.h, k) };
  return (
    <div className={o.fly} style={{ ...box, opacity: appear, borderRadius: L(pw * 0.11, 16), boxShadow: `0 0 0 0.5px rgba(60,30,5,${(0.22 * k).toFixed(2)}), 0 ${(30 * k).toFixed(0)}px ${(70 * k).toFixed(0)}px -34px rgba(60,30,5,${(0.5 * k).toFixed(2)})` }} aria-hidden="true">
      <div className={o.bar} style={{ height: L(0, 40), opacity: mj(span(k, 0.4, 1)), padding: `0 ${L(0, 16)}px` }}>
        <span className={o.lights} style={{ gap: L(0, 8) }}>{[0, 1, 2].map((i) => <i key={i} style={{ width: L(0, 12), height: L(0, 12) }} />)}</span>
        <span className={o.folder} style={{ fontSize: L(pw * 0.03, 12.5) }}>Health</span>
      </div>
      <div className={o.paper} style={{ padding: `${L(pw * 0.16, 22)}px ${L(pw * 0.07, 28)}px ${L(pw * 0.05, 30)}px ${L(pw * 0.07, 32)}px` }}>
        <div className={o.head} style={{ height: L(pw * 0.11, 38) + L(pw * 0.06, 22) + L(pw * 0.05, 16) }}>
          <span className={o.skel} style={{ width: "48%", height: L(pw * 0.07, 22), opacity: 1 - real }} />
          <span className={o.skel} style={{ width: "80%", height: L(pw * 0.025, 9), top: L(pw * 0.12, 46), opacity: 1 - real }} />
          <h3 className={o.title} style={{ fontSize: L(pw * 0.09, 32), opacity: real }}>Running plan</h3>
          <p className={o.sub} style={{ fontSize: L(pw * 0.04, 16), top: L(pw * 0.11, 44), opacity: real }}>Half marathon on 30 November. Four runs a week.</p>
        </div>
        <div className={o.rows}>
          {GHOSTS.map((g, i) => (
            <div key={i} className={o.row} style={{ height: L(pw * 0.1, 50) }}>
              <span className={o.ghost} style={{ left: L(0, 34), width: `${g}%`, height: L(pw * 0.025, 10), borderRadius: L(pw * 0.0125, 5) }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
