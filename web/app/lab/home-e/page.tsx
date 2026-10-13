import type { Metadata } from "next";
import DownloadLink from "../../DownloadLink";
import PlatformNote from "../../PlatformNote";
import { PrivacySection } from "../../Sections";
import a from "../../sections.module.css";
import { AIGlyph } from "@/lib/ai-glyphs";
import { coverPath } from "@/lib/template-covers";
import { E } from "../copy";
import { GROCERIES, GROCERIES_ADDED, HABITS } from "../data";
import { Apple, Chat, Download, FolderIcon, HabitApp, MacNote, NoteBody, Paper, Phone, PhoneNote, Receipt, Tick, WhoMark, type Line, type Who } from "../kit";
import l from "../lab.module.css";
import s from "./e.module.css";

export const metadata: Metadata = { title: "Home study E: the note, the week, the phones" };

/** The hero's note: you and two AIs (Claude wrote the steps, Codex the tinted line), never a crowd. */
const BAKERY: Line[] = [
  { k: "p", text: "Get the site up before the spring market: menu, opening hours, preorders.", by: "you" },
  { k: "h", text: "Next steps", by: "claude" },
  { k: "todo", text: "Opening hours in the footer", by: "claude" },
  { k: "todo", text: "Take preorders by email", by: "claude" },
  { k: "done", text: "Put the menu online", by: "claude" },
  { k: "h", text: "Ideas from the market", by: "you" },
  { k: "bullet", text: "A photo of the sourdough on the front page", by: "you" },
  { k: "bullet", text: "Sunday special at the top", by: "you" },
  { k: "p", text: "Photos were slow on phones. Resized them to 1200 px, and they load as you scroll.", by: "codex", tint: true },
];

/** One running plan on three days of its history. `dots` is the plan in miniature for the phone rail. */
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

const ASK = "Add what I need for paella on Sunday to my groceries";
const ANSWER = `Added 5 things to Groceries in Pinto Notes: ${GROCERIES_ADDED.join(", ").toLowerCase()}.`;

/** The habits, with names short enough to fit beside seven days on a phone. */
const HABITS_E = HABITS.rows.map((r) => (r.name === "No phone in bed" ? { ...r, name: "Phone off" } : r));

const FOLDERS =[{ name: "Notes", n: 612 }, { name: "Recipes", n: 188 }, { name: "Work", n: 241 }, { name: "Travel", n: 97 }, { name: "Home", n: 146 }];
const TOTAL = FOLDERS.reduce((t, f) => t + f.n, 0); // 1,284

