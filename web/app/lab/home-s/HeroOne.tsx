"use client";

import { useRef, useState } from "react";
import { at, mj, mix, place, seg, useShow, type Pt } from "./show";
import { ADDED, DECIDED, Flag, GPT, Receipt, Tick } from "./Things";
import s from "./s.module.css";

// The first screen's picture: one page, written by two hands. Your hand comes in from the bottom
// right, its forearm running off the edge of the collage, and writes the decision; then ChatGPT's
// line lands under it, marked, with Undo. The note is the only object on the collage (the whiteboard
// and the app get their own chapters).
//
// The hand is one cut-out (hand-print-v1.webp), mirrored and turned about its pencil tip. How far it
// turns and where it rests after writing are CSS custom properties on `.onePen`
// (--pen-turn, --pen-w, --pen-rest), so each window size poses it without touching this code. The
// pose keeps the cut end of the forearm below or beyond the collage's edge wherever the tip is on the
// line, so the arm always comes in from outside the picture.

const IN = [0.1, 0.6] as [number, number];
const W = [0.65, 2.35] as [number, number];
const REST = [2.4, 2.9] as [number, number];
const ONE = { land: 2.85, ride: [2.85, 3.35] as [number, number], rec: 3.4, gptIn: 2.55, gptOut: [4.1, 4.5] as [number, number], end: 4.6 };

/** The cut-out's pencil tip, as fractions of its width and height, once mirrored. */
const TIP: Pt = [0.208, 0.975];

export function HeroOne() {
  const box = useRef<HTMLDivElement>(null), pen = useRef<HTMLImageElement>(null), gpt = useRef<HTMLSpanElement>(null);
  const [st, setSt] = useState({ land: false, rec: false });
  const [undone, setUndone] = useState(false);
  useShow({
    name: "one", end: ONE.end,
    apply: (t) => {
      const el = box.current; if (!el) return;
      const B = el.getBoundingClientRect();
      const line = el.querySelector<HTMLElement>("[data-write]");
      const k = mj(seg(t, ...W)) * 0.9 + seg(t, ...W) * 0.1;
      line?.style.setProperty("--w", k.toFixed(4));
      const a = at(B, line, 0, 0.86), b = at(B, line, 1, 0.86);
      const h = pen.current;
      if (h && a && b) {
        const cs = getComputedStyle(h);
        const turn = parseFloat(cs.getPropertyValue("--pen-turn")) || 100;
        // Where the tip rests after writing, as fractions of the note card (none: on the line's end).
        const rest = cs.getPropertyValue("--pen-rest").trim().split(/\s+/).map(parseFloat);
        const card = el.querySelector<HTMLElement>("[data-card]")?.getBoundingClientRect();
        const wob = k > 0 && k < 1 ? Math.sin(t * 34) * 1.6 : 0;
        let tip: Pt = [a[0] + (b[0] - a[0]) * k + 3, a[1] + wob];
        // In: from below and to the right, along the forearm, so the arm never shows its end.
        // The forearm points 30° anticlockwise of the turn (the cut-out's own geometry).
        const r = ((turn - 30) * Math.PI) / 180, arm: Pt = [Math.cos(r), Math.sin(r)];
        const inK = 1 - mj(seg(t, ...IN));
        if (inK > 0) tip = [tip[0] + arm[0] * 260 * inK, tip[1] + arm[1] * 260 * inK];
        // After writing, the hand lifts off the line and rests, so ChatGPT's line lands clear of it.
        const rk = mj(seg(t, ...REST));
        if (rk > 0 && card && rest.length === 2 && rest.every(Number.isFinite)) {
          tip = mix(tip, [card.left - B.left + card.width * rest[0], card.top - B.top + card.height * rest[1]], rk);
        }
        const w = h.offsetWidth, hh = h.offsetHeight;
        h.style.transform = `translate3d(${tip[0].toFixed(1)}px, ${tip[1].toFixed(1)}px, 0) rotate(${turn}deg) translate(${(-TIP[0] * w).toFixed(1)}px, ${(-TIP[1] * hh).toFixed(1)}px) translate(${w}px, 0) scaleX(-1)`;
        h.style.opacity = t < IN[0] ? "0" : "1";
      }
      const next = { land: t >= ONE.land, rec: t >= ONE.rec };
      setSt((o) => (o.land === next.land && o.rec === next.rec ? o : next));
      const s0 = at(B, el.querySelector("[data-at=one]"), 0, 0.74), s1 = at(B, el.querySelector("[data-at=one]"), 1, 0.74);
      let g: Pt | null = s0, o = 0;
      if (t >= ONE.gptIn && t < ONE.ride[0]) o = seg(t, ONE.gptIn, ONE.gptIn + 0.15);
      else if (t >= ONE.ride[0] && t < ONE.gptOut[0]) { g = s0 && s1 && mix(s0, s1, mj(seg(t, ...ONE.ride))); o = 1; }
      else if (t >= ONE.gptOut[0]) { const q = seg(t, ...ONE.gptOut); g = s1 && [s1[0] + 16 * q, s1[1] + 8 * q]; o = 1 - q; }
      place(gpt.current, g, o);
    },
  });
  return (
    <div ref={box} className={s.oneBox}>
      <div className={s.oneNote} data-card>
        <p className={s.hNoteDate}>Today at 09:41</p>
        <p className={s.oneTitle}>Lisbon, May 8–12</p>
        <ul className={s.hRows}>
          <li data-on><i><Tick /></i><span>Book the flights</span></li>
          <li><i /><span>Find a flat in Alfama</span></li>
        </ul>
        <p className={s.oneDecided}><span data-write className={s.oneWrite}><b>Decided:</b> {DECIDED}</span></p>
        <ul className={s.hRows}>
          <li className={s.hAdded} data-in={st.land || undefined} data-undone={undone || undefined}><i /><span data-at="one"><b className={s.mark} />{ADDED}</span></li>
        </ul>
        <div className={s.oneRec} data-in={st.rec || undefined}><Receipt undone={undone} onFlip={() => setUndone((u) => !u)} live={st.rec} /></div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={pen} className={s.onePen} src="/lab/s/hand-print-v1.webp" alt="" width="840" height="560" fetchPriority="high" />
      <span ref={gpt} className={s.cur} aria-hidden="true"><Flag name="ChatGPT" color={GPT} /></span>
    </div>
  );
}
