import type { Metadata } from "next";
import Card from "../../templates/Card";
import { templates } from "@/lib/templates";
import { D, SHARED } from "../copy";
import { GROCERIES, GROCERIES_ADDED, WEEK } from "../data";
import { Chat, Download, MacNote, NoteBody, Paper, Phone, PhoneNote, WhoMark, type Line } from "../kit";
import l from "../lab.module.css";
import HeroNote from "./HeroNote";
import ImportCard from "./ImportCard";
import s from "./d.module.css";

export const metadata: Metadata = { title: "Home study D: the plan that gets done" };

/** One note, written by you and two AIs, each run of lines credited in the margin. */
const TEAM: Line[] = [
  { k: "p", text: "Get the site up before the spring market: menu, opening hours, preorders.", by: "you" },
  { k: "h", text: "Next steps", by: "claude" },
  { k: "todo", text: "Opening hours in the footer", by: "claude" },
  { k: "todo", text: "Take preorders by email", by: "claude" },
  { k: "done", text: "Put the menu online", by: "you" },
  { k: "h", text: "Ideas from the market", by: "chatgpt" },
  { k: "bullet", text: "A photo of the sourdough on the front page", by: "chatgpt" },
  { k: "bullet", text: "Sunday special at the top", by: "chatgpt", tint: true },
];

/** Three templates whose notes do more than hold text. */
const PICKS = ["habit-tracker", "budget-log", "trip-plan"];

const ASK = "Add what I need for paella on Sunday to my groceries";
const ANSWER = `Added 5 things to Groceries in Pinto Notes: ${GROCERIES_ADDED.join(", ").toLowerCase()}.`;

