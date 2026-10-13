import type { Metadata } from "next";
import { ImportSection, PrivacySection } from "../../Sections";
import { A, SHARED } from "../copy";
import { ASKS, BAKERY, Closing, GROCERIES, HABITS } from "../data";
import { Chat, Download, HabitApp, MacNote, Phone, PhoneNote, WHO, WhoMark } from "../kit";
import l from "../lab.module.css";
import s from "./a.module.css";

export const metadata: Metadata = { title: "Home study A: the note everyone writes in" };

// Study A. Concept: one note written by you and every AI you use. Signature device: the authorship
// margin, the name of whoever wrote each run of lines beside it, as a note's history would credit them.
export default function HomeA() {
  return (
    <div className={l.main}>
      {/* Focus: what it is. One notes app; every AI writes in it; you can see who did what. */}
      <section className={s.hero}>
        <div className={s.heroText}>
          <h1 className={l.h1}>{A.h1}</h1>
          <p className={l.lede}>{A.lede}</p>
          <Download quiet="Free for Mac. Imports your Apple Notes." />
        </div>
        <div className={s.heroNote}>
          <MacNote title="Bakery website" folder="Work" date="Today at 16:40" lines={BAKERY} gutter receipt={{ who: "codex", text: "Codex changed 1 line" }}
            label="A note called Bakery website. Its owner wrote the goal, Claude wrote the next steps, Claude Code ticked one, ChatGPT added ideas, and Codex added a line that is tinted, with Undo." />
        </div>
      </section>

      {/* Focus: where you ask. Four apps, one request each, and what landed in the note. */}
      <section className={l.section} aria-labelledby="every-ai">
        <div className={l.head}>
          <h2 id="every-ai" className={l.h2}>{SHARED.everyAi.title}</h2>
          <p className={l.lede}>{SHARED.everyAi.lede}</p>
        </div>
        <ol className={s.asks}>
          {ASKS.map((a) => (
            <li key={a.who} className={s.ask}>
              <p className={s.askWho}><WhoMark who={a.who} size={14} /><b>{WHO[a.who].name}</b><span>{a.where}</span></p>
              <p className={s.askSaid}>&ldquo;{a.ask}&rdquo;</p>
              <p className={s.askDid}><span className={s.askNote}>{a.note}</span>{a.did}</p>
            </li>
          ))}
        </ol>
        <p className={l.quiet}>{SHARED.everyAi.also} <a href="/blog/connect-chatgpt-to-your-notes">How to connect</a></p>
      </section>

      {/* Focus: trust. The tint, the receipt, Undo. */}
      <section className={`${l.split} ${s.undo}`} aria-labelledby="undo">
        <div className={l.head}>
          <h2 id="undo" className={l.h2}>{A.undo.title}</h2>
          <p className={l.lede}>{A.undo.lede}</p>
        </div>
        <div className={s.undoPhone}>
          <Phone label="Pinto Notes on iPhone: the Groceries note with five items ChatGPT just added, tinted, and ChatGPT changed 5 lines, Undo.">
            <PhoneNote title="Groceries" lines={GROCERIES} receipt={{ who: "chatgpt", text: "ChatGPT changed 5 lines" }} />
          </Phone>
        </div>
      </section>

      {/* Focus: the surprise. A note that is an app. */}
      <section className={`${l.split} ${s.apps}`} aria-labelledby="apps">
        <div className={s.appsScene}>
          <Chat app="chatgpt" className={s.appsChat} turns={[{ me: SHARED.apps.ask, tool: "Used Pinto Notes", ai: SHARED.apps.answer }]} label={`ChatGPT: ${SHARED.apps.ask}`} />
          <div className={s.appsNote}>
            <p className={s.appsTitle}>Habits</p>
            <HabitApp days={HABITS.days} rows={HABITS.rows} />
          </div>
        </div>
        <div className={l.head}>
          <h2 id="apps" className={l.h2}>{SHARED.apps.title}</h2>
          <p className={l.lede}>{SHARED.apps.lede}</p>
        </div>
      </section>

      <ImportSection />
      <PrivacySection />
      <Closing />
    </div>
  );
}
