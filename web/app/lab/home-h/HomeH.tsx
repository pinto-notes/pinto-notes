import { APP_STORE_URL } from "@/lib/site";
import { AIGlyph } from "@/lib/ai-glyphs";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { Build } from "./Build";
import { Draw } from "./Draw";
import h from "./h.module.css";

// Study H, "Write. Draw. Build.": the page is three words. The first screen sets all three as the
// headline, each a link down to its section; each section is the word again, one sentence, and a
// big picture of the real thing, wider than the words. Then one statement: your AI does all three.

const WORDS = [
  { id: "write", word: "Write", line: "Notes that feel like Apple Notes." },
  { id: "draw", word: "Draw", line: "Whiteboards your AI can read and draw on." },
  { id: "build", word: "Build", line: "Small apps, from a template or a sentence." },
];

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

function Ctas() {
  return (
    <div className={`${x.ctas} ${h.cta}`}>
      <Download note={false} />
      <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
        Get it for iPhone
      </a>
      <a className={x.offMac} href="/download">Download for Mac</a>
    </div>
  );
}

/// A word set as a title: the word, then the brand's orange full stop.
const Word = ({ children }: { children: string }) => <>{children}<span className={h.dot}>.</span></>;

export function HomeH() {
  return (
    <div className={h.page}>
      <section className={h.hero} aria-labelledby="h-title">
        <h1 id="h-title" className={h.srOnly}>Write. Draw. Build. Pinto Notes, with your AI.</h1>
        <ol className={h.index}>
          {WORDS.map((w, i) => (
            <li key={w.id} className="rise" style={rise(i)}>
              <a href={`#${w.id}`} className={h.entry}>
                <span className={h.word} aria-hidden="true"><Word>{w.word}</Word></span>
                <span className={h.line}>{w.line}<Arrow /></span>
              </a>
            </li>
          ))}
        </ol>
        <div className={`${h.heroFoot} rise`} style={rise(3)}>
          <p className={h.lede}>One notebook for all three, and ChatGPT and Claude work in it with you.</p>
          <Ctas />
          <p className={`${h.fine} pi-apple pi-not-ios`}>Free for Mac and iPhone. Open source.</p>
        </div>
      </section>

      <section id="write" className={h.part} aria-labelledby="write-t">
        <header className={h.head}>
          <h2 id="write-t" className={h.big}><Word>Write</Word></h2>
          <p className={h.say}><b>It feels like Apple Notes,</b> and your Apple Notes come with you.</p>
        </header>
        <figure className={`${h.frame} ${h.writeShot}`}>
          <img src="/lab/big3/layout-two-columns-main.webp" width={2880} height={1800} loading="lazy"
            alt="Pinto Notes on a Mac: the notes list on the left, and a Groceries note with a checklist open beside it." />
        </figure>
      </section>

      <section id="draw" className={h.part} aria-labelledby="draw-t">
        <header className={h.head}>
          <h2 id="draw-t" className={h.big}><Word>Draw</Word></h2>
          <p className={h.say}><b>A whiteboard sits next to your notes,</b> and your AI can read it and draw on it.</p>
        </header>
        <Draw />
      </section>

      <section id="build" className={h.part} aria-labelledby="build-t">
        <header className={h.head}>
          <h2 id="build-t" className={h.big}><Word>Build</Word></h2>
          <p className={h.say}><b>Pick a template or describe what you need,</b> and a note becomes a small app any AI can update.</p>
        </header>
        <Build />
      </section>

      <section className={h.close} aria-labelledby="close-t">
        <h2 id="close-t" className={h.closeTitle}>Your AI does all three with you.</h2>
        <ul className={h.ais} aria-label="Works with">
          <li><AIGlyph name="openai" size={30} />ChatGPT</li>
          <li><AIGlyph name="claude" size={30} />Claude</li>
          <li><AIGlyph name="claude" size={30} />Claude Code</li>
          <li><AIGlyph name="openai" size={30} />Codex</li>
        </ul>
        <p className={h.study}>Asked about months of past chats in a new chat, Claude got 18% right. With Pinto connected, 82.5%. <a href="/blog/ai-memory-with-notes">Read the study</a></p>
        <Ctas />
        <p className={`${h.fine} pi-apple pi-not-ios`}>Requires macOS 26 or iOS 26.</p>
      </section>
    </div>
  );
}

const Arrow = () => <svg className={h.arrow} viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v10M3.5 8.5 8 13l4.5-4.5" /></svg>;
