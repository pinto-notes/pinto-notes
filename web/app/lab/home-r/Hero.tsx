import { AIGlyph } from "@/lib/ai-glyphs";
import { APP_STORE_URL, SITE_URL } from "@/lib/site";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { Note, Stroke } from "./Pen";
import { MiniBoard } from "./Whiteboard";
import r from "./r.module.css";
import { MailLink } from "./MailLink";

// The first screen: the headline on the left, and on the right the three things themselves, laid on
// the page like objects on a desk. A note (her Tomorrow list, one line added by ChatGPT), a whiteboard
// sketch with Claude's cursor on it, and a habit tracker app. Each is labelled once, by hand. The
// whole picture is drawn in em (1em = 1/62 of its width), so it scales as one piece down to a phone.

const Tick = () => <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.4l2.6 2.6L12 5.4" /></svg>;

function HeroNote() {
  const items: [string, boolean, boolean?][] = [["Run, 5 km", true], ["Call the dentist", false], ["Lisbon flights", false, true], ["Dry cleaning", false]];
  return (
    <div className={`${r.obj} ${r.hNote}`}>
      <p className={r.hDate}>Sunday, 21:40</p>
      <p className={r.hTitle}>Tomorrow</p>
      <ul className={r.hList}>
        {items.map(([t, on, ai]) => (
          <li key={t} data-on={on || undefined} data-ai={ai || undefined}>
            <i className={r.box}>{on && <Tick />}</i><span>{t}</span>
            {ai && <em className={r.hAi}><AIGlyph name="openai" size={11} /><span>ChatGPT</span></em>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroApp() {
  const rows: [string, number[]][] = [["Walk", [1, 1, 0, 1, 1, 1, 0]], ["Read", [1, 0, 1, 1, 0, 1, 0]], ["Gym", [0, 1, 0, 1, 0, 1, 0]]];
  return (
    <div className={`${r.obj} ${r.hApp}`}>
      <p className={r.hAppTop}><b>Habits</b><span className={r.appTag}>App</span></p>
      <div className={r.hGrid}>
        {rows.map(([t, d]) => (
          <div key={t} className={r.hRow}>
            <span>{t}</span>
            {d.map((v, k) => <i key={k} data-on={v || undefined} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className={r.hero} aria-labelledby="r-h1">
      <div className={r.heroWords}>
        <h1 id="r-h1" className={r.h1}>
          The notebook for <span className={r.h1you}>you and <span className={r.under}>your AI.<Stroke className={r.h1line} w={300} h={24} i={0} width={4}
            d="M4 15 C 60 8, 140 6, 210 9 S 280 14, 296 10" /></span></span>
        </h1>
        <p className={r.lede}>Write notes, draw on whiteboards and build apps. ChatGPT and Claude can read them, and help.</p>
        <div className={`${x.ctas} ${r.ctas}`}>
          <Download note={false} />
          <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
            Get it for iPhone
          </a>
          <a className={x.offMac} href="/download">Download for Mac</a>
          <p className={`${x.fine} ${x.offApple}`} data-off-apple>
            Pinto Notes is for iPhone and Mac. <MailLink url={SITE_URL}>Send myself the link</MailLink>
          </p>
        </div>
        <p className={r.fine}>Free on Mac and iPhone. Works with ChatGPT and Claude.</p>
      </div>

      <div className={r.desk} role="img"
        aria-label="Three things in Pinto Notes: a note called Tomorrow with a checklist, where ChatGPT added Lisbon flights; a whiteboard sketch, Idea to Draft to Publish, with Claude's cursor on it; and a habit tracker app.">
        <div className={r.deskIn}>
          <div className={`${r.obj} ${r.hBoard}`}><MiniBoard /></div>
          <HeroApp />
          <HeroNote />
          <Note className={r.lNote} i={1}>a note</Note>
          <Stroke className={r.aNote} w={60} h={50} i={1} d={["M6 6 C 20 10, 40 22, 48 40", "M36 38 L 49 42 L 50 28"]} />
          <Note className={r.lBoard} i={2}>a whiteboard</Note>
          <Stroke className={r.aBoard} w={70} h={46} i={2} d={["M64 8 C 50 10, 30 18, 16 34", "M14 20 L 14 37 L 28 38"]} />
          <Note className={r.lApp} i={3}>an app</Note>
          <Stroke className={r.aApp} w={70} h={46} i={3} d={["M64 36 C 50 34, 30 26, 14 10", "M12 24 L 12 8 L 27 9"]} />
        </div>
      </div>
    </section>
  );
}
