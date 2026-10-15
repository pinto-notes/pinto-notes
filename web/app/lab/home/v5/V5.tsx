import Card from "../../../templates/Card";
import { templates } from "@/lib/templates";
import { G } from "../../copy";
import { Download } from "../../kit";
import l from "../../lab.module.css";
import d from "../../home-d/d.module.css";
import g from "../../home-g/g.module.css";
import h from "../../home-h/h.module.css";
import { Film, type Caption } from "../v2/Film";
import { Agents, Dump, Together, Walk } from "./Moments";
import { Week } from "./Week";
import v from "./v5.module.css";

const PICKS = ["habit-tracker", "trip-plan", "budget-log"];

const SOURCES = [
  { name: "Apple Notes", icon: "/apple-notes.webp" }, { name: "Obsidian", icon: "/home-v5/import/obsidian.webp" }, { name: "Bear", icon: "/home-v5/import/bear.webp" },
  { name: "Evernote", icon: "/home-v5/import/evernote.webp" }, { name: "Google Keep", icon: "/home-v5/import/keep.webp" }, { name: "Markdown", icon: "" },
];

// The moments: things people at the front already do. Concrete, present tense, a little enviable.
const MOMENTS = [
  { id: "walk", Scene: Walk, kicker: "Every evening", title: "Plan tomorrow on a walk.",
    say: "Talk it through with ChatGPT. It's in your notes before you're home." },
  { id: "dump", Scene: Dump, kicker: "Every Monday", title: "Empty your head. Get a plan back.",
    say: "Paste the mess into Claude. It sorts it into today, this week and later." },
  { id: "agents", Scene: Agents, kicker: "If you build with agents", title: "One notebook for all your agents.",
    say: "Claude Code and Codex share your project notes, so every session starts where the last one stopped." },
];

// The week, told for "how did my week go?": Friday's check-in is the headline moment.
const CAPTIONS: Caption[] = [
  { at: [0, 0.27], day: 0, text: "Plan it with ChatGPT." },
  { at: [0.27, 0.47], day: 2, text: "Claude reads the same note." },
  { at: [0.47, 0.69], day: 4, text: "Ask how your week went." },
  { at: [0.69, 0.81], day: 6, text: "You tick the rest." },
  { at: [0.81, 1.01], day: 6, text: "The notebook you and your AI share." },
];

/// Version 5, "The week, then real life": the week film is the hero (its first frame is the first
/// screen), then three moments people actually have (an evening walk, the week's shopping, a brain
/// dump), alternating sides, then the templates and every app you can bring notes from.
export function V5({ hero = "stack" }: { hero?: string }) {
  const all = templates();
  const picks = PICKS.map((slug) => all.find((t) => t.slug === slug)).filter((t) => t !== undefined);
  return (
    <div className={`${l.main} ${d.main} ${v.main}`} data-quiet-nav="">
      {hero === "side" ? (
        <Film captions={CAPTIONS} hero={<>
        <h1 className={v.h1}>The notebook <span className={h.mark}>you and your AI</span> share.</h1>
        <p className={v.lede}>Plan with ChatGPT, check in with Claude, tick things off yourself. It all lands in one notebook that looks and feels like Apple Notes.</p>
        <Download quiet={G.quiet} />
      </>} />
      ) : (
        <div className={v.top}>
          <section className={v.band}>
            <h1 className={v.bandH1}>The notebook <span className={h.mark}>you and your AI</span> share.</h1>
            <div className={v.bandRow}>
              <p className={v.lede}>ChatGPT, Claude and Codex read and write in it, with your OK. It looks and feels like Apple Notes.</p>
              <Download quiet={G.quiet} />
            </div>
          </section>
          {hero === "single" ? <Film captions={CAPTIONS} /> : <Week />}
        </div>
      )}

      <section className={v.moments} aria-labelledby="moments">
        <div className={v.momentsHead}>
          <h2 id="moments" className={v.big}>People are already living like this.</h2>
          <p className={v.say}>Small habits that only work when your AI can write in your notes.</p>
        </div>
        {MOMENTS.map((x, i) => (
          <div key={x.id} className={v.row} data-flip={i % 2 ? "" : undefined}>
            <div className={v.words}>
              <p className={v.kicker}>{x.kicker}</p>
              <h3 className={v.rowTitle}>{x.title}</h3>
              <p className={v.say}>{x.say}</p>
            </div>
            <x.Scene />
          </div>
        ))}
      </section>

      <section className={v.togetherSec} aria-labelledby="together">
        <div className={v.momentsHead}>
          <h2 id="together" className={v.big}>Share a list. Watch it get ticked off.</h2>
          <p className={v.say}>Share any note with the people you live and plan with. Everyone sees every change as it happens, and your AI can add to it too.</p>
        </div>
        <Together />
      </section>

      <section className={d.wait} aria-labelledby="wait">
        <div className={d.centerHead}>
          <h2 id="wait" className={d.title}>Start from a template.</h2>
          <p className={d.lede}>A habit tracker, a budget, a trip plan. Notes that work like small apps. Change them yourself, or ask your AI. <a className={d.inline} href="/templates">See all templates</a></p>
        </div>
        <ul className={`${d.fan} ${g.fanWrap}`}>{picks.map((t) => <li key={t.slug}><Card t={t} heading="h3" tagline={G.apps.taglines[t.slug]} eager /></li>)}</ul>
      </section>

      <section className={v.bring} aria-labelledby="bring">
        <h2 id="bring" className={v.big}>Bring your notes with you.</h2>
        <p className={v.say} style={{ margin: "0 auto" }}>Every note comes over in one go, folders and checklists included. It looks and feels like Apple Notes, so there's nothing new to learn.</p>
        <ul className={v.sources}>
          {SOURCES.map((x) => <li key={x.name}>{x.icon ? <img src={x.icon} alt="" width={56} height={56} /> : <span className={v.md} aria-hidden="true">MD</span>}{x.name}</li>)}
        </ul>
        <figure className={v.shot}>
          <img src="/home-h/import-near.webp" width={1500} height={1100} loading="lazy" alt="Pinto Notes on a Mac right after importing from Apple Notes: 1,284 notes in their own folders." />
          <span className={v.imported}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>1,284 notes brought over from Apple Notes</span>
        </figure>
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
