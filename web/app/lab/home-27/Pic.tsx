"use client";

import { Note } from "./Things";
import h from "./h27.module.css";
import s from "./s.module.css";

// Round 27 (2026-11-17): the first screen's picture, the same for all three heroes. It is server-rendered
// and moves by CSS alone, so it's there in the first paint and the edit never waits for the script
// (council r22: no hero showed the product working by 0.5 s; Granola, Wispr and Dusk did).
//
// The Deep Work note, as the Notes chapter's window shows it with the sidebar folded away (Things.tsx's
// Note, `copy`), lying a little turned on the desk. In the first paint ChatGPT has just been asked
// ("Turn my highlights into things to try.", sent) and is working; ChatGPT's two lines are inserted into
// To try with the app's mark from 0.15 s and 0.5 s, and ChatGPT's answer lands at 0.95 s, in the words
// the demo video uses ("Worked for 6s", "Added … to your … note."). Done by about 1.35 s, then it holds.
// Reduce Motion or `?t`: the finished state at once.
//
// As you scroll, the binder (Story.tsx) swaps in the Notes chapter's own window at this copy's pose
// and carries it into Notes. The ChatGPT window stays in the first screen and steps away.

export const ASK = "Turn my highlights into things to try.";
export const ANSWER = "Deep Work";

const I = {
  plus: <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" /></svg>,
  mic: <svg viewBox="0 0 20 20"><rect x="7.4" y="2.6" width="5.2" height="9.2" rx="2.6" /><path d="M4.8 9.6a5.2 5.2 0 0 0 10.4 0M10 14.8V17" /></svg>,
  wave: <svg viewBox="0 0 20 20"><path d="M5 8.6v2.8M7.6 6.4v7.2M10.2 4.6v10.8M12.8 6.8v6.4M15.4 8.8v2.4" /></svg>,
  copy: <svg viewBox="0 0 20 20"><rect x="6.6" y="6.6" width="10" height="10" rx="2.4" /><path d="M13.4 6.6V5.4a2 2 0 0 0-2-2H5.4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1.2" /></svg>,
  speak: <svg viewBox="0 0 20 20"><path d="M4 7.6h2.4L10 4.6v10.8l-3.6-3H4z" /><path d="M13 7.4a3.6 3.6 0 0 1 0 5.2M15.2 5.4a6.4 6.4 0 0 1 0 9.2" /></svg>,
  again: <svg viewBox="0 0 20 20"><path d="M15.6 8.2A5.8 5.8 0 0 0 5 6.4M4.4 11.8A5.8 5.8 0 0 0 15 13.6M5 3.4v3h3M15 16.6v-3h-3" /></svg>,
  down: <svg viewBox="0 0 20 20"><path d="M6.6 11.4V4h-2a1 1 0 0 0-1 1v5.4a1 1 0 0 0 1 1zM6.6 11.4l3 5a1.6 1.6 0 0 0 2.9-1.2l-.7-3h3.6a1.6 1.6 0 0 0 1.6-1.9l-1-5.2A1.6 1.6 0 0 0 14.4 4H6.6" /></svg>,
};

/** ChatGPT's Mac app, narrow, as the demo video shows it (web/public/demo/pinto-notes-chatgpt.mp4):
 *  dark, Chat and Work at the top, your words in a grey bubble on the right, "Worked for 6s", the answer
 *  naming the note, its row of actions, the composer. On a phone only the thread: your words and the
 *  answer. */
export function ChatStill() {
  return (
    <div className={h.chat} data-chat role="img" aria-label={`ChatGPT. You: ${ASK} ChatGPT: Added two things to try to your Deep Work note.`}>
      <div className={h.chatIn} aria-hidden="true">
        <p className={h.cBar}><span className={h.cLights}><i /><i /><i /></span><span className={h.cSeg}><b>Chat</b><span>Work</span></span></p>
        <div className={h.cThread}>
          <p className={h.cBubble}>{ASK}</p>
          <div className={h.cAfter}>
            <p className={h.cDot} />
            <div className={h.cReply}>
              <p className={h.cWorked}>Worked for 6s</p>
              <p className={h.cAnswer}>Added two things to try to your <b>{ANSWER}</b> note.</p>
              <p className={h.cActs}><i>{I.copy}</i><i>{I.speak}</i><i>{I.again}</i><i>{I.down}</i></p>
            </div>
          </div>
        </div>
        <p className={h.cComposer}><i>{I.plus}</i><span className={h.cPh}>Ask ChatGPT</span><i>{I.mic}</i><i className={h.cSend}>{I.wave}</i></p>
      </div>
    </div>
  );
}

/** The picture: the note (a server-rendered copy of the Notes chapter's window) and, for heroes a and c,
 *  ChatGPT over its corner. `done`: already finished (hero b, whose headline carries the edit). */
export function Pic({ chat = true, done = false, children }: { chat?: boolean; done?: boolean; children?: React.ReactNode }) {
  return (
    <div className={h.pic} data-pic data-done={done || undefined}>
      {children}
      <div className={`${s.wDevices} ${h.copy}`} data-copy-wrap inert>
        <Note live={false} copy />
      </div>
      {chat && <ChatStill />}
    </div>
  );
}
