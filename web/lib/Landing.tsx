import type { Metadata } from "next";
import DownloadLink from "@/app/DownloadLink";
import PlatformNote from "@/app/PlatformNote";
import home from "@/app/home.module.css";
import a from "@/app/sections.module.css";
import { AIGlyph } from "./ai-glyphs";
import { Figure, longDate } from "./blog";
import legal from "./legal.module.css";
import { landingPath, type Landing } from "./landings";
import l from "./landing.module.css";
import { APP_STORE_LIVE, APP_STORE_URL, SITE_NAME, pageMetadata } from "./site";
import { JsonLd, app, breadcrumbs, faqPage, incredible, maker, organization } from "./structured-data";
import { latestVersion } from "./changelog";
import { ClosingBand, MAC_FINE } from "./ClosingBand";

/// A landing page for one audience or search (lib/landings.ts): the promise, a real capture, three
/// things to do with a real-looking exchange each, a dated comparison where one is fair to make,
/// questions and the download. Built from the home page's parts, so it looks like the rest of the site.

export function landingMetadata(x: Landing): Metadata {
  return pageMetadata({ title: x.title, shareTitle: x.shareTitle, description: x.description, path: landingPath(x) });
}

const rise = (i: number) => ({ style: { "--i": i } as React.CSSProperties });
const Tick = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>;

/// The headline with its marked words, which never split across lines.
function Headline({ text, mark }: { text: string; mark?: string }) {
  if (!mark || !text.includes(mark)) return <>{text}</>;
  const [before, after] = text.split(mark);
  return <>{before}<mark className={home.mark}>{mark}</mark>{after}</>;
}

export function LandingPage({ x }: { x: Landing }) {
  const path = landingPath(x);
  const graph = [app(latestVersion()), organization, maker, incredible, breadcrumbs([{ name: SITE_NAME, path: "/" }, { name: x.crumb, path }])];
  if (x.faq.length) graph.push(faqPage(x.faq, path));
  return (
    <div className={`${home.main} ${l.main}`}>
      <JsonLd graph={graph} />
      <section className={`${home.hero} ${l.hero}`}>
        <p className={`${l.eyebrow} rise`} {...rise(0)}>{x.eyebrow}</p>
        <h1 className={`${home.h1} ${l.h1} rise`} {...rise(0)}><Headline text={x.h1} mark={x.mark} /></h1>
        <p className={`${home.lede} rise`} {...rise(1)}>{x.lede}</p>
        <div className={`${home.ctas} rise pi-apple pi-not-ios`} {...rise(2)}>
          <DownloadLink className={home.primary} data-hero-download="">Download for Mac, free</DownloadLink>
          {APP_STORE_LIVE && <a className={home.secondary} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">Get it for iPhone</a>}
        </div>
        <PlatformNote place="hero" className="rise" {...rise(2)} />
      </section>

      <div className={`${l.shot} rise-soft`} {...rise(3)}>
        <Figure shot={x.shot.shot} ground={x.shot.ground} caption={x.shot.caption} priority />
      </div>

      <section className={a.section} aria-labelledby="things">
        <div className={a.head}>
          <h2 id="things" className={a.h2}>{x.things.title}</h2>
          <p className={a.lede}>{x.things.lede}</p>
        </div>
        <ol className={l.things}>
          {x.things.items.map((t) => (
            <li key={t.title} className={l.thing}>
              <h3 className={l.thingTitle}>{t.title}</h3>
              <p className={l.thingText}>{t.text}</p>
              <figure className={`${a.job} ${a[t.kind]} ${l.job}`} aria-label={`${t.app}. You: ${t.ask} ${t.app}: ${t.reply} In Pinto Notes: ${t.note}, ${t.did}.`}>
                <figcaption className={a.jobBar} aria-hidden="true">
                  {t.kind !== "phone" && <span className={a.lights}><i /><i /><i /></span>}
                  <span className={a.jobApp}><AIGlyph name={t.glyph} size={13} />{t.app}</span>
                </figcaption>
                <div className={`${a.jobBody} ${l.jobBody}`} aria-hidden="true">
                  {t.kind === "term" ? (
                    <>
                      <p className={a.prompt}><span className={a.promptMark}>›</span>{t.ask}</p>
                      <p className={a.call} data-on><span>⏺</span> amber-notes · {t.tool ?? "edit"}</p>
                      <p className={l.termReply}>{t.reply}</p>
                      <p className={a.termResult} data-on><Tick /> {t.note} · {t.did}</p>
                    </>
                  ) : (
                    <>
                      <p className={a.bubble} data-on>{t.ask}</p>
                      <p className={l.reply}>{t.reply}</p>
                      <p className={a.chip} data-on><Tick /> <b>{t.note}</b> · {t.did}</p>
                    </>
                  )}
                </div>
              </figure>
            </li>
          ))}
        </ol>
      </section>

      <div className={`${legal.article} ${l.col}`}>
        {x.compare && (
          <section aria-labelledby="compare">
            <h2 id="compare">{x.compare.title}</h2>
            {x.compare.intro && <p>{x.compare.intro}</p>}
            <div className="tableWrap" tabIndex={0} role="region" aria-labelledby="compare">
              <table>
                <thead>
                  <tr><th scope="col"></th>{x.compare.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {x.compare.rows.map(([what, ...cells]) => (
                    <tr key={what}><th scope="row">{what}</th>{cells.map((c, i) => <td key={i}>{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={l.checked}>Checked against each product&apos;s own pages on <time dateTime={x.compare.checked}>{longDate(x.compare.checked)}</time>.{x.compare.note ? ` ${x.compare.note}` : ""}</p>
          </section>
        )}

        {x.story && (
          <section aria-labelledby="story">
            <h2 id="story">{x.story.title}</h2>
            {x.story.paras.map((p, i) => <p key={i}>{p}</p>)}
          </section>
        )}

        <section aria-labelledby="faq">
          <h2 id="faq">Questions</h2>
          {x.faq.map((it) => (
            <div key={it.q}>
              <h3 className={l.q}>{it.q}</h3>
              {it.a.map((t) => <p key={t}>{t}</p>)}
            </div>
          ))}
        </section>

        <nav aria-labelledby="read" className={l.read}>
          <h2 id="read">Read more</h2>
          <ul>{x.read.map((r) => <li key={r.href}><a href={r.href}>{r.label}</a></li>)}</ul>
        </nav>
      </div>

      <ClosingBand title={x.closing.title} text={x.closing.text} fine={MAC_FINE} />
    </div>
  );
}
