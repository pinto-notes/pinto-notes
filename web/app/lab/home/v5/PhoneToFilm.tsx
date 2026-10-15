"use client";

import { useEffect, useRef, useState } from "react";
import o from "./phonetofilm.module.css";

// The hand-off from the hero to the week film. Her actual phone note (a copy of its markup, so it looks
// exactly the same) leaves the phone and grows into the film's note window. On the way, the phone note's
// content fades out and the film's empty "Running plan" fades in, one after the other, inside the same
// moving card; it lands exactly on the film's own note. Wide screens only.

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const mj = (v: number) => { const t = clamp(v); return t * t * t * (10 - 15 * t + 6 * t * t); };
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Rect = { x: number; y: number; w: number; h: number };
type State = { k: number; ph: Rect; fm: Rect };
type Snap = { phone: string; phoneClass: string; shoulder: string; pw: number; ph: number; film: string; fw: number; fh: number };

export function PhoneToFilm() {
  const [st, setSt] = useState<State | null>(null);
  const snap = useRef<Snap | null>(null);
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
      const q = clamp((scrollY - 20) / Math.max(1, end - 20));
      const a = pe.getBoundingClientRect(), b = ff.getBoundingClientRect();
      // Take the copies while nothing has moved yet.
      if (!snap.current || q === 0) {
        snap.current = { phone: (pe.firstElementChild?.outerHTML ?? "").replace(/visibility: hidden;?/g, ""), phoneClass: pe.className,
          shoulder: [...(pe.closest('[class*="shoulder"]')?.classList ?? [])].find((c) => c.includes("shoulder")) ?? "", pw: pe.offsetWidth || a.width, ph: pe.offsetHeight || a.height,
          film: ff.outerHTML, fw: ff.offsetWidth, fh: ff.offsetHeight };
      }
      (ff.parentElement as HTMLElement).style.opacity = q >= 1 ? "" : "0";
      // The phone keeps its blank screen; only its note leaves.
      (pe.firstElementChild as HTMLElement | null)?.style.setProperty("visibility", q > 0 ? "hidden" : "visible");
      pe.toggleAttribute("data-away", q > 0);
      root.toggleAttribute("data-note-flying", q < 1);
      setSt(q > 0 && q < 1 ? { k: mj(q), ph: { x: a.left, y: a.top, w: a.width, h: a.height }, fm: { x: b.left, y: b.top, w: b.width, h: b.height } } : null);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    const t = setTimeout(read, 250);
    addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => {
      clearTimeout(t); removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf);
      root.removeAttribute("data-note-flying");
      const ff = filmFig(); if (ff?.parentElement) ff.parentElement.style.opacity = "";
      (phoneEl()?.firstElementChild as HTMLElement | null)?.style.removeProperty("visibility");
    };
  }, []);
  const sn = snap.current;
  if (!st || !sn) return null;

  const { k, ph, fm } = st;
  const box = { left: lerp(ph.x, fm.x, k), top: lerp(ph.y, fm.y, k), width: lerp(ph.w, fm.w, k), height: lerp(ph.h, fm.h, k) };
  // One after the other: her note's content leaves, then the running plan arrives.
  const phoneO = 1 - mj(span(k, 0.03, 0.22));
  const filmO = mj(span(k, 0.24, 0.55));
  const sp = box.width / sn.pw;
  const startR = (ph.w / sn.pw) * sn.pw * 0.11, endR = 16 * (fm.w / sn.fw);
  return (
    <div className={o.fly} style={{ ...box, borderRadius: lerp(startR, endR, k),
      boxShadow: `0 0 0 0.5px rgba(60,30,5,${(0.22 * k).toFixed(2)}), 0 ${(30 * k).toFixed(0)}px ${(70 * k).toFixed(0)}px -34px rgba(60,30,5,${(0.5 * k).toFixed(2)})` }} aria-hidden="true">
      {/* Inside her scene's class, so the phone note's own sizing rules (relative to the screen) apply. */}
      <div className={`${sn.shoulder} ${o.scope}`}>
        <div className={`${sn.phoneClass} ${o.copy}`} style={{ width: sn.pw, height: sn.ph, transform: `scale(${sp.toFixed(5)})`, opacity: phoneO }}
          dangerouslySetInnerHTML={{ __html: sn.phone }} />
      </div>
      <div className={o.copy} style={{ width: sn.fw, height: sn.fh, transform: `scale(${(box.width / sn.fw).toFixed(5)}, ${(box.height / sn.fh).toFixed(5)})`, opacity: filmO }}
        dangerouslySetInnerHTML={{ __html: sn.film }} />
    </div>
  );
}
