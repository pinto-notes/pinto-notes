"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { curve, head, rng } from "./hand";
import { along, at, frozenAt, mix, mj, place, seg, useShow, type Pt } from "./show";
import { COOKED, DAYS, DINNERS, Flag, Folder, GOAL, GPT, hand, NEW_RECIPE, nodeWords, RECIPES, Receipt, shape, Tick, TODAY, YOU, type Arrow, type Node } from "./Things";
import s from "./s.module.css";

// The climax, staged. The request types in. ChatGPT's cursor reads the decision it remembered, then
// makes each change in place, in turn: a recipe in your Recipes folder, Friday filled in on next
// week's whiteboard (the day first, then its arrow to the shopping list draws itself, the way
// Claude's did in Draw), and next week in the app. Each change carries its own "Added by ChatGPT ·
// Undo" under it. Then your cursor presses Undo on the app's change: that row leaves, and the rest
// holds. Redo brings it back. Each card sits in its chapter's colour, the three of one height, and a
// change opens its row in place. Under the request, one line says what it remembered: "It knows you
// decided to cook at home five nights." On a phone it does one thing at a time: the request in one
// line, that line, then one card, which steps note, board, app (a slow crossfade, about 3 s each),
// each showing its one change with the mark and Undo. The card's height is locked (each change's room
// is kept from the start), so it never jumps between steps. Under it, a short caption names where the
// change is ("In your note"), with three small dots. No cursors and no Undo performance there, and
// the card keeps stepping after the show.
// Everything is a function of the show's time t (see show.ts), so stills are exact.

