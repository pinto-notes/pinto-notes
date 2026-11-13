"use client";

// The window: Pinto Notes on a Mac, drawn in HTML at the app's own sizes, and the same three
// things on an iPhone. The words and the look are the app's (the Nov 13 captures in
// public/lab/big3): the Groceries note, the Publishing flow whiteboard, the Habit tracker app.

import { AIGlyph, AI_GLYPHS } from "@/lib/ai-glyphs";
import * as Ic from "./icons";
import { arrow, diamond, ellipse, fillEllipse, fillRect, rect } from "./rough";
import w from "./window.module.css";

export type Step = 0 | 1 | 2;
type Props = { step: Step; moment: boolean; onPick: (i: Step) => void };

const CREATE = [
  { label: "New note", Icon: Ic.Compose },
  { label: "New whiteboard", Icon: Ic.Board },
  { label: "New app", Icon: Ic.Apps },
] as const;

// ── The notes list ──

const LIST: { title: string; time: string; say: string; folder: string; app?: boolean; step?: Step }[][] = [
  [
    { title: "Groceries", time: "20:19", say: "For the weekend, and Sunday dinner with Sara and Jonas.", folder: "Notes", step: 0 },
    { title: "Publishing flow", time: "20:24", say: "Idea, Draft, Ready?, Publish", folder: "Work", step: 1 },
    { title: "Habit tracker", time: "20:30", say: "Pick your habits in the app, then tick them off.", folder: "Notes", app: true, step: 2 },
    { title: "Hotel booking", time: "20:29", say: "Memmo Príncipe Real, 12–15 May", folder: "Travel" },
    { title: "Welcome to Pinto Notes", time: "20:29", say: "Pinto Notes is a place for notes. Write anything.", folder: "Notes" },
  ],
  [
    { title: "Standup notes", time: "Yesterday", say: "Shipped the sync fix. Blocked on the review.", folder: "Work" },
    { title: "App ideas", time: "Yesterday", say: "A calmer inbox", folder: "Ideas" },
  ],
];

