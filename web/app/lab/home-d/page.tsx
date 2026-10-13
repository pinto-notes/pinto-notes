import type { Metadata } from "next";
import Card from "../../templates/Card";
import { templates } from "@/lib/templates";
import { D } from "../copy";
import { GROCERIES } from "../data";
import { Download, Phone, PhoneNote } from "../kit";
import l from "../lab.module.css";
import Facts from "./Facts";
import HeroNote from "./HeroNote";
import ImportCard from "./ImportCard";
import Notebook from "./Notebook";
import Week from "./Week";
import s from "./d.module.css";

export const metadata: Metadata = { title: "Home study D: the plan that gets done" };

/** Three templates whose notes do more than hold text, fanned like the templates page's covers. */
const PICKS = ["habit-tracker", "trip-plan", "budget-log"];

const rise = (i: number) => ({ style: { "--i": i } as React.CSSProperties });

// Study D, round 2. Concept: the plan that gets done. Each section has its own shape, and the page
// moves light, dark, light, dark: the desk; one note told over time; the week on leaf brown; the
// bundle of notes coming over; the templates fanned; the ending on leaf brown with the facts.
export default function HomeD() {
  const all = templates();
  const picks = PICKS.map((slug) => all.find((t) => t.slug === slug)).filter((t) => t !== undefined);
  return (
    <div className={`${l.main} ${s.main}`} data-quiet-nav="">
      {/* Focus: what it is, and the plan getting done in front of you. */}
      <section className={s.hero}>
        <div className={s.heroText}>
          <h1 className={`${l.h1} ${s.h1} rise`}>{D.h1}</h1>
          <p className={`${l.lede} rise`} {...rise(1)}>{D.lede}</p>
          <div className="rise" {...rise(2)}><Download quiet={D.quiet} /></div>
        </div>
        <div className={`${s.desk} rise-soft`} {...rise(2)}>
          <img className={s.deskArt} src="/home-d/desk.webp" srcSet="/home-d/desk-700.webp 700w, /home-d/desk.webp 1254w" sizes="(min-width: 1000px) 640px, 92vw"
            width={1254} height={1254} alt="" fetchPriority="high" />
          <HeroNote />
        </div>
      </section>

      {/* Focus: every AI writes in the same note. One column, one left edge, the note told over time. */}
      <section className={s.notebook} aria-labelledby="one-notebook">
        <div className={s.columnHead}>
          <h2 id="one-notebook" className={s.title}>{D.oneNotebook.title}</h2>
          <p className={s.lede}>{D.oneNotebook.lede}</p>
        </div>
        <Notebook />
      </section>

      {/* Focus: plans keep moving. The page's first dark band, one plan over a week. */}
      <section className={s.band} aria-labelledby="plans">
        <div className={s.bandInner}>
          <h2 id="plans" className={s.statement}>{D.plans.title}</h2>
          <p className={s.bandLede}>{D.plans.lede}</p>
          <Week />
        </div>
      </section>

      {/* Focus: it feels like the notes app you know, and yours come along. The picture leads, words on the right. */}
      <section className={s.feel} aria-labelledby="feel">
        <div className={s.feelArt}>
          <img src="/home-d/bring.webp" srcSet="/home-d/bring-600.webp 600w, /home-d/bring.webp 1086w" sizes="(min-width: 960px) 560px, 92vw" width={1086} height={1448}
            alt="Paper-cut notes in a folder, tied with an orange ribbon, beside an olive sprig" loading="lazy" decoding="async" />
          <ImportCard />
        </div>
        <div className={s.feelText}>
          <h2 id="feel" className={s.title}>{D.feel.title}</h2>
          <p className={s.lede}>{D.feel.lede}</p>
          <figure className={s.feelPhone}>
            <Phone width="272px" label="Pinto Notes on iPhone: the Groceries note, with the lines ChatGPT just added tinted.">
              <PhoneNote title="Groceries" lines={GROCERIES} receipt={{ who: "chatgpt", text: "ChatGPT changed 5 lines" }} />
            </Phone>
            <figcaption className={s.soon}>{D.feel.soon}</figcaption>
          </figure>
        </div>
      </section>

      {/* Focus: the surprise, in the templates' own cards, fanned. */}
      <section className={s.wait} aria-labelledby="wait">
        <div className={s.centerHead}>
          <h2 id="wait" className={s.title}>{D.wait.title}</h2>
          <p className={s.lede}>{D.wait.lede} <a className={s.inline} href="/templates">{D.wait.all}</a></p>
        </div>
        <ul className={s.fan}>{picks.map((t) => <li key={t.slug}><Card t={t} heading="h3" /></li>)}</ul>
      </section>

      {/* Focus: the one thing to do, on the leaf brown band, with the four facts under it. */}
      <section className={`${s.band} ${s.closing}`} aria-labelledby="closing">
        <div className={s.bandInner}>
          <img src="/mark-256.png" alt="" width={104} height={104} className={s.closingIcon} />
          <h2 id="closing" className={s.closingTitle}>{D.closing.title}</h2>
          <Download className={s.closingCta} quiet={D.closing.fine} />
          <Facts />
        </div>
      </section>
    </div>
  );
}
