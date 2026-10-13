import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata, SUPPORT_EMAIL } from "@/lib/site";
import styles from "../home.module.css";
import f from "./faq.module.css";
import Faq from "./Faq";
import { FAQ } from "./questions";
import { GITHUB_URL } from "@/lib/github";
import { JsonLd, faqPage } from "@/lib/structured-data";
import { WHAT_IT_IS } from "@/lib/facts";
import { ClosingBand } from "@/lib/ClosingBand";

export const dynamic = "force-static";
export const metadata: Metadata = pageMetadata({
  title: "Help and FAQ · Pinto Notes",
  description: "How to import your Apple Notes, connect ChatGPT, Claude, Claude Code, Codex or Incredible, sync your iPhone and Mac, share a note, and get help.",
  path: "/help",
  image: { url: "/help/opengraph-image", alt: "Pinto Notes help: importing Apple Notes, connecting your AI, sync and sharing." },
});

const rise = (i: number) => ({ className: "rise", style: { "--i": i } as React.CSSProperties });

export default function Help() {
  return (
    <div className={styles.main}>
      <JsonLd graph={[faqPage(FAQ, "/help")]} />
      <section className={styles.log}>
        <div className={styles.logHead}>
          <h1 className={`${styles.h2} rise`} style={{ "--i": 0 } as React.CSSProperties}>Help</h1>
          <p className={`${styles.lede} rise`} style={{ "--i": 1 } as React.CSSProperties}>{WHAT_IT_IS} Here are answers to common questions, and how to reach me.</p>
          <p className={`${f.reach} rise`} style={{ "--i": 1 } as React.CSSProperties}>
            Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. More under <a href="#contact">Contact and your account</a>.
          </p>
        </div>
        <div {...rise(2)}><Faq items={FAQ} /></div>
        <div {...rise(3)} id="contact" className={f.anchor}>
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
