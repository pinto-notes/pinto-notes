import { AIGlyph } from "@/lib/ai-glyphs";
import { Credit, Lines, type Row } from "../home-d/story";
import d from "../home-d/d.module.css";
import s from "./g.module.css";

// "You decide what your AI can touch.", in one still picture: the app's own approval sheet (its words
// from Pane/Views/ConnectAI.swift) with Read and edit chosen, then the note ChatGPT changed, its line
// tinted and its receipt with Undo. Nothing to wait for: the first look is the whole story.

/** The sheet's words, as the Mac app shows them to someone connecting ChatGPT. */
export const SHEET = {
  title: "Allow ChatGPT to use your notes?",
  detail: "Access goes to chatgpt.com. Locked notes stay private.",
  edit: "Read and edit",
  read: "Read only",
  editLine: "It can read, create and change notes. Every change keeps the previous version.",
  allow: "Allow",
  deny: "Don’t Allow",
};

/** The note after ChatGPT's change: its one line tinted. */
export const NOTE: Row[] = [
  { key: "a", k: "p", text: "Sara and Jonas on Sunday. Something easy, eaten outside.", in: true },
  { key: "b", k: "done", text: "Ask about the vegetarian option", in: true },
  { key: "c", k: "todo", text: "Buy lemons and good bread", in: true },
  { key: "d", k: "todo", text: "Book the table at Trindade for 19:00", in: true, tint: true },
];

export default function Control() {
  return (
    <div className={s.pair}>
      <figure className={s.sheet} aria-label={`${SHEET.title} ${SHEET.detail} Read and edit is chosen.`}>
        <span className={s.sheetIcon} aria-hidden="true"><AIGlyph name="openai" size={30} /></span>
        <p className={s.sheetTitle}>{SHEET.title}</p>
        <p className={s.sheetDetail}>{SHEET.detail}</p>
        <span className={s.segmented} aria-hidden="true"><i data-on="">{SHEET.edit}</i><i>{SHEET.read}</i></span>
        <p className={s.sheetLine}>{SHEET.editLine}</p>
        <span className={s.allow} aria-hidden="true">{SHEET.allow}</span>
        <span className={s.deny} aria-hidden="true">{SHEET.deny}</span>
      </figure>
      <span className={s.then} aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16M14 6l6 6-6 6" /></svg>
      </span>
      <figure className={`${d.window} ${s.note}`} aria-label="Then, in a note called Sunday dinner, ChatGPT added a line, Book the table at Trindade for 19:00, tinted, with Undo.">
        <div className={d.windowBar} aria-hidden="true"><span className={d.lights}><i /><i /><i /></span><span>Home</span></div>
        <div className={`${d.windowPaper} ${s.notePaper}`} aria-hidden="true">
          <p className={d.windowTitle}>Sunday dinner</p>
          <Lines rows={NOTE} />
          <div className={s.receipt}><Credit who="chatgpt" text="ChatGPT added 1 line" undo /></div>
        </div>
      </figure>
    </div>
  );
}
