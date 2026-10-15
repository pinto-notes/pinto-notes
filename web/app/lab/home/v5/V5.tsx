import Card from "../../../templates/Card";
import { templates } from "@/lib/templates";
import { G } from "../../copy";
import { Download } from "../../kit";
import l from "../../lab.module.css";
import d from "../../home-d/d.module.css";
import g from "../../home-g/g.module.css";
import h from "../../home-h/h.module.css";
import { Film, type Caption } from "../v2/Film";
import { Agents, Habits, Pin, Together, Walk } from "./Moments";
import { Week } from "./Week";
import v from "./v5.module.css";

const PICKS = ["habit-tracker", "trip-plan", "budget-log"];

// Three features, each named plainly, with one real-life example under it.
const FEATURES = [
  { id: "voice", Scene: Walk, kicker: "Voice", title: "Talk to your notes, wherever you are.",
    say: "Open your AI's voice mode and just say it. It lands in your notes.", example: "Plan tomorrow out loud on an evening walk. It's written down before you're home." },
  { id: "habits", Scene: Habits, kicker: "Trackers", title: "Your AI keeps your trackers up to date.",
    say: "Habits, budgets, workouts. Tell your AI what you did, and it ticks it off for you.", example: "\u201cDid the gym this morning.\u201d Ticked, and the streak goes up." },
  { id: "agents", Scene: Agents, kicker: "Agents", title: "One notebook for all your agents.",
    say: "Claude Code and Codex read and write the same project notes.", example: "Tomorrow's session starts where today's stopped, and every change says which agent made it." },
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
export function V5({ hero = "side" }: { hero?: string }) {
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
        {FEATURES.map((x, i) => (
          <Pin key={x.id}><div className={v.row} data-flip={i % 2 ? "" : undefined}>
            <div className={v.words}>
              <p className={v.kicker}>{x.kicker}</p>
              <h2 id={i === 0 ? "moments" : undefined} className={v.rowTitle}>{x.title}</h2>
              <p className={v.say}>{x.say}</p>
              <p className={v.example}><span>For example</span>{x.example}</p>
            </div>
            <x.Scene />
          </div></Pin>
        ))}
      </section>

      <section className={v.togetherSec} aria-labelledby="together">
        <div className={v.momentsHead}>
          <h2 id="together" className={v.big}>Share a list. Watch it get ticked off.</h2>
          <p className={v.say}>Share any note with the people you live and plan with. Everyone sees every change as it happens, and your AI can add to it too.</p>
        </div>
        <Pin length={170}><Together /></Pin>
      </section>

      <section className={d.wait} aria-labelledby="wait">
        <div className={d.centerHead}>
          <h2 id="wait" className={d.title}>Start from a template.</h2>
          <p className={d.lede}>A habit tracker, a budget, a trip plan. Notes that work like small apps. Change them yourself, or ask your AI. <a className={d.inline} href="/templates">See all templates</a></p>
        </div>
        <ul className={`${d.fan} ${g.fanWrap}`}>{picks.map((t) => <li key={t.slug}><Card t={t} heading="h3" tagline={G.apps.taglines[t.slug]} eager /></li>)}</ul>
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
