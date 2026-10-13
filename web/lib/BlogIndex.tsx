import type { Metadata } from "next";
import { Avatar, PostCard, longDate } from "./blog";
import { ClosingBand } from "./ClosingBand";
import { CATEGORY_COVERS, AUTHOR, categories, categoryPath, newestFirst, pageCount, pageOf, pagePath, published, type Category } from "./posts";
import { pageMetadata } from "./site";
import BlogList from "./BlogList";
import { FILTER_AFTER, FILTER_GRID } from "./filter-transition";
import { JsonLd, breadcrumbs, maker, incredible, organization } from "./structured-data";
import home from "../app/home.module.css";
import s from "../app/blog/blog.module.css";

/// The blog index and each category's page: newest first, PER_PAGE posts a page, the categories as
/// links to their own pages, and previous, numbered and next links at the bottom. Every page is
/// static. Page 1 is the list's own address; later pages are <address>/page/<n>.

const LEDE = <>Guides to connecting <b>ChatGPT, Claude and Codex</b> to your notes, Apple Notes how-tos, and fair comparisons. Written by the person building Pinto Notes.</>;

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
const FIT_LEDE = () => fit(["Guides to connecting ChatGPT, Claude and Codex to your notes, Apple Notes how-tos, and fair comparisons. Written by the person building Pinto Notes.", ...categories().map((c) => ABOUT[c])]);

type List = { category: Category | null; base: string; posts: ReturnType<typeof published> };

function list(category: Category | null): List {
  const all = newestFirst();
  return category
    ? { category, base: categoryPath(category), posts: all.filter((p) => p.category === category) }
    : { category: null, base: "/blog", posts: all };
}

export const pagesOf = (category: Category | null) => pageCount(list(category).posts);

export function blogMetadata(category: Category | null, page: number): Metadata {
  const l = list(category);
  const name = category ?? "Blog";
  const suffix = page > 1 ? `, page ${page}` : "";
  const description = category ? ABOUT[category] : "Guides and comparisons from the maker of Pinto Notes: connecting ChatGPT, Claude and Codex to your notes, Apple Notes how-tos, and more.";
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
  // The newest post of the list leads its first page, wide, on its category's cover.
  const featured = page === 1 ? posts[0] : undefined;
  const rest = featured ? posts.slice(1) : posts;

  return (
    <div className={home.main}>
      {page > 1 && <link rel="prev" href={pagePath(l.base, page - 1)} />}
      {page < pages && <link rel="next" href={pagePath(l.base, page + 1)} />}
      <JsonLd graph={[breadcrumbs(crumbs), organization, maker, incredible]} />
      <BlogList className={s.index}>
        <div className={s.hero}>
          {/* The four categories' paper-cut covers, fanned beside the title (the current one on top). */}
          <span className={s.fan} aria-hidden="true">
            {categories().filter((c) => c !== category).concat(category ? [category] : []).map((c) => <img key={c} src={CATEGORY_COVERS[c].src} alt="" width={CATEGORY_COVERS[c].width} height={CATEGORY_COVERS[c].height} />)}
          </span>
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
          <nav className={s.filters} aria-label="Categories" data-blog-chips="">
            <a href="/blog" aria-current={category === null ? "page" : undefined}><span className={s.text}>All posts<span className={s.count}>{published().length}</span></span></a>
            {counts.map(({ c, n }) => (
              <a key={c} href={categoryPath(c)} aria-current={category === c ? "page" : undefined}>
                <span className={s.text}>{c}<span className={s.count}>{n}</span></span>
              </a>
            ))}
          </nav>
          <ul className={`${s.grid} ${FILTER_GRID}`}>
            {featured && <li className={s.featuredItem} data-key={featured.slug}><Featured post={featured} /></li>}
            {rest.map((p) => (
              <li key={p.slug} data-key={p.slug}><PostCard post={p} /></li>
            ))}
          </ul>
        </div>
        {pages > 1 && <Pagination base={l.base} page={page} pages={pages} />}
      </BlogList>
      <ClosingBand title="Notes your AI can read and write." text="Pinto Notes works like Apple Notes, and ChatGPT, Claude and Claude Code can use it, with an Undo on every change." />
    </div>
  );
}

/// The newest post, wide: its category's cover on the left, the title and its excerpt on the right.
function Featured({ post }: { post: ReturnType<typeof published>[number] }) {
  const c = CATEGORY_COVERS[post.category];
  return (
    <a className={s.featured} href={`/blog/${post.slug}`}>
      <img className={s.featuredArt} src={c.src} alt="" width={c.width} height={c.height} decoding="async" />
      <span className={s.featuredText}>
        <span className={s.featuredLabel}>{post.category} · Newest</span>
        <h2 className={s.featuredTitle}>{post.title}</h2>
        <span className={s.featuredExcerpt}>{post.excerpt}</span>
        <span className={s.featuredBy}><Avatar size={22} /><span>{AUTHOR.name}</span><span aria-hidden="true">·</span><time dateTime={post.date}>{longDate(post.date)}</time></span>
      </span>
    </a>
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
