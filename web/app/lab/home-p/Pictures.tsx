import { AIGlyph } from "@/lib/ai-glyphs";
import { Board } from "./Board";
import s from "./p.module.css";

// The product pictures, rebuilt in HTML from the app's captures (public/lab/big3 and
// public/templates/apps) so they stay sharp at any size: the same words, list and look as the app.
// Drawn at the app's own scale, so a 1200 px window shows the UI as big as it is on a Mac.
// On a phone the list column goes and the content fills the window, as the iPhone app shows one
// note at a time.

const Chip = ({ ai, name }: { ai: "openai" | "claude"; name: string }) => (
  <em className={s.chip} data-ai={ai}><AIGlyph name={ai} size={11} />{name}</em>
);
const Tick = () => <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 6.2l2 2 4-4.4" /></svg>;

const I = {
  side: <svg viewBox="0 0 20 20"><rect x="2.5" y="4" width="15" height="12" rx="2.5" /><path d="M7.5 4v12" /></svg>,
  cal: <svg viewBox="0 0 20 20"><rect x="3" y="4" width="14" height="13" rx="2.5" /><path d="M3 8h14" /><text x="10" y="15.2" fontSize="6.5" textAnchor="middle" stroke="none" fill="currentColor" fontWeight="600">13</text></svg>,
  search: <svg viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="5" /><path d="M12.3 12.3L17 17" /></svg>,
  compose: <svg viewBox="0 0 20 20"><path d="M15.5 10.5V15a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 15V6A1.5 1.5 0 0 1 5 4.5h4.5" /><path d="M14.5 3.5l2 2-6.5 6.5-2.6.6.6-2.6z" /></svg>,
  board: <svg viewBox="0 0 20 20"><rect x="3" y="3" width="10" height="10" rx="2.5" /><rect x="7" y="7" width="10" height="10" rx="2.5" /></svg>,
  apps: <svg viewBox="0 0 20 20"><rect x="3" y="3" width="5.5" height="5.5" rx="1.4" /><rect x="11.5" y="3" width="5.5" height="5.5" rx="1.4" /><rect x="3" y="11.5" width="5.5" height="5.5" rx="1.4" /><rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.4" /></svg>,
  back: <svg viewBox="0 0 20 20"><path d="M12 5l-5 5 5 5" /></svg>,
  fwd: <svg viewBox="0 0 20 20"><path d="M8 5l5 5-5 5" /></svg>,
  check: <svg viewBox="0 0 20 20"><circle cx="5" cy="6" r="2" /><path d="M9.5 6h7.5M9.5 14h7.5" /><circle cx="5" cy="14" r="2" /></svg>,
  table: <svg viewBox="0 0 20 20"><rect x="2.5" y="4" width="15" height="12" rx="1.5" /><path d="M2.5 8h15M2.5 12h15M7.5 4v12" /></svg>,
  clip: <svg viewBox="0 0 20 20"><path d="M15 9.5l-5.6 5.6a3.4 3.4 0 0 1-4.8-4.8l6-6a2.3 2.3 0 0 1 3.2 3.2l-6 6a1.1 1.1 0 0 1-1.6-1.6l5.4-5.4" /></svg>,
  share: <svg viewBox="0 0 20 20"><path d="M10 2.5v10M6.5 6L10 2.5 13.5 6" /><path d="M6.5 9H5.5A1.5 1.5 0 0 0 4 10.5v5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 14.5 9h-1" /></svg>,
  more: <svg viewBox="0 0 20 20"><circle cx="5" cy="10" r="0.9" /><circle cx="10" cy="10" r="0.9" /><circle cx="15" cy="10" r="0.9" /></svg>,
};

/** The window's toolbar, as in the captures: lights, sidebar, calendar, search, the three create buttons, then the note's tools. */
function Bar({ title, tools = true }: { title: string; tools?: boolean }) {
  return (
    <div className={s.bar} aria-hidden="true">
      <span className={s.lights}><i /><i /><i /></span>
      <span className={s.barGroup}>{I.side}{I.cal}{I.search}</span>
      <span className={s.pill}>All Notes <svg viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" /></svg></span>
      <span className={`${s.pill} ${s.create}`}>{I.compose}{I.board}{I.apps}</span>
      <span className={s.barNav}>{I.back}{I.fwd}</span>
      <b>{title}</b>
      {tools && <span className={`${s.pill} ${s.noteTools}`}><span className={s.aa}>Aa</span>{I.check}{I.table}{I.clip}{I.share}{I.more}</span>}
    </div>
  );
}

