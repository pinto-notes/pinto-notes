import type { Metadata } from "next";
import { APP_STORE_URL } from "@/lib/site";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { display } from "./fonts";
import { Hero } from "./Hero";
import { AiChat, AiWin, BuildWin, Devices, DrawWin, HistoryMini, SlashMini, TableMini, WriteWin } from "./Pictures";
import p from "./pic.module.css";
import s from "./q.module.css";

export const metadata: Metadata = {
  title: "Pinto Notes: the notebook for you and your AI",
  description: "Write notes, draw on whiteboards and build small apps, with your AI. Feels like Apple Notes, on Mac and iPhone. Works with ChatGPT and Claude. Free.",
};

// Study Q, "the warm paper notebook" (2026-11-14). A calm hero (the tall dusk painting, her note on
// her phone), then one section template for every feature: the title and one sentence in a header
// row, then one full-width frame with the app whole in it. Headlines in Newsreader, italic only in
// the h1; every sentence in the site's sans at one size. One dark band for the memory study's number
// and one marigold band for Mac and iPhone. It ends on one download moment over the paper town.

const Arrow = () => <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" /></svg>;

/** One section template for every feature: a header row (the title on the left half, the one
 *  sentence on the right, on the title's baseline), then one full-width frame. */
function Section({ id, title, line, link, className = "", children }: {
  id: string; title: string; line: string; link?: { href: string; text: string }; className?: string; children: React.ReactNode;
}) {
  return (
    <section className={`${s.section} ${className}`} aria-labelledby={id}>
      <div className={s.headRow}>
        <h2 id={id} className={s.title}>{title}</h2>
        <div className={s.headText}>
          <p className={s.body}>{line}</p>
          {link && <a className={`${s.label} ${s.link}`} href={link.href}>{link.text}<Arrow /></a>}
        </div>
      </div>
      {children}
    </section>
  );
}

/** The frame: a flat warm tone, the app centred in it with the same inset on every side. */
function Frame({ tone, children }: { tone: "write" | "draw" | "build" | "ai"; children: React.ReactNode }) {
  return <div className={p.frame} data-tone={tone}><div className={p.inset}>{children}</div></div>;
}

/** Three small things, each with a piece of the real UI big enough to read. */
const MORE: { title: string; say: string; Mini: () => React.JSX.Element }[] = [
  { title: "The / menu", say: "Type / for a heading, a checklist, a table or a link.", Mini: SlashMini },
  { title: "Tables and checklists", say: "Plan in a table and tick things off.", Mini: TableMini },
  { title: "Every version kept", say: "Go back to any earlier version.", Mini: HistoryMini },
];

export default function Page() {
  return (
    <div className={`${s.main} ${display.variable}`}>
      <Hero />

      <Section id="q-write" title="Write notes." line="They feel like Apple Notes on Mac and iPhone, and you can bring yours over.">
        <Frame tone="write"><WriteWin /></Frame>
      </Section>

      <Section id="q-draw" title="Draw on whiteboards." line="A whiteboard next to your notes that your AI can read and draw on.">
        <Frame tone="draw"><DrawWin /></Frame>
      </Section>

      <Section id="q-build" title="Build apps." line="Small apps in a note, like a habit tracker, from a template or your AI."
        link={{ href: "/templates", text: "See all templates" }}>
        <Frame tone="build"><BuildWin /></Frame>
      </Section>

      <Section id="q-ai" title="Your AI, in all three." line="Connect ChatGPT, Claude, Claude Code or Codex, and it starts every chat knowing your notes.">
        <Frame tone="ai"><AiChat /><AiWin /></Frame>
      </Section>

      {/* The one measured number, as big as the page gets. */}
      <section className={s.numBand} aria-labelledby="q-num">
        <h2 id="q-num" className={s.bigNum}>
          <span className={s.numFrom}>18%</span>
          <svg viewBox="0 0 60 24" aria-hidden="true"><path d="M3 12h50M44 4l10 8-10 8" /></svg>
          <span>82.5%</span>
        </h2>
        <p className={s.body}>In a new chat, Claude answered 18% of questions on past chats right; with Pinto, 82.5%.</p>
        <a className={`${s.label} ${s.link}`} href="/blog/ai-memory-with-notes">Read the study<Arrow /></a>
      </section>

      <section className={`${s.section} ${s.band}`} aria-labelledby="q-both">
        <div className={s.headRow}>
          <h2 id="q-both" className={s.title}>On your Mac and iPhone.</h2>
          <div className={s.headText}><p className={s.body}>The same notes on both, always in sync, and they work offline too.</p></div>
        </div>
        <Devices />
      </section>

      <Section id="q-more" title="And so much more." line="Bring notes from Obsidian, Bear, Evernote or Keep, lock a note, and sync encrypted.">
        <ul className={s.cards}>
          {MORE.map((m) => (
            <li key={m.title} className={s.card}>
              <div className={`${s.cardPic} ${s.frame}`}><m.Mini /></div>
              <h3 className={s.label}>{m.title}</h3>
              <p className={s.body}>{m.say}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Free and the download in one moment, over the paper town. */}
      <section className={s.closing} aria-labelledby="q-closing">
        <img src="/mark-256.png" alt="" width={104} height={104} className={s.closingIcon} />
        <h2 id="q-closing" className={s.closingTitle}>Pinto Notes is free.</h2>
        <p className={s.body}>On Mac and iPhone, and open source under the MIT license.</p>
        <div className={`${x.ctas} ${s.closingCtas}`}>
          <Download note={false} />
          <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
            Get it for iPhone
          </a>
          <a className={x.offMac} href="/download">Download for Mac</a>
        </div>
        <p className={s.label}>Requires macOS 26 or iOS 26.</p>
      </section>
    </div>
  );
}
