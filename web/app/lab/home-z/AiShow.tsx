"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { curve, head, rng } from "./hand";
import { along, at, frozenAt, mix, mj, place, seg, useShow, type Pt } from "./show";
import { COOK_DAYS, COOK_HABIT, DECIDED, DINNERS, Flag, GPT, hand, nodeWords, QUESTIONS, Receipt, shape, Tick, TODAY, WEEK, WRITE_BEFORE, WRITE_GOAL, WRITE_HABIT, YOU, type Arrow, type Node } from "./Things";
import s from "./s.module.css";

// The climax, staged: one request, typed in ChatGPT, that lands in three parts of one life in Pinto.
// Where you ask is ChatGPT, in a small window of its own: its mark and name, and your words in a bubble
// ("Prep for the Studio North call, and plan next week's dinners."). Beside the heading, one line ties
// the two places: "You ask in ChatGPT or Claude. The change lands in your notes." Under the chat, what
// it read: "It reads what you decided: wait until March, and cook at home five nights." The chat, that
// line and where it lands share one left edge. Where it lands is one frame, labelled with Pinto's mark,
// "In your notes", and a line runs to it from the chat once you send. In it, the three things it
// changes, each in place, each with its own "Added by ChatGPT · Undo" and a caption under it ("On your
// whiteboard", "In your note", "In your app"): first two real questions for Ana on the Studio North
// board (its arrow from "Talk again in March" draws itself, the way Claude's did in Draw, then the
// box); then next week's dinners, named, in the dinners note; then a prep habit in the habits app (Mon,
// Wed and Fri, 20 min). ChatGPT's cursor reads the decisions, then makes each change in turn. Then
// your cursor presses Undo on the app's change: that row leaves, and the rest holds. Redo brings it
// back. With Reduce Motion (or `?t`) all three changes show, none undone: the end state. On a phone it
// does one thing at a time, with one left edge for everything: the heading, the tie line, the chat,
// then one card, which steps board, note, app (a slow crossfade, about 3 s each), each showing its one
// change with the mark and Undo. The card's height is locked (each change's room is kept from the
// start), so it never jumps between steps. Under it, a short caption names where the change is ("On
// your whiteboard"), with three small dots. No cursors and no Undo performance there, and the card
// keeps stepping after the show. The phone's block is short enough that the chat stays in view while
// the card steps. Everything is a function of the show's time t (see show.ts), so stills are exact.

const REQ = "Prep for the Studio North call, and plan next week's dinners.";

/** The show's times. The three changes, in order: the board (0), the dinners note (1), the app (2). */
type Plan = {
  type: [number, number]; sent: number; gptIn: number; f1: [number, number]; read: [number, number]; f2: [number, number];
  draw: [number, number]; land: [number, number, number]; rec: [number, number, number]; ride1: number; ride2: number;
  f3: [number, number]; f4: [number, number]; gptOut: [number, number];
  youIn: [number, number]; press: number; undo: number; youOut: [number, number]; end: number;
  sw: [number, number];
};
const WIDE_PLAN: Plan = {
  type: [0.5, 2.0], sent: 2.1, gptIn: 2.3, f1: [2.4, 3.1], read: [3.15, 3.8], f2: [3.85, 4.5],
  draw: [4.6, 5.4], land: [5.45, 6.85, 8.45], rec: [5.75, 7.15, 8.85], ride1: 0.5, ride2: 0.45,
  f3: [5.9, 6.75], f4: [7.55, 8.35], gptOut: [9.3, 9.7],
  youIn: [10.2, 10.9], press: 11.0, undo: 11.1, youOut: [12.6, 13.1], end: 13.2,
  sw: [99, 99],
};
// On a phone one card shows at a time: the board's arrow draws itself and the questions land, then the
// dinners open in the note, then the app's new row opens. No cursors, and nothing is undone by the show.
const N = 99;
const TALL_PLAN: Plan = {
  type: [0.4, 1.9], sent: 2.0, gptIn: N, f1: [N, N], read: [1.9, 2.5], f2: [N, N],
  draw: [2.5, 3.25], land: [3.3, 7.1, 10.5], rec: [3.6, 7.4, 10.8], ride1: 0, ride2: 0,
  f3: [N, N], f4: [N, N], gptOut: [N, N],
  youIn: [N, N], press: N, undo: N, youOut: [N, N], end: 13.6,
  sw: [5.6, 9.9],
};
/** After the show, the phone's card keeps stepping, this often (ms). */
const STEP = 3400;
/** Where each change is, named under its card. */
const WHERE = ["On your whiteboard", "In your note", "In your app"];

