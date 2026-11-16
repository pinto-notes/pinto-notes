"use client";

import { useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { useShow } from "./show";
import { Folder, Receipt, WEEK_NOTE as N, WRITE_GOAL, WRITE_HABIT } from "./Things";
import s from "./s.module.css";
import h from "./heroArt.module.css";

// The first screen's picture, option C (round 16): one weekly note on one person's table, and the
// mechanism in one moment. This file and heroArt.module.css are the whole of it, so another option can
// replace both without touching the rest of the page (Story.tsx places <HeroArt /> in the torn panel).
//
// The etched still life is the picture: its objects frame an open middle, and the note lies in it. The
// note is "This week", a life in three short parts: dinners, work, a habit. Pinned to its corner, small
// and labelled, is what you asked in ChatGPT: "Add a quick dinner for Thursday." The moment, once, on
// load: the request appears; then Thursday's line writes itself into the note under ChatGPT's green
// mark ("New in Recipes: Lemon chicken", a link to the recipe it wrote), and the mark settles; then
// "Added by ChatGPT · Undo", and the Recipes folder shows something new. About two and a half seconds,
// no loop. The app marks an AI's edit the same way (swept in its colour, never typed out). With Reduce
// Motion, `?t` or `?one=<s>`, it shows that time's state (the end, for the first two). One focal point:
// the note. On a phone: the folder chips, the request and the whole note, above the fold.

const ONE = { ask: 0.3, land: 1.05, rec: 1.75, settle: 1.9, chip: 2.0, end: 2.6 };
const FOLDERS = ["Recipes", "Work", "Reading", "Health"];
/** Days written before work this week, of the goal (the habits app counts the same). */
const DONE = 4;

type St = { ask: boolean; land: boolean; rec: boolean; settle: boolean; chip: boolean };
const START: St = { ask: false, land: false, rec: false, settle: false, chip: false };
const same = (a: St, b: St) => (Object.keys(a) as (keyof St)[]).every((k) => a[k] === b[k]);

export function HeroArt() {
  const [st, setSt] = useState<St>(START);
  const [undone, setUndone] = useState(false);
  useShow({
    name: "one", end: ONE.end,
    apply: (t) => {
      const next: St = { ask: t >= ONE.ask, land: t >= ONE.land, rec: t >= ONE.rec, settle: t >= ONE.settle, chip: t >= ONE.chip };
      setSt((o) => (same(o, next) ? o : next));
    },
  });
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={h.pic} src="/lab/z/hero-table-v1.webp" alt="" width="1254" height="1254" fetchPriority="high" />
      <div className={h.box}>
        <div className={h.group}>
          <ul className={h.folders} aria-label="Folders">
            {FOLDERS.map((name, i) => (
              <li key={name} data-new={(i === 0 && st.chip && !undone) || undefined}><Folder />{name}</li>
            ))}
          </ul>
          {/* What you asked, in ChatGPT: small, labelled, pinned to the note it changes. */}
          <div className={h.ask} data-in={st.ask || undefined} aria-label={`In ChatGPT, you asked: ${N.ask}`}>
            <span className={h.askWho} aria-hidden="true"><span className={h.askMark}><AIGlyph name="openai" size={12} color="#fff" /></span>ChatGPT</span>
            <span className={h.askText} aria-hidden="true">{N.ask}</span>
          </div>
          {/* The week's note: dinners, work, the habit. ChatGPT's dinner is the one marked. */}
          <div className={h.note} data-card>
            <p className={h.title}>{N.title}</p>
            <p className={h.label}>Dinners</p>
            <ul className={h.dinners}>
              {N.dinners.map(([day, dish]) => <li key={day}><span className={h.day}>{day}</span>{dish}</li>)}
              <li className={h.added} data-in={st.land || undefined} data-settled={st.settle || undefined} data-undone={undone || undefined}>
                <span className={h.day}>{N.added[0]}</span>
                <span className={h.addedText}>
                  <b className={h.mark} aria-hidden="true" />
                  <span className={h.wipe}><span className={h.newIn}>{N.addedIn}</span> <span className={s.noteLink}>{N.added[1]}</span></span>
                </span>
              </li>
            </ul>
            <div className={h.rec} data-in={st.rec || undefined}><Receipt undone={undone} onFlip={() => setUndone((u) => !u)} live={st.rec} /></div>
            <p className={h.label}>Work</p>
            <p className={h.question}>{N.question}</p>
            <p className={h.decided}><b>Decided:</b> {N.decided}</p>
            <p className={h.label}>Habit</p>
            <p className={h.habit}>
              <span>{WRITE_HABIT}</span>
              <span className={h.dots} role="img" aria-label={`${DONE} of ${WRITE_GOAL} days`}>
                {Array.from({ length: WRITE_GOAL }, (_, i) => <i key={i} data-on={i < DONE || undefined} />)}
              </span>
              <b aria-hidden="true">{DONE} of {WRITE_GOAL}</b>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
