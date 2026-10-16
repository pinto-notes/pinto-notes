import home from "../../home.module.css";
import { ClosingBand } from "@/lib/ClosingBand";
import { shelves } from "@/lib/blog-lab";
import { Head } from "../Head";
import s from "../lab.module.css";

export const dynamic = "force-static";
export const metadata = { title: "Blog lab A · Pinto Notes", robots: { index: false } };

/// A: shelves. Every post by what you came for, as plain titles. No pictures, no dates, no chips.
export default function Page() {
  return (
    <div className={home.main}>
      <div className={s.page}>
        <Head />
        {shelves().map((sh) => (
          <section key={sh.title} className={s.shelf}>
            <div className={s.shelfName}><h2>{sh.title}</h2><p>{sh.line}</p></div>
            <ul className={s.rows}>
              {sh.posts.map((p) => <li key={p.slug}><a href={`/blog/${p.slug}`}>{p.title}</a></li>)}
            </ul>
          </section>
        ))}
      </div>
      <ClosingBand title="Notes your AI can read and write." text="Pinto Notes works like Apple Notes, and ChatGPT, Claude and Claude Code can use it, with an Undo on every change." />
    </div>
  );
}