type Snap = { n: number; sent: boolean; read: boolean; land: boolean[]; rec: boolean[]; undo: boolean; press: boolean; active: number };
const same = (a: Snap, b: Snap) => a.n === b.n && a.sent === b.sent && a.read === b.read && a.undo === b.undo && a.press === b.press && a.active === b.active
  && a.land.every((v, i) => v === b.land[i]) && a.rec.every((v, i) => v === b.rec[i]);
const START: Snap = { n: 0, sent: false, read: false, land: [false, false, false], rec: [false, false, false], undo: false, press: false, active: 0 };

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
        sent: t >= P.sent,
        read: t >= P.read[0],
        land: P.land.map((a) => t >= a),
        rec: P.rec.map((a) => t >= a),
        undo: t >= P.undo && !atEnd,
        press: t >= P.press && t < P.press + 0.16 && !atEnd,
        active: t < P.sw[0] ? 0 : t < P.sw[1] ? 1 : 2,
      };
      setSnap((o) => (same(o, next) ? o : next));
      if (t >= P.end) setEnded(true);
      if (narrow) { place(gpt.current, null, 0); place(you.current, null, 0); return; }

      // ChatGPT's cursor: from the request to the decision it read (along it), then to each change in
      // turn: it draws the board's arrow, then rides the dinners in, then the app's new row.
      const ask = at(B, q("ask"), 1, 0.62);
      const dec0 = at(B, q("decided"), 0, 0.86), dec1 = at(B, q("decided"), 1, 0.86);
      const n0 = at(B, q("slot1"), 0, 0.72), n1 = at(B, q("slot1"), 1, 0.72);
      const a0 = at(B, q("slot2"), 0, 0.72), a1 = at(B, q("slot2"), 1, 0.72);
      const p0 = along(B, path, 0), p1 = along(B, path, 1);
      let g: Pt | null = null, go = 1;
      if (t < P.gptIn) { g = ask; go = 0; }
      else if (t < P.f1[0]) { g = ask; go = (t - P.gptIn) / 0.15; }
      else if (t < P.f1[1]) g = ask && dec0 && mix(ask, dec0, mj(seg(t, ...P.f1)));
      else if (t < P.read[0]) g = dec0;
      else if (t < P.read[1]) g = dec0 && dec1 && mix(dec0, dec1, mj(seg(t, ...P.read)));
      else if (t < P.f2[0]) g = dec1;
      else if (t < P.f2[1]) g = dec1 && p0 && mix(dec1, p0, mj(seg(t, ...P.f2)));
      else if (t < P.draw[0]) g = p0;
      else if (t < P.draw[1]) g = along(B, path, e);
      else if (t < P.f3[0]) g = p1;
      else if (t < P.f3[1]) g = p1 && n0 && mix(p1, n0, mj(seg(t, ...P.f3)));
      else if (t < P.land[1]) g = n0;
      else if (t < P.land[1] + P.ride1) g = n0 && n1 && mix(n0, n1, mj(seg(t, P.land[1], P.land[1] + P.ride1)));
      else if (t < P.f4[0]) g = n1;
      else if (t < P.f4[1]) g = n1 && a0 && mix(n1, a0, mj(seg(t, ...P.f4)));
      else if (t < P.land[2]) g = a0;
      else if (t < P.land[2] + P.ride2) g = a0 && a1 && mix(a0, a1, mj(seg(t, P.land[2], P.land[2] + P.ride2)));
      else { const k = seg(t, ...P.gptOut); g = a1 && [a1[0] + 18 * k, a1[1] + 10 * k]; go = 1 - k; }
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
    <BoardObj key="b" tall={narrow} />,
    <NoteObj key="n" />,
    <AppObj key="a" />,
  ];
  return (
    <div ref={root} className={s.aBody}>
      <div className={s.aTop}>
        {title}
        <p className={s.aTie}>You ask in ChatGPT or Claude. The change lands in your notes.</p>
      </div>
      <div className={s.aFlow}>
        {/* Where you ask: ChatGPT, in a small window of its own. */}
        <div className={s.chat}>
          <p className={s.chatWho}><span className={s.askMark}><AIGlyph name="openai" size={15} color="#fff" /></span>ChatGPT</p>
          <p className={s.ask} aria-label={`You, in ChatGPT: ${REQ}`}>
            <span className={s.askText} aria-hidden="true">
              {REQ.slice(0, snap.n)}<span data-at="ask" className={s.askCaret} data-done={snap.n >= REQ.length || undefined} data-sent={snap.sent || undefined} />
              <span className={s.askRest}>{REQ.slice(snap.n)}</span>
            </span>
          </p>
        </div>
        <p className={s.askSub}>It reads what you decided: <span data-at="decided" className={s.askNoCar} data-on={snap.read || snap.land[0] || undefined}>wait until March</span>, and <span className={s.askNoCar} data-on={snap.land[1] || undefined}>cook at home five nights</span>.</p>
        {/* Once you send, a line runs from the chat to your notes. */}
        <i className={s.wire} data-on={snap.sent || undefined} aria-hidden="true" />
      </div>
      {/* Where it lands: your notes, in Pinto, one frame. */}
      <div ref={stage} className={s.aStage} style={{ "--headOn": 0 } as React.CSSProperties}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <p className={s.aLands}><img src="/mark-256.png" alt="Pinto Notes:" width={22} height={22} />In your notes</p>
        <ol className={s.aObjs}>
          {objs.map((o, i) => (
            <li key={i} data-obj className={`${s.aSlot} ${[s.aoBoard, s.aoNote, s.aoApp][i]}`} data-land={snap.land[i] || undefined}
              data-undone={(snap.land[i] && undone(i)) || undefined} data-current={i === active || undefined} aria-label={["Whiteboard: Studio North", "Note: Weeknight dinners", "App: Habits"][i]}>
              <div className={s.aObj}>
                <div className={s.aCard}>
                  {o}
                  <div className={`${s.aGrow} ${s.aRec}`} data-at={`undo${i}`} data-show={snap.rec[i] || undefined}>
                    <div><Receipt undone={undone(i)} onFlip={() => flip(i)} live={snap.rec[i]} /></div>
                  </div>
                </div>
              </div>
              <p className={s.aWhere}>{WHERE[i]}</p>
            </li>
          ))}
        </ol>
        <span ref={gpt} className={s.cur} aria-hidden="true"><Flag name="ChatGPT" color={GPT} /></span>
        <span ref={you} className={`${s.cur} ${s.curYou}`} aria-hidden="true"><Flag name="You" color={YOU} /></span>
      </div>
      <div className={s.markers}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <p key={active} className={s.markCap} aria-live="polite"><img src="/mark-256.png" alt="Pinto Notes: " width={18} height={18} />{WHERE[active]}</p>
        <div className={s.markDots} role="tablist" aria-label="What ChatGPT changed">
          {["Whiteboard", "Note", "App"].map((n, i) => (
            <button key={n} type="button" role="tab" aria-selected={i === active} aria-label={WHERE[i]} onClick={() => setPick(i)}><i /></button>
          ))}
        </div>
      </div>
      {foot}
    </div>
  );
}

