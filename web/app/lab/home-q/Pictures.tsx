import { AIGlyph } from "@/lib/ai-glyphs";
import { Board } from "./Board";
import s from "./pic.module.css";

// Study Q's product pictures. The Mac windows are rebuilt in HTML from the app's captures
// (public/lab/big3), as study O did, so they stay sharp at section size; the same words, the same
// look. On a phone the list column goes and the note fills the window, as the iPhone app shows one
// note at a time. The Mac and iPhone picture uses a real lossless capture for the Mac.

const Chip = ({ ai, name }: { ai: "openai" | "claude"; name: string }) => (
  <em className={s.chip} data-ai={ai}><AIGlyph name={ai} size={10} />{name}</em>
);
const Tick = () => <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 6.2l2 2 4-4.4" /></svg>;

/** The window's toolbar: traffic lights, then the title, as in the captures. */
function Bar({ title, back = false }: { title: string; back?: boolean }) {
  return (
    <div className={s.bar} aria-hidden="true">
      <span className={s.lights}><i /><i /><i /></span>
      {!back && <svg className={s.barIcon} viewBox="0 0 20 20"><rect x="2.5" y="4" width="15" height="12" rx="2.5" /><path d="M7.5 4v12" /></svg>}
      {back && <span className={s.barBack}><svg viewBox="0 0 20 20"><path d="M12 5l-5 5 5 5" /></svg></span>}
      <b>{title}</b>
    </div>
  );
}

type Row = { t: string; time: string; sub: string; app?: boolean };
const PINNED: Row[] = [
  { t: "Habit tracker", time: "8:51 PM", sub: "Small things, most days.", app: true },
  { t: "Groceries", time: "8:41 PM", sub: "For the weekend, and Sunday din…" },
];
const TODAY: Row[] = [
  { t: "Hotel booking", time: "8:51 PM", sub: "Memmo Príncipe Real, 12–15 May" },
  { t: "October budget", time: "8:49 PM", sub: "Spending for the month.", app: true },
  { t: "Workout log", time: "8:20 PM", sub: "A row per session.", app: true },
  { t: "Reading stack", time: "7:51 PM", sub: "Books for the autumn.", app: true },
  { t: "Standup notes", time: "5:51 PM", sub: "Shipped the sync fix." },
];

function List({ on }: { on: string }) {
  const row = (r: Row) => (
    <li key={r.t} data-on={r.t === on || undefined}>
      <b>{r.t}{r.app && <span className={s.appTag}>App</span>}</b>
      <small>{r.time} · {r.sub}</small>
    </li>
  );
  return (
    <div className={s.list} aria-hidden="true">
      <p>Pinned</p>
      <ul>{PINNED.map(row)}</ul>
      <p>Today</p>
      <ul>{TODAY.map(row)}</ul>
    </div>
  );
}

/** Write: the Groceries note, as in layout-two-columns-main. */
export function WriteWin() {
  const items: [string, boolean][] = [
    ["Oat milk", false], ["Lemons", false], ["Coffee beans", false], ["Fresh basil", false], ["Burrata", false],
    ["Cherry tomatoes", false], ["Olive oil", false], ["Dark chocolate", false], ["Sourdough", true], ["Eggs", true], ["Spinach", true],
  ];
  return (
    <div className={s.win}>
      <Bar title="Notes" />
      <div className={s.cols}>
        <List on="Groceries" />
        <div className={s.note} role="img" aria-label="Pinto Notes on a Mac: the Groceries note, a checklist with three items ticked.">
          <p className={s.noteTitle}>Groceries</p>
          <p className={s.noteText}>For the weekend, and Sunday dinner with Sara and Jonas.</p>
          <ul className={s.check}>
            {items.map(([t, on], i) => <li key={t} data-on={on || undefined}><i data-step={on || undefined} style={on ? ({ "--s": i - 8 } as React.CSSProperties) : undefined}>{on && <Tick />}</i>{t}</li>)}
          </ul>
          <p className={s.mention}>Mentioned in 1 note ›</p>
        </div>
      </div>
    </div>
  );
}

/** Draw: the Publishing flow whiteboard, drawing itself. */
export function DrawWin() {
  const tools = [
    "M7 15l-3-3m0 0l3-3m-3 3h9a3 3 0 0 0 0-6", // undo
    "M4 3l11 6-5 1.5L8 16z", // select
    "M4 16L16 4", // line
    "M3.5 5.5h13v9h-13z", // box
    "M10 3.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13z", // ellipse
    "M10 3l7 7-7 7-7-7z", // diamond
    "M4 16L16 4m0 0h-7m7 0v7", // arrow
  ];
  return (
    <div className={s.win}>
      <Bar title="Publishing flow" back />
      <div className={s.boardArea}>
        <Board />
        <div className={s.tools} aria-hidden="true">
          {tools.map((d, i) => <svg key={i} viewBox="0 0 20 20" data-on={i === 1 || undefined}><path d={d} /></svg>)}
          <span>Aa</span>
        </div>
      </div>
    </div>
  );
}

