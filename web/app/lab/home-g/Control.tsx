"use client";

import { AIGlyph } from "@/lib/ai-glyphs";
import { WhoMark, type Who } from "../kit";
import { Credit, Lines, useStory, type Row } from "../home-d/story";
import d from "../home-d/d.module.css";
import s from "./g.module.css";

// "You decide what your AI can touch.", told over time on one stage: the app's own approval sheet
// (its words from Pane/Views/ConnectAI.swift), Read and edit chosen, a change landing in a note with
// its credit, and Undo taking it back. Same rules as the other stories (home-d/story.tsx).

/** The sheet's words, as the Mac app shows them to someone connecting ChatGPT. */
export const SHEET = {
  title: "Allow ChatGPT to use your notes?",
  detail: "Access goes to chatgpt.com. Locked notes stay private.",
  edit: "Read and edit",
  read: "Read only",
  editLine: "It can read, create and change notes. Every change keeps the previous version.",
  readLine: "It can read notes, but not change them.",
  allow: "Allow",
  deny: "Don’t Allow",
  hint: "Confirms with Touch ID or your password",
};

type Step = { who: Who; credit: string; undo?: boolean };
export const STEPS: Step[] = [
  { who: "chatgpt", credit: "ChatGPT asks first" },
  { who: "you", credit: "You allow Read and edit" },
  { who: "chatgpt", credit: "ChatGPT added 1 line", undo: true },
  { who: "you", credit: "You pressed Undo" },
];

/// The note at a step: ChatGPT's line is in, and tinted, at step 2 only.
export function noteAt(step: number): Row[] {
  return [
    { key: "a", k: "p", text: "Sara and Jonas on Sunday. Something easy, eaten outside.", in: true },
    { key: "b", k: "done", text: "Ask about the vegetarian option", in: true },
    { key: "c", k: "todo", text: "Buy lemons and good bread", in: true },
    { key: "d", k: "todo", text: "Book the table at Trindade for 19:00", in: step === 2, tint: step === 2 },
  ];
}

export default function Control() {
  const { ref, step, jump } = useStory<HTMLDivElement>(STEPS.length, 2100);
  const edit = step >= 1;
  return (
    <div ref={ref} className={d.story}>
      <div className={s.stage} data-scene={step < 2 ? "sheet" : "note"}>
        <figure className={s.sheet} aria-label={`${SHEET.title} ${SHEET.detail} Access: ${SHEET.edit} or ${SHEET.read}.`} aria-hidden={step >= 2 || undefined}>
          <span className={s.sheetIcon} aria-hidden="true"><AIGlyph name="openai" size={30} /></span>
          <p className={s.sheetTitle}>{SHEET.title}</p>
          <p className={s.sheetDetail}>{SHEET.detail}</p>
          <span className={s.segmented} aria-hidden="true">
            <i data-on={edit || undefined}>{SHEET.edit}</i><i data-on={!edit || undefined}>{SHEET.read}</i>
          </span>
          <p className={s.sheetLine}>{edit ? SHEET.editLine : SHEET.readLine}</p>
          <span className={s.allow} data-pressed={step === 1 || undefined} aria-hidden="true">{SHEET.allow}</span>
          <span className={s.deny} aria-hidden="true">{SHEET.deny}</span>
        </figure>
        <figure className={`${d.window} ${s.note}`} aria-label="A note called Sunday dinner. ChatGPT added a line, Book the table at Trindade for 19:00, and you pressed Undo, so the note is as it was." aria-hidden={step < 2 || undefined}>
          <div className={d.windowBar} aria-hidden="true"><span className={d.lights}><i /><i /><i /></span><span>Home</span></div>
          <div className={d.windowPaper} aria-hidden="true">
            <p className={d.windowTitle}>Sunday dinner</p>
            <Lines rows={noteAt(step)} />
          </div>
        </figure>
      </div>
      <div className={d.creditRow}><Credit key={step} who={STEPS[step].who} text={STEPS[step].credit} undo={STEPS[step].undo} /></div>
      <div className={`${d.steps} ${s.center}`} role="group" aria-label="Steps">
        {STEPS.map((t, k) => (
          <button key={k} type="button" className={d.stepButton} data-icon="" aria-pressed={k === step} aria-label={`Step ${k + 1}: ${t.credit}`} onClick={() => jump(k)}>
            <WhoMark who={t.who} size={13} />
          </button>
        ))}
      </div>
    </div>
  );
}
