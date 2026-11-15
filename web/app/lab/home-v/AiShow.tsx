"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { box, curve, ellipse, head, line, rng } from "./hand";
import { along, at, frozenAt, mix, mj, place, seg, useShow, type Pt } from "./show";
import { ADDED, Flag, GPT, hand, Receipt, Tick, TITLE, TODAY, WEEK, YOU } from "./Things";
import s from "./s.module.css";

// The climax, staged. The request types in. ChatGPT's cursor reads the decision in the note, then
// makes each change in place, in turn: a line in the note, a step drawn into the whiteboard (its
// arrow draws itself, the way Claude's did in Draw), a habit in the app. Each change carries its own
// "Added by ChatGPT · Undo" under it. Then your cursor presses Undo on the whiteboard's new step: that
// step leaves, and the rest holds. Redo brings it back. Each card sits in its chapter's colour, the three of one height,
// and a change opens its row in place. Under the request, one line says what it remembered: "It knows
// you decided to wait until March." On a phone it does one thing at a time: the request, that line,
// then one card, which steps note, board, app (a slow crossfade, about 3 s each), each showing its one
// change with the mark and Undo. The card's height is locked (each change's room is kept from the
// start), so it never jumps between steps. Under it, a short caption names where the change is ("In
// your note"), with three small dots. No cursors and no Undo performance there, and the card keeps
// stepping after the show.
// Everything is a function of the show's time t (see show.ts), so stills are exact.

const REQ = "“Prep me for the Studio North call in March.”";

type Plan = {
  type: [number, number]; gptIn: number; f1: [number, number]; read: [number, number]; f2: [number, number];
  land: [number, number, number]; rec: [number, number, number]; ride0: number; ride2: number;
  f3: [number, number]; draw: [number, number]; f4: [number, number]; gptOut: [number, number];
  youIn: [number, number]; press: number; undo: number; youOut: [number, number]; end: number;
  sw: [number, number]; gone: [number, number][]; back: number[];
};
const WIDE_PLAN: Plan = {
  type: [0.5, 2.0], gptIn: 2.2, f1: [2.3, 3.05], read: [3.1, 3.75], f2: [3.8, 4.2],
  land: [4.25, 6.95, 8.4], rec: [4.65, 7.25, 8.8], ride0: 0.5, ride2: 0.45,
  f3: [4.95, 5.8], draw: [5.9, 6.9], f4: [7.5, 8.3], gptOut: [9.1, 9.5],
  youIn: [10.0, 10.7], press: 10.8, undo: 10.9, youOut: [12.4, 12.9], end: 13,
  sw: [99, 99], gone: [], back: [],
};
// On a phone one card shows at a time: the note's change lands, then the board's arrow draws itself,
// then the app's habit opens. No cursors, and nothing is undone by the show.
const N = 99;
const TALL_PLAN: Plan = {
  type: [0.4, 1.9], gptIn: N, f1: [N, N], read: [1.9, 2.5], f2: [N, N],
  land: [2.5, 6.9, 10.5], rec: [2.8, 7.2, 10.8], ride0: 0, ride2: 0,
  f3: [N, N], draw: [6.0, 6.9], f4: [N, N], gptOut: [N, N],
  youIn: [N, N], press: N, undo: N, youOut: [N, N], end: 13.6,
  sw: [5.6, 9.9], gone: [], back: [],
};
/** After the show, the phone's card keeps stepping, this often (ms). */
const STEP = 3400;
/** Where each change is, named under the phone's card. */
const WHERE = ["In your note", "On your whiteboard", "In your app"];

type Snap = { n: number; read: boolean; land: boolean[]; rec: boolean[]; undo: boolean; press: boolean; active: number };
const same = (a: Snap, b: Snap) => a.n === b.n && a.read === b.read && a.undo === b.undo && a.press === b.press && a.active === b.active
  && a.land.every((v, i) => v === b.land[i]) && a.rec.every((v, i) => v === b.rec[i]);
