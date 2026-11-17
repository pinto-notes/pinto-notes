"use client";

import { useEffect, useRef } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import p from "./page.module.css";
import s from "./s.module.css";

// Round 27 concept, slug `page` (2026-11-17): the first screen is a Pinto note. Not a page with a picture
// of the app: one white sheet, edge to edge, lying on the cut-paper desk, in the note's own look. Its
// title is the headline, set huge in the app's title type (the system sans, bold); the subline and the
// buttons are its first lines; then its To try list, where an AI's edit has just landed, marked the way
// the app marks it. The mark is the only motion, and it's CSS from the first paint (the server sends the
// finished note; the animations only decorate it), so the product is there at 0.5 s whatever hydration
// takes. On scroll the sheet becomes the Notes chapter's note: it shrinks onto the Mac window (an iPhone
// card on a phone) while its words go, and fades into it (Story.tsx, `page` in the binder).
//
// The mark is the one Emil approved on 2026-11-12 (design/ai-edit-mark, in origin/dev for 1.4; the
// amber receipt before it was "super ugly"): the AI's words swept in its own colour, 24% over the page
// (ChatGPT green, Claude orange; DecoratedLayoutFragment.changeColors), and the receipt, a quiet glass
// capsule at the note's foot saying what it did in the app's own sentence (AIEdit.Receipt.summary).
// No Undo on it here: the page shows Undo once, in Your AI.
// `?hero=1` (default): calm. One edit: ChatGPT added a line. "ChatGPT added “Schedule every minute”".
// `?hero=2`: two AIs, one edit each, on the same note: ChatGPT's line is there when the page opens (the
//   earlier edit), and Claude ticks the first as you read (a halo round the box it ticked). The receipt names both: "Claude ticked “Phone in another
//   room” · ChatGPT added “Schedule every minute”" (summary with earlierLine).

const still = () => typeof location !== "undefined" && new URLSearchParams(location.search).has("t");

/** The note's checklist: the Deep Work note's To try, the same rows the Notes chapter's window holds. */
export const ROWS = ["Phone in another room", "Schedule every minute"] as const;

/** The toolbar's icons, drawn as the Notes window on this page draws them (Things.tsx). */
const Ico = {
  back: <svg viewBox="0 0 10 16"><path d="M7.5 2 1.8 8l5.7 6" /></svg>,
  fwd: <svg viewBox="0 0 10 16"><path d="M2.5 2l5.7 6-5.7 6" /></svg>,
  check: <svg viewBox="0 0 20 16"><circle cx="3.5" cy="4" r="2.2" /><path d="M8.5 4h10M8.5 12h10" /><circle cx="3.5" cy="12" r="2.2" /></svg>,
  more: <svg viewBox="0 0 20 6"><circle cx="3" cy="3" r="1.6" /><circle cx="10" cy="3" r="1.6" /><circle cx="17" cy="3" r="1.6" /></svg>,
};

const Tick = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 12.4l3.6 3.6 7.4-7.6" /></svg>;

export function PageHero({ v, cta }: { v: "1" | "2"; cta: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // `?t` (stills): the mark at rest, no animation.
  useEffect(() => { if (still()) ref.current?.setAttribute("data-still", ""); }, []);
  const two = v === "2";
  const label = two
    ? `To try: ${ROWS[0]}, ticked by Claude; ${ROWS[1]}, added by ChatGPT. Claude ticked “${ROWS[0]}” · ChatGPT added “${ROWS[1]}”.`
    : `To try: ${ROWS[0]}; ${ROWS[1]}, added by ChatGPT. ChatGPT added “${ROWS[1]}”.`;
  return (
    <>
      {/* The desk: the page's cut paper, torn along its top. */}
      <section data-hero className={`${s.hero} ${p.hero}`} aria-labelledby="s-h1">
        <div className={p.desk} aria-hidden="true" />
      </section>
      {/* The note. A sibling of the desk, so the binder can lay it over the Notes chapter as it carries. */}
      <div ref={ref} data-sheet className={p.sheet} data-v={v}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={p.sprig} src="/lab/page/sprig-v1.webp" alt="" width={723} height={803} aria-hidden="true" fetchPriority="high" />
        <div data-paper className={p.paper}>
        {/* The note's own toolbar on a Mac: back and forward on the left, the tools on the right. It
            stays at the sheet's top as the words scroll under it, as it does in the app. */}
        <div data-bar className={p.bar} aria-hidden="true">
          <span className={p.barIco}>{Ico.back}</span>
          <span className={`${p.barIco} ${p.dim}`}>{Ico.fwd}</span>
          <span className={p.tools}><b>Aa</b><span className={p.barIco}>{Ico.check}</span><span className={p.barIco}>{Ico.more}</span></span>
        </div>
        <div data-sheet-in className={p.in}>
          <h1 id="s-h1" className={p.title} data-f>The notebook <br className={p.brPhone} />for <br className={p.brWide} />you and <br className={p.brPhone} />your AI.</h1>
          <p className={p.lede} data-f>Simple notes, whiteboards and apps. ChatGPT and Claude work in all three with you, and can read what you decided.</p>
          <div className={p.ctas} data-f>{cta}</div>
          <p className={p.free} data-f>Free on Mac and iPhone.</p>
          <div className={p.list} data-f role="group" aria-label={label}>
            <p className={p.h} aria-hidden="true">To try</p>
            <ul className={p.rows} aria-hidden="true">
              <li className={p.row} data-ai={two ? "claude" : undefined} data-on={two || undefined}>
                <i className={p.halo} />
                <i className={p.box}><Tick /></i>
                <span className={p.text}><span className={p.run}>{ROWS[0]}</span></span>
              </li>
              <li className={p.row} data-ai="chatgpt">
                <i className={p.box}><Tick /></i>
                <span className={p.text}><span className={p.run}>{ROWS[1]}</span></span>
              </li>
            </ul>
          </div>
        </div>
        {/* The receipt, where the app puts it: the foot of the note, centred. */}
        <p className={p.pill} data-pill aria-hidden="true">
          <span className={p.pillMarks}>{two && <AIGlyph name="claude" size={15} color="#d97757" />}<AIGlyph name="openai" size={15} color="#1d1b19" /></span>
          <span>{two ? <>Claude ticked “{ROWS[0]}” · ChatGPT added “{ROWS[1]}”</> : <>ChatGPT added “{ROWS[1]}”</>}</span>
        </p>
        </div>
      </div>
    </>
  );
}
