"use client";

import { useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { at, mix, mj, place, seg, useShow, type Pt } from "./show";
import { Flag, Tick, TODAY, WEEK, YOU } from "./Things";
import s from "./s.module.css";

// Build apps, from the first word to the first tap. The note starts as Pinto's own New app page: you
// describe the app ("Make me a tracker for Portuguese practice") and press Make it with ChatGPT. The
// page becomes the tracker, piece by piece, in the same paper. Then your cursor taps today, and the
// count goes from 0 to 1 (a second habit, Podcast in Portuguese, sits under it on wide screens). After that it's yours: tap any day, add a habit, take one away. On a phone
// the request is already typed when the chapter arrives (the show starts at the press), and the week
// is a short list of the days around today, the way a tracker reads on an iPhone.

const ASK = "Make me a tracker for Portuguese practice";
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const B = { type: [0.5, 2.1] as [number, number], press: 2.4, built: 2.75, name: 2.95, days: 3.15, add: 3.65, made: 3.95, youIn: [4.5, 5.4] as [number, number], tap: 5.5, youOut: [6.6, 7.1] as [number, number], end: 7.2 };

/** A habit. `wide`: shown on wide screens only (a phone shows the one habit, at reading size). */
type Habit = { name: string; days: boolean[]; wide?: boolean };
const FIRST: Habit = { name: "Portuguese, 10 min", days: WEEK.map(() => false) };
const SECOND: Habit = { name: "Podcast in Portuguese", days: WEEK.map(() => false), wide: true };
type Snap = { n: number; press: boolean; built: boolean; name: boolean; days: number; add: boolean; made: boolean; tapped: boolean; down: boolean };
const START: Snap = { n: 0, press: false, built: false, name: false, days: 0, add: false, made: false, tapped: false, down: false };
const same = (a: Snap, b: Snap) => (Object.keys(a) as (keyof Snap)[]).every((k) => a[k] === b[k]);

export function BuildShow({ subscribe }: { subscribe: (fn: (dwell: number, arrive: number) => void) => () => void }) {
  const card = useRef<HTMLDivElement>(null), you = useRef<HTMLSpanElement>(null);
  const narrow = useRef<boolean | null>(null);
  const [snap, setSnap] = useState<Snap>(START);
  // Once you touch the app, it's yours: the show stops steering it.
  const [mine, setMine] = useState<Habit[] | null>(null);
  const mineRef = useRef(mine); mineRef.current = mine;
  const [draft, setDraft] = useState("");

  useShow({
    name: "build", end: B.end, subscribe,
    apply: (t) => {
      if (narrow.current === null && typeof matchMedia === "function") narrow.current = matchMedia("(max-width: 760px)").matches;
      const next: Snap = {
        n: narrow.current ? ASK.length : Math.round(seg(t, ...B.type) * ASK.length), press: t >= B.press && t < B.press + 0.18, built: t >= B.built, name: t >= B.name,
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

  const habits: Habit[] = mine ?? [{ ...FIRST, days: FIRST.days.map((_, j) => j === TODAY && snap.tapped) }, SECOND];
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
          <span>{ASK.slice(0, snap.n)}</span><span className={s.makeCaret} data-done={snap.n >= ASK.length || undefined} /><span className={s.askRest}>{ASK.slice(snap.n)}</span>
        </p>
        <div className={s.makeRow}>
          <small>Opens ChatGPT with this typed in. The app appears here when it’s built.</small>
          <span className={s.makeGo} data-press={snap.press || undefined} data-ready={snap.n >= ASK.length || undefined}><AIGlyph name="openai" size={15} color="currentColor" />Make it with ChatGPT</span>
        </div>
        <p className={s.makeTpl}>Or start from a template</p>
      </div>
      {/* The app it made. */}
      <div className={s.makeApp} aria-hidden={!built || undefined}>
        <p className={s.appName} data-in={snap.built || mine ? true : undefined}>Before Lisbon<span>App</span></p>
        <ul className={s.habits}>
          {habits.map((h, i) => {
            const n = h.days.filter(Boolean).length;
            return (
              <li key={h.name + i} className={s.habitRow} data-wide={h.wide || undefined}>
                <div className={s.habitHead} data-in={snap.name || mine ? true : undefined}>
                  <p className={s.habitName}>{h.name}</p>
                  <p className={s.habitStreak} aria-live="polite"><b key={n}>{n}</b> {n === 1 ? "day" : "days"}</p>
                  {habits.length > 1 && <button type="button" className={s.habitX} onClick={() => remove(i)} aria-label={`Remove ${h.name}`} tabIndex={built ? 0 : -1}>×</button>}
                </div>
                <div className={s.week}>
                  {WEEK.map((d, j) => (
                    <span key={j} className={s.dayCell} data-in={j < snap.days || mine ? true : undefined} style={{ "--j": j } as React.CSSProperties}>
                      <button type="button" className={s.day} data-on={h.days[j] || undefined} data-now={j === TODAY || undefined} data-today={(i === 0 && j === TODAY) || undefined}
                        data-down={(i === 0 && j === TODAY && snap.down) || undefined} disabled={j > TODAY} tabIndex={built ? 0 : -1}
                        onClick={() => tap(i, j)} aria-pressed={h.days[j]} aria-label={`${h.name}, ${DAY_NAMES[j]}`}>
                        <small>{d}</small><span className={s.dayName}>{DAY_NAMES[j]}</span><i><Tick /></i>
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