// Study D. Concept: the plan that gets done. Signature device: a real note laid on a paper-cut desk,
// two pencils pointing at it, ticked off by an AI and then by you. Cream throughout, like the home page.
export default function HomeD() {
  const all = templates();
  const picks = PICKS.map((slug) => all.find((t) => t.slug === slug)).filter((t) => t !== undefined);
  const last = WEEK[WEEK.length - 1];
  return (
    <div className={`${l.main} ${s.main}`} data-quiet-nav="">
      {/* Focus: what it is, and the plan getting done in front of you. */}
      <section className={s.hero}>
        <div className={s.heroText}>
          <h1 className={`${l.h1} ${s.h1} rise`}>{D.h1}</h1>
          <p className={`${l.lede} rise`} style={{ "--i": 1 } as React.CSSProperties}>{D.lede}</p>
          <div className="rise" style={{ "--i": 2 } as React.CSSProperties}><Download quiet={D.quiet} /></div>
        </div>
        <div className={`${s.desk} rise-soft`} style={{ "--i": 2 } as React.CSSProperties}>
          <img className={s.deskArt} src="/home-d/desk.webp" srcSet="/home-d/desk-700.webp 700w, /home-d/desk.webp 1254w" sizes="(min-width: 1000px) 600px, 92vw"
            width={1254} height={1254} alt="" fetchPriority="high" />
          <HeroNote />
        </div>
      </section>

      {/* Focus: one notebook for every AI, and who wrote what. */}
      <section className={l.section} aria-labelledby="one-notebook">
        <div className={l.head}>
          <h2 id="one-notebook" className={l.h2}>{D.oneNotebook.title}</h2>
          <p className={l.lede}>{D.oneNotebook.lede}</p>
        </div>
        <MacNote className={s.team} title="Bakery website" folder="Work" date="Today at 16:40" lines={TEAM} gutter size="l" receipt={{ who: "chatgpt", text: "ChatGPT added 1 line" }}
          label="A note called Bakery website. You wrote the goal and ticked Put the menu online, Claude wrote the next steps, and ChatGPT added ideas, its newest line tinted, with Undo." />
        <p className={l.quiet}>{SHARED.everyAi.also} <a href="/blog/connect-chatgpt-to-your-notes">How to connect</a></p>
      </section>

      {/* Focus: follow-through. One plan across the week, kept moving. */}
      <section className={l.section} aria-labelledby="plans">
        <div className={l.head}>
          <h2 id="plans" className={l.h2}>{D.plans.title}</h2>
          <p className={l.lede}>{D.plans.lede}</p>
        </div>
        {/* Phones: Friday's note under a small rail of the days before it. */}
        <ol className={s.rail} aria-hidden="true">
          {WEEK.map((v) => <li key={v.day} data-now={v === last || undefined}><b>{v.day.slice(0, 3)}</b><WhoMark who={v.who} size={10} /><span>{v.what}</span></li>)}
        </ol>
        <ol className={s.week} aria-label="One running plan on Monday, Wednesday and Friday">
          {WEEK.map((v) => (
            <li key={v.day} className={s.day} data-last={v === last || undefined}>
              <p className={s.dayHead}><b>{v.day}</b><span className={s.dayWho}><WhoMark who={v.who} size={11} />{v.what}</span></p>
              <Paper className={s.dayPaper} label={`Running plan on ${v.day}: ${v.what}.`}>
                <p className={s.dayTitle}>Running plan</p>
                <NoteBody lines={v.lines} size="s" />
              </Paper>
            </li>
          ))}
        </ol>
      </section>

      {/* Focus: it feels like the notes app you know, and yours come along. */}
      <section className={l.section} aria-labelledby="feel">
        <div className={l.head}>
          <h2 id="feel" className={l.h2}>{D.feel.title}</h2>
          <p className={l.lede}>{D.feel.lede}</p>
        </div>
        <div className={s.feel}>
          <figure className={s.phones}>
            <Phone className={s.chatPhone} width="280px" label={`ChatGPT on iPhone. You: ${ASK}. ChatGPT, after using Pinto Notes: ${ANSWER}`}>
              <div className={s.chatScreen}><Chat app="chatgpt" frame="bare" turns={[{ me: ASK }, { tool: "Used Pinto Notes", ai: ANSWER }]} label="ChatGPT" /></div>
            </Phone>
            <Phone className={s.notePhone} width="280px" label="Pinto Notes on iPhone: the Groceries note with the five new items tinted, and ChatGPT changed 5 lines, Undo.">
              <PhoneNote title="Groceries" lines={GROCERIES} receipt={{ who: "chatgpt", text: "ChatGPT changed 5 lines" }} />
            </Phone>
            <figcaption className={s.soon}>{D.feel.soon}</figcaption>
          </figure>
          <ImportCard />
        </div>
      </section>

      {/* Focus: the surprise, in the templates' own cards. */}
      <section className={l.section} aria-labelledby="wait">
        <div className={l.head}>
          <h2 id="wait" className={l.h2}>{D.wait.title}</h2>
          <p className={l.lede}>{D.wait.lede}</p>
        </div>
        <ul className={s.picks}>{picks.map((t) => <li key={t.slug}><Card t={t} heading="h3" /></li>)}</ul>
        <p className={l.quiet}><a href="/templates">{D.wait.all}</a></p>
      </section>

      {/* Focus: what a careful person checks. Four facts in a row. */}
      <section aria-label="The facts">
        <ul className={s.facts}>
          {D.facts.map((f) => <li key={f.title}><b>{f.title}</b><span>{f.line}</span></li>)}
        </ul>
      </section>

      {/* Focus: the one thing to do, on cream. */}
      <section className={s.closing} aria-labelledby="closing">
        <img src="/mark-256.png" alt="" width={80} height={80} className={s.closingIcon} />
        <h2 id="closing" className={`${l.h2} ${s.closingTitle}`}>{SHARED.closing.title}</h2>
        <p className={`${l.lede} ${s.closingLede}`}>{SHARED.closing.lede}</p>
        <Download className={s.closingCta} quiet={SHARED.closing.fine} />
      </section>
    </div>
  );
}
