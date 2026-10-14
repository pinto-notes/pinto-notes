"use client";

import { WhoMark, type Who } from "../kit";
import { Credit, Lines, useStory, type Row } from "./story";
import s from "./d.module.css";

// "Every AI you use, one notebook.", told over time on one note: you write the goal, Claude adds two
// next steps, you tick one, ChatGPT adds an idea. Only the change being told is tinted and credited.

type Step = { who: Who; label: string; credit: string; undo?: boolean };
export const STEPS: Step[] = [
  { who: "you", label: "You write", credit: "You wrote the goal" },
  { who: "claude", label: "Claude adds", credit: "Claude added 2" },
  { who: "you", label: "You tick", credit: "You ticked 1" },
  { who: "chatgpt", label: "ChatGPT adds", credit: "ChatGPT added 1 line", undo: true },
];

/// The note at a step (0 to 3).
export function rowsAt(step: number): Row[] {
  return [
    { key: "goal", k: "p", text: "Get the site up before the spring market: menu, opening hours, preorders.", by: "you", in: true, now: step === 0 },
    { key: "h", k: "h", text: "Next steps", by: "claude", in: step >= 1, tint: step === 1, now: step === 1 },
    { key: "hours", k: step >= 2 ? "done" : "todo", text: "Opening hours in the footer", by: "claude", in: step >= 1, tint: step === 1, now: step === 1 },
    { key: "orders", k: "todo", text: "Take preorders by email", by: "claude", in: step >= 1, tint: step === 1, now: step === 1 },
    { key: "special", k: "todo", text: "Sunday special at the top", by: "chatgpt", in: step >= 3, tint: step === 3, now: step === 3 },
  ];
}

/// The whole note at every step (home-g): nothing waits to arrive, so any frame a fast scroll catches
/// is a finished note. The story only moves the tint, the margin's marks and the chip.
export function rowsComplete(step: number): Row[] {
  const by = (who: Who, at: number) => ({ by: who, in: true, tint: step === at && who !== "you", now: step === at });
  return [
    { key: "goal", k: "p", text: "Get the site up before the spring market: menu, opening hours, preorders.", ...by("you", 0) },
    { key: "h", k: "h", text: "Next steps", ...by("claude", 1) },
    { key: "hours", k: step >= 2 ? "done" : "todo", text: "Opening hours in the footer", ...by("claude", 1), now: step === 1 || step === 2 },
    { key: "orders", k: "todo", text: "Take preorders by email", ...by("claude", 1) },
    { key: "ideas", k: "h", text: "Ideas", by: "you", in: true },
    { key: "photo", k: "bullet", text: "A photo of the sourdough on the front page", by: "you", in: true },
    { key: "special", k: "bullet", text: "Sunday special at the top", ...by("chatgpt", 3) },
  ];
}

/// Where each step's author label sits in the complete note: the line the change is on.
const LABEL_AT = ["goal", "h", "hours", "special"];

/// `icons`: the steps under the note as the four marks alone (each still named for a screen reader);
/// the step's words are in the note's chip.
export default function Notebook({ icons = false, complete = false }: { icons?: boolean; complete?: boolean } = {}) {
  const { ref, step, jump } = useStory<HTMLDivElement>(STEPS.length, 1900);
  const now = STEPS[step];
  return (
    <div ref={ref} className={s.story} data-complete={complete || undefined}>
      <figure className={s.window} aria-label="A note called Bakery website. You wrote the goal, Claude added two next steps, you ticked one, and ChatGPT added Sunday special at the top.">
        <div className={s.windowBar} aria-hidden="true"><span className={s.lights}><i /><i /><i /></span><span>Work</span></div>
        <div className={s.windowPaper} aria-hidden="true">
          <p className={s.windowTitle}>Bakery website</p>
          <Lines rows={complete ? rowsComplete(step) : rowsAt(step)} marks
            label={complete ? { key: LABEL_AT[step], who: STEPS[step].who } : undefined} />
          <div className={s.creditRow}><Credit key={step} who={now.who} text={now.credit} undo={now.undo} /></div>
        </div>
      </figure>
      <div className={s.steps} role="group" aria-label="Steps">
        {STEPS.map((t, k) => (
          <button key={k} type="button" className={s.stepButton} data-icon={icons || undefined} aria-pressed={k === step} aria-label={icons ? `Step ${k + 1}: ${t.credit}` : undefined} onClick={() => jump(k)}>
            <WhoMark who={t.who} size={icons ? 20 : 11} />{!icons && t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
