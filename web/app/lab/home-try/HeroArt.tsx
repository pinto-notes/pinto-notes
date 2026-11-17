"use client";

import { useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { useShow } from "./show";
import { WEEK_NOTE as N } from "./Things";
import { useArt } from "./art";
import h from "./heroArt.module.css";

// The first screen's picture, option C (round 19): one weekly note on one person's table, and the
// mechanism in one moment: you ask ChatGPT, and what it adds keeps to what you decided. This file and
// heroArt.module.css are the whole of it, so another option can replace both without touching the rest
// of the page (Story.tsx places <HeroArt /> in the torn panel).
//
// The note is "This week", as Pinto shows a note: the title, "**Decided:** 20-minute weeknight
// dinners.", and a list of dinners. Over its corner, small and labelled, what you asked in ChatGPT:
// "Add a dinner for Thursday." On load, once: the request appears; Thursday's line writes itself in,
// "Thu: Lemon chicken · 20 min", marked the way the app marks an AI's lines (round 23): a marker run
// behind the words, 24% of the amber accent over the page, and a 2 pt amber tick 8 pt left of the text
// (Pane/Editor/DecoratedLayoutFragment.swift); then "Edited by ChatGPT" in the app's amber ink, the
// words the app gives a note an AI changed (AIEdit.listLine). No Undo here: the page shows it once, in
// Your AI. About two and a half seconds, no loop. With Reduce Motion, `?t` or `?one=<s>`, it shows that
// time's state (the end, for the first two). On a phone: the request and the whole note, above the fold.
// Round 22: `?art=` picks the table under it (art.ts); paper-b is the default since round 23.

/** The moment's times (s): the request, the line written in with its mark, then "Edited by ChatGPT". */
const ONE = { ask: 0.3, land: 1.0, by: 2.1, end: 2.6 };

type St = { ask: boolean; land: boolean; by: boolean };
const START: St = { ask: false, land: false, by: false };
const same = (a: St, b: St) => a.ask === b.ask && a.land === b.land && a.by === b.by;

export function HeroArt() {
  const [st, setSt] = useState<St>(START);
  useShow({
    name: "one", end: ONE.end,
    apply: (t) => {
      const next: St = { ask: t >= ONE.ask, land: t >= ONE.land, by: t >= ONE.by };
      setSt((o) => (same(o, next) ? o : next));
    },
  });
  const [lead, key, rest] = N.decided;
  const art = useArt();
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={h.pic} src={art.hero} alt="" width={art.heroSide} height={art.heroSide} fetchPriority="high" />
      <div className={h.box}>
        <div className={h.group}>
          {/* What you asked, in ChatGPT: small, labelled, pinned to the note it changes. */}
          <div className={h.ask} data-in={st.ask || undefined} aria-label={`In ChatGPT, you asked: ${N.ask}`}>
            <span className={h.askWho} aria-hidden="true"><span className={h.askMark}><AIGlyph name="openai" size={12} color="#fff" /></span>ChatGPT</span>
            <span className={h.askText} aria-hidden="true">{N.ask}</span>
          </div>
          {/* The week's note, as Pinto shows it: what you decided, then the dinners. ChatGPT's line is
              marked as the app marks an AI's lines, and keeps to the decision: 20 minutes. */}
          <div className={h.note} data-card>
            <p className={h.title}>{N.title}</p>
            <p className={h.decided}><b>Decided:</b> {lead}{key}{rest}</p>
            <ul className={h.lines}>
              <li>{N.dinner[0]}: {N.dinner[1]}</li>
              <li className={h.added} data-in={st.land || undefined}>
                <i className={h.tick} aria-hidden="true" />
                <span className={h.wipe}><span className={h.run}>{N.added[0]}: {N.added[1]}{N.added[2]}</span></span>
              </li>
            </ul>
            <p className={h.by} data-in={st.by || undefined}><AIGlyph name="openai" size={13} color="#1d1b19" />Edited by ChatGPT</p>
          </div>
        </div>
      </div>
    </>
  );
}
