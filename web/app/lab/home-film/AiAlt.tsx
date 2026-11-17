"use client";

import { AIGlyph } from "@/lib/ai-glyphs";
import a from "./ai.module.css";

// Round 21 (2026-11-16): the Your AI chapter's variants, `?ai=a|b|c` (0 is AiShow, untouched). One
// exchange and one result, readable in three seconds.
//   a: it reads. ChatGPT is asked "Should I take the Studio North offer now?" and answers from the
//      Studio North note; the note, in Pinto, with the line it read highlighted.
//   b: it writes. "Save this shakshuka recipe to my Recipes folder." and the note it wrote, open in
//      Pinto with the app's own receipt, "ChatGPT wrote this note · Undo · See all changes" (AIEdit.swift:
//      the list's "Written by ChatGPT" shows until the note is opened; once it is, the receipt does; a
//      note the AI wrote has no Review, so its last link is See all changes, AIMarks.swift). Round 23:
//      the page's default, and its one Undo. The chat and the note stand side by side, top-aligned and
//      the same height, so the eye goes from the request straight across to the note it made.
//   c: a's question and answer, one line, then b's result.
// ChatGPT is drawn from the demo video (web/public/demo/pinto-notes-chatgpt.mp4): its dark window, the
// rail, Share, your words in a grey bubble on the right, "Worked for 9s", the answer naming the note
// the way it names one ("Found your Pinto Notes note: Lisbon in May, under Travel/."), the row of
// actions, and "Ask ChatGPT" at the foot. Pinto is the Notes chapter's window: the toolbar of an open
// note (back, forward, the folder and the note, then Aa, checklist, table, attach, share, more).

type Turn = { ask: string; worked: string; answer: React.ReactNode };

const READ: Turn = {
  ask: "Should I take the Studio North offer now?",
  worked: "Worked for 9s",
  answer: (
    <>
      <p>Found your Pinto Notes note: <b>Studio North</b>, under <code>Work/</code>.</p>
      <p>In your Studio North note you decided to wait until March, so you can finish the launch first.</p>
    </>
  ),
};
const WRITE: Turn = {
  ask: "Save this shakshuka recipe to my Recipes folder.",
  worked: "Worked for 8s",
  answer: <p>Created <b>Shakshuka</b> in your <b>Recipes</b> folder in Pinto Notes.</p>,
};

