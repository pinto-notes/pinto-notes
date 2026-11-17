"use client";

import { useState } from "react";
import { useShow } from "./show";
import c from "./carry.module.css";

// Round 26, slug `carry` (2026-11-17): the hero object carries the story (Granola's lesson). The first
// screen's picture is the Notes chapter's own Mac window, the Deep Work note, lifted into the first
// screen with its sidebar folded away, and one thing anyone knows at a glance over its corner: ChatGPT.
// You ask ChatGPT to turn the note's highlights into things to try; two lines write themselves into the
// note's To try list, wearing the app's edit mark (a marker run behind the words, a 2 pt amber tick in
// the margin: Pane/Editor/DecoratedLayoutFragment.swift); ChatGPT says what it did, in the words it uses
// in the demo video ("Worked for 11s", "Added A Cevicheria to the Where to eat table in your Lisbon in
// May note."). As you scroll, the headline goes but the window doesn't: it is the same DOM element as
// the Notes chapter's window (Story.tsx moves it with transforms only), so its state carries on. The
// red sheet slides in under it, ChatGPT steps away, the tint fades (the app's tint fades too), the
// sidebar opens on your other notes, you tick the first line and type a third, and the iPhone arrives.
//
// `?hero=1` (default): the window never moves; the page changes around it.
// `?hero=2`: the window lies smaller and tilted on the paper, and is picked up into place.
// Reduce Motion, `?t` or `?one=<s>` show the hero's show at that time (its end, for the first two).

/** The hero show's times (s): the request types into ChatGPT, is sent, two lines write into the note,
 *  then ChatGPT says what it did. About three seconds, once, no loop. */
export const ONE = { type: 0.35, typeEnd: 1.25, send: 1.45, row1: 1.85, row2: 2.4, answer: 3.05, end: 3.3 };
export const ASK = "Turn my highlights into things to try.";

/** The hand-off's progress, 0 in the first screen to 1 as the Notes sheet docks (set by the binder). */
type CarryFn = (p: number) => void;
const carryFns = new Set<CarryFn>();
export function onCarry(fn: CarryFn) { carryFns.add(fn); return () => { carryFns.delete(fn); }; }
export function tellCarry(p: number) { carryFns.forEach((fn) => fn(p)); }

type St = { n: number; sent: boolean; answer: boolean };
const START: St = { n: 0, sent: false, answer: false };

const I = {
  plus: <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" /></svg>,
  mic: <svg viewBox="0 0 20 20"><rect x="7.4" y="2.6" width="5.2" height="9.2" rx="2.6" /><path d="M4.8 9.6a5.2 5.2 0 0 0 10.4 0M10 14.8V17" /></svg>,
  up: <svg viewBox="0 0 20 20"><path d="M10 15.5V4.8M5.4 9.2 10 4.6l4.6 4.6" /></svg>,
  wave: <svg viewBox="0 0 20 20"><path d="M5 8.6v2.8M7.6 6.4v7.2M10.2 4.6v10.8M12.8 6.8v6.4M15.4 8.8v2.4" /></svg>,
  copy: <svg viewBox="0 0 20 20"><rect x="6.6" y="6.6" width="10" height="10" rx="2.4" /><path d="M13.4 6.6V5.4a2 2 0 0 0-2-2H5.4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1.2" /></svg>,
  speak: <svg viewBox="0 0 20 20"><path d="M4 7.6h2.4L10 4.6v10.8l-3.6-3H4z" /><path d="M13 7.4a3.6 3.6 0 0 1 0 5.2M15.2 5.4a6.4 6.4 0 0 1 0 9.2" /></svg>,
  again: <svg viewBox="0 0 20 20"><path d="M15.6 8.2A5.8 5.8 0 0 0 5 6.4M4.4 11.8A5.8 5.8 0 0 0 15 13.6M5 3.4v3h3M15 16.6v-3h-3" /></svg>,
  down: <svg viewBox="0 0 20 20"><path d="M6.6 11.4V4h-2a1 1 0 0 0-1 1v5.4a1 1 0 0 0 1 1zM6.6 11.4l3 5a1.6 1.6 0 0 0 2.9-1.2l-.7-3h3.6a1.6 1.6 0 0 0 1.6-1.9l-1-5.2A1.6 1.6 0 0 0 14.4 4H6.6" /></svg>,
};

/** ChatGPT's Mac app, narrow, as the demo video shows it (web/public/demo/pinto-notes-chatgpt.mp4):
 *  dark, Chat and Work at the top, your words in a grey bubble on the right, "Worked for 6s", the answer
 *  naming the note, its row of actions, and the composer with the Pinto Notes app named in blue. At this
 *  width the app has folded its rail away. It sits fixed over the window's corner (the binder places it). */
export function Chat() {
  const [st, setSt] = useState<St>(START);
  useShow({
    name: "one", end: ONE.end,
    apply: (t) => {
      const n = t >= ONE.send ? ASK.length : Math.round(ASK.length * Math.min(1, Math.max(0, (t - ONE.type) / (ONE.typeEnd - ONE.type))));
      const next: St = { n, sent: t >= ONE.send, answer: t >= ONE.answer };
      setSt((o) => (o.n === next.n && o.sent === next.sent && o.answer === next.answer ? o : next));
    },
  });
  const typing = !st.sent && st.n > 0;
  return (
    <div className={c.chat} data-chat role="group" aria-label={`ChatGPT. You: ${ASK} ChatGPT: Added two things to try to your Deep Work note.`}>
      <div className={c.chatIn} aria-hidden="true">
        <p className={c.cBar}><span className={c.cLights}><i /><i /><i /></span><span className={c.cSeg}><b>Chat</b><span>Work</span></span></p>
        <div className={c.cThread}>
          {/* A new chat, as the app opens one, until the request is sent. */}
          <p className={c.cHello}>What’s on the agenda today?</p>
          <p className={c.cBubble} data-in={st.sent || undefined}>{ASK}</p>
          <p className={c.cDot} data-in={(st.sent && !st.answer) || undefined} />
          <div className={c.cReply} data-in={st.answer || undefined}>
            <p className={c.cWorked}>Worked for 6s</p>
            <p className={c.cAnswer}>Added two things to try to your <b>Deep Work</b> note.</p>
            <p className={c.cActs}><i>{I.copy}</i><i>{I.speak}</i><i>{I.again}</i><i>{I.down}</i></p>
          </div>
        </div>
        <p className={c.cComposer}>
          <i>{I.plus}</i>
          <span className={c.cText}>
            {typing ? <span><em>⌘ Pinto Notes</em> {ASK.slice(0, st.n)}<b className={c.cCaret} /></span> : <span className={c.cPh}>Ask ChatGPT</span>}
          </span>
          <i>{I.mic}</i>
          <i className={c.cSend}>{typing ? I.up : I.wave}</i>
        </p>
      </div>
    </div>
  );
}
