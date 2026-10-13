"use client";

import { useEffect, useRef, useState } from "react";
import { NoteBody, WhoMark, type Line, type Who } from "../kit";
import s from "./d.module.css";

// The hero's one motion: a real plan on the desk. A moment after it's in view ChatGPT ticks two
// items (they take the app's tint) and its chip comes up; then you tick one, and the chip says so.
// It plays once. With reduced motion, or before the page's script runs, the note shows the end.

const ITEMS = ["Book the van for Saturday", "Cancel the old internet", "Change my address at the bank", "Pack the kitchen", "Pick up the keys from Anna"];
const BY_AI = [0, 1];
const BY_YOU = 3;
/** When each step lands, in ms after the note is in view: tick, tick, chip, your tick and chip. */
export const STEPS = [900, 1250, 1500, 3300];
const END = STEPS.length;

/// The order the ticks land in: "ai-first" (home-d: ChatGPT ticks two, then you one) or "ai-last"
/// (home-g: you tick one, then ChatGPT two, so it rests on the AI's work).
export type Order = "ai-first" | "ai-last";

/// The note's lines at a step: 0 before anything, END when ChatGPT and you have both ticked.
export function linesAt(step: number, order: Order = "ai-first"): Line[] {
  // ai-last: your tick lands at step 1, ChatGPT's two at steps 2 and 3, its chip at step 4.
  const youAt = order === "ai-first" ? END : 1;
  const aiAt = (k: number) => (order === "ai-first" ? k + 1 : k + 2);
  return [
    { k: "p", text: "Moving on the 18th. One thing a day, nothing heroic.", quiet: true },
    ...ITEMS.map((text, i): Line => {
      const ai = BY_AI.indexOf(i);
      const byAI = ai >= 0 && step >= aiAt(ai);
      const done = byAI || (i === BY_YOU && step >= youAt);
      return { k: done ? "done" : "todo", text, tint: byAI };
    }),
  ];
}
export function chipAt(step: number, order: Order = "ai-first"): { who: Who; text: string } | null {
  if (order === "ai-last") {
    if (step >= END) return { who: "chatgpt", text: "ChatGPT ticked 2" };
    if (step >= 1) return { who: "you", text: "You ticked 1" };
    return null;
  }
  if (step >= END) return { who: "you", text: "You ticked 1" };
  if (step >= 3) return { who: "chatgpt", text: "ChatGPT ticked 2" };
  return null;
}

/** ai-last's times: your tick, ChatGPT's two, its chip. */
const STEPS_AI_LAST = [900, 2400, 2750, 3000];

export default function HeroNote({ order = "ai-first" }: { order?: Order } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(END); // complete at rest
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setStep(0);
    let ts: number[] = [];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      ts = (order === "ai-last" ? STEPS_AI_LAST : STEPS).map((at, k) => window.setTimeout(() => setStep(k + 1), at));
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); ts.forEach(clearTimeout); };
  }, [order]);
  const chip = chipAt(step, order);
  return (
    <div ref={ref} className={s.note} aria-label="A note called Moving. ChatGPT ticked Book the van and Cancel the old internet; you ticked Pack the kitchen.">
      <p className={s.noteTitle}>Moving</p>
      <div aria-hidden="true"><NoteBody lines={linesAt(step, order)} size="s" /></div>
      <span className={s.noteChip} key={chip?.text ?? "none"} data-on={chip ? "" : undefined} aria-hidden="true">
        {chip && <><WhoMark who={chip.who} size={11} />{chip.text}</>}
      </span>
    </div>
  );
}
