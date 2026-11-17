"use client";

import { useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { useShow } from "./show";
import { Folder, WEEK_NOTE as N } from "./Things";
import h from "./heroWin.module.css";

// Round 21, the first screen's picture for ?hero=a|b: the chapters' language instead of the still
// life. A torn sheet in a colour no chapter uses (deep blue), holding Pinto on a Mac with the iPhone
// laid over its corner, as in Notes. The moment happens in the window, once, on load: you asked
// ChatGPT "Add a dinner for Thursday."; the week's note says "Decided: 20-minute weeknight dinners.";
// Thursday's line writes itself in ("Lemon chicken · 20 min") with the tint the app gives an AI's
// change (a marker run behind the words, a 2 pt tick in the margin: Pane/Editor/DecoratedLayout-
// Fragment.swift), the Mac's receipt rises ("ChatGPT changed 1 line | Undo | Review", AIMarks.swift),
// and the iPhone's list marks the note "Edited by ChatGPT" (AIEdit.listLine: shown in the list until
// the note is opened there). On a phone it's the iPhone app's note, as the Notes chapter does: the
// tint, and Undo in the bar (the iPhone has no receipt pill). Reduce Motion, `?t` or `?one=<s>` show
// a time's state.

const ONE = { ask: 0.3, land: 0.95, receipt: 2.0, list: 2.25, end: 2.8 };

type St = { ask: boolean; land: boolean; receipt: boolean; list: boolean };
const START: St = { ask: false, land: false, receipt: false, list: false };
const same = (a: St, b: St) => a.ask === b.ask && a.land === b.land && a.receipt === b.receipt && a.list === b.list;

/** The Mac's notes list and the iPhone's: the week's note first, then a life's notes. */
const ROWS: { title: string; when: string; first: string; folder: string }[] = [
  { title: N.title, when: "9:41 AM", first: "Decided: 20-minute weeknight dinners.", folder: "Home" },
  { title: "Miso salmon", when: "Yesterday", first: "20 min. Rice, greens and a quick glaze.", folder: "Recipes" },
  { title: "Studio North", when: "Yesterday", first: "Decided: wait until March. Finish the launch first.", folder: "Work" },
  { title: "Kyoto in April", when: "Monday", first: "Six days, two cities. Book the ryokan.", folder: "Trips" },
  { title: "Morning run", when: "Sunday", first: "Three a week, before work. Easy pace.", folder: "Health" },
];

const Ico = {
  side: <svg viewBox="0 0 20 16"><rect x="1.5" y="1.5" width="17" height="13" rx="3" /><path d="M7.5 1.5v13" /></svg>,
  search: <svg viewBox="0 0 18 18"><circle cx="7.6" cy="7.6" r="5.6" /><path d="M11.8 11.8 16 16" /></svg>,
  back: <svg viewBox="0 0 10 16"><path d="M7.5 2 1.8 8l5.7 6" /></svg>,
  fwd: <svg viewBox="0 0 10 16"><path d="M2.5 2l5.7 6-5.7 6" /></svg>,
  check: <svg viewBox="0 0 20 16"><circle cx="3.5" cy="4" r="2.2" /><path d="M8.5 4h10M8.5 12h10" /><circle cx="3.5" cy="12" r="2.2" /></svg>,
  more: <svg viewBox="0 0 20 6" className={h.fill}><circle cx="3" cy="3" r="1.6" /><circle cx="10" cy="3" r="1.6" /><circle cx="17" cy="3" r="1.6" /></svg>,
  compose: <svg viewBox="0 0 18 18"><path d="M8 2.5H4.2c-1 0-1.7.8-1.7 1.7v9.6c0 1 .8 1.7 1.7 1.7h9.6c1 0 1.7-.8 1.7-1.7V10" /><path d="M13.6 1.9a1.4 1.4 0 0 1 2 2L9.4 10.1l-2.7.7.7-2.7z" /></svg>,
};

/** The week's note: the decision, a heading, the dinners, and Thursday's (written in by ChatGPT). */
function WeekNote({ st }: { st: St }) {
  const [lead, key, rest] = N.decided;
  return (
    <div className={h.note}>
      <p className={h.title}>{N.title}</p>
      <p className={h.decided}><b>Decided:</b> {lead}{key}{rest}</p>
      <p className={h.head}>Dinners</p>
      <ul className={h.lines}>
        <li>{N.dinner[0]}: {N.dinner[1]}</li>
        <li className={h.added} data-in={st.land || undefined}>
          <span className={h.wipe}><span className={h.run}>{N.added[0]}: {N.added[1]}{N.added[2]}</span></span>
          <i className={h.tick} aria-hidden="true" />
        </li>
      </ul>
    </div>
  );
}

/** What you asked in ChatGPT: small, pinned over the window's corner. */
function Ask({ st }: { st: St }) {
  return (
    <div className={h.ask} data-in={st.ask || undefined} aria-label={`In ChatGPT, you asked: ${N.ask}`}>
      <span className={h.askWho} aria-hidden="true"><span className={h.askMark}><AIGlyph name="openai" size={12} color="#fff" /></span>ChatGPT</span>
      <span className={h.askText} aria-hidden="true">{N.ask}</span>
    </div>
  );
}

export function HeroWin() {
  const [st, setSt] = useState<St>(START);
  useShow({
    name: "one", end: ONE.end,
    apply: (t) => {
      const next: St = { ask: t >= ONE.ask, land: t >= ONE.land, receipt: t >= ONE.receipt, list: t >= ONE.list };
      setSt((o) => (same(o, next) ? o : next));
    },
  });
  return (
    <div className={h.sheet}>
      <i className={h.dots} aria-hidden="true" />
      <div className={h.board}>
        {/* Pinto on a Mac: the notes list, and the week's note open. */}
        <div className={h.mac} role="group" aria-label="Pinto Notes on a Mac: ChatGPT adds Thursday's dinner to the This week note">
          <div className={h.bar} aria-hidden="true">
            <span className={h.lights}><i /><i /><i /></span>
            <span className={h.listBar}><span className={h.ico}>{Ico.side}</span><span className={h.ico}>{Ico.search}</span><span className={h.pill}>All Notes</span></span>
            <span className={h.noteBar}>
              <span className={h.ico}>{Ico.back}</span><span className={`${h.ico} ${h.dim}`}>{Ico.fwd}</span>
              <span className={h.crumb}>Home</span>
              <span className={h.tools}><b>Aa</b><span className={h.ico}>{Ico.check}</span><span className={h.ico}>{Ico.more}</span></span>
            </span>
          </div>
          <ul className={h.list} aria-hidden="true">
            {ROWS.slice(0, 3).map((r, i) => (
              <li key={r.title} data-on={i === 0 || undefined}>
                <b>{r.title}</b>
                <span className={h.when}>{r.when} · {r.first}</span>
                <span className={h.in}><Folder />{r.folder}</span>
              </li>
            ))}
          </ul>
          <div className={h.pane}>
            <WeekNote st={st} />
            <p className={h.receipt} data-in={st.receipt || undefined}>
              <AIGlyph name="openai" size={14} color="#1d1b19" /><span>ChatGPT changed 1 line</span><i /><b>Undo</b><i /><b>Review</b>
            </p>
          </div>
        </div>
        {/* The iPhone: the same notes, and the week's note marked in the list until it's opened there. */}
        <div className={h.phone} role="img" aria-label="Pinto Notes on an iPhone: the This week note is marked Edited by ChatGPT">
          <div className={h.screen}>
            <p className={h.status}><b>9:41</b><span className={h.island} /><span className={h.sig}><i /><i /><i /></span></p>
            <p className={h.pNav}><span>{Ico.back}Folders</span><span className={h.ico}>{Ico.more}</span></p>
            <p className={h.pTitle}>All Notes</p>
            <ul className={h.pList}>
              {ROWS.map((r, i) => (
                <li key={r.title}>
                  <b>{r.title}</b>
                  {i === 0
                    ? <span className={h.pWhen} data-ai={st.list || undefined}>{r.when.replace(" AM", "")}<span className={h.pFirst}>{r.first}</span><span className={h.pAi}><AIGlyph name="openai" size={9} color="currentColor" />Edited by ChatGPT</span></span>
                    : <span className={h.pWhen}>{r.when}<span className={h.pFirst}>{r.first}</span></span>}
                </li>
              ))}
            </ul>
            <span className={h.compose} aria-hidden="true">{Ico.compose}</span>
          </div>
        </div>
        <Ask st={st} />
      </div>
      {/* On a phone: the iPhone app's note (the Notes chapter does the same), with Undo in its bar. */}
      <div className={h.small}>
        <Ask st={st} />
        <div className={h.app} role="group" aria-label="Pinto Notes on an iPhone: ChatGPT adds Thursday's dinner to the This week note">
          <p className={h.appBar} aria-hidden="true">
            <span className={h.appBack}>{Ico.back}Home</span>
            <span className={h.appUndo} data-in={st.receipt || undefined}>Undo</span>
            <span className={h.ico}>{Ico.more}</span>
          </p>
          <WeekNote st={st} />
        </div>
      </div>
    </div>
  );
}
