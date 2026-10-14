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

/// A real capture of a version's headline feature, small, where one exists (public/blog): no picture
/// otherwise. Emil, 14 October 2026: decorative pictures here "don't tell me anything".
const CAPTURES: Record<string, { src: string; alt: string; width: number; height: number }> = {
  "1.2": { src: "/blog/thumb-iphone-files.webp", alt: "A note on iPhone holding a PDF and a CSV file, in dark mode", width: 1238, height: 831 },
  "1.1": { src: "/blog/thumb-consent-e2ee.webp", alt: "Pinto Notes asking to let ChatGPT use your notes", width: 826, height: 545 },
  "1.0": { src: "/blog/thumb-checklist-ticked.webp", alt: "A checklist in Pinto Notes with three of its items ticked", width: 700, height: 462 },
};

/// Each version: its capture, its name and date, the few changes that matter (the release's own
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
        const art = CAPTURES[r.version];
        const top = r.highlights?.length ? r.highlights : r.items;
        const all = r.highlights?.length ? r.items : [];
        return (
          <article key={r.version} id={`v${r.version}`} className={`${c.entry} rise`} style={rise(2 + n)} data-art={art ? "" : undefined}>
            {art && <img className={c.art} src={art.src} alt={art.alt} width={art.width / 2} height={art.height / 2} loading={n ? "lazy" : "eager"} decoding="async" />}
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
