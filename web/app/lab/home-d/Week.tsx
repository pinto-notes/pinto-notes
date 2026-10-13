"use client";

import { Credit, useStory } from "./story";
import { Check } from "./story";
import type { Who } from "../kit";
import s from "./d.module.css";

// "Plans don't die here.", told over time on one plan: Monday you write it, Wednesday ChatGPT ticks
// two runs, Friday Claude moves Thursday's run to Sunday. A dot walks the rail; the card changes in place.

export const DAYS: { day: string; who: Who; credit: string }[] = [
  { day: "Mon", who: "you", credit: "You wrote the plan" },
  { day: "Wed", who: "chatgpt", credit: "ChatGPT ticked 2" },
  { day: "Fri", who: "claude", credit: "Claude moved 1" },
];

/// The plan's runs at a day: which are ticked, which slot each sits in, and which the day changed.
export function runsAt(day: number) {
  return [
    { key: "mon", text: "Mon · 5 km easy", done: day >= 1, slot: 0, tint: day === 1 },
    { key: "wed", text: "Wed · Intervals, 6 × 400 m", done: day >= 1, slot: 1, tint: day === 1 },
    { key: "thu", text: day >= 2 ? "Sun · 5 km easy, moved from Thursday" : "Thu · 5 km easy", done: false, slot: day >= 2 ? 3 : 2, tint: day === 2 },
    { key: "sat", text: "Sat · Long run, 12 km", done: false, slot: day >= 2 ? 2 : 3, tint: false },
  ];
}

export default function Week() {
  const { ref, step, jump } = useStory<HTMLDivElement>(DAYS.length, 2000);
  return (
    <div ref={ref} className={s.weekStory}>
      <div className={s.rail} role="group" aria-label="Days">
        <span className={s.railDot} style={{ "--at": step } as React.CSSProperties} aria-hidden="true" />
        {DAYS.map((d, k) => (
          <button key={d.day} type="button" className={s.railStop} aria-pressed={k === step} onClick={() => jump(k)}>{d.day}</button>
        ))}
      </div>
      <figure className={s.plan} aria-label="A running plan. On Wednesday ChatGPT ticked Monday's and Wednesday's runs; on Friday Claude moved Thursday's run to Sunday.">
        <div className={s.planHead} aria-hidden="true">
          <p className={s.planTitle}>Running plan</p>
          <Credit key={step} who={DAYS[step].who} text={DAYS[step].credit} />
        </div>
        <p className={s.planLede} aria-hidden="true">Half marathon on 30 November. Four runs a week.</p>
        <div className={s.runs} aria-hidden="true">
          {runsAt(step).map((r) => (
            <div key={r.key} className={s.run} style={{ "--slot": r.slot } as React.CSSProperties} data-tint={r.tint || undefined}>
              <span className={s.circle} data-done={r.done || undefined}>{r.done && <Check />}</span>
              <span className={s.rowText}>{r.text}</span>
            </div>
          ))}
        </div>
      </figure>
    </div>
  );
}
