import Card from "../../../templates/Card";
import { templates } from "@/lib/templates";
import { G } from "../../copy";
import { Download } from "../../kit";
import l from "../../lab.module.css";
import d from "../../home-d/d.module.css";
import g from "../../home-g/g.module.css";
import h from "../../home-h/h.module.css";
import { Film, type Caption } from "../v2/Film";
import { Agents, Habits, Pin, Walk } from "./Moments";
import { ScrollVar } from "./ScrollVar";
import { Week } from "./Week";
import v from "./v5.module.css";

const PICKS = ["habit-tracker", "trip-plan", "budget-log"];

// The small things, eight tiles. Only what's true today; collaboration says so until it ships.
const EXTRAS = [
  { icon: "/home-v5/icons/envelope.webp", title: "Private", say: "Encrypted on your device before it syncs." },
  { icon: "/home-v5/icons/undo.webp", title: "Every change says who", say: "You or which AI. Undo takes it back." },
  { icon: "/home-v5/icons/lock.webp", title: "Lock a note", say: "A separate password for the private ones." },
  { icon: "/home-v5/icons/devices.webp", title: "Mac and iPhone", say: "Always in sync, and works offline." },
  { icon: "/home-v5/icons/bring.webp", title: "Bring your notes", say: "From Apple Notes, Obsidian, Bear, Evernote and Keep." },
  { icon: "/home-v5/icons/notepad.webp", title: "Feels like Apple Notes", say: "Checklists, tables, folders, links between notes." },
  { icon: "/home-v5/icons/box.webp", title: "Open source", say: "Anyone can check the code." },
  { icon: "/home-v5/icons/people.webp", title: "Share with people", say: "Plan together in one note, live.", soon: true },
];

// Three features, each named plainly, with one real-life example under it.
const FEATURES = [
  { id: "voice", Scene: Walk, kicker: "Voice", title: "Just say it.",
    say: "Talk to your AI. It writes it down." },
  { id: "habits", Scene: Habits, kicker: "Trackers", title: "Your AI ticks it off.",
    say: "Tell it what you did. Your trackers update themselves." },
  { id: "agents", Scene: Agents, kicker: "Agents", title: "Your agents share one brain.",
    say: "Every session starts where the last one stopped." },
];



// The week, told for "how did my week go?": Friday's check-in is the headline moment.
const CAPTIONS: Caption[] = [
  { at: [0, 0.27], day: 0, text: "Plan it with ChatGPT." },
  { at: [0.27, 0.47], day: 2, text: "Claude reads the same note." },
  { at: [0.47, 0.69], day: 4, text: "Ask how your week went." },
  { at: [0.69, 1.01], day: 6, text: "You tick the rest." },
];

/// Version 5, "The week, then real life": the week film is the hero (its first frame is the first
/// screen), then three moments people actually have (an evening walk, the week's shopping, a brain
/// dump), alternating sides, then the templates and every app you can bring notes from.
export function V5({ hero = "side", band = "sage" }: { hero?: string; band?: string }) {
  const all = templates();
  const picks = PICKS.map((slug) => all.find((t) => t.slug === slug)).filter((t) => t !== undefined);
  return (
    <div className={`${l.main} ${d.main} ${v.main}`} data-quiet-nav="">
      {hero === "side" ? (
        <Film captions={CAPTIONS} stopAt={0.83} hero={<>
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

      <section className={`${v.moments} ${v.featBand}`} data-band={band} data-dark-band={band} aria-labelledby="moments">
        {FEATURES.map((x, i) => (
          <Pin key={x.id}><div className={v.row} data-flip={i % 2 ? "" : undefined}>
            <div className={v.words}>
              <p className={v.kicker}>{x.kicker}</p>
              <h2 id={i === 0 ? "moments" : undefined} className={v.rowTitle}>{x.title}</h2>
              <p className={v.say}>{x.say}</p>
            </div>
            <x.Scene />
          </div></Pin>
        ))}
      </section>

      <section className={d.wait} aria-labelledby="wait">
        <div className={d.centerHead}>
          <h2 id="wait" className={d.title}>Start from a template.</h2>
          <p className={d.lede}>A habit tracker, a budget, a trip plan. Notes that work like small apps. Change them yourself, or ask your AI. <a className={d.inline} href="/templates">See all templates</a></p>
        </div>
        <ScrollVar as="ul" className={`${d.fan} ${g.fanWrap} ${v.scrollFan}`} from={1} to={0.35}>{picks.map((t) => <li key={t.slug}><Card t={t} heading="h3" tagline={G.apps.taglines[t.slug]} eager /></li>)}</ScrollVar>
      </section>

      <section className={v.extras} aria-labelledby="extras">
        <h2 id="extras" className={v.big}>And everything you'd expect.</h2>
        <ScrollVar as="ul" className={v.grid} from={1} to={0.55}>
          {EXTRAS.map((x, i) => (
            <li key={x.title} style={{ "--i": i } as React.CSSProperties}>
              <span className={v.icon}><img src={x.icon} alt="" width={64} height={64} loading="lazy" /></span>
              <h3>{x.title}{x.soon && <em>Coming soon</em>}</h3>
              <p>{x.say}</p>
            </li>
          ))}
        </ScrollVar>
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
