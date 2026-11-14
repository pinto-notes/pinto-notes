"use client";

import { useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import s from "./t.module.css";

// The pieces the story is made of: the named cursors (the page's signature: you, ChatGPT and Claude
// working in the same note), the receipt an AI's change leaves (what it did, and Undo), a tick.

export type Who = "gpt" | "claude" | "you";
export const NAME: Record<Who, string> = { gpt: "ChatGPT", claude: "Claude", you: "You" };

export function Logo({ who, size }: { who: Who; size: number }) {
  if (who === "you") return null;
  return <AIGlyph name={who === "gpt" ? "openai" : "claude"} size={size} />;
}

export const Tick = () => <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.4l2.7 2.7L12.2 5.2" /></svg>;

/** A named cursor. Its tip is the element's top-left corner, so the timeline places the tip. */
export function Cursor({ who, k }: { who: Who; k: string }) {
  return (
    <div className={s.cursor} data-who={who} data-k={k} aria-hidden="true">
      <svg viewBox="0 0 22 26"><path d="M1.6 1.6 L1.6 20.4 L6.9 15.6 L10.5 23.6 L14.1 22 L10.6 14.2 L17.6 14 Z" /></svg>
      <span className={s.flag}><Logo who={who} size={13} />{NAME[who]}</span>
    </div>
  );
}

/** What an AI did, and Undo. Undo really works: it hides what the AI added (the elements marked
 *  with the same data-off-id), and Redo brings it back. */
export function Receipt({ who, did, k, id, undoAnchor }: { who: Who; did: string; k: string; id: string; undoAnchor?: string }) {
  const [off, setOff] = useState(false);
  const flip = () => {
    const next = !off;
    setOff(next);
    document.querySelectorAll(`[data-off-id="${id}"]`).forEach((e) => e.toggleAttribute("data-off", next));
  };
  return (
    <p className={s.pill} data-who={who} data-k={k}>
      <Logo who={who} size={15} />
      <span>{off ? "Undone" : did}</span>
      <button type="button" onClick={flip} data-a={undoAnchor} aria-label={off ? `Redo: ${did}` : `Undo: ${did}`}>{off ? "Redo" : "Undo"}</button>
    </p>
  );
}

/** The receipt after you pressed Undo in the story (the last beat). */
export function Undone({ k }: { k: string }) {
  return (
    <p className={`${s.pill} ${s.pillDone}`} data-who="you" data-k={k} aria-hidden="true">
      <svg viewBox="0 0 16 16"><path d="M5.5 4.5 L2.8 7.2 L5.5 9.9 M3 7.2 H10 a3.2 3.2 0 0 1 0 6.4 H7.5" /></svg>
      <span>Undone. The rest week is gone.</span>
    </p>
  );
}
