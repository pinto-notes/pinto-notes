"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { curve, head, rng } from "./hand";
import { along, at, frozenAt, mix, mj, place, seg, useShow, type Pt } from "./show";
import { COOK_DAYS, COOK_HABIT, DECIDED, DINNERS, Flag, Folder, GPT, NEW_RECIPE, hand, nodeWords, QUESTIONS, Receipt, shape, Tick, TODAY, WEEK, WRITE_BEFORE, WRITE_GOAL, WRITE_HABIT, type Arrow, type Node } from "./Things";
import s from "./s.module.css";

// The climax, staged: one request, typed in ChatGPT, that lands in three parts of one life in Pinto.
// On a Mac it fits one screen. The heading and the line that ties the two places ("You ask in ChatGPT
// or Claude. The change lands in your notes.") are on the left; on the right, where you ask: ChatGPT,
// in a small window of its own, your words in a bubble ("Plan next week's dinners, and prep for the
// Studio North call."), and under it what it read: "It reads what you decided: cook at home five
// nights, and take the job in March." A line runs from the chat down into where it lands: one frame
// across the page, labelled with Pinto's mark and its name, "In Pinto Notes", holding the three things
// it changes, each in place, each marked "Added by ChatGPT", with a caption under it. The three cards
// are as tall as one another, each only as tall as what it holds, and their marks share one line at
// their foot. First the owner's favourite
// use: next week's dinners in the dinners note, and the recipe it filed into Recipes as it planned
// ("New in Recipes: Shakshuka"). Then two questions for Ana on the Studio North board (its arrow from
// "Talk again in March" draws itself, the way Claude's did in Draw, then the box). Then a prep habit
// in the habits app. ChatGPT's cursor reads the decisions, then makes each change in turn, and leaves.
// Undo shows once on the whole page, small, on the app's card (it works; nobody acts it out). With
// Reduce Motion (or `?t`) all three changes show: the end state.
//
// On a phone it does one thing at a time, on one left edge: the heading and the tie line, the chat,
// then three small labelled controls (Note, Whiteboard, App) that show which change is in view and
// switch it, then one card, which steps note, board, app (a slow crossfade, about 3 s each). The card's
// height is locked (each change's room is kept from the start), so it never jumps between steps, and
// the whole block fits one screen, so the request stays in view while the results change. No cursors
// there, and the card keeps stepping after the show until you pick one. Everything is a function of
// the show's time t (see show.ts), so stills are exact.

const REQ = "Plan next week's dinners, and prep for the Studio North call.";

/** The show's times. The three changes, in order: the dinners note (0), the board (1), the app (2). */
type Plan = {
  type: [number, number]; sent: number; gptIn: number; f1: [number, number]; read: [number, number]; f2: [number, number];
  ride1: number; f3: [number, number]; draw: [number, number]; f4: [number, number]; ride2: number;
  land: [number, number, number]; rec: [number, number, number]; gptOut: [number, number];
  end: number;
  sw: [number, number];
};
const WIDE_PLAN: Plan = {
  type: [0.5, 2.0], sent: 2.1, gptIn: 2.3, f1: [2.4, 3.1], read: [3.15, 3.8], f2: [3.85, 4.5],
  ride1: 0.5, f3: [5.5, 6.2], draw: [6.25, 7.05], f4: [7.75, 8.5], ride2: 0.45,
  land: [4.6, 7.1, 8.6], rec: [4.95, 7.45, 9.0], gptOut: [9.35, 9.75],
  // The changes are all made by 9.8 s; the show runs on to 14.5 s, so a scroll through the chapter
  // reaches the finished state two thirds of the way through its stay and holds it.
  end: 14.5,
  sw: [99, 99],
};
// On a phone one card shows at a time: the dinners open in the note, then the board's arrow draws
// itself and the questions land, then the app's new row opens. No cursors.
const N = 99;
const TALL_PLAN: Plan = {
  type: [0.4, 1.9], sent: 2.0, gptIn: N, f1: [N, N], read: [1.9, 2.5], f2: [N, N],
  ride1: 0, f3: [N, N], draw: [6.0, 6.75], f4: [N, N], ride2: 0,
  land: [2.6, 6.8, 10.3], rec: [2.9, 7.1, 10.6], gptOut: [N, N],
  end: 13.6,
  sw: [5.6, 9.9],
};
/** After the show, the phone's card keeps stepping, this often (ms). */
const STEP = 3400;
/** The one card on the page that shows Undo (the app's). */
const UNDO_ON = 2;
/** Where each change is, named under its card, and the phone's controls. */
const WHERE = ["In your note", "On your whiteboard", "In your app"];
const KIND = ["Note", "Whiteboard", "App"];

