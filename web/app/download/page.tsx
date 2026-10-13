import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { MAC_DOWNLOAD_PATH } from "@/lib/downloads";
import { latestVersion } from "@/lib/changelog";
import { JsonLd, app, breadcrumbs, incredible, maker, organization } from "@/lib/structured-data";
import PlatformNote from "../PlatformNote";
import styles from "./download.module.css";
import { ClosingBand } from "@/lib/ClosingBand";
import { StoryPlayer } from "@/lib/StoryPlayer";

export const metadata: Metadata = pageMetadata({
  title: "Download Pinto Notes for Mac",
  description: "Download Pinto Notes, the free notes app for Mac that ChatGPT and Claude can read and edit. Needs macOS 26 or later.",
  path: "/download",
  image: { url: "/download/opengraph-image", alt: "Download Pinto Notes for Mac. Free, for macOS 26 or later." },
});

/// Written by scripts/release-mac.sh next to the DMG it uploads (public/downloads/<file>).
type Release = { version: string; build: string; size: number; date: string; file: string; sparkleFile?: string; minimumSystemVersion: string };

function latest(): Release | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "release.json"), "utf8"));
  } catch {
    return null;
  }
}

const r = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default function Download() {
  const release = latest();
  const size = release ? `${(release.size / 1_000_000).toFixed(1)} MB` : "";
  const date = release ? new Date(release.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
  const macos = release?.minimumSystemVersion.replace(/\.0$/, "") ?? "26";
  return (
    <div className={styles.wrap}>
      <JsonLd graph={[app(latestVersion()), organization, maker, incredible, breadcrumbs([{ name: "Pinto Notes", path: "/" }, { name: "Download for Mac", path: "/download" }])]} />
      <section className={styles.hero}>
        <img className={`${styles.icon} rise`} style={r(0)} src="/mark-256.png" alt="" width={128} height={128} />
        <h1 className={`${styles.title} rise`} style={r(1)}>Download Pinto Notes for Mac</h1>
        {release ? (
          <>
            <p className={`${styles.meta} rise`} style={r(2)}>
              Version {release.version} · {size} · {date}
            </p>
            <a className={`${styles.button} rise pi-apple`} style={r(3)} href={MAC_DOWNLOAD_PATH} download={release.file} data-hero-download="">
              <Apple /> Download for Mac
            </a>
            <PlatformNote place="download" className="rise" style={r(3)} />
            <p className={`${styles.req} rise`} style={r(4)}>Free · Requires macOS {macos} or later</p>
          </>
        ) : (
          <p className={`${styles.meta} rise`} style={r(2)}>The first Mac release is on its way.</p>
        )}
      </section>

      <section className={`${styles.install} rise`} style={r(5)} aria-labelledby="install">
        <h2 id="install" className={styles.h2}>Install it in three steps</h2>
        <StoryPlayer
          label="How to install Pinto Notes"
          numbered
          seconds={3.2}
          steps={[
            { title: "Open the download", text: `Double-click ${release?.file ?? "the file"} in your Downloads.` },
            { title: "Drag it to Applications", text: "Drop Pinto Notes on the Applications folder." },
            { title: "Open it and sign in", text: "With Apple or email. Your notes sync to your iPhone." },
          ]}
          backdrop={<img className={styles.stageArt} src="/art/download.webp" alt="" width={1672} height={941} loading="lazy" decoding="async" />}
          slides={[
            <div key="dmg" className={`${styles.pin} ${styles.pinLeft}`} aria-hidden="true">
              <div className={styles.dmg}><img src="/mark-256.png" alt="" width={44} height={44} /><b>{release?.file ?? "Pinto-Notes.dmg"}</b>{size && <span>{size}</span>}</div>
            </div>,
            <div key="drag" className={`${styles.pin} ${styles.pinMid}`} aria-hidden="true">
              <div className={styles.drag}><img src="/mark-256.png" alt="" width={40} height={40} /><span className={styles.dragArrow}>→</span><b>Applications</b></div>
            </div>,
            <div key="signin" className={`${styles.pin} ${styles.pinRight}`} aria-hidden="true">
              <div className={styles.signin}><img src="/mark-256.png" alt="" width={36} height={36} /><b>Welcome to Pinto Notes</b><i /><span className={styles.apple}><Apple /> Sign in</span></div>
            </div>,
          ]}
        />
        <p className={styles.more}><a href="/changelog">See what&apos;s new in each version</a></p>
      </section>

      <ClosingBand
        title="Your notes, and the AIs you already use."
        secondary={{ href: "/blog/connect-chatgpt-to-your-notes", label: "Connect ChatGPT" }}
      />
    </div>
  );
}

function Apple() {
  return (
    <svg width="15" height="18" viewBox="0 0 15 18" aria-hidden="true" fill="currentColor">
      <path d="M12.3 9.6c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8C3.2 4.6 1.8 5.4 1 6.8c-1.6 2.8-.4 6.9 1.1 9.1.8 1.1 1.7 2.3 2.8 2.3 1.1 0 1.6-.7 2.9-.7 1.4 0 1.7.7 2.9.7 1.2 0 2-1.1 2.7-2.2.9-1.3 1.2-2.5 1.2-2.6 0 0-2.3-.9-2.3-3.8zM10.1 3c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.6.6-1.1 1.6-.9 2.6.9.1 1.9-.5 2.5-1.2z" />
    </svg>
  );
}
