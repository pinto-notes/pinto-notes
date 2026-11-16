"use client";

import { useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { useShow } from "./show";
import { WEEK_NOTE as N } from "./Things";
import h from "./heroArt.module.css";

// The first screen's picture, option C (round 17): one weekly note on one person's table, and the
// mechanism in one moment. This file and heroArt.module.css are the whole of it, so another option can
// replace both without touching the rest of the page (Story.tsx places <HeroArt /> in the torn panel).
//
// One idea: you asked, it landed in your week. The etched still life is the picture: its objects frame
// an open middle, and the note lies in it, with air around it. The note is "This week", three short
// lines a stranger reads in three seconds: a dinner, the dinner ChatGPT just added, and one plain
// decision ("Decided: Take the new job in March."). Over its corner, small and labelled, is what you
// asked in ChatGPT: "Add a quick dinner for Thursday." The moment, once, on load: the request appears;
// then Thursday's line writes itself into the note under ChatGPT's green mark (its one accent), with
// "Added by ChatGPT", and the mark settles. About two seconds, no loop, and nothing else moves. With
// Reduce Motion, `?t` or `?one=<s>`, it shows that time's state (the end, for the first two). On a
// phone: the request and the whole note, above the fold, the request 22 px in from the screen's edge.

const ONE = { ask: 0.3, land: 1.05, settle: 1.9, end: 2.6 };

type St = { ask: boolean; land: boolean; settle: boolean };
const START: St = { ask: false, land: false, settle: false };
const same = (a: St, b: St) => a.ask === b.ask && a.land === b.land && a.settle === b.settle;

export function HeroArt() {
  const [st, setSt] = useState<St>(START);
  useShow({
    name: "one", end: ONE.end,
    apply: (t) => {
      const next: St = { ask: t >= ONE.ask, land: t >= ONE.land, settle: t >= ONE.settle };
      setSt((o) => (same(o, next) ? o : next));
    },
  });
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={h.pic} src="/lab/z/hero-table-v1.webp" alt="" width="1254" height="1254" fetchPriority="high" />
      <div className={h.box}>
        <div className={h.group}>
          {/* What you asked, in ChatGPT: small, labelled, pinned to the note it changes. */}
          <div className={h.ask} data-in={st.ask || undefined} aria-label={`In ChatGPT, you asked: ${N.ask}`}>
            <span className={h.askWho} aria-hidden="true"><span className={h.askMark}><AIGlyph name="openai" size={12} color="#fff" /></span>ChatGPT</span>
            <span className={h.askText} aria-hidden="true">{N.ask}</span>
          </div>
          {/* The week's note, three lines. ChatGPT's dinner is the one marked. */}
          <div className={h.note} data-card>
            <p className={h.title}>{N.title}</p>
            <ul className={h.lines}>
              <li><span className={h.day}>{N.dinner[0]}</span>{N.dinner[1]}</li>
              <li className={h.added} data-in={st.land || undefined} data-settled={st.settle || undefined}>
                <span className={h.day}>{N.added[0]}</span>
                <span className={h.wipe}>
                  <span className={h.addedText}><b className={h.mark} aria-hidden="true" />{N.added[1]}</span>
                  <span className={h.by}><span className={h.byMark}><AIGlyph name="openai" size={10} color="#fff" /></span>Added by ChatGPT</span>
                </span>
              </li>
              <li className={h.gap}><b>Decided:</b> {N.decided}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
