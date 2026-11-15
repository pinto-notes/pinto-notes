"use client";

import { useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { at, mix, mj, place, seg, useShow, type Pt } from "./show";
import { COOKED, DAY_NAMES, DAYS, DINNERS, Flag, GOAL, Tick, TODAY, YOU } from "./Things";
import s from "./s.module.css";

// Build apps, from the first word to the first tap. The note starts as Pinto's own New app page: you
// describe the app ("Make me a tracker for home-cooked dinners") and press Make it with ChatGPT. The
// page becomes the tracker, piece by piece, in the same paper: this week's count against the five
// nights you decided on, and the week, a dinner a day. Then your cursor ticks tonight, and the count
// goes from 3 to 4 of 5. After that it's yours: tick any night, or write in tonight's dinner. On a
// phone the request is already typed when the chapter arrives (the show starts at the press), and
// the week shows the three nights up to tonight, so the app fits the screen at reading size.

const ASK = "Make me a tracker for home-cooked dinners";
const B = { type: [0.5, 2.1] as [number, number], press: 2.4, built: 2.75, name: 2.95, stat: 3.1, rows: 3.2, add: 3.75, made: 4.0, youIn: [4.5, 5.4] as [number, number], tap: 5.5, youOut: [6.6, 7.1] as [number, number], end: 7.2 };

type Week = { cooked: boolean[]; dishes: string[] };
type Snap = { n: number; press: boolean; built: boolean; name: boolean; stat: boolean; rows: number; add: boolean; made: boolean; tapped: boolean; down: boolean };
const START: Snap = { n: 0, press: false, built: false, name: false, stat: false, rows: 0, add: false, made: false, tapped: false, down: false };
const same = (a: Snap, b: Snap) => (Object.keys(a) as (keyof Snap)[]).every((k) => a[k] === b[k]);

export function BuildShow({ subscribe }: { subscribe: (fn: (dwell: number, arrive: number) => void) => () => void }) {
  const card = useRef<HTMLDivElement>(null), you = useRef<HTMLSpanElement>(null);
  const narrow = useRef<boolean | null>(null);
  const [snap, setSnap] = useState<Snap>(START);
  // Once you touch the app, it's yours: the show stops steering it.
  const [mine, setMine] = useState<Week | null>(null);
  const mineRef = useRef(mine); mineRef.current = mine;
  const [draft, setDraft] = useState("");

  useShow({
    name: "build", end: B.end, subscribe,
    apply: (t) => {
      if (narrow.current === null && typeof matchMedia === "function") narrow.current = matchMedia("(max-width: 760px)").matches;
      const next: Snap = {
        n: narrow.current ? ASK.length : Math.round(seg(t, ...B.type) * ASK.length), press: t >= B.press && t < B.press + 0.18, built: t >= B.built, name: t >= B.name, stat: t >= B.stat,
        rows: t < B.rows ? 0 : Math.min(5, 1 + Math.floor((t - B.rows) / 0.08)), add: t >= B.add, made: t >= B.made, tapped: t >= B.tap, down: t >= B.tap && t < B.tap + 0.16,
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

  const week: Week = mine ?? { cooked: COOKED.map((v, j) => v || (j === TODAY && snap.tapped)), dishes: DINNERS };
  const count = week.cooked.filter(Boolean).length;
  const take = (f: (w: Week) => Week) => setMine((m) => f(m ?? week));
  const tick = (d: number) => take((w) => ({ ...w, cooked: w.cooked.map((v, j) => (j === d ? !v : v)) }));
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const name = draft.trim(); if (!name) return;
    take((w) => ({ cooked: w.cooked.map((v, j) => (j === TODAY ? true : v)), dishes: w.dishes.map((x, j) => (j === TODAY ? name : x)) }));
    setDraft("");
  };
  const built = snap.built || mine !== null;
  const shown = (k: keyof Snap) => (snap[k] || mine ? true : undefined);

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
        <p className={s.appName} data-in={shown("name")}>Home cooking<span>App</span></p>
        <div className={s.stat} data-in={shown("stat")}>
          <p aria-live="polite"><b key={count}>{count}</b> of {GOAL}<span>home-cooked dinners this week</span></p>
          <div className={s.pips} aria-hidden="true">{Array.from({ length: GOAL }, (_, i) => <i key={i} data-on={i < count || undefined} />)}</div>
        </div>
        <ul className={s.nights}>
          {DAYS.map((d, j) => (
            <li key={d} className={s.night} data-in={j < snap.rows || mine ? true : undefined} data-early={j < 2 || undefined} style={{ "--j": j } as React.CSSProperties}>
              <span className={s.nightDay} data-now={j === TODAY || undefined}>{j === TODAY ? "Tonight" : d}</span>
              <span className={s.nightDish} data-off={!week.cooked[j] || undefined}>{week.dishes[j]}</span>
              <button type="button" className={s.day} data-on={week.cooked[j] || undefined} data-now={j === TODAY || undefined} data-today={j === TODAY || undefined}
                data-down={(j === TODAY && snap.down) || undefined} tabIndex={built ? 0 : -1}
                onClick={() => tick(j)} aria-pressed={week.cooked[j]} aria-label={`Cooked at home, ${DAY_NAMES[j]}`}>
                <i><Tick /></i>
              </button>
            </li>
          ))}
        </ul>
        <form className={s.addRow} onSubmit={save} data-in={shown("add")}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Tonight’s dinner" aria-label="Tonight’s dinner" maxLength={28} tabIndex={built ? 0 : -1} />
          <button type="submit" disabled={!draft.trim()} tabIndex={built ? 0 : -1}>Save</button>
        </form>
        <p className={s.made} data-in={shown("made")}><span className={s.receiptMark}><AIGlyph name="openai" size={11} color="#fff" /></span>Made by ChatGPT</p>
      </div>
      <span ref={you} className={`${s.cur} ${s.curYou}`} aria-hidden="true"><Flag name="You" color={YOU} /></span>
    </div>
  );
}
