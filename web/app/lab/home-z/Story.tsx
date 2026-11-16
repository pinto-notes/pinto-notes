"use client";

import { AIGlyph } from "@/lib/ai-glyphs";
import { APP_STORE_URL, SITE_URL } from "@/lib/site";
import { mailLink, sendLink } from "@/lib/platform";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import s from "./s.module.css";

// Study Z, round 20 (2026-11-16): real UI, one thing per section, room around each.
//
// Every product picture is a real Pinto screenshot, cropped or scaled, never drawn (the sources and crops
// are in ~/content-tools/projects/pinto-home-big3/r20/crops.sh; the files are /lab/z/real/*.webp). Each
// section is a heading, one short line and one picture. The page is one cream ground on one grid: a
// 12-column grid at most 1200 px wide, every heading, line and picture starting on its left edge, and
// one spacing scale in multiples of 8 (see s.module.css). A phone gets its own crops, cut to the part
// that matters so the words in them stay readable, and one picture per screen.
//
//   First screen  Kitchen redo on a Mac: what was decided, and the three lines ChatGPT added under
//                 "Before March", marked, with "ChatGPT changed 3 lines" (the page's one Undo is in that
//                 real line). In front, the iPhone's list: "Edited by ChatGPT" under Kitchen redo.
//                 `?hero=b` sets the window on the Share as Picture sea; `?hero=c` keeps the first screen
//                 to words and puts the window directly under it.
//   Notes         Sleep and memory, a note in its own window.
//   Whiteboards   The Product launch flowchart on its board, with the board's toolbar.
//   Apps          Morning habits, a note that is an app.
//   Your AI       The same board after ChatGPT added three steps, each outlined, named "ChatGPT".
//   Proof         The study, as two bars.
//   Close         "Pinto Notes is free." and the download.
//
// Nothing moves: no shows, no sticky sheets. Reduce Motion has nothing to stop.

export type HeroOption = "a" | "b" | "c";

const R = "/lab/z/real";

/* ───────────────────────── Pictures ───────────────────────── */

type Img = { src: string; w: number; h: number };
const PIC = {
  heroMac: { src: `${R}/hero-mac.webp`, w: 2000, h: 1560 },
  heroIphone: { src: `${R}/hero-iphone.webp`, w: 780, h: 1695 },
  heroPhone: { src: `${R}/hero-phone.webp`, w: 1288, h: 1300 },
  notesMac: { src: `${R}/notes-mac.webp`, w: 1280, h: 1250 },
  notesPhone: { src: `${R}/notes-phone.webp`, w: 1240, h: 1540 },
  boardMac: { src: `${R}/board-mac.webp`, w: 1617, h: 1630 },
  boardPhone: { src: `${R}/board-phone.webp`, w: 1100, h: 1120 },
  appMac: { src: `${R}/app-mac.webp`, w: 1280, h: 1440 },
  appPhone: { src: `${R}/app-phone.webp`, w: 600, h: 612 },
  aiMac: { src: `${R}/ai-mac.webp`, w: 2200, h: 1304 },
  aiPhone: { src: `${R}/ai-phone.webp`, w: 960, h: 800 },
} satisfies Record<string, Img>;

/** One screenshot: the Mac capture on wide screens, its phone crop on a phone (only one is fetched).
 *  `frame`: "window" for a whole Mac window (its own rounded corners), "cut" for a window cut short
 *  (its foot rounded like the window's corners), "crop" for a piece cut out of one. */
function Shot({ mac, phone, alt, frame, eager }: { mac: Img; phone: Img; alt: string; frame: "window" | "cut" | "crop"; eager?: boolean }) {
  return (
    <picture className={`${s.shot} ${frame === "crop" ? s.crop : s.window} ${frame === "cut" ? s.cut : ""}`}>
      <source media="(max-width: 760px)" srcSet={phone.src} width={phone.w} height={phone.h} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mac.src} width={mac.w} height={mac.h} alt={alt} decoding="async" loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} />
    </picture>
  );
}