const START: Snap = { n: 0, read: false, land: [false, false, false], rec: [false, false, false], undo: false, press: false, active: 0 };

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const m = matchMedia("(max-width: 760px)");
    const f = () => setNarrow(m.matches);
    f(); m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return narrow;
}

export function AiShow({ subscribe, title, foot }: { subscribe: (fn: (dwell: number, arrive: number) => void) => () => void; title: React.ReactNode; foot: React.ReactNode }) {
  const narrow = useNarrow();
  const P = narrow ? TALL_PLAN : WIDE_PLAN;
  const stage = useRef<HTMLDivElement>(null), gpt = useRef<HTMLSpanElement>(null), you = useRef<HTMLSpanElement>(null);
  const [snap, setSnap] = useState<Snap>(START);
  const [user, setUser] = useState<(boolean | null)[]>([null, null, null]);
  const [pick, setPick] = useState<number | null>(null);
  const [cycle, setCycle] = useState<number | null>(null);
  const [ended, setEnded] = useState(false);
  const userRef = useRef(user); userRef.current = user;
  // On a phone, once the show has played, the card keeps stepping (never with Reduce Motion or in a
  // still, and not once you've picked one yourself).
  useEffect(() => {
    if (!narrow || !ended || pick !== null || frozenAt("ai") !== null) return;
    const id = setInterval(() => setCycle((c) => ((c ?? 2) + 1) % 3), STEP);
    return () => clearInterval(id);
  }, [narrow, ended, pick]);

  useShow({
    name: "ai", end: P.end, subscribe,
    apply: (t) => {
      const st = stage.current; if (!st) return;
      const B = st.getBoundingClientRect();
      const q = (k: string) => st.querySelector(`[data-at="${k}"]`);
      const path = st.querySelector<SVGPathElement>(`[data-at="path"]`);
      const ink = st.querySelector<SVGPathElement>(`[data-at="ink"]`);
      // The arrow ChatGPT draws into the whiteboard, as far as it has got.
      const e = mj(seg(t, P.draw[0], P.draw[1]));
      if (ink) ink.style.strokeDashoffset = String(1 - e);
      st.style.setProperty("--headOn", e > 0.97 ? "1" : "0");

      const next: Snap = {
        n: Math.round(seg(t, P.type[0], P.type[1]) * REQ.length),
        read: t >= P.read[0] && t < P.land[0] + 1.4,
        land: P.land.map((a) => t >= a),
        rec: P.rec.map((a) => t >= a),
        undo: t >= P.undo,
        press: t >= P.press && t < P.press + 0.16,
        active: t < P.sw[0] ? 0 : t < P.sw[1] ? 1 : 2,
      };
      setSnap((o) => (same(o, next) ? o : next));
      if (t >= P.end) setEnded(true);
      if (narrow) { place(gpt.current, null, 0); place(you.current, null, 0); return; }

      // ChatGPT's cursor.
      const ask = at(B, q("ask"), 1, 0.62);
      const dec0 = at(B, q("decided"), 0, 0.78), dec1 = at(B, q("decided"), 1, 0.78);
      const s0a = at(B, q("slot0"), 0, 0.72), s0b = at(B, q("slot0"), 1, 0.72);
      const s2a = at(B, q("slot2"), 0, 0.72), s2b = at(B, q("slot2"), 1, 0.72);
      const p0 = along(B, path, 0), p1 = along(B, path, 1);
      let g: Pt | null = null, go = 1;
      if (t < P.gptIn) { g = ask; go = 0; }
      else if (t < P.f1[0]) { g = ask; go = (t - P.gptIn) / 0.15; }
      else if (t < P.f1[1]) g = ask && dec0 && mix(ask, dec0, mj(seg(t, ...P.f1)));
      else if (t < P.read[0]) g = dec0;
      else if (t < P.read[1]) g = dec0 && dec1 && mix(dec0, dec1, mj(seg(t, ...P.read)));
      else if (t < P.f2[0]) g = dec1;
      else if (t < P.f2[1]) g = dec1 && s0a && mix(dec1, s0a, mj(seg(t, ...P.f2)));
      else if (t < P.land[0]) g = s0a;
      else if (t < P.land[0] + P.ride0) g = s0a && s0b && mix(s0a, s0b, mj(seg(t, P.land[0], P.land[0] + P.ride0)));
      else if (!narrow && t < P.f3[0]) g = s0b;
      else if (!narrow && t < P.f3[1]) g = s0b && p0 && mix(s0b, p0, mj(seg(t, ...P.f3)));
      else if (narrow && t < P.back[0]) { g = s0b; go = 1 - seg(t, ...P.gone[0]); }
      else if (t < P.draw[0]) { g = p0; go = narrow ? seg(t, P.back[0], P.back[0] + 0.15) : 1; }
      else if (t < P.draw[1]) g = along(B, path, e);
      else if (!narrow && t < P.f4[0]) g = p1;
      else if (!narrow && t < P.f4[1]) g = p1 && s2a && mix(p1, s2a, mj(seg(t, ...P.f4)));
      else if (narrow && t < P.back[1]) { g = p1; go = 1 - seg(t, ...P.gone[1]); }
      else if (narrow && t < P.f4[0]) { g = s2a && [s2a[0] + 40, s2a[1] + 34]; go = seg(t, P.back[1], P.back[1] + 0.15); }
      else if (narrow && t < P.f4[1]) g = s2a && mix([s2a[0] + 40, s2a[1] + 34], s2a, mj(seg(t, ...P.f4)));
      else if (t < P.land[2]) g = s2a;
      else if (t < P.land[2] + P.ride2) g = s2a && s2b && mix(s2a, s2b, mj(seg(t, P.land[2], P.land[2] + P.ride2)));
      else { const k = seg(t, ...P.gptOut); g = s2b && [s2b[0] + 18 * k, s2b[1] + 10 * k]; go = 1 - k; }
      // Its name tag always stays on the page.
      if (g) g = [Math.min(g[0], B.width - 84), g[1]];
      place(gpt.current, g, go);

      // Your cursor comes in from just below and right of Undo (fading in as it moves, so it never
      // points at nothing), presses it, and rests there.
      const undo = at(B, q("undo1")?.querySelector("button"), 0.45, 0.6);
      const from: Pt = undo ? [undo[0] + 70, undo[1] + 84] : [B.width, B.height];
      let y: Pt | null = null, yo = 1;
      if (t < P.youIn[0]) { y = from; yo = 0; }
      else if (t < P.youIn[1]) { y = undo && mix(from, undo, mj(seg(t, ...P.youIn))); yo = seg(t, P.youIn[0], P.youIn[0] + 0.2); }
      else if (t < P.youOut[0]) y = undo;
      else { const k = mj(seg(t, ...P.youOut)); y = undo && [undo[0] + 26 * k, undo[1] + 30 * k]; yo = 1 - k; }
      place(you.current, y, userRef.current.some((v) => v !== null) ? 0 : yo);
      you.current?.toggleAttribute("data-press", next.press);
    },
  });

  const undone = (i: number) => user[i] ?? (i === 1 && snap.undo);
  const flip = (i: number) => setUser((u) => u.map((v, k) => (k === i ? !undone(i) : v)));
  const active = pick ?? cycle ?? snap.active;
  const objs = [
    <NoteObj key="n" read={snap.read} />,
    <BoardObj key="b" tall={narrow} />,
    <AppObj key="a" />,
  ];
  return (
    <div className={s.aBody}>
      <div className={s.aTop}>
      {title}
      <div className={s.askWrap}>
        <p className={s.ask} aria-label={REQ}>
          <span className={s.askMark}><AIGlyph name="openai" size={22} color="#fff" /></span>
          <span className={s.askText} aria-hidden="true">
            {REQ.slice(0, snap.n)}<span data-at="ask" className={s.askCaret} data-done={snap.n >= REQ.length || undefined} />
            <span className={s.askRest}>{REQ.slice(snap.n)}</span>
          </span>
        </p>
        <p className={s.askSub}>It knows you decided to <span className={s.askNoCar} data-on={snap.read || snap.land[0] || undefined}>wait until March</span>.</p>
      </div>
      </div>
      <div ref={stage} className={s.aStage} style={{ "--headOn": 0 } as React.CSSProperties}>
        <ol className={s.aObjs}>
          {objs.map((o, i) => (
            <li key={i} data-obj className={`${s.aObj} ${[s.aoNote, s.aoBoard, s.aoApp][i]}`} data-land={snap.land[i] || undefined}
              data-undone={(snap.land[i] && undone(i)) || undefined} data-current={i === active || undefined} aria-label={["Note", "Whiteboard", "App"][i]}>
              <div className={s.aCard}>
                {o}
                <div className={`${s.aGrow} ${s.aRec}`} data-at={`undo${i}`} data-show={snap.rec[i] || undefined}>
                  <div><Receipt undone={undone(i)} onFlip={() => flip(i)} live={snap.rec[i]} /></div>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <span ref={gpt} className={s.cur} aria-hidden="true"><Flag name="ChatGPT" color={GPT} /></span>
        <span ref={you} className={`${s.cur} ${s.curYou}`} aria-hidden="true"><Flag name="You" color={YOU} /></span>
      </div>
      <div className={s.markers}>
        <p key={active} className={s.markCap} aria-live="polite">{WHERE[active]}</p>
        <div className={s.markDots} role="tablist" aria-label="What ChatGPT changed">
          {["Note", "Whiteboard", "App"].map((n, i) => (
            <button key={n} type="button" role="tab" aria-selected={i === active} aria-label={WHERE[i]} onClick={() => setPick(i)}><i /></button>
          ))}
        </div>
      </div>
      {foot}
    </div>
  );
}

/* ───────────────────────── The three things ───────────────────────── */

function NoteObj({ read }: { read: boolean }) {
  return (
    <div className={s.aNote}>
      <p className={s.aNoteTitle}>{TITLE}</p>
      <p className={s.aWeigh}><b>For:</b> a bigger role, a team to learn from.<br /><b>Against:</b> the launch is six weeks out.</p>
      <p className={s.aDecided}><b>Decided:</b> <span data-at="decided" className={s.aRead} data-on={read || undefined}>Wait until March.</span> Finish the launch first.</p>
      <ul className={s.aRows}>
        <li data-done><i><Tick /></i>Tell Ana by Friday</li>
        <li><i />Finish the launch</li>
      </ul>
      <div className={`${s.aGrow} ${s.aNewRow}`}>
        <div><p className={s.aRowAdd}><i /><span data-at="slot0"><b className={s.sweep} />{ADDED}</span></p></div>
      </div>
    </div>
  );
}

type N = { kind: "ellipse" | "box" | "diamond"; c: Pt; w: number; h: number; t: string[]; size?: number; faint?: boolean };
type A = { a: Pt; c1: Pt; c2: Pt; b: Pt; label?: [string, Pt]; faint?: boolean };
type Lay = { view: [number, number]; font: number; nodes: N[]; arrows: A[]; claude: A; gpt: A; add: N };

// The decision map from Draw, folded to fit: every shape stays, the path not taken stays dashed,
// Claude's "no" stays orange, and ChatGPT's step is drawn in under "Talk again in March".
const WIDE: Lay = {
  view: [520, 290], font: 16,
  nodes: [
    { kind: "ellipse", c: [60, 46], w: 116, h: 64, t: ["Studio North", "offer"], size: 15 },
    { kind: "diamond", c: [206, 46], w: 132, h: 80, t: ["Take it now?"], size: 15 },
    { kind: "box", c: [404, 46], w: 196, h: 60, t: ["Start in January,", "launch half done"], size: 15, faint: true },
    { kind: "box", c: [206, 152], w: 184, h: 58, t: ["Finish the launch,", "ship in February"], size: 15 },
    { kind: "ellipse", c: [410, 152], w: 168, h: 64, t: ["Talk again", "in March"], size: 15 },
  ],
  arrows: [
    { a: [120, 46], c1: [126, 45], c2: [131, 47], b: [137, 46] },
    { a: [274, 46], c1: [282, 45], c2: [292, 47], b: [302, 46], label: ["yes", [288, 33]], faint: true },
    { a: [300, 152], c1: [308, 151], c2: [316, 153], b: [324, 152] },
  ],
  claude: { a: [206, 88], c1: [205, 100], c2: [207, 110], b: [206, 120], label: ["no", [190, 110]] },
  gpt: { a: [404, 186], c1: [400, 234], c2: [366, 252], b: [304, 250] },
  add: { kind: "box", c: [206, 250], w: 192, h: 46, t: ["Show Ana the launch"] },
};
// The same, standing up, for a phone: as compact as the words allow.
const TALL: Lay = {
  view: [340, 334], font: 16,
  nodes: [
    { kind: "ellipse", c: [68, 38], w: 130, h: 68, t: ["Studio North", "offer"], size: 15 },
    { kind: "diamond", c: [248, 38], w: 168, h: 76, t: ["Take it now?"], size: 15 },
    { kind: "box", c: [252, 126], w: 172, h: 52, t: ["Start in January,", "launch half done"], size: 15, faint: true },
    { kind: "box", c: [90, 194], w: 172, h: 52, t: ["Finish the launch,", "ship in February"], size: 15 },
    { kind: "ellipse", c: [252, 248], w: 160, h: 58, t: ["Talk again", "in March"], size: 15 },
  ],
  arrows: [
    { a: [135, 38], c1: [144, 37], c2: [153, 39], b: [162, 38] },
    { a: [250, 78], c1: [250, 86], c2: [252, 93], b: [252, 99], label: ["yes", [276, 92]], faint: true },
    { a: [128, 221], c1: [132, 242], c2: [148, 250], b: [170, 249] },
  ],
  claude: { a: [198, 54], c1: [172, 90], c2: [124, 130], b: [104, 166], label: ["no", [118, 106]] },
  gpt: { a: [236, 278], c1: [240, 300], c2: [230, 306], b: [210, 307] },
  add: { kind: "box", c: [110, 306], w: 196, h: 44, t: ["Show Ana the launch"] },
};

function shapeOf(r: () => number, n: N) {
  if (n.kind === "ellipse") return ellipse(r, n.c[0], n.c[1], n.w / 2, n.h / 2);
  if (n.kind === "box") return box(r, n.c[0] - n.w / 2, n.c[1] - n.h / 2, n.w, n.h, 12);
  const [x, y] = n.c, T: Pt = [x, y - n.h / 2], R: Pt = [x + n.w / 2, y], Bt: Pt = [x, y + n.h / 2], L: Pt = [x - n.w / 2, y];
  return [line(r, ...T, ...R, 2), line(r, ...R, ...Bt, 2), line(r, ...Bt, ...L, 2), line(r, ...L, ...T, 2)].join(" ");
}
const words = (n: N, font: number) => {
  const size = n.size ?? font;
  return (
    <text x={n.c[0]} y={n.c[1] + size * 0.34 - (n.t.length - 1) * size * 0.55} fontSize={size} textAnchor="middle" className={n.faint ? `${s.chalkText} ${s.chalkTextFaint}` : s.chalkText}>
      {n.t.map((l, j) => <tspan key={j} x={n.c[0]} dy={j ? size * 1.1 : 0}>{l}</tspan>)}
    </text>
  );
};
const cubic = (a: A) => `M${a.a[0]} ${a.a[1]} C${a.c1[0]} ${a.c1[1]} ${a.c2[0]} ${a.c2[1]} ${a.b[0]} ${a.b[1]}`;

function BoardObj({ tall }: { tall: boolean }) {
  const g = tall ? TALL : WIDE;
  const r = rng(tall ? 61 : 43);
  return (
    <div className={s.aBoardWrap}>
      <svg className={`${s.aBoard} ${hand.className}`} viewBox={`0 0 ${g.view[0]} ${g.view[1]}`} aria-hidden="true">
        {[false, true].map((faint) => (
          <g key={String(faint)} className={faint ? `${s.chalk} ${s.chalkFaint}` : s.chalk}>
            {g.nodes.map((n, i) => !!n.faint === faint && <path key={i} d={shapeOf(r, n)} />)}
            {g.arrows.map((a, i) => !!a.faint === faint && <g key={i}><path d={curve(r, a.a, a.c1, a.c2, a.b, 1.5)} /><path d={head(r, a.c2, a.b, 9)} /></g>)}
          </g>
        ))}
        <g className={s.chalkClaudeSm}><path d={curve(r, g.claude.a, g.claude.c1, g.claude.c2, g.claude.b, 1)} /><path d={head(r, g.claude.c2, g.claude.b, 9)} /></g>
        {g.claude.label && <text x={g.claude.label[1][0]} y={g.claude.label[1][1]} fontSize={13.5} textAnchor="middle" className={s.claudeNote}>{g.claude.label[0]}</text>}
        {g.nodes.map((n, i) => <g key={i}>{words(n, g.font)}</g>)}
        {g.arrows.map((a, i) => a.label && <text key={i} x={a.label[1][0]} y={a.label[1][1]} fontSize={13.5} textAnchor="middle" className={a.faint ? `${s.chalkNote} ${s.chalkTextFaint}` : s.chalkNote}>{a.label[0]}</text>)}
        {/* ChatGPT's addition: the arrow draws itself from "Talk again in March", then the box and its words. */}
        <g className={s.aAdd}>
          <path data-at="path" d={cubic(g.gpt)} fill="none" stroke="none" />
          <g className={s.chalkGpt}>
            <path data-at="ink" d={curve(r, g.gpt.a, g.gpt.c1, g.gpt.c2, g.gpt.b, 0.6)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} />
            <path className={s.aHead} d={head(r, g.gpt.c2, g.gpt.b, 9)} />
          </g>
          <g className={s.aBox}>
            <rect x={g.add.c[0] - g.add.w / 2} y={g.add.c[1] - g.add.h / 2} width={g.add.w} height={g.add.h} rx="12" fill={GPT} fillOpacity="0.26" />
            <g className={s.chalkGpt}><path d={shapeOf(r, g.add)} pathLength={1} /></g>
            {words(g.add, g.font)}
          </g>
        </g>
      </svg>
    </div>
  );
}

function AppObj() {
  return (
    <div className={s.aApp}>
      <p className={s.aAppTop}><b>Mornings</b><span>App</span></p>
      <div className={s.aDays} aria-hidden="true">{WEEK.map((d, i) => <small key={i} data-now={i === TODAY || undefined}>{d}</small>)}</div>
      <div className={s.aHabit}>
        <p><span>Write 30 min before work</span><small>1 day</small></p>
        <div className={s.aWeek}>{WEEK.map((d, i) => <i key={i} data-on={i === TODAY || undefined}><Tick /></i>)}</div>
      </div>
      <div className={`${s.aGrow} ${s.aNewRow}`}>
        <div>
          <div className={s.aHabit}>
            <p><span data-at="slot2"><b className={s.sweep} />Prep for the call, 10 min</span><small>Until March</small></p>
            <div className={s.aWeek}>{WEEK.map((d, i) => <i key={i} data-now={i === TODAY || undefined}><Tick /></i>)}</div>
          </div>
        </div>
      </div>
      {/* The app's own add row (shown on a phone, where the card has the room). */}
      <p className={s.aAddRow} aria-hidden="true"><span>Add a habit</span><b>Add</b></p>
    </div>
  );
}
