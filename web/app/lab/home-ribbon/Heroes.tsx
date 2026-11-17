"use client";

import { useEffect, useState } from "react";
import { AIGlyph, AI_GLYPHS as AI_GLYPH_PATH } from "@/lib/ai-glyphs";
import { Cta } from "./Cta";
import { Ribbon, type Item, type Shape } from "./Ribbon";
import r from "./ribbon.module.css";
import s from "./s.module.css";

// Round 26 (`ribbon`), the first screen's ideas. Each keeps the headline's words, Emil's line word for
// word, the buttons and the cream page; each owns the whole first screen, so the Notes chapter arrives
// only once you scroll.

const LEDE = "Simple notes, whiteboards and apps. ChatGPT and Claude work in all three with you, and can read what you decided.";

/** What runs through the ribbon: what you'd type to ChatGPT or Claude, and the note it became, marked as
 *  the app marks it (a new note "Written by", a changed one "Edited by"). A thinker's material: a launch,
 *  books, the Studio North decision the whiteboard chapter maps, a week's plan. */
export const ITEMS: Item[] = [
  { ai: "openai", ask: "can you put what we decided about the launch in my notes? beta on friday, pricing stays free", title: "Launch", lines: ["Beta goes out Friday", "Pricing stays free"], mark: "Written by ChatGPT" },
  { ai: "claude", ask: "add the two books ana mentioned to my reading list", title: "Reading list", lines: ["The Overstory", "Thinking in Systems"], mark: "Edited by Claude" },
  { ai: "openai", ask: "what did i decide about studio north? put the next steps under it", title: "Studio North", lines: ["Answer Ana by Friday", "Ask about a March start"], mark: "Edited by ChatGPT" },
  { ai: "claude", ask: "turn my notes from this morning's walk into a plan for the week", title: "This week", lines: ["Draft the essay intro", "Two runs, Tue and Sat"], mark: "Written by Claude" },
];

const P = (x: number, y: number): [number, number] => [Math.round(x), Math.round(y)];

/** Hero 1's ribbon: in from the lower left, through the pill under the buttons, and up off the right. */
function heroShape(w: number, h: number): Shape {
  const px = w / 2;
  if (w <= 760) {
    // A phone shows a short stretch of each side, so it rests mid-item: the start of the line still going
    // in, the note it becomes coming out, under the mark. The pill sits left of the middle to give the
    // note the room.
    const py = h * 0.42, qx = w * 0.34;
    return {
      a: [P(-60, py + h * 0.24), P(w * 0.02, py + h * 0.22), P(qx - w * 0.2, py), P(qx, py)],
      b: [P(qx, py), P(qx + w * 0.26, py), P(w * 0.84, py - h * 0.08), P(w + 70, py - h * 0.36)],
      band: 34, paper: 38, font: 15, restOut: 136,
    };
  }
  const py = h * 0.5;
  return {
    a: [P(-90, py + h * 0.26), P(w * 0.14, py + h * 0.27), P(px - w * 0.2, py), P(px, py)],
    b: [P(px, py), P(px + w * 0.2, py), P(w * 0.8, py - h * 0.2), P(w + 90, py - h * 0.66)],
    band: 46, paper: 50, font: 19,
  };
}

/** Hero 1 (the default): the ribbon. The first screen holds still while the Notes sheet is laid over
 *  it (Story.tsx, `hold`). */
export function HeroRibbon() {
  return (
    <section data-hero className={`${s.hero} ${r.hero1} ${r.hold}`} aria-labelledby="s-h1">
      <div className={r.stage}>
        <div className={r.center}>
          <h1 id="s-h1" className={r.h1}><span>The notebook for you</span> <em>and your AI.</em></h1>
          <p className={r.lede}>{LEDE}</p>
          <Cta />
          <p className={r.free}>Free on iPhone and Mac.</p>
          <p className={r.fine}>Free on Mac and iPhone. Works with <span className={s.with}><AIGlyph name="openai" size={15} />ChatGPT</span> and <span className={s.with}><AIGlyph name="claude" size={15} color="#d97757" />Claude</span>.</p>
        </div>
        <div className={r.room}>
          <Ribbon items={ITEMS} shape={heroShape} label="What you type to ChatGPT or Claude runs into Pinto Notes and comes out as a tidy note, marked Written by ChatGPT or Edited by Claude." />
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Hero 2: the headline, edited ───────────────────────── */

const WHO = [
  { ai: "openai" as const, mark: "Edited by ChatGPT", color: "#a85700" },
  { ai: "claude" as const, mark: "Edited by Claude", color: "#d97757" },
];

/** Hero 2: the headline is the device. "The notebook for you" is yours (your caret after it); "and your
 *  AI." carries the mark the app lays on what an AI changed: the orange bar in the margin, the tint
 *  behind the words, and under them its line in the app's words, "Edited by ChatGPT", then Claude's.
 *  The hand-off: this first page tears away upward and the Notes chapter is already there under it
 *  (Story.tsx, `tear`). */
export function HeroEdited() {
  const who = useTurn(WHO.length, 5200);
  const w = WHO[who % WHO.length];
  return (
    <section data-hero data-tear className={`${s.hero} ${r.hero2}`} aria-labelledby="s-h1">
      <div className={r.sheet}>
        <div className={r.center2}>
          <h1 id="s-h1" className={r.h1x}>
            <span className={r.yours}>The notebook for you<i className={r.caret} aria-hidden="true" /></span>{" "}
            <span className={r.theirs} data-turn={who > 0 || undefined}>
              <i className={r.bar} aria-hidden="true" />
              <em key={who} className={r.tinted}>and your AI.</em>
            </span>
          </h1>
          <p className={r.edited} aria-hidden="true" data-turn={who > 0 || undefined}>
            <span key={who} className={r.editedIn}>
              <svg viewBox="0 0 24 24"><path d={AI_GLYPH_PATH[w.ai]} fill={w.color} /></svg>
              {w.mark}
            </span>
          </p>
          <p className={r.lede}>{LEDE}</p>
          <Cta />
          <p className={r.free}>Free on iPhone and Mac.</p>
          <p className={r.fine}>Free on Mac and iPhone. Works with <span className={s.with}><AIGlyph name="openai" size={15} />ChatGPT</span> and <span className={s.with}><AIGlyph name="claude" size={15} color="#d97757" />Claude</span>.</p>
        </div>
      </div>
    </section>
  );
}

/** Which turn it is: one more every `ms`, from 0. With `?t=<s>` it's the turn at that second (frozen);
 *  with Reduce Motion it stays on the first. */
function useTurn(n: number, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("t");
    if (q !== null && q !== "") { setI(Math.floor((+q * 1000) / ms)); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((v) => v + 1), ms);
    return () => clearInterval(id);
  }, [n, ms]);
  return i;
}