const KITCHEN = "Kitchen redo, a note in Pinto Notes on a Mac. Decided: green tiles, handmade; oak shelves, no upper cabinets; keep the old table. Before March, three lines ChatGPT added, marked: order the oven, book the electrician, ask Sara about her tiler. At the foot: ChatGPT changed 3 lines, Undo, Review.";
const KITCHEN_PHONE = "Kitchen redo in Pinto Notes on an iPhone. Decided: green tiles, handmade; oak shelves, no upper cabinets; keep the old table. Before March, the lines ChatGPT added, marked, and at the foot: ChatGPT changed 4 lines.";

/* ───────────────────────── The first screen ───────────────────────── */

const Cta = () => (
  <div className={`${x.ctas} ${s.ctas}`}>
    <Download note={false} />
    <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
      Get it for iPhone
    </a>
    <a className={x.offMac} href="/download">Download for Mac</a>
    <p className={`${x.fine} ${x.offApple}`} data-off-apple>
      Pinto Notes is for iPhone and Mac.{" "}
      <a href={mailLink(SITE_URL)} onClick={(e) => sendLink(navigator, e, SITE_URL)}>Send myself the link</a>
    </p>
  </div>
);

function HeroWords() {
  return (
    <div className={s.heroText}>
      <h1 id="s-h1" className={s.h1}>The notebook for <em>you and your&nbsp;AI.</em></h1>
      <p className={s.lede}>Simple notes, whiteboards and apps. ChatGPT and Claude work in all three with you, and can read what you decided.</p>
      <Cta />
      <p className={s.fine}><span className={s.long}>Free on Mac and iPhone. Works with <span className={s.with}><AIGlyph name="openai" size={15} />ChatGPT</span> and <span className={s.with}><AIGlyph name="claude" size={15} color="#d97757" />Claude</span>.</span><span className={s.short}>Free on iPhone and Mac.</span></p>
    </div>
  );
}

/** a: the Mac window, large, running off the page's right edge, with the iPhone in front of its list. */
function HeroA() {
  return (
    <div className={s.heroArt} data-hero-art="a">
      <div className={s.heroWin}>
        <Shot mac={PIC.heroMac} phone={PIC.heroPhone} alt={KITCHEN} frame="window" eager />
        <div className={s.iphone} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PIC.heroIphone.src} width={PIC.heroIphone.w} height={PIC.heroIphone.h} alt="" loading="lazy" decoding="async" />
        </div>
      </div>
    </div>
  );
}

/** b: the same window on the Share as Picture sea, cropped close. */
function HeroB() {
  return (
    <div className={s.heroArt} data-hero-art="b">
      <div className={s.sea}>
        <Shot mac={PIC.heroMac} phone={PIC.heroPhone} alt={KITCHEN} frame="window" eager />
      </div>
    </div>
  );
}

/** c: words only in the first screen; the window directly under it, large. */
function HeroC() {
  return (
    <div className={s.heroBelow} data-hero-art="c">
      <Shot mac={PIC.heroMac} phone={PIC.heroPhone} alt={KITCHEN} frame="window" eager />
    </div>
  );
}

function Hero({ option }: { option: HeroOption }) {
  return (
    <section className={s.hero} data-hero={option} aria-labelledby="s-h1">
      <div className={s.heroGrid}>
        <HeroWords />
        {option === "a" && <HeroA />}
        {option === "b" && <HeroB />}
      </div>
      {option === "c" && <HeroC />}
    </section>
  );
}

/* ───────────────────────── A section: a heading, one line, one picture ───────────────────────── */

function Section({ id, title, long, short, wide, children }: { id: string; title: React.ReactNode; long: string; short: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <section id={`s-${id}`} className={`${s.section} ${wide ? s.wide : s.side}`} aria-labelledby={`s-${id}-h`}>
      <div className={s.words}>
        <h2 id={`s-${id}-h`} className={s.h2}>{title}</h2>
        <p className={s.say}><span className={s.long}>{long}</span><span className={s.short}>{short}</span></p>
      </div>
      <div className={s.pic}>{children}</div>
    </section>
  );
}

/* ───────────────────────── The proof ───────────────────────── */

