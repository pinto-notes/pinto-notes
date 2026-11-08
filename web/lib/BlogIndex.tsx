import type { Metadata } from "next";
import { Announcement, Avatar, PostCard, longDate } from "./blog";
import { ClosingBand } from "./ClosingBand";
import { CATEGORY_COVERS, AUTHOR, categories, categoryPath, isFeatured, newestFirst, pageCount, pageOf, pagePath, published, type Category } from "./posts";
import { shelves } from "./more-answers";
import { pageMetadata } from "./site";
import BlogList from "./BlogList";
import { FILTER_AFTER, FILTER_GRID } from "./filter-transition";
import { JsonLd, breadcrumbs, maker, incredible, organization } from "./structured-data";
import home from "../app/home.module.css";
import s from "../app/blog/blog.module.css";

/// The blog index: the front of the blog, only the featured posts (about Pinto Notes and what people do
/// with it) as cards, the newest wide. Each category's page: its featured posts as cards, then every
/// other post under "More answers", as the question it answers. The posts written for search are all
/// on /blog/answers (AnswersIndex). Every page is static and one page long.

const LEDE_TEXT = "What's new in Pinto Notes: every launch, as it ships.";
const LEDE = <>What&apos;s new in Pinto Notes: every launch, as it ships.</>;
const ANSWERS_LEDE = "Straight answers about Apple Notes, notes apps and AI, each one tried on a real Mac first.";

/// What each category's page says under its title (and in search results).
const ABOUT: Record<Category, string> = {
  "Guides": "Guides to connecting ChatGPT, Claude, Gemini, Claude Code and Codex to your notes, and getting things done with them.",
  "Apple Notes": "How-tos for Apple Notes: exporting, recovering, passwords, what's new, and what AI can and can't do with it.",
  "Comparisons": "Notes apps compared fairly: Apple Notes, Notion, Obsidian, and the ones ChatGPT and Claude can use.",
  "Building Pinto Notes": "How Pinto Notes is built: encryption, AI access, and the decisions behind them.",
};

/// The two longest titles and ledes of the lists' first pages. Each list reserves room for them
/// (an invisible copy drawn by CSS from these attributes, never page text), so every list's title
/// block is one height and the chips under it don't move when switching between them.
const fit = (texts: string[]) => [...texts].sort((a, b) => b.length - a.length);
const FIT_TITLE = () => fit(["The Pinto Notes blog", ...categories()]);
const FIT_LEDE = () => fit([LEDE_TEXT, ...categories().map((c) => ABOUT[c])]);

type List = { category: Category | null; base: string; posts: ReturnType<typeof published> };

function list(category: Category | null): List {
  const all = newestFirst();
  return category
    ? { category, base: categoryPath(category), posts: all.filter((p) => p.category === category) }
    : { category: null, base: "/blog", posts: all.filter(isFeatured) };
}

export const pagesOf = (category: Category | null) => pageCount(list(category).posts);

export function blogMetadata(category: Category | null, page: number): Metadata {
  const l = list(category);
  const name = category ?? "Blog";
  const suffix = page > 1 ? `, page ${page}` : "";
  const description = category ? ABOUT[category] : LEDE_TEXT;
  return pageMetadata({
    title: category ? `${name}${suffix} · Blog · Pinto Notes` : `Blog${suffix} · Pinto Notes`,
    shareTitle: category ? `${name} on the Pinto Notes blog` : "The Pinto Notes blog",
    description: page > 1 ? `Page ${page} of ${pageCount(l.posts)}. ${description}` : description,
    path: pagePath(l.base, page),
  });
}

