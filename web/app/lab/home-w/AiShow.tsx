"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { curve, head, rng } from "./hand";
import { along, at, frozenAt, mix, mj, place, seg, useShow, type Pt } from "./show";
import { COOK_HABIT, Flag, Folder, GPT, hand, NEW_RECIPE, nodeWords, RECIPES, Receipt, shape, Tick, TODAY, WEEK, WRITE_HABIT, YOU, type Arrow, type Node } from "./Things";
import s from "./s.module.css";

// The climax, staged: one request that touches three parts of one life. "Plan my week: dinners, and
// prep for the Studio North call." The request types in. ChatGPT's cursor reads the decision it found
// in your notes, then makes each change in place, in turn: a recipe in your Recipes folder, a step on
// the Studio North whiteboard (its arrow from "Talk again in March" draws itself, the way Claude's did
// in Draw, then the box), and next week's dinners in the habits app. Each change carries its own
// "Added by ChatGPT · Undo" under it. Then your cursor presses Undo on the app's change: that row
// leaves, and the rest holds. Redo brings it back. With Reduce Motion (or `?t`) all three changes
// show, none undone: the end state. Each card sits in its chapter's colour, the three of one height,
// and a change opens its row in place. Under the request, one line says what it read: "It reads what
// you decided: cook at home five nights, and wait until March." On a phone it does one thing at a
// time: the request, that line, then one card, which steps note, board, app (a slow crossfade, about
// 3 s each), each showing its one change with the mark and Undo. The card's height is locked (each
// change's room is kept from the start), so it never jumps between steps. Under it, a short caption
// names where the change is ("In your note"), with three small dots. No cursors and no Undo
// performance there, and the card keeps stepping after the show.
// Everything is a function of the show's time t (see show.ts), so stills are exact.

const REQ = "“Plan my week: dinners, and prep for the Studio North call.”";

type Plan = {
  type: [number, number]; gptIn: number; f1: [number, number]; read: [number, number]; f2: [number, number];
  land: [number, number, number]; rec: [number, number, number]; ride0: number; ride2: number; fill: number;
  f3: [number, number]; draw: [number, number]; f4: [number, number]; gptOut: [number, number];
  youIn: [number, number]; press: number; undo: number; youOut: [number, number]; end: number;
  sw: [number, number];
};
const WIDE_PLAN: Plan = {
  type: [0.5, 2.0], gptIn: 2.2, f1: [2.3, 3.05], read: [3.1, 3.85], f2: [3.9, 4.35],
  land: [4.4, 7.15, 8.6], rec: [4.8, 7.45, 9.0], ride0: 0.5, ride2: 0.45, fill: 5.95,
  f3: [5.05, 5.85], draw: [6.25, 7.1], f4: [7.7, 8.5], gptOut: [9.3, 9.7],
  youIn: [10.2, 10.9], press: 11.0, undo: 11.1, youOut: [12.6, 13.1], end: 13.2,
  sw: [99, 99],
};
// On a phone one card shows at a time: the recipe lands in the folder, then Friday fills in and its
// arrow draws itself, then the app's new row opens. No cursors, and nothing is undone by the show.
const N = 99;
const TALL_PLAN: Plan = {
  type: [0.4, 1.9], gptIn: N, f1: [N, N], read: [1.9, 2.5], f2: [N, N],
  land: [2.5, 7.1, 10.5], rec: [2.8, 7.4, 10.8], ride0: 0, ride2: 0, fill: 6.0,
  f3: [N, N], draw: [6.3, 7.05], f4: [N, N], gptOut: [N, N],
  youIn: [N, N], press: N, undo: N, youOut: [N, N], end: 13.6,
  sw: [5.6, 9.9],
};
/** After the show, the phone's card keeps stepping, this often (ms). */
const STEP = 3400;
/** Where each change is, named under the phone's card. */
const WHERE = ["In your note", "On your whiteboard", "In your app"];

