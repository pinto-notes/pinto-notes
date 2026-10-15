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

const OLD = ["Pick up the dry cleaning", "Run, 5 km", "Call the dentist", "Book Lisbon flights"];
const OLD_TITLE = "Tomorrow", NEW_TITLE = "Running plan";
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
      const flying = q > 0 && q < 1;
      wrap.style.opacity = q >= 1 ? "" : "0";
      (pe.firstElementChild as HTMLElement | null)?.style.setProperty("visibility", q > 0 ? "hidden" : "");
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
      (phoneEl()?.firstElementChild as HTMLElement | null)?.style.removeProperty("visibility");
    };
  }, []);
  if (!st) return null;

  const { q, ph, fm, s } = st;
  // 1. A new note on the phone (q 0 .. 0.22).
  const clear = mj(span(q, 0, 0.07));
  const back = span(q, 0, 0.06), type = span(q, 0.07, 0.18);
  const title = q < 0.065 ? OLD_TITLE.slice(0, Math.round(OLD_TITLE.length * (1 - back))) : NEW_TITLE.slice(0, Math.round(NEW_TITLE.length * type));
  const fresh = mj(span(q, 0.15, 0.22));
  // 2. The lift (q 0.24 .. 1): position, size, and every measure from the phone's to the film's.
  const k = mj(span(q, 0.24, 1));
  const pw = ph.w;
  const L = (phone: number, film: number) => lerp(phone, film * s, k);
  const box = { left: lerp(ph.x, fm.x, k), top: lerp(ph.y, fm.y, k), width: lerp(ph.w, fm.w, k), height: lerp(ph.h, fm.h, k) };
  const radius = L(pw * 0.11, 16);
  const barH = L(0, 40);
  return (
    <div className={o.fly} style={{ ...box, borderRadius: radius, boxShadow: `0 0 0 0.5px rgba(60,30,5,${(0.22 * k).toFixed(2)}), 0 ${(30 * k).toFixed(0)}px ${(70 * k).toFixed(0)}px -34px rgba(60,30,5,${(0.5 * k).toFixed(2)})` }} aria-hidden="true">
      <div className={o.bar} style={{ height: barH, opacity: mj(span(k, 0.4, 1)), padding: `0 ${L(0, 16)}px` }}>
        <span className={o.lights} style={{ gap: L(0, 8) }}>{[0, 1, 2].map((i) => <i key={i} style={{ width: L(0, 12), height: L(0, 12) }} />)}</span>
        <span className={o.folder} style={{ fontSize: L(pw * 0.03, 12.5) }}>Health</span>
      </div>
      <div className={o.paper} style={{ padding: `${L(pw * 0.06, 22)}px ${L(pw * 0.06, 28)}px ${L(pw * 0.05, 30)}px ${L(pw * 0.06, 32)}px` }}>
        <p className={o.status} style={{ fontSize: pw * 0.044, height: L(pw * 0.1, 0), opacity: 1 - k }}><b>21:40</b></p>
        <p className={o.back} style={{ fontSize: pw * 0.046, height: L(pw * 0.07, 0), opacity: 1 - k }}>‹ My notebook</p>
        <h3 className={o.title} style={{ fontSize: L(pw * 0.09, 32), marginBottom: L(pw * 0.02, 6) }}>{title}{q < 0.2 && <i className={o.caret} />}</h3>
        <p className={o.sub} style={{ fontSize: L(pw * 0.04, 16), marginBottom: L(pw * 0.04, 16), opacity: fresh }}>Half marathon on 30 November. Four runs a week.</p>
        <div className={o.rows}>
          {OLD.map((t) => <p key={t} className={o.old} style={{ fontSize: pw * 0.047, opacity: 1 - clear, height: (1 - clear) * pw * 0.11 }}>{t}</p>)}
          {GHOSTS.map((g, i) => (
            <div key={i} className={o.row} style={{ height: L(pw * 0.1, 50), opacity: fresh }}>
              <span className={o.ghost} style={{ left: L(pw * 0.02, 34) - L(pw * 0.06, 32) + L(pw * 0.06, 32), width: `${g}%`, height: L(pw * 0.025, 10), borderRadius: L(pw * 0.0125, 5) }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
