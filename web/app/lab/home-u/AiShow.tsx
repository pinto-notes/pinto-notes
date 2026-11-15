"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { box, curve, ellipse, head, line, rng } from "./hand";
import { along, at, frozenAt, mix, mj, place, seg, useShow, type Pt } from "./show";
import { ADDED, Flag, GPT, hand, Receipt, Tick, TODAY, WEEK, YOU } from "./Things";
import s from "./u.module.css";

// The climax, staged. The request types in. ChatGPT's cursor reads the decision in the note, then
// makes each change in place, in turn: a line in the note, a step drawn into the whiteboard (its
// arrow draws itself, the way Claude's did in Draw), a habit in the app. Each change carries its own
// "Added by ChatGPT · Undo" under it. Then your cursor presses Undo on the habit: that row leaves, and
// the rest holds. Redo brings it back. Each card sits in its chapter's colour, the three of one height,
// and a change opens its row in place. On a phone it does one thing at a time: the request in one
// line, then one card, which steps note, board, app (a slow crossfade, about 3 s each), each showing
// its one change with the mark and Undo. No cursors and no Undo performance there; three small dots
// are the only progress, and the card keeps stepping after the show.
// Everything is a function of the show's time t (see show.ts), so stills are exact.

const REQ = "“Add a day in Sintra to my Lisbon trip.”";

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
  youIn: [9.7, 10.7], press: 10.8, undo: 10.9, youOut: [12.4, 12.9], end: 13,
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

      // Your cursor, from off the stage to Undo, and resting there.
      const undo = at(B, q("undo2")?.querySelector("button"), 0.45, 0.6);
      const from: Pt = [B.width + 30, B.height + 40];
      let y: Pt | null = null, yo = 1;
      if (t < P.youIn[0]) { y = from; yo = 0; }
      else if (t < P.youIn[1]) { y = undo && mix(from, undo, mj(seg(t, ...P.youIn))); yo = seg(t, P.youIn[0], P.youIn[0] + 0.2); }
      else if (t < P.youOut[0]) y = undo;
      else { const k = mj(seg(t, ...P.youOut)); y = undo && [undo[0] + 26 * k, undo[1] + 30 * k]; yo = 1 - k; }
      place(you.current, y, userRef.current.some((v) => v !== null) ? 0 : yo);
      you.current?.toggleAttribute("data-press", next.press);
    },
  });

  const undone = (i: number) => user[i] ?? (i === 2 && snap.undo);
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
        <p className={s.askSub}>One request in ChatGPT. It knows you decided on no car, changes all three, and says so.</p>
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
      <div className={s.markers} role="tablist" aria-label="What ChatGPT changed">
        {["Note", "Whiteboard", "App"].map((n, i) => (
          <button key={n} type="button" role="tab" aria-selected={i === active} aria-label={n} onClick={() => setPick(i)}><i /></button>
        ))}
      </div>
      {foot}
    </div>
  );
}

/* ───────────────────────── The three things ───────────────────────── */

function NoteObj({ read }: { read: boolean }) {
  return (
    <div className={s.aNote}>
      <p className={s.aNoteTitle}>Lisbon, May 8–12</p>
      <p className={s.aDecided}><b>Decided:</b> <span data-at="decided" className={s.aRead} data-on={read || undefined}>No car this time.</span> Trains and trams.</p>
      <ul className={s.aRows}>
        <li data-done><i><Tick /></i>Book the flights</li>
        <li><i />Find a flat in Alfama</li>
        <li><i />Pastéis de Belém, early</li>
        <li><i />Tram 28 before nine</li>
        <li><i />Ask Marta about the fado place</li>
      </ul>
      <div className={`${s.aGrow} ${s.aNewRow}`}>
        <div><p className={s.aRowAdd}><i /><span data-at="slot0"><b className={s.sweep} />{ADDED}</span></p></div>
      </div>
    </div>
  );
}

type N = { kind: "ellipse" | "box" | "diamond"; c: Pt; w: number; h: number; t: string[]; size?: number };
type A = { a: Pt; c1: Pt; c2: Pt; b: Pt; label?: [string, Pt] };
type Lay = { view: [number, number]; font: number; nodes: N[]; arrows: A[]; claude: A; gpt: A; add: N };

