import home from "../../home.module.css";
import { ClosingBand } from "@/lib/ClosingBand";
import { post } from "@/lib/posts";
import { TOPIC_PICTURES, shelves } from "@/lib/blog-lab";
import { Head } from "../Head";
import s from "../lab.module.css";

export const dynamic = "force-static";
export const metadata = { title: "Blog lab D · Pinto Notes", robots: { index: false } };

/// D: Emil's layout. One big post, eight picked posts two to a row, then the rest as questions.
const LEAD = "apple-notes-ios-27";
const PICKS = [
  "forgot-apple-notes-password", "habit-tracker-with-chatgpt-or-claude",
  "recover-deleted-apple-notes", "claude-memory-vs-notes",
  "apple-notes-tables", "budget-tracker-with-chatgpt-or-claude",
  "connect-chatgpt-to-your-notes", "plan-a-trip-with-chatgpt-or-claude",
];

function Pic({ slug, className }: { slug: string; className?: string }) {
  const p = TOPIC_PICTURES[slug];
  return <img className={className} src={`${p.src}.webp`} alt={p.alt} width={p.width} height={p.height} decoding="async" />;
}

export default function Page() {
  const lead = post(LEAD);
  const shown = new Set([LEAD, ...PICKS]);
  return (
    <div className={home.main}>
      <div className={s.page}>
        <Head />
        <a className={s.big} href={`/blog/${lead.slug}`}>
          <span className={s.bigFrame}><Pic slug={LEAD} /></span>
          <span className={s.bigText}>
            <h2>{lead.title}</h2>
            <p>{lead.excerpt}</p>
          </span>
        </a>
        <ul className={s.two}>
          {PICKS.map((slug) => {
            const p = post(slug);
            return (
              <li key={slug}>
                <a className={s.card} href={`/blog/${slug}`}>
                  <span className={s.cardFrame}><Pic slug={slug} /></span>
                  <h3>{p.title}</h3>
                  <p>{p.excerpt}</p>
                </a>
              </li>
            );
          })}
        </ul>
        <div className={s.more}>
          <h2 className={s.moreTitle}>More answers</h2>
          {shelves().map((sh) => {
            const rest = sh.posts.filter((p) => !shown.has(p.slug));
            if (!rest.length) return null;
            return (
              <section key={sh.title} className={s.group}>
                <h2>{sh.title}</h2>
                <ul className={s.ask}>
                  {rest.map((p) => <li key={p.slug}><a href={`/blog/${p.slug}`}>{p.ask}<span aria-hidden="true">→</span></a></li>)}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
      <ClosingBand title="Notes your AI can read and write." text="Pinto Notes works like Apple Notes, and ChatGPT, Claude and Claude Code can use it, with an Undo on every change." />
    </div>
  );
}
