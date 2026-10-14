import type { Metadata } from "next";
import Card from "../../templates/Card";
import { templates } from "@/lib/templates";
import { G } from "../copy";
import { Download } from "../kit";
import l from "../lab.module.css";
import d from "../home-d/d.module.css";
import g from "../home-g/g.module.css";
import h from "../home-h/h.module.css";
import st from "../hero-lab/story.module.css";
import { PlayedThenTry } from "../hero-lab/Story";
import { Bubble, MadeFor, NoteCard } from "./Parts";
import s from "./i.module.css";

export const metadata: Metadata = { title: G.title, description: G.description };

// Study I: the notebook you and your AI share. Every section is one benefit you can feel, shown
// finished: the AIs remember (memory), plans happen (check-in), notes become apps, who it's for,
// and it feels like Apple Notes. Truthful: an AI reads or writes the notebook when you ask it to.

const PICKS = ["habit-tracker", "trip-plan", "budget-log"];
const TRUST = [
  { icon: "/home-d/facts/lock.webp", line: "Encrypted before it syncs." },
  { icon: "/home-d/facts/undo.webp", line: "Every change says who made it. Undo takes it back." },
  { icon: "/home-d/facts/box.webp", line: "You approve each AI. Open source." },
];

export default function HomeI() {
  const all = templates();
  const picks = PICKS.map((slug) => all.find((t) => t.slug === slug)).filter((t) => t !== undefined);
  return (
    <div className={`${l.main} ${d.main} ${s.main}`} data-quiet-nav="">
      {/* 1. What it is: the notebook you and your AI share, with three AIs writing in it. */}
      <section className={st.hero}>
        <div className={st.words}>
          <h1 className={l.h1} style={{ maxWidth: "11ch" }}>The notebook <span className={h.mark}>you and your AI</span> share.</h1>
          <p className={l.lede} style={{ maxWidth: "30em" }}>ChatGPT, Claude, Claude Code and Codex read and write in it, with your OK. It looks and feels like Apple Notes.</p>
          <Download quiet={G.quiet} />
        </div>
        <PlayedThenTry />
      </section>

      {/* 2. Benefit: your AIs stop forgetting. Monday in ChatGPT, the note, Tuesday in Claude. */}
      <section className={s.memory} aria-labelledby="memory">
        <div className={s.head}>
          <h2 id="memory" className={d.title}>Stop re-explaining yourself.</h2>
          <p className={d.lede}>Tell one AI once. It goes in your notebook, and every other AI you use can read it there.</p>
        </div>
        <div className={s.memoryRow}>
          <Bubble app="chatgpt" day="Monday" className={s.mLeft} me="I'm running a half marathon on 30 November. Four runs a week. Save my plan."
            tool="Used Pinto Notes · Running plan" ai="Saved. Long run on Saturdays, intervals on Wednesdays." />
          <span className={s.arrow} aria-hidden="true"><svg viewBox="0 0 40 16"><path d="M2 8h32m-6-6 6 6-6 6" /></svg></span>
          <NoteCard className={s.mNote} title="Running plan" folder="Health" sub="Half marathon on 30 November. Four runs a week."
            rows={[{ text: "Mon · 5 km easy", box: true }, { text: "Wed · Intervals, 6 × 400 m", box: true }, { text: "Thu · 5 km easy", box: true }, { text: "Sat · Long run, 12 km", box: true }]} />
          <span className={s.arrow} aria-hidden="true"><svg viewBox="0 0 40 16"><path d="M2 8h32m-6-6 6 6-6 6" /></svg></span>
          <Bubble app="claude" day="Wednesday" className={s.mRight} me="What should I run today?"
            tool="Used Pinto Notes · Running plan" ai="Intervals: 6 × 400 m, with a slow lap between each." />
        </div>
      </section>

      {/* 3. Benefit: plans happen. The dark band: your AI checks in and moves what's left. */}
      <section className={`${d.band} ${s.plansBand}`} aria-labelledby="plans" data-dark-band="">
        <div className={s.plansRow}>
          <div className={s.plansText}>
            <h2 id="plans" className={d.statement}>Notes are where plans go to die.<br /><span className={s.notHere}>Not here.</span></h2>
            <p className={d.bandLede}>Ask your AI how the week went. It reads what you ticked, tells you straight, and moves what's left so the plan keeps going.</p>
          </div>
          <div className={s.checkin}>
            <Bubble app="claude" day="Friday" me="How did my week go?"
              ai="Two of four runs done. Thursday's 5 km is still open. I moved it to Sunday, so you're still on track for the 30th." />
            <NoteCard title="Running plan" folder="Health"
              rows={[{ text: "Mon · 5 km easy", box: true, done: true }, { text: "Wed · Intervals, 6 × 400 m", box: true, done: true }, { text: "Sat · Long run, 12 km", box: true }, { text: "Sun · 5 km easy, moved from Thursday", box: true, who: "claude", tint: true }]} />
          </div>
        </div>
      </section>

      {/* 4. Benefit: notes become apps. G's fanned template cards, each resting on its app. */}
      <section className={d.wait} aria-labelledby="wait">
        <div className={d.centerHead}>
          <h2 id="wait" className={d.title}>Wait, it can do that?</h2>
          <p className={d.lede}>A note can be an app: a habit tracker, a budget, a trip plan. Change it yourself, or ask your AI. <a className={d.inline} href="/templates">See all templates</a></p>
        </div>
        <ul className={`${d.fan} ${g.fanWrap}`}>{picks.map((t) => <li key={t.slug}><Card t={t} heading="h3" tagline={G.apps.taglines[t.slug]} eager /></li>)}</ul>
      </section>

      {/* 5. Who it's for: three people, one tab each. */}
      <section className={s.forWho} aria-labelledby="who">
        <div className={s.head}>
          <h2 id="who" className={d.title}>Made for how you use AI.</h2>
        </div>
        <MadeFor />
      </section>

      {/* 6. Comfort: it feels like Apple Notes, yours come along, and you stay in control. */}
      <section className={`${g.tint} ${s.home}`} aria-labelledby="feel">
        <div className={s.homeRow}>
          <div className={s.homeText}>
            <h2 id="feel" className={d.title}>Feels like Apple Notes.<br />Bring yours over.</h2>
            <p className={d.lede}>Import every note in one go, folders and checklists included. Apple Notes stays as it is.</p>
            <ul className={s.trust}>{TRUST.map((t) => <li key={t.line}><img src={t.icon} alt="" width={36} height={36} />{t.line}</li>)}</ul>
          </div>
          <img className={s.homeShot} src="/home-h/import-done.webp" width={2560} height={1600} loading="lazy"
            alt="Pinto Notes on a Mac after importing from Apple Notes: 1,284 notes in their own folders, with a recipe open." />
        </div>
      </section>

      {/* 7. The ending. */}
      <section className={`${d.band} ${d.closing}`} aria-labelledby="closing" data-dark-band="">
        <div className={d.bandInner}>
          <img src="/mark-256.png" alt="" width={104} height={104} className={d.closingIcon} />
          <h2 id="closing" className={d.closingTitle}>Start your notebook.</h2>
          <Download className={`${d.closingCta} ${g.ctaCenter}`} quiet={G.closing.fine} />
        </div>
      </section>
    </div>
  );
}
