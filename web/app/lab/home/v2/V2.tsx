import Card from "../../../templates/Card";
import { templates } from "@/lib/templates";
import { G } from "../../copy";
import { Download } from "../../kit";
import l from "../../lab.module.css";
import d from "../../home-d/d.module.css";
import g from "../../home-g/g.module.css";
import h from "../../home-h/h.module.css";
import i from "../../home-i/i.module.css";
import { Film } from "./Film";
import v from "./v2.module.css";

const PICKS = ["habit-tracker", "trip-plan", "budget-log"];

/// Version 2, "The week": a short, quiet hero, then the whole product told as one scrolled film
/// (Monday ChatGPT plans, Wednesday Claude reads it, Friday it moves what you missed, Sunday you tick
/// the last run, and the note lands on the desk). Then the apps, home, and the close.
export function V2() {
  const all = templates();
  const picks = PICKS.map((slug) => all.find((t) => t.slug === slug)).filter((t) => t !== undefined);
  return (
    <div className={`${l.main} ${d.main} ${v.main}`} data-quiet-nav="">
      <section className={v.hero}>
        <h1 className={`${l.h1} ${v.h1}`}>The notebook <span className={h.mark}>you and your AI</span> share.</h1>
        <p className={`${l.lede} ${v.lede}`}>ChatGPT, Claude, Claude Code and Codex read and write in it, with your OK. Scroll through one week with it.</p>
        <Download className={v.cta} quiet={G.quiet} />
      </section>

      <Film />

      <section className={d.wait} aria-labelledby="wait">
        <div className={d.centerHead}>
          <h2 id="wait" className={d.title}>And a note can be an app.</h2>
          <p className={d.lede}>A habit tracker, a budget, a trip plan. Change it yourself, or ask your AI. <a className={d.inline} href="/templates">See all templates</a></p>
        </div>
        <ul className={`${d.fan} ${g.fanWrap}`}>{picks.map((t) => <li key={t.slug}><Card t={t} heading="h3" tagline={G.apps.taglines[t.slug]} eager /></li>)}</ul>
      </section>

      <section className={`${g.tint} ${i.home}`} aria-labelledby="feel">
        <div className={i.homeRow}>
          <div className={i.homeText}>
            <h2 id="feel" className={d.title}>Feels like Apple Notes.<br />Bring yours over.</h2>
            <p className={d.lede}>Import every note in one go, folders and checklists included. Apple Notes stays as it is.</p>
            <ul className={i.trust}>
              <li><img src="/home-d/facts/lock.webp" alt="" width={36} height={36} />Encrypted before it syncs.</li>
              <li><img src="/home-d/facts/undo.webp" alt="" width={36} height={36} />Every change says who made it. Undo takes it back.</li>
              <li><img src="/home-d/facts/box.webp" alt="" width={36} height={36} />You approve each AI. Open source.</li>
            </ul>
          </div>
          <figure className={i.homeFig}>
            <img className={i.homeShot} src="/home-h/import-near.webp" width={1500} height={1100} loading="lazy"
              alt="Pinto Notes on a Mac right after importing from Apple Notes: All Notes 1,284, in their own folders." />
            <span className={i.imported}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>1,284 notes brought over from Apple Notes</span>
          </figure>
        </div>
      </section>

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
