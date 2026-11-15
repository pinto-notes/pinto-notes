"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { curve, head, rng } from "./hand";
import { along, at, frozenAt, mix, mj, place, seg, useShow, type Pt } from "./show";
import { ADDED, boardInk, CALL, Flag, GPT, hand, INK, Receipt, shape, Tick, TODAY, WEEK, words, YOU, type BArrow, type BNode } from "./Things";
import s from "./s.module.css";

// The climax, staged. The request types in ("Prep me for the Studio North call in March"). ChatGPT's
// cursor reads the decision in the note (wait until March), then makes each change in place, in turn:
// a line in the note, a step drawn into the whiteboard (its arrow draws itself, the way Claude's did
// in Draw), a habit in the app. Each change carries its own
// "Added by ChatGPT · Undo" under it. Then your cursor presses Undo on the habit: that row leaves, and
// the rest holds. Redo brings it back. Each card sits in its chapter's colour, the three of one height,
// and a change opens its row in place. Under the request, one line says what it remembered: "It knows
// you decided to wait until March." On a phone it does one thing at a time: the request in one line, that line,
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
        <p className={s.askSub}>It knows you decided <span className={s.askNoCar} data-on={snap.read || snap.land[0] || undefined}>to wait until March</span>.</p>
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
      <p className={s.aNoteTitle}>Job offer: Studio North</p>
      <ul className={s.aRows}>
        {CALL.map((c) => <li key={c} data-dot><i />{c}</li>)}
      </ul>
      <p className={s.aDecided}><b>Decided:</b> <span data-at="decided" className={s.aRead} data-on={read || undefined}>Wait until March.</span> Finish the launch first.</p>
      <div className={`${s.aGrow} ${s.aNewRow}`}>
        <div><p className={s.aRowAdd}><i /><span data-at="slot0"><b className={s.sweep} />{ADDED}</span></p></div>
      </div>
    </div>
  );
}

type Add = { c: Pt; w: number; h: number; label: string[] };
type Lay = { view: [number, number]; font: number; nodes: BNode[]; arrows: BArrow[]; claude: BArrow; gpt: BArrow; add: Add };

// The Studio North map from Draw, folded to fit: the offer and its three options stay, the two not
// taken stay dashed, the path taken runs on to the March call (Claude's arrow stays in Claude's
// colour), and ChatGPT draws in what to ask on that call.
const WIDE: Lay = {
  view: [440, 256], font: 16,
  nodes: [
    { kind: "ellipse", c: [220, 24], w: 140, h: 44, label: ["The offer"] },
    { kind: "box", c: [70, 92], w: 136, h: 42, label: ["Take it now"], off: true },
    { kind: "box", c: [220, 92], w: 150, h: 42, label: ["Wait until March"], on: true },
    { kind: "box", c: [370, 92], w: 136, h: 42, label: ["Say no"], off: true },
    { kind: "box", c: [110, 168], w: 168, h: 42, label: ["Finish the launch"], on: true },
    { kind: "ellipse", c: [334, 168], w: 204, h: 50, label: ["Talk to Ana in March"], on: true },
  ],
  arrows: [
    { a: [162, 34], c1: [120, 48], c2: [84, 58], b: [76, 71], off: true },
    { a: [220, 46], c1: [219, 56], c2: [221, 64], b: [220, 71] },
    { a: [278, 34], c1: [320, 48], c2: [356, 58], b: [364, 71], off: true },
    { a: [198, 114], c1: [184, 128], c2: [156, 138], b: [132, 146] },
  ],
  claude: { a: [196, 168], c1: [206, 167], c2: [218, 169], b: [229, 168] },
  gpt: { a: [284, 191], c1: [272, 214], c2: [252, 232], b: [230, 232] },
  add: { c: [152, 232], w: 150, h: 40, label: ["Ask: team, pay"] },
};
// The same, for a phone, as compact as the words allow.
const TALL: Lay = {
  view: [340, 350], font: 15.5,
  nodes: [
    { kind: "ellipse", c: [170, 24], w: 140, h: 42, label: ["The offer"] },
    { kind: "box", c: [57, 92], w: 106, h: 50, label: ["Take it", "now"], off: true },
    { kind: "box", c: [170, 92], w: 106, h: 50, label: ["Wait until", "March"], on: true },
    { kind: "box", c: [283, 92], w: 106, h: 50, label: ["Say no"], off: true },
    { kind: "box", c: [57, 170], w: 106, h: 50, label: ["Leave mid-", "launch"], off: true },
    { kind: "box", c: [170, 170], w: 106, h: 50, label: ["Finish the", "launch"], on: true },
    { kind: "box", c: [283, 170], w: 106, h: 50, label: ["Stay where", "I am"], off: true },
    { kind: "ellipse", c: [170, 246], w: 200, h: 50, label: ["Talk to Ana in March"], on: true },
  ],
  arrows: [
    { a: [120, 36], c1: [92, 46], c2: [70, 56], b: [64, 66], off: true },
    { a: [170, 46], c1: [169, 52], c2: [171, 60], b: [170, 66] },
    { a: [220, 36], c1: [248, 46], c2: [270, 56], b: [276, 66], off: true },
    { a: [57, 118], c1: [56, 128], c2: [58, 136], b: [57, 144], off: true },
    { a: [170, 118], c1: [169, 128], c2: [171, 136], b: [170, 144] },
    { a: [283, 118], c1: [282, 128], c2: [284, 136], b: [283, 144], off: true },
  ],
  claude: { a: [170, 196], c1: [169, 204], c2: [171, 212], b: [170, 220] },
  gpt: { a: [170, 272], c1: [169, 280], c2: [171, 292], b: [170, 302] },
  add: { c: [170, 324], w: 180, h: 40, label: ["Ask: team, pay"] },
};

