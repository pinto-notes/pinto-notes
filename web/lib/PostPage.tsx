import type { Metadata } from "next";
import legal from "./legal.module.css";
import p from "./post.module.css";
import { Avatar, Figure, PostCard, longDate, readingMinutes } from "./blog";
import { ClosingBand } from "./ClosingBand";
import { AUTHOR, CATEGORY_COVERS, categoryPath, morePosts, post, type Category, type Post } from "./posts";
import { MAKER_URL, SITE_URL, pageMetadata } from "./site";
import { JsonLd, article, breadcrumbs, faqPage, incredible, maker, organization } from "./structured-data";

type QA = { q: string; a: string[] };

/// A post's metadata from its entry in lib/posts.ts: drafts stay out of search.
export function postMetadata(slug: string, { title }: { title?: string } = {}): Metadata {
  const x = post(slug);
  return pageMetadata({
    title: title ?? `${x.title} · Pinto Notes`,
    shareTitle: x.title,
    description: x.description,
    path: `/blog/${x.slug}`,
    index: !x.draft,
    article: { published: x.date, modified: x.updated, author: AUTHOR.name },
    // Drafts have no card of their own (only published posts get one) and use the site's.
    ...(x.draft ? {} : { image: { url: `/og/blog/${x.slug}`, alt: `${x.title}, on the Pinto Notes blog` } }),
  });
}

