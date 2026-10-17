import Card from "../templates/Card";
import { templates } from "@/lib/templates";
import { G } from "./copy";
import { Download } from "./Download";
import { Film } from "./Film";
import { Hero } from "./Hero";
import { PhoneToFilm } from "./PhoneToFilm";
import { PaperStill } from "./Scenes";
import { ScrollVar } from "./ScrollVar";
import d from "./sections.module.css";
import v from "./home.module.css";

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

/// The home page: the hero, her note lifting off into the week film, three people already living like
/// this, templates, everything else, and the download.
/// `people`: "b" tries the smarter people scenes, where each answer uses what the notebook remembers
/// (lab only, ?people=b).
export function Home({ people, sara }: { people?: string; sara?: string } = {}) {
  const b = people === "b";
  const all = templates();
  const picks = PICKS.map((slug) => all.find((t) => t.slug === slug)).filter((t) => t !== undefined);
  return (
    <div className={`${d.main} ${v.main}`} data-quiet-nav="">
      <div className={v.top}>
        <Hero />
        <PhoneToFilm />
        <Film />
      </div>

      <section className={v.frontier} aria-labelledby="moments">
        <div className={v.frontierHead}>
          <h2 id="moments" className={v.big}>People are already living like this.</h2>
          <p className={v.say}>Ordinary people. An unfair advantage.</p>
        </div>
        <div className={v.row}>
          <div className={v.words}>
            <p className={v.kicker}>Every evening, on a walk</p>
            <h3 className={v.rowTitle}>Maya plans tomorrow out loud.</h3>
            <p className={v.say}>{b ? "She talks her day through with ChatGPT voice. It has eight months of her notes, so the plan fits her life, not an average one." : "She talks her day through out loud with ChatGPT voice. It's planned before she's home."}</p>
          </div>
          <PaperStill voice at="left" focus={2} src="/home-v5/frontier/maya-paper.webp" where="Maya · San Francisco, 21:40"
            alt="A cut-paper scene of San Francisco at dusk from Dolores Park, a woman walking with her phone, the skyline lit up."
            me={b ? "Plan tomorrow." : "Skipped the reading again."} aiName="ChatGPT" aiGlyph="openai"
            ai={b ? "Run before work again? Your sleep log says you sleep better every week you do. And you told Sara you'd send the photos by Friday." : "Third time this week. Want to move it to the mornings, before work?"} />
        </div>
        <div className={v.row} data-flip="">
          {b ? <>
          <div className={v.words}>
            <p className={v.kicker}>His notebook, all night</p>
            <h3 className={v.rowTitle}>Jonas&apos;s agents work the night shift.</h3>
            <p className={v.say}>Claude Code and Codex work from the same notes. Each one logs what it did, so the next starts where it stopped. He wakes up to one question.</p>
          </div>
          <PaperStill at="left" focus={78} src="/home-v5/frontier/jonas-lisbon.webp" where="Jonas · Lisbon, 01:10"
            alt="A cut-paper scene of a man at his desk late at night, a laptop glowing, Lisbon's rooftops and the river through tall open windows."
            me="Finish the offline queue tonight. Have Codex review it." aiName="Claude Code" aiGlyph="claude" ai="On it. I'll log each step in Sync rewrite, so Codex picks up where I stop." log />
          </> : <>
          <div className={v.words}>
            <p className={v.kicker}>All night</p>
            <h3 className={v.rowTitle}>Jonas&apos;s agents never start from zero.</h3>
            <p className={v.say}>Every plan and decision he writes down is there for Claude Code and Codex. They start every task already knowing the project.</p>
          </div>
          <PaperStill at="left" focus={78} src="/home-v5/frontier/jonas-lisbon.webp" where="Jonas · Lisbon, 01:10"
            alt="A cut-paper scene of a man at his desk late at night, a laptop glowing, Lisbon's rooftops and the river through tall open windows."
            me="Pick up the sync rewrite." aiName="Claude Code" aiGlyph="claude" ai="Read your plan and yesterday's log. Starting where Codex stopped: the offline queue." />
          </>}
        </div>
        <div className={v.row}>
          {b && sara !== "review" ? <>
          <div className={v.words}>
            <p className={v.kicker}>Every morning, over coffee</p>
            <h3 className={v.rowTitle}>Sara never forgets what friends tell her.</h3>
            <p className={v.say}>She jots down what people tell her. Muse reminds her before she sees them.</p>
          </div>
          <PaperStill friend at="right" focus={14} src="/home-v5/frontier/sara-cafe.webp" where="Sara · Stockholm, 08:10"
            alt="A cut-paper scene of a woman in a café by the water in Stockholm in the morning, coffee on the table, looking at her phone."
            me="Dinner with Leo tonight." aiName="Muse" aiGlyph="meta" ai="Ask how his dad's surgery went. And he's off gluten now, so not the pasta place." />
          </> : b ? <>
          <div className={v.words}>
            <p className={v.kicker}>Before her review, over coffee</p>
            <h3 className={v.rowTitle}>Sara walks into her review with a year of proof.</h3>
            <p className={v.say}>She notes what she ships as she goes. On review day, Muse reads the year and writes her the case, every point with the date it happened.</p>
          </div>
          <PaperStill review at="right" focus={14} src="/home-v5/frontier/sara-cafe.webp" where="Sara · Stockholm, 08:10"
            alt="A cut-paper scene of a woman in a café by the water in Stockholm in the morning, coffee on the table, looking at her phone."
            me="My review is at ten. What did I actually do this year?" aiName="Muse" aiGlyph="meta" ai="More than you remember: fourteen wins, five with numbers. The best three are in Review prep." />
          </> : <>
          <div className={v.words}>
            <p className={v.kicker}>Every morning, over coffee</p>
            <h3 className={v.rowTitle}>Sara built her own budget.</h3>
            <p className={v.say}>Budget apps sit unused. Hers lives next to her plans, so her AI can answer the real questions.</p>
          </div>
          <PaperStill budget at="right" focus={14} src="/home-v5/frontier/sara-cafe.webp" where="Sara · Stockholm, 08:10"
            alt="A cut-paper scene of a woman in a café by the water in Stockholm in the morning, coffee on the table, looking at her phone."
            me="Can I afford the Lisbon trip?" aiName="Muse" aiGlyph="meta" ai="Yes, if you skip two dinners out. Groceries are 410 kr under, and the flights are already paid." />
          </>}
        </div>
      </section>

      <section className={d.wait} aria-labelledby="wait">
        <div className={d.centerHead}>
          <h2 id="wait" className={d.title}>Start from a template.</h2>
          <p className={d.lede}>A habit tracker, a budget, a trip plan. Notes that work like small apps. Change them yourself, or ask your AI. <a className={d.inline} href="/templates">See all templates</a></p>
        </div>
        <ScrollVar as="ul" className={`${d.fan} ${d.fanWrap} ${v.scrollFan}`} from={1} to={0.35}>{picks.map((t) => <li key={t.slug}><Card t={t} heading="h3" tagline={G.apps.taglines[t.slug]} eager /></li>)}</ScrollVar>
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
          <p className={d.closingWorks}>Works with ChatGPT, Claude, Claude Code, Codex and Incredible.</p>
          <Download className={`${d.closingCta} ${d.ctaCenter}`} quiet={G.closing.fine} />
        </div>
      </section>
    </div>
  );
}
