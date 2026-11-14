"use client";

import { AIGlyph } from "@/lib/ai-glyphs";
import { useState } from "react";
import r from "./r.module.css";

// Build: the Habit tracker template, big and working. Every day is a button; the counts follow.
// Gym on Friday was logged by Claude ("I went to the gym today"), and says so until you change it.

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TODAY = 4;
const START: [string, number[]][] = [
  ["Morning walk", [1, 1, 1, 1, 0, 0, 0]],
  ["Read 20 pages", [1, 0, 1, 1, 0, 0, 0]],
  ["Gym", [1, 0, 1, 0, 1, 0, 0]],
  ["No phone after 22", [0, 1, 1, 0, 0, 0, 0]],
];

export function Habits() {
  const [rows, setRows] = useState(START.map(([, d]) => d.map(Boolean)));
  const [claude, setClaude] = useState(true);
  const flip = (i: number, k: number) => {
    if (i === 2 && k === TODAY) setClaude(false);
    setRows((all) => all.map((d, j) => (j === i ? d.map((v, n) => (n === k ? !v : v)) : d)));
  };
  return (
    <div className={r.app}>
      <div className={r.appHead}>
        <p className={r.appName}>Habit tracker <span className={r.appTag}>App</span></p>
        <p className={r.appSub}>Small things, most days.</p>
      </div>
      <div className={r.table} role="group" aria-label="This week">
        <span />
        {DAYS.map((d, k) => <span key={d} className={r.day} data-now={k === TODAY || undefined}>{d}</span>)}
        <span className={r.day}>Week</span>
        {START.map(([name], i) => {
          const n = rows[i].filter(Boolean).length;
          return [
            <span key={name} className={r.habit}>
              {name}
              {i === 2 && claude && <em className={r.byClaude}><AIGlyph name="claude" size={11} />Logged by Claude</em>}
            </span>,
            ...DAYS.map((d, k) => (
              <button key={name + d} type="button" className={r.dot} data-on={rows[i][k] || undefined} data-now={k === TODAY || undefined}
                data-ai={(i === 2 && k === TODAY && claude) || undefined}
                aria-pressed={rows[i][k]} aria-label={`${name}, ${d}`} onClick={() => flip(i, k)}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.4l2.6 2.6L12 5.4" /></svg>
              </button>
            )),
            <span key={name + "n"} className={r.count}><b>{n}</b>/7</span>,
          ];
        })}
      </div>
    </div>
  );
}