type Snap = { n: number; sent: boolean; read: boolean; land: boolean[]; rec: boolean[]; active: number };
const same = (a: Snap, b: Snap) => a.n === b.n && a.sent === b.sent && a.read === b.read && a.active === b.active
  && a.land.every((v, i) => v === b.land[i]) && a.rec.every((v, i) => v === b.rec[i]);
const START: Snap = { n: 0, sent: false, read: false, land: [false, false, false], rec: [false, false, false], active: 0 };

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
  const root = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null), gpt = useRef<HTMLSpanElement>(null);
  const [snap, setSnap] = useState<Snap>(START);
  const [user, setUser] = useState<(boolean | null)[]>([null, null, null]);
  const [pick, setPick] = useState<number | null>(null);
  const [cycle, setCycle] = useState<number | null>(null);
  const [ended, setEnded] = useState(false);
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
        sent: t >= P.sent,
        read: t >= P.read[0],
        land: P.land.map((a) => t >= a),
        rec: P.rec.map((a) => t >= a),
        active: t < P.sw[0] ? 0 : t < P.sw[1] ? 1 : 2,
      };
      setSnap((o) => (same(o, next) ? o : next));
      if (t >= P.end) setEnded(true);
      if (narrow) { place(gpt.current, null, 0); return; }

      // ChatGPT's cursor: from the request to the decision it read (along it), then to each change in
      // turn: it rides next week's dinners in, draws the board's arrow, then rides the app's new row in.
      const ask = at(B, q("ask"), 1, 0.62);
      const dec0 = at(B, q("decided"), 0, 0.86), dec1 = at(B, q("decided"), 1, 0.86);
      const n0 = at(B, q("slot1"), 0, 0.72), n1 = at(B, q("slot1"), 1, 0.72);
      const a0 = at(B, q("slot2"), 0, 0.72), a1 = at(B, q("slot2"), 1, 0.72);
      const p0 = along(B, path, 0), p1 = along(B, path, 1);
      const [L0, , L2] = P.land;
      let g: Pt | null = null, go = 1;
      if (t < P.gptIn) { g = ask; go = 0; }
      else if (t < P.f1[0]) { g = ask; go = (t - P.gptIn) / 0.15; }
      else if (t < P.f1[1]) g = ask && dec0 && mix(ask, dec0, mj(seg(t, ...P.f1)));
      else if (t < P.read[0]) g = dec0;
      else if (t < P.read[1]) g = dec0 && dec1 && mix(dec0, dec1, mj(seg(t, ...P.read)));
      else if (t < P.f2[0]) g = dec1;
      else if (t < P.f2[1]) g = dec1 && n0 && mix(dec1, n0, mj(seg(t, ...P.f2)));
      else if (t < L0) g = n0;
      else if (t < L0 + P.ride1) g = n0 && n1 && mix(n0, n1, mj(seg(t, L0, L0 + P.ride1)));
      else if (t < P.f3[0]) g = n1;
      else if (t < P.f3[1]) g = n1 && p0 && mix(n1, p0, mj(seg(t, ...P.f3)));
      else if (t < P.draw[0]) g = p0;
      else if (t < P.draw[1]) g = along(B, path, e);
      else if (t < P.f4[0]) g = p1;
      else if (t < P.f4[1]) g = p1 && a0 && mix(p1, a0, mj(seg(t, ...P.f4)));
      else if (t < L2) g = a0;
      else if (t < L2 + P.ride2) g = a0 && a1 && mix(a0, a1, mj(seg(t, L2, L2 + P.ride2)));
      // Done, it steps up and right, off the habit's words (its name tag hangs below its tip, so it
      // would sit on the "when" line), and fades.
      else { const off = a1 && ([a1[0] + 26, a1[1] - 30] as Pt); const k = seg(t, ...P.gptOut);
        g = off && a1 && mix(a1, off, mj(seg(t, L2 + P.ride2, L2 + P.ride2 + 0.35))); if (g) g = [g[0] + 10 * k, g[1] - 8 * k]; go = 1 - k; }
      // Its name tag always stays on the page.
      if (g) g = [Math.min(g[0], B.width - 84), g[1]];
      place(gpt.current, g, go);

    },
  });

  const undone = (i: number) => user[i] ?? false;
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
        <p className={s.askSub}>It reads what you decided: <span data-at="decided" className={s.askNoCar} data-on={snap.read || snap.land[0] || undefined}>cook at home five nights</span>, and <span className={s.askNoCar} data-on={snap.land[1] || undefined}>take the job in March</span>.</p>
        {/* Once you send, a line runs from the chat down into your notes. */}
        <i className={s.wire} data-on={snap.sent || undefined} aria-hidden="true" />
      </div>
      {/* On a phone: which change is in view, by name, and the way to switch. */}
      <div className={s.seg} role="tablist" aria-label="What ChatGPT changed in your notes">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mark-256.png" alt="" width={20} height={20} />
        {KIND.map((k, i) => (
          <button key={k} type="button" role="tab" aria-selected={i === active} aria-label={`${k}: ${WHERE[i].toLowerCase()}`} onClick={() => setPick(i)}>{k}</button>
        ))}
      </div>
      {/* Where it lands: your notes, in Pinto, one frame. */}
      <div ref={stage} className={s.aStage} style={{ "--headOn": 0 } as React.CSSProperties}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <p className={s.aLands}><img src="/mark-256.png" alt="" width={22} height={22} />In Pinto Notes</p>
        <ol className={s.aObjs}>
          {objs.map((o, i) => (
            <li key={i} data-obj className={`${s.aSlot} ${[s.aoNote, s.aoBoard, s.aoApp][i]}`} data-land={snap.land[i] || undefined}
              data-undone={(snap.land[i] && undone(i)) || undefined} data-current={i === active || undefined} aria-label={["Note: Weeknight dinners", "Whiteboard: Studio North", "App: Habits"][i]}>
              <div className={s.aObj}>
                <div className={s.aCard}>
                  {o}
                  <div className={`${s.aGrow} ${s.aRec}`} data-show={snap.rec[i] || undefined}>
                    {/* Undo, once on the whole page: on the app's card only. */}
                    <div><Receipt undone={undone(i)} onFlip={i === UNDO_ON ? () => flip(i) : undefined} live={snap.rec[i]} /></div>
                  </div>
                </div>
              </div>
              <p className={s.aWhere}>{WHERE[i]}</p>
            </li>
          ))}
        </ol>
        <span ref={gpt} className={s.cur} aria-hidden="true"><Flag name="ChatGPT" color={GPT} /></span>
      </div>
      {foot}
    </div>
  );
}

