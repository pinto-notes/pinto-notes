import type { Metadata } from "next";
import { AIGlyph } from "@/lib/ai-glyphs";
import { PrivacySection } from "../../Sections";
import { C, SHARED } from "../copy";
import { Closing, GROCERIES, GROCERIES_ADDED, HABITS } from "../data";
import { Chat, Download, HabitApp, Phone, PhoneNote, Term } from "../kit";
import l from "../lab.module.css";
import s from "./c.module.css";

export const metadata: Metadata = { title: "Home study C: two phones, one line of amber" };

const ASK = "Add what I need for paella on Sunday to my groceries";
const ANSWER = `Added 5 things to Groceries in Pinto Notes: ${GROCERIES_ADDED.join(", ").toLowerCase()}.`;

const APPS = [
  { name: "ChatGPT", glyph: "openai" as const, where: "iPhone, Mac and the web" },
  { name: "Claude", glyph: "claude" as const, where: "iPhone, Mac and the web" },
  { name: "Claude Code", glyph: "claude" as const, where: "Your terminal" },
  { name: "Codex", glyph: "openai" as const, where: "Your terminal" },
];

// Study C. Concept: ask on one phone, see it land on the other. Signature device: the amber band,
// the app's own tint pulled out of the note and run straight across the page, through the answer in
// ChatGPT and the five lines it added.
export default function HomeC() {
  return (
    <div className={l.main}>
      {/* Focus: the feel and the reach, in one picture: Apple Notes on iPhone, changed from ChatGPT. */}
      <section className={s.hero}>
        <div className={s.heroHead}>
          <h1 className={`${l.h1} ${s.h1}`}>{C.h1}</h1>
          <div className={s.heroSide}>
            <p className={l.lede}>{C.lede}</p>
            <Download />
          </div>
        </div>
        <div className={s.scene}>
          {/* Phones: one phone, so the ask sits above it as ChatGPT's own window. */}
          <Chat app="chatgpt" className={s.chatCard} turns={[{ me: ASK }, { tool: "Used Pinto Notes", ai: ANSWER }]} label={`ChatGPT. You: ${ASK}. ChatGPT: ${ANSWER}`} />
          <div className={s.phones}>
            <div className={s.band} aria-hidden="true" />
            <Phone className={s.chatPhone} label={`ChatGPT on iPhone. You: ${ASK}. ChatGPT, after using Pinto Notes: ${ANSWER}`}>
              <div className={s.chatScreen}>
                <Chat app="chatgpt" frame="bare" turns={[{ me: ASK }, { tool: "Used Pinto Notes", ai: ANSWER }]} label="ChatGPT" />
              </div>
            </Phone>
            <Phone className={s.notePhone} label="Pinto Notes on iPhone: the Groceries note with the five new items tinted, and ChatGPT changed 5 lines, Undo.">
              <PhoneNote title="Groceries" lines={GROCERIES} receipt={{ who: "chatgpt", text: "ChatGPT changed 5 lines" }} />
            </Phone>
          </div>
        </div>
      </section>

      {/* Focus: which AIs. Four names, where each runs. */}
      <section className={l.section} aria-labelledby="apps-list">
        <div className={l.head}><h2 id="apps-list" className={l.h2}>{C.apps.title}</h2></div>
        <ul className={s.tiles}>
          {APPS.map((a) => (
            <li key={a.name} data-claude={a.glyph === "claude" || undefined}><AIGlyph name={a.glyph} size={34} /><b>{a.name}</b><span>{a.where}</span></li>
          ))}
        </ul>
        <p className={l.quiet}>{SHARED.everyAi.also} <a href="/blog/connect-chatgpt-to-your-notes">How to connect</a></p>
      </section>

      {/* Focus: follow-through. The AI finds what you said you'd do. */}
      <section className={`${l.split} ${s.plan}`} aria-labelledby="plan">
        <div className={l.head}>
          <h2 id="plan" className={l.h2}>{C.plan.title}</h2>
          <p className={l.lede}>{C.plan.lede}</p>
        </div>
        <Term app="claude-code" className={s.term} ask="What did I say I'd do before the release?" call="amber-notes · search “before the release”"
          out={["Standup notes, 3 open items:", "○ Ship the import fix", "○ Check the share link on iPhone", "○ Write the release notes"]}
          label="Claude Code searched Pinto Notes for what you said you'd do before the release, and found three open items in Standup notes." />
      </section>

      {/* Focus: the surprise. A note that is an app, shown big. */}
      <section className={s.apps} aria-labelledby="apps">
        <div className={`${l.head} ${l.headCenter}`}>
          <h2 id="apps" className={l.h2}>{SHARED.apps.title}</h2>
          <p className={l.lede}>{SHARED.apps.lede}</p>
        </div>
        <div className={s.appsCard}>
          <p className={s.appsAsk}><AIGlyph name="openai" size={15} />&ldquo;{SHARED.apps.ask}&rdquo;</p>
          <p className={s.appsTitle}>Habits</p>
          <HabitApp days={HABITS.days} rows={HABITS.rows} />
        </div>
      </section>

      {/* Focus: moving in. The real Mac app, and the one App Store line. */}
      <section className={l.section} aria-labelledby="import">
        <div className={l.head}>
          <h2 id="import" className={l.h2}>{SHARED.importNotes.title}</h2>
          <p className={l.lede}>{SHARED.importNotes.lede}</p>
          <p className={l.quiet}>{SHARED.iphone.soon}</p>
        </div>
        <img className={s.mac} src="/demo/lisbon/lisbon-2-faded-1180.webp" srcSet="/demo/lisbon/lisbon-2-faded-800.webp 800w, /demo/lisbon/lisbon-2-faded-1180.webp 1180w, /demo/lisbon/lisbon-2-faded.webp 2360w"
          sizes="(min-width: 1240px) 1200px, 92vw" width={1180} height={720} alt="Pinto Notes on a Mac: folders, the note list by day, and a note called Lisbon, 4 days in May, with a checklist and a table." loading="lazy" />
      </section>

      <PrivacySection />
      <Closing />
    </div>
  );
}
