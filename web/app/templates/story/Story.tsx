import type { TemplateStory } from "@/lib/template-story";
import { Phone } from "./Phone";
import Week from "./Week";
import s from "./story.module.css";

/// The top of a story page: the template's world as art, the promise, and the app on a Mac with
/// the iPhone in front of it.
export function StoryHero({ story, actions, fine, crumbs }: { story: TemplateStory; actions: React.ReactNode; fine: React.ReactNode; crumbs: React.ReactNode }) {
  return (
    <section className={s.hero} style={{ "--ground": story.art.ground, "--hero-ink": story.art.ink, "--art": `url(${story.art.src})`, "--art-phone": `url(${story.art.phone})` } as React.CSSProperties}>
      <div className={s.heroCopy}>
        {crumbs}
        <h1 className={s.h1}>{story.headline}</h1>
        <p className={s.lede}>{story.lede}</p>
        <div className={s.actions}>{actions}</div>
        <p className={s.fine}>{fine}</p>
      </div>
      <div className={s.devices}>
        <figure className={s.mac}>
          <div className={s.bar} aria-hidden="true"><span className={s.lights}><i /><i /><i /></span></div>
          <img src={story.mac.src} alt={story.mac.alt} width={story.mac.width} height={story.mac.height} decoding="async" fetchPriority="high" />
        </figure>
        <Phone src={story.phone.src} alt={story.phone.alt} className={s.heroPhone} priority />
      </div>
    </section>
  );
}

export function StoryWeek({ story }: { story: TemplateStory }) {
  return (
    <section className={s.weekSection} aria-labelledby="week">
      <h2 id="week" className={s.h2}>{story.week.title}</h2>
      <p className={s.sub}>{story.week.lede}</p>
      <Week week={story.week} />
    </section>
  );
}
