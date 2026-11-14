import { AIGlyph } from "@/lib/ai-glyphs";
import { publishingFlow, publishingFlowTall, type Shape } from "./rough";
import m from "./m.module.css";

// The three things on the desk, each rebuilt in HTML and SVG at its sharp size (a phone is 320 px
// wide), so the enlarged view is never a stretched picture. Words are the app's own.

const Status = () => (
  <p className={m.status} aria-hidden="true">
    <b>9:41</b><span className={m.island} />
    <span className={m.sIcons}>
      <svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
      <svg viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" fill="none" stroke="currentColor" opacity="0.4" /><rect x="2.5" y="2.5" width="16" height="8" rx="2" /><path d="M24.5 4.5v4a2 2 0 0 0 0-4z" opacity="0.4" /></svg>
    </span>
  </p>
);

const Nav = ({ title }: { title: string }) => (
  <p className={m.nav} aria-hidden="true">
    <span className={m.back}><svg viewBox="0 0 10 16"><path d="M8 1.5L2 8l6 6.5" /></svg>{title}</span>
    <span className={m.navBtns}>
      <i><svg viewBox="0 0 16 16"><path d="M8 10V1.8M5 4.5l3-3 3 3M4.5 7H3.5v7.5h9V7h-1" /></svg></i>
      <i><svg viewBox="0 0 16 16"><circle cx="3" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="13" cy="8" r="1.3" /></svg></i>
    </span>
  </p>
);

const Tick = () => <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 6.2l2 2 4-4.4" /></svg>;

