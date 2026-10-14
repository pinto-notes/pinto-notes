import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { changelog } from "@/lib/changelog";
import { webRelease } from "@/lib/changelog-web";
import { publicVersion } from "@/lib/public-release";
import styles from "../home.module.css";
import c from "./changelog.module.css";

export const dynamic = "force-static";
export const metadata: Metadata = pageMetadata({
  title: "Changelog · Pinto Notes",
  description: "What's new in each version of Pinto Notes for Mac and iPhone.",
  path: "/changelog",
});

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;
const longDate = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/// The changelog: leaf brown like Help, one centred 880 px column with the title centred in it. Each minor version, as text: its
/// number and date, its name, three short highlights, and under Read more every change in one line
/// and the patch releases that followed it.
export default function Changelog() {
  const releases = changelog();
  const live = publicVersion();
  return (
    <div className={styles.main}>
      <section className={c.page}>
        <div className={c.head}>
          <h1 className={`${styles.h2} rise`} style={rise(0)}>Changelog</h1>
          <p className={`${styles.lede} rise`} style={rise(1)}>What&apos;s new in each version.</p>
        </div>
        {releases.map((r, n) => {
          const w = webRelease(r, live);
          return (
            <article key={r.version} id={`v${r.version}`} className={`${c.entry} rise`} style={rise(2 + n)}>
              <p className={c.meta}>
                <a className={c.version} href={`#v${r.version}`} aria-label={`Version ${r.version}`}>{r.version}</a>
                <time dateTime={r.date}>{longDate(r.date)}</time>
              </p>
              <div className={c.body}>
              <h2 className={c.name}>{r.title}</h2>
              <ul className={c.top}>{w.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
              <details className={c.more}>
                <summary>Read more<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5.5 7 9.5l4-4" /></svg></summary>
                <div className={c.moreBody}>
                  <h3 className={c.label}>Every change in {r.version}</h3>
                  <ul className={c.all}>
                    {w.items.map((i) => <li key={i.text}>{i.text}{i.href && <> <a href={i.href}>{i.link}</a></>}</li>)}
                  </ul>
                  {w.patches.length > 0 && (
                    <>
                      <h3 className={c.label}>Updates since {r.version}</h3>
                      <ol className={c.patches}>
                        {w.patches.map((p) => (
                          <li key={p.version}>
                            <span className={c.patchVersion}>{p.version}</span>
                            <time dateTime={p.date}>{longDate(p.date)}</time>
                            {p.note && <span className={c.patchNote}>{p.note}</span>}
                          </li>
                        ))}
                      </ol>
                    </>
                  )}
                </div>
              </details>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
