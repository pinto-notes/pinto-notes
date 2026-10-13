import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata, SUPPORT_EMAIL } from "@/lib/site";
import styles from "../home.module.css";
import f from "./faq.module.css";
import Faq from "./Faq";
import { FAQ } from "./questions";
import { GITHUB_URL } from "@/lib/github";
import { JsonLd, faqPage } from "@/lib/structured-data";
import { ClosingBand } from "@/lib/ClosingBand";

export const dynamic = "force-static";
export const metadata: Metadata = pageMetadata({
  title: "Help and FAQ · Pinto Notes",
  description: "How to import your Apple Notes, connect ChatGPT, Claude, Claude Code, Codex or Incredible, sync your iPhone and Mac, share a note, and get help.",
  path: "/help",
  image: { url: "/help/opengraph-image", alt: "Pinto Notes help: importing Apple Notes, connecting your AI, sync and sharing." },
});

const rise = (i: number) => ({ className: "rise", style: { "--i": i } as React.CSSProperties });

/// The questions in four groups, in the order people meet them.
const GROUPS: { title: string; ids: string[] }[] = [
  { title: "Getting started", ids: ["what", "free", "devices", "import", "sync", "offline"] },
  { title: "Connecting an AI", ids: ["connect", "ai-tools", "apple-notes-ai", "ai-access"] },
  { title: "Your notes and account", ids: ["storage", "apps", "delete", "feedback"] },
  { title: "Sharing", ids: ["share", "report-page"] },
];

export default function Help() {
  const grouped = GROUPS.map((g) => ({ ...g, items: g.ids.map((id) => FAQ.find((q) => q.id === id)).filter((q): q is (typeof FAQ)[number] => !!q) }));
  // Any question not placed in a group still shows, at the end of the last one.
  const placed = new Set(GROUPS.flatMap((g) => g.ids));
  const rest = FAQ.filter((q) => !placed.has(q.id));
  if (rest.length) grouped[grouped.length - 1].items.push(...rest);
  return (
    <div className={styles.main}>
      <JsonLd graph={[faqPage(FAQ, "/help")]} />
      <section className={`${styles.log} ${f.page}`}>
        <div className={styles.logHead}>
          <h1 className={`${f.title} rise`} style={{ "--i": 0 } as React.CSSProperties}>Help</h1>
          <p className={`${styles.lede} rise`} style={{ "--i": 1 } as React.CSSProperties}>Answers, and how to reach me.</p>
          <p className={`${f.reach} rise`} style={{ "--i": 1 } as React.CSSProperties}>
            Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. More under <a href="#contact">Contact and your account</a>.
          </p>
        </div>
        {grouped.map((g, i) => (
          <div key={g.title} className={`${f.group} rise`} style={{ "--i": 2 + i } as React.CSSProperties}>
            <h2 className={f.h3}>{g.title}</h2>
            <Faq items={g.items} />
          </div>
        ))}
        <div {...rise(6)} id="contact" className={f.anchor}>
          <h2 className={f.h3}>Contact and your account</h2>
          <dl className={f.facts}>
            <div>
              <dt>Email</dt>
              <dd>Write to <span className={f.address}>{SUPPORT_EMAIL}</span>. I read every email and usually answer within a day or two.</dd>
            </div>
            <div>
              <dt>Report a shared page</dt>
              <dd>Choose &ldquo;Report this page&rdquo; at the bottom of the page, or email the page&apos;s address to <span className={f.address}>{SUPPORT_EMAIL}</span>.</dd>
            </div>
            <div>
              <dt>Delete your account</dt>
              <dd>In the app, open Settings → Account, scroll to the bottom and choose Delete Account… Your account and all your notes are deleted. Or email me and I&apos;ll do it.</dd>
            </div>
            <div>
              <dt>Report a bug</dt>
              <dd>Say what happened and what you expected, by email or <a href={`${GITHUB_URL}/issues/new/choose`} target="_blank" rel="noopener noreferrer">on GitHub</a>.</dd>
            </div>
            <div>
              <dt>Privacy</dt>
              <dd><Link href="/privacy">Privacy policy</Link> and <Link href="/terms">terms of use</Link>.</dd>
            </div>
          </dl>
        </div>
      </section>
      <ClosingBand
        title="Still stuck? Write to me."
        primary={{ href: `mailto:${SUPPORT_EMAIL}`, label: `Email ${SUPPORT_EMAIL}` }}
        secondary={{ href: "https://x.com/EmilWagman", label: "Message me on X", external: true }}
        fine="I read every email and usually answer within a day."
      />
    </div>
  );
}
