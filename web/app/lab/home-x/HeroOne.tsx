"use client";

import { useRef, useState } from "react";
import { at, mj, mix, place, seg, useShow, type Pt } from "./show";
import { ADDED, CALL, CONS, DECIDED, Flag, GPT, PROS, Receipt } from "./Things";
import s from "./s.module.css";

// The first screen's picture: one note, written by two people. You type the decision; then ChatGPT's
// cursor comes in and its line lands under it, marked, with Undo. The note is the only object on the
// green sheet (the whiteboard and the app get their own chapters).

const TYPE = [0.35, 2.1] as [number, number];
const ONE = { gptIn: 2.45, land: 2.75, ride: [2.75, 3.25] as [number, number], rec: 3.3, gptOut: [4.0, 4.4] as [number, number], end: 4.5 };

export function HeroOne() {
  const box = useRef<HTMLDivElement>(null), gpt = useRef<HTMLSpanElement>(null);
  const [st, setSt] = useState({ n: 0, land: false, rec: false });
  const [undone, setUndone] = useState(false);
  useShow({
    name: "one", end: ONE.end,
    apply: (t) => {
      const el = box.current; if (!el) return;
      const B = el.getBoundingClientRect();
      const k = seg(t, ...TYPE);
      el.querySelector<HTMLElement>("[data-write]")?.style.setProperty("--w", k.toFixed(4));
      const next = { n: Math.round(k * DECIDED.length), land: t >= ONE.land, rec: t >= ONE.rec };
      setSt((o) => (o.n === next.n && o.land === next.land && o.rec === next.rec ? o : next));
      const s0 = at(B, el.querySelector("[data-at=one]"), 0, 0.74), s1 = at(B, el.querySelector("[data-at=one]"), 1, 0.74);
      let g: Pt | null = s0, o = 0;
      if (t >= ONE.gptIn && t < ONE.ride[0]) { g = s0 && [s0[0] - 30 * (1 - mj(seg(t, ONE.gptIn, ONE.ride[0]))), s0[1] + 30 * (1 - mj(seg(t, ONE.gptIn, ONE.ride[0])))]; o = seg(t, ONE.gptIn, ONE.gptIn + 0.15); }
      else if (t >= ONE.ride[0] && t < ONE.gptOut[0]) { g = s0 && s1 && mix(s0, s1, mj(seg(t, ...ONE.ride))); o = 1; }
      else if (t >= ONE.gptOut[0]) { const q = seg(t, ...ONE.gptOut); g = s1 && [s1[0] + 16 * q, s1[1] + 8 * q]; o = 1 - q; }
      place(gpt.current, g, o);
    },
  });
  const typing = st.n < DECIDED.length;
  return (
    <div ref={box} className={s.oneBox}>
      <div className={s.oneNote} data-card>
        <p className={s.hNoteDate}>Today at 09:41</p>
        <p className={s.oneTitle}>Job offer: Studio North</p>
        <ul className={s.oneCall}>
          <li>{CALL[0]}</li>
          <li>{CALL[1]}</li>
        </ul>
        <table className={s.oneTable}>
          <thead><tr><th>For</th><th>Against</th></tr></thead>
          <tbody>{PROS.map((p, i) => <tr key={p}><td>{p}</td><td>{CONS[i]}</td></tr>)}</tbody>
        </table>
        <p className={s.oneDecided}>
          <span data-write className={s.oneWrite}>
            <b>Decided:</b> <span>{DECIDED.slice(0, st.n)}</span>{typing && <b className={s.caret} aria-hidden="true" />}<span className={s.askRest} aria-hidden="true">{DECIDED.slice(st.n)}</span>
          </span>
        </p>
        <ul className={s.hRows}>
          <li className={s.hAdded} data-in={st.land || undefined} data-undone={undone || undefined}><i /><span data-at="one"><b className={s.mark} />{ADDED}</span></li>
        </ul>
        <div className={s.oneRec} data-in={st.rec || undefined}><Receipt undone={undone} onFlip={() => setUndone((u) => !u)} live={st.rec} /></div>
      </div>
      <span ref={gpt} className={s.cur} aria-hidden="true"><Flag name="ChatGPT" color={GPT} /></span>
    </div>
  );
}
