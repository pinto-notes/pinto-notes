"use client";

import { useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { at, mix, mj, place, seg, useShow, type Pt } from "./show";
import { ADDED_IN, ADDED_RECIPE, DECIDED, Flag, Folder, FOLDERS, GPT, Receipt, Tick } from "./Things";
import s from "./s.module.css";

// The first screen's picture: your note, in its notebook, on one person's table. Beside it, slim and
// quiet, the folders of a whole life (Recipes open, then Work, Reading, Trips, Health, Studio North),
// so the note reads as one page of everything you keep. In the note, the decision you write ("Cooking
// at home five nights a week.") and ChatGPT's line under it, marked, with Undo. Below it, the recipe it
// wrote into Recipes because of that decision. Undo takes both back. No hand: your words type in, the
// way a note fills. On a phone the folders are one row of chips over the note, and the recipe card is
// left out, so the whole note sits above the fold.

const TYPE = [0.35, 1.75] as [number, number];
/** The decision as the hero sets it: "five nights a week" kept together, so a wrap breaks before it. */
const SAID = DECIDED.replace("five nights a week", "five\u00a0nights\u00a0a\u00a0week");
const ONE = { gptIn: 1.95, fly: [1.95, 2.5] as [number, number], land: 2.55, ride: [2.55, 3.05] as [number, number], card: 3.0, rec: 3.2, gptOut: [3.9, 4.3] as [number, number], end: 4.4 };

export function HeroOne() {
  const box = useRef<HTMLDivElement>(null), gpt = useRef<HTMLSpanElement>(null);
  const [st, setSt] = useState({ n: 0, land: false, card: false, rec: false });
  const [undone, setUndone] = useState(false);
  useShow({
    name: "one", end: ONE.end,
    apply: (t) => {
      const el = box.current; if (!el) return;
      const B = el.getBoundingClientRect();
      const next = { n: Math.round(seg(t, ...TYPE) * SAID.length), land: t >= ONE.land, card: t >= ONE.card, rec: t >= ONE.rec };
      setSt((o) => (o.n === next.n && o.land === next.land && o.card === next.card && o.rec === next.rec ? o : next));
      // ChatGPT comes in from the right, rides along its line as it lands, and leaves.
      const line = el.querySelector("[data-at=one]");
      const s0 = at(B, line, 0, 0.74), s1 = at(B, line, 1, 0.74);
      const from: Pt | null = s1 && [B.width + 20, s1[1] + 60];
      let g: Pt | null = s0, o = 0;
      if (t >= ONE.gptIn && t < ONE.fly[1]) { g = from && s0 && mix(from, s0, mj(seg(t, ...ONE.fly))); o = seg(t, ONE.gptIn, ONE.gptIn + 0.2); }
      else if (t >= ONE.fly[1] && t < ONE.gptOut[0]) { g = t < ONE.ride[0] ? s0 : s0 && s1 && mix(s0, s1, mj(seg(t, ...ONE.ride))); o = 1; }
      else if (t >= ONE.gptOut[0]) { const q = seg(t, ...ONE.gptOut); g = s1 && [s1[0] + 16 * q, s1[1] + 8 * q]; o = 1 - q; }
      place(gpt.current, g, o);
    },
  });
  const typing = st.n < SAID.length;
  return (
    <div ref={box} className={s.oneBox}>
      <nav className={s.oneFolders} aria-label="Folders">
        <p className={s.oneFoldersH}>Folders</p>
        <ul>
          {FOLDERS.map((name, i) => (
            <li key={name} data-on={i === 0 || undefined} aria-current={i === 0 ? "true" : undefined}><Folder /><span>{name}</span></li>
          ))}
        </ul>
      </nav>
      <div className={s.oneNote} data-card>
        <p className={s.hNoteDate}>Today at 09:12</p>
        <p className={s.oneTitle}>Weeknight dinners</p>
        <ul className={s.hRows}>
          <li data-on><i><Tick /></i><span>Sharpen the good knife</span></li>
          <li><i /><span>Shop on Sundays</span></li>
        </ul>
        <p className={s.oneDecided}>
          <b>Decided:</b> <span>{SAID.slice(0, st.n)}</span>
          {typing && <span className={s.oneCaret} data-on={st.n > 0 || undefined} aria-hidden="true" />}
          <span className={s.askRest} aria-hidden="true">{SAID.slice(st.n)}</span>
        </p>
        <p className={s.hAdded} data-in={st.land || undefined} data-undone={undone || undefined}>
          <span data-at="one"><b className={s.mark} />{ADDED_IN}<a className={s.noteLink} href="#s-write" tabIndex={st.land ? 0 : -1}>{ADDED_RECIPE}</a></span>
        </p>
        <div className={s.oneRec} data-in={st.rec || undefined}><Receipt undone={undone} onFlip={() => setUndone((u) => !u)} live={st.rec} /></div>
      </div>
      {/* The recipe ChatGPT wrote, in your Recipes folder. */}
      <div className={s.oneRecipe} data-in={(st.card && !undone) || undefined} aria-hidden={!st.card || undone || undefined}>
        <p className={s.oneCrumb}><Folder />Recipes</p>
        <p className={s.oneRecipeTitle}>Lemon chicken</p>
        <p className={s.oneMeta}>25 min · Serves 2</p>
        <ul className={s.hRows}>
          <li><i /><span>4 chicken thighs</span></li>
          <li><i /><span>1 lemon, zest and juice</span></li>
          <li><i /><span>3 garlic cloves</span></li>
        </ul>
        <p className={s.oneBy}><span className={s.receiptMark}><AIGlyph name="openai" size={10} color="#fff" /></span>Written by ChatGPT</p>
      </div>
      <span ref={gpt} className={s.cur} aria-hidden="true"><Flag name="ChatGPT" color={GPT} /></span>
    </div>
  );
}