const G = {
  home: <svg viewBox="0 0 20 20"><path d="M3.5 9 10 3.5 16.5 9v7.2a.8.8 0 0 1-.8.8H12v-5H8v5H4.3a.8.8 0 0 1-.8-.8z" /></svg>,
  chats: <svg viewBox="0 0 20 20"><rect x="3" y="5.5" width="10" height="11" rx="2.4" /><path d="M7 5.5V4.8A1.8 1.8 0 0 1 8.8 3h6.4A1.8 1.8 0 0 1 17 4.8v7.4a1.8 1.8 0 0 1-1.8 1.8H13" /></svg>,
  clock: <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="6.8" /><path d="M10 6.2V10l2.6 1.6" /></svg>,
  at: <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="2.8" /><path d="M12.8 10v1.2a2.2 2.2 0 0 0 4.4 0V10A7.2 7.2 0 1 0 14 16" /></svg>,
  dots: <svg viewBox="0 0 20 6" className={a.fill}><circle cx="3" cy="3" r="1.5" /><circle cx="10" cy="3" r="1.5" /><circle cx="17" cy="3" r="1.5" /></svg>,
  apps: <svg viewBox="0 0 20 20"><rect x="3" y="3" width="5.6" height="5.6" rx="1.2" /><rect x="3" y="11.4" width="5.6" height="5.6" rx="1.2" /><rect x="11.4" y="11.4" width="5.6" height="5.6" rx="1.2" /><path d="M14.2 2.8v6M11.2 5.8h6" /></svg>,
  edit: <svg viewBox="0 0 20 20"><path d="M9 3.6H5.2a1.6 1.6 0 0 0-1.6 1.6v9.6a1.6 1.6 0 0 0 1.6 1.6h9.6a1.6 1.6 0 0 0 1.6-1.6V11" /><path d="m14.6 3.2 2.2 2.2-6.6 6.6-2.9.7.7-2.9z" /></svg>,
  share: <svg viewBox="0 0 18 18"><path d="M9 11V2.6M6 5.4 9 2.4l3 3M3.4 10.4v3.6a1.4 1.4 0 0 0 1.4 1.4h8.4a1.4 1.4 0 0 0 1.4-1.4v-3.6" /></svg>,
  copy: <svg viewBox="0 0 20 20"><rect x="6.6" y="6.6" width="10" height="10" rx="2.4" /><path d="M13.4 6.6V5.4a2 2 0 0 0-2-2H5.4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1.2" /></svg>,
  speak: <svg viewBox="0 0 20 20"><path d="M4 7.6h2.4L10 4.6v10.8l-3.6-3H4z" /><path d="M13 7.4a3.6 3.6 0 0 1 0 5.2M15.2 5.4a6.4 6.4 0 0 1 0 9.2" /></svg>,
  again: <svg viewBox="0 0 20 20"><path d="M15.6 8.2A5.8 5.8 0 0 0 5 6.4M4.4 11.8A5.8 5.8 0 0 0 15 13.6M5 3.4v3h3M15 16.6v-3h-3" /></svg>,
  react: <svg viewBox="0 0 20 20"><circle cx="9.4" cy="10.6" r="6.4" /><path d="M7 12.6c1.3 1.2 3.5 1.2 4.8 0M7.4 8.8h0M11.4 8.8h0M15.4 1.8v4M13.4 3.8h4" /></svg>,
  down: <svg viewBox="0 0 20 20"><path d="M6.6 11.4V4h-2a1 1 0 0 0-1 1v5.4a1 1 0 0 0 1 1zM6.6 11.4l3 5a1.6 1.6 0 0 0 2.9-1.2l-.7-3h3.6a1.6 1.6 0 0 0 1.6-1.9l-1-5.2A1.6 1.6 0 0 0 14.4 4H6.6" /></svg>,
  plus: <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" /></svg>,
  mic: <svg viewBox="0 0 20 20"><rect x="7.4" y="2.6" width="5.2" height="9.2" rx="2.6" /><path d="M4.8 9.6a5.2 5.2 0 0 0 10.4 0M10 14.8V17" /></svg>,
  chev: <svg viewBox="0 0 12 8"><path d="m2 2 4 4 4-4" /></svg>,
};

/** ChatGPT, as the demo video shows it: dark, the rail, your words on the right, the answer. */
export function Gpt({ turns }: { turns: Turn[] }) {
  return (
    <div className={a.gpt} role="group" aria-label="ChatGPT">
      <div className={a.rail} aria-hidden="true">
        <span className={a.lights}><i /><i /><i /></span>
        <i className={a.railOn}>{G.home}</i><i>{G.chats}</i><i>{G.clock}</i><i>{G.at}</i><i>{G.dots}</i><i>{G.apps}</i>
      </div>
      <div className={a.gMain}>
        <p className={a.gTop} aria-hidden="true"><span>{G.edit}</span><span className={a.gShare}>{G.share}Share</span><span>{G.dots}</span></p>
        <div className={a.gThread}>
          {turns.map((t) => (
            <div key={t.ask} className={a.turn}>
              <p className={a.bubble}><span className="sr">You: </span>{t.ask}</p>
              <p className={a.worked}>{t.worked}</p>
              <div className={a.answer}>{t.answer}</div>
              <p className={a.acts} aria-hidden="true"><i>{G.copy}</i><i>{G.share}</i><i>{G.speak}</i><i>{G.again}</i><i>{G.react}</i><i>{G.down}</i><i>{G.dots}</i></p>
            </div>
          ))}
        </div>
        <p className={a.composer} aria-hidden="true"><i>{G.plus}</i><span>Ask ChatGPT</span><b>Medium{G.chev}</b><i>{G.mic}</i><i className={a.send}><svg viewBox="0 0 20 20"><path d="M5 8.6v2.8M7.6 6.4v7.2M10.2 4.6v10.8M12.8 6.8v6.4M15.4 8.8v2.4" /></svg></i></p>
      </div>
    </div>
  );
}

