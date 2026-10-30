import type { Metadata } from "next";
import legal from "@/lib/legal.module.css";
import { LongPage, SectionHeading } from "@/lib/LegalPage";
import { pageMetadata, SUPPORT_EMAIL } from "@/lib/site";
import { AI_ACCESS, CAVEAT, COUNTS, ENCRYPTION, FACTS, LIMITS, LOGS, PRIVACY_PATH, READABLE, WHO_CAN_SEE } from "@/lib/privacy";
import s from "./privacy.module.css";
import { ClosingBand } from "@/lib/ClosingBand";
import { PageHero } from "@/lib/PageHero";

// Privacy & Security for people, not lawyers: what we store, who can see it, which logs exist.
// The facts live in lib/privacy.ts (shared with the home page); docs/privacy-policy.md is the long form.

export const dynamic = "force-static";
export const metadata: Metadata = pageMetadata({
  title: "Privacy & Security · Pinto Notes",
  description: "What Pinto Notes stores and where, what's encrypted and what stays readable, what happens when you connect an AI, every log we keep and for how long.",
  path: PRIVACY_PATH,
  index: true,
});

const r = (i: number) => ({ "--i": i }) as React.CSSProperties;
const GITHUB = "https://github.com/pinto-notes/pinto-notes";

const SECTIONS = [
  { id: "what-we-store", title: "What we store, and where" },
  { id: "encryption", title: "What's encrypted" },
  { id: "readable", title: "What stays readable to us" },
  { id: "ai", title: "When you connect an AI" },
  { id: "limits", title: "Limits" },
  { id: "who-can-see", title: "Who can see what" },
  { id: "no-tracking", title: "No ads, no tracking in the app" },
  { id: "your-data", title: "Your data, your choice" },
  { id: "open-source", title: "Open source, so you can check" },
];