function share(x: Post) {
  const url = `${SITE_URL}/blog/${x.slug}`;
  const e = encodeURIComponent;
  return [
    { name: "X", href: `https://x.com/intent/post?text=${e(x.title)}&url=${e(url)}`, glyph: <XGlyph /> },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`, glyph: <LinkedInGlyph /> },
    { name: "Email", href: `mailto:?subject=${e(x.title)}&body=${e(`${x.title}\n${url}`)}`, glyph: <MailGlyph /> },
  ];
}

/// Share, as three quiet icon buttons at the end of the byline.
function Share({ x }: { x: Post }) {
  return (
    <ul className={p.share} aria-label="Share this post">
      {share(x).map((s) => (
        <li key={s.name}>
          <a href={s.href} target={s.name === "Email" ? undefined : "_blank"} rel="noopener noreferrer" aria-label={`Share on ${s.name}`} title={`Share on ${s.name}`}>
            {s.glyph}
          </a>
        </li>
      ))}
    </ul>
  );
}

/// The band at the end of a post, written for its category.
const CLOSING: Record<Category, { title: string; text: string }> = {
  "Guides": { title: "Let your AI write in your notes.", text: "Pinto Notes works like Apple Notes, and ChatGPT, Claude and Claude Code can read and edit it, with an Undo on every change." },
  "Apple Notes": { title: "Bring your Apple Notes along.", text: "Pinto Notes imports them on your Mac in one go, and leaves Apple Notes as it was." },
  "Comparisons": { title: "Try the notes app your AI can use.", text: "Pinto Notes works like Apple Notes, and connects to ChatGPT, Claude and Claude Code." },
  "Building Pinto Notes": { title: "Read the code, or just use it.", text: "Pinto Notes is open source: the apps, the server and this website." },
};

/// A post's picture at the top: its own paper-cut banner, or its category's cover.
function Cover({ x, art }: { x: Post; art?: string }) {
  if (art) {
    return (
      <div className={p.cover} data-shape="banner">
        <picture>
          <source type="image/avif" srcSet={`${art}.avif`} />
          <img src={`${art}.webp`} alt="" width={1200} height={480} decoding="async" fetchPriority="high" />
        </picture>
      </div>
    );
  }
  const c = CATEGORY_COVERS[x.category];
  return (
    <div className={p.cover}>
      <img src={c.src} alt="" width={c.width} height={c.height} decoding="async" fetchPriority="high" />
    </div>
  );
}

/// A blog post: the category, the title, the byline with the share buttons, a paper-cut cover at the
/// width of the page's column, then the intro, the short answer and the text in one readable column
/// centred under the header. A how-to post can carry its own banner (`art`) as its cover, and a real
/// capture (`hero`) in place of the post's own capture after the intro. At the end: the author, three
/// related posts and a link to the rest, then the dark band written for the post's category. Emits
/// Article, BreadcrumbList and (when the post has real questions) FAQPage JSON-LD. `caption` goes
/// under the post's own capture, for the OS it came from.
export function PostPage({ slug, intro, answer, art, hero, caption, faq, children }: { slug: string; intro: React.ReactNode; answer?: React.ReactNode; art?: string; hero?: React.ReactNode; caption?: string; faq?: QA[]; children: React.ReactNode }) {
  const x = post(slug);
  const path = `/blog/${x.slug}`;
  const minutes = readingMinutes(slug);
  const graph = [
    article({ title: x.title, description: x.description, path, date: x.date, updated: x.updated, image: x.image.src }),
    breadcrumbs([{ name: "Blog", path: "/blog" }, { name: x.category, path: categoryPath(x.category) }, { name: x.title, path }]),
    organization, maker, incredible,
  ];
  if (faq?.length) graph.push(faqPage(faq, path));
  const more = morePosts(slug, 3);
  const closing = CLOSING[x.category];

  return (
    <div className={p.main}>
      <JsonLd graph={graph} />
      <article className={p.col}>
        <header className={`${p.head} rise`} style={{ "--i": 0 } as React.CSSProperties}>
          <nav className={p.crumbs} aria-label="Breadcrumb">
            <ol>
              <li><a href="/blog">Blog</a></li>
              <li><a href={categoryPath(x.category)}>{x.category}</a></li>
            </ol>
          </nav>
          <h1 className={p.title}>{x.title}</h1>
          <div className={p.byline}>
            <Avatar size={32} />
            <p>
              <a className={p.author} href={MAKER_URL} rel="author">{AUTHOR.name}</a>
              <span className={p.meta}><time dateTime={x.date}>{longDate(x.date)}</time><span aria-hidden="true"> · </span>{minutes} min read</span>
            </p>
            <Share x={x} />
          </div>
        </header>

        <div className={`${p.coverRow} rise-soft`} style={{ "--i": 1 } as React.CSSProperties}><Cover x={x} art={art} /></div>

        <div className={`${legal.article} ${p.body} rise`} style={{ "--i": 2 } as React.CSSProperties} data-short={minutes < 8 ? "" : undefined}>
          <p className={p.intro}>{intro}</p>
          {answer}
          {hero ?? (!art && <Figure shot={x.image} ground={x.thumb.ground} caption={caption} priority />)}
          {children}
          {faq?.length ? (
            <>
              <h2>Questions</h2>
              {faq.map((it) => (
                <div key={it.q}>
                  <p className="label"><strong>{it.q}</strong></p>
                  {it.a.map((t) => <p key={t}>{t}</p>)}
                </div>
              ))}
            </>
          ) : null}
          <p className={p.checked}>Checked against the app on <time dateTime={x.updated}>{longDate(x.updated)}</time>.</p>
        </div>

        <footer className={p.signoff}>
          <Avatar size={44} />
          <p><b>Written by <a className={p.author} href={MAKER_URL} rel="author">{AUTHOR.name}</a></b><span>The maker of Pinto Notes.</span></p>
        </footer>
      </article>

      {more.length ? (
        <section className={p.end} aria-labelledby="more-posts">
          <div className={p.endHead}>
            <h2 id="more-posts" className={p.sectionTitle}>Read next</h2>
            <a className={p.allLink} href={categoryPath(x.category)}>More in {x.category}<ArrowGlyph /></a>
          </div>
          <ul className={p.more}>{more.map((m) => <li key={m.slug}><PostCard post={m} heading="h3" /></li>)}</ul>
        </section>
      ) : null}

      <ClosingBand title={closing.title} text={closing.text} />
    </div>
  );
}

function ArrowGlyph() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>;
}
function XGlyph() {
  return <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M18.9 1.2h3.7l-8 9.2L24 22.8h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.4h2L6.5 3.3H4.3Z" /></svg>;
}
function LinkedInGlyph() {
  return <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" /></svg>;
}
function MailGlyph() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
}