const P = {
  back: <svg viewBox="0 0 10 16"><path d="M7.5 2 1.8 8l5.7 6" /></svg>,
  fwd: <svg viewBox="0 0 10 16"><path d="M2.5 2l5.7 6-5.7 6" /></svg>,
  check: <svg viewBox="0 0 22 18"><circle cx="4" cy="5" r="2.4" /><path d="M9 5h11M9 13h11" /><circle cx="4" cy="13" r="2.4" /></svg>,
  table: <svg viewBox="0 0 20 18"><rect x="2" y="2.5" width="16" height="13" rx="2" /><path d="M2 7.2h16M2 11.4h16M7.4 2.5v13" /></svg>,
  clip: <svg viewBox="0 0 20 20"><path d="m15.6 9.4-5.8 5.8a3.6 3.6 0 0 1-5.1-5.1l6.4-6.4a2.4 2.4 0 0 1 3.4 3.4L8.3 13.3a1.2 1.2 0 0 1-1.7-1.7l5.6-5.6" /></svg>,
  share: <svg viewBox="0 0 18 20"><path d="M9 12.4V1.8M5.6 5 9 1.6 12.4 5M6.2 7.6H4.4a1.6 1.6 0 0 0-1.6 1.6v7.4a1.6 1.6 0 0 0 1.6 1.6h9.2a1.6 1.6 0 0 0 1.6-1.6V9.2a1.6 1.6 0 0 0-1.6-1.6h-1.8" /></svg>,
  more: <svg viewBox="0 0 20 6" className={a.fill}><circle cx="3" cy="3" r="1.6" /><circle cx="10" cy="3" r="1.6" /><circle cx="17" cy="3" r="1.6" /></svg>,
};

/** A note in Pinto on a Mac, in its own window: the note's toolbar, then the note. */
function PintoNote({ folder, title, children, label }: { folder: string; title: string; children: React.ReactNode; label: string }) {
  return (
    <div className={a.pinto} role="group" aria-label={label}>
      {/* Round 25: on a phone, the iPhone app's bar (back to the folder, More), as the Notes chapter's. */}
      <div className={a.ipBar} aria-hidden="true">
        <span className={a.ipBack}><svg viewBox="0 0 11 19"><path d="M9 2 2 9.5 9 17" /></svg>{folder}</span>
        <span className={a.ipMore}><svg viewBox="0 0 13 4"><circle cx="2" cy="2" r="1.5" /><circle cx="6.5" cy="2" r="1.5" /><circle cx="11" cy="2" r="1.5" /></svg></span>
      </div>
      <div className={a.pBar} aria-hidden="true">
        <span className={a.pLights}><i /><i /><i /></span>
        <span className={a.pIco}>{P.back}</span><span className={`${a.pIco} ${a.dim}`}>{P.fwd}</span>
        <span className={a.crumb}><span>{folder}</span><svg viewBox="0 0 8 12"><path d="m2 2 4 4-4 4" /></svg><b>{title}</b></span>
        <span className={a.pTools}><b>Aa</b><span className={a.pIco}>{P.check}</span><span className={a.pIco}>{P.table}</span><span className={a.pIco}>{P.clip}</span><span className={a.pIco}>{P.share}</span><span className={a.pIco}>{P.more}</span></span>
      </div>
      <div className={a.pNote}>{children}</div>
    </div>
  );
}

