import type { Metadata } from "next";
import Card from "../../templates/Card";
import { templates } from "@/lib/templates";
import { G } from "../copy";
import { GROCERIES } from "../data";
import { Download, Phone, PhoneNote } from "../kit";
import l from "../lab.module.css";
import Facts, { Struck } from "../home-d/Facts";
import HeroNote from "../home-d/HeroNote";
import ImportCard from "../home-d/ImportCard";
import Notebook from "../home-d/Notebook";
import Week from "../home-d/Week";
import d from "../home-d/d.module.css";
import Control from "./Control";
import s from "./g.module.css";

export const metadata: Metadata = { title: G.title, description: G.description };

const PICKS = ["habit-tracker", "trip-plan", "budget-log"];
const rise = (i: number) => ({ style: { "--i": i } as React.CSSProperties });

/** The three control facts under the approval story, each with its paper icon and its moment. */
const CONTROL_FACTS = [
  { key: "lock", line: "Encrypted on your Mac before it syncs." },
  { key: "undo", line: <>Every <Struck>change</Struck> is marked, and Undo takes it back.</> },
  { key: "box", line: "Open source, so anyone can check." },
];

// Study G, the joint homepage: D's sections and stories with growth's words, a story of the approval
// sheet, and a closing in three steps. Cream, cream, dark, cream, tint, cream, dark.
export default async function HomeG({ searchParams }: { searchParams: Promise<{ alt?: string }> }) {
  // ?alt=art: section 5 with the picture and the import card, no phone. Only that section differs.
  const art = (await searchParams).alt === "art";
  const all = templates();
  const picks = PICKS.map((slug) => all.find((t) => t.slug === slug)).filter((t) => t !== undefined);
  return (
    <div className={`${l.main} ${d.main}`} data-quiet-nav="">
      {/* 1. What it is, and the plan getting done. */}
      <section className={`${d.hero} ${s.heroFold}`}>
        <div className={d.heroText}>
          <h1 className={`${l.h1} ${d.h1} rise`}>{G.h1}</h1>
          <p className={`${l.lede} rise`} {...rise(1)}>{G.lede}</p>
          <div className="rise" {...rise(2)}><Download quiet={G.quiet} /></div>
        </div>
        <div className={`${d.desk} rise-soft`} {...rise(2)}>
          <img className={d.deskArt} src="/home-d/desk.webp" srcSet="/home-d/desk-700.webp 700w, /home-d/desk.webp 1254w" sizes="(min-width: 1000px) 640px, 92vw"
            width={1254} height={1254} alt="" fetchPriority="high" />
          <HeroNote order="ai-last" />
        </div>
      </section>

      {/* 2. Every AI writes in the same note, one change at a time. */}
      {/* The note leads and its title follows, so the first screen's foot shows the note coming, never a second headline. */}
      <section className={`${d.notebook} ${s.noteFirst}`} aria-labelledby="one-notebook">
        <div className={d.columnHead}>
          <h2 id="one-notebook" className={d.title}>{G.notebook.title}</h2>
          <p className={d.lede}>{G.notebook.lede}</p>
        </div>
        <Notebook icons />
      </section>

      {/* 3. Plans keep moving: the first dark band. */}
      <section className={d.band} aria-labelledby="plans">
        <div className={d.bandInner}>
          <h2 id="plans" className={d.statement}>{G.plans.title}</h2>
          <p className={d.bandLede}>{G.plans.lede}</p>
          <Week />
        </div>
      </section>

      {/* 4. A note can be an app: the cards turn into their apps. */}
      <section className={d.wait} aria-labelledby="wait">
        <div className={d.centerHead}>
          <h2 id="wait" className={d.title}>{G.apps.title}</h2>
          <p className={d.lede}>{G.apps.lede} <a className={d.inline} href="/templates">{G.apps.all}</a></p>
        </div>
        <ul className={`${d.fan} ${s.fanWrap}`}>{picks.map((t) => <li key={t.slug}><Card t={t} heading="h3" tagline={G.apps.taglines[t.slug]} /></li>)}</ul>
      </section>

      {/* 5. It feels like the notes app you know, and yours come along: on a soft tint. */}
      <section className={s.tint} aria-labelledby="feel" data-alt={art ? "art" : undefined}>
        {art ? (
          <div className={d.feel}>
            <div className={d.feelArt}>
              <img src="/home-d/bring.webp" srcSet="/home-d/bring-600.webp 600w, /home-d/bring.webp 1086w" sizes="(min-width: 960px) 560px, 92vw" width={1086} height={1448}
                alt="Paper-cut notes in a folder, tied with an orange ribbon, beside an olive sprig" loading="lazy" decoding="async" />
              <ImportCard />
            </div>
            <div className={d.feelText}>
              <h2 id="feel" className={d.title}>{G.feel.title}</h2>
              <p className={d.lede}>{G.feel.ledeAlt}</p>
            </div>
          </div>
        ) : (
          <div className={s.feelG}>
            <div className={s.feelObjects}>
              <figure className={s.feelPhone}>
                <Phone width="272px" label="Pinto Notes on iPhone: the Groceries note, with the lines ChatGPT just added tinted.">
                  <PhoneNote title="Groceries" lines={GROCERIES} receipt={{ who: "chatgpt", text: "ChatGPT changed 5 lines" }} />
                </Phone>
                <figcaption className={d.soon}>{G.feel.soon}</figcaption>
              </figure>
              <div className={s.feelImport}><ImportCard /></div>
            </div>
            <div className={d.feelText}>
              <h2 id="feel" className={d.title}>{G.feel.title}</h2>
              <p className={d.lede}>{G.feel.lede}</p>
            </div>
          </div>
        )}
      </section>

      {/* 6. You approve each AI, and every change can be undone. */}
      <section className={s.control} aria-labelledby="control">
        <h2 id="control" className={`${d.title} ${s.controlTitle}`}>{G.control.title}</h2>
        <Control />
        <Facts items={CONTROL_FACTS} light />
      </section>

      {/* 7. The one thing to do, in three steps, on leaf brown. */}
      <section className={`${d.band} ${d.closing}`} aria-labelledby="closing">
        <div className={d.bandInner}>
          <img src="/mark-256.png" alt="" width={104} height={104} className={d.closingIcon} />
          <h2 id="closing" className={d.closingTitle}>{G.closing.title}</h2>
          <ol className={s.stepsRow}>
            {G.closing.steps.map((t, k) => (
              <li key={k}><span className={s.num}>{k + 1}</span><span><b>{t.title}</b><span className={s.stepRest}>{t.line}</span></span></li>
            ))}
          </ol>
          <Download className={d.closingCta} />
          <div className={s.after}><p className={s.works}>{G.closing.works}</p><p className={s.fine}>{G.closing.fine}</p></div>
          <p className={s.proof}>{G.closing.proof.join(" · ")}</p>
        </div>
      </section>
    </div>
  );
}
