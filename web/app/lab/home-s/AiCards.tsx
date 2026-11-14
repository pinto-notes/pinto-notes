"use client";

import { useEffect, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { box, curve, ellipse, head, line, rng } from "./hand";
import { GPT, hand, Tick, WEEK } from "./Things";
import s from "./s.module.css";

// The AI chapter's payoff: the three things from the page come back as cards, and one request in
// ChatGPT changes each in turn as you scroll. Every change is marked in ChatGPT's green, signed
// "Added by ChatGPT", and Undo really takes it back (Redo puts it back). On a phone, one card at a
// time, with three markers.

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
            <p className={s.receipt} data-show={landed > i || undefined} aria-live="polite">
              {undone[i]
                ? <><span>Undone</span><button type="button" onClick={() => flip(i)}>Redo</button></>
                : <><span className={s.receiptMark}><AIGlyph name="openai" size={13} color="#fff" /></span><span>Added by ChatGPT</span><button type="button" onClick={() => flip(i)} tabIndex={landed > i ? 0 : -1}>Undo</button></>}
            </p>
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
      <ul>
        <li data-done><i><Tick /></i>Book the flights</li>
        <li><i />Find a flat in Alfama</li>
        <li><i />Pastéis de Belém, before the queue</li>
        <li><i />Ask Marta about Sintra</li>
        <li className={s.aNew} data-on={on || undefined}><i /><span><b className={s.sweep} />Train to Sintra, Sat 9:10 from Rossio</span></li>
      </ul>
    </div>
  );
}

function BoardCard({ on }: { on: boolean }) {
  const r = rng(43);
  return (
    <svg className={`${s.aBoard} ${hand.className}`} viewBox="0 0 340 214" aria-hidden="true">
      <g className={s.chalk}>
        <path d={ellipse(r, 66, 46, 58, 28)} />
        <path d={box(r, 168, 20, 140, 54, 14)} />
        <path d={ellipse(r, 96, 160, 86, 30)} />
        <path d={line(r, 126, 46, 164, 46, 0)} />
        <path d={head(r, [134, 46], [164, 46], 11)} />
        <path d={curve(r, [222, 78], [206, 112], [178, 136], [152, 144], 1)} />
        <path d={head(r, [178, 136], [152, 144], 11)} />
      </g>
      <text x="66" y="53" fontSize="19" textAnchor="middle" className={s.chalkText}>Land 10:40</text>
      <text x="238" y="53" fontSize="19" textAnchor="middle" className={s.chalkText}>Alfama</text>
      <text x="96" y="167" fontSize="19" textAnchor="middle" className={s.chalkText}>Sunset at Graça</text>
      <g className={s.aNewInk} data-on={on || undefined}>
        <rect x="214" y="134" width="114" height="54" rx="14" fill={GPT} fillOpacity="0.32" />
        <g className={s.chalkGpt}>
          <path d={box(r, 214, 134, 114, 54, 14)} />
          <path d={line(r, 184, 160, 210, 160, 0)} />
          <path d={head(r, [190, 160], [210, 160], 10)} />
        </g>
        <text x="271" y="158" fontSize="17" textAnchor="middle" className={s.chalkText}>Saturday:</text>
        <text x="271" y="178" fontSize="17" textAnchor="middle" className={s.chalkText}>Sintra</text>
      </g>
    </svg>
  );
}

const ROWS: { name: string; days: number; ai?: boolean }[] = [
  { name: "Portuguese, 10 min", days: 4 },
  { name: "Run, 5 km", days: 2 },
  { name: "Walk 8,000 steps", days: 0, ai: true },
];

function AppCard({ on }: { on: boolean }) {
  return (
    <div className={s.aApp}>
      <p className={s.aAppTop}><b>Before Lisbon</b><span>App</span></p>
      {ROWS.map((h) => (
        <div key={h.name} className={`${s.aHabit} ${h.ai ? s.aNew : ""}`} data-on={h.ai ? on || undefined : undefined}>
          <p><span>{h.ai && <b className={s.sweep} />}{h.name}</span>{h.ai ? <small>Sintra is all hills</small> : <small>{h.days} days</small>}</p>
          <div className={s.aWeek}>{WEEK.map((d, i) => <i key={i} data-on={(!h.ai && (h.name.startsWith("Run") ? i === 1 || i === 3 : i < h.days)) || undefined} data-now={i === 4 || undefined}><Tick /></i>)}</div>
        </div>
      ))}
    </div>
  );
}