export function BlogIndex({ category, page }: { category: Category | null; page: number }) {
  const l = list(category);
  const pages = pageCount(l.posts);
  const posts = pageOf(l.posts, page);
  const crumbs = [{ name: "Blog", path: "/blog" }];
  if (category) crumbs.push({ name: category, path: l.base });
  if (page > 1) crumbs.push({ name: `Page ${page}`, path: pagePath(l.base, page) });
  const counts = categories().map((c) => ({ c, n: published().filter((p) => p.category === c).length }));
  // The newest featured post leads, wide, on its category's cover; the other featured posts follow as
  // cards; the rest of the list is "More answers".
  const picked = posts.filter(isFeatured);
  // The newest leads wide only when the cards under it fill whole rows of three, so no row is left
  // half empty (seven posts: one wide, then three and three; six: three and three).
  // The front is announcements only, so each one gets the wide card, newest first.
  const leads = category ? [] : picked;
  const featured = category && page === 1 && picked.length > 1 && (picked.length - 1) % 3 === 0 ? picked[0] : undefined;
  const rest = category ? (featured ? picked.slice(1) : picked) : [];
  const more = shelves(posts.filter((p) => !isFeatured(p)));

  return (
    <div className={home.main}>
      {page > 1 && <link rel="prev" href={pagePath(l.base, page - 1)} />}
      {page < pages && <link rel="next" href={pagePath(l.base, page + 1)} />}
      <JsonLd graph={[breadcrumbs(crumbs), organization, maker, incredible]} />
      <BlogList className={`${s.index} ${category ? "" : s.front}`}>
        <div className={s.hero}>
          <div className={s.heroText}>
            <h1 className={`${s.h1} rise`} style={{ "--i": 0 } as React.CSSProperties}>
              {category ?? "The Pinto Notes blog"}{page > 1 && <span className={s.pageNote}>, page {page}</span>}
            </h1>
            <p className={`${s.lede} rise`} style={{ "--i": 1 } as React.CSSProperties}>{category ? ABOUT[category] : LEDE}</p>
          </div>
          <div className={s.heroFit} aria-hidden="true">
            <span className={s.h1} data-a={FIT_TITLE()[0]} data-b={FIT_TITLE()[1]} />
            <span className={s.lede} data-a={FIT_LEDE()[0]} data-b={FIT_LEDE()[1]} />
          </div>
        </div>
        <div className={`${s.library} rise`} style={{ "--i": 2 } as React.CSSProperties}>
          {category && (
            <nav className={s.filters} aria-label="Categories" data-blog-chips="">
              <a href="/blog"><span className={s.text}>Blog</span></a>
              {counts.map(({ c, n }) => (
                <a key={c} href={categoryPath(c)} aria-current={category === c ? "page" : undefined}>
                  <span className={s.text}>{c}<span className={s.count}>{n}</span></span>
                </a>
              ))}
            </nav>
          )}
          <ul className={`${category ? s.grid : s.rows} ${FILTER_GRID}`}>
            {leads.map((p) => <li key={p.slug} className={s.rowItem} data-key={p.slug}><Row post={p} /></li>)}
            {featured && <li className={s.featuredItem} data-key={featured.slug}><Featured post={featured} /></li>}
            {rest.map((p) => (
              <li key={p.slug} data-key={p.slug}><PostCard post={p} /></li>
            ))}
          </ul>
        </div>
        {more.length > 0 && <MoreAnswers groups={more} />}
        {pages > 1 && <Pagination base={l.base} page={page} pages={pages} />}
      </BlogList>
      <ClosingBand title="Notes your AI can read and write." text="Pinto Notes works like Apple Notes, and ChatGPT, Claude, Claude Code and Codex can use it, with an Undo on every change." />
    </div>
  );
}

/// One announcement on the front of the blog: its cover across the column, then the title, the
/// excerpt and the date. The front is one narrow column (Emil, 8 November 2026: "I wanted it to be
/// less wide"), and every post there is an announcement, so it carries no label.
function Row({ post }: { post: ReturnType<typeof published>[number] }) {
  const c = post.thumb.art ? post.thumb : CATEGORY_COVERS[post.category];
  return (
    <a className={s.row} href={`/blog/${post.slug}`} data-row="">
      <img className={s.rowArt} src={c.src} alt="" width={c.width} height={c.height} decoding="async" />
      <span className={s.rowText}>
        <h2 className={s.rowTitle}>{post.title}</h2>
        <span className={s.rowExcerpt}>{post.excerpt}</span>
        <span className={s.featuredBy}><Avatar size={20} /><span>{AUTHOR.name}</span><span aria-hidden="true">·</span><time dateTime={post.date}>{longDate(post.date)}</time></span>
      </span>
    </a>
  );
}

