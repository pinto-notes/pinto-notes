import type { Metadata } from "next";
import { ImportSection, PrivacySection } from "../../Sections";
import { B, SHARED } from "../copy";
import { ASKS, Closing, HABITS, WEEK } from "../data";
import { Chat, Download, HabitApp, NoteBody, Paper, Phone, PhoneCustom, PhoneList, WHO, WhoMark } from "../kit";
import l from "../lab.module.css";
import s from "./b.module.css";

export const metadata: Metadata = { title: "Home study B: the plan that keeps moving" };

const CHECK_IN = {
  me: "How did my running plan go this week? Move what I missed.",
  ai: "You ran Monday and Wednesday. Thursday's 5 km didn't happen, so I moved it to Sunday. Saturday's long run is still on.",
};

// Study B. Concept: notes as a week, not a pile. Signature device: the week rail, one plan shown on
// three days of its history, each version credited to whoever changed it and tinted where it changed.
export default function HomeB() {
  return (
    <div className={l.main}>
      {/* Focus: the promise. You write the plan; your AI keeps it moving. */}
      <section className={s.hero}>
        <div className={s.heroText}>
          <h1 className={`${l.h1} ${s.h1}`}>{B.h1}</h1>
          <p className={`${l.lede} ${s.lede}`}>{B.lede}</p>
          <Download className={s.cta} />
        </div>
        <ol className={s.week} aria-label="One running plan on Monday, Wednesday and Friday">
          {WEEK.map((v, i) => (
            <li key={v.day} className={s.day} data-last={i === WEEK.length - 1 || undefined}>
              <p className={s.dayHead}><b>{v.day}</b><span className={s.dayWho}><WhoMark who={v.who} size={11} />{v.what}</span></p>
              <Paper className={s.dayPaper} label={`Running plan on ${v.day}: ${v.what}.`}>
                <p className={s.dayTitle}>Running plan</p>
                <NoteBody lines={v.lines} size="s" />
              </Paper>
            </li>
          ))}
        </ol>
      </section>

      {/* Focus: the check-in. Ask, and it reads the plan and moves what's left. */}
      <section className={`${l.split} ${s.check}`} aria-labelledby="check-in">
        <div className={l.head}>
          <h2 id="check-in" className={l.h2}>{B.checkIn.title}</h2>
          <p className={l.lede}>{B.checkIn.lede}</p>
        </div>
        <Chat app="claude" className={s.checkChat} turns={[{ me: CHECK_IN.me, tool: "Used Pinto Notes: read Running plan, edited 1 line", ai: CHECK_IN.ai }]} label={`Claude: ${CHECK_IN.me} ${CHECK_IN.ai}`} />
      </section>

      {/* Focus: which AIs. A plain list, one request each. */}
      <section className={l.section} aria-labelledby="every-ai">
        <div className={l.head}>
          <h2 id="every-ai" className={l.h2}>{SHARED.everyAi.title}</h2>
        </div>
        <ul className={s.rows}>
          {ASKS.map((a) => (
            <li key={a.who}>
              <span className={s.rowApp}><WhoMark who={a.who} size={16} /><b>{WHO[a.who].name}</b></span>
              <span className={s.rowWhere}>{a.where}</span>
              <span className={s.rowAsk}>&ldquo;{a.ask}&rdquo;</span>
            </li>
          ))}
        </ul>
        <p className={l.quiet}>{SHARED.everyAi.also} <a href="/blog/connect-chatgpt-to-your-notes">How to connect</a></p>
      </section>

      {/* Focus: the feel. Apple Notes on iPhone, and the one App Store line. */}
      <section className={`${l.split} ${s.feel}`} aria-labelledby="feel">
        <div className={s.feelPhone}>
          <Phone label="The Pinto Notes note list on iPhone, grouped by day, like Apple Notes.">
            <PhoneList groups={[
              { day: "Today", notes: [
                { title: "Running plan", when: "08:12", preview: "Sun · 5 km easy, moved from Thursday", tint: true },
                { title: "Groceries", when: "07:40", preview: "Paella rice, saffron, chorizo" },
              ] },
              { day: "Yesterday", notes: [
                { title: "Kitchen reno", when: "Thu", preview: "Order the worktop before the 20th" },
                { title: "Gift ideas", when: "Thu", preview: "Mum: the blue scarf, size M" },
                { title: "Books to read", when: "Thu", preview: "The Overstory, Piranesi" },
              ] },
              { day: "Previous 7 days", notes: [
                { title: "Standup notes", when: "Mon", preview: "Ship the import, fix the share link" },
              ] },
            ]} />
          </Phone>
        </div>
        <div className={l.head}>
          <h2 id="feel" className={l.h2}>{SHARED.iphone.title}</h2>
          <p className={l.lede}>{SHARED.iphone.lede}</p>
          <p className={l.quiet}>{SHARED.iphone.soon}</p>
        </div>
      </section>

      {/* Focus: the surprise. A note that is an app. */}
      <section className={`${l.split} ${s.apps}`} aria-labelledby="apps">
        <div className={l.head}>
          <h2 id="apps" className={l.h2}>{SHARED.apps.title}</h2>
          <p className={l.lede}>{SHARED.apps.lede}</p>
          <p className={s.appsAsk}><WhoMark who="chatgpt" size={13} />&ldquo;{SHARED.apps.ask}&rdquo;</p>
        </div>
        <div className={s.appsPhone}>
          <Phone label="The Habits note on iPhone, now a tracker with four habits and seven days of ticks.">
            <PhoneCustom title="Habits">
              <HabitApp days={HABITS.days} rows={HABITS.rows} compact />
              <p className={s.appsText}>Started 6 October. Walk before work, read on the train home.</p>
              <p className={s.appsText}>If I miss two days in a row, start again on Monday.</p>
            </PhoneCustom>
          </Phone>
        </div>
      </section>

      <ImportSection />
      <PrivacySection />
      <Closing />
    </div>
  );
}