export default function PrivacySecurity() {
  return (
    <>
    <div className={s.top}>
      <PageHero
        align="left"
        title="Privacy & Security"
        lede="What we store, who can see it, and every log we keep. In plain words."
        art={{ src: "/art/privacy.webp", alt: "", width: 1672, height: 941 }}
      />
      <ul className={`${s.facts} rise`} style={r(4)}>
        {FACTS.map((f) => (
          <li key={f.title} className={s.fact}>
            <h2>{f.title}</h2>
            <p>{f.short}</p>
          </li>
        ))}
      </ul>
      <p className={`${s.caveat} rise`} style={r(5)}>
        {CAVEAT.text} <a href={CAVEAT.href}>{CAVEAT.link}</a>
      </p>
    </div>

    <LongPage
      bare
      title="Privacy & Security"
      sections={SECTIONS}
      other={{ href: "/privacy", label: "Privacy Policy" }}
    >
        <article className={`${legal.article} rise`} style={r(3)}>
          <SectionHeading id="what-we-store">What we store, and where</SectionHeading>
          <p>
            Your account (your email address, or Apple&apos;s relay address if you use Hide My Email), your notes, folders, files and
            earlier versions of each note as encrypted copies, your profile name and photo if you set them, your devices, and the AI apps
            you&apos;ve connected. It&apos;s all stored at Supabase, our host, in Frankfurt, Germany.
          </p>
          <p>
            The website and shared note pages run on Vercel, and are built in Frankfurt too. Vercel passes requests on to our server,
            including the requests AI apps make, and sees a shared note while it shows the page, but it doesn&apos;t store your notes.
            Our server does its work in Frankfurt: a request from anywhere enters Supabase&apos;s network at the nearest location and
            is passed to Frankfurt before it&apos;s handled.
          </p>

          <SectionHeading id="encryption">{"What's encrypted"}</SectionHeading>
          <ul>
            {ENCRYPTION.items.map((i) => <li key={i.label}><strong>{i.label}</strong> {i.text}</li>)}
          </ul>
          <p>{ENCRYPTION.note}</p>

          <SectionHeading id="readable">What stays readable to us</SectionHeading>
          <p>To sync your notes and run your account, some details aren&apos;t encrypted:</p>
          <ul>
            {READABLE.map((t) => <li key={t}>{t.charAt(0).toUpperCase() + t.slice(1)}.</li>)}
          </ul>

          <SectionHeading id="ai">When you connect an AI</SectionHeading>
          <ul>
            {AI_ACCESS.map((i) => <li key={i.label}><strong>{i.label}</strong> {i.text}</li>)}
            <li>Every change an AI makes keeps the previous version, so you can see what changed and restore it.</li>
            <li>Disconnect any AI app in <strong>Settings → Connect an AI</strong>. It loses access at once.</li>
            <li>What an AI app reads becomes part of your conversation with it, and the company behind it handles that under its own privacy policy.</li>
          </ul>

          <SectionHeading id="limits">Limits</SectionHeading>
          <ul>
            {LIMITS.map((i) => <li key={i.label}><strong>{i.label}</strong> {i.text}</li>)}
          </ul>

          <SectionHeading id="who-can-see">Who can see what</SectionHeading>
          <ul>
            {WHO_CAN_SEE.map((i) => <li key={i.label}><strong>{i.label}</strong> {i.text}</li>)}
          </ul>

          <SectionHeading id="no-tracking">No ads, no tracking in the app</SectionHeading>
          <p>
            There are no ads, and there never will be. The apps have no tracking and link no analytics or crash-reporting SDK.
            Versions after 1.2 send error and crash reports and a few usage counts to PostHog in the EU: never your notes, titles or
            anything you write. Settings, General, Share diagnostics and usage turns it off.
            We never sell or share your data.
          </p>
          <p>
            This website counts page views and where visitors came from with Vercel Web Analytics, and which links and buttons are
            clicked, where on a page people click and how far pages are scrolled with PostHog, in the EU. These are counted across all
            visitors. Neither keeps a profile of you, and neither runs on shared notes or the connect pages.
            PostHog uses a cookie only if you choose Accept on the cookie banner, to recognise your return visits for up to a year,
            and then also records your visits to the public pages as session replays, with everything you type masked, kept for 30
            days. Without Accept, no visit is recorded. Cookie settings at the bottom of the page changes your answer. It also counts Mac downloads as daily totals. None of this
            touches your notes or your computer.
          </p>
          <p>The apps count a few things on our own server, so we can tell whether Pinto Notes works for people. Kept for 12 months, never shared:</p>
          <ul>
            {COUNTS.map((c) => <li key={c}>{c.charAt(0).toUpperCase() + c.slice(1)}.</li>)}
          </ul>

          <SectionHeading id="your-data">Your data, your choice</SectionHeading>
          <ul>
            <li><strong>Export:</strong> Settings → Privacy &amp; Security → Export Your Notes makes a zip on your device with every note as Markdown in its folder, with its files. We can&apos;t read your notes, so the export can only be made there. For everything else we keep about you, write to us.</li>
            <li><strong>Delete:</strong> Settings → Delete Account deletes your account and everything in it from our server at once: notes, files, versions, AI connections, share links and usage counts.</li>
            <li><strong>Deleted notes</strong> stay in Recently Deleted for 30 days, then they&apos;re gone for good.</li>
            <li>
              You can also ask us to correct, restrict or stop using your data, or object to the usage counts. Write to{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>; we answer within a month. You can complain to the Swedish Authority
              for Privacy Protection (<a href="https://www.imy.se" target="_blank" rel="noopener noreferrer">IMY</a>).
            </li>
          </ul>

          <SectionHeading id="open-source">Open source, so you can check</SectionHeading>
          <p>
            Everything above is in the code, and the code is on <a href={GITHUB} target="_blank" rel="noopener noreferrer">GitHub</a>:
            the apps, the server and this website. Found a security problem? Write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>,
            not a public issue.
          </p>
          <p>The legal details are in the <a href="/privacy">privacy policy</a>.</p>

          <details className={s.logsFold} id="logs">
            <summary>Every log, and how long it&apos;s kept<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5.5 7 9.5l4-4" /></svg></summary>
            <div className={s.logsBody}>
            <p>
              We don&apos;t write the text of your notes, email addresses, access tokens or IP addresses into any log of our own. Our hosts log
              the requests that reach them; we can&apos;t turn that off, but they keep it briefly.
            </p>
            <div className="tableWrap"><table className={s.logs}>
              <thead><tr><th>Log</th><th>What&apos;s in it</th><th>Kept</th></tr></thead>
              <tbody>
                {LOGS.map((l) => (
                  <tr key={l.name}><td>{l.name}</td><td>{l.what}</td><td className={s.kept}>{l.kept}</td></tr>
                ))}
              </tbody>
            </table></div>
            <p>
              Our hosting plan keeps no backups of the database, so what you delete is gone. If that changes, a backup would hold only the
              encrypted copies and the locked copies of your key, for as long as this page and the privacy policy say.
            </p>
            </div>
          </details>
        </article>
    </LongPage>
    <ClosingBand
      title="Read the code yourself."
      text="The apps, the server and this website are open source, so every promise on this page can be checked."
      primary={{ href: GITHUB, label: "View on GitHub", external: true }}
      secondary={{ href: "/privacy", label: "Privacy policy" }}
      fine={null}
    />
    </>
  );
}
