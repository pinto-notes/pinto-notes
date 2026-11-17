"use client";

import { useRef } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { useArt } from "./art";
import { clamp01, seg, useShow } from "./show";
import g from "./heroG.module.css";

// Round 26 (2026-11-17), `?hero=g`, the default: the first screen after Granola's recipe. The headline
// on the left holds still. On the right, on the paper desk (the torn peach sheet, the sprig and the
// pen), one plain Pinto note window, "Dinners this week", and over its lower right corner one thing
// everybody knows: a ChatGPT window. After a beat (0.8 s) your message appears in ChatGPT, sent: "Add
// three easy dinners to my week in Pinto." Then three dinners write themselves into the note, one line
// at a time, each marked the way the app marks an AI's lines (a marker run behind the words, 24% of the
// amber accent over the page, and a 2 pt tick 8 pt left of the text: Pane/Editor/DecoratedLayoutFragment
// .swift), and "Edited by ChatGPT" (AIEdit.listLine) follows once. About three seconds, then rest. No
// labels, no Undo (the page shows Undo once, in Your AI). The eye goes headline → ChatGPT asked → note
// fills: "I ask ChatGPT, it writes in my notes."
//
// The window is the Your AI chapter's Pinto window (AiAlt.tsx: the toolbar of an open note, no
// sidebar). ChatGPT is drawn from the demo video (web/public/demo/pinto-notes-chatgpt.mp4): its dark
// window, your words in a grey bubble on the right, "Ask ChatGPT" in the composer at its foot (the rail,
// Share and the model menu are left out at this size).
//
// The moment is a pure function of time (show.ts): `?g=<s>` freezes it at a time; `?t` and Reduce
// Motion show the end. Everything moves by writing styles from that time, no CSS transitions, so a
// frozen frame is exactly what plays.

/** The note as it is before ChatGPT: its title, what you decided for the week, Monday's dinner. */
const NOTE = { folder: "Home", title: "Dinners this week", decided: "Keep weeknights under 30 minutes.", have: "Mon: Miso salmon · 20 min" };
/** What you asked ChatGPT. */
const ASK = "Add three easy dinners to my week in Pinto.";
/** The three dinners ChatGPT writes, each under the 30 minutes you decided. */
const ADD = ["Tue: Lemon chicken · 20 min", "Wed: Shakshuka · 25 min", "Thu: Black bean tacos · 15 min"];

/** The moment's times (s). The message is sent at `sent`; each line starts at `line[i]` and is written
 *  at `cps` characters a second; "Edited by ChatGPT" follows at `by`. */
const T = { sent: 0.8, line: [1.25, 1.75, 2.25], cps: 62, by: 2.82, end: 3.2 };

/** The overshoot spring for arrivals (cubic-bezier(0.34, 1.56, 0.64, 1)), as a function of 0..1. */
function spring(k: number) {
  const x = clamp01(k);
  // Solve the bezier's x for t with a few Newton steps, then return its y.
  const bx = (t: number) => 3 * (1 - t) * (1 - t) * t * 0.34 + 3 * (1 - t) * t * t * 0.64 + t * t * t;
  const by = (t: number) => 3 * (1 - t) * (1 - t) * t * 1.56 + 3 * (1 - t) * t * t * 1 + t * t * t;
  let t = x;
  for (let i = 0; i < 6; i++) {
    const d = (bx(t + 1e-4) - bx(t - 1e-4)) / 2e-4;
    if (Math.abs(d) < 1e-6) break;
    t = clamp01(t - (bx(t) - x) / d);
  }
  return by(t);
}
/** Ease-out for fades. */
const out = (k: number) => 1 - (1 - clamp01(k)) ** 3;

const P = {
  back: <svg viewBox="0 0 10 16"><path d="M7.5 2 1.8 8l5.7 6" /></svg>,
  fwd: <svg viewBox="0 0 10 16"><path d="M2.5 2l5.7 6-5.7 6" /></svg>,
  check: <svg viewBox="0 0 22 18"><circle cx="4" cy="5" r="2.4" /><path d="M9 5h11M9 13h11" /><circle cx="4" cy="13" r="2.4" /></svg>,
  table: <svg viewBox="0 0 20 18"><rect x="2" y="2.5" width="16" height="13" rx="2" /><path d="M2 7.2h16M2 11.4h16M7.4 2.5v13" /></svg>,
  clip: <svg viewBox="0 0 20 20"><path d="m15.6 9.4-5.8 5.8a3.6 3.6 0 0 1-5.1-5.1l6.4-6.4a2.4 2.4 0 0 1 3.4 3.4L8.3 13.3a1.2 1.2 0 0 1-1.7-1.7l5.6-5.6" /></svg>,
  share: <svg viewBox="0 0 18 20"><path d="M9 12.4V1.8M5.6 5 9 1.6 12.4 5M6.2 7.6H4.4a1.6 1.6 0 0 0-1.6 1.6v7.4a1.6 1.6 0 0 0 1.6 1.6h9.2a1.6 1.6 0 0 0 1.6-1.6V9.2a1.6 1.6 0 0 0-1.6-1.6h-1.8" /></svg>,
  more: <svg viewBox="0 0 20 6" className={g.fill}><circle cx="3" cy="3" r="1.6" /><circle cx="10" cy="3" r="1.6" /><circle cx="17" cy="3" r="1.6" /></svg>,
};
const G = {
  edit: <svg viewBox="0 0 20 20"><path d="M9 3.6H5.2a1.6 1.6 0 0 0-1.6 1.6v9.6a1.6 1.6 0 0 0 1.6 1.6h9.6a1.6 1.6 0 0 0 1.6-1.6V11" /><path d="m14.6 3.2 2.2 2.2-6.6 6.6-2.9.7.7-2.9z" /></svg>,
  plus: <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" /></svg>,
  mic: <svg viewBox="0 0 20 20"><rect x="7.4" y="2.6" width="5.2" height="9.2" rx="2.6" /><path d="M4.8 9.6a5.2 5.2 0 0 0 10.4 0M10 14.8V17" /></svg>,
  wave: <svg viewBox="0 0 20 20"><path d="M5 8.6v2.8M7.6 6.4v7.2M10.2 4.6v10.8M12.8 6.8v6.4M15.4 8.8v2.4" /></svg>,
};