/** The Studio North note, with the line ChatGPT read highlighted. */
export function StudioNote() {
  return (
    <PintoNote folder="Work" title="Studio North" label="Pinto Notes on a Mac, the Studio North note, with the line ChatGPT read highlighted: Decided: wait until March. Finish the launch first.">
      <h3 className={a.nTitle}>Studio North</h3>
      <p>Ana offered me the design lead role. They want me to start in January.</p>
      <p className={a.read}><mark><b>Decided:</b> wait until March. Finish the launch first.</mark></p>
      <p>Ship in February, then talk to Ana again in March.</p>
    </PintoNote>
  );
}

/** The recipe ChatGPT wrote into Recipes, open, with the app's receipt at its foot. */
export function ShakshukaNote() {
  return (
    <PintoNote folder="Recipes" title="Shakshuka" label="Pinto Notes, the new Shakshuka note in Recipes, marked as written by ChatGPT. At its foot: ChatGPT wrote this note, Undo, See all changes.">
      <h3 className={a.nTitle}>Shakshuka</h3>
      <div className={a.wrote}>
        <p className={a.meta}><span>Serves 2 · 25 min</span></p>
        <ul>
          <li><span>1 onion and 1 red pepper, sliced</span></li>
          <li><span>2 cloves garlic, 1 tsp cumin, 1 tsp paprika</span></li>
          <li><span>1 can of tomatoes, 4 eggs, feta</span></li>
        </ul>
        <p><span>Soften the onion and pepper, add the spices and tomatoes, simmer 10 min. Crack in the eggs, cover, 6 min.</span></p>
      </div>
      <p className={a.receipt} aria-hidden="true">
        <AIGlyph name="openai" size={14} color="#1d1b19" />
        <span>ChatGPT wrote this note</span><i /><b>Undo</b><i className={a.wide} /><b className={a.wide}>See all changes</b>
      </p>
    </PintoNote>
  );
}

/** The chapter's picture, per variant. */
export function AiAlt({ v, title, study = false }: { v: "a" | "b" | "c"; title: React.ReactNode; study?: boolean }) {
  const tie = v === "a" ? "Ask ChatGPT or Claude. It answers from what you decided in your notes." : v === "b" ? "Ask ChatGPT or Claude to save something. It writes it into your notes, in the folder you name." : "Ask ChatGPT or Claude. It answers from your notes, and writes into them.";
  return (
    <div className={a.body} data-v={v}>
      <div className={a.head}>
        {title}
        <p className={a.tie} data-fade>{tie}</p>
      </div>
      <div className={a.stage} data-fade="pic">
        {v === "c" ? (
          <>
            <div className={a.one}><Gpt turns={[READ]} /></div>
            <p className={a.then}>Ask it to save a recipe, and it writes the note.</p>
            <div className={a.two}><ShakshukaNote /></div>
          </>
        ) : (
          <>
            <div className={a.one}><Gpt turns={[v === "a" ? READ : WRITE]} /></div>
            <div className={a.two}>{v === "a" ? <StudioNote /> : <ShakshukaNote />}</div>
          </>
        )}
      </div>
      {v !== "b" && (
        <p className={a.stat} data-fade>In a new chat, Claude answered 82.5% of questions about past chats correctly with Pinto Notes connected, against 18% without. <a href="/blog/ai-memory-with-notes">Read the study<span aria-hidden="true"> →</span></a></p>
      )}
      {v === "b" && <p className={a.foot} data-fade>Works with <span className={a.with}><AIGlyph name="openai" size={16} color="#fff1e2" />ChatGPT</span>, <span className={a.with}><AIGlyph name="claude" size={16} color="#d97757" />Claude</span>, Claude Code and Codex.</p>}
      {/* Round 26: the study, moved out of the close, as one quiet line at the chapter's end (Close.tsx
          has its sources: LoCoMo, 1,540 questions, Claude Haiku 5.5, 18% and 82.5%). */}
      {v === "b" && study && <p className={a.studyLine} data-fade>In our test, Claude Haiku 5.5 answered 82.5% of questions about earlier chats correctly in a new chat with Pinto Notes connected, and 18% without. <a href="/blog/ai-memory-with-notes">Read the study</a></p>}
    </div>
  );
}
