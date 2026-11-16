"use client";

import { useRef, useState } from "react";
import { at, mix, mj, place, seg, useShow, type Pt } from "./show";
import { Flag, Folder, GPT, Receipt, WEEK_NOTE as N, WRITE_GOAL, WRITE_HABIT } from "./Things";
import s from "./s.module.css";
import h from "./heroArt.module.css";

// The first screen's picture, option C (round 15): one weekly note on one person's table. This file
// and heroArt.module.css are the whole of it, so another option can replace both without touching the
// rest of the page (Story.tsx places <HeroArt /> in the torn panel).
//
// The etched still life is the picture: its objects frame an open middle, and the note lies in it.
// The note is "This week", a life in a few short lines: three dinners (the last, Lemon chicken, added
// by ChatGPT, marked, with Undo), the Studio North call and what was decided, and the writing habit,
// 4 of 5. Above it, small, a row of the notebook's folders. One focal point: the note. On a phone: the
// folder chips and the whole note, above the fold.

const ONE = { gptIn: 0.9, fly: [0.9, 1.45] as [number, number], land: 1.5, ride: [1.5, 2.0] as [number, number], rec: 2.15, gptOut: [2.85, 3.25] as [number, number], end: 3.4 };
const FOLDERS = ["Notes", "Recipes", "Work", "Reading"];
/** Days written before work this week, of the goal (the habits app counts the same). */
const DONE = 4;

export function HeroArt() {
  const box = useRef<HTMLDivElement>(null), gpt = useRef<HTMLSpanElement>(null);
  const [st, setSt] = useState({ land: false, rec: false });
  const [undone, setUndone] = useState(false);
  useShow({
    name: "one", end: ONE.end,
    apply: (t) => {
      const el = box.current; if (!el) return;
      const B = el.getBoundingClientRect();
      const next = { land: t >= ONE.land, rec: t >= ONE.rec };
      setSt((o) => (o.land === next.land && o.rec === next.rec ? o : next));
      // ChatGPT comes in from the right, rides along its line as it lands, and leaves.
      const line = el.querySelector("[data-at=one]");
      const s0 = at(B, line, 0, 0.74), s1 = at(B, line, 1, 0.74);
      const from: Pt | null = s1 && [B.width + 20, s1[1] + 60];
      let g: Pt | null = s0, o = 0;
      if (t >= ONE.gptIn && t < ONE.fly[1]) { g = from && s0 && mix(from, s0, mj(seg(t, ...ONE.fly))); o = seg(t, ONE.gptIn, ONE.gptIn + 0.2); }
      else if (t >= ONE.fly[1] && t < ONE.gptOut[0]) { g = t < ONE.ride[0] ? s0 : s0 && s1 && mix(s0, s1, mj(seg(t, ...ONE.ride))); o = 1; }
      else if (t >= ONE.gptOut[0]) { const q = seg(t, ...ONE.gptOut); g = s1 && [s1[0] + 16 * q, s1[1] + 8 * q]; o = 1 - q; }
      place(gpt.current, g, o);
    },
  });
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={h.pic} src="/lab/z/hero-table-v1.webp" alt="" width="1254" height="1254" fetchPriority="high" />
      <div ref={box} className={h.box}>
        <div className={h.group}>
          <ul className={h.folders} aria-label="Folders">
            {FOLDERS.map((name, i) => (
              <li key={name} data-on={i === 0 || undefined} aria-current={i === 0 ? "true" : undefined}><Folder />{name}</li>
            ))}
          </ul>
          {/* The week's note: dinners, the call, the habit. ChatGPT's dinner is the one marked. */}
          <div className={h.note} data-card>
            <p className={h.title}>{N.title}</p>
            <p className={h.label}>Dinners</p>
            <ul className={h.dinners}>
              {N.dinners.map(([day, dish]) => <li key={day}><span className={h.day}>{day}</span>{dish}</li>)}
              <li className={h.added} data-in={st.land || undefined} data-undone={undone || undefined}>
                <span className={h.day}>{N.added[0]}</span>
                <span data-at="one" className={h.addedText}><b className={s.mark} /><span className={s.noteLink}>{N.added[1]}</span></span>
              </li>
            </ul>
            <div className={h.rec} data-in={st.rec || undefined}><Receipt undone={undone} onFlip={() => setUndone((u) => !u)} live={st.rec} /></div>
            <p className={h.call}>{N.call}</p>
            <p className={h.decided}><b>Decided:</b> {N.decided}</p>
            <p className={h.habit}>
              <span>{WRITE_HABIT}</span>
              <span className={h.dots} role="img" aria-label={`${DONE} of ${WRITE_GOAL} days`}>
                {Array.from({ length: WRITE_GOAL }, (_, i) => <i key={i} data-on={i < DONE || undefined} />)}
              </span>
              <b aria-hidden="true">{DONE} of {WRITE_GOAL}</b>
            </p>
          </div>
        </div>
        <span ref={gpt} className={s.cur} aria-hidden="true"><Flag name="ChatGPT" color={GPT} /></span>
      </div>
    </>
  );
}
