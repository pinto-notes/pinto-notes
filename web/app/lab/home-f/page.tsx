import type { Metadata } from "next";
import Card from "../../templates/Card";
import { templates } from "@/lib/templates";
import { GROCERIES, GROCERIES_ADDED } from "../data";
import { Chat, Download, MacNote, NoteBody, Paper, Phone, PhoneNote, Receipt, Tick, WhoMark, type Line, type Who } from "../kit";
import l from "../lab.module.css";
import d from "../home-d/d.module.css";
import HeroNote from "../home-d/HeroNote";
import { F } from "./copy";
import ImportCard from "./ImportCard";
import s from "./f.module.css";

export const metadata: Metadata = { title: "Home study F: D's desk, E's week and phones" };

/** D's note: written by you and two AIs, each run of lines credited in the margin. */
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

/** E's week: one running plan on three days. `dots` is the plan in miniature for the phone rail. */
const GOAL: Line = { k: "p", text: "Half marathon on 30 November. Four runs a week, nothing heroic.", quiet: true };
const HEAD: Line = { k: "h", text: "This week" };
type Dot = "open" | "done" | "moved";
const WEEK: { day: string; who: Who; what: string; lines: Line[]; dots: Dot[]; receipt?: string }[] = [
  { day: "Monday", who: "you", what: "You wrote the plan", dots: ["open", "open", "open", "open"], lines: [GOAL, HEAD,
    { k: "todo", text: "Mon · 5 km easy" }, { k: "todo", text: "Wed · Intervals, 6 × 400 m" }, { k: "todo", text: "Thu · 5 km easy" }, { k: "todo", text: "Sat · Long run, 12 km" }] },
  { day: "Wednesday", who: "chatgpt", what: "ChatGPT ticked 2", dots: ["done", "done", "open", "open"], lines: [GOAL, HEAD,
    { k: "done", text: "Mon · 5 km easy", tint: true }, { k: "done", text: "Wed · Intervals, 6 × 400 m", tint: true }, { k: "todo", text: "Thu · 5 km easy" }, { k: "todo", text: "Sat · Long run, 12 km" }] },
  { day: "Friday", who: "claude", what: "Claude moved Thursday", dots: ["done", "done", "open", "moved"], receipt: "Claude changed 1 line", lines: [GOAL, HEAD,
    { k: "done", text: "Mon · 5 km easy" }, { k: "done", text: "Wed · Intervals, 6 × 400 m" }, { k: "todo", text: "Sat · Long run, 12 km" }, { k: "todo", text: "Sun · 5 km easy, moved from Thursday", tint: true }] },
];

/** D's three templates whose notes do more than hold text. */
const PICKS = ["habit-tracker", "budget-log", "trip-plan"];

const ASK = "Add what I need for paella on Sunday to my groceries";
const ANSWER = `Added 5 things to Groceries in Pinto Notes: ${GROCERIES_ADDED.join(", ").toLowerCase()}.`;

