"use client";

import { useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { useShow } from "./show";
import { WEEK_NOTE as N } from "./Things";
import h from "./heroArt.module.css";

// The first screen's picture, option C (round 18): one weekly note on one person's table, and the
// mechanism in one moment: the AI reads what you decided, and what it adds keeps to it. This file and
// heroArt.module.css are the whole of it, so another option can replace both without touching the rest
// of the page (Story.tsx places <HeroArt /> in the torn panel).
//
// One idea, all dinner. The etched still life is the picture: its objects frame an open middle, and the
// note lies in it, with air around it. The note is "This week": what you decided ("Decided: 20-minute
// weeknight dinners."), Tuesday's dinner, and Thursday's, which ChatGPT just added ("Lemon chicken ·
// 20 min", "Added by ChatGPT" under it). Over its corner, small and labelled, is what you asked in
// ChatGPT: "Add a dinner for Thursday." The moment, once, on load: the request appears; the decision's
// "20-minute" takes ChatGPT's green underline (it read it); then Thursday's line writes itself in under
// ChatGPT's green mark, its "Added by ChatGPT" follows, and the mark settles. About two and a half
// seconds, no loop, and nothing else moves. With Reduce Motion, `?t` or `?one=<s>`, it shows that
// time's state (the end, for the first two). On a phone: the request and the whole note, above the fold.

const ONE = { ask: 0.3, read: 0.8, land: 1.3, by: 1.95, settle: 2.3, end: 2.9 };

type St = { ask: boolean; read: boolean; land: boolean; by: boolean; settle: boolean };
const START: St = { ask: false, read: false, land: false, by: false, settle: false };
const same = (a: St, b: St) => a.ask === b.ask && a.read === b.read && a.land === b.land && a.by === b.by && a.settle === b.settle;

export function HeroArt() {
  const [st, setSt] = useState<St>(START);
  useShow({
    name: "one", end: ONE.end,
    apply: (t) => {
      const next: St = { ask: t >= ONE.ask, read: t >= ONE.read, land: t >= ONE.land, by: t >= ONE.by, settle: t >= ONE.settle };
      setSt((o) => (same(o, next) ? o : next));
    },
  });
  const [lead, key, rest] = N.decided;
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
          {/* The week's note: what you decided, then the dinners. ChatGPT's is the one marked, and it
              keeps to the decision: 20 minutes. */}
          <div className={h.note} data-card>
            <p className={h.title}>{N.title}</p>
            <p className={h.decided} data-read={st.read || undefined}><b>Decided:</b> {lead}<span className={h.read}>{key}</span>{rest}</p>
            <ul className={h.lines}>
              <li><span className={h.day}>{N.dinner[0]}</span>{N.dinner[1]}</li>
              <li className={h.added} data-in={st.land || undefined} data-by={st.by || undefined} data-settled={st.settle || undefined}>
                <span className={h.day}>{N.added[0]}</span>
                <span className={h.addedCol}>
                  <span className={h.wipe}><span className={h.addedText}><b className={h.mark} aria-hidden="true" />{N.added[1]}</span></span>
                  <span className={h.by}><span className={h.byMark}><AIGlyph name="openai" size={10} color="#fff" /></span>Added by ChatGPT</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
