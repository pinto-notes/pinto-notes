import type { Metadata } from "next";
import Card from "../../templates/Card";
import { templates } from "@/lib/templates";
import { G, H } from "../copy";
import { Download } from "../kit";
import { HeroStage } from "./HeroStage";
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
/** G's three template cards, in G's order. */
const PICKS = ["habit-tracker", "trip-plan", "budget-log"];

export default function HomeH() {
  const all = templates();
  const picks = PICKS.map((slug) => all.find((t) => t.slug === slug)).filter((t) => t !== undefined);
  return (
    <div className={`${l.main} ${d.main} ${s.main}`} data-quiet-nav="">
      {/* 1. What it is, and the real app. */}
      <section className={s.hero}>
        <div className={s.heroText}>
          <h1 className={`${l.h1} ${s.h1}`}>One notes app for <span className={s.mark}>every AI</span> you use.</h1>
          <p className={`${l.lede} ${s.lede}`}>{G.lede}</p>
          <Download className={s.heroCta} quiet={G.quiet} />
        </div>
        <HeroStage />
      </section>

      {/* 2. Every AI writes in the same notes, and the app says who: one real capture, the version history. */}
      <section className={s.split} aria-labelledby="one-notebook">
        <div className={s.text}>
          <h2 id="one-notebook" className={d.title}>{H.notebook.title}</h2>
          <p className={d.lede}>{H.notebook.lede}</p>
          <ul className={s.trust} aria-label="You stay in control">
            {H.trust.map((t) => <li key={t.key}>{TRUST_ICON[t.key] ? <img src={TRUST_ICON[t.key]} alt="" width={40} height={40} /> : <Approve />}{t.line}</li>)}
          </ul>
        </div>
        <figure className={s.historyShot}>
          <img src="/home-h/history.webp" width={1800} height={1200} loading="eager"
            alt="Version history of the Groceries note on a Mac: ChatGPT's version from 4:35 picked in the list, beside that version of the note with the two lines it added, Eggs and Spinach, marked." />
        </figure>
      </section>

      {/* The paper-craft signature, once more, between the stories. */}
      <div className={s.divider} aria-hidden="true"><img src="/home-h/divider-table.webp" alt="" width={1600} height={980} loading="eager" /></div>

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

      {/* 4. A note can be an app: G's fanned template cards, each resting on its app. */}
      <section className={d.wait} aria-labelledby="wait">
        <div className={d.centerHead}>
          <h2 id="wait" className={d.title}>{H.apps.title}</h2>
          <p className={d.lede}>{H.apps.lede} <a className={d.inline} href="/templates">{H.apps.all}</a></p>
        </div>
        <ul className={`${d.fan} ${g.fanWrap}`}>{picks.map((t) => <li key={t.slug}><Card t={t} heading="h3" tagline={G.apps.taglines[t.slug]} eager /></li>)}</ul>
      </section>

      {/* 5. It feels like Apple Notes, and yours come along: the real iPhone and the finished import. */}
      <section className={`${g.tint} ${s.feelBand}`} aria-labelledby="feel">
        <div className={s.feel}>
          <div className={s.text}>
            <h2 id="feel" className={d.title}>{H.feel.title}</h2>
            <p className={d.lede}>{H.feel.lede}</p>
            <p className={s.soon}>{H.feel.soon}</p>
          </div>
          <div className={s.feelShots}>
            <img className={s.feelPhone} src="/home-h/iphone-notes.webp" width={1206} height={2622} loading="eager"
              alt="Pinto Notes on iPhone: All Notes, with Evening tracker and Groceries pinned, then today's notes, each with its time, first line and folder." />
            <img className={s.mac} src="/home-h/import-done.webp" width={2560} height={1600} loading="eager"
              alt="Pinto Notes on a Mac after importing from Apple Notes: 1,284 notes in their own folders, Notes, Recipes, Work, Travel and Home, with a recipe open." />
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
