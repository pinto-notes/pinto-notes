"use client";

import { useRef, useState } from "react";
import { at, mix, mj, place, seg, useShow, type Pt } from "./show";
import { ADDED, DECIDED, Flag, GPT, Receipt, TITLE, Typed } from "./Things";
import s from "./s.module.css";

// The first screen's picture: one note on the desk, written by two authors. You type the decision;
// then ChatGPT's line lands under it, marked, with Undo. The note is the only object on the still life
// (the whiteboard and the app get their own chapters).

const LEN = "Decided: ".length + DECIDED.length;
const ONE = { type: [0.35, 2.15] as [number, number], gptIn: 2.45, ride: [2.6, 3.1] as [number, number], land: 2.6, rec: 3.2, gptOut: [3.9, 4.3] as [number, number], end: 4.4 };

export function HeroOne() {
  const box = useRef<HTMLDivElement>(null), gpt = useRef<HTMLSpanElement>(null);
  const [st, setSt] = useState({ n: 0, land: false, rec: false });
  const [undone, setUndone] = useState(false);
  useShow({
    name: "one", end: ONE.end,
    apply: (t) => {
      const el = box.current; if (!el) return;
      const next = { n: Math.round(seg(t, ...ONE.type) * LEN), land: t >= ONE.land, rec: t >= ONE.rec };
      setSt((o) => (o.n === next.n && o.land === next.land && o.rec === next.rec ? o : next));
      const B = el.getBoundingClientRect();
      const slot = el.querySelector("[data-at=one]");
      const s0 = at(B, slot, 0, 0.74), s1 = at(B, slot, 1, 0.74);
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
        <p className={s.oneTitle}>{TITLE}</p>
        <p className={s.oneWeigh}><b>For:</b> a bigger role, a team to learn from.<br /><b>Against:</b> the launch is six weeks out.</p>
        <p className={s.oneDecided} data-write data-done={st.n >= LEN || undefined}><Typed text={DECIDED} n={st.n} /></p>
        <ul className={s.hRows}>
          <li className={s.hAdded} data-in={st.land || undefined} data-undone={undone || undefined}><i /><span data-at="one"><b className={s.mark} />{ADDED}</span></li>
        </ul>
        <div className={s.oneRec} data-in={st.rec || undefined}><Receipt undone={undone} onFlip={() => setUndone((u) => !u)} live={st.rec} /></div>
      </div>
      <span ref={gpt} className={s.cur} aria-hidden="true"><Flag name="ChatGPT" color={GPT} /></span>
    </div>
  );
}
