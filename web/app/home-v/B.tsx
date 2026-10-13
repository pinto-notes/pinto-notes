import Demo from "../Demo";
import { AiAlso, AI_LEDE, AI_TITLE, Closing, JOBS, PrivacySection } from "../Sections";
import a from "../sections.module.css";
import { AlsoTiles, AppleCopy, APPLE_TITLE, AppsChat, AppsCopy, Art, Hero, ImportCard } from "./parts";
import { Jobs } from "./Jobs";
import h from "./home-v.module.css";

// Direction B, scenes: the product sits inside the paper world. The demo's desk is a paper-cut
// lakeside, and each section is one big panel in its picture's own colour, the picture bleeding off
// the panel's edge and the proof (the requests, the import, the app) set on the same ground.
export default function HomeB() {
  return (
    <>
      <Hero />
      <div className="rise-soft" style={{ "--i": 3 } as React.CSSProperties}><Demo soft wallpaper="/templates/covers/weekly-review.webp" /></div>

      <section className={`${h.panel} ${h.dark}`} style={{ "--ground": "#284630" } as React.CSSProperties} aria-labelledby="ai">
        <div className={h.panelRow}>
          <div className={a.head}>
            <h2 id="ai" className={a.h2}>{AI_TITLE}</h2>
            <p className={a.lede}>{AI_LEDE}</p>
          </div>
          <Art name="share-b" alt="Paper-cut table from above with two coffee cups and one shared notebook, a note open on a phone beside it" className={h.panelArt} />
        </div>
        <Jobs jobs={JOBS} />
        <AiAlso />
      </section>

      <section className={h.panel} style={{ "--ground": "#77aad9" } as React.CSSProperties} aria-labelledby="import">
        <div className={`${h.panelRow} ${h.flip}`}>
          <div className={a.head}>
            <h2 id="import" className={a.h2}>{APPLE_TITLE}</h2>
            <AppleCopy />
          </div>
          <Art name="iphone-a" alt="Paper-cut iPhone on a round wooden table with a coffee, showing a note with a checklist" className={h.panelArt} />
        </div>
        <ImportCard className={h.onPanel} />
      </section>

      <AlsoTiles />

      <section className={`${h.panel} ${h.dark}`} style={{ "--ground": "#0e5a62" } as React.CSSProperties} aria-labelledby="apps">
        <div className={h.panelRow}>
          <div className={a.head}><AppsCopy /><AppsChat className={h.chatInPanel} /></div>
          <Art name="apps-b" alt="Paper-cut open book whose pages fold up into a small machine with dials and a chart" className={h.panelArt} />
        </div>
      </section>

      <PrivacySection />
      <Closing />
    </>
  );
}
