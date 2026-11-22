import type { Metadata } from "next";
import legal from "../legal.module.css";
import p from "../post.module.css";
import DownloadLink from "@/app/DownloadLink";
import { ClosingBand, bandButton } from "../ClosingBand";
import { LinkedInGlyph, XGlyph } from "../PostPage";
import { post } from "../posts";
import { APP_STORE_LIVE, APP_STORE_URL, SITE_URL, pageMetadata, SITE_NAME } from "../site";
import { JsonLd, article, breadcrumbs, faqPage, maker, organization } from "../structured-data";
import { OG_LOCALE, UI, languagesFor, localDate, localPath, translation, type Lang } from "./blog";

type QA = { q: string; a: string[] };

/// A translation's metadata: its own title and description, canonical to itself, hreflang to the
/// English post and the other translations, and the English post's share card.
export function localPostMetadata(lang: Lang, slug: string): Metadata {
  const t = translation(lang, slug);
  const en = post(t.of);
  return pageMetadata({
    title: t.title,
    shareTitle: t.title,
    description: t.description,
    path: localPath(t),
    article: { published: t.date, modified: t.updated, author: SITE_NAME },
    image: { url: `/og/blog/${en.slug}`, alt: t.title },
    languages: languagesFor(t.of),
    locale: OG_LOCALE[lang],
  });
}

/// A translated post, in the shape of the English one (lib/PostPage.tsx) with its frame in the post's
/// language: title, byline, the English post's cover, intro and short answer, the text, questions, the
/// sign-off with a link to the English original, and the closing band. No "Read next": the rest of the
/// blog is in English.
export function LocalPostPage({ lang, slug, intro, answer, hero, faq, children }: {
  lang: Lang; slug: string; intro: React.ReactNode; answer?: React.ReactNode; hero?: React.ReactNode; faq?: QA[]; children: React.ReactNode;
}) {
  const t = translation(lang, slug);
  const en = post(t.of);
  const ui = UI[lang];
  const path = localPath(t);
  const graph = [
    article({ title: t.title, description: t.description, path, date: t.date, updated: t.updated, image: en.image.src, lang }),
    breadcrumbs([{ name: ui.blog, path: "/blog" }, { name: t.title, path }]),
    organization, maker,
  ];
  if (faq?.length) graph.push(faqPage(faq, path));
  const cover = en.thumb;
  const url = `${SITE_URL}${path}`;
  const e = encodeURIComponent;
  const shares = [
    { name: "X", href: `https://x.com/intent/post?text=${e(t.title)}&url=${e(url)}`, glyph: <XGlyph /> },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`, glyph: <LinkedInGlyph /> },
  ];

  return (
    <div className={p.main} lang={lang}>
      <JsonLd graph={graph} />
      <article className={p.col}>
        <header className={`${p.head} rise`} style={{ "--i": 0 } as React.CSSProperties}>
          <nav className={p.crumbs} aria-label="Breadcrumb">
            <ol>
              <li><a href="/blog">{ui.blog}</a></li>
              <li><a href={`/blog/${en.slug}`} hrefLang="en" lang="en">English</a></li>
            </ol>
          </nav>
          <h1 className={p.title}>{t.title}</h1>
          <div className={p.byline}>
            <p><span className={p.meta}><time dateTime={t.date}>{localDate(lang, t.date)}</time></span></p>
            <ul className={p.share} aria-label={ui.share}>
              {shares.map((s) => (
                <li key={s.name}><a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={ui.shareOn(s.name)} title={ui.shareOn(s.name)}>{s.glyph}</a></li>
              ))}
            </ul>
          </div>
        </header>

        <div className={`${p.coverRow} rise-soft`} style={{ "--i": 1 } as React.CSSProperties}>
          <div className={p.cover}>
            <img src={cover.src} alt="" width={cover.width} height={cover.height} decoding="async" fetchPriority="high" />
          </div>
        </div>

        <div className={`${legal.article} ${p.body} ${p.top} rise`} style={{ "--i": 1 } as React.CSSProperties}>
          <p className={p.intro}>{intro}</p>
          {answer}
        </div>

        <div className={`${legal.article} ${p.body} ${p.rest} rise`} style={{ "--i": 2 } as React.CSSProperties}>
          {hero}
          {children}
          {faq?.length ? (
            <>
              <h2>{ui.questions}</h2>
              {faq.map((it) => (
                <div key={it.q}>
                  <p className="label"><strong>{it.q}</strong></p>
                  {it.a.map((x) => <p key={x}>{x}</p>)}
                </div>
              ))}
            </>
          ) : null}
          <p className={p.checked}>{ui.checked(localDate(lang, t.updated))} <a href={`/blog/${en.slug}`} hrefLang="en">{ui.original}</a></p>
        </div>

      </article>

      <ClosingBand
        title={ui.closing.title}
        text={ui.closing.text}
        actions={<>
          <DownloadLink className={bandButton.primary}>{ui.cta.mac}</DownloadLink>
          {APP_STORE_LIVE ? <a className={bandButton.secondary} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">{ui.cta.iphone}</a> : null}
        </>}
        fine={`${ui.cta.fineMac} ${ui.cta.english}`}
      />
    </div>
  );
}