export function HeroG() {
  const art = useArt();
  const bubble = useRef<HTMLParagraphElement>(null);
  const lines = useRef<(HTMLLIElement | null)[]>([]);
  const by = useRef<HTMLParagraphElement>(null);

  useShow({
    name: "g", end: T.end,
    apply: (t) => {
      // The message, sent: it rises out of the composer and lands on the overshoot spring.
      const b = bubble.current;
      if (b) {
        const k = seg(t, T.sent, T.sent + 0.42);
        b.style.opacity = out(seg(t, T.sent, T.sent + 0.22)).toFixed(3);
        b.style.translate = `0 ${((1 - spring(k)) * 18).toFixed(2)}px`;
        b.style.scale = (0.96 + 0.04 * spring(k)).toFixed(4);
      }
      // The dinners, written in one by one, each with its mark (the run grows with the words).
      ADD.forEach((text, i) => {
        const li = lines.current[i]; if (!li) return;
        const n = Math.max(0, Math.min(text.length, Math.floor((t - T.line[i]) * T.cps)));
        if (li.dataset.n === String(n)) return;
        li.dataset.n = String(n);
        li.toggleAttribute("data-on", n > 0);
        (li.children[1] as HTMLElement).firstChild!.textContent = text.slice(0, n);
        (li.children[2] as HTMLElement).textContent = text.slice(n);
      });
      const e = by.current;
      if (e) {
        const k = seg(t, T.by, T.by + 0.36);
        e.style.opacity = out(k).toFixed(3);
        e.style.translate = `0 ${((1 - out(k)) * 5).toFixed(2)}px`;
      }
    },
  });

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={g.pic} src={art.hero} alt="" width={art.heroSide} height={art.heroSide} fetchPriority="high" />
      <div className={g.box}>
        <div className={g.board} role="img" aria-label={`In ChatGPT you ask: ${ASK} In Pinto Notes, ChatGPT writes three dinners into your note, Dinners this week: ${ADD.join(", ")}. The note shows Edited by ChatGPT.`}>
          {/* Pinto on a Mac: one note open in its own window, as the Your AI chapter shows it. */}
          <div className={g.win} aria-hidden="true">
            <div className={g.bar}>
              <span className={g.lights}><i /><i /><i /></span>
              <span className={g.ico}>{P.back}</span><span className={`${g.ico} ${g.dim}`}>{P.fwd}</span>
              <span className={g.crumb}><span>{NOTE.folder}</span><svg viewBox="0 0 8 12"><path d="m2 2 4 4-4 4" /></svg><b>{NOTE.title}</b></span>
              <span className={g.tools}><b>Aa</b><span className={g.ico}>{P.check}</span><span className={`${g.ico} ${g.wide}`}>{P.table}</span><span className={`${g.ico} ${g.wide}`}>{P.clip}</span><span className={g.ico}>{P.share}</span><span className={g.ico}>{P.more}</span></span>
            </div>
            <div className={g.note}>
              <p className={g.title}>{NOTE.title}</p>
              <p className={g.decided}>{NOTE.decided}</p>
              <ul className={g.list}>
                <li>{NOTE.have}</li>
                {ADD.map((text, i) => (
                  // The tick, the words written so far (in the mark's run), and the rest held invisibly,
                  // so each line has its room from the start and nothing moves as it's written.
                  <li key={text} ref={(el) => { lines.current[i] = el; }} className={g.added}>
                    <i className={g.tick} />
                    <span className={g.done}><span className={g.run}>{""}</span></span>
                    <span className={g.rest}>{text}</span>
                  </li>
                ))}
              </ul>
              <p ref={by} className={g.by} style={{ opacity: 0 }}><AIGlyph name="openai" size={14} color="#a85700" />Edited by ChatGPT</p>
            </div>
          </div>
          {/* ChatGPT: your message, sent, in its window. */}
          <div className={g.gpt} aria-hidden="true">
            <p className={g.gTop}><span className={g.gLights}><i /><i /><i /></span><span className={g.gEdit}>{G.edit}</span></p>
            <div className={g.thread}>
              <p ref={bubble} className={g.bubble} style={{ opacity: 0 }}>{ASK}</p>
            </div>
            <p className={g.composer}><i>{G.plus}</i><span>Ask ChatGPT</span><i>{G.mic}</i><i className={g.send}>{G.wave}</i></p>
          </div>
        </div>
      </div>
    </>
  );
}