function List({ step, onPick }: Pick<Props, "step" | "onPick">) {
  return (
    <div className={w.list}>
      <div className={w.listBar}>
        <span className={w.lights} aria-hidden="true"><i /><i /><i /></span>
        <span className={w.listTitle}><b>All Notes</b><small>12 notes</small></span>
        <span className={w.listMore} aria-hidden="true"><Ic.More size={20} /></span>
        <span className={w.create}>
          {CREATE.map(({ label, Icon }, i) => (
            <button key={label} type="button" className={w.tool} data-on={step === i ? "" : undefined} aria-label={label} aria-pressed={step === i} onClick={() => onPick(i as Step)}>
              <Icon size={21} />
            </button>
          ))}
        </span>
      </div>
      <div className={w.listBody}>
        {LIST.map((group, g) => (
          <div key={g}>
            <p className={w.listHead}>{g ? "Yesterday" : "Today"}</p>
            {group.map((n) => (
              <button key={n.title} type="button" className={w.item} tabIndex={n.step === undefined ? -1 : 0} data-on={n.step === step ? "" : undefined}
                onClick={() => n.step !== undefined && onPick(n.step)}>
                <b>{n.title}{n.app && <em>App</em>}</b>
                <span><span className={w.time}>{n.time}</span> · {n.say}</span>
                <small><Ic.Folder size={13} />{n.folder}</small>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 1. The note ──

const GROCERIES = ["Oat milk", "Lemons", "Coffee beans", "Fresh basil", "Burrata", "Cherry tomatoes"];
const BOUGHT = ["Sourdough", "Eggs"];

function Note({ moment }: { moment: boolean }) {
  return (
    <div className={w.note}>
      <h3 className={w.noteTitle}>Groceries</h3>
      <p className={w.noteSay}>For the weekend, and Sunday dinner with Sara and Jonas.</p>
      <ul className={w.checks}>
        {GROCERIES.map((g) => <li key={g}><i />{g}</li>)}
        <li className={w.added} data-in={moment ? "" : undefined}>
          <i />Olive oil<em><AIGlyph name="openai" size={11} />ChatGPT</em>
        </li>
        {BOUGHT.map((g) => <li key={g} data-done=""><i><Ic.Tick size={12} /></i>{g}</li>)}
      </ul>
    </div>
  );
}

// ── 2. The whiteboard ──

type Shape = { k: "ellipse" | "rect" | "diamond"; x: number; y: number; w: number; h: number; fill?: string; label: string; ai?: boolean };
type Link = { a: [number, number, number, number]; label?: string; lx?: number; ly?: number; ai?: boolean };
type Layout = { view: string; size: number; shapes: Shape[]; links: Link[]; mark: [number, number] };

const YELLOW = "#ffec99", GREEN = "#b2f2bb", PINK = "#ffc9c9";

const WIDE: Layout = {
  view: "0 0 1000 470", size: 23, mark: [752, 370],
  shapes: [
    { k: "ellipse", x: 105, y: 170, w: 82, h: 46, fill: YELLOW, label: "Idea" },
    { k: "rect", x: 345, y: 170, w: 176, h: 88, label: "Draft" },
    { k: "diamond", x: 605, y: 170, w: 108, h: 66, label: "Ready?" },
    { k: "rect", x: 880, y: 170, w: 176, h: 88, fill: GREEN, label: "Publish" },
    { k: "rect", x: 605, y: 368, w: 168, h: 78, fill: PINK, label: "Fix it", ai: true },
  ],
  links: [
    { a: [189, 170, 255, 170] },
    { a: [435, 170, 495, 170] },
    { a: [715, 170, 790, 170], label: "yes", lx: 752, ly: 160 },
    { a: [605, 238, 605, 326], label: "no", lx: 628, ly: 288, ai: true },
  ],
};
const TALL: Layout = {
  view: "0 0 360 560", size: 21, mark: [290, 503],
  shapes: [
    { k: "ellipse", x: 130, y: 52, w: 66, h: 36, fill: YELLOW, label: "Idea" },
    { k: "rect", x: 130, y: 162, w: 140, h: 66, label: "Draft" },
    { k: "diamond", x: 130, y: 298, w: 82, h: 54, label: "Ready?" },
    { k: "rect", x: 130, y: 448, w: 140, h: 66, fill: GREEN, label: "Publish" },
    { k: "rect", x: 290, y: 448, w: 116, h: 66, fill: PINK, label: "Fix it", ai: true },
  ],
  links: [
    { a: [130, 92, 130, 124] },
    { a: [130, 198, 130, 238] },
    { a: [130, 356, 130, 410], label: "yes", lx: 152, ly: 388 },
    { a: [214, 298, 288, 410], label: "no", lx: 268, ly: 340, ai: true },
  ],
};

function Drawing({ layout, on, moment }: { layout: Layout; on: boolean; moment: boolean }) {
  let d = 0;
  return (
    <svg className={w.drawing} viewBox={layout.view} data-on={on ? "" : undefined} data-moment={moment ? "" : undefined} role="img"
      aria-label="A whiteboard called Publishing flow: Idea, then Draft, then Ready? Yes goes to Publish. Claude added: no goes to Fix it.">
      {layout.shapes.map((s, i) => {
        const outline = s.k === "rect" ? rect(s.x, s.y, s.w, s.h, 11 + i * 17) : s.k === "ellipse" ? ellipse(s.x, s.y, s.w, s.h, 5 + i) : diamond(s.x, s.y, s.w, s.h, 23 + i);
        const fill = s.fill && (s.k === "ellipse" ? fillEllipse(s.x, s.y, s.w, s.h) : fillRect(s.x, s.y, s.w, s.h));
        const at = s.ai ? 1 : d++;
        const link = layout.links[i];
        return (
          <g key={s.label}>
            <g data-ai={s.ai ? "" : undefined} style={{ "--d": at } as React.CSSProperties}>
              {fill && <path className={w.fill} d={fill} fill={s.fill} />}
              {outline.map((p, j) => <path key={j} className={w.stroke} d={p} pathLength={1} />)}
              <text className={w.hand} x={s.x} y={s.y + layout.size * 0.34} fontSize={layout.size} textAnchor="middle">{s.label}</text>
            </g>
            {link && (() => { const la = link.ai ? 0 : d++; return (
              <g data-ai={link.ai ? "" : undefined} style={{ "--d": la } as React.CSSProperties}>
                {arrow(...link.a, 41 + i * 13).map((p, j) => <path key={j} className={w.stroke} d={p} pathLength={1} />)}
                {link.label && <text className={w.hand} x={link.lx} y={link.ly} fontSize={layout.size * 0.85} textAnchor="middle">{link.label}</text>}
              </g>
            ); })()}
          </g>
        );
      })}
      <g className={w.boardMark} data-ai="" style={{ "--d": 3 } as React.CSSProperties} transform={`translate(${layout.mark[0]} ${layout.mark[1]})`}>
        <rect className={w.markBg} x={-layout.size * 1.9} y={-layout.size * 0.62} width={layout.size * 3.8} height={layout.size * 1.1} rx={layout.size * 0.55} />
        <svg x={-layout.size * 1.5} y={-layout.size * 0.36} width={layout.size * 0.6} height={layout.size * 0.6} viewBox="0 0 24 24"><path d={AI_GLYPHS.claude} fill="#a85700" /></svg>
        <text className={w.markText} x={layout.size * 0.32} y={layout.size * 0.14} textAnchor="middle" fontSize={layout.size * 0.62}>Claude</text>
      </g>
    </svg>
  );
}

const BOARD_TOOLS = [Ic.Undo, Ic.Redo, null, Ic.Pointer, Ic.Hand, Ic.Pen, Ic.Square, Ic.Circle, Ic.Diamond, Ic.Arrow, "Aa", Ic.Eraser] as const;

function Whiteboard({ on, moment, phone }: { on: boolean; moment: boolean; phone?: boolean }) {
  return (
    <div className={w.board}>
      <Drawing layout={phone ? TALL : WIDE} on={on} moment={moment} />
      {!phone && (
        <>
          <div className={w.boardTools} aria-hidden="true">
            {BOARD_TOOLS.map((T, i) => T === null ? <i key={i} className={w.gap} /> : typeof T === "string"
              ? <span key={i} className={w.aa}>{T}</span>
              : <span key={i} data-on={T === Ic.Pointer ? "" : undefined}><T size={18} /></span>)}
          </div>
          <span className={w.zoom} aria-hidden="true">90%</span>
        </>
      )}
    </div>
  );
}

// ── 3. The app ──

const HABITS = [
  { name: "Walk", say: "30 minutes outside", streak: "3-day streak", done: true },
  { name: "Read", say: "20 pages", streak: "9-day streak", ai: true },
  { name: "Water", say: "5 of 8 glasses", streak: "2-day streak", count: true },
  { name: "No phone in bed", say: "Charges in the kitchen", streak: "1-day streak" },
];

function Ring({ pct, size }: { pct: number; size: number }) {
  const r = 38, c = 2 * Math.PI * r;
  return (
    <svg className={w.ring} width={size} height={size} viewBox="0 0 96 96" aria-hidden="true">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#ebe5df" strokeWidth="10" />
      <circle cx="48" cy="48" r={r} fill="none" stroke="#dd6a0b" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 48 48)" />
      <text x="48" y="56" textAnchor="middle" fontSize="22" fontWeight="700" fill="#2a1d10">{Math.round(pct * 100)}%</text>
    </svg>
  );
}

function HabitApp({ moment, phone }: { moment: boolean; phone?: boolean }) {
  const done = moment ? 2 : 1;
  return (
    <div className={w.app} data-phone={phone ? "" : undefined}>
      {!phone && (
        <nav className={w.appNav} aria-hidden="true">
          <b>Habit tracker</b>
          <span data-on="">Today</span><span>Month</span><span>Habits</span>
        </nav>
      )}
      <div className={w.appMain}>
        <p className={w.appDate}>Tuesday 10 November</p>
        <h3 className={w.appTitle}>Today</h3>
        <div className={w.appCols}>
          <div className={w.appLeft}>
            <div className={w.appCard} data-row="">
              <Ring pct={moment ? 0.75 : 0.625} size={phone ? 84 : 92} />
              <div><small>Since Monday</small><b>{moment ? 6 : 5} of 8</b><span>Today: {done} of 4 done</span></div>
            </div>
            {!phone && (
              <>
                <p className={w.appHead}>This week</p>
                <div className={w.appCard}>
                  <div className={w.week}>
                    <span />{"MTWTFSS".split("").map((d, i) => <b key={i} data-today={i === 1 ? "" : undefined}>{d}</b>)}
                    {HABITS.map((h, r) => (
                      <Row key={h.name} name={h.name} today={r === 0 || (r === 1 && moment) ? "done" : r > 1 ? "part" : "open"} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div>
            <p className={w.appHead}>Habits</p>
            <div className={w.habits}>
              {HABITS.map((h) => (
                <div key={h.name} className={w.habit} data-ai={h.ai ? "" : undefined} data-in={h.ai && moment ? "" : undefined}>
                  <div>
                    <b>{h.name}<Ic.Fwd size={13} /></b>
                    <span>{h.say} · <em>{h.streak}</em></span>
                    {h.ai && <span className={w.habitMark}><AIGlyph name="openai" size={11} />ChatGPT ticked this</span>}
                  </div>
                  {h.count ? (
                    <span className={w.counter}><i>−</i><i data-plus="">+</i></span>
                  ) : (
                    <span className={w.check} data-done={h.done || (h.ai && moment) ? "" : undefined}><Ic.Tick size={phone ? 20 : 22} /></span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ name, today }: { name: string; today: "done" | "part" | "open" }) {
  return (
    <>
      <span>{name}</span>
      <i data-d="" /><i data-d={today === "done" ? "" : undefined} data-p={today === "part" ? "" : undefined} /><i /><i /><i /><i /><i />
    </>
  );
}

// ── The Mac window ──

const DETAIL_TOOLS: React.ComponentType<{ size?: number }>[][] = [
  [Ic.Checklist, Ic.Table, Ic.Clip, Ic.Share, Ic.More],
  [Ic.Share, Ic.More],
  [Ic.Share, Ic.More],
];

export function MacWindow({ step, moment, onPick }: Props) {
  return (
    <div className={w.mac}>
      <List step={step} onPick={onPick} />
      <div className={w.detail}>
        <div className={w.detailBar} aria-hidden="true">
          <Ic.Back size={20} /><Ic.Fwd size={20} />
          <span className={w.crumb}>{["Notes", "Work", "Notes"][step]}</span>
          <span className={w.detailTools}>
            {step === 0 && <span className={w.aa}>Aa</span>}
            {DETAIL_TOOLS[step].map((T, i) => <T key={i} size={20} />)}
          </span>
        </div>
        <Pane on={step === 0}><Note moment={moment && step === 0} /></Pane>
        <Pane on={step === 1}><Whiteboard on={step === 1} moment={moment && step === 1} /></Pane>
        <Pane on={step === 2}><HabitApp moment={moment && step === 2} /></Pane>
      </div>
    </div>
  );
}

function Pane({ on, children }: { on: boolean; children: React.ReactNode }) {
  return <div className={w.pane} data-on={on ? "" : undefined} aria-hidden={!on}>{children}</div>;
}

// ── The iPhone ──

export function Phone({ step, moment, onPick }: Props) {
  return (
    <div className={w.phone}>
      <div className={w.screen}>
        <div className={w.status} aria-hidden="true"><b>9:41</b><span className={w.island} /><span className={w.bars}><i /><i /><i /><i /><em /></span></div>
        <div className={w.phoneTop} aria-hidden="true">
          <span className={w.round}><Ic.Back size={22} /></span>
          <span className={w.round}><Ic.More size={22} /></span>
        </div>
        <div className={w.phoneBody}>
          <Pane on={step === 0}><Note moment={moment && step === 0} /></Pane>
          <Pane on={step === 1}><Whiteboard phone on={step === 1} moment={moment && step === 1} /></Pane>
          <Pane on={step === 2}><HabitApp phone moment={moment && step === 2} /></Pane>
        </div>
        <div className={w.phoneBar}>
          <span className={w.searchPill} aria-hidden="true"><Ic.Search size={20} />Search</span>
          <span className={w.createPill}>
            {CREATE.map(({ label, Icon }, i) => (
              <button key={label} type="button" className={w.tool} data-on={step === i ? "" : undefined} aria-label={label} aria-pressed={step === i} onClick={() => onPick(i as Step)}>
                <Icon size={24} />
              </button>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
