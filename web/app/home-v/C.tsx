import Demo from "../Demo";
import Card from "../templates/Card";
import { AI_LEDE, AI_TITLE, AiAlso, Closing, PrivacySection } from "../Sections";
import a from "../sections.module.css";
import { coverPath } from "@/lib/template-covers";
import { templates } from "@/lib/templates";
import { AlsoTiles, AppleCopy, APPLE_TITLE, AppsChat, AppsCopy, Art, Hero, ImportCard } from "./parts";
import { CoverJobs } from "./CoverJobs";
import h from "./home-v.module.css";

/// The covers fanned beside the headline, as on the templates page.
const FAN = ["trip-plan", "habit-tracker", "weekly-review", "meal-plan"];
/// Three real templates, as their own cards.
const PICKS = ["weekly-review", "trip-plan", "meal-plan"];

// Direction C, cards: the home page made from the templates page, the one everyone loved. The headline
// has its fan of covers; each request an AI handles is a cover card with the chat set on its picture;
// the import and the app are cards in their picture's colour; three real templates close the pitch.
export default function HomeC() {
  const all = templates();
  const picks = PICKS.map((slug) => all.find((t) => t.slug === slug)!).filter(Boolean);
  return (
    <>
      <Hero className={h.heroFan} aside={<span className={h.fan} aria-hidden="true">{FAN.map((slug) => <img key={slug} src={coverPath(slug)} alt="" width={800} height={800} />)}</span>} />
      <div className="rise-soft" style={{ "--i": 3 } as React.CSSProperties}><Demo soft /></div>

      <section className={a.section} aria-labelledby="ai">
        <div className={a.head}>
          <h2 id="ai" className={a.h2}>{AI_TITLE}</h2>
          <p className={a.lede}>{AI_LEDE}</p>
        </div>
        <CoverJobs />
        <AiAlso />
      </section>

      <section className={a.section} aria-labelledby="import">
        <div className={a.head}>
          <h2 id="import" className={a.h2}>{APPLE_TITLE}</h2>
          <AppleCopy />
        </div>
        <div className={h.split} style={{ "--ground": "#808f66" } as React.CSSProperties}>
          <Art name="iphone-b" alt="Paper-cut iPhone on a wooden stand by a sunny window, showing a note with a checklist" className={h.splitArt} />
          <ImportCard className={h.onPanel} />
        </div>
      </section>

      <AlsoTiles />

      <section className={a.section} aria-labelledby="apps">
        <div className={`${h.split} ${h.splitApps}`} style={{ "--ground": "#0e5a62" } as React.CSSProperties}>
          <div className={`${a.head} ${h.splitText}`}><AppsCopy /></div>
          <div className={h.artWithCard}>
            <Art name="apps-b" alt="Paper-cut open book whose pages fold up into a small machine with dials and a chart" className={h.splitArt} />
            <AppsChat className={h.onArt} />
          </div>
        </div>
      </section>

      <section className={a.section} aria-labelledby="start">
        <div className={a.head}>
          <h2 id="start" className={a.h2}>Start from a template</h2>
          <p className={a.lede}>Notes made to be filled in with your AI. Pick one, and ChatGPT, Claude or Claude Code keeps it up for you. <a className={h.inline} href="/templates">See all {all.length} templates</a></p>
        </div>
        <ul className={h.picks}>{picks.map((t) => <li key={t.slug}><Card t={t} heading="h3" /></li>)}</ul>
      </section>

      <PrivacySection />
      <Closing />
    </>
  );
}
