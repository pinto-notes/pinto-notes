"use client";

import { useEffect, useState } from "react";
import { box, curve, ellipse, head, line, rng } from "./hand";
import { ADDED, DECIDED, GPT, hand, Receipt, Tick, WEEK } from "./Things";
import s from "./s.module.css";

// The AI chapter's payoff: the three things from the page come back as cards, and one request in
// ChatGPT changes each in turn as you scroll. Each card is the same thing as before, with the same
// words: the board keeps every branch, and the new step appears inside it. Every change is marked in
// ChatGPT's green, signed "Added by ChatGPT" under it (never over it), and Undo really takes it back.
// On a phone, one card at a time, with three markers.

const NAMES = ["Note", "Whiteboard", "App"];
const AT = [0.1, 0.36, 0.62];

export function AiCards({ subscribe }: { subscribe: (fn: (d: number) => void) => () => void }) {
  const [landed, setLanded] = useState(0);
  const [undone, setUndone] = useState([false, false, false]);
  const [pick, setPick] = useState<number | null>(null);
  useEffect(() => subscribe((d) => {
    const n = AT.filter((a) => d >= a).length;
    setLanded((o) => { if (o !== n) setPick(null); return n; });
  }), [subscribe]);
  const on = (i: number) => landed > i && !undone[i];
  const flip = (i: number) => setUndone((u) => u.map((v, k) => (k === i ? !v : v)));
  const active = pick ?? Math.max(0, landed - 1);
  const cards = [<NoteCard key="n" on={on(0)} />, <BoardCard key="b" on={on(1)} />, <AppCard key="a" on={on(2)} />];
  return (
    <div className={s.aStage}>
      <ol className={s.aCards} data-active={active}>
        {cards.map((c, i) => (
          <li key={i} className={`${s.aCard} ${[s.write, s.draw, s.build][i]}`} data-on={on(i) || undefined} data-current={i === active || undefined} aria-label={NAMES[i]}>
            {c}
            <div className={s.aFootRow} data-show={landed > i || undefined} aria-live="polite">
              <Receipt undone={undone[i]} onFlip={() => flip(i)} live={landed > i} />
            </div>
          </li>
        ))}
      </ol>
      <div className={s.markers} role="tablist" aria-label="What ChatGPT changed">
        {NAMES.map((n, i) => (
          <button key={n} type="button" role="tab" aria-selected={i === active} data-done={landed > i || undefined} onClick={() => setPick(i)}>{n}</button>
        ))}
      </div>
    </div>
  );
}

function NoteCard({ on }: { on: boolean }) {
  return (
    <div className={s.aNote}>
      <p className={s.aNoteTitle}>Lisbon, May 8–12</p>
      <p className={s.aDecided}><b>Decided:</b> {DECIDED}</p>
      <ul>
        <li data-done><i><Tick /></i>Book the flights</li>
        <li><i />Find a flat in Alfama</li>
        <li><i />Ask Marta about the fado place</li>
        <li className={s.aNew} data-on={on || undefined}><i /><span><b className={s.sweep} />{ADDED}</span></li>
      </ul>
    </div>
  );
}

/** Friday in Lisbon, the same board as the chapter before, folded to fit a card: every branch is
 *  still there, Claude's arrow still orange, and ChatGPT's Saturday hangs off the sunset. */
function BoardCard({ on }: { on: boolean }) {
  const r = rng(43);
  const T = (x: number, y: number, t: string[], size = 17) => (
    <text x={x} y={y + size * 0.34 - (t.length - 1) * size * 0.55} fontSize={size} textAnchor="middle" className={s.chalkText}>
      {t.map((l, j) => <tspan key={j} x={x} dy={j ? size * 1.1 : 0}>{l}</tspan>)}
    </text>
  );
  return (
    <svg className={`${s.aBoard} ${hand.className}`} viewBox="0 0 360 316" aria-hidden="true">
      <g className={s.chalk}>
        <path d={ellipse(r, 70, 36, 62, 24)} />
        <path d={box(r, 172, 13, 172, 46, 12)} />
        <path d={[line(r, 258, 84, 320, 124, 2), line(r, 320, 124, 258, 164, 2), line(r, 258, 164, 196, 124, 2), line(r, 196, 124, 258, 84, 2)].join(" ")} />
        <path d={box(r, 14, 102, 136, 44, 12)} />
        <path d={box(r, 184, 189, 150, 54, 12)} />
        <path d={ellipse(r, 84, 216, 80, 25)} />
        <path d={line(r, 134, 36, 168, 36, 0)} /><path d={head(r, [146, 36], [168, 36], 10)} />
        <path d={line(r, 258, 60, 258, 82, 0)} /><path d={head(r, [258, 66], [258, 82], 9)} />
        <path d={line(r, 194, 124, 152, 124, 0)} /><path d={head(r, [170, 124], [152, 124], 10)} />
        <path d={line(r, 258, 166, 258, 187, 0)} /><path d={head(r, [258, 172], [258, 187], 9)} />
        <path d={line(r, 82, 148, 84, 189, 0)} /><path d={head(r, [83, 170], [84, 189], 9)} />
      </g>
      <g className={s.chalkClaudeSm}><path d={curve(r, [182, 216], [176, 214], [172, 218], [166, 216], 1)} /><path d={head(r, [174, 216], [166, 216], 9)} /></g>
      {T(70, 36, ["Land 10:40"])}
      {T(258, 36, ["Bags to Alfama"])}
      {T(258, 124, ["Raining?"], 16)}
      {T(82, 124, ["Tile museum"])}
      {T(259, 216, ["Belém by", "the river"], 16)}
      {T(84, 216, ["Sunset at Graça"], 16)}
      <text x="172" y="114" fontSize="13.5" textAnchor="middle" className={s.chalkNote}>yes</text>
      <text x="274" y="182" fontSize="13.5" textAnchor="middle" className={s.chalkNote}>no</text>
      <g className={s.aNewInk} data-on={on || undefined}>
        <rect x="12" y="264" width="176" height="46" rx="12" fill={GPT} fillOpacity="0.28" />
        <g className={s.chalkGpt}>
          <path d={box(r, 12, 264, 176, 46, 12)} />
          <path d={line(r, 84, 243, 88, 262, 0)} /><path d={head(r, [87, 250], [88, 262], 8)} />
        </g>
        {T(100, 287, ["Saturday: Sintra"], 16)}
      </g>
    </svg>
  );
}

const ROWS: { name: string; days: number[]; ai?: boolean }[] = [
  { name: "Portuguese, 10 min", days: [0, 1, 2, 3] },
  { name: "Run, 5 km", days: [1, 3] },
  { name: "Walk 8,000 steps", days: [], ai: true },
];

function AppCard({ on }: { on: boolean }) {
  return (
    <div className={s.aApp}>
      <p className={s.aAppTop}><b>Before Lisbon</b><span>App</span></p>
      {ROWS.map((h) => (
        <div key={h.name} className={`${s.aHabit} ${h.ai ? s.aNew : ""}`} data-on={h.ai ? on || undefined : undefined}>
          <p><span>{h.ai && <b className={s.sweep} />}{h.name}</span>{h.ai ? <small>Sintra is all hills</small> : <small>{h.days.length} days</small>}</p>
          <div className={s.aWeek}>{WEEK.map((d, i) => <i key={i} data-on={h.days.includes(i) || undefined} data-now={i === 4 || undefined}><Tick /></i>)}</div>
        </div>
      ))}
    </div>
  );
}