const REQ = "“Plan next week’s dinners from my recipes.”";

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

      const next: Snap = {
        n: Math.round(seg(t, P.type[0], P.type[1]) * REQ.length),
        read: t >= P.read[0] && t < P.land[0] + 1.4,
        fill: t >= P.fill,
        land: P.land.map((a) => t >= a),
        rec: P.rec.map((a) => t >= a),
        undo: t >= P.undo,
        press: t >= P.press && t < P.press + 0.16,
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
        <p className={s.askSub}>It knows you decided to <span data-at="decided" className={s.askNoCar} data-on={snap.read || snap.land[0] || undefined}>cook at home five nights</span>.</p>
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

type Lay = { view: [number, number]; font: number; day: number; dayBeside?: boolean; nodes: Node[]; arrows: Arrow[]; claude: Arrow; gpt: Arrow; fri: number };

// Next week, the board from Draw, folded to fit: the days in two rows, Wednesday's arrow and Claude's
// orange one still running to the shopping list. ChatGPT fills in Friday, then draws its arrow.
const WIDE: Lay = {
  view: [520, 290], font: 18.5, day: 16.5, fri: 4,
  nodes: [
    { kind: "box", c: [88, 44], w: 156, h: 62, day: "Mon", label: ["Lemon chicken"] },
    { kind: "box", c: [258, 44], w: 156, h: 62, day: "Tue", label: ["Lentil soup"] },
    { kind: "box", c: [428, 44], w: 156, h: 62, day: "Wed", label: ["Shakshuka"] },
    { kind: "box", c: [88, 130], w: 156, h: 62, day: "Thu", label: ["Chickpea curry"] },
    { kind: "box", c: [258, 130], w: 156, h: 62, day: "Fri", label: [], open: true },
    { kind: "box", c: [230, 238], w: 220, h: 52, label: ["Shopping list"] },
    { kind: "ellipse", c: [440, 238], w: 150, h: 64, label: ["5 nights", "at home"], size: 16.5 },
  ],
  arrows: [{ a: [424, 77], c1: [414, 150], c2: [372, 198], b: [338, 216] }],
  claude: { a: [92, 163], c1: [96, 186], c2: [122, 202], b: [148, 210] },
  gpt: { a: [262, 163], c1: [266, 180], c2: [258, 196], b: [250, 210] },
};
// The same, standing up, for a phone: the days in a column, the shopping list beside them.
const TALL: Lay = {
  view: [340, 304], font: 17, day: 15, dayBeside: true, fri: 4,
  nodes: [
    { kind: "box", c: [118, 24], w: 152, h: 38, day: "Mon", label: ["Lemon chicken"] },
    { kind: "box", c: [118, 72], w: 152, h: 38, day: "Tue", label: ["Lentil soup"] },
    { kind: "box", c: [118, 120], w: 152, h: 38, day: "Wed", label: ["Shakshuka"] },
    { kind: "box", c: [118, 168], w: 152, h: 38, day: "Thu", label: ["Chickpea curry"] },
    { kind: "box", c: [118, 216], w: 152, h: 38, day: "Fri", label: [], open: true },
    { kind: "box", c: [276, 120], w: 108, h: 204, label: ["Shopping", "list", "", "lemons", "lentils", "eggs", "chickpeas"], size: 15.5 },
    { kind: "ellipse", c: [170, 278], w: 230, h: 46, label: ["5 nights at home"], size: 15.5 },
  ],
  arrows: [
    { a: [196, 24], c1: [204, 25], c2: [212, 28], b: [220, 33] },
    { a: [196, 72], c1: [204, 72], c2: [212, 72], b: [220, 72] },
    { a: [196, 120], c1: [204, 120], c2: [212, 120], b: [220, 120] },
  ],
  claude: { a: [196, 168], c1: [204, 168], c2: [212, 167], b: [220, 165] },
  gpt: { a: [196, 216], c1: [204, 216], c2: [212, 213], b: [220, 208] },
};

const cubic = (a: Arrow) => `M${a.a[0]} ${a.a[1]} C${a.c1[0]} ${a.c1[1]} ${a.c2[0]} ${a.c2[1]} ${a.b[0]} ${a.b[1]}`;

function BoardObj({ tall }: { tall: boolean }) {
  const g = tall ? TALL : WIDE;
  const r = rng(tall ? 61 : 43);
  const fri = g.nodes[g.fri];
  const filled: Node = { ...fri, open: false, label: [NEW_RECIPE[0]] };
  return (
    <div className={s.aBoardWrap}>
      <svg className={`${s.aBoard} ${hand.className}`} viewBox={`0 0 ${g.view[0]} ${g.view[1]}`} aria-hidden="true">
        <g className={s.chalk}>
          {g.nodes.map((n, i) => <path key={i} d={shape(r, n)} data-open={n.open || undefined} />)}
          {g.arrows.map((a, i) => <g key={i}><path d={curve(r, a.a, a.c1, a.c2, a.b, 1.5)} /><path d={head(r, a.c2, a.b, 8)} /></g>)}
        </g>
        <g className={s.chalkClaudeSm}><path d={curve(r, g.claude.a, g.claude.c1, g.claude.c2, g.claude.b, 1)} /><path d={head(r, g.claude.c2, g.claude.b, 8)} /></g>
        {g.nodes.map((n, i) => nodeWords(g, n, i))}
        {/* ChatGPT's addition: Friday filled in, then its arrow to the shopping list draws itself. */}
        <g className={s.aAdd}>
          <g className={s.aBox}>
            <rect x={fri.c[0] - fri.w / 2} y={fri.c[1] - fri.h / 2} width={fri.w} height={fri.h} rx="12" fill={GPT} fillOpacity="0.26" />
            <g className={s.chalkGpt}><path d={shape(r, filled)} pathLength={1} /></g>
            {nodeWords(g, filled, "w", false)}
          </g>
          <path data-at="path" d={cubic(g.gpt)} fill="none" stroke="none" />
          <g className={s.chalkGpt}>
            <path data-at="ink" d={curve(r, g.gpt.a, g.gpt.c1, g.gpt.c2, g.gpt.b, 0.6)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} />
            <path className={s.aHead} d={head(r, g.gpt.c2, g.gpt.b, 8)} />
          </g>
        </g>
      </svg>
    </div>
  );
}

/** The tracker Build made: this week, four of five, and the row ChatGPT adds for next week. */
function AppObj() {
  const cooked = COOKED.map((v, i) => v || i === TODAY);
  const n = cooked.filter(Boolean).length;
  return (
    <div className={s.aApp}>
      <p className={s.aAppTop}><b>Home cooking</b><span>App</span></p>
      <p className={s.aStat}><b>{n}</b> of {GOAL}<small>this week</small></p>
      <div className={s.aPips} aria-hidden="true">{Array.from({ length: GOAL }, (_, i) => <i key={i} data-on={i < n || undefined} />)}</div>
      <ul className={s.aNights}>
        {DAYS.map((d, i) => (
          <li key={d} data-now={i === TODAY || undefined} data-off={!cooked[i] || undefined} data-early={i < 2 || undefined}>
            <small>{d}</small><span>{DINNERS[i]}</span><i data-on={cooked[i] || undefined}><Tick /></i>
          </li>
        ))}
      </ul>
      <div className={`${s.aGrow} ${s.aNewRow}`}>
        <div>
          <div className={s.aHabit}>
            <p><span data-at="slot2"><b className={s.sweep} />Next week</span><small>{GOAL} planned</small></p>
            <div className={s.aWeek}>{DAYS.map((d) => <i key={d} data-plan><Tick /></i>)}</div>
          </div>
        </div>
      </div>
      {/* The app's own row for tonight's dinner (shown on a phone, where the card has the room). */}
      <p className={s.aAddRow} aria-hidden="true"><span>Tonight’s dinner</span><b>Save</b></p>
    </div>
  );
}