/* ───────────────────────── The three things ───────────────────────── */

/** The dinners note. ChatGPT writes next week's dinners into it, named, from your recipes. */
function NoteObj() {
  return (
    <div className={s.aNote}>
      <p className={s.aNoteTitle}>Weeknight dinners</p>
      <p className={s.aDecided}><b>Decided:</b> {DECIDED}</p>
      <div className={`${s.aGrow} ${s.aNewRow}`}>
        <div>
          <div className={s.aAdd}>
            <p className={s.aPlanH}><b data-at="slot1"><i className={s.sweep} />Next week</b></p>
            <ul className={s.aPlan}>{DINNERS.map(([d, n]) => <li key={d}><span>{d}</span>{n}</li>)}</ul>
          </div>
        </div>
      </div>
    </div>
  );
}

type Lay = { view: [number, number]; font: number; title: [number, number]; nodes: Node[]; arrows: Arrow[]; claude: Arrow; gpt: Arrow; add: { x: number; y: number; w: number; h: number } };

// The decision map from Draw, closer in: the path they chose (Claude's orange "no" coming into it,
// finish the launch, talk again in March), at a size you can read. ChatGPT draws an arrow from "Talk
// again in March" to a box it adds: "Questions for Ana", with the two questions for the call.
const WIDE: Lay = {
  view: [520, 250], font: 19, title: [6, 18],
  nodes: [
    { kind: "box", c: [128, 88], w: 236, h: 64, label: ["Finish the launch,", "ship in February"] },
    { kind: "ellipse", c: [398, 88], w: 200, h: 72, label: ["Talk again", "in March"] },
  ],
  arrows: [{ a: [250, 88], c1: [262, 87], c2: [276, 89], b: [292, 88] }],
  claude: { a: [128, 26], c1: [127, 36], c2: [129, 46], b: [128, 54], label: ["no", [108, 46]] },
  gpt: { a: [398, 126], c1: [399, 136], c2: [398, 146], b: [396, 156] },
  add: { x: 150, y: 160, w: 356, h: 86 },
};
// The same, standing up, for a phone.
const TALL: Lay = {
  view: [340, 232], font: 17.5, title: [4, 17],
  nodes: [
    { kind: "box", c: [94, 78], w: 180, h: 60, label: ["Finish the launch,", "ship in February"] },
    { kind: "ellipse", c: [266, 78], w: 140, h: 64, label: ["Talk again", "in March"] },
  ],
  arrows: [{ a: [186, 78], c1: [190, 77], c2: [194, 79], b: [196, 78] }],
  claude: { a: [94, 24], c1: [93, 32], c2: [95, 40], b: [94, 46], label: ["no", [76, 40]] },
  gpt: { a: [262, 112], c1: [262, 120], c2: [261, 128], b: [258, 136] },
  add: { x: 4, y: 140, w: 332, h: 88 },
};