/** Build: the Habit tracker template, an app in a note. Claude logged today's gym. */
export function BuildWin({ list = true }: { list?: boolean }) {
  const week = ["M", "T", "W", "T", "F", "S", "S"];
  const rows: [string, React.ReactNode, "done" | "count" | "open"][] = [
    ["Morning walk", "5 days in a row", "done"],
    ["Read 20 pages", "4 of 7 this week", "done"],
    ["Gym", <Chip key="c" ai="claude" name="Logged by Claude" />, "done"],
    ["Water", "5 of 8 glasses", "count"],
    ["No phone after 22", "3 of 7 this week", "open"],
  ];
  return (
    <div className={s.win}>
      <Bar title={list ? "Notes" : "Habit tracker"} back={!list} />
      <div className={s.cols} data-solo={!list || undefined}>
        {list && <List on="Habit tracker" />}
        <div className={s.app} role="img" aria-label="A habit tracker app in a note: Today, a week of dots, and six habits. Claude logged the gym.">
          <p className={s.aTop}><b>Habit tracker</b><span className={s.appTag}>App</span></p>
          <p className={s.aTitle}>Today</p>
          <div className={s.aWeek}>{week.map((w, k) => <span key={k} data-on={k < 4 ? "" : undefined} data-now={k === 4 ? "" : undefined}><small>{w}</small><i /></span>)}</div>
          <ul className={s.aList}>
            {rows.map(([t, sub, st]) => (
              <li key={t}>
                <span><b>{t}</b><small data-step={t === "Gym" || undefined} style={t === "Gym" ? ({ "--s": 1 } as React.CSSProperties) : undefined}>{sub}</small></span>
                {st === "count" ? <span className={s.aCount}><i>–</i><i data-ring="">+</i></span>
                  : <i className={s.aTick} data-on={st === "done" ? "" : undefined} data-step={t === "Gym" || undefined} style={t === "Gym" ? ({ "--s": 0 } as React.CSSProperties) : undefined}><svg viewBox="0 0 16 16"><path d="M4 8.4l2.6 2.6L12 5.4" /></svg></i>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** The AI picture: the Workout log in Pinto, with the row ChatGPT just added. */
export function AiWin() {
  const rows: [string, string, string, string, string][] = [
    ["Nov 4", "Push", "Bench press", "70 kg x 6", "7"],
    ["Nov 5", "Run", "Easy run", "5 km in 29 min", "5"],
    ["Nov 6", "Legs", "Squat", "100 kg x 5", "8"],
    ["Nov 8", "Pull", "Barbell row", "60 kg x 8", "7"],
    ["Nov 9", "Run", "Intervals", "6 x 400 m", "8"],
    ["Nov 11", "Push", "Overhead press", "45 kg x 5", "8"],
    ["Nov 12", "Legs", "Lunges", "20 kg x 10", "6"],
  ];
  return (
    <div className={s.win}>
      <Bar title="Workout log" back />
      <div className={s.table} role="img" aria-label="The Workout log in Pinto Notes: a table of sessions. The new row, Deadlift 120 kg x 3, is marked as added by ChatGPT.">
        <p className={s.aTitle}>Sessions</p>
        <div className={s.grid}>
          {["Date", "Workout", "Exercise", "Result", "Effort"].map((h) => <b key={h}>{h}</b>)}
          {rows.flatMap((r) => r.map((c, i) => <span key={r[0] + i}>{c}</span>))}
          {["Nov 13", "Pull", "Deadlift", "120 kg x 3", "9"].map((c, i) => <span key={"n" + i} data-new="" data-step="" style={{ "--s": 2 } as React.CSSProperties}>{c}</span>)}
        </div>
        <p className={s.by} data-step="" style={{ "--s": 3 } as React.CSSProperties}><Chip ai="openai" name="Added by ChatGPT" /><span>Undo</span></p>
      </div>
    </div>
  );
}

/** What was said: one line to ChatGPT, and its answer, beside the window and as tall as it. */
export function AiChat() {
  return (
    <div className={s.chat} role="img" aria-label="In ChatGPT: What did I squat last week? ChatGPT answers from your notes: 100 kg for 5, on Nov 6. Then: Deadlift today, 120 kg for 3. Log it. ChatGPT answers: Logged in your Workout log. That's a new best.">
      <p className={s.chatHead}><AIGlyph name="openai" size={18} />ChatGPT</p>
      <p className={s.me}>What did I squat last week?</p>
      <div className={s.them}>
        <p className={s.tool}><span className={s.toolMark}><img src="/mark-256.png" alt="" width={256} height={256} /></span>Used Pinto Notes</p>
        <p>100 kg for 5, on Nov 6. It&apos;s in your Workout log.</p>
      </div>
      <p className={s.me} data-step="" style={{ "--s": 0 } as React.CSSProperties}>Deadlift today, 120 kg for 3. Log it.</p>
      <div className={s.them} data-step="" style={{ "--s": 1 } as React.CSSProperties}>
        <p className={s.tool}><span className={s.toolMark}><img src="/mark-256.png" alt="" width={256} height={256} /></span>Used Pinto Notes</p>
        <p>Logged in your Workout log. That&apos;s a new best for deadlift.</p>
      </div>
      <p className={s.composer}>Ask anything</p>
    </div>
  );
}

/** Mac and iPhone: the Mac window rebuilt in HTML, and the same note on the iPhone beside it. */
export function Devices() {
  const items: [string, boolean][] = [["Oat milk", false], ["Lemons", false], ["Coffee beans", false], ["Fresh basil", false], ["Burrata", false],
    ["Cherry tomatoes", false], ["Olive oil", false], ["Dark chocolate", false], ["Sourdough", true], ["Eggs", true], ["Spinach", true]];
  return (
    <div className={s.devices}>
      <div className={s.mac}><WriteWin /></div>
      <div className={s.iphone} role="img" aria-label="The same Groceries note on an iPhone.">
        <div className={s.screen}>
          <p className={s.status}><b>9:41</b><span /></p>
          <p className={s.back}>‹ Notes</p>
          <p className={s.pTitle}>Groceries</p>
          <p className={s.pText}>For the weekend, and Sunday dinner with Sara and Jonas.</p>
          <ul className={s.pCheck}>
            {items.map(([t, on]) => <li key={t} data-on={on || undefined}><i>{on && <Tick />}</i>{t}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── The small pictures for "And so much more" ── */

export function SlashMini() {
  // The real / menu's rows (Pane/Editor/SlashCommands.swift).
  const rows = [["T", "Heading"], ["☑", "Checklist"], ["•", "Bulleted List"], ["▦", "Table"], ["↗", "Link to Note"]];
  return (
    <div className={s.mini} aria-hidden="true">
      <p className={s.miniLine}>Packing list <span className={s.caret}>/</span></p>
      <ul className={s.slash}>{rows.map(([g, t], i) => <li key={t} data-on={i === 1 || undefined}><i>{g}</i>{t}</li>)}</ul>
    </div>
  );
}

export function TableMini() {
  return (
    <div className={s.mini} aria-hidden="true">
      <div className={s.tMini}>
        <b>Day</b><b>Plan</b><b>Done</b>
        <span>Mon</span><span>Gym</span><span><i data-on=""><Tick /></i></span>
        <span>Tue</span><span>Run, 5 km</span><span><i /></span>
        <span>Wed</span><span>Rest</span><span><i data-on=""><Tick /></i></span>
        <span>Thu</span><span>Swim</span><span><i /></span>
      </div>
    </div>
  );
}

export function HistoryMini() {
  // Version history: every earlier version kept; a change your AI made carries its name.
  const rows: [string, string?][] = [["Today, 21:40", "Claude"], ["Today, 09:12"], ["Yesterday, 18:03"], ["Monday, 08:30"]];
  return (
    <div className={s.mini} aria-hidden="true">
      <ul className={s.hMini}>
        {rows.map(([t, by], i) => (
          <li key={t} data-on={i === 1 || undefined}>
            <span>{t}</span>
            {by && <Chip ai="claude" name={by} />}
            {i === 1 && <em className={s.restore}>Restore</em>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LinkMini() {
  return (
    <div className={s.mini} aria-hidden="true">
      <p className={s.miniText}>Book the flights from the <u>Lisbon trip</u> note, then pack.</p>
      <div className={s.peek}><b>Lisbon trip</b><span>12–15 May, flights and hotel</span></div>
    </div>
  );
}

export function LockMini() {
  // A locked note, as Pinto shows it: the text stays hidden until you type the note's own password.
  return (
    <div className={s.mini} aria-hidden="true">
      <div className={s.lMini}>
        <svg viewBox="0 0 24 24" className={s.lGlyph}><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></svg>
        <b>This note is locked.</b>
        <span className={s.lField}>••••••••</span>
        <em className={s.restore}>Open note</em>
      </div>
    </div>
  );
}

export function ImportMini() {
  // Bring your notes: the sources the importer reads today.
  const rows = ["Apple Notes", "Obsidian", "Bear", "Evernote", "Keep"];
  return (
    <div className={s.mini} aria-hidden="true">
      <p className={s.miniLine}>Import from</p>
      <ul className={s.hMini}>
        {rows.map((t, i) => (
          <li key={t} data-on={i === 0 || undefined}>
            <span>{t}</span>
            <i className={s.chev}>›</i>
          </li>
        ))}
      </ul>
    </div>
  );
}
