"use client";

import { useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { WEEK } from "./Things";
import h from "./habits.module.css";

// Round 23, the Apps chapter's picture: a note that is a small app, as Pinto shows one on a Mac. Drawn
// from the app's own capture (appstore-council/cap18/mac/app-habits.png): the note's window (traffic
// lights, back and forward, the floating tools: Aa, checklist, table, attach, share, more), the note's
// title and its first line above the app, then the app's two panels on the note's warm grey (#f3f1ee):
// this week's ring ("78% this week", "18 of 23 done. Your best week yet.") and the habits, each a name,
// its streak in amber brown and a row of seven days, the days named once along the top. Only the data
// is this page's person (the Notes chapter's "Write 30 min before work", the dinners' "Cook at home").
// It's Sunday, so the whole week shows. The days are buttons: tap one and the counts follow, as in the
// real app.

type Habit = { name: string; days: boolean[]; before: number };
const START: Habit[] = [
  { name: "Write before work", days: [true, true, true, true, true, true, true], before: 5 },
  { name: "Read", days: [true, true, true, false, true, true, true], before: 0 },
  { name: "Walk", days: [true, false, true, true, false, true, true], before: 0 },
  { name: "Cook at home", days: [false, true, true, false, true, false, true], before: 0 },
];
const TODAY = 6;
const NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Days in a row up to today, carried back into last week when this one is unbroken. */
function streak(x: Habit) {
  let n = 0;
  for (let j = TODAY; j >= 0 && x.days[j]; j--) n++;
  return n === TODAY + 1 ? n + x.before : n;
}

const I = {
  back: <svg viewBox="0 0 10 16"><path d="M7.5 2 1.8 8l5.7 6" /></svg>,
  fwd: <svg viewBox="0 0 10 16"><path d="M2.5 2l5.7 6-5.7 6" /></svg>,
  check: <svg viewBox="0 0 22 18"><circle cx="4" cy="5" r="2.4" /><path d="M9 5h11M9 13h11" /><circle cx="4" cy="13" r="2.4" /></svg>,
  table: <svg viewBox="0 0 20 18"><rect x="2" y="2.5" width="16" height="13" rx="2" /><path d="M2 7.2h16M2 11.4h16M7.4 2.5v13" /></svg>,
  clip: <svg viewBox="0 0 20 20"><path d="m15.6 9.4-5.8 5.8a3.6 3.6 0 0 1-5.1-5.1l6.4-6.4a2.4 2.4 0 0 1 3.4 3.4L8.3 13.3a1.2 1.2 0 0 1-1.7-1.7l5.6-5.6" /></svg>,
  share: <svg viewBox="0 0 18 20"><path d="M9 12.4V1.8M5.6 5 9 1.6 12.4 5M6.2 7.6H4.4a1.6 1.6 0 0 0-1.6 1.6v7.4a1.6 1.6 0 0 0 1.6 1.6h9.2a1.6 1.6 0 0 0 1.6-1.6V9.2a1.6 1.6 0 0 0-1.6-1.6h-1.8" /></svg>,
  more: <svg viewBox="0 0 20 6" className={h.fill}><circle cx="3" cy="3" r="1.6" /><circle cx="10" cy="3" r="1.6" /><circle cx="17" cy="3" r="1.6" /></svg>,
};

export function HabitsNote() {
  const [hs, setHs] = useState(START);
  const done = hs.reduce((a, x) => a + x.days.filter(Boolean).length, 0);
  const all = hs.length * (TODAY + 1);
  const pct = Math.round((done / all) * 100);
  const tap = (i: number, j: number) => setHs((o) => o.map((x, k) => (k === i ? { ...x, days: x.days.map((v, d) => (d === j ? !v : v)) } : x)));
  // The ring: a circle's stroke, as long as the share done, starting at the top.
  const R = 26, C = 2 * Math.PI * R;
  return (
    <div className={h.win} role="group" aria-label="Pinto Notes: the Habits note, which is a small app">
      {/* Round 25: on a phone, the iPhone app's bar (back to the folder, More), as the Notes chapter's. */}
      <div className={h.ipBar} aria-hidden="true">
        <span className={h.ipBack}><svg viewBox="0 0 11 19"><path d="M9 2 2 9.5 9 17" /></svg>Notes</span>
        <span className={h.ipMore}><svg viewBox="0 0 13 4"><circle cx="2" cy="2" r="1.5" /><circle cx="6.5" cy="2" r="1.5" /><circle cx="11" cy="2" r="1.5" /></svg></span>
      </div>
      <div className={h.bar} aria-hidden="true">
        <span className={h.lights}><i /><i /><i /></span>
        <span className={h.ico}>{I.back}</span><span className={`${h.ico} ${h.dim}`}>{I.fwd}</span>
        <span className={h.tools}><b>Aa</b><span className={h.ico}>{I.check}</span><span className={h.ico}>{I.table}</span><span className={h.ico}>{I.clip}</span><span className={h.ico}>{I.share}</span><span className={h.ico}>{I.more}</span></span>
      </div>
      <div className={h.page}>
        <h3 className={h.title}>Habits</h3>
        <p className={h.first}>Small things, most days.</p>
        <div className={h.week}>
          <svg className={h.ring} viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r={R} className={h.track} />
            <circle cx="32" cy="32" r={R} className={h.done} strokeDasharray={`${(C * done) / all} ${C}`} />
          </svg>
          <div>
            <p className={h.pct} aria-live="polite">{pct}% this week</p>
            <p className={h.of}>{done} of {all} done. Your best week yet.</p>
          </div>
        </div>
        <div className={h.list}>
          <p className={h.days} aria-hidden="true">{WEEK.map((d, j) => <span key={j}>{d}</span>)}</p>
          <ul>
            {hs.map((x, i) => {
              const n = streak(x);
              return (
                <li key={x.name}>
                  <span className={h.name}><b>{x.name}</b><span className={h.streak}>{n} day streak</span></span>
                  <span className={h.dots}>
                    {x.days.map((on, j) => (
                      <button key={j} type="button" data-on={on || undefined} aria-pressed={on} aria-label={`${x.name}, ${NAMES[j]}`} onClick={() => tap(i, j)} />
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** The Habit tracker example's words, as New App puts them in the box (MakeAnApp.examples). */
const IDEA = "a habit tracker with today's habits to tick, streaks, and a week at a glance";
const EXAMPLES = ["Habit tracker", "Trip plan", "Workout log"];

/** Round 24: how the Habits app was made. Pinto's New App sheet on a Mac (Pane/Views/MakeAnApp.swift,
 *  MakeAppSheet with ChatGPT connected): "New App", "Your AI builds it, as a new note.", the box
 *  ("What should it do?") with the Habit tracker example's words in it, the three examples, "Make it with
 *  ChatGPT", and "Or start from a template". The sheet's ground, its field and hairline, the examples'
 *  soft amber capsules and the amber button are the app's (Palette.swift: sheetGround, field,
 *  fieldHairline, amberSoft; the accent). Laid out as the app lays it, at the page's scale. */
export function NewAppSheet() {
  return (
    <div className={h.ask} role="group" aria-label={`Pinto Notes on a Mac: New App. Your AI builds it, as a new note. Described: ${IDEA}. Make it with ChatGPT.`}>
      <span className={h.askX} aria-hidden="true"><svg viewBox="0 0 10 10"><path d="M2 2l6 6M8 2 2 8" /></svg></span>
      <div aria-hidden="true">
        <p className={h.askTitle}>New App</p>
        <p className={h.askLine}>Your AI builds it, as a new note.</p>
        <p className={h.askField}>{IDEA}</p>
        <p className={h.askChips}>{EXAMPLES.map((e) => <span key={e}>{e}</span>)}</p>
        <p className={h.askGo}>Make it with ChatGPT</p>
        <p className={h.askTpl}>Or start from a template</p>
      </div>
    </div>
  );
}

/** The words New App hands to ChatGPT for the Habit tracker example (MakeAnApp.newAppPrompt), cropped to
 *  their first sentence: the second tells the AI which Pinto Notes tools to use. */
const HANDED = "In Pinto Notes, make me a new note that is an app: a habit tracker with today's habits to tick, streaks, and a week at a glance.";

/** Round 25: the AI's part in Apps, as it really works (Pane/Views/MakeAnApp.swift): New App opens
 *  ChatGPT with its words already typed in the message box (WebConnectPlan.prefilled), you press send,
 *  and the app arrives in Pinto as a new note. ChatGPT's box, light, with the words in it, its + at the
 *  left and the send button at the right; over it, which AI it is, as the hero's request says it. */
export function AskChatGpt() {
  return (
    <div className={h.gpt} role="group" aria-label={`ChatGPT, opened by New App with the words typed in: ${HANDED}`}>
      <p className={h.gptWho} aria-hidden="true"><span className={h.gptMark}><AIGlyph name="openai" size={13} color="#fff" /></span>ChatGPT</p>
      <p className={h.gptText} aria-hidden="true">{HANDED}</p>
      <p className={h.gptRow} aria-hidden="true">
        <i><svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" /></svg></i>
        <i className={h.gptMic}><svg viewBox="0 0 20 20"><rect x="7.4" y="2.6" width="5.2" height="9.2" rx="2.6" /><path d="M4.8 9.6a5.2 5.2 0 0 0 10.4 0M10 14.8V17" /></svg></i>
        <b className={h.gptSend}><svg viewBox="0 0 20 20"><path d="M10 15.5v-11M5.2 9 10 4.2 14.8 9" /></svg></b>
      </p>
    </div>
  );
}
