import type { Metadata } from "next";
import DownloadLink from "@/app/DownloadLink";
import PlatformNote from "@/app/PlatformNote";
import Faq from "@/app/help/Faq";
import { AIGlyph } from "./ai-glyphs";
import { PostCard, Window, longDate } from "./blog";
import { post, published } from "./posts";
import { StoryPlayer } from "./StoryPlayer";
import legal from "./legal.module.css";
import { landingPath, type Landing } from "./landings";
import l from "./landing.module.css";
import { APP_STORE_LIVE, APP_STORE_URL, SITE_NAME, pageMetadata } from "./site";
import { JsonLd, app, breadcrumbs, faqPage, incredible, maker, organization } from "./structured-data";
import { latestVersion } from "./changelog";
import { ClosingBand, MAC_FINE } from "./ClosingBand";

/// A landing page for one audience or search (lib/landings.ts). Centred from top to bottom: the
/// promise over a paper-craft scene drawn for the page with a real capture set into it, the three
/// things to ask played one after another in one window, a dated comparison on its own soft band,
/// the questions as one accordion (how it works first), three posts to read, and the dark band.

export function landingMetadata(x: Landing): Metadata {
  return pageMetadata({ title: x.title, shareTitle: x.shareTitle, description: x.description, path: landingPath(x) });
}

/// Each page's scene, drawn for its audience (public/art, 1672 x 941).
const SCENES: Record<string, string> = {
  "/for/chatgpt": "/art/for-chatgpt.webp",
  "/for/claude": "/art/for-claude.webp",
  "/for/claude-code": "/art/for-claudecode.webp",
  "/alternatives/apple-notes": "/art/alt-applenotes.webp",
  "/alternatives/notion": "/art/alt-notion.webp",
  "/alternatives/obsidian": "/art/alt-obsidian.webp",
};
export const landingScene = (x: Landing) => SCENES[landingPath(x)];

const rise = (i: number) => ({ style: { "--i": i } as React.CSSProperties });
const Tick = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>;
const qid = (q: string) => q.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

type Thing = Landing["things"]["items"][number];

/// One thing to ask, as it plays: the ask, the answer, then what changed in Pinto Notes.
function Exchange({ t }: { t: Thing }) {
  return (
    <figure className={l.chat} data-kind={t.kind} aria-label={`${t.app}. You: ${t.ask} ${t.app}: ${t.reply} In Pinto Notes: ${t.note}, ${t.did}.`}>
      <figcaption className={l.chatBar} aria-hidden="true">
        <span className={l.lights}><i /><i /><i /></span>
        <span className={l.chatApp}><AIGlyph name={t.glyph} size={14} />{t.app}</span>
      </figcaption>
      <div className={l.chatBody} aria-hidden="true">
        {t.kind === "term" ? (
          <>
            <p className={`${l.prompt} ${l.beat1}`}><span className={l.promptMark}>›</span>{t.ask}</p>
            <p className={`${l.call} ${l.beat2}`}><span>⏺</span> pinto-notes · {t.tool ?? "edit"}</p>
            <p className={`${l.termReply} ${l.beat2}`}>{t.reply}</p>
            <p className={`${l.termResult} ${l.beat3}`}><Tick /> {t.note} · {t.did}</p>
          </>
        ) : (
          <>
            <p className={`${l.ask} ${l.beat1}`}>{t.ask}</p>
            <p className={`${l.reply} ${l.beat2}`}>{t.reply}</p>
            <p className={`${l.changed} ${l.beat3}`}><Tick /> <b>{t.note}</b> · {t.did}</p>
          </>
        )}
      </div>
    </figure>
  );
}

