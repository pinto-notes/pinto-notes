"use client";

import { useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import s from "./i.module.css";

/// A plain note card in the app's look: a title, then lines. `who` marks the lines an AI wrote.
type Row = { text: string; box?: boolean; done?: boolean; who?: "chatgpt" | "claude" | "claude-code"; tint?: boolean; muted?: boolean };
const WHO = { chatgpt: { name: "ChatGPT", g: "openai" }, claude: { name: "Claude", g: "claude" }, "claude-code": { name: "Claude Code", g: "claude" } } as const;

export function NoteCard({ title, sub, rows, folder, className = "" }: { title: string; sub?: string; rows: Row[]; folder?: string; className?: string }) {
  return (
    <figure className={`${s.note} ${className}`}>
      <div className={s.noteBar} aria-hidden="true"><span className={s.lights}><i /><i /><i /></span>{folder && <span className={s.folder}>{folder}</span>}</div>
      <div className={s.paper}>
        <h3 className={s.noteTitle}>{title}</h3>
        {sub && <p className={s.noteSub}>{sub}</p>}
        <ul className={s.rows}>
          {rows.map((r, i) => (
            <li key={i} data-tint={r.tint || undefined} data-muted={r.muted || undefined}>
              {r.box ? <span className={s.box} data-on={r.done || undefined}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg></span> : <span className={s.dash}>–</span>}
              <span className={s.rowText} data-done={r.done || undefined}>{r.text}</span>
              {r.who && <span className={s.by}><AIGlyph name={WHO[r.who].g} size={11} />{WHO[r.who].name}</span>}
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}

/// A short chat in ChatGPT or Claude: a day label, your message, the tool line, the answer.
export function Bubble({ app, day, me, tool = "Used Pinto Notes", ai, className = "" }: { app: "chatgpt" | "claude"; day: string; me: string; tool?: string; ai: string; className?: string }) {
  return (
    <figure className={`${s.bubble} ${className}`} data-app={app}>
      <div className={s.bubbleTop}><span className={s.bubbleApp}><AIGlyph name={app === "chatgpt" ? "openai" : "claude"} size={14} />{app === "chatgpt" ? "ChatGPT" : "Claude"}</span><span className={s.day}>{day}</span></div>
      <p className={s.me}>{me}</p>
      <p className={s.tool}>{tool}</p>
      <p className={s.ai}>{ai}</p>
    </figure>
  );
}

/// "Made for…": three people, one tab each. Every tab is a finished picture.
const PEOPLE = [
  {
    id: "chat", tab: "You live in ChatGPT or Claude",
    line: "Everything you tell one AI is there for the next. Your preferences, your plans, the things you'd otherwise repeat in every chat.",
    note: { title: "About me", folder: "Notes", rows: [{ text: "Vegetarian, no mushrooms" }, { text: "Running a half marathon on 30 November" }, { text: "Prefers short answers", who: "chatgpt" as const, tint: true }] },
    ask: { app: "claude" as const, day: "Today", me: "Plan dinners for this week", ai: "Five vegetarian dinners, no mushrooms, and a pasta night before your long run." },
  },
  {
    id: "plans", tab: "You make plans",
    line: "Habits, budgets, trips and training plans that your AI keeps up to date with you, and that turn into small apps when a list isn't enough.",
    note: { title: "Budget, October", folder: "Home", rows: [{ text: "Groceries · 3,591 kr left" }, { text: "Eating out · 105 kr over", muted: false }, { text: "Rent added for the 25th", who: "chatgpt" as const, tint: true }] },
    ask: { app: "chatgpt" as const, day: "Today", me: "Rent is 9,200 on the 25th every month", ai: "Added it as a monthly bill. You have 410 kr a day left until the 31st." },
  },
  {
    id: "code", tab: "You write code",
    line: "Claude Code and Codex keep a shared work log and project notes, so the next session, and the next agent, starts where the last one stopped.",
    note: { title: "Work log", folder: "Work", rows: [{ text: "Fixed the sync retry on bad networks" }, { text: "Next: tests for the offline queue", who: "claude-code" as const, tint: true }, { text: "Blocked on the review of #214" }] },
    ask: undefined,
  },
];

export function MadeFor() {
  const [on, setOn] = useState(0);
  const p = PEOPLE[on];
  return (
    <div className={s.made}>
      <div className={s.tabs} role="tablist" aria-label="Made for">
        {PEOPLE.map((x, i) => (
          <button key={x.id} type="button" role="tab" aria-selected={i === on} className={s.tab} onClick={() => setOn(i)}>{x.tab}</button>
        ))}
      </div>
      <div className={s.madeBody} role="tabpanel" key={p.id}>
        <p className={s.madeLine}>{p.line}</p>
        <div className={s.madePics}>
          <NoteCard title={p.note.title} folder={p.note.folder} rows={p.note.rows} />
          {p.ask ? <Bubble {...p.ask} /> : (
            <figure className={s.term} aria-label="Claude Code reading the work log">
              <div className={s.termBar}><span className={s.lights}><i /><i /><i /></span><span>claude</span></div>
              <p className={s.prompt}><b>›</b> pick up where we left off</p>
              <p className={s.call}><span>⏺</span> pinto.read Work/Work log.md</p>
              <p className={s.out}>Last session fixed the sync retry. Next up: tests for the offline queue. Starting there.</p>
            </figure>
          )}
        </div>
      </div>
    </div>
  );
}