/* ───────────────────────── The three things ───────────────────────── */

/** The dinners note. ChatGPT writes next week's dinners into it, named, from your recipes, and files
 *  the one that's new into Recipes ("New in Recipes: Shakshuka"). */
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
            <p className={s.aFiled}><Folder /><span><b>New in Recipes:</b> {NEW_RECIPE.name}</span></p>
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
// Laid a little taller than wide, so the whiteboard card is as tall as the note's and the app's.
const WIDE: Lay = {
  view: [520, 270], font: 19, title: [6, 18],
  nodes: [
    { kind: "box", c: [128, 98], w: 236, h: 64, label: ["Finish the launch,", "ship in February"] },
    { kind: "ellipse", c: [398, 98], w: 200, h: 72, label: ["Talk again", "in March"] },
  ],
  arrows: [{ a: [250, 98], c1: [262, 97], c2: [276, 99], b: [292, 98] }],
  claude: { a: [128, 32], c1: [127, 44], c2: [129, 54], b: [128, 64], label: ["no", [108, 54]] },
  gpt: { a: [398, 136], c1: [399, 148], c2: [398, 160], b: [396, 172] },
  add: { x: 150, y: 176, w: 356, h: 92 },
};
// The same, standing up, for a phone.
const TALL: Lay = {
  view: [340, 232], font: 17.5, title: [4, 17],
  nodes: [
    { kind: "box", c: [82, 78], w: 158, h: 60, label: ["Finish the launch,", "ship in February"] },
    { kind: "ellipse", c: [272, 78], w: 128, h: 64, label: ["Talk again", "in March"] },
  ],
  arrows: [{ a: [166, 78], c1: [177, 77], c2: [190, 79], b: [202, 78] }],
  claude: { a: [82, 24], c1: [81, 32], c2: [83, 40], b: [82, 46], label: ["no", [64, 40]] },
  gpt: { a: [270, 112], c1: [270, 120], c2: [269, 128], b: [266, 136] },
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
            <p className={s.aPrepWhen}>Mon, Wed, Fri · 20 min</p>
          </div>
        </div>
      </div>
    </div>
  );
}