/// The Groceries note on iPhone. Olive oil is the line ChatGPT just added from the sticky note.
export function GroceriesPhone() {
  const items: [string, boolean][] = [["Oat milk", false], ["Lemons", false], ["Coffee beans", false], ["Fresh basil", false], ["Burrata", false],
    ["Cherry tomatoes", false], ["Olive oil", false], ["Dark chocolate", false], ["Sourdough", true], ["Eggs", true], ["Spinach", true]];
  return (
    <div className={m.phone}>
      <div className={m.screen}>
        <Status />
        <Nav title="My notebook" />
        <p className={m.nDate}>Today at 9:40</p>
        <p className={m.nTitle}>Groceries</p>
        <p className={m.nText}>For the weekend, and Sunday dinner with Sara and Jonas.</p>
        <ul className={m.check}>
          {items.map(([t, on]) => (
            <li key={t} data-on={on || undefined} data-new={t === "Olive oil" || undefined}>
              <i>{on && <Tick />}</i>{t}
              {t === "Olive oil" && <em className={m.chip}><AIGlyph name="openai" size={10} />ChatGPT</em>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/// The Habit tracker template's Today screen on iPhone (as in public/templates/apps/phone).
export function HabitsPhone() {
  const week = ["M", "T", "W", "T", "F", "S", "S"];
  const habits: { name: string; sub: string; extra?: string; ai?: boolean; done: number; today: boolean }[] = [
    { name: "Walk", sub: "30 minutes", extra: "11-day streak", done: 2, today: true },
    { name: "Read", sub: "20 pages", done: 2, today: true },
    { name: "Gym", sub: "Logged by Claude", ai: true, done: 1, today: false },
    { name: "Water", sub: "8 glasses", done: 1, today: false },
  ];
  return (
    <div className={m.phone}>
      <div className={m.screen}>
        <Status />
        <Nav title="My notebook" />
        <div className={m.hab}>
          <p className={m.hDate}>Tuesday 13 October</p>
          <p className={m.hTitle}>Today</p>
          <div className={m.ringCard}>
            <svg className={m.ring} viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="26" />
              <circle cx="32" cy="32" r="26" pathLength={100} strokeDasharray="62 100" transform="rotate(-90 32 32)" />
              <text x="32" y="33">62%</text>
            </svg>
            <p><small>This week</small><b>2 of 6 done today</b><span>8 of 13 since Monday</span></p>
          </div>
          <p className={m.hHead}>Habits</p>
          <ul className={m.habits}>
            {habits.map((h) => (
              <li key={h.name}>
                <div>
                  <b>{h.name} <svg viewBox="0 0 8 12" aria-hidden="true"><path d="M2 1.5L6.5 6 2 10.5" /></svg></b>
                  <span data-ai={h.ai || undefined}>{h.ai && <AIGlyph name="claude" size={11} color="#d97757" />}{h.sub}{h.extra && <> · <em>{h.extra}</em></>}</span>
                  <p className={m.days}>{week.map((w, i) => <i key={i} data-on={i < h.done || undefined}>{w}</i>)}</p>
                </div>
                <i className={m.hTick} data-on={h.today || undefined}><Tick /></i>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const WIDE = publishingFlow();
const TALL = publishingFlowTall();

function Ink({ shapes, box, className }: { shapes: Shape[]; box: string; className: string }) {
  return (
    <svg className={className} viewBox={box} aria-hidden="true">
      {shapes.map((s, k) => (
        <g key={k}>
          {s.fill && <path d={s.fill.d} fill={s.fill.color} />}
          {s.strokes.map((d, j) => <path key={j} className={m.stroke} d={d} />)}
          {s.label && <text className={m.hand} x={s.label.x} y={s.label.y}>{s.label.text}</text>}
        </g>
      ))}
    </svg>
  );
}

/// The Publishing flow whiteboard in the Mac window, as a sheet on the desk: the window's bar, the
/// drawing, and the drawing tools along the bottom.
export function Whiteboard() {
  const tools = [
    <path key="sel" d="M5 3l9 5-4 1.2L8.4 13z" fill="currentColor" stroke="none" />,
    <path key="hand" d="M6 9V4.5a1 1 0 0 1 2 0V8m0-4.5a1 1 0 0 1 2 0V8m0-3a1 1 0 0 1 2 0v4.5c0 2.5-1.6 4-3.8 4-1.6 0-2.6-.9-3.5-2.3L3.6 9.4a1 1 0 0 1 1.7-1L6 9.5" />,
    <path key="pen" d="M4 14l1-3.4L12 3.6l2.4 2.4-7 7z" />,
    <rect key="rect" x="3" y="5" width="12" height="9" rx="1.5" />,
    <circle key="ell" cx="9" cy="9.5" r="5.2" />,
    <path key="dia" d="M9 3.5l5.6 6-5.6 6-5.6-6z" />,
    <path key="arr" d="M4 14L14 4m-5.5 0H14v5.5" />,
    <text key="aa" x="9" y="13" textAnchor="middle" fontSize="9" fill="currentColor" stroke="none" fontWeight="500">Aa</text>,
    <path key="era" d="M7 15h7M3.8 11.2l6.4-6.4 4 4-5.4 5.4H6z" />,
  ];
  return (
    <div className={m.sheet}>
      <p className={m.wBar} aria-hidden="true">
        <span className={m.lights}><i /><i /><i /></span>
        <span className={m.wBack}><svg viewBox="0 0 10 16"><path d="M7.5 2L2.5 8l5 6" /></svg></span>
        <b>Publishing flow</b>
        <span className={m.wBtns}><i><svg viewBox="0 0 16 16"><path d="M8 10V1.8M5 4.5l3-3 3 3M4.5 7H3.5v7.5h9V7h-1" /></svg></i><i><svg viewBox="0 0 16 16"><circle cx="3" cy="8" r="1.2" /><circle cx="8" cy="8" r="1.2" /><circle cx="13" cy="8" r="1.2" /></svg></i></span>
      </p>
      <Ink shapes={WIDE} box="0 0 572 268" className={m.inkWide} />
      <Ink shapes={TALL} box="0 0 320 400" className={m.inkTall} />
      <div className={m.tools} aria-hidden="true">
        <span className={m.undo}><svg viewBox="0 0 18 18"><path d="M6 5L3 8l3 3M3.5 8H11a4 4 0 0 1 0 8H8" /></svg><svg viewBox="0 0 18 18"><path d="M12 5l3 3-3 3M14.5 8H7a4 4 0 0 0 0 8h3" /></svg></span>
        {tools.map((t, i) => <svg key={i} viewBox="0 0 18 18" data-on={i === 3 || undefined}>{t}</svg>)}
      </div>
      <span className={m.zoom} aria-hidden="true">90%</span>
    </div>
  );
}

/// The message on the sticky note, as you'd say it to ChatGPT.
export function Sticky() {
  return (
    <div className={m.sticky}>
      <p className={m.stickyWho}><AIGlyph name="openai" size={15} />ChatGPT</p>
      <p className={m.stickySay}>Add olive oil to my groceries.</p>
    </div>
  );
}

/// A cup of coffee seen from above.
export const Mug = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 236 184" aria-hidden="true">
    <path d="M160 72h30a22 22 0 0 1 0 44h-30" fill="none" stroke="#efe5d6" strokeWidth="18" strokeLinecap="round" />
    <circle cx="92" cy="92" r="88" fill="#f8f2e9" />
    <circle cx="92" cy="92" r="76" fill="#eadfcd" />
    <circle cx="94" cy="95" r="68" fill="#6f4426" />
    <circle cx="94" cy="95" r="64" fill="none" stroke="#8a5832" strokeWidth="6" />
    <path d="M70 76c10-12 30-18 46-12" fill="none" stroke="#b07a4c" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
  </svg>
);

/// A plant reaching in from the corner of the desk: flat cut-paper leaves.
export const Plant = ({ className }: { className: string }) => {
  const leaf = "M0 0C46-44 48-140 0-210C-48-140-46-44 0 0Z";
  const leaves: [number, number, number, number, string][] = [
    [300, 360, -58, 1.15, "#5f7f4c"], [300, 360, -30, 1.05, "#7a9a63"], [300, 360, -84, 0.95, "#86a56d"], [300, 360, -8, 0.8, "#6c8d57"],
  ];
  return (
    <svg className={className} viewBox="0 0 300 360" aria-hidden="true">
      {leaves.map(([x, y, r, s, c], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
          <path d={leaf} fill={c} />
          <path d="M0-4V-196" stroke="rgba(255,250,235,0.4)" strokeWidth="2.5" fill="none" />
        </g>
      ))}
    </svg>
  );
};

/// A pencil, lying where it was put down.
export const Pencil = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 300 20" aria-hidden="true">
    <rect x="0" y="1" width="24" height="18" rx="5" fill="#ec9488" />
    <rect x="18" y="1" width="24" height="18" fill="#cfc7b8" />
    <path d="M24 1v18M30 1v18M36 1v18" stroke="#b3ab9c" strokeWidth="1.2" />
    <rect x="42" y="1" width="208" height="6" fill="#f7c252" />
    <rect x="42" y="7" width="208" height="6" fill="#f0aa2e" />
    <rect x="42" y="13" width="208" height="6" fill="#df951f" />
    <path d="M250 1L291 10 250 19Z" fill="#f1d5a8" />
    <path d="M278 7.2L291 10 278 12.8Z" fill="#3b3531" />
  </svg>
);