const cubic = (a: Arrow) => `M${a.a[0]} ${a.a[1]} C${a.c1[0]} ${a.c1[1]} ${a.c2[0]} ${a.c2[1]} ${a.b[0]} ${a.b[1]}`;

function BoardObj({ tall }: { tall: boolean }) {
  const g = tall ? TALL : WIDE;
  const r = rng(tall ? 61 : 43);
  const A = g.add, f = g.font * 0.9;
  const addBox: Node = { kind: "box", c: [A.x + A.w / 2, A.y + A.h / 2], w: A.w, h: A.h, label: [] };
  return (
    <div className={s.aBoardWrap}>
      <svg className={`${s.aBoard} ${hand.className}`} viewBox={`0 0 ${g.view[0]} ${g.view[1]}`} aria-hidden="true">
        <text x={g.title[0]} y={g.title[1]} fontSize={g.font * 0.82} className={s.boardTitle}>Studio North: now or March?</text>
        <g className={s.chalk}>
          {g.nodes.map((n, i) => <path key={i} d={shape(r, n, 12)} />)}
          {g.arrows.map((a, i) => <g key={i}><path d={curve(r, a.a, a.c1, a.c2, a.b, 1.5)} /><path d={head(r, a.c2, a.b, 9)} /></g>)}
        </g>
        <g className={s.chalkClaudeSm}><path d={curve(r, g.claude.a, g.claude.c1, g.claude.c2, g.claude.b, 1)} /><path d={head(r, g.claude.c2, g.claude.b, 9)} /></g>
        {g.claude.label && <text x={g.claude.label[1][0]} y={g.claude.label[1][1]} fontSize={g.font * 0.82} textAnchor="middle" className={s.claudeNote}>{g.claude.label[0]}</text>}
        {g.nodes.map((n, i) => nodeWords(n, g.font, i))}
        {/* ChatGPT's addition: the arrow draws itself from "Talk again in March", then the box and its words. */}
        <g className={s.aAddInk}>
          <path data-at="path" d={cubic(g.gpt)} fill="none" stroke="none" />
          <g className={s.chalkGpt}>
            <path data-at="ink" d={curve(r, g.gpt.a, g.gpt.c1, g.gpt.c2, g.gpt.b, 0.6)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} />
            <path className={s.aHead} d={head(r, g.gpt.c2, g.gpt.b, 9)} />
          </g>
          <g className={s.aBox}>
            <rect x={A.x} y={A.y} width={A.w} height={A.h} rx="12" fill={GPT} fillOpacity="0.2" />
            <g className={s.chalkGpt}><path d={shape(r, addBox, 12)} pathLength={1} /></g>
            <text x={A.x + 16} y={A.y + f * 1.45} fontSize={f} className={s.chalkGptText}>Questions for Ana</text>
            {QUESTIONS.map((q, i) => <text key={q} x={A.x + 16} y={A.y + f * 1.45 + (i + 1) * f * 1.32} fontSize={f} className={s.chalkText}>{`${i + 1}. ${q}`}</text>)}
          </g>
        </g>
      </svg>
    </div>
  );
}

