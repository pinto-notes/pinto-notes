import type { Metadata } from "next";
import styles from "./home.module.css";
import Demo from "./Demo";
import DownloadLink from "./DownloadLink";
import PlatformNote from "./PlatformNote";
import { AiSection, AlsoLine, AppsSection, Closing, ImportSection, PrivacySection } from "./Sections";
import { latestVersion } from "@/lib/changelog";
import { APP_STORE_LIVE, APP_STORE_URL, pageMetadata } from "@/lib/site";
import { JsonLd, app, incredible, maker, organization, website } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Pinto Notes: one notes app for every AI you use",
  shareTitle: "Write the plan. Your AI helps you follow through.",
  description:
    "A notes app for iPhone and Mac that feels like Apple Notes. ChatGPT, Claude, Claude Code, Codex and Incredible read and edit the same notes, with your approval, and help you follow through. Imports your Apple Notes. Free.",
  path: "/",
});

const rise = (i: number) => ({ style: { "--i": i } as React.CSSProperties });

export default function Home() {
  return (
    <div className={styles.main}>
      <JsonLd graph={[app(latestVersion()), organization, maker, incredible, website]} />
      <section className={styles.hero}>
        <h1 className={`${styles.h1} rise`} {...rise(0)}>
          Write the plan. <mark className={styles.mark}>Your AI</mark> helps you follow through.
        </h1>
        <p className={`${styles.lede} rise`} {...rise(1)}>
          One notes app that ChatGPT, Claude, Codex and Incredible all read and edit. It feels like Apple Notes, and brings yours over in one go.
        </p>
        <div className={`${styles.ctas} rise pi-apple pi-not-ios`} {...rise(2)}>
          <DownloadLink className={styles.primary}><AppleGlyph /> Download for Mac</DownloadLink>
          {APP_STORE_LIVE && <a className={styles.secondary} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">Get it for iPhone</a>}
        </div>
        <PlatformNote place="hero" className="rise" {...rise(2)} />
      </section>

      <div className="rise-soft" {...rise(3)}><Demo /></div>

      <AiSection />
      <ImportSection />
      <AlsoLine />
      <AppsSection />
      <PrivacySection />
      <Closing />
    </div>
  );
}

function AppleGlyph() {
  return (
    <svg width="14" height="17" viewBox="0 0 15 18" aria-hidden="true" fill="currentColor">
      <path d="M12.3 9.6c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8C3.2 4.6 1.8 5.4 1 6.8c-1.6 2.8-.4 6.9 1.1 9.1.8 1.1 1.7 2.3 2.8 2.3 1.1 0 1.6-.7 2.9-.7 1.4 0 1.7.7 2.9.7 1.2 0 2-1.1 2.7-2.2.9-1.3 1.2-2.5 1.2-2.6 0 0-2.3-.9-2.3-3.8zM10.1 3c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.6.6-1.1 1.6-.9 2.6.9.1 1.9-.5 2.5-1.2z" />
    </svg>
  );
}
