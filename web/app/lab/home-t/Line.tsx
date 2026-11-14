"use client";

import { useState } from "react";
import { Logo, NAME, type Who } from "./Parts";
import e from "./e.module.css";

/** One line of the note in the ending, with who wrote it. An AI's line has an Undo that works. */
export function Line({ who, text, undo }: { who: Who; text: string; undo?: boolean }) {
  const [off, setOff] = useState(false);
  return (
    <div className={e.line} data-who={who} data-off={off || undefined}>
      <span className={e.by}><Logo who={who} size={13} />{NAME[who]}</span>
      <span className={e.lineText}>{text}</span>
      {undo && (
        <button type="button" className={e.undo} onClick={() => setOff((v) => !v)} aria-label={`${off ? "Redo" : "Undo"}: ${text}`}>
          {off ? "Redo" : "Undo"}
        </button>
      )}
    </div>
  );
}
