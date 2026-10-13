import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { changelog, latestVersion } from "@/lib/changelog";
import { ClosingBand } from "@/lib/ClosingBand";
import c from "./changelog.module.css";

export const dynamic = "force-static";
export const metadata: Metadata = pageMetadata({
  title: "Changelog · Pinto Notes",
  description: "What's new in each version of Pinto Notes for Mac and iPhone.",
  path: "/changelog",
});

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;
const longDate = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/// A version's paper-craft picture, cut from the changelog drawing (public/art/changelog-<version>.webp):
/// the first notebook, the padlocked one, the new leaf label. A version without one has none.
const picture = (version: string) => fs.existsSync(path.join(process.cwd(), "public/art", `changelog-${version}.webp`)) ? `/art/changelog-${version}.webp` : null;

/// Each version: its picture, its name and date, the few changes that matter (the release's own
/// highlights, the ones the app shows after updating), and every change behind "All n changes".
export default function Changelog() {
  const releases = changelog();
  return (
    <div className={c.main}>
      <header className={c.head}>
        <h1 className={`${c.title} rise`} style={rise(0)}>Changelog</h1>
        <p className={`${c.lede} rise`} style={rise(1)}>What&apos;s new in each version.</p>
      </header>
      {releases.map((r, n) => {
        const art = picture(r.version);
        const top = r.highlights?.length ? r.highlights : r.items;
        const all = r.highlights?.length ? r.items : [];
        return (
          <article key={r.version} id={`v${r.version}`} className={`${c.entry} rise`} style={rise(2 + n)} data-art={art ? "" : undefined}>
            {art && <img className={c.art} src={art} alt="" width={440} height={560} loading={n ? "lazy" : "eager"} decoding="async" />}
            <div className={c.body}>
              <p className={c.meta}>
                <a className={c.version} href={`#v${r.version}`} aria-label={`Version ${r.version}`}>{r.version}</a>
                <time dateTime={r.date}>{longDate(r.date)}</time>
              </p>
              <h2 className={c.name}>{r.title}</h2>
              <ul className={c.top}>{top.map((i) => <li key={i}>{i}</li>)}</ul>
              {all.length > 0 && (
                <details className={c.all}>
                  <summary>All {all.length} changes<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5.5 7 9.5l4-4" /></svg></summary>
                  <ul>{all.map((i) => <li key={i}>{i}</li>)}</ul>
                </details>
              )}
            </div>
          </article>
        );
      })}
      <ClosingBand title={latestVersion() ? `Get Pinto Notes ${latestVersion()}.` : "Get Pinto Notes."} />
    </div>
  );
}
