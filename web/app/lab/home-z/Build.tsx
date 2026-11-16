"use client";

import { useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { at, mix, mj, place, seg, useShow, type Pt } from "./show";
import { COOK_DAYS, COOK_HABIT, DAY_NAMES, Flag, Tick, TODAY, WEEK, WRITE_BEFORE, WRITE_GOAL, WRITE_HABIT, YOU } from "./Things";
import s from "./s.module.css";

// Build apps, from the first word to the first tap. The note starts as Pinto's own New app page: you
// describe the app ("Make me a habit tracker: writing before work, cooking at home") and press Make
// it with ChatGPT. The request is already typed when the chapter arrives, on a Mac as on a phone (the
// show starts at the press). The page becomes the tracker, piece by piece, in the same paper, holding this week
// as it stands (writing Monday to Wednesday, cooking Tuesday and Wednesday). Then your cursor taps
// today on writing, and its count goes from 3 of 5 to 4 of 5, the first screen's count. Cooking at
// home sits under it, five nights a week (the decision in the dinners note). After that it's yours: tap any day,
// add a habit, take one away. The tracker has one layout everywhere, the same as in Your AI: the days
// named once along the top, each habit a row of seven.

const ASK = "Make me a habit tracker: writing before work, cooking at home";
const B = { press: 1.1, built: 1.45, name: 1.65, days: 1.85, add: 2.35, made: 2.65, youIn: [3.2, 4.1] as [number, number], tap: 4.2, youOut: [5.3, 5.8] as [number, number], end: 5.9 };

/** A habit. `goal`: nights a week, counted as "n of goal" (and named as the goal until the first one). */
type Habit = { name: string; days: boolean[]; goal?: number };
const FIRST: Habit = { name: WRITE_HABIT, days: WRITE_BEFORE, goal: WRITE_GOAL };
const SECOND: Habit = { name: COOK_HABIT, days: COOK_DAYS, goal: 5 };
type Snap = { press: boolean; built: boolean; name: boolean; days: number; add: boolean; made: boolean; tapped: boolean; down: boolean };
const START: Snap = { press: false, built: false, name: false, days: 0, add: false, made: false, tapped: false, down: false };
const same = (a: Snap, b: Snap) => (Object.keys(a) as (keyof Snap)[]).every((k) => a[k] === b[k]);

export function BuildShow({ subscribe }: { subscribe: (fn: (dwell: number, arrive: number) => void) => () => void }) {
  const card = useRef<HTMLDivElement>(null), you = useRef<HTMLSpanElement>(null);
  const [snap, setSnap] = useState<Snap>(START);
  // Once you touch the app, it's yours: the show stops steering it.
  const [mine, setMine] = useState<Habit[] | null>(null);
  const mineRef = useRef(mine); mineRef.current = mine;
  const [draft, setDraft] = useState("");

  useShow({
    name: "build", end: B.end, subscribe,
    apply: (t) => {
      const next: Snap = {
        press: t >= B.press && t < B.press + 0.18, built: t >= B.built, name: t >= B.name,
        days: t < B.days ? 0 : Math.min(7, 1 + Math.floor((t - B.days) / 0.06)), add: t >= B.add, made: t >= B.made, tapped: t >= B.tap, down: t >= B.tap && t < B.tap + 0.16,
      };
      setSnap((o) => (same(o, next) ? o : next));
      const el = card.current; if (!el) return;
      const box = el.getBoundingClientRect();
      const today = at(box, el.querySelector(`[data-today] i`), 0.5, 0.55);
      const from: Pt = [box.width + 40, box.height + 50];
      let p: Pt | null = from, o = 0;
      if (t >= B.youIn[0] && t < B.youIn[1]) { p = today && mix(from, today, mj(seg(t, ...B.youIn))); o = seg(t, B.youIn[0], B.youIn[0] + 0.2); }
      else if (t >= B.youIn[1] && t < B.youOut[0]) { p = today; o = 1; }
      else if (t >= B.youOut[0]) { const k = mj(seg(t, ...B.youOut)); p = today && [today[0] + 30 * k, today[1] + 34 * k]; o = 1 - k; }
      place(you.current, p, mineRef.current ? 0 : o);
      you.current?.toggleAttribute("data-press", next.down);
    },
  });

  const habits: Habit[] = mine ?? [{ ...FIRST, days: FIRST.days.map((v, j) => v || (j === TODAY && snap.tapped)) }, SECOND];
  const take = (f: (hs: Habit[]) => Habit[]) => setMine((m) => f(m ?? habits));
  const tap = (h: number, d: number) => take((hs) => hs.map((x, i) => (i === h ? { ...x, days: x.days.map((v, j) => (j === d ? !v : v)) } : x)));
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const name = draft.trim(); if (!name) return;
    take((hs) => [...hs, { name, days: WEEK.map(() => false) }].slice(-3));
    setDraft("");
  };
  const remove = (h: number) => take((hs) => hs.filter((_, i) => i !== h));
  const built = snap.built || mine !== null;

  return (
    <div ref={card} className={s.make} data-built={built || undefined}>
      {/* The New app page, as in Pinto: describe it, and ChatGPT makes it. */}
      <div className={s.makeAsk} aria-hidden={built || undefined}>
        <p className={s.makeH}>New app</p>
        <p className={s.makeSub}>Your AI builds it, as a new note.</p>
        <p className={s.makeLabel}>Describe your app</p>
        <p className={s.makeBox}>
          <span>{ASK}</span><span className={s.makeCaret} data-done />
        </p>
        <div className={s.makeRow}>
          <small>Opens ChatGPT with this typed in. The app appears here when it’s built.</small>
          <span className={s.makeGo} data-press={snap.press || undefined} data-ready><AIGlyph name="openai" size={15} color="currentColor" />Make it with ChatGPT</span>
        </div>
        <p className={s.makeTpl}>Or start from a template</p>
      </div>
      {/* The app it made. */}
      <div className={s.makeApp} aria-hidden={!built || undefined}>
        <p className={s.appName} data-in={snap.built || mine ? true : undefined}>Habits<span>App</span></p>
        <div className={s.days} data-in={snap.name || mine ? true : undefined} aria-hidden="true">{WEEK.map((d, j) => <small key={j} data-now={j === TODAY || undefined}>{d}</small>)}</div>
        <ul className={s.habits}>
          {habits.map((h, i) => {
            const n = h.days.filter(Boolean).length;
            return (
              <li key={h.name + i} className={s.habitRow}>
                <div className={s.habitHead} data-in={snap.name || mine ? true : undefined}>
                  <p className={s.habitName}>{h.name}</p>
                  <p className={s.habitStreak} aria-live="polite">{h.goal ? (n ? <><b key={n}>{n}</b> of {h.goal}</> : <>{h.goal} a week</>) : <><b key={n}>{n}</b> {n === 1 ? "day" : "days"}</>}</p>
                  {habits.length > 1 && <button type="button" className={s.habitX} onClick={() => remove(i)} aria-label={`Remove ${h.name}`} tabIndex={built ? 0 : -1}>×</button>}
                </div>
                <div className={s.week}>
                  {WEEK.map((_d, j) => (
                    <span key={j} className={s.dayCell} data-in={j < snap.days || mine ? true : undefined} style={{ "--j": j } as React.CSSProperties}>
                      <button type="button" className={s.day} data-on={h.days[j] || undefined} data-now={j === TODAY || undefined} data-today={(i === 0 && j === TODAY) || undefined}
                        data-down={(i === 0 && j === TODAY && snap.down) || undefined} disabled={j > TODAY} tabIndex={built ? 0 : -1}
                        onClick={() => tap(i, j)} aria-pressed={h.days[j]} aria-label={`${h.name}, ${DAY_NAMES[j]}`}>
                        <i><Tick /></i>
                      </button>
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
        <form className={s.addRow} onSubmit={add} data-in={snap.add || mine ? true : undefined}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a habit" aria-label="Add a habit" maxLength={28} tabIndex={built ? 0 : -1} />
          <button type="submit" disabled={!draft.trim()} tabIndex={built ? 0 : -1}>Add</button>
        </form>
        <p className={s.made} data-in={snap.made || mine ? true : undefined}><span className={s.receiptMark}><AIGlyph name="openai" size={11} color="#fff" /></span>Made by ChatGPT</p>
      </div>
      <span ref={you} className={`${s.cur} ${s.curYou}`} aria-hidden="true"><Flag name="You" color={YOU} /></span>
    </div>
  );
}