// Friday in Lisbon, the board from Draw, folded to fit: every branch stays, Claude's arrow stays
// orange, and ChatGPT's Saturday is drawn in at the bottom left.
const WIDE: Lay = {
  view: [520, 290], font: 17,
  nodes: [
    { kind: "ellipse", c: [70, 40], w: 128, h: 50, t: ["Land 10:40"] },
    { kind: "box", c: [238, 40], w: 164, h: 46, t: ["Bags to Alfama"] },
    { kind: "diamond", c: [426, 40], w: 144, h: 72, t: ["Raining?"], size: 16 },
    { kind: "box", c: [306, 148], w: 150, h: 46, t: ["Tile museum"] },
    { kind: "box", c: [456, 148], w: 112, h: 62, t: ["Belém by", "the river"], size: 16 },
    { kind: "ellipse", c: [346, 244], w: 200, h: 54, t: ["Sunset at Graça"] },
  ],
  arrows: [
    { a: [136, 40], c1: [142, 39], c2: [148, 41], b: [154, 40] },
    { a: [322, 40], c1: [332, 39], c2: [342, 41], b: [352, 40] },
    { a: [394, 64], c1: [378, 82], c2: [350, 104], b: [330, 123], label: ["yes", [344, 84]] },
    { a: [448, 68], c1: [451, 84], c2: [452, 100], b: [454, 115], label: ["no", [472, 94]] },
    { a: [310, 172], c1: [314, 188], c2: [320, 202], b: [326, 216] },
  ],
  claude: { a: [450, 180], c1: [440, 196], c2: [426, 210], b: [412, 222] },
  gpt: { a: [258, 262], c1: [236, 290], c2: [204, 290], b: [188, 254] },
  add: { kind: "box", c: [100, 240], w: 168, h: 50, t: ["Saturday: Sintra"] },
};
// The same, standing up, for a phone.
const TALL: Lay = {
  view: [340, 372], font: 17,
  nodes: [
    { kind: "ellipse", c: [76, 30], w: 132, h: 48, t: ["Land 10:40"] },
    { kind: "box", c: [252, 30], w: 164, h: 44, t: ["Bags to Alfama"] },
    { kind: "diamond", c: [252, 106], w: 128, h: 64, t: ["Raining?"], size: 16 },
    { kind: "box", c: [84, 180], w: 140, h: 44, t: ["Tile museum"] },
    { kind: "box", c: [262, 184], w: 132, h: 56, t: ["Belém by", "the river"], size: 16 },
    { kind: "ellipse", c: [170, 262], w: 200, h: 52, t: ["Sunset at Graça"] },
  ],
  arrows: [
    { a: [143, 30], c1: [152, 29], c2: [162, 31], b: [168, 30] },
    { a: [252, 53], c1: [251, 60], c2: [253, 68], b: [252, 74] },
    { a: [188, 108], c1: [160, 118], c2: [130, 134], b: [112, 157], label: ["yes", [140, 122]] },
    { a: [254, 139], c1: [256, 146], c2: [258, 150], b: [260, 155], label: ["no", [282, 150]] },
    { a: [98, 203], c1: [104, 216], c2: [114, 228], b: [124, 238] },
  ],
  claude: { a: [244, 213], c1: [238, 222], c2: [228, 232], b: [220, 240] },
  gpt: { a: [266, 272], c1: [302, 292], c2: [300, 340], b: [246, 344] },
  add: { kind: "box", c: [150, 342], w: 184, h: 46, t: ["Saturday: Sintra"] },
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
    <text x={n.c[0]} y={n.c[1] + size * 0.34 - (n.t.length - 1) * size * 0.55} fontSize={size} textAnchor="middle" className={s.chalkText}>
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
        <g className={s.chalk}>
          {g.nodes.map((n, i) => <path key={i} d={shapeOf(r, n)} />)}
          {g.arrows.map((a, i) => <g key={i}><path d={curve(r, a.a, a.c1, a.c2, a.b, 1.5)} /><path d={head(r, a.c2, a.b, 9)} /></g>)}
        </g>
        <g className={s.chalkClaudeSm}><path d={curve(r, g.claude.a, g.claude.c1, g.claude.c2, g.claude.b, 1)} /><path d={head(r, g.claude.c2, g.claude.b, 9)} /></g>
        {g.nodes.map((n, i) => <g key={i}>{words(n, g.font)}</g>)}
        {g.arrows.map((a, i) => a.label && <text key={i} x={a.label[1][0]} y={a.label[1][1]} fontSize={13.5} textAnchor="middle" className={s.chalkNote}>{a.label[0]}</text>)}
        {/* ChatGPT's addition: the arrow draws itself from the sunset, then the box and its words. */}
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
      <p className={s.aAppTop}><b>Before Lisbon</b><span>App</span></p>
      <div className={s.aDays} aria-hidden="true">{WEEK.map((d, i) => <small key={i} data-now={i === TODAY || undefined}>{d}</small>)}</div>
      <div className={s.aHabit}>
        <p><span>Portuguese, 10 min</span><small>1 day</small></p>
        <div className={s.aWeek}>{WEEK.map((d, i) => <i key={i} data-on={i === TODAY || undefined}><Tick /></i>)}</div>
      </div>
      <div className={`${s.aGrow} ${s.aNewRow}`}>
        <div>
          <div className={s.aHabit}>
            <p><span data-at="slot2"><b className={s.sweep} />Walk 8,000 steps</span><small>Sintra is all hills</small></p>
            <div className={s.aWeek}>{WEEK.map((d, i) => <i key={i} data-now={i === TODAY || undefined}><Tick /></i>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
