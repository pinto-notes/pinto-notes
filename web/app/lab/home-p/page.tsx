import type { Metadata } from "next";
import { AIGlyph } from "@/lib/ai-glyphs";
import { APP_STORE_URL } from "@/lib/site";
import { COVERS, inkOn } from "@/lib/template-covers";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { OffApple } from "./OffApple";
import { DrawWindow, HabitWindow, HeroWindow, Devices, SaidDone, WriteWindow } from "./Pictures";
import s from "./p.module.css";

const GITHUB = "https://github.com/pinto-notes/pinto-notes";

export const metadata: Metadata = {
  title: "Pinto Notes: the notebook for you and your AI",
  description: "Write notes, draw on whiteboards and build small apps, with ChatGPT, Claude, Claude Code or Codex. Feels like Apple Notes. Free on Mac and iPhone.",
};

// Study P, "the Apple product page" (2026-11-14, round 4). A calm centred first screen with one
// picture, then one section per feature, each a big title, a line or two and a near full-width
// picture of the real UI. Then the AI, Mac and iPhone, the small features, the price and the download.

const AIS = [
  { name: "ChatGPT", glyph: "openai" },
  { name: "Claude", glyph: "claude" },
  { name: "Claude Code", glyph: "claude" },
  { name: "Codex", glyph: "openai" },
] as const;

const TEMPLATES = [
  { slug: "habit-tracker", title: "Habit tracker" },
  { slug: "budget-log", title: "Budget and expenses" },
  { slug: "trip-plan", title: "Trip plan" },
  { slug: "study-flashcards", title: "Flashcards" },
  { slug: "workout-log", title: "Workout log" },
];


