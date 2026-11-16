"use client";

import { useRef, useState } from "react";
import { at, mix, mj, place, seg, useShow, type Pt } from "./show";
import { ADDED_IN, ADDED_RECIPE, BOOK, DECIDED, Flag, Folder, GPT, Receipt } from "./Things";
import s from "./s.module.css";
import h from "./heroArt.module.css";

// The first screen's picture, option A (round 14): a recipe note and a book note on one person's
// table. This file and heroArt.module.css are the whole of it, so another option can replace both
// without touching the rest of the page (Story.tsx places <HeroArt /> in the torn panel).
//
// The etched still life is the picture: its objects frame an open middle, and the two notes lie in it,
// never over an object. The dinners note leads (larger, in front, with the decision you write and the
// line ChatGPT added because of it, marked, with Undo). The book note supports it (smaller, lower,
// behind): two highlights from Deep Work and what the reader decided. Above them, small, a row of the
// notebook's folders. On a phone: the folder chips, the dinners note, and the top of the book note
// peeking from under it, all above the fold.

const TYPE = [0.35, 1.75] as [number, number];
/** The decision as the hero sets it: "five nights a week" kept together, so a wrap breaks before it. */
const SAID = DECIDED.replace("five nights a week", "five nights a week");
const ONE = { gptIn: 1.95, fly: [1.95, 2.5] as [number, number], land: 2.55, ride: [2.55, 3.05] as [number, number], rec: 3.2, gptOut: [3.9, 4.3] as [number, number], end: 4.4 };
const FOLDERS = ["Recipes", "Reading", "Work", "Trips", "Health"];

export function HeroArt() {
  const box = useRef<HTMLDivElement>(null), gpt = useRef<HTMLSpanElement>(null);
  const [st, setSt] = useState({ n: 0, land: false, rec: false });
  const [undone, setUndone] = useState(false);
  useShow({
    name: "one", end: ONE.end,
    apply: (t) => {
      const el = box.current; if (!el) return;
      const B = el.getBoundingClientRect();
      const next = { n: Math.round(seg(t, ...TYPE) * SAID.length), land: t >= ONE.land, rec: t >= ONE.rec };
      setSt((o) => (o.n === next.n && o.land === next.land && o.rec === next.rec ? o : next));
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
  const typing = st.n < SAID.length;
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
          {/* The dinners note: the decision, and ChatGPT's line under it. */}
          <div className={h.note} data-card>
            <p className={h.date}>Today at 09:12</p>
            <p className={h.title}>Weeknight dinners</p>
            <p className={h.decided}>
              <b>Decided:</b> <span>{SAID.slice(0, st.n)}</span>
              {typing && <span className={h.caret} data-on={st.n > 0 || undefined} aria-hidden="true" />}
              <span className={s.askRest} aria-hidden="true">{SAID.slice(st.n)}</span>
            </p>
            <p className={h.added} data-in={st.land || undefined} data-undone={undone || undefined}>
              <span data-at="one"><b className={s.mark} />{ADDED_IN}<span className={s.noteLink}>{ADDED_RECIPE}</span></span>
            </p>
            <div className={h.rec} data-in={st.rec || undefined}><Receipt undone={undone} onFlip={() => setUndone((u) => !u)} live={st.rec} /></div>
          </div>
          {/* The book note: two highlights, and the decision it led to. */}
          <div className={h.book}>
            <p className={h.crumb}><Folder />Reading</p>
            <p className={h.bookTitle}>{BOOK.title}<span>{BOOK.author}</span></p>
            <ul className={h.marks}>{BOOK.marks.map((m) => <li key={m}>{m}</li>)}</ul>
            <p className={h.bookDecided}><b>Decided:</b> {BOOK.decided}</p>
          </div>
        </div>
        <span ref={gpt} className={s.cur} aria-hidden="true"><Flag name="ChatGPT" color={GPT} /></span>
      </div>
    </>
  );
}
