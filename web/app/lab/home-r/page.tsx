import type { Metadata } from "next";
import { AIGlyph } from "@/lib/ai-glyphs";
import { APP_STORE_URL } from "@/lib/site";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { board, display, pen } from "./fonts";
import { Habits } from "./Habits";
import { Hero } from "./Hero";
import { Changed, Page as NotePage } from "./Notes";
import { Note, Stroke } from "./Pen";
import { Reveal, StillMark } from "./Reveal";
import { Whiteboard } from "./Whiteboard";
import r from "./r.module.css";

export const metadata: Metadata = {
  title: "Pinto Notes: the notebook for you and your AI",
  description: "Write notes, draw on whiteboards and build apps, with your AI. Feels like Apple Notes, on Mac and iPhone. Works with ChatGPT and Claude. Free.",
};

// Study R, "the things themselves" (round 5, 2026-11-14). No app windows. Each section is the thing,
// big, on the page: a note you can tick, a whiteboard that draws itself as you scroll, a habit
// tracker you can click, and a line said to ChatGPT that changes the note. A warm pen writes in the
// margins. Every section has its own layout: split, page bleeding off the edge, full-bleed board,
// giant title over a wide app, a spoken line across the page, a ticked list, and the download.

const SAID = "We booked the Memmo in Príncipe Real, 12 to 15 May. Put it in my Lisbon note.";

const EXTRAS = [
  ["Feels like Apple Notes", "Checklists, tables, folders and links between notes."],
  ["Bring your notes", "From Apple Notes, Obsidian, Bear, Evernote and Keep."],
  ["Mac and iPhone", "Always in sync, and it works offline."],
  ["Private", "Encrypted on your device before it syncs."],
  ["Every change says who", "You or which AI. Undo takes it back."],
  ["Lock a note", "A separate password for the private ones."],
  ["Open source", "Anyone can check the code."],
];

const Tick = () => <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.4l2.6 2.6L12 5.4" /></svg>;
const Arrow = () => <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" /></svg>;

export default function Page() {
  return (
    <div className={`${r.main} ${display.variable} ${pen.variable} ${board.variable}`}>
      <StillMark />
      <Hero />

      {/* Write: the words on the left, the page itself running off the right edge. */}
      <Reveal as="section" className={r.write} aria-labelledby="r-write">
        <div className={r.writeWords}>
          <h2 id="r-write" className={r.h2}>Write notes.</h2>
          <p className={r.body}>They feel like Apple Notes, on your Mac and iPhone. Bring yours from Apple Notes, Obsidian, Bear and more.</p>
        </div>
        <NotePage />
      </Reveal>

      {/* Draw: the whole width is the whiteboard. */}
      <Reveal as="section" className={r.draw} aria-labelledby="r-draw">
        <div className={r.drawWords}>
          <h2 id="r-draw" className={r.h2}>Draw on whiteboards.</h2>
          <p className={r.body}>Sketch it out next to your notes. Your AI can read the board, and draw on it with you.</p>
        </div>
        <div className={r.drawStage}>
          <Whiteboard />
          <Note className={r.drawSay} i={1}>Claude drew this part</Note>
          <Stroke className={r.drawArrow} w={110} h={80} i={1} d={["M8 10 C 40 6, 80 20, 96 64", "M84 56 L 97 68 L 104 52"]} />
        </div>
      </Reveal>

      {/* Build: a giant title, and the app wide under it with the pen around it. */}
      <Reveal as="section" className={r.build} aria-labelledby="r-build">
        <div className={r.buildTop}>
          <h2 id="r-build" className={`${r.h2} ${r.giant}`}>Build apps.</h2>
          <div className={r.buildSide}>
            <p className={r.body}>A note can be a small app. Start from a template, or tell your AI what you want and it builds it.</p>
            <a className={r.link} href="/templates">See the templates<Arrow /></a>
          </div>
        </div>
        <div className={r.buildStage}>
          <Habits />
          <Note className={r.buildSay} i={1}>This is a note. Click a day.</Note>
          <Stroke className={r.buildArrow} w={90} h={90} i={1} d={["M10 8 C 14 40, 40 66, 76 74", "M62 62 L 78 75 L 62 84"]} />
        </div>
      </Reveal>

      {/* Your AI: the line you say, as big as the page, and what it does to the note. */}
      <Reveal as="section" className={r.ai} aria-labelledby="r-ai" threshold={0.25}>
        <figure className={r.said}>
          <figcaption className={r.saidWho}><AIGlyph name="openai" size={22} />You, to ChatGPT</figcaption>
          <blockquote className={r.quote}>
            <p>&ldquo;{SAID.split(" ").map((w, i) => <span key={i} style={{ "--w": i } as React.CSSProperties}>{w} </span>)}&rdquo;</p>
          </blockquote>
        </figure>
        <div className={r.aiStage}>
          <Stroke className={r.aiArrow} w={160} h={170} i={1} width={3} d={["M20 8 C 0 70, 40 130, 130 150", "M110 132 L 132 151 L 106 162"]} />
          <div className={r.aiNote}>
            <Changed />
            <Note className={r.aiSay} i={3}>It signs its work. Undo if you like.</Note>
          </div>
          <div className={r.aiWords}>
            <h2 id="r-ai" className={r.h2}>Your AI, in all three.</h2>
            <p className={r.body}>Connect ChatGPT, Claude, Claude Code or Codex. Every chat starts knowing your notes, and can change them.</p>
          </div>
        </div>
        <p className={r.study}>
          <Note className={r.studyPen} i={4}>
            Without notes, a new chat got 18% right. With Pinto, <span className={r.circled}>82.5%</span>
          </Note>
          <a className={r.link} href="/blog/ai-memory-with-notes">Read the memory study<Arrow /></a>
        </p>
      </Reveal>

      {/* Everything else: a checklist, already ticked. */}
      <Reveal as="section" className={r.more} aria-labelledby="r-more">
        <h2 id="r-more" className={r.h2}>And the rest, ticked.</h2>
        <ul className={r.moreList}>
          {EXTRAS.map(([t, s], i) => (
            <li key={t} style={{ "--i": i } as React.CSSProperties}>
              <i className={r.box} data-on=""><Tick /></i>
              <p><b>{t}</b> <span>{s}</span></p>
            </li>
          ))}
        </ul>
      </Reveal>

      {/* The end: free, and the download. */}
      <Reveal as="section" className={r.end} aria-labelledby="r-end">
        <div className={r.endWords}>
          <img src="/mark-256.png" alt="" width={96} height={96} className={r.endIcon} />
          <h2 id="r-end" className={`${r.h2} ${r.endTitle}`}>Free on Mac and iPhone.</h2>
          <p className={r.body}>Works with ChatGPT and Claude. Open source under the MIT license.</p>
          <div className={`${x.ctas} ${r.endCtas}`}>
            <Download note={false} />
            <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
              Get it for iPhone
            </a>
            <a className={x.offMac} href="/download">Download for Mac</a>
          </div>
          <p className={r.fine}>Requires macOS 26 or iOS 26.</p>
        </div>
        {/* A new note, empty, waiting. */}
        <div className={r.blank} aria-hidden="true">
          <p className={r.blankTitle}><i className={r.blankCaret} />Title</p>

          <Note className={r.endSay} i={1}>Start with one note.</Note>
          <Stroke className={r.endArrow} w={90} h={70} i={1} d={["M84 60 C 60 64, 26 50, 14 16", "M8 32 L 13 14 L 29 22"]} />
        </div>
      </Reveal>
    </div>
  );
}
