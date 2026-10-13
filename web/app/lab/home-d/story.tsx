"use client";

// The story sections' clock and their note lines. A story shows one note and plays its changes one
// at a time (docs/DESIGN.md, Motion): it starts when the section is half in view, pauses when it
// leaves, and replays once when it comes back after finishing; never in a loop. Any step can be
// picked. With Reduce Motion, or before the page's script runs, it rests on the last step.

import { useCallback, useEffect, useRef, useState } from "react";
import { WhoMark, type Who } from "../kit";
import s from "./d.module.css";

export function useStory<T extends HTMLElement>(count: number, stepMs: number) {
  const ref = useRef<T>(null);
  const [step, setStep] = useState(count - 1);
  const run = useRef({ step: count - 1, timer: 0, visible: false, plays: 0, done: true, still: true });

  const go = useCallback((k: number) => { run.current.step = k; setStep(k); }, []);
  const tick = useCallback(() => {
    const r = run.current;
    window.clearTimeout(r.timer);
    if (r.still || !r.visible || r.done) return;
    r.timer = window.setTimeout(() => {
      if (r.step >= count - 1) { r.done = true; return; }
      go(r.step + 1);
      if (r.step >= count - 1) r.done = true; else tick();
    }, stepMs);
  }, [count, stepMs, go]);

  useEffect(() => {
    const r = run.current;
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    r.still = false; r.done = false;
    go(0);
    const io = new IntersectionObserver(([e]) => {
      r.visible = e.isIntersecting;
      if (!r.visible) { window.clearTimeout(r.timer); return; }
      if (r.done) {
        if (r.plays >= 2) return; // played, and replayed once
        r.done = false; go(0); r.plays++;
      } else if (r.plays === 0) r.plays = 1;
      tick();
    }, { threshold: 0.5 });
    io.observe(el);
    return () => { io.disconnect(); window.clearTimeout(r.timer); };
  }, [go, tick]);

  /// Picking a step shows it, and the story goes on from there (or stays, if it was the last).
  const jump = useCallback((k: number) => {
    const r = run.current;
    go(k);
    r.done = k >= count - 1;
    tick();
  }, [count, go, tick]);

  return { ref, step, jump };
}

export type Row = { key: string; k: "p" | "h" | "todo" | "done"; text: string; by?: Who; in: boolean; tint?: boolean; now?: boolean };

/// A note's lines as the app draws them. Lines not written yet keep their place (the note never
/// changes height); a line arrives with one blur-in; only the change being told is tinted, and the
/// margin marks who wrote each run, the current one full strength and the earlier ones faded.
export function Lines({ rows, marks = false }: { rows: Row[]; marks?: boolean }) {
  return (
    <div className={s.lines} data-marks={marks || undefined}>
      {rows.map((r, i) => {
        const first = r.by && rows[i - 1]?.by !== r.by;
        return (
          <div key={r.key} className={s.row} data-k={r.k} data-in={r.in || undefined} data-tint={r.tint || undefined}>
            {marks && <span className={s.mark} data-now={r.now || undefined}>{first && r.by ? <WhoMark who={r.by} size={11} /> : null}</span>}
            {(r.k === "todo" || r.k === "done") && <span className={s.circle} data-done={r.k === "done" || undefined} aria-hidden="true">{r.k === "done" && <Check />}</span>}
            <span className={s.rowText}>{r.text}</span>
          </div>
        );
      })}
    </div>
  );
}

export const Check = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>;

/// Who made the change being told, in the app's receipt style.
export function Credit({ who, text, undo = false }: { who: Who; text: string; undo?: boolean }) {
  return (
    <span className={s.credit}>
      <WhoMark who={who} size={11} />{text}{undo && <><i aria-hidden="true" /><b>Undo</b></>}
    </span>
  );
}