const MORE: { title: string; say: string; icon: string }[] = [
  { title: "The / menu", say: "Type / for headings, checklists, tables and more.", icon: "M15 4L9 20" },
  { title: "Templates", say: "A habit tracker, a budget or a trip plan, ready to use.", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
  { title: "Bring your notes", say: "From Apple Notes, Obsidian, Bear, Evernote and Keep.", icon: "M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" },
  { title: "Tables and checklists", say: "Tick a list, fill in a table, link one note to another.", icon: "M4 6.5l1.6 1.6L8.5 5M4 15.5l1.6 1.6 2.9-3.1M11.5 7h8.5M11.5 16h8.5" },
  { title: "Lock a note", say: "A separate password for the private ones.", icon: "M6.5 11h11a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V12a1 1 0 0 1 1-1zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" },
  { title: "Version history", say: "Every change keeps the version before it.", icon: "M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4M12 8v4.5l3 2" },
  { title: "Recently Deleted", say: "A deleted note waits there for 30 days.", icon: "M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" },
  { title: "Encrypted", say: "Encrypted on your device before it syncs.", icon: "M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6zM9 12l2 2 4-4.5" },
  { title: "Open source", say: "Anyone can read the code on GitHub.", icon: "M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15" },
];

function Ctas() {
  return (
    <div className={`${x.ctas} ${s.ctas}`}>
      <Download note={false} />
      <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
        Get it for iPhone
      </a>
      <a className={x.offMac} href="/download">Download for Mac</a>
      <OffApple />
    </div>
  );
}

export default function Page() {
  return (
    <div className={s.main}>
      <section className={s.hero} aria-labelledby="p-h1">
        <h1 id="p-h1" className={s.h1}>The notebook for you and your AI.</h1>
        <p className={s.sub}>Write notes, draw on whiteboards and build small apps, with your AI.</p>
        <Ctas />
        <p className={s.fine}>Free on Mac and iPhone. Works with ChatGPT and Claude.</p>
        <div className={s.frame}>
          <img className={s.art} src="/home-v5/frontier/maya-paper.webp" alt="" width={2000} height={1126} decoding="async" fetchPriority="high" />
          <HeroWindow />
        </div>
      </section>

      <section className={s.sec} aria-labelledby="p-write">
        <h2 id="p-write" className={s.h2}>Write notes.</h2>
        <p className={s.lede}>They feel like Apple Notes, on Mac and iPhone. Bring your Apple Notes over in one go.</p>
        <div className={s.panel}><WriteWindow /></div>
      </section>

      <section className={s.sec} aria-labelledby="p-draw">
        <h2 id="p-draw" className={s.h2}>Draw on whiteboards.</h2>
        <p className={s.lede}>A whiteboard sits next to your notes. Your AI can read it and draw on it.</p>
        <div className={`${s.panel} ${s.panelDraw}`}><DrawWindow /></div>
      </section>

      <section className={s.sec} aria-labelledby="p-build">
        <h2 id="p-build" className={s.h2}>Build apps.</h2>
        <p className={s.lede}>Small apps in a note, like a habit tracker or a budget. Start from a template, or ask your AI to make one.</p>
        <div className={`${s.panel} ${s.panelBuild}`}><HabitWindow /></div>
        <ul className={s.covers}>
          {TEMPLATES.map((t) => (
            <li key={t.slug}>
              <a href={`/templates/${t.slug}`} className={s.cover} data-ink={inkOn(COVERS[t.slug].ground)} style={{ "--ground": COVERS[t.slug].ground } as React.CSSProperties}>
                <img src={`/templates/covers/${t.slug}.webp`} alt="" width={800} height={800} loading="lazy" decoding="async" />
                <span>{t.title}</span>
              </a>
            </li>
          ))}
        </ul>
        <a className={s.more} href="/templates">See all templates <span aria-hidden="true">›</span></a>
      </section>

      <section className={s.sec} aria-labelledby="p-ai">
        <h2 id="p-ai" className={s.h2}>Your AI, in all three.</h2>
        <p className={s.lede}>Every chat starts from zero. Connect ChatGPT, Claude, Claude Code or Codex, and it works from your notes. Marks show what it changed.</p>
        <ul className={s.aiRow}>
          {AIS.map((a) => (
            <li key={a.name}><span className={s.aiLogo} data-ai={a.glyph}><AIGlyph name={a.glyph} size={24} /></span>{a.name}</li>
          ))}
        </ul>
        <div className={`${s.panel} ${s.panelAi}`}><SaidDone /></div>
        <div className={s.study}>
          <p className={s.nums}>
            <span className={s.num} data-dim=""><b>18%</b><small>without notes</small></span>
            <span className={s.num}><b>82.5%</b><small>with Pinto Notes</small></span>
          </p>
          <p className={s.studyLine}>We asked Claude, in a new chat, about months of past chats. It got 18% right on its own, and 82.5% with Pinto Notes connected. <a className={s.inline} href="/blog/ai-memory-with-notes">Read the study</a></p>
        </div>
      </section>

      <section className={s.sec} aria-labelledby="p-dev">
        <h2 id="p-dev" className={s.h2}>On your Mac and iPhone.</h2>
        <p className={s.lede}>Your notes stay in sync, and work offline.</p>
        <div className={`${s.panel} ${s.panelDev}`}><Devices /></div>
      </section>

      <section className={s.sec} aria-labelledby="p-more">
        <h2 id="p-more" className={s.h2}>And so much more.</h2>
        <ul className={s.grid}>
          {MORE.map((m) => (
            <li key={m.title}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={m.icon} /></svg>
              <b>{m.title}</b>
              <span>{m.title === "Open source" ? <>Anyone can read the code <a className={s.inline} href={GITHUB}>on GitHub</a>.</> : m.say}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${s.sec} ${s.free}`} aria-labelledby="p-free">
        <h2 id="p-free" className={s.h2}>Pinto Notes is free.</h2>
        <p className={s.lede}>On Mac and iPhone, with all three: notes, whiteboards and apps.</p>
      </section>

      <section className={s.closing} aria-labelledby="p-closing">
        <img src="/mark-256.png" alt="" width={112} height={112} className={s.icon} />
        <h2 id="p-closing" className={s.closeTitle}>Start your notebook.</h2>
        <Ctas />
        <p className={s.fine}>Requires macOS 26 or iOS 26.</p>
      </section>
    </div>
  );
}
