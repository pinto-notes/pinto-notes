import Card from "../../../templates/Card";
import { templates } from "@/lib/templates";
import { G } from "../../copy";
import { Download } from "../../kit";
import l from "../../lab.module.css";
import d from "../../home-d/d.module.css";
import g from "../../home-g/g.module.css";
import h from "../../home-h/h.module.css";
import { Film, type Caption } from "../v2/Film";
import { PaperStill } from "./Moments";
import { AliveHero, TypeHero, WorldHero } from "./Heroes";
import { AskHero, FieldHero, HandsHero, PageHero, ProductHero, ThreadsHero } from "./Heroes2";
import { ScrollVar } from "./ScrollVar";
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
export function V5({ hero = "hands", band = "sage" }: { hero?: string; band?: string }) {
  const all = templates();
  const picks = PICKS.map((slug) => all.find((t) => t.slug === slug)).filter((t) => t !== undefined);
  return (
    <div className={`${l.main} ${d.main} ${v.main}`} data-quiet-nav="">
      {(["threads", "product", "hands", "field", "page", "ask"] as const).includes(hero as never) ? (
        <div className={v.top}>
          {hero === "threads" ? <ThreadsHero /> : hero === "product" ? <ProductHero /> : hero === "hands" ? <HandsHero /> : hero === "field" ? <FieldHero /> : hero === "page" ? <PageHero /> : <AskHero />}
          <Film captions={CAPTIONS} stopAt={0.83} />
        </div>
      ) : hero === "calm" ? (
        <div className={v.top}><WorldHero art="night" calm /><Film captions={CAPTIONS} stopAt={0.83} /></div>
      ) : hero === "world-day" || hero === "world-night" ? (
        <div className={v.top}><WorldHero art={hero === "world-day" ? "day" : "night"} /><Film captions={CAPTIONS} stopAt={0.83} /></div>
      ) : hero === "type" ? (
        <div className={v.top}><TypeHero /><Film captions={CAPTIONS} stopAt={0.83} /></div>
      ) : hero === "alive" ? (
        <div className={v.top}><AliveHero /><Film captions={CAPTIONS} stopAt={0.83} /></div>
      ) : (
        <Film captions={CAPTIONS} stopAt={0.83} hero={<>
        <h1 className={v.h1}>The notebook <span className={h.mark}>you and your AI</span> share.</h1>
        <p className={v.lede}>Plan with ChatGPT, check in with Claude, tick things off yourself. It all lands in one notebook that looks and feels like Apple Notes.</p>
        <Download quiet={G.quiet} />
      </>} />
      )}

      <section className={v.frontier} aria-labelledby="moments">
        <div className={v.frontierHead}>
          <h2 id="moments" className={v.big}>People are already living like this.</h2>
          <p className={v.say}>Ordinary people. An unfair advantage.</p>
        </div>
        <div className={v.row}>
          <div className={v.words}>
            <p className={v.kicker}>Every evening, on a walk</p>
            <h3 className={v.rowTitle}>Maya plans tomorrow out loud.</h3>
            <p className={v.say}>She talks her day through out loud with ChatGPT voice. It's planned before she's home.</p>
          </div>
          <PaperStill voice at="left" src="/home-v5/frontier/maya-paper.webp" where="Maya · San Francisco, 21:40"
            alt="A cut-paper scene of San Francisco at dusk from Dolores Park, a woman walking with her phone, the skyline lit up."
            me="Skipped the reading again." aiName="ChatGPT" aiGlyph="openai" ai="Third time this week. Want to move it to the mornings, before work?" />
        </div>
        <div className={v.row} data-flip="">
          <div className={v.words}>
            <p className={v.kicker}>All night</p>
            <h3 className={v.rowTitle}>Jonas&apos;s agents never start from zero.</h3>
            <p className={v.say}>Every plan and decision he writes down is there for Claude Code and Codex. They start every task already knowing the project.</p>
          </div>
          <PaperStill at="left" src="/home-v5/frontier/jonas-lisbon.webp" where="Jonas · Lisbon, 01:10"
            alt="A cut-paper scene of a man at his desk late at night, a laptop glowing, Lisbon's rooftops and the river through tall open windows."
            me="Pick up the sync rewrite." aiName="Claude Code" aiGlyph="claude" ai="Read your plan and yesterday's log. Starting where Codex stopped: the offline queue." />
        </div>
        <div className={v.row}>
          <div className={v.words}>
            <p className={v.kicker}>Every morning, over coffee</p>
            <h3 className={v.rowTitle}>Sara built her own budget.</h3>
            <p className={v.say}>Budget apps sit unused. Hers lives next to her plans, so her AI can answer the real questions.</p>
          </div>
          <PaperStill budget at="right" src="/home-v5/frontier/sara-cafe.webp" where="Sara · Stockholm, 08:10"
            alt="A cut-paper scene of a woman in a café by the water in Stockholm in the morning, coffee on the table, looking at her phone."
            me="Can I afford the Lisbon trip?" aiName="Muse" aiGlyph="meta" ai="Yes, if you skip two dinners out. Groceries are 410 kr under, and the flights are already paid." />
        </div>
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
