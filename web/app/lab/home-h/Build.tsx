"use client";

import { useEffect, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { useStage } from "./clock";
import h from "./h.module.css";

// The Habit tracker template, drawn from its own app (public/templates/apps/habit-tracker-light.png)
// so it stays sharp at this size. Told "I read 20 pages tonight", ChatGPT ticks Read: the row lights
// up and says who ticked it, the ring and the counts move with it.

const TICK_AT = 0.9;
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function Build() {
  const { ref, on, frozen } = useStage<HTMLElement>();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!on) return;
    if (frozen !== null) { setDone(frozen >= TICK_AT); return; }
    const id = setTimeout(() => setDone(true), TICK_AT * 1000);
    return () => clearTimeout(id);
  }, [on, frozen]);

  const pct = done ? 75 : 62.5;
  const habits = [
    { name: "Walk", sub: "30 minutes outside", streak: "3-day streak", week: [2, 2], state: "done" },
    { name: "Read", sub: "20 pages", streak: done ? "9-day streak" : "8-day streak", week: [2, done ? 2 : 0], state: done ? "done" : "open", ai: true },
    { name: "Water", sub: "5 of 8 glasses", streak: "2-day streak", week: [2, 1], state: "count" },
    { name: "No phone in bed", sub: "Charges in the kitchen", streak: "1-day streak", week: [2, 1], state: "open" },
  ];
  return (
    <figure ref={ref} className={h.buildFig}>
      <div className={`${h.frame} ${h.buildShot}`} role="img"
        aria-label="The Habit tracker app in Pinto Notes. Today: Walk and Read are done, Read ticked by ChatGPT. 6 of 8 since Monday.">
        <div className={h.app} aria-hidden="true">
          <div className={h.chrome}><i /><i /><i /><span>Habit tracker</span></div>
          <div className={h.appBody}>
            <nav className={h.side}>
              <p className={h.sideTitle}>Habit tracker</p>
              <p data-on="">
                <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.2" /><path d="m5.4 8.2 1.8 1.7 3.4-3.6" /></svg>Today
              </p>
              <p><svg viewBox="0 0 16 16"><rect x="2.2" y="3" width="11.6" height="10.8" rx="1.8" /><path d="M2.2 6.4h11.6M5.4 1.8v2.6M10.6 1.8v2.6" /></svg>Month</p>
              <p><svg viewBox="0 0 16 16"><path d="M7 4h7M7 8h7M7 12h7M2 4l1 1 2-2M2 8l1 1 2-2M2.4 12h1.6" /></svg>Habits</p>
            </nav>
            <div className={h.main}>
              <p className={h.date}>TUESDAY 10 NOVEMBER</p>
              <p className={h.today}>Today</p>
              <div className={h.cols}>
                <div className={h.left}>
                  <div className={h.ringCard}>
                    <svg className={h.ring} viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" />
                      <circle cx="50" cy="50" r="42" pathLength={100} style={{ strokeDasharray: `${pct} 100` }} />
                    </svg>
                    <b className={h.ringPct}>{Math.round(pct)}%</b>
                    <div>
                      <p className={h.cap}>SINCE MONDAY</p>
                      <p className={h.count}>{done ? 6 : 5} of 8</p>
                      <p className={h.small}>Today: {done ? 2 : 1} of 4 done</p>
                    </div>
                  </div>
                  <p className={h.cap} style={{ margin: "calc(24 * var(--u)) 0 calc(10 * var(--u)) calc(4 * var(--u))" }}>THIS WEEK</p>
                  <div className={h.week}>
                    <span />{DAYS.map((d, i) => <b key={i} data-now={i === 1 ? "" : undefined}>{d}</b>)}
                    {habits.map((x) => (
                      <div key={x.name} className={h.weekRow}>
                        <span>{x.name}</span>
                        {DAYS.map((_, i) => <i key={i} data-v={x.week[i] ?? 0} data-ai={x.ai && i === 1 && done ? "" : undefined} />)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={h.right}>
                  <p className={h.cap} style={{ margin: "0 0 calc(10 * var(--u)) calc(4 * var(--u))" }}>HABITS</p>
                  <ul className={h.habits}>
                    {habits.map((x) => (
                      <li key={x.name} data-ai={x.ai && done ? "" : undefined}>
                        <div>
                          <p className={h.hName}>{x.name}<svg viewBox="0 0 8 12"><path d="m2 2 4 4-4 4" /></svg>
                            {x.ai && <em className={h.who}><AIGlyph name="openai" size={11} />ChatGPT</em>}
                          </p>
                          <p className={h.small}>{x.sub} · <span className={h.streak}>{x.streak}</span></p>
                        </div>
                        {x.state === "count" ? (
                          <span className={h.counter}><i>−</i><i data-ring="">+</i></span>
                        ) : (
                          <span className={h.tick} data-done={x.state === "done" ? "" : undefined}>
                            <svg viewBox="0 0 24 24"><path d="m6.5 12.5 3.6 3.4 7.4-7.8" /></svg>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className={h.said}><AIGlyph name="openai" size={16} /><span>Told ChatGPT:</span> “I read 20 pages tonight.”</figcaption>
    </figure>
  );
}
