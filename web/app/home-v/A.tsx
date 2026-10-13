import Demo from "../Demo";
import { AiSection, Closing, PrivacySection } from "../Sections";
import a from "../sections.module.css";
import { AlsoTiles, AppleCopy, APPLE_TITLE, AppsChat, AppsCopy, Art, Hero, ImportCard } from "./parts";
import h from "./home-v.module.css";

// Direction A, chapters: the page as it is, and every section opens with one paper-craft picture
// beside its words, alternating sides, the way a picture book sets a scene before the page's text.
export default function HomeA() {
  return (
    <>
      <Hero />
      <div className="rise-soft" style={{ "--i": 3 } as React.CSSProperties}><Demo soft /></div>

      <AiSection headClass={h.chapter} art={<Art name="share-c" alt="Paper-cut hands from two sides writing on the same sheet of paper" className={h.chapterArt} />} />

      <section className={a.section} aria-labelledby="import">
        <div className={`${h.chapter} ${h.flip}`}>
          <div className={a.head}>
            <h2 id="import" className={a.h2}>{APPLE_TITLE}</h2>
            <AppleCopy />
          </div>
          <Art name="iphone-b" alt="Paper-cut iPhone on a wooden stand by a sunny window, showing a note with a checklist" className={h.chapterArt} />
        </div>
        <ImportCard />
      </section>

      <AlsoTiles />

      <section className={a.section} aria-labelledby="apps">
        <div className={h.chapter}>
          <div className={a.head}><AppsCopy /></div>
          <div className={h.artWithCard}>
            <Art name="apps-b" alt="Paper-cut open book whose pages fold up into a small machine with dials and a chart" className={h.chapterArt} />
            <AppsChat className={h.onArt} />
          </div>
        </div>
      </section>

      <PrivacySection />
      <Closing />
    </>
  );
}