/** The habits app Build made, as this week stands: writing 4 of 5 (today ticked), cooking at home 2 of
 *  5 (today still to come), and the habit
 *  ChatGPT adds for the call: prep on Monday, Wednesday and Friday, 20 minutes. */
function AppObj() {
  return (
    <div className={s.aApp}>
      <p className={s.aAppTop}><b>Habits</b><span>App</span></p>
      <div className={s.aDays} aria-hidden="true">{WEEK.map((d, i) => <small key={i} data-now={i === TODAY || undefined}>{d}</small>)}</div>
      <div className={s.aHabit}>
        <p><span>{WRITE_HABIT}</span><small>{WRITE_BEFORE.filter(Boolean).length + 1} of {WRITE_GOAL}</small></p>
        <div className={s.aWeek}>{WEEK.map((d, i) => <i key={i} data-on={WRITE_BEFORE[i] || i === TODAY || undefined}><Tick /></i>)}</div>
      </div>
      <div className={s.aHabit}>
        <p><span>{COOK_HABIT}</span><small>{COOK_DAYS.filter(Boolean).length} of 5</small></p>
        <div className={s.aWeek}>{WEEK.map((d, i) => <i key={i} data-on={COOK_DAYS[i] || undefined} data-now={i === TODAY || undefined}><Tick /></i>)}</div>
      </div>
      <div className={`${s.aGrow} ${s.aNewRow}`}>
        <div>
          <div className={`${s.aAdd} ${s.aPrep}`}>
            <p className={s.aPrepName}><span data-at="slot2"><b className={s.sweep} />Prep for Studio North</span></p>
            <p className={s.aPrepWhen}>20 min on Mon, Wed and Fri</p>
          </div>
        </div>
      </div>
    </div>
  );
}