// Study E. A's first screen (the note everyone writes in, now you and two AIs), B's week as the
// second screen under B's headline, C's two phones for the Apple Notes feel, then moving in, a note
// that is an app on the habit tracker's paper-cut cover, privacy, the facts and the ending. Always
// cream (lib/theme.ts). The only motion is the privacy lock closing once, from the live home page.
export default function HomeE() {
  return (
    <div className={l.main}>
      {/* Focus: what it is. One notes app; you and your AIs write in it; the margin says who. */}
      <section className={s.hero}>
        <div className={s.heroText}>
          <h1 className={`${l.h1} ${s.h1}`}>{E.h1}</h1>
          <p className={l.lede}>{E.lede}</p>
          <Download quiet={E.quiet} />
        </div>
        <MacNote className={s.heroMac} title="Bakery website" folder="Work" date="Today at 16:40" lines={BAKERY} gutter bigBy receipt={{ who: "codex", text: "Codex changed 1 line" }}
          label="A note called Bakery website. You wrote the goal and the ideas, Claude wrote the next steps, and Codex added a line that is tinted, with Undo." />
      </section>

      {/* Focus: follow-through. One plan on Monday, Wednesday and Friday; what changed is the only thing in colour. */}
      <section className={l.section} aria-labelledby="week">
        <div className={l.head}>
          <h2 id="week" className={l.h2}>{E.week.title}</h2>
          <p className={l.lede}>{E.week.lede}</p>
        </div>
        <ol className={s.week} aria-label="One running plan on Monday, Wednesday and Friday">
          {WEEK.map((v, i) => (
            <li key={v.day} className={s.day} data-last={i === WEEK.length - 1 || undefined}>
              <p className={s.dayHead}>
                <b>{v.day}</b>
                <span className={s.dayWho}><WhoMark who={v.who} size={12} />{v.what}</span>
                <span className={s.dots} aria-hidden="true">{v.dots.map((d, k) => <i key={k} data-d={d}>{d === "done" && <Tick />}</i>)}</span>
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

      {/* Focus: the feel. Ask ChatGPT on one phone; the lines land tinted in the note on the other. */}
      <section className={s.feel} aria-labelledby="feel">
        <div className={`${l.head} ${l.headCenter}`}>
          <h2 id="feel" className={l.h2}>{E.iphone.title}</h2>
          <p className={l.lede}>{E.iphone.lede}</p>
        </div>
        <div className={s.scene}>
          <Chat app="chatgpt" className={s.chatCard} frame="window" turns={[{ me: ASK }, { tool: "Used Pinto Notes", ai: ANSWER }]} label={`ChatGPT. You: ${ASK}. ChatGPT: ${ANSWER}`} />
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
          <p className={s.soon}>{E.iphone.soon}</p>
        </div>
      </section>

      {/* Focus: moving in. One import, finished. */}
      <section className={l.section} aria-labelledby="import">
        <div className={l.head}>
          <h2 id="import" className={l.h2}>{E.importNotes.title}</h2>
          <p className={l.lede}>{E.importNotes.lede}</p>
        </div>
        <div className={a.run} aria-label={`Imported ${TOTAL.toLocaleString("en")} notes from Apple Notes, folders kept.`}>
          <p className={a.runTitle} aria-hidden="true"><img src="/apple-notes.webp" alt="" width={30} height={30} />Imported from Apple Notes</p>
          <div className={a.bar} aria-hidden="true"><i /><span className={a.barDone} data-on><Tick /></span></div>
          <ul className={`${a.folders} ${s.folders}`} aria-hidden="true">
            {FOLDERS.map((f) => <li key={f.name} data-on><FolderIcon /><b>{f.name}</b><span className={a.num}>{f.n.toLocaleString("en")}</span></li>)}
          </ul>
          <p className={`${a.big} ${s.total}`} aria-hidden="true"><span className={a.num}>{TOTAL.toLocaleString("en")}</span> notes</p>
        </div>
      </section>

      {/* Focus: the surprise. A note that is an app, on the habit tracker template's own cover. */}
      <section className={`${l.split} ${s.apps}`} aria-labelledby="apps">
        <div className={l.head}>
          <h2 id="apps" className={l.h2}>{E.apps.title}</h2>
          <p className={l.lede}>{E.apps.lede}</p>
          <p className={s.appsAsk}><AIGlyph name="openai" size={15} />&ldquo;{E.apps.ask}&rdquo;</p>
          <p className={l.quiet}><a href="/templates">{E.apps.templates}</a></p>
        </div>
        <figure className={s.cover} aria-label="The Habits note on the habit tracker template's paper-cut cover: four habits and seven days of ticks.">
          <img src={coverPath("habit-tracker")} alt="" width={800} height={800} loading="lazy" decoding="async" />
          <Paper className={s.habits}>
            <p className={s.habitsTitle}>Habits</p>
            <HabitApp days={HABITS.days} rows={HABITS_E} compact />
          </Paper>
        </figure>
      </section>

      <PrivacySection eyebrow={false} />

      {/* Focus: the four facts a careful person checks before installing. */}
      <ul className={s.facts} aria-label="Facts">
        {E.facts.map((f) => <li key={f.title}><b>{f.title}</b><span>{f.text}</span></li>)}
      </ul>

      <section className={l.band} aria-labelledby="closing">
        <div className={l.bandInner}>
          <img src="/mark-256.png" alt="" width={88} height={88} className={l.bandIcon} />
          <h2 id="closing" className={l.bandTitle}>{E.closing.title}</h2>
          <p className={l.bandLede}>{E.closing.lede}</p>
          <div className="pi-apple pi-not-ios"><DownloadLink><Apple /> Download for Mac</DownloadLink></div>
          <PlatformNote place="band" />
          <p className={`${l.bandFine} pi-apple pi-not-ios`}>{E.closing.fine}</p>
        </div>
      </section>
    </div>
  );
}