const cubic = (a: BArrow) => `M${a.a[0]} ${a.a[1]} C${a.c1[0]} ${a.c1[1]} ${a.c2[0]} ${a.c2[1]} ${a.b[0]} ${a.b[1]}`;

function BoardObj({ tall }: { tall: boolean }) {
  const g = tall ? TALL : WIDE;
  const r = rng(tall ? 61 : 43);
  const add = { kind: "box" as const, ...g.add };
  return (
    <div className={s.aBoardWrap}>
      <svg className={`${s.aBoard} ${hand.className}`} viewBox={`0 0 ${g.view[0]} ${g.view[1]}`} aria-hidden="true">
        {boardInk(g, r, 9, 10)}
        <g className={s.inkClaudeSm}><path d={curve(r, g.claude.a, g.claude.c1, g.claude.c2, g.claude.b, 1)} /><path d={head(r, g.claude.c2, g.claude.b, 8)} /></g>
        {/* ChatGPT's addition: the arrow draws itself from the March call, then the box and its words. */}
        <g className={s.aAdd}>
          <path data-at="path" d={cubic(g.gpt)} fill="none" stroke="none" />
          <g className={s.inkGpt}>
            <path data-at="ink" d={curve(r, g.gpt.a, g.gpt.c1, g.gpt.c2, g.gpt.b, 0.6)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} />
            <path className={s.aHead} d={head(r, g.gpt.c2, g.gpt.b, 8)} />
          </g>
          <g className={s.aBox}>
            <rect x={g.add.c[0] - g.add.w / 2} y={g.add.c[1] - g.add.h / 2} width={g.add.w} height={g.add.h} rx="10" fill={GPT} fillOpacity="0.16" />
            <g className={s.inkGpt}><path d={shape(r, add, 10)} pathLength={1} /></g>
            {words(g.add.c, g.add.label, g.font, INK)}
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
      {/* The second habit Build made (wide screens only, as there). */}
      <div className={s.aHabit} data-wide>
        <p><span>No phone until nine</span><small className={s.aZero}>0 days</small></p>
        <div className={s.aWeek}>{WEEK.map((d, i) => <i key={i} data-now={i === TODAY || undefined}><Tick /></i>)}</div>
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