export function LandingPage({ x }: { x: Landing }) {
  const path = landingPath(x);
  const graph = [app(latestVersion()), organization, maker, incredible, breadcrumbs([{ name: SITE_NAME, path: "/" }, { name: x.crumb, path }])];
  if (x.faq.length) graph.push(faqPage(x.faq, path));
  const questions = [
    ...(x.story ? [{ id: qid(x.story.title), q: x.story.title, a: x.story.paras }] : []),
    ...x.faq.map((f) => ({ id: qid(f.q), q: f.q, a: f.a })),
  ];
  const live = new Set(published().map((p) => p.slug));
  const reads = x.read.filter((r) => r.href.startsWith("/blog/") && live.has(r.href.slice(6))).slice(0, 3).map((r) => post(r.href.slice(6)));
  const scene = landingScene(x);
  return (
    <div className={l.main}>
      <JsonLd graph={graph} />
      <section className={l.hero}>
        <h1 className={`${l.h1} rise`} {...rise(0)}><Headline text={x.h1} mark={x.mark} /></h1>
        <p className={`${l.lede} rise`} {...rise(1)}>{x.lede}</p>
        <div className={`${l.ctas} rise pi-apple pi-not-ios`} {...rise(2)}>
          <DownloadLink className={l.primary} data-hero-download="">Download for Mac, free</DownloadLink>
          {APP_STORE_LIVE && <a className={l.secondary} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">Get it for iPhone</a>}
        </div>
        <p className={`${l.fine} rise pi-apple pi-not-ios`} {...rise(2)}>{MAC_FINE}</p>
        <PlatformNote place="hero" className="rise" {...rise(2)} />
      </section>

      <div className={`${l.sceneWrap} rise-soft`} {...rise(3)}>
        <div className={l.scene}>
          {scene && <img className={l.sceneArt} src={scene} alt="" width={1672} height={941} fetchPriority="high" decoding="async" />}
          <div className={l.inset}><Window shot={x.shot.shot} priority /></div>
        </div>
      </div>

      <section className={l.section} aria-labelledby="things">
        <div className={l.head}>
          <h2 id="things" className={l.h2}>{x.things.title}</h2>
          <p className={l.sectionLede}>{x.things.lede}</p>
        </div>
        <StoryPlayer
          label={x.things.title}
          steps={x.things.items.map((t) => ({ title: t.title, text: t.text }))}
          slides={x.things.items.map((t) => <Exchange key={t.title} t={t} />)}
        />
      </section>

      {x.compare && (
        <section className={l.compare} aria-labelledby="compare">
          <div className={l.compareInner}>
            <div className={l.head}>
              <h2 id="compare" className={l.h2}>{x.compare.title}</h2>
              {x.compare.intro && <p className={l.sectionLede}>{x.compare.intro}</p>}
            </div>
            <div className={`${legal.article} ${l.table}`}>
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
            </div>
            <p className={l.checked}>Checked against each product&apos;s own pages on <time dateTime={x.compare.checked}>{longDate(x.compare.checked)}</time>.{x.compare.note ? ` ${x.compare.note}` : ""}</p>
          </div>
        </section>
      )}

      <section className={l.section} aria-labelledby="faq">
        <div className={l.head}><h2 id="faq" className={l.h2}>Questions</h2></div>
        <div className={l.faq}><Faq items={questions} /></div>
      </section>

      {reads.length > 0 && (
        <nav className={l.section} aria-labelledby="read">
          <div className={l.head}><h2 id="read" className={l.h2}>Read more</h2></div>
          <ul className={l.reads}>{reads.map((r) => <li key={r.slug}><PostCard post={r} heading="h3" /></li>)}</ul>
        </nav>
      )}

      <ClosingBand title={x.closing.title} text={x.closing.text} fine={MAC_FINE} />
    </div>
  );
}

/// The headline with its marked words, which never split across lines.
function Headline({ text, mark }: { text: string; mark?: string }) {
  if (!mark || !text.includes(mark)) return <>{text}</>;
  const [before, after] = text.split(mark);
  return <>{before}<mark className={l.mark}>{mark}</mark>{after}</>;
}
