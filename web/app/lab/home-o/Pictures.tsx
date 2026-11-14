import { AIGlyph } from "@/lib/ai-glyphs";
import { Board } from "./Board";
import s from "./o.module.css";

// The three pictures, rebuilt from the app's captures (public/lab/big3) so they stay sharp at any
// size: the same Mac window each time, its content changing with the word. On a phone the list
// column goes and the content fills the card, as the iPhone app shows one note at a time.

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
  { t: "Reading stack", time: "7:51 PM", sub: "Books for the autumn.", app: true },
];

/** The list column, with one note selected. */
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

/** Write: the Groceries note, with olive oil just added by ChatGPT. */
export function WritePic() {
  const items: [string, boolean, boolean][] = [
    ["Oat milk", false, false], ["Lemons", false, false], ["Coffee beans", false, false], ["Fresh basil", false, false],
    ["Burrata", false, false], ["Cherry tomatoes", false, false], ["Olive oil", false, true],
    ["Sourdough", true, false], ["Eggs", true, false], ["Spinach", true, false],
  ];
  return (
    <div className={s.win}>
      <Bar title="Notes" />
      <div className={s.cols}>
        <List on="Groceries" />
        <div className={s.note} role="img" aria-label="Pinto Notes on a Mac: the Groceries note, a checklist. ChatGPT just added olive oil.">
          <p className={s.noteTitle}>Groceries</p>
          <p className={s.noteText}>For the weekend, and Sunday dinner with Sara and Jonas.</p>
          <ul className={s.check}>
            {items.map(([t, on, ai]) => (
              <li key={t} data-on={on || undefined} data-new={ai || undefined}>
                <i>{on && <Tick />}</i>{t}{ai && <Chip ai="openai" name="ChatGPT" />}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Draw: the Publishing flow whiteboard, Claude drawing its last box. */
export function DrawPic() {
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
export function BuildPic() {
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
      <Bar title="Notes" />
      <div className={s.cols}>
        <List on="Habit tracker" />
        <div className={s.app} role="img" aria-label="A habit tracker app in a note: Today, a week of dots, and five habits. Claude logged the gym.">
          <p className={s.aTop}><b>Habit tracker</b><span className={s.appTag}>App</span></p>
          <p className={s.aTitle}>Today</p>
          <div className={s.aWeek}>{week.map((w, k) => <span key={k} data-on={k < 4 ? "" : undefined} data-now={k === 4 ? "" : undefined}><small>{w}</small><i /></span>)}</div>
          <ul className={s.aList}>
            {rows.map(([t, sub, st]) => (
              <li key={t}>
                <span><b>{t}</b><small>{sub}</small></span>
                {st === "count" ? <span className={s.aCount}><i>–</i><i data-ring="">+</i></span>
                  : <i className={s.aTick} data-on={st === "done" ? "" : undefined}><svg viewBox="0 0 16 16"><path d="M4 8.4l2.6 2.6L12 5.4" /></svg></i>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
