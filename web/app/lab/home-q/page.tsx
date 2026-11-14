import type { Metadata } from "next";
import { AIGlyph } from "@/lib/ai-glyphs";
import { APP_STORE_URL } from "@/lib/site";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { display } from "./fonts";
import { Hero } from "./Hero";
import { BuildWin, CoverFan, Devices, DrawWin, HistoryMini, ImportCard, SaidDone, SlashMini, TableMini, WriteWin } from "./Pictures";
import { Room } from "./Rooms";
import s from "./q.module.css";

export const metadata: Metadata = {
  title: "Pinto Notes: the notebook for you and your AI",
  description: "Write notes, draw on whiteboards and build small apps, with your AI. Feels like Apple Notes, on Mac and iPhone. Works with ChatGPT and Claude. Free.",
};

// Study Q, "the warm paper notebook" (2026-11-14, round 4; round 5 after the blind ranking). A calm
// hero (today's live picture, pushed in on her phone so the note reads), then one section per feature.
// Headlines in a warm serif with one word in italic; the UI and body stay in the site's sans. The
// sections change shape on purpose: rooms for Write, Build and the AI; a full-bleed night for Draw;
// a dark band for the memory study's number; a marigold band for Mac and iPhone. It ends on one
// download moment over the paper town.

const AIS = [
  { name: "ChatGPT", glyph: "openai" },
  { name: "Claude", glyph: "claude" },
  { name: "Claude Code", glyph: "claude" },
  { name: "Codex", glyph: "openai" },
] as const;

type Detail = [string, string];
function Feature({ id, title, line, details, flip, link, children }: {
  id: string; title: React.ReactNode; line: string; details: Detail[]; flip?: boolean; link?: { href: string; text: string }; children: React.ReactNode;
}) {
  return (
    <section className={s.feature} data-flip={flip || undefined} aria-labelledby={id}>
      <div className={s.words}>
        <h2 id={id} className={s.title}>{title}</h2>
        <p className={s.line}>{line}</p>
        <ul className={s.details}>
          {details.map(([b, t]) => <li key={b}><b>{b}</b> {t}</li>)}
        </ul>
        {link && <a className={s.more} href={link.href}>{link.text}<Arrow /></a>}
      </div>
      <div className={s.pic}>{children}</div>
    </section>
  );
}
const Arrow = () => <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" /></svg>;

/** Three small things, each with a piece of the real UI big enough to read. */
const BIG: { title: string; say: string; Mini: () => React.JSX.Element }[] = [
  { title: "The / menu", say: "Type / for a heading, a checklist, a table or a link.", Mini: SlashMini },
  { title: "Tables and checklists", say: "Plan in a table and tick things off, as in Apple Notes.", Mini: TableMini },
  { title: "Every version kept", say: "Go back to any earlier version. Deleted notes wait 30 days.", Mini: HistoryMini },
];