type Row = { t: string; time: string; sub: string; folder: string; app?: boolean };
const ROWS: { head: string; rows: Row[] }[] = [
  { head: "Pinned", rows: [
    { t: "Habit tracker", time: "8:51 PM", sub: "Small things, most days.", folder: "Notes", app: true },
    { t: "Groceries", time: "8:41 PM", sub: "For the weekend, and Sunday din…", folder: "Notes" },
  ] },
  { head: "Today", rows: [
    { t: "Lisbon in May", time: "8:55 PM", sub: "Four days with Sara.", folder: "Travel" },
    { t: "Hotel booking", time: "8:51 PM", sub: "Memmo Príncipe Real, 12–15 May", folder: "Travel" },
    { t: "Workout log", time: "8:50 PM", sub: "One row per session.", folder: "Notes" },
    { t: "October budget", time: "8:49 PM", sub: "Spending for the month.", folder: "Notes", app: true },
    { t: "Reading stack", time: "7:51 PM", sub: "Books for the autumn.", folder: "Notes", app: true },
    { t: "Standup notes", time: "5:51 PM", sub: "Shipped the sync fix.", folder: "Work" },
  ] },
];

/** The notes list, with one note selected. */
function List({ on }: { on: string }) {
  return (
    <div className={s.list} aria-hidden="true">
      {ROWS.map((g) => (
        <div key={g.head}>
          <p>{g.head}</p>
          <ul>
            {g.rows.map((r) => (
              <li key={r.t} data-on={r.t === on || undefined}>
                <b>{r.t}{r.app && <span className={s.appTag}>App</span>}</b>
                <small>{r.time} · {r.sub}</small>
                <small className={s.folder}><svg viewBox="0 0 16 16"><path d="M2 4.5A1 1 0 0 1 3 3.5h3.2l1.4 1.5H13a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" /></svg>{r.folder}</small>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

type Check = [string, boolean, ("openai" | "claude")?];
function Checklist({ items }: { items: Check[] }) {
  return (
    <ul className={s.check}>
      {items.map(([t, on, ai]) => (
        <li key={t} data-on={on || undefined} data-new={ai || undefined}>
          <i>{on && <Tick />}</i><span>{t}</span>{ai && <Chip ai={ai} name={ai === "openai" ? "ChatGPT" : "Claude"} />}
        </li>
      ))}
    </ul>
  );
}

const GROCERIES: Check[] = [
  ["Oat milk", false], ["Lemons", false], ["Coffee beans", false], ["Fresh basil", false], ["Burrata", false],
  ["Cherry tomatoes", false], ["Olive oil", false, "openai"], ["Sourdough", true], ["Eggs", true], ["Spinach", true],
];

/** The hero: the Groceries note, with olive oil just added by ChatGPT. */
export function HeroWindow() {
  return (
    <div className={`${s.win} ${s.heroWin}`}>
      <Bar title="Notes" tools={false} />
      <div className={s.cols}>
        <List on="Groceries" />
        <div className={s.note} role="img" aria-label="Pinto Notes on a Mac: the Groceries note, a checklist. ChatGPT just added olive oil.">
          <p className={s.noteTitle}>Groceries</p>
          <p className={s.noteText}>For the weekend, and Sunday dinner with Sara and Jonas.</p>
          <Checklist items={GROCERIES} />
        </div>
      </div>
    </div>
  );
}

/** The Lisbon note: text, a link to another note, a table and a checklist. */
function Lisbon({ compact = false }: { compact?: boolean }) {
  const days = [
    ["Tue 12", "Land 11:20, walk Príncipe Real", "Hotel"],
    ["Wed 13", "Belém and the river", ""],
    ["Thu 14", "Sintra by train", "Tickets"],
    ["Fri 15", "Fly home 18:40", "Flight"],
  ];
  return (
    <div className={s.note} data-compact={compact || undefined} role="img"
      aria-label="A note called Lisbon in May: a line of text with a link to the Hotel booking note, a table of four days, and a packing checklist.">
      <p className={s.noteTitle}>Lisbon in May</p>
      <p className={s.noteText}>Four days with Sara. Flights and the hotel are booked, see <span className={s.link}>Hotel booking</span>.</p>
      <p className={s.noteHead}>Days</p>
      <table className={s.table}>
        <thead><tr><th>Day</th><th>Plan</th><th>Booked</th></tr></thead>
        <tbody>{days.map(([d, p, b]) => <tr key={d}><td>{d}</td><td>{p}</td><td>{b && <span className={s.tag}>{b}</span>}</td></tr>)}</tbody>
      </table>
      <p className={s.noteHead}>Pack</p>
      <Checklist items={[["Passport", true], ["Chargers", true], ["Sunglasses", false], ["Light jacket", false], ["Film for the camera", false]]} />
    </div>
  );
}

/** Write notes: the whole window, as big as on a Mac. */
export function WriteWindow() {
  return (
    <div className={`${s.win} ${s.bigWin}`}>
      <Bar title="Travel" />
      <div className={s.cols}>
        <List on="Lisbon in May" />
        <Lisbon />
      </div>
    </div>
  );
}

/** Draw on whiteboards: the Publishing flow whiteboard, drawing itself. */
export function DrawWindow() {
  const tools = [
    "M7 15l-3-3m0 0l3-3m-3 3h9a3 3 0 0 0 0-6",
    "M4 3l11 6-5 1.5L8 16z",
    "M4 16L16 4",
    "M3.5 5.5h13v9h-13z",
    "M10 3.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13z",
    "M10 3l7 7-7 7-7-7z",
    "M4 16L16 4m0 0h-7m7 0v7",
  ];
  return (
    <div className={`${s.win} ${s.bigWin}`}>
      <div className={s.bar} aria-hidden="true">
        <span className={s.lights}><i /><i /><i /></span>
        <span className={s.barBack}>{I.back}</span>
        <b>Publishing flow</b>
        <span className={`${s.pill} ${s.noteTools}`}>{I.share}{I.more}</span>
      </div>
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

/** Build apps: the Habit tracker template, as public/templates/apps/habit-tracker-light.png shows it. */
export function HabitWindow() {
  const week = ["M", "T", "W", "T", "F", "S", "S"];
  const grid: [string, number, boolean][] = [["Walk", 2, false], ["Read", 2, false], ["Water", 1, true], ["No phone in bed", 1, true]];
  const habits: { t: string; sub: string; streak: string; st: "done" | "count" | "open" }[] = [
    { t: "Walk", sub: "30 minutes outside", streak: "3-day streak", st: "done" },
    { t: "Read", sub: "20 pages", streak: "9-day streak", st: "done" },
    { t: "Water", sub: "5 of 8 glasses", streak: "2-day streak", st: "count" },
    { t: "No phone in bed", sub: "Charges in the kitchen", streak: "1-day streak", st: "open" },
  ];
  return (
    <div className={`${s.win} ${s.bigWin}`}>
      <div className={s.bar} aria-hidden="true">
        <span className={s.lights}><i /><i /><i /></span>
        <span className={s.barGroup}>{I.side}</span>
        <span className={`${s.pill} ${s.create}`}>{I.compose}{I.board}{I.apps}</span>
        <b>Habit tracker</b><span className={s.appTag}>App</span>
        <span className={`${s.pill} ${s.noteTools}`}>{I.share}{I.more}</span>
      </div>
      <div className={s.habit} role="img" aria-label="The Habit tracker app in a note: Today, 6 of 8 since Monday, a week of dots, and four habits with their streaks.">
        <div className={s.hSide} aria-hidden="true">
          <b>Habit tracker</b>
          <span data-on="">
            <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5" /><path d="M5.7 8.2l1.6 1.6 3-3.2" /></svg>Today</span>
          <span><svg viewBox="0 0 16 16"><rect x="2.5" y="3.5" width="11" height="10" rx="2" /><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" /></svg>Month</span>
          <span><svg viewBox="0 0 16 16"><path d="M2.5 4.5l1 1 2-2M2.5 10.5l1 1 2-2M8 4.5h6M8 10.5h6" /></svg>Habits</span>
        </div>
        <div className={s.hMain}>
          <p className={s.hDate}>Tuesday 10 November</p>
          <p className={s.hTitle}>Today</p>
          <div className={s.hCols}>
            <div className={s.hLeft}>
              <div className={s.hRing}>
                <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" /><circle cx="50" cy="50" r="42" pathLength={100} strokeDasharray="75 100" data-on="" /></svg>
                <b>75%</b>
                <span><small>Since Monday</small><strong>6 of 8</strong><em>Today: 2 of 4 done</em></span>
              </div>
              <p className={s.hLabel}>This week</p>
              <div className={s.hWeek}>
                <div className={s.hDays}><span />{week.map((w, k) => <small key={k} data-now={k === 1 || undefined}>{w}</small>)}</div>
                {grid.map(([t, n, half]) => (
                  <div key={t} className={s.hDays}>
                    <span>{t}</span>
                    {week.map((_, k) => <i key={k} data-on={k < n || undefined} data-half={half && k === n || undefined} />)}
                  </div>
                ))}
              </div>
            </div>
            <div className={s.hRight}>
              <p className={s.hLabel}>Habits</p>
              <ul className={s.hList}>
                {habits.map((h) => (
                  <li key={h.t}>
                    <span><b>{h.t} <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4l4 4-4 4" /></svg></b><small>{h.sub} · <em>{h.streak}</em></small></span>
                    {h.st === "count"
                      ? <span className={s.hCount}><i>–</i><i data-ring="">+</i></span>
                      : <i className={s.hTick} data-on={h.st === "done" || undefined}><svg viewBox="0 0 16 16"><path d="M4 8.4l2.6 2.6L12 5.4" /></svg></i>}
                  </li>
                ))}
              </ul>
              <p className={s.hFoot}>Choose a habit to see or change it.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Your AI: what you said in ChatGPT, and the Workout log note it changed. */
export function SaidDone() {
  const rows: [string, string, string, string, string, boolean?][] = [
    ["Mon 9 Nov", "Legs", "Squat", "5 × 5 at 115 kg", "7"],
    ["Wed 11 Nov", "Push", "Bench press", "5 × 5 at 80 kg", "7"],
    ["Fri 13 Nov", "Pull", "Deadlift", "3 × 5 at 140 kg", "8"],
    ["Sat 14 Nov", "Legs", "Squat", "3 × 5 at 120 kg", "8", true],
  ];
  return (
    <div className={s.said}>
      <div className={s.chat} role="img" aria-label="In ChatGPT you say: Squats today, 3 sets of 5 at 120 kg. ChatGPT answers that it logged it in your Workout log, a new best for squats.">
        <p className={s.chatHead}><span className={s.chatMark}><AIGlyph name="openai" size={16} /></span>ChatGPT</p>
        <p className={s.you}>Squats today, 3 sets of 5 at 120 kg. Felt heavy.</p>
        <p className={s.tool}><img src="/mark-256.png" alt="" width={18} height={18} />Edited Workout log in Pinto Notes</p>
        <p className={s.them}>Logged it in your Workout log. That’s a new best for squats, up from 115 kg on Monday.</p>
      </div>
      <div className={`${s.win} ${s.saidWin}`}>
        <Bar title="Notes" tools={false} />
        <div className={s.note} role="img" aria-label="The Workout log note in Pinto Notes: a table of sessions. ChatGPT added Saturday's squats and the new best, both marked ChatGPT.">
          <p className={s.noteTitle}>Workout log</p>
          <p className={s.noteText}>One row per session. Add it yourself, or tell your AI what you did after training.</p>
          <p className={s.noteHead}>Sessions</p>
          <table className={`${s.table} ${s.wide}`}>
            <thead><tr><th>Date</th><th>Workout</th><th>Exercise</th><th>Result</th><th>Effort</th></tr></thead>
            <tbody>{rows.map(([d, w, e, r, f, ai]) => (
              <tr key={d} data-new={ai || undefined}><td>{d}</td><td><span className={s.tag}>{w}</span></td><td>{e}</td><td>{r}</td><td>{f}</td></tr>
            ))}</tbody>
          </table>
          <p className={s.aiMark}><Chip ai="openai" name="ChatGPT" />added this row</p>
          <p className={s.noteHead}>Personal bests</p>
          <p className={s.noteText} data-new=""><span>Squat: 120 kg, 14 November</span></p>
        </div>
      </div>
    </div>
  );
}

/** The Hotel booking note, the same on the Mac and the iPhone. */
function Hotel({ phone = false }: { phone?: boolean }) {
  return (
    <div className={phone ? s.pNote : s.note} role={phone ? undefined : "img"} aria-label={phone ? undefined : "The Hotel booking note: the hotel, the dates and a short checklist."}>
      <p className={s.noteTitle}>Hotel booking</p>
      <p className={s.noteText}>Memmo Príncipe Real, 12–15 May. Three nights, breakfast included.</p>
      <p className={s.noteHead}>Details</p>
      <ul className={s.facts}>
        <li><span>Check in</span><b>Tue 12 May, from 15:00</b></li>
        <li><span>Check out</span><b>Fri 15 May, by 11:00</b></li>
        <li><span>Address</span><b>Rua D. Pedro V 56</b></li>
      </ul>
      <p className={s.noteHead}>Before we go</p>
      <Checklist items={[["Pay the deposit", true], ["Ask for a quiet room", true], ["Airport transfer", false], ["Dinner on Wednesday", false]]} />
    </div>
  );
}

/** Mac and iPhone: the same note on both. */
export function Devices() {
  return (
    <div className={s.devices}>
      <div className={`${s.win} ${s.devWin}`}>
        <Bar title="Travel" />
        <div className={s.cols}>
          <List on="Hotel booking" />
          <Hotel />
        </div>
      </div>
      <div className={s.phone} role="img" aria-label="The same Hotel booking note on an iPhone.">
        <div className={s.screen}>
          <div className={s.status} aria-hidden="true"><b>9:41</b><span className={s.island} /><span className={s.bat}><i /></span></div>
          <div className={s.pBar} aria-hidden="true"><span className={s.pBtn}>{I.back}</span><span className={s.pBtn}>{I.more}</span></div>
          <Hotel phone />
          <div className={s.pTools} aria-hidden="true">{I.check}{I.table}{I.clip}{I.compose}</div>
        </div>
      </div>
    </div>
  );
}
