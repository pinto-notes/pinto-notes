import { APP_STORE_URL } from "@/lib/site";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { Line } from "./Line";
import { Cursor, Tick } from "./Parts";
import e from "./e.module.css";

// The ending, after the story: short, and still in the story's world. Who wrote what (every line of
// the note says who, and Undo works), the note on a Mac and an iPhone, then the download with all
// three cursors at it. Only true claims, from the live page's list (_home/Home.tsx EXTRAS).

export function Ctas({ fine = true }: { fine?: boolean }) {
  return (
    <>
      <div className={x.ctas}>
        <Download note={false} />
        <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
          Get it for iPhone
        </a>
        <a className={x.offMac} href="/download">Download for Mac</a>
      </div>
      {fine && <p className={`${e.fine} pi-apple`}>Free on Mac and iPhone. Works with ChatGPT and Claude.</p>}
    </>
  );
}

const FACTS = [
  { b: "Private.", say: "Encrypted on your device before it syncs." },
  { b: "Lock a note.", say: "A separate password for the private ones." },
  { b: "Open source.", say: "Anyone can check the code." },
];

const SIDEBAR = ["Lisbon half, 17 May", "Training", "Groceries", "Reading list", "Flat viewing notes"];
const CHECK = ["Sign up for the race", "Buy running shoes", "Make a training plan", "Book flights to Lisbon", "Find a hotel near the start"];

function NoteBody({ small }: { small?: boolean }) {
  return (
    <div className={`${e.nb} ${small ? e.nbS : ""}`}>
      <p className={e.nbTitle}>Lisbon half, 17 May</p>
      <p className={e.nbText}>Decided: four runs a week, long run on Sundays.</p>
      <p className={e.nbText}>Last long run on 3 May, then two easy weeks.</p>
      <ul className={e.nbList}>
        {CHECK.map((t, i) => <li key={t}><i data-on={i < 4 || undefined}>{i < 4 && <Tick />}</i>{t}</li>)}
      </ul>
    </div>
  );
}

export function Ending({ cta }: { cta: React.ReactNode }) {
  return (
    <div className={e.end}>
      {/* Proof of control: the same note, each line marked with who wrote it. */}
      <section className={e.ctl} aria-labelledby="t-ctl">
        <div className={e.ctlText}>
          <h2 id="t-ctl" className={e.h2}>You stay in <em>control.</em></h2>
          <p className={e.say}>Every change says who made it: you, or which AI. Undo takes it back.</p>
          <ul className={e.facts}>
            {FACTS.map((f) => <li key={f.b}><b>{f.b}</b> {f.say}</li>)}
          </ul>
        </div>
        <div className={e.who}>
          <p className={e.whoTitle}>Lisbon half, 17 May</p>
          <Line who="you" text="Decided: four runs a week, long run on Sundays." />
          <Line who="gpt" text="Last long run on 3 May, then two easy weeks." undo />
          <Line who="claude" text="Find a hotel near the start." undo />
          <Line who="gpt" text="Ticked “Book flights to Lisbon”." undo />
        </div>
      </section>

      {/* Mac and iPhone, and bringing your notes. */}
      <section className={e.dev} aria-labelledby="t-dev">
        <div className={e.devPic} aria-hidden="true">
          <div className={e.mac}>
            <div className={e.macBar}><i /><i /><i /></div>
            <div className={e.macBody}>
              <ul className={e.side}>{SIDEBAR.map((t, i) => <li key={t} data-on={i === 0 || undefined}><b>{t}</b><small>{["09:41", "08:10", "Yesterday", "Monday", "12 April"][i]}</small></li>)}</ul>
              <NoteBody />
            </div>
          </div>
          <div className={e.phone}><div className={e.phoneIn}><div className={e.island} /><NoteBody small /></div></div>
        </div>
        <div className={e.devText}>
          <h2 id="t-dev" className={e.h2}>On your Mac and <em>iPhone.</em></h2>
          <p className={e.say}>Always in sync, and it works offline. Bring your notes from Apple Notes, Obsidian, Bear, Evernote and Keep.</p>
        </div>
      </section>

      {/* The download: you, ChatGPT and Claude, all at the button. */}
      <section className={e.dl} aria-labelledby="t-dl">
        <img className={e.icon} src="/mark-256.png" alt="" width={128} height={128} />
        <h2 id="t-dl" className={e.big}>Pinto Notes<br /><em>is free.</em></h2>
        <p className={e.say}>On Mac and iPhone, with ChatGPT and Claude. Open source under the MIT license. Requires macOS 26 or iOS 26.</p>
        <div className={e.dlCta}>
          {cta}
          <span className={e.cY}><Cursor who="you" k="endYou" /></span>
          <span className={e.cG}><Cursor who="gpt" k="endGpt" /></span>
          <span className={e.cC}><Cursor who="claude" k="endClaude" /></span>
        </div>
      </section>
    </div>
  );
}