export default function Page() {
  return (
    <div className={`${s.main} ${display.variable}`}>
      <Hero />

      <Feature id="q-write" title={<>Write <em>notes</em>.</>} line="They feel like Apple Notes, on your Mac and iPhone. Bring your Apple Notes over."
        details={[["Like Apple Notes.", "Checklists, tables, folders and links between notes."], ["Bring yours over.", "On the Mac, import Apple Notes with their folders. Apple Notes stays as it is."]]}>
        <Room scene="morning" className={s.writeRoom}>
          <div className={s.at}><WriteWin /></div>
          <div className={s.importAt}><ImportCard /></div>
        </Room>
      </Feature>

      {/* Draw breaks the pattern: the words over a night that runs to the window's edges. */}
      <section className={s.draw} aria-labelledby="q-draw">
        <div className={s.drawWords}>
          <h2 id="q-draw" className={s.title}>Draw on <em>whiteboards</em>.</h2>
          <p className={s.line}>A whiteboard right next to your notes. Your AI can read it and draw on it. Ask Claude to add a step, and it draws it in.</p>
        </div>
        <Room scene="night" className={s.drawRoom}>
          <div className={s.at}><DrawWin /></div>
        </Room>
        <p className={s.drawFoot}>Boxes, arrows and words, with the tools you know from Excalidraw. Saved as a standard .excalidraw file.</p>
      </section>

      <Feature id="q-build" flip title={<>Build <em>apps</em>.</>} line="Small apps in a note, like a habit tracker or a budget. Start from a template, or ask your AI to make one."
        details={[["Ready now.", "Pick a template and start using it."], ["Any AI can update it.", "Tell Claude you went to the gym, and it ticks it off."]]}
        link={{ href: "/templates", text: "See all templates" }}>
        <Room scene="cafe" className={s.buildRoom}>
          <div className={s.at}><BuildWin list={false} /></div>
          <div className={s.fanAt}><CoverFan /></div>
        </Room>
      </Feature>

      <section className={s.ai} aria-labelledby="q-ai">
        <div className={s.center}>
          <h2 id="q-ai" className={s.title}>Your AI, in <em>all three</em>.</h2>
          <p className={s.line}>Every chat starts from zero. Connect ChatGPT, Claude, Claude Code or Codex to your notes, and it knows your life.</p>
          <ul className={s.aiRow}>
            {AIS.map((a) => <li key={a.name}><span className={s.aiMark} data-ai={a.glyph}><AIGlyph name={a.glyph} size={22} /></span>{a.name}</li>)}
          </ul>
        </div>
        <Room scene="dusk" className={s.aiRoom}>
          <SaidDone />
        </Room>
        <p className={s.marks}>Marks show what your AI changed, with Undo, and every earlier version is kept.</p>
      </section>

      {/* The one measured number, as big as the page gets. */}
      <section className={s.numBand} aria-labelledby="q-num">
        <h2 id="q-num" className={s.bigNum}>
          <span className={s.numFrom}>18%</span>
          <svg viewBox="0 0 60 24" aria-hidden="true"><path d="M3 12h50M44 4l10 8-10 8" /></svg>
          <span className={s.numTo}>82.5%</span>
        </h2>
        <p className={s.numSay}>In a new chat, Claude answered 18% of questions about months of past chats right, and 82.5% with Pinto Notes connected.</p>
        <a className={s.numLink} href="/blog/ai-memory-with-notes">Read the study<Arrow /></a>
      </section>

      <section className={s.both} aria-labelledby="q-both">
        <div className={s.center}>
          <h2 id="q-both" className={s.title}>On your Mac and <em>iPhone</em>.</h2>
          <p className={s.line}>The same notes on both, always in sync. They work offline too.</p>
        </div>
        <div className={s.bothStage}>
          <Devices />
        </div>
      </section>

      <section className={s.moreSec} aria-labelledby="q-more">
        <h2 id="q-more" className={s.title}>And so much <em>more</em>.</h2>
        <ul className={s.cards}>
          {BIG.map((m) => (
            <li key={m.title} className={s.card}>
              <div className={s.cardPic}><m.Mini /></div>
              <h3>{m.title}</h3>
              <p>{m.say}</p>
            </li>
          ))}
        </ul>
        <p className={s.moreLine}>Bring your notes from Apple Notes, Obsidian, Bear, Evernote and Keep. Lock a note with its own password. Everything is encrypted on your device before it syncs.</p>
      </section>

      {/* Free and the download in one moment, over the paper town. */}
      <section className={s.closing} aria-labelledby="q-closing">
        <img src="/mark-256.png" alt="" width={104} height={104} className={s.closingIcon} />
        <h2 id="q-closing" className={s.closingTitle}>Pinto Notes is <em>free</em>.</h2>
        <p className={s.closingLine}>On Mac and iPhone. The code is open source, under the MIT license.</p>
        <div className={`${x.ctas} ${s.closingCtas}`}>
          <Download note={false} />
          <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
            Get it for iPhone
          </a>
          <a className={x.offMac} href="/download">Download for Mac</a>
        </div>
        <p className={s.fine}>Requires macOS 26 or iOS 26.</p>
      </section>
    </div>
  );
}