/// The newest post, wide: its category's cover on the left, the title and its excerpt on the right.
function Featured({ post }: { post: ReturnType<typeof published>[number] }) {
  // Its own cover when it has one; otherwise its category's paper-cut cover.
  const c = post.thumb.art ? post.thumb : CATEGORY_COVERS[post.category];
  return (
    <a className={s.featured} href={`/blog/${post.slug}`}>
      <img className={s.featuredArt} src={c.src} alt="" width={c.width} height={c.height} decoding="async" />
      <span className={s.featuredText}>
        {post.announcement
          ? <span className={s.featuredLabel}><Announcement /></span>
          : <span className={s.featuredLabel}>{post.category} · Newest</span>}
        <h2 className={s.featuredTitle}>{post.title}</h2>
        <span className={s.featuredExcerpt}>{post.excerpt}</span>
        <span className={s.featuredBy}><Avatar size={22} /><span>{AUTHOR.name}</span><span aria-hidden="true">·</span><time dateTime={post.date}>{longDate(post.date)}</time></span>
      </span>
    </a>
  );
}

export const answersMetadata = (): Metadata => pageMetadata({
  title: "Answers · Blog · Pinto Notes",
  shareTitle: "Answers from the Pinto Notes blog",
  description: ANSWERS_LEDE,
  path: "/blog/answers",
});

/// Every post written for search, as the question it answers, under what it's about. Linked from the
/// footer, never from the front of the blog.
export function AnswersIndex() {
  const crumbs = [{ name: "Blog", path: "/blog" }, { name: "Answers", path: "/blog/answers" }];
  return (
    <div className={home.main}>
      <JsonLd graph={[breadcrumbs(crumbs), organization, maker, incredible]} />
      <BlogList className={s.index}>
        <div className={s.hero}>
          <div className={s.heroText}>
            <h1 className={`${s.h1} rise`} style={{ "--i": 0 } as React.CSSProperties}>Answers</h1>
            <p className={`${s.lede} rise`} style={{ "--i": 1 } as React.CSSProperties}>{ANSWERS_LEDE}</p>
          </div>
        </div>
        <MoreAnswers groups={shelves(published().filter((p) => !isFeatured(p)))} title="By topic" />
      </BlogList>
      <ClosingBand title="Notes your AI can read and write." text="Pinto Notes works like Apple Notes, and ChatGPT, Claude, Claude Code and Codex can use it, with an Undo on every change." />
    </div>
  );
}

/// Every post that isn't featured, as the question it answers, under what it's about.
function MoreAnswers({ groups, title = "More answers" }: { groups: ReturnType<typeof shelves>; title?: string }) {
  return (
    <section className={`${s.more} ${FILTER_AFTER}`} aria-labelledby="more-answers">
      <h2 id="more-answers" className={s.moreTitle}>{title}</h2>
      {groups.map((sh) => (
        <div key={sh.title} className={s.moreGroup}>
          <h3>{sh.title}</h3>
          <ul className={s.ask}>
            {sh.posts.map((p) => <li key={p.slug}><a href={`/blog/${p.slug}`}>{p.ask}<span aria-hidden="true">→</span></a></li>)}
          </ul>
        </div>
      ))}
    </section>
  );
}

function Pagination({ base, page, pages }: { base: string; page: number; pages: number }) {
  const numbers = Array.from({ length: pages }, (_, i) => i + 1);
  return (
    <nav className={`${s.pages} ${FILTER_AFTER}`} aria-label="Pages" data-blog-pages="">
      {page > 1 ? <a className={s.step} href={pagePath(base, page - 1)} rel="prev">Previous</a> : <span className={s.step} aria-hidden="true" data-off>Previous</span>}
      <ol>
        {numbers.map((n) => (
          <li key={n}>
            <a href={pagePath(base, n)} aria-current={n === page ? "page" : undefined} aria-label={`Page ${n}`}>{n}</a>
          </li>
        ))}
      </ol>
      {page < pages ? <a className={s.step} href={pagePath(base, page + 1)} rel="next">Next</a> : <span className={s.step} aria-hidden="true" data-off>Next</span>}
    </nav>
  );
}
