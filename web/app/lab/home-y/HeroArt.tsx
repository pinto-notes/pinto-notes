"use client";

import { useRef, useState } from "react";
import { at, mix, mj, place, seg, useShow, type Pt } from "./show";
import { DECIDED, Flag, Folder, GPT, Receipt } from "./Things";
import s from "./s.module.css";
import h from "./heroArt.module.css";

// The first screen's picture, option B (round 15): open on the decision. This file and
// heroArt.module.css are the whole of it, so another option can replace both without touching the
// rest of the page (Story.tsx places <HeroArt /> in the torn panel).
//
// The etched still life is the picture: its objects frame an open middle, and the notes lie in it,
// never over an object. The Studio North note leads (larger, in front): two short lines of thinking,
// the decision you write, and the note ChatGPT added to Work because of it, marked, with Undo. The
// dinners note supports it (smaller, behind, to the right): the decision to cook at home and one
// recipe, so the everyday read stays on the first screen. Above them, small, a row of the notebook's
// folders, Work open. On a phone: the folder chips, the Studio North note whole, and the top of the
// dinners note peeking from under it, all above the fold.

/** The decision, as you type it, in two parts: a wrap breaks between them, never inside the second. */
const PARTS = ["Wait until March. ", "Finish the launch first."];
const SAID = PARTS.join("");
/** What you'd written above it: the deadline, and the cost of saying yes now. */
const LINES = ["Ana needs an answer by Friday.", "Taking it now leaves the launch half done."];
/** ChatGPT's line under it: where it put the new note, and the note (a link to it). */
const ADDED_IN = "New in Work: ";
const ADDED_NOTE = "Questions for Ana";

const TYPE = [0.35, 1.75] as [number, number];
const ONE = { gptIn: 1.95, fly: [1.95, 2.5] as [number, number], land: 2.55, ride: [2.55, 3.05] as [number, number], rec: 3.2, gptOut: [3.9, 4.3] as [number, number], end: 4.4 };
const FOLDERS = ["Work", "Recipes", "Reading", "Trips", "Health"];

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
      <img className={h.pic} src="/lab/y/hero-table-v1.webp" alt="" width="1254" height="1254" fetchPriority="high" />
      <div ref={box} className={h.box}>
        <div className={h.group}>
          <ul className={h.folders} aria-label="Folders">
            {FOLDERS.map((name, i) => (
              <li key={name} data-on={i === 0 || undefined} aria-current={i === 0 ? "true" : undefined}><Folder />{name}</li>
            ))}
          </ul>
          {/* The Studio North note: what you weighed, the decision, and ChatGPT's line under it. */}
          <div className={h.note} data-card>
            <p className={h.date}>Today at 08:40</p>
            <p className={h.title}>Studio North: now or&nbsp;March?</p>
            <ul className={h.lines}>{LINES.map((l) => <li key={l}>{l}</li>)}</ul>
            <p className={h.decided}>
              <b>Decided:</b>{" "}
              {PARTS.map((part, i) => {
                const from = PARTS.slice(0, i).join("").length, k = Math.min(part.length, Math.max(0, st.n - from));
                const here = typing && (st.n < from + part.length || i === PARTS.length - 1) && st.n >= from;
                return (
                  <span key={part} className={i ? h.keep : undefined}>
                    <span>{part.slice(0, k)}</span>
                    {here && <span className={h.caret} data-on={st.n > 0 || undefined} aria-hidden="true" />}
                    <span className={s.askRest} aria-hidden="true">{part.slice(k)}</span>
                  </span>
                );
              })}
            </p>
            <p className={h.added} data-in={st.land || undefined} data-undone={undone || undefined}>
              <span data-at="one"><b className={s.mark} />{ADDED_IN}<span className={s.noteLink}>{ADDED_NOTE}</span></span>
            </p>
            <div className={h.rec} data-in={st.rec || undefined}><Receipt undone={undone} onFlip={() => setUndone((u) => !u)} live={st.rec} /></div>
          </div>
          {/* The dinners note, behind: the other decision of the week, and one recipe. */}
          <div className={h.side}>
            <p className={h.crumb}><Folder />Recipes</p>
            <p className={h.sideTitle}>Weeknight dinners</p>
            <p className={h.sideDecided}><b>Decided:</b> {DECIDED}</p>
            <p className={h.sideRecipe}><span className={s.noteLink}>Lemon chicken</span>, 25 min</p>
          </div>
        </div>
        <span ref={gpt} className={s.cur} aria-hidden="true"><Flag name="ChatGPT" color={GPT} /></span>
      </div>
    </>
  );
}