type Snap = { n: number; read: boolean; fill: boolean; land: boolean[]; rec: boolean[]; undo: boolean; press: boolean; active: number };
const same = (a: Snap, b: Snap) => a.n === b.n && a.read === b.read && a.fill === b.fill && a.undo === b.undo && a.press === b.press && a.active === b.active
  && a.land.every((v, i) => v === b.land[i]) && a.rec.every((v, i) => v === b.rec[i]);
const START: Snap = { n: 0, read: false, fill: false, land: [false, false, false], rec: [false, false, false], undo: false, press: false, active: 0 };

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
  const root = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null), gpt = useRef<HTMLSpanElement>(null), you = useRef<HTMLSpanElement>(null);
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
      const st = stage.current, rt = root.current; if (!st || !rt) return;
      const B = st.getBoundingClientRect();
      const q = (k: string) => rt.querySelector(`[data-at="${k}"]`);
      const path = st.querySelector<SVGPathElement>(`[data-at="path"]`);
      const ink = st.querySelector<SVGPathElement>(`[data-at="ink"]`);
      // The arrow ChatGPT draws into the whiteboard, as far as it has got.
      const e = mj(seg(t, P.draw[0], P.draw[1]));
      if (ink) ink.style.strokeDashoffset = String(1 - e);
      st.style.setProperty("--headOn", e > 0.97 ? "1" : "0");

      // A still at the end (Reduce Motion, or `?t`) shows the three changes made, none undone.
      const atEnd = frozenAt("ai") === Infinity;
      const next: Snap = {
        n: Math.round(seg(t, P.type[0], P.type[1]) * REQ.length),
        read: t >= P.read[0] && t < P.land[0] + 1.4,
        fill: t >= P.fill,
        land: P.land.map((a) => t >= a),
        rec: P.rec.map((a) => t >= a),
        undo: t >= P.undo && !atEnd,
        press: t >= P.press && t < P.press + 0.16 && !atEnd,
        active: t < P.sw[0] ? 0 : t < P.sw[1] ? 1 : 2,
      };
      setSnap((o) => (same(o, next) ? o : next));
      if (t >= P.end) setEnded(true);
      if (narrow) { place(gpt.current, null, 0); place(you.current, null, 0); return; }

      // ChatGPT's cursor: from the request to the decision it remembered (read along it), then to each
      // change in turn.
      const ask = at(B, q("ask"), 1, 0.62);
      const dec0 = at(B, q("decided"), 0, 0.86), dec1 = at(B, q("decided"), 1, 0.86);
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
      else if (t < P.f3[0]) g = s0b;
      else if (t < P.f3[1]) g = s0b && p0 && mix(s0b, p0, mj(seg(t, ...P.f3)));
      else if (t < P.draw[0]) g = p0;
      else if (t < P.draw[1]) g = along(B, path, e);
      else if (t < P.f4[0]) g = p1;
      else if (t < P.f4[1]) g = p1 && s2a && mix(p1, s2a, mj(seg(t, ...P.f4)));
      else if (t < P.land[2]) g = s2a;
      else if (t < P.land[2] + P.ride2) g = s2a && s2b && mix(s2a, s2b, mj(seg(t, P.land[2], P.land[2] + P.ride2)));
      else { const k = seg(t, ...P.gptOut); g = s2b && [s2b[0] + 18 * k, s2b[1] + 10 * k]; go = 1 - k; }
      // Its name tag always stays on the page.
      if (g) g = [Math.min(g[0], B.width - 84), g[1]];
      place(gpt.current, g, go);

      // Your cursor comes in from just below and right of Undo (fading in as it moves, so it never
      // points at nothing), presses it, and rests there.
      const undo = at(B, q("undo2")?.querySelector("button"), 0.45, 0.6);
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

  const undone = (i: number) => user[i] ?? (i === 2 && snap.undo);
  const flip = (i: number) => setUser((u) => u.map((v, k) => (k === i ? !undone(i) : v)));
  const active = pick ?? cycle ?? snap.active;
  const objs = [
    <NoteObj key="n" />,
    <BoardObj key="b" tall={narrow} />,
    <AppObj key="a" />,
  ];
  return (
    <div ref={root} className={s.aBody}>
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
        <p className={s.askSub}>It reads what you decided: <span data-at="decided" className={s.askNoCar} data-on={snap.read || snap.land[0] || undefined}>cook at home five nights</span>, and <span className={s.askNoCar} data-on={snap.land[1] || undefined}>wait until March</span>.</p>
      </div>
      </div>
      <div ref={stage} className={s.aStage} style={{ "--headOn": 0 } as React.CSSProperties}>
        <ol className={s.aObjs}>
          {objs.map((o, i) => (
            <li key={i} data-obj className={`${s.aObj} ${[s.aoNote, s.aoBoard, s.aoApp][i]}`} data-land={snap.land[i] || undefined} data-fill={(i === 1 && snap.fill) || undefined}
              data-undone={(snap.land[i] && undone(i)) || undefined} data-current={i === active || undefined} aria-label={["Recipes folder", "Whiteboard", "App"][i]}>
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

/** Your Recipes folder, as the notes list shows it. ChatGPT's new recipe opens a row at the end. */
function NoteObj() {
  return (
    <div className={s.aNote}>
      <p className={s.aNoteTitle}><Folder />Recipes</p>
      <ul className={s.aList}>
        {RECIPES.map(([name, time]) => <li key={name}><b>{name}</b><span>{time}</span></li>)}
      </ul>
      <div className={`${s.aGrow} ${s.aNewRow}`}>
        <div><p className={s.aListAdd}><b data-at="slot0"><i className={s.sweep} />{NEW_RECIPE[0]}</b><span>{NEW_RECIPE[1]}</span></p></div>
      </div>
    </div>
  );
}

type Lay = { view: [number, number]; font: number; nodes: Node[]; arrows: Arrow[]; claude: Arrow; gpt: Arrow; add: Node };

// The decision map from Draw, folded to fit: every shape stays, the path not taken stays dashed,
// Claude's "no" stays orange, and ChatGPT's step for the March call is drawn in under the path.
const WIDE: Lay = {
  view: [520, 290], font: 16,
  nodes: [
    { kind: "ellipse", c: [60, 46], w: 116, h: 64, label: ["Studio North", "offer"], size: 15 },
    { kind: "diamond", c: [206, 46], w: 132, h: 80, label: ["Take it now?"], size: 15 },
    { kind: "box", c: [404, 46], w: 196, h: 60, label: ["Start in January,", "launch half done"], size: 15, faint: true },
    { kind: "box", c: [206, 152], w: 184, h: 58, label: ["Finish the launch,", "ship in February"], size: 15 },
    { kind: "ellipse", c: [410, 152], w: 168, h: 64, label: ["Talk again", "in March"], size: 15 },
  ],
  arrows: [
    { a: [120, 46], c1: [126, 45], c2: [131, 47], b: [137, 46] },
    { a: [274, 46], c1: [282, 45], c2: [292, 47], b: [302, 46], label: ["yes", [288, 33]], faint: true },
    { a: [300, 152], c1: [308, 151], c2: [316, 153], b: [324, 152] },
  ],
  claude: { a: [206, 88], c1: [205, 100], c2: [207, 110], b: [206, 120], label: ["no", [190, 110]] },
  gpt: { a: [404, 186], c1: [400, 234], c2: [366, 252], b: [304, 250] },
  add: { kind: "box", c: [206, 250], w: 192, h: 46, label: ["Questions for Ana"] },
};
// The same, standing up, for a phone: as compact as the words allow.
const TALL: Lay = {
  view: [340, 334], font: 16,
  nodes: [
    { kind: "ellipse", c: [68, 38], w: 130, h: 68, label: ["Studio North", "offer"], size: 15 },
    { kind: "diamond", c: [248, 38], w: 168, h: 76, label: ["Take it now?"], size: 15 },
    { kind: "box", c: [252, 126], w: 172, h: 52, label: ["Start in January,", "launch half done"], size: 15, faint: true },
    { kind: "box", c: [90, 194], w: 172, h: 52, label: ["Finish the launch,", "ship in February"], size: 15 },
    { kind: "ellipse", c: [252, 248], w: 160, h: 58, label: ["Talk again", "in March"], size: 15 },
  ],
  arrows: [
    { a: [135, 38], c1: [144, 37], c2: [153, 39], b: [162, 38] },
    { a: [250, 78], c1: [250, 86], c2: [252, 93], b: [252, 99], label: ["yes", [276, 92]], faint: true },
    { a: [128, 221], c1: [132, 242], c2: [148, 250], b: [170, 249] },
  ],
  claude: { a: [198, 54], c1: [172, 90], c2: [124, 130], b: [104, 166], label: ["no", [118, 106]] },
  gpt: { a: [236, 278], c1: [240, 300], c2: [230, 306], b: [210, 307] },
  add: { kind: "box", c: [110, 306], w: 196, h: 44, label: ["Questions for Ana"] },
};

const cubic = (a: Arrow) => `M${a.a[0]} ${a.a[1]} C${a.c1[0]} ${a.c1[1]} ${a.c2[0]} ${a.c2[1]} ${a.b[0]} ${a.b[1]}`;

function BoardObj({ tall }: { tall: boolean }) {
  const g = tall ? TALL : WIDE;
  const r = rng(tall ? 61 : 43);
  return (
    <div className={s.aBoardWrap}>
      <svg className={`${s.aBoard} ${hand.className}`} viewBox={`0 0 ${g.view[0]} ${g.view[1]}`} aria-hidden="true">
        {[false, true].map((faint) => (
          <g key={String(faint)} className={faint ? `${s.chalk} ${s.chalkFaint}` : s.chalk}>
            {g.nodes.map((n, i) => !!n.faint === faint && <path key={i} d={shape(r, n, 12)} />)}
            {g.arrows.map((a, i) => !!a.faint === faint && <g key={i}><path d={curve(r, a.a, a.c1, a.c2, a.b, 1.5)} /><path d={head(r, a.c2, a.b, 9)} /></g>)}
          </g>
        ))}
        <g className={s.chalkClaudeSm}><path d={curve(r, g.claude.a, g.claude.c1, g.claude.c2, g.claude.b, 1)} /><path d={head(r, g.claude.c2, g.claude.b, 9)} /></g>
        {g.claude.label && <text x={g.claude.label[1][0]} y={g.claude.label[1][1]} fontSize={13.5} textAnchor="middle" className={s.claudeNote}>{g.claude.label[0]}</text>}
        {g.nodes.map((n, i) => nodeWords(n, g.font, i))}
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
            <g className={s.chalkGpt}><path d={shape(r, g.add, 12)} pathLength={1} /></g>
            {nodeWords(g.add, g.font)}
          </g>
        </g>
      </svg>
    </div>
  );
}

/** The habits app Build made: writing ticked today, cooking at home five nights a week from Monday,
 *  and the row ChatGPT adds: next week's dinners, five planned. */
function AppObj() {
  return (
    <div className={s.aApp}>
      <p className={s.aAppTop}><b>Habits</b><span>App</span></p>
      <div className={s.aDays} aria-hidden="true">{WEEK.map((d, i) => <small key={i} data-now={i === TODAY || undefined}>{d}</small>)}</div>
      <div className={s.aHabit}>
        <p><span>{WRITE_HABIT}</span><small>1 day</small></p>
        <div className={s.aWeek}>{WEEK.map((d, i) => <i key={i} data-on={i === TODAY || undefined}><Tick /></i>)}</div>
      </div>
      <div className={s.aHabit}>
        <p><span>{COOK_HABIT}</span><small className={s.aZero}>5 a week</small></p>
        <div className={s.aWeek}>{WEEK.map((d, i) => <i key={i} data-now={i === TODAY || undefined}><Tick /></i>)}</div>
      </div>
      <div className={`${s.aGrow} ${s.aNewRow}`}>
        <div>
          <div className={s.aHabit}>
            <p><span data-at="slot2"><b className={s.sweep} />Dinners next week</span><small>5 planned</small></p>
            <div className={s.aWeek}>{WEEK.map((d, i) => <i key={i} data-plan={i < 5 || undefined}><Tick /></i>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