/** The study (see /blog/ai-memory-with-notes): Claude Haiku 5.5 both times, LoCoMo, 1,540 questions
 *  about months of earlier chats, asked in a new chat; with nothing else it answered 18% right; with
 *  Pinto Notes connected, where after each chat it had kept its own notes, 82.5%. */
const STUDY = [
  { who: "Claude in a new chat", had: "It had only the new chat.", v: 18, shown: "18%" },
  { who: "Claude with Pinto", had: "It could also read the notes it kept in Pinto after each chat.", v: 82.5, shown: "82.5%" },
] as const;

function Proof() {
  return (
    <section id="s-proof" className={`${s.section} ${s.proof}`} aria-labelledby="s-proof-h">
      <div className={s.words}>
        <h2 id="s-proof-h" className={s.h2}>Claude got far more right when it could read the notes.</h2>
        <p className={s.say}>1,540 questions about months of earlier chats. Same model both times.</p>
      </div>
      <div className={s.study}>
        <p className={s.measure}>Questions answered correctly</p>
        <dl className={s.bars}>
          {STUDY.map((r, i) => (
            <div key={r.who} className={s.row} data-pinto={i === 1 || undefined}>
              <dt className={s.who}><b>{r.who}</b><span>{r.had}</span></dt>
              <dd className={s.bar} style={{ "--v": r.v / 100 } as React.CSSProperties}>
                <i className={s.fill} aria-hidden="true" />
                <span className={s.num}>{r.shown}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className={s.foot}>
          Claude Haiku 5.5 on the LoCoMo test. Run by the maker of Pinto Notes; the code and every answer are public.{" "}
          <a href="/blog/ai-memory-with-notes">Read the study<span aria-hidden="true"> →</span></a>
        </p>
      </div>
    </section>
  );
}

/* ───────────────────────── The close ───────────────────────── */

function Close() {
  return (
    <section id="s-free" className={`${s.section} ${s.close}`} aria-labelledby="s-free-h">
      <h2 id="s-free-h" className={s.closeTitle}>Pinto Notes is <em>free.</em></h2>
      <Cta />
      <p className={s.fine}>Requires macOS 26 or iOS 26.</p>
    </section>
  );
}

export function Story({ className, hero }: { className: string; hero: HeroOption }) {
  return (
    <div className={`${s.page} ${className}`}>
      <Hero option={hero} />
      <Section id="write" title="Write notes." long="They feel like Apple Notes, on Mac and iPhone, and you can bring yours over." short="Like Apple Notes, on Mac and iPhone. Bring yours over.">
        <Shot mac={PIC.notesMac} phone={PIC.notesPhone} frame="cut" alt="Sleep and memory, a note in Pinto Notes: a photo of a sketchbook page, the main idea with links to Walker 2017 and Diekelmann and Born, and two open questions." />
      </Section>
      <Section id="draw" title="Draw on whiteboards." long="Sketch a plan beside your notes, by hand or from a template." short="Sketch a plan beside your notes.">
        <Shot mac={PIC.boardMac} phone={PIC.boardPhone} frame="crop" alt="A whiteboard in Pinto Notes, Product launch: Start, Do the thing, Did it work? No leads to Fix it and back; Yes leads to Done." />
      </Section>
      <Section id="build" title="Build apps." long="A note can be a small app. Pick a template, or describe one and your AI makes it." short="A note can be a small app. Describe one, and your AI makes it.">
        <Shot mac={PIC.appMac} phone={PIC.appPhone} frame="window" alt="Morning habits, a note that is an app: 78% this week, 18 of 23 done, and each habit's week as dots with its streak." />
      </Section>
      <Section id="ai" wide title={<>Your AI, in all&nbsp;three.</>} long="Connect ChatGPT or Claude. Ask in the chat, and it works in your notes, whiteboards and apps with you." short="Connect ChatGPT or Claude. It works in all three with you.">
        <Shot mac={PIC.aiMac} phone={PIC.aiPhone} frame="crop" alt="The Product launch whiteboard after ChatGPT added three steps beside the flowchart: Request, Manager review and Approved, each outlined, with a ChatGPT tag." />
      </Section>
      <Proof />
      <Close />
    </div>
  );
}
