import type { Metadata } from "next";
import { G, H } from "../copy";
import { Download, Receipt } from "../kit";
import l from "../lab.module.css";
import Week from "../home-d/Week";
import d from "../home-d/d.module.css";
import g from "../home-g/g.module.css";
import s from "./h.module.css";

export const metadata: Metadata = { title: G.title, description: G.description };

/** The three facts that answer "can I trust an AI in my notes?", each with its paper icon. */
const TRUST_ICON: Record<string, string> = { undo: "/home-d/facts/undo.webp", lock: "/home-d/facts/lock.webp" };
/** "You approve each AI" has no paper icon yet: the app's own Allow, as a small drawn mark. */
const Approve = () => <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><rect x="6" y="9" width="28" height="22" rx="6" fill="#fdfbf8" stroke="#d9c3a5" /><rect x="11" y="22" width="18" height="5" rx="2.5" fill="#e8820e" /><rect x="12" y="14" width="16" height="3" rx="1.5" fill="#cbb79c" /></svg>;

// Study H, the bolder rethink: the real app, big, on the paper desk; then four sections, each built
// around a real capture (no HTML replicas), the paper-craft art returning once mid-page, and G's ending.
// Every frame is finished: nothing on this page enters from nothing.
export default function HomeH() {
  return (
    <div className={`${l.main} ${d.main} ${s.main}`} data-quiet-nav="">
      {/* 1. What it is, and the real app. */}
      <section className={s.hero}>
        <div className={s.heroText}>
          <h1 className={`${l.h1} ${s.h1}`}>{G.h1}</h1>
          <p className={`${l.lede} ${s.lede}`}>{G.lede}</p>
          <Download className={s.heroCta} quiet={G.quiet} />
        </div>
        <div className={s.stage}>
          <img className={s.stageArt} src="/home-d/desk.webp" alt="" width={1254} height={1254} fetchPriority="high" />
          <figure className={s.window}>
            <img src="/home-h/window-lisbon.webp" srcSet="/home-h/window-lisbon-1100.webp 1100w, /home-h/window-lisbon.webp 2200w" sizes="(min-width: 1240px) 1100px, 92vw" width={2200} height={1375}
              alt="Pinto Notes on a Mac: folders on the left, the note list, and a note called Lisbon with a checklist, places, a hotel booking and a table of food." fetchPriority="high" />
            <span className={s.receipt}><Receipt who="chatgpt" text="ChatGPT changed 2 lines" /></span>
          </figure>
        </div>
      </section>

      {/* 2. Every AI writes in the same notes, and the app says who: the real history and the real list. */}
      <section className={s.split} aria-labelledby="one-notebook">
        <div className={s.text}>
          <h2 id="one-notebook" className={d.title}>{H.notebook.title}</h2>
          <p className={d.lede}>{H.notebook.lede}</p>
          <ul className={s.trust} aria-label="You stay in control">
            {H.trust.map((t) => <li key={t.key}>{TRUST_ICON[t.key] ? <img src={TRUST_ICON[t.key]} alt="" width={40} height={40} /> : <Approve />}{t.line}</li>)}
          </ul>
        </div>
        <div className={s.pairShots}>
          <img className={s.mac} src="/home-h/history.webp" width={1800} height={1200} loading="eager"
            alt="Version history of the Groceries note: the current version from you on iPhone, a version from ChatGPT at 4:35, one from Claude Code, each kept and restorable." />
          <img className={s.phone} src="/home-h/iphone-edited.webp" width={1206} height={2622} loading="eager"
            alt="The note list on iPhone: Groceries edited by ChatGPT, Standup notes edited by Claude Code, Lisbon edited by Claude." />
        </div>
      </section>

      {/* The paper-craft signature, once more, between the stories. */}
      <div className={s.divider} aria-hidden="true"><img src="/home-h/divider.webp" alt="" width={1600} height={1600} loading="eager" /></div>

      {/* 3. Plans keep moving: G's band. */}
      <section className={`${d.band} ${g.planBand}`} aria-labelledby="plans" data-dark-band="">
        <div className={g.planRow}>
          <div className={g.planText}>
            <h2 id="plans" className={d.statement}>{G.plans.title}</h2>
            <p className={d.bandLede}>{G.plans.lede}</p>
          </div>
          <Week />
        </div>
      </section>

      {/* 4. A note can be an app: the real habit tracker and budget on iPhone. */}
      <section className={s.split} aria-labelledby="wait" data-flip="">
        <div className={s.text}>
          <h2 id="wait" className={d.title}>{H.apps.title}</h2>
          <p className={d.lede}>{H.apps.lede} <a className={d.inline} href="/templates">{H.apps.all}</a></p>
        </div>
        <div className={s.phones}>
          <img className={s.screen} src="/home-h/habit-tracker-main-phone-light.webp" width={780} height={1688} loading="eager"
            alt="The habit tracker app on iPhone: 62% this week, 2 of 6 done today, Walk and Read ticked with their streaks." />
          <img className={s.screen} src="/home-h/budget-log-main-phone-light.webp" width={780} height={1688} loading="eager"
            alt="The budget app on iPhone: 8,205 kr left this month, Add expense, and each category's spending against its budget." />
        </div>
      </section>

      {/* 5. It feels like Apple Notes, and yours come along: the real import and the real iPhone. */}
      <section className={`${g.tint} ${s.feelBand}`} aria-labelledby="feel">
        <div className={s.split}>
          <div className={s.feelShots}>
            <img className={s.mac} src="/home-h/import.webp" width={1980} height={1800} loading="eager"
              alt="Import from Apple Notes in Pinto Notes on a Mac: the notes to bring over, each ticked, Keep Apple Notes folders on, and Import 1,284 Notes." />
          </div>
          <div className={s.text}>
            <h2 id="feel" className={d.title}>{H.feel.title}</h2>
            <p className={d.lede}>{H.feel.lede}</p>
            <p className={s.soon}>{H.feel.soon}</p>
          </div>
        </div>
      </section>

      {/* 6. G's ending. */}
      <section className={`${d.band} ${d.closing}`} aria-labelledby="closing" data-dark-band="">
        <div className={d.bandInner}>
          <img src="/mark-256.png" alt="" width={104} height={104} className={d.closingIcon} />
          <h2 id="closing" className={d.closingTitle}>{G.closing.title}</h2>
          <Download className={`${d.closingCta} ${g.ctaCenter}`} quiet={G.closing.fine} />
        </div>
      </section>
    </div>
  );
}
