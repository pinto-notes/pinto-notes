"use client";

import { AIGlyph } from "@/lib/ai-glyphs";
import { useEffect, useState } from "react";
import { Note, Stroke } from "./Pen";
import { Reveal, still, useOnce } from "./Reveal";
import r from "./r.module.css";

// Write: one note, as a page. No window around it: the paper itself, big. It types its title when it
// comes into view, and its checklist is real; tick it. The pen note in the margin answers.
//
// The AI section shows the same note a moment later, after a line said to ChatGPT: the hotel ticked
// and its line added, with ChatGPT's mark and Undo, the way the app shows who changed what.

const Tick = () => <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.4l2.6 2.6L12 5.4" /></svg>;

const TITLE = "Lisbon in May";
const LIST = ["Book the flights", "Find a hotel", "Ask Ana about the fado place", "Tram 28 before nine", "Pack the good camera"];

export function Page() {
  const [typed, setTyped] = useState(TITLE.length);
  const [on, setOn] = useState<boolean[]>([true, false, false, false, false]);
  const ref = useOnce<HTMLDivElement>(() => {
    let n = 0;
    const id = setInterval(() => { n += 1; setTyped(n); if (n >= TITLE.length) clearInterval(id); }, 70);
  }, 0.5);
  // Below the fold with motion on: start with an empty title, so it can type itself in view.
  useEffect(() => {
    const el = ref.current;
    if (el && !still() && el.getBoundingClientRect().top > innerHeight * 0.6) setTyped(0);
  }, [ref]);
  const done = on.filter(Boolean).length;
  const all = done === LIST.length;
  return (
    <div ref={ref} className={r.page}>
      <p className={r.pageDate}>Friday 9 May, 08:12</p>
      <h3 className={r.pageTitle} aria-label={TITLE}>
        <span aria-hidden="true">{TITLE.slice(0, typed)}</span>
        <i className={r.caret} data-typing={typed < TITLE.length || undefined} aria-hidden="true" />
      </h3>
      <p className={r.pageText}>Three days. Walk everywhere, eat early, one night of fado.</p>
      <p className={r.pageHead}>Before we go</p>
      <ul className={r.check}>
        {LIST.map((t, i) => (
          <li key={t}>
            <button type="button" aria-pressed={on[i]} onClick={() => setOn((o) => o.map((v, k) => (k === i ? !v : v)))}>
              <i className={r.box} data-on={on[i] || undefined}><Tick /></i>
              <span>{t}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className={r.pageNote} aria-live="polite">
        <Stroke className={r.pageArrow} w={92} h={70} i={1} d={["M88 8 C 60 6, 30 20, 18 52", "M8 40 L 17 56 L 32 46"]} />
        <Note i={2} className={r.pageSay} key={all ? "a" : done > 1 ? "b" : "c"}>
          {all ? "Packed. See you in Lisbon." : done > 1 ? "Satisfying, isn't it?" : "Go on, tick one."}
        </Note>
      </div>
    </div>
  );
}

/** The same note after "Put it in my Lisbon note", said to ChatGPT. Plays once in view. Undo works:
 *  it takes ChatGPT's change back, and Redo puts it back. */
export function Changed() {
  const [undone, setUndone] = useState(false);
  return (
    <Reveal className={r.changed} threshold={0.6}>
      <p className={r.cTitle}>Lisbon in May</p>
      <ul className={r.check} data-small="">
        <li><span className={r.row}><i className={r.box} data-on=""><Tick /></i><span>Book the flights</span></span></li>
        <li data-ai="">
          <span className={r.row}><i className={`${r.box} ${r.aiTick}`} data-on={undone ? undefined : ""}><Tick /></i><span className={r.aiDone}>Find a hotel</span></span>
          <span className={r.added} data-undone={undone || undefined}>
            <span className={r.addedText}>Memmo Príncipe Real, 12 to 15 May</span>
            <span className={r.mark}>
              <em><AIGlyph name="openai" size={12} />{undone ? "Undone" : "Added by ChatGPT"}</em>
              <button type="button" onClick={() => setUndone((u) => !u)}>{undone ? "Redo" : "Undo"}</button>
            </span>
          </span>
        </li>
        <li><span className={r.row}><i className={r.box} /><span>Ask Ana about the fado place</span></span></li>
      </ul>
    </Reveal>
  );
}