// Study F: study D's page (the paper-cut desk, the margin note, the templates, the facts and the
// cream ending) with study E's week and E's two phones, set in D's spacing and type. Cream in light
// and dark (lib/theme.ts). The only motion is D's hero: ChatGPT ticks two, then you tick one.
export default function HomeF() {
  const all = templates();
  const picks = PICKS.map((slug) => all.find((t) => t.slug === slug)).filter((t) => t !== undefined);
  return (
    <div className={`${l.main} ${d.main}`}>
      {/* Focus: what it is, and the plan getting done in front of you. D's first screen as it is. */}
      <section className={d.hero}>
        <div className={d.heroText}>
          <h1 className={`${l.h1} ${d.h1} rise`}>{F.h1}</h1>
          <p className={`${l.lede} rise`} style={{ "--i": 1 } as React.CSSProperties}>{F.lede}</p>
          <div className="rise" style={{ "--i": 2 } as React.CSSProperties}><Download quiet={F.quiet} /></div>
        </div>
        <div className={`${d.desk} rise-soft`} style={{ "--i": 2 } as React.CSSProperties}>
          <img className={d.deskArt} src="/home-d/desk.webp" srcSet="/home-d/desk-700.webp 700w, /home-d/desk.webp 1254w" sizes="(min-width: 1000px) 600px, 92vw"
            width={1254} height={1254} alt="" fetchPriority="high" />
          <HeroNote />
        </div>
      </section>

      {/* Focus: one notebook for every AI, and who wrote what. */}
      <section className={l.section} aria-labelledby="one-notebook">
        <div className={l.head}>
          <h2 id="one-notebook" className={l.h2}>{F.oneNotebook.title}</h2>
          <p className={l.lede}>{F.oneNotebook.lede}</p>
        </div>
        <MacNote className={`${d.team} ${s.team}`} title="Bakery website" folder="Work" date="Today at 16:40" lines={TEAM} gutter size="l" receipt={{ who: "chatgpt", text: "ChatGPT added 1 line" }}
          label="A note called Bakery website. You wrote the goal and ticked Put the menu online, Claude wrote the next steps, and ChatGPT added ideas, its newest line tinted, with Undo." />
        <p className={l.quiet}>{F.also} <a href="/blog/connect-chatgpt-to-your-notes">How to connect</a></p>
      </section>

      {/* Focus: follow-through. One plan on Monday, Wednesday and Friday; what changed is the only thing at full strength. */}
      <section className={l.section} aria-labelledby="plans">
        <div className={l.head}>
          <h2 id="plans" className={l.h2}>{F.plans.title}</h2>
          <p className={l.lede}>{F.plans.lede}</p>
        </div>
        <ol className={s.week} aria-label="One running plan on Monday, Wednesday and Friday">
          {WEEK.map((v, i) => (
            <li key={v.day} className={s.day} data-last={i === WEEK.length - 1 || undefined}>
              <p className={s.dayHead}>
                <b>{v.day}</b>
                <span className={s.dayWho}><WhoMark who={v.who} size={12} />{v.what}</span>
                <span className={s.dots} aria-hidden="true">{v.dots.map((dot, k) => <i key={k} data-d={dot}>{dot === "done" && <Tick />}</i>)}</span>
              </p>
              <Paper className={s.dayPaper} label={`Running plan on ${v.day}: ${v.what}.`}>
                <div data-dim={i > 0 || undefined}>
                  <p className={s.dayTitle}>Running plan</p>
                  <NoteBody lines={v.lines} size="s" />
                </div>
                {v.receipt && <div className={s.dayReceipt}><Receipt who={v.who} text={v.receipt} /></div>}
              </Paper>
            </li>
          ))}
        </ol>
      </section>

      {/* Focus: the feel. Ask ChatGPT on one phone; the lines land tinted in the note on the other. Then yours come over. */}
      <section className={l.section} aria-labelledby="feel">
        <div className={l.head}>
          <h2 id="feel" className={l.h2}>{F.feel.title}</h2>
          <p className={l.lede}>{F.feel.lede}</p>
        </div>
        <figure className={s.scene} aria-label={`Two iPhones. ChatGPT: you asked "${ASK}", and it answered "${ANSWER}" Pinto Notes: the Groceries note with the five new items tinted, and ChatGPT changed 5 lines, Undo.`}>
          <Chat app="chatgpt" className={s.chatCard} frame="window" turns={[{ me: ASK }, { tool: "Used Pinto Notes", ai: ANSWER }]} label="ChatGPT" />
          <div className={s.phones}>
            <div className={s.band} aria-hidden="true" />
            <Phone className={s.chatPhone} label="ChatGPT on iPhone">
              <div className={s.chatScreen}>
                <Chat app="chatgpt" frame="bare" turns={[{ me: ASK }, { tool: "Used Pinto Notes", ai: ANSWER }]} label="ChatGPT" />
              </div>
            </Phone>
            <Phone className={s.notePhone} label="Pinto Notes on iPhone">
              <PhoneNote title="Groceries" lines={GROCERIES} receipt={{ who: "chatgpt", text: "ChatGPT changed 5 lines" }} />
            </Phone>
          </div>
          <figcaption className={`${d.soon} ${s.soon}`}>{F.feel.soon}</figcaption>
        </figure>
        <div className={s.importWrap}><ImportCard /></div>
      </section>

      {/* Focus: the surprise, in the templates' own cards. */}
      <section className={l.section} aria-labelledby="wait">
        <div className={l.head}>
          <h2 id="wait" className={l.h2}>{F.wait.title}</h2>
          <p className={l.lede}>{F.wait.lede}</p>
        </div>
        <ul className={d.picks}>{picks.map((t) => <li key={t.slug}><Card t={t} heading="h3" /></li>)}</ul>
        <p className={l.quiet}><a href="/templates">{F.wait.all}</a></p>
      </section>

      {/* Focus: what a careful person checks. Four facts in a row. */}
      <section aria-label="The facts">
        <ul className={d.facts}>
          {F.facts.map((f) => <li key={f.title}><b>{f.title}</b><span>{f.line}</span></li>)}
        </ul>
      </section>

      {/* Focus: the one thing to do, on cream. */}
      <section className={d.closing} aria-labelledby="closing">
        <img src="/mark-256.png" alt="" width={80} height={80} className={d.closingIcon} />
        <h2 id="closing" className={`${l.h2} ${d.closingTitle}`}>{F.closing.title}</h2>
        <p className={`${l.lede} ${d.closingLede}`}>{F.closing.lede}</p>
        <Download className={d.closingCta} quiet={F.closing.fine} />
      </section>
    </div>
  );
}
