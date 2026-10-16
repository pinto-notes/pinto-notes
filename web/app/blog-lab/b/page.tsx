import home from "../../home.module.css";
import { ClosingBand } from "@/lib/ClosingBand";
import { post } from "@/lib/posts";
import { TOPIC_PICTURES, shelves } from "@/lib/blog-lab";
import { Head } from "../Head";
import s from "../lab.module.css";

export const dynamic = "force-static";
export const metadata = { title: "Blog lab B · Pinto Notes", robots: { index: false } };

const LEAD = "apple-notes-ios-27";
const PICKS = ["forgot-apple-notes-password", "recover-deleted-apple-notes", "apple-notes-tables"];

function Pic({ slug, className }: { slug: string; className?: string }) {
  const p = TOPIC_PICTURES[slug];
  return (
    <picture>
      <source type="image/avif" srcSet={`${p.src}.avif`} />
      <img className={className} src={`${p.src}.webp`} alt={p.alt} width={p.width} height={p.height} decoding="async" />
    </picture>
  );
}

/// B: a front page. One lead and three picks, each with a real picture of the topic, then every
/// post as a short list under its shelf.
export default function Page() {
  const lead = post(LEAD);
  return (
    <div className={home.main}>
      <div className={s.page}>
        <Head />
        <a className={s.lead} href={`/blog/${lead.slug}`}>
          <Pic slug={LEAD} className={s.shot} />
          <span className={s.leadText}>
            <span className={s.kicker}>Start here</span>
            <h2>{lead.title}</h2>
            <p>{lead.excerpt}</p>
          </span>
        </a>
        <div className={s.picks}>
          {PICKS.map((slug) => {
            const p = post(slug);
            return (
              <a key={slug} className={s.pick} href={`/blog/${slug}`}>
                <span className={s.frame}><Pic slug={slug} /></span>
                <h3>{p.title}</h3>
              </a>
            );
          })}
        </div>
        <div className={s.minis}>
          {shelves().map((sh) => (
            <section key={sh.title} className={s.mini}>
              <h2>{sh.title}</h2>
              <ul>{sh.posts.filter((p) => p.slug !== LEAD && !PICKS.includes(p.slug)).map((p) => <li key={p.slug}><a href={`/blog/${p.slug}`}>{p.title}</a></li>)}</ul>
            </section>
          ))}
        </div>
      </div>
      <ClosingBand title="Notes your AI can read and write." text="Pinto Notes works like Apple Notes, and ChatGPT, Claude and Claude Code can use it, with an Undo on every change." />
    </div>
  );
}
