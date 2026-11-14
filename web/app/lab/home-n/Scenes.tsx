import { AIGlyph } from "@/lib/ai-glyphs";
import { cut, leaf, oval, publishingFlow } from "./rough";
import s from "./n.module.css";

// Study N's dioramas, copied from study L and rebuilt so the real UI fills each room: fewer props,
// the note, whiteboard and phone drawn much larger, and no desk lamp.
//
// The three dioramas. Each is a shadow box of cut paper: a far plane, a wall with a window, a middle
// plane, the real piece of Pinto standing up in front, and the box's own frame closest of all. Every
// plane is flat colour with a hand-cut edge; the soft shadows between them are CSS. `--z` is how far
// back a plane sits: the frame is 0, the far plane about 2.6. Pointing at a card moves the far planes
// more than the near ones (l.module.css), which is the whole depth effect.

type P = [number, number];
const rect = (x: number, y: number, w: number, h: number): P[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
/** A wall with a hole cut in it: the outer edge is off the box, so only the hole's edge shows. */
const wall = (hole: string) => `M-60 -60 H460 V500 H-60 Z ${hole}`;

/** One plane: an SVG in the scene's 400 × 440 space, a little larger than the box so it never shows its edge when it moves. */
function Plane({ z, shade = true, children }: { z: number; shade?: boolean; children: React.ReactNode }) {
  return (
    <div className={s.plane} style={{ "--z": z } as React.CSSProperties} data-shade={shade ? "" : undefined} aria-hidden="true">
      <svg viewBox="0 0 400 440" preserveAspectRatio="xMidYMid slice">{children}</svg>
    </div>
  );
}

/** The plane that holds the real UI, in the box's own size. */
function Ui({ z, className, children }: { z: number; className: string; children: React.ReactNode }) {
  return <div className={`${s.ui} ${className}`} style={{ "--z": z } as React.CSSProperties}>{children}</div>;
}

/** The shadow box's frame: the nearest plane, never moving, its inner edge cut by hand. */
const FRAME = `M-20 -20 H420 V460 H-20 Z ${cut(rect(12, 12, 376, 414), 41, 0.8, 12)}`;
export function Frame() {
  return (
    <div className={s.frame} aria-hidden="true">
      <svg viewBox="0 0 400 440" preserveAspectRatio="none"><path d={FRAME} fillRule="evenodd" /></svg>
    </div>
  );
}

/* ── Notes: a window with morning light, a plant and a mug on the sill, the Groceries note in front ── */

const N = {
  roofs: cut([[-40, 236], [10, 236], [10, 214], [34, 196], [58, 214], [58, 226], [96, 226], [96, 204], [140, 204], [140, 222], [188, 222], [188, 196], [204, 182], [220, 196], [220, 230], [262, 230], [262, 208], [300, 208], [300, 220], [336, 220], [336, 200], [362, 186], [388, 200], [388, 228], [440, 228], [440, 300], [-40, 300]], 3, 0.8),
  hill: cut([...oval(120, 262, 170, 34, 30, Math.PI, Math.PI * 2), [290, 300], [-50, 300]], 4, 0.8),
  sun: cut(oval(258, 112, 34, 34, 30), 5, 0.7),
  hole: cut(rect(70, 46, 260, 220), 6, 0.9),
  frame: `${cut(rect(60, 36, 280, 240), 7, 0.8)} ${cut(rect(74, 50, 252, 212), 8, 0.7)}`,
  bars: [cut(rect(195, 50, 10, 212), 9, 0.5), cut(rect(74, 150, 252, 9), 10, 0.5)],
  sill: cut(rect(44, 270, 312, 15), 11, 0.6),
  sillLip: cut(rect(50, 285, 300, 7), 12, 0.4),
  beam: [cut([[78, 290], [200, 290], [150, 440], [-10, 440]], 13, 1.2), cut([[212, 290], [322, 290], [330, 440], [196, 440]], 14, 1.2)],
  pot: cut([[40, 234], [92, 234], [86, 272], [46, 272]], 15, 0.6),
  potRim: cut(rect(36, 228, 60, 10), 16, 0.5),
  leaves: [
    { d: cut(leaf(64, 232, 74, -2.05), 17, 0.6), c: "#5d8a4c" },
    { d: cut(leaf(66, 232, 88, -1.62), 18, 0.6), c: "#6f9d58" },
    { d: cut(leaf(68, 232, 70, -1.08), 19, 0.6), c: "#5d8a4c" },
    { d: cut(leaf(62, 234, 58, -2.6, 0.36), 20, 0.5), c: "#7fae66" },
    { d: cut(leaf(70, 234, 60, -0.55, 0.36), 21, 0.5), c: "#7fae66" },
  ],
  ledge: cut([[-40, 340], [440, 340], [440, 480], [-40, 480]], 27, 1),
};

export function NotesScene() {
  const items: [string, boolean][] = [["Oat milk", false], ["Lemons", false], ["Coffee beans", false], ["Fresh basil", false], ["Burrata", false],
    ["Cherry tomatoes", false], ["Olive oil", false], ["Sourdough", true], ["Eggs", true]];
  return (
    <>
      <Plane z={2.6} shade={false}>
        <rect x="-60" y="-60" width="520" height="560" fill="#fde6c3" />
        <path d={N.sun} fill="#ffcf7c" />
        <path d={N.hill} fill="#efc896" />
        <path d={N.roofs} fill="#e9b984" />
      </Plane>
      <Plane z={1.8}>
        <path d={wall(N.hole)} fill="#efd0a6" fillRule="evenodd" />
        <path d={N.frame} fill="#fbf2e4" fillRule="evenodd" />
        {N.bars.map((d, i) => <path key={i} d={d} fill="#fbf2e4" />)}
        <path d={N.ledge} fill="#e7bf8f" />
      </Plane>
      <Plane z={1.45}>
        <path d={N.sill} fill="#fdf6ec" />
        <path d={N.sillLip} fill="#e9d6bd" />
        {N.beam.map((d, i) => <path key={i} d={d} fill="#fff8e8" opacity="0.5" />)}
      </Plane>
      <Plane z={1.1}>
        {N.leaves.map((l, i) => <path key={i} d={l.d} fill={l.c} />)}
        <path d={N.pot} fill="#cf6f43" />
        <path d={N.potRim} fill="#dc8556" />
      </Plane>
      <Ui z={0.45} className={s.noteAt}>
        <div className={s.note} role="img" aria-label="A note called Groceries with a checklist, two items ticked.">
          <p className={s.noteTitle}>Groceries</p>
          <p className={s.noteText}>For the weekend, and Sunday dinner with Sara and Jonas.</p>
          <ul className={s.check}>
            {items.map(([t, on]) => <li key={t} data-on={on || undefined}><i>{on && <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 6.2l2 2 4-4.4" /></svg>}</i>{t}</li>)}
          </ul>
        </div>
      </Ui>
    </>
  );
}

/* ── Whiteboards: night, a window over the rooftops, the whiteboard pinned to the wall over the desk ── */

const STARS: P[] = [[262, 60], [300, 44], [352, 70], [372, 122], [284, 102], [338, 148], [250, 130], [366, 40]];
const W = {
  moon: `${cut(oval(326, 92, 22, 22, 26), 30, 0.6)}`,
  moonBite: cut(oval(336, 86, 19, 19, 24), 31, 0.5),
  roofs: cut([[220, 250], [220, 206], [246, 206], [246, 190], [262, 176], [278, 190], [278, 214], [306, 214], [306, 196], [334, 196], [334, 184], [346, 170], [358, 184], [358, 208], [400, 208], [440, 208], [440, 300], [220, 300]], 32, 0.7),
  roofs2: cut([[220, 260], [220, 226], [258, 226], [258, 236], [290, 236], [290, 222], [326, 222], [326, 232], [360, 232], [360, 218], [440, 218], [440, 300], [220, 300]], 33, 0.7),
  hole: cut(rect(236, 30, 150, 214), 34, 0.9),
  frame: `${cut(rect(228, 22, 166, 230), 35, 0.7)} ${cut(rect(238, 32, 146, 210), 36, 0.6)}`,
  bar: cut(rect(306, 32, 7, 210), 37, 0.4),
  desk: cut([[-40, 350], [440, 350], [440, 500], [-40, 500]], 38, 1.1),
  deskEdge: cut([[-40, 350], [440, 350], [440, 358], [-40, 358]], 39, 0.6),
  mug: cut([[318, 318], [350, 318], [348, 356], [320, 356]], 48, 0.5),
  pencil: cut([[150, 372], [244, 362], [246, 368], [152, 378]], 49, 0.3),
  tip: cut([[244, 362], [256, 364], [246, 368]], 50, 0.2),
};
const FLOW = publishingFlow();
const PAPER = cut(rect(-14, -18, 328, 380), 51, 1.1, 10);

export function BoardScene() {
  let n = 0;
  return (
    <>
      <Plane z={2.6} shade={false}>
        <rect x="-60" y="-60" width="520" height="560" fill="#2a3150" />
        {STARS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 1.3 : 1.9} fill="#f6e3b8" opacity="0.85" />)}
        <path d={W.moon} fill="#f7e6bd" />
        <path d={W.moonBite} fill="#2a3150" />
        <path d={W.roofs} fill="#222842" />
        {[[252, 200], [268, 196], [318, 206], [344, 194], [380, 214]].map(([x, y], i) => <rect key={i} x={x} y={y} width="5" height="6" fill="#f2b45a" />)}
        <path d={W.roofs2} fill="#1a1f35" />
      </Plane>
      <Plane z={1.8}>
        <path d={wall(W.hole)} fill="#3c3754" fillRule="evenodd" />
        <path d={W.frame} fill="#2e2a43" fillRule="evenodd" />
        <path d={W.bar} fill="#2e2a43" />
      </Plane>
      <Ui z={1.15} className={s.sheetAt}>
        <svg className={s.pinned} viewBox="-30 -36 360 410" role="img" aria-label="A whiteboard called Publishing flow, drawn by hand: Idea, then Draft, then Ready? If yes, Publish. If no, Fix it.">
          <path d={PAPER} fill="#fffdf8" />
          <g fill="none">
            {FLOW.map((sh, k) => (
              <g key={k}>
                {sh.fill && <path d={sh.fill.d} fill={sh.fill.color} />}
                {sh.strokes.map((d, j) => <path key={j} className={s.stroke} d={d} style={{ "--s": n++ } as React.CSSProperties} />)}
                {sh.label && <text className={s.hand} x={sh.label.x} y={sh.label.y}>{sh.label.text}</text>}
              </g>
            ))}
          </g>
          <circle cx="150" cy="-6" r="9" fill="#d4553a" />
          <circle cx="147" cy="-9" r="3" fill="#f08a6f" />
        </svg>
      </Ui>
      <Plane z={0.7}>
        <path d={W.desk} fill="#5b3d28" />
        <path d={W.deskEdge} fill="#7a5235" />
      </Plane>
      <Plane z={0.7}>
        <path d={W.mug} fill="#d97a3a" />
        <path d={W.pencil} fill="#f0b43c" />
        <path d={W.tip} fill="#3a2a1c" />
      </Plane>
    </>
  );
}

/* ── Apps: a café by the water in the morning, a table with coffee, the habit tracker on a phone ── */

const A = {
  water: cut([[-40, 196], [440, 196], [440, 300], [-40, 300]], 60, 0.6),
  shore: cut([[-40, 198], [-40, 178], [20, 178], [20, 160], [40, 160], [40, 150], [48, 136], [56, 150], [56, 168], [100, 168], [100, 176], [140, 176], [140, 156], [176, 156], [176, 172], [230, 172], [230, 164], [262, 150], [292, 164], [292, 174], [330, 174], [330, 140], [338, 126], [346, 140], [346, 170], [440, 170], [440, 198]], 61, 0.6),
  glints: [cut(rect(60, 222, 46, 3), 62, 0.3), cut(rect(250, 238, 62, 3), 63, 0.3), cut(rect(150, 262, 34, 3), 64, 0.3)],
  hole: cut(rect(26, 60, 348, 220), 65, 0.9),
  bar: cut(rect(196, 60, 8, 220), 66, 0.4),
  awning: Array.from({ length: 9 }, (_, i) => {
    const x = -50 + i * 56, pts: P[] = [[x, -60], [x + 56, -60], [x + 56, 74]];
    for (let k = 1; k < 8; k++) { const a = (k / 8) * Math.PI; pts.push([x + 28 + 28 * Math.cos(a), 74 + 14 * Math.sin(a)]); }
    pts.push([x, 74]);
    return { d: cut(pts, 70 + i, 0.6, 8), c: i % 2 ? "#fbf1e3" : "#e8864a" };
  }),
  top: cut(oval(200, 360, 230, 52, 44), 80, 0.8),
  edge: cut([...oval(200, 366, 230, 52, 22, 0, Math.PI)], 81, 0.7),
  saucer: cut(oval(70, 346, 40, 10, 24), 82, 0.4),
  cup: cut([[46, 314], [94, 314], [88, 344], [52, 344]], 83, 0.4),
  coffee: cut(oval(70, 315, 23, 5, 18), 84, 0.3),
  handle: `${cut(oval(98, 326, 9, 9, 18), 85, 0.3)} ${cut(oval(98, 326, 4.5, 4.5, 14), 86, 0.3)}`,
  plate: cut(oval(334, 352, 46, 12, 26), 87, 0.4),
  bun: cut(oval(334, 336, 28, 16, 26), 88, 0.6),
  swirl: cut(oval(336, 332, 14, 7, 20), 89, 0.4),
  swirl2: cut(oval(337, 331, 6, 3, 14), 90, 0.3),
};

export function AppsScene() {
  const week = ["M", "T", "W", "T", "F", "S", "S"];
  const rows: [string, string, boolean, boolean][] = [
    ["Morning walk", "5 days in a row", true, false],
    ["Read 20 pages", "4 of 7 this week", true, false],
    ["Gym", "Logged by Claude", true, true],
    ["No phone after 22", "3 of 7 this week", false, false],
    ["Stretch", "2 of 7 this week", false, false],
    ["Water, 8 glasses", "6 days in a row", false, false],
  ];
  return (
    <>
      <Plane z={2.6} shade={false}>
        <rect x="-60" y="-60" width="520" height="560" fill="#fbe1c0" />
        <path d={A.shore} fill="#d7ad84" />
        <path d={A.water} fill="#a8c6c2" />
        {A.glints.map((d, i) => <path key={i} d={d} fill="#eef3e8" />)}
      </Plane>
      <Plane z={1.8}>
        <path d={wall(A.hole)} fill="#5f7f6a" fillRule="evenodd" />
        <path d={A.bar} fill="#4f6c59" />
      </Plane>
      <Plane z={1.45}>
        {A.awning.map((a, i) => <path key={i} d={a.d} fill={a.c} />)}
      </Plane>
      <Plane z={1.05}>
        <path d={A.edge} fill="#d7bf9d" />
        <path d={A.top} fill="#f6e9d6" />
        <path d={A.saucer} fill="#fffaf3" />
        <path d={A.handle} fill="#fffaf3" fillRule="evenodd" />
        <path d={A.cup} fill="#fffaf3" />
        <path d={A.coffee} fill="#7a4a2a" />
        <path d={A.plate} fill="#fffaf3" />
        <path d={A.bun} fill="#d59a5a" />
        <path d={A.swirl} fill="#b97a3e" />
        <path d={A.swirl2} fill="#e3b277" />
      </Plane>
      <Ui z={0.45} className={s.phoneAt}>
        <div className={s.phone}>
          <div className={s.app} role="img" aria-label="The Habit tracker app: today, three of six habits done; Claude logged the gym.">
            <p className={s.aTop}><b>Habit tracker</b><span>App</span></p>
            <p className={s.aTitle}>Today</p>
            <div className={s.aWeek}>{week.map((w, k) => <span key={k} data-on={k < 4 ? "" : undefined} data-now={k === 3 ? "" : undefined}><small>{w}</small><i /></span>)}</div>
            <ul className={s.aList}>
              {rows.map(([t, sub, done, ai]) => (
                <li key={t} data-ai={ai ? "" : undefined}>
                  <span><b>{t}</b><small>{ai ? <><AIGlyph name="claude" size={9} color="#d97757" /> {sub}</> : sub}</small></span>
                  <i data-on={done ? "" : undefined}><svg viewBox="0 0 16 16"><path d="M4 8.4l2.6 2.6L12 5.4" /></svg></i>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Ui>
    </>
  );
}
