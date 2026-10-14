import Card from "../../../templates/Card";
import { templates } from "@/lib/templates";
import { G } from "../../copy";
import { Download } from "../../kit";
import l from "../../lab.module.css";
import d from "../../home-d/d.module.css";
import g from "../../home-g/g.module.css";
import i from "../../home-i/i.module.css";
import { Bubble, NoteCard } from "../../home-i/Parts";
import { Forget } from "./Forget";
import r from "./remember.module.css";

const PICKS = ["habit-tracker", "trip-plan", "budget-log"];

/// Version 4, "It remembers": problem first. Every AI forgets you; your notebook doesn't. Then a few
/// huge statements, each with one small, real proof.
export function V4() {
  const all = templates();
  const picks = PICKS.map((slug) => all.find((t) => t.slug === slug)).filter((t) => t !== undefined);
  return (
    <div className={`${l.main} ${r.page}`} data-quiet-nav="">
      <section>
        <Forget />
      </section>

      <section className={r.row} aria-labelledby="relay">
        <div>
          <h2 id="relay" className={r.statement}>Start in one AI. Finish in another.</h2>
          <p className={r.say}>No copying between chats. Whatever one AI started is in your notebook, and the next one picks it up there.</p>
        </div>
        <div className={r.relay}>
          <Bubble app="chatgpt" day="Tuesday" me="Start a packing list for Lisbon." tool="Used Pinto Notes · Lisbon" ai="Started it in your Lisbon note: nine things, grouped by bag." />
          <Bubble app="claude" day="Thursday" me="What's left to pack for Lisbon?" tool="Used Pinto Notes · Lisbon" ai="Three things: the adapter, sunscreen and your tram card. The rest is ticked." />
        </div>
      </section>

      <section className={`${d.band} ${i.plansBand}`} aria-labelledby="going" data-dark-band="">
        <div className={r.row}>
          <div>
            <h2 id="going" className={r.statement} style={{ color: "#fff4e6" }}>Ask how it's going.</h2>
            <p className={r.say} style={{ color: "#e8d6c0" }}>Your AI reads what you ticked, tells you straight, and moves what you missed. Plans stop dying in your notes.</p>
          </div>
          <div className={i.checkin}>
            <Bubble app="claude" day="Friday" me="How did my week go?" ai="Two of four runs done. I moved Thursday's to Sunday, so you're still on track." />
            <NoteCard title="Running plan" folder="Health"
              rows={[{ text: "Mon · 5 km easy", box: true, done: true }, { text: "Wed · Intervals, 6 × 400 m", box: true, done: true }, { text: "Sat · Long run, 12 km", box: true }, { text: "Sun · 5 km easy", box: true, who: "claude", tint: true }]} />
          </div>
        </div>
      </section>

      <section className={d.wait} aria-labelledby="apps">
        <div className={d.centerHead}>
          <h2 id="apps" className={r.statement}>Watch a note become an app.</h2>
          <p className={r.say} style={{ margin: "18px auto 0" }}>A habit tracker, a budget, a trip plan. Change it yourself, or ask your AI. <a className={d.inline} href="/templates">See all templates</a></p>
        </div>
        <ul className={`${d.fan} ${g.fanWrap}`}>{picks.map((t) => <li key={t.slug}><Card t={t} heading="h3" tagline={G.apps.taglines[t.slug]} eager /></li>)}</ul>
      </section>

      <section className={r.row} data-flip="" aria-labelledby="notes">
        <div>
          <h2 id="notes" className={r.statement}>It's still just notes.</h2>
          <p className={r.say}>It looks and feels like Apple Notes, and brings all of yours over in one go. Encrypted before it syncs. Every change can be undone.</p>
        </div>
        <figure className={i.homeFig}>
          <img className={i.homeShot} src="/home-h/import-near.webp" width={1500} height={1100} loading="lazy" alt="Pinto Notes on a Mac right after importing from Apple Notes: 1,284 notes in their own folders." />
          <span className={i.imported}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>1,284 notes brought over from Apple Notes</span>
        </figure>
      </section>

      <section className={`${d.band} ${d.closing}`} aria-labelledby="closing" data-dark-band="">
        <div className={d.bandInner}>
          <img src="/mark-256.png" alt="" width={104} height={104} className={d.closingIcon} />
          <h2 id="closing" className={d.closingTitle}>Give your AIs a memory.</h2>
          <Download className={`${d.closingCta} ${g.ctaCenter}`} quiet={G.closing.fine} />
        </div>
      </section>
    </div>
  );
}
