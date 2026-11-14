"use client";

import { useRef, useState } from "react";
import { at, mj, mix, place, seg, useShow, type Pt } from "./show";
import { ADDED, Flag, GPT, Receipt, Tick } from "./Things";
import s from "./s.module.css";

// `?hero=one`: the first screen as a single picture. One page, written by two hands. Your pencil
// writes the decision; then ChatGPT's line lands under it, marked, with Undo. The note is the only
// object on the collage (the whiteboard and the app get their own chapters).

const W = [0.55, 2.3] as [number, number];
const TURN = 58;
const ONE = { land: 2.75, ride: [2.75, 3.25] as [number, number], rec: 3.3, gptIn: 2.45, gptOut: [4.0, 4.4] as [number, number], end: 4.5 };

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
        const wob = k > 0 && k < 1 ? Math.sin(t * 34) * 1.6 : 0;
        const tip: Pt = [a[0] + (b[0] - a[0]) * k + 3, a[1] + wob];
        const w = h.offsetWidth, hh = h.offsetHeight;
        // The cut-out is mirrored (its pencil tip then sits 21% in from the left, 97.5% down) and
        // turned about the tip, so the hand rests to the right of the pen, over the part of the line
        // not written yet, and never over the title or the rows above.
        h.style.transform = `translate3d(${tip[0].toFixed(1)}px, ${tip[1].toFixed(1)}px, 0) rotate(${TURN}deg) translate(${(-0.208 * w).toFixed(1)}px, ${(-0.975 * hh).toFixed(1)}px) translate(${w}px, 0) scaleX(-1)`;
        h.style.opacity = "1";
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
      <div className={s.oneNote}>
        <p className={s.hNoteDate}>Today at 09:41</p>
        <p className={s.oneTitle}>Lisbon, May 8–12</p>
        <ul className={s.hRows}>
          <li data-on><i><Tick /></i><span>Book the flights</span></li>
          <li><i /><span>Find a flat in Alfama</span></li>
        </ul>
        <p className={s.oneDecided}><span data-write className={s.oneWrite}><b>Decided:</b> No car this time. Trains and trams.</span></p>
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
