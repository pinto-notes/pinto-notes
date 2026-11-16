"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { curve, head, rng } from "./hand";
import { frozenAt, mj, seg, useShow } from "./show";
import { COOK_DAYS, COOK_GOAL, COOK_HABIT, COOK_NEXT, DECIDED, DINNERS, Folder, GPT, NEW_RECIPE, hand, nodeWords, QUESTIONS, Receipt, shape, Tick, TODAY, WEEK, type Arrow, type Node } from "./Things";
import s from "./s.module.css";

// The climax, staged: one request, typed in ChatGPT, that lands in three parts of one life in Pinto.
// On a Mac it fits one screen. The heading and the line that ties the two places ("You ask in ChatGPT
// or Claude. The change lands in your notes.") are on the left; on the right, where you ask: ChatGPT,
// in a small window of its own, your words in a bubble, two clauses ("Plan next week's dinners, and
// prep my Studio North call."), and under it what it read: "It reads what you decided: cook at home
// five nights, and take the job in March."
//
// Round 19: it reads at a glance. Each clause has its own tint, and what it changed wears the same
// one, so nobody has to decode which is which: the dinners (orange) went into the dinners note and the
// habits app, the call (green) onto the Studio North whiteboard. The two decisions it read are
// underlined in the same two tints. Where it lands is one frame across the page, labelled with Pinto's
// mark and its name, "In Pinto Notes", holding the three, in the request's order, the note leading:
// it's the widest, set at reading size, with next week's dinners and the recipe it filed into Recipes
// as it planned ("New in Recipes: Shakshuka"). Then the app: "Cook at home", with the five planned
// dinner nights marked, so the note and the app show the same decision. Then the whiteboard, smaller:
// "Talk again in March", and the arrow ChatGPT draws from it to two questions for Ana. Each is marked
// "Added by ChatGPT"; Undo shows once on the whole page, small, on the app's card. No cursor and no
// captions: the frames' colours and the cards' own titles say what each one is. With Reduce Motion (or
// `?t`) all three changes show: the end state.
//
// On a phone it does one thing at a time, on one left edge: the heading and the tie line, the chat,
// then three small labelled controls (Note, Whiteboard, App, each with its clause's tint) that show
// which change is in view and switch it, then one card, which steps note, board, app (a slow
// crossfade, about 3 s each). The card's height is locked (each change's room is kept from the start),
// so it never jumps between steps, and the whole block fits one screen, so the request stays in view
// while the results change. The card keeps stepping after the show until you pick one. Everything is a
// function of the show's time t (see show.ts), so stills are exact.

/** The request, in its two clauses: each with the tint its results wear ("d" dinners, "c" the call). */
const PARTS: [string, "d" | "c" | null][] = [["Plan next week's dinners", "d"], [", and ", null], ["prep my Studio North call", "c"], [".", null]];
const REQ = PARTS.map(([t]) => t).join("");

/** The show's times. The three changes: the dinners note (0), the board (1), the app (2). */
type Plan = { type: [number, number]; sent: number; read: number; draw: [number, number]; land: [number, number, number]; rec: [number, number, number]; end: number; sw: [number, number] };
// On a Mac, in the request's order: the note, then the app (the dinners), then the board (the call:
// its arrow draws itself, then the questions land).
const WIDE_PLAN: Plan = {
  type: [0.5, 2.0], sent: 2.1, read: 2.5,
  land: [3.3, 6.0, 4.5], rec: [3.65, 6.35, 4.85], draw: [5.2, 5.9],
  // The changes are all made by 6.4 s; the show runs on to 12 s, so a scroll through the chapter
  // reaches the finished state half way through its stay and holds it.
  end: 12,
  sw: [99, 99],
};
// On a phone one card shows at a time: the dinners open in the note, then the board's arrow draws
// itself and the questions land, then the app's planned nights.
const TALL_PLAN: Plan = {
  type: [0.4, 1.9], sent: 2.0, read: 1.9,
  land: [2.6, 6.8, 10.3], rec: [2.9, 7.1, 10.6], draw: [6.0, 6.75],
  end: 13.6,
  sw: [5.6, 9.9],
};
/** After the show, the phone's card keeps stepping, this often (ms). */
const STEP = 3400;
/** The one card on the page that shows Undo (the app's). */
const UNDO_ON = 2;
/** Where each change is (for the phone's controls), and which clause it answers. */
const WHERE = ["In your note", "On your whiteboard", "In your app"];
const KIND = ["Note", "Whiteboard", "App"];
const TONE = ["d", "c", "d"] as const;

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

/** The request as typed so far: each clause in its own span (tinted once it's sent), the caret where
 *  the typing is, and the rest held in place, unseen, so the bubble never changes size. */
function Typed({ n, sent }: { n: number; sent: boolean }) {
  let at = 0;
  let caretDone = false;
  return (
    <>
      {PARTS.map(([text, tone], i) => {
        const k = Math.max(0, Math.min(text.length, n - at));
        const caretHere = !caretDone && (n < at + text.length || i === PARTS.length - 1);
        if (caretHere) caretDone = true;
        at += text.length;
        return (
          <span key={i} className={tone ? s.clause : undefined} data-tone={tone ?? undefined} data-on={(tone && sent) || undefined}>
            {text.slice(0, k)}
            {caretHere && <span className={s.askCaret} data-done={n >= REQ.length || undefined} data-sent={sent || undefined} />}
            <span className={s.askRest}>{text.slice(k)}</span>
          </span>
        );
      })}
    </>
  );
}

export function AiShow({ subscribe, title, foot }: { subscribe: (fn: (dwell: number, arrive: number) => void) => () => void; title: React.ReactNode; foot: React.ReactNode }) {
  const narrow = useNarrow();
  const P = narrow ? TALL_PLAN : WIDE_PLAN;
  const stage = useRef<HTMLDivElement>(null);
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
      const st = stage.current; if (!st) return;
      // The arrow ChatGPT draws into the whiteboard, as far as it has got.
      const e = mj(seg(t, P.draw[0], P.draw[1]));
      st.querySelectorAll<SVGPathElement>(`[data-at="ink"]`).forEach((ink) => { ink.style.strokeDashoffset = String(1 - e); });
      st.style.setProperty("--headOn", e > 0.97 ? "1" : "0");
      const next: Snap = {
        n: Math.round(seg(t, P.type[0], P.type[1]) * REQ.length),
        sent: t >= P.sent,
        read: t >= P.read,
        land: P.land.map((a) => t >= a),
        rec: P.rec.map((a) => t >= a),
        active: t < P.sw[0] ? 0 : t < P.sw[1] ? 1 : 2,
      };
      setSnap((o) => (same(o, next) ? o : next));
      if (t >= P.end) setEnded(true);
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
    <div className={s.aBody}>
      <div className={s.aTop}>
        {title}
        <p className={s.aTie}>You ask in ChatGPT or Claude. The change lands in your notes.</p>
      </div>
      <div className={s.aFlow}>
        {/* Where you ask: ChatGPT, in a small window of its own. */}
        <div className={s.chat}>
          <p className={s.chatWho}><span className={s.askMark}><AIGlyph name="openai" size={15} color="#fff" /></span>ChatGPT</p>
          <p className={s.ask} aria-label={`You, in ChatGPT: ${REQ}`}>
            <span className={s.askText} aria-hidden="true"><Typed n={snap.n} sent={snap.sent} /></span>
          </p>
        </div>
        <p className={s.askSub}>It reads what you decided: <span className={s.askNoCar} data-tone="d" data-on={snap.read || undefined}>cook at home five nights</span>, and <span className={s.askNoCar} data-tone="c" data-on={snap.read || undefined}>take the job in March</span>.</p>
        {/* Once you send, a line runs from the chat down into your notes. */}
        <i className={s.wire} data-on={snap.sent || undefined} aria-hidden="true" />
      </div>
      {/* On a phone: which change is in view, by name and by its clause's tint, and the way to switch. */}
      <div className={s.seg} role="tablist" aria-label="What ChatGPT changed in your notes">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mark-256.png" alt="" width={20} height={20} />
        {KIND.map((k, i) => (
          <button key={k} type="button" role="tab" data-tone={TONE[i]} aria-selected={i === active} aria-label={`${k}: ${WHERE[i].toLowerCase()}`} onClick={() => setPick(i)}>{k}</button>
        ))}
      </div>
      {/* Where it lands: your notes, in Pinto, one frame. */}
      <div ref={stage} className={s.aStage} style={{ "--headOn": 0 } as React.CSSProperties}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <p className={s.aLands}><img src="/mark-256.png" alt="" width={22} height={22} />In Pinto Notes</p>
        <ol className={s.aObjs}>
          {objs.map((o, i) => (
            <li key={i} data-obj data-tone={TONE[i]} className={`${s.aSlot} ${[s.aoNote, s.aoBoard, s.aoApp][i]}`} data-land={snap.land[i] || undefined}
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
            </li>
          ))}
        </ol>
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
            <p className={s.aPlanH}><b><i className={s.sweep} />Next week</b></p>
            <ul className={s.aPlan}>{DINNERS.map(([d, n]) => <li key={d}><span>{d}</span>{n}</li>)}</ul>
            <p className={s.aFiled}><Folder /><span><b>New in Recipes:</b> {NEW_RECIPE.name}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

type Lay = { view: [number, number]; font: number; title: [number, number]; nodes: Node[]; arrows: Arrow[]; claude?: Arrow; gpt: Arrow; add: { x: number; y: number; w: number; h: number } };

// On a Mac, a column of the board: the question, where they landed ("Talk again in March"), and
// the arrow ChatGPT draws down from it to a box it adds: "Questions for Ana", with the two questions
// for the call. Laid taller than wide, so the board sits beside the note and the app at their height.
const COL: Lay = {
  view: [276, 222], font: 16, title: [2, 14],
  nodes: [{ kind: "ellipse", c: [138, 58], w: 176, h: 60, label: ["Talk again", "in March"] }],
  arrows: [],
  gpt: { a: [138, 90], c1: [139, 99], c2: [138, 108], b: [137, 118] },
  add: { x: 3, y: 124, w: 270, h: 94 },
};
// A phone's card: the path they chose (Claude's orange "no" coming into it, finish the launch, talk
// again in March), then ChatGPT's arrow down to the questions.
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
  const g = tall ? TALL : COL;
  const r = rng(tall ? 61 : 43);
  const A = g.add, f = g.font * 0.9;
  const addBox: Node = { kind: "box", c: [A.x + A.w / 2, A.y + A.h / 2], w: A.w, h: A.h, label: [] };
  return (
    <div className={s.aBoardWrap}>
      <svg className={`${s.aBoard} ${hand.className}`} viewBox={`0 0 ${g.view[0]} ${g.view[1]}`} aria-hidden="true">
        <text x={g.title[0]} y={g.title[1]} fontSize={g.font * 0.84} className={s.boardTitle}>Studio North: now or March?</text>
        <g className={s.chalk}>
          {g.nodes.map((n, i) => <path key={i} d={shape(r, n, 12)} />)}
          {g.arrows.map((a, i) => <g key={i}><path d={curve(r, a.a, a.c1, a.c2, a.b, 1.5)} /><path d={head(r, a.c2, a.b, 9)} /></g>)}
        </g>
        {g.claude && <g className={s.chalkClaudeSm}><path d={curve(r, g.claude.a, g.claude.c1, g.claude.c2, g.claude.b, 1)} /><path d={head(r, g.claude.c2, g.claude.b, 9)} /></g>}
        {g.claude?.label && <text x={g.claude.label[1][0]} y={g.claude.label[1][1]} fontSize={g.font * 0.82} textAnchor="middle" className={s.claudeNote}>{g.claude.label[0]}</text>}
        {g.nodes.map((n, i) => nodeWords(n, g.font, i))}
        {/* ChatGPT's addition: the arrow draws itself from "Talk again in March", then the box and its words. */}
        <g className={s.aAddInk}>
          <g className={s.chalkGpt}>
            <path data-at="ink" d={curve(r, g.gpt.a, g.gpt.c1, g.gpt.c2, g.gpt.b, 0.6)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} />
            <path className={s.aHead} d={head(r, g.gpt.c2, g.gpt.b, 9)} />
          </g>
          <g className={s.aBox}>
            <rect x={A.x} y={A.y} width={A.w} height={A.h} rx="12" fill={GPT} fillOpacity="0.2" />
            <g className={s.chalkGpt}><path d={shape(r, addBox, 12)} pathLength={1} /></g>
            <text x={A.x + 14} y={A.y + f * 1.5} fontSize={f} className={s.chalkGptText}>Questions for Ana</text>
            {QUESTIONS.map((q, i) => <text key={q} x={A.x + 14} y={A.y + f * 1.5 + (i + 1) * f * 1.36} fontSize={f} className={s.chalkText}>{`${i + 1}. ${q}`}</text>)}
          </g>
        </g>
        <path d={cubic(g.gpt)} fill="none" stroke="none" />
      </svg>
    </div>
  );
}

/** The habits app Build made, its one habit for the dinners: "Cook at home", five nights a week. This
 *  week as it stands (2 of 5, today still to come), and the row ChatGPT adds under it: next week, with
 *  the five dinner nights it planned in the note marked in its green, the same nights as the note. */
function AppObj() {
  return (
    <div className={s.aApp}>
      <p className={s.aAppTop}><b>Habits</b><span>App</span></p>
      <p className={s.aHabitName}><span>{COOK_HABIT}</span><small>{COOK_GOAL}</small></p>
      <div className={s.aCal} aria-hidden="true">{WEEK.map((d, i) => <small key={i} data-now={i === TODAY || undefined}>{d}</small>)}</div>
      <p className={s.aRowLab}><span>This week</span><small>{COOK_DAYS.filter(Boolean).length} of 5</small></p>
      <div className={s.aCal}>{WEEK.map((_d, i) => <i key={i} data-on={COOK_DAYS[i] || undefined} data-now={i === TODAY || undefined}><Tick /></i>)}</div>
      <div className={`${s.aGrow} ${s.aNewRow}`}>
        <div>
          <div className={`${s.aAdd} ${s.aCalNext}`}>
            <p className={s.aRowLab}><b><i className={s.sweep} />Next week</b><small>{COOK_NEXT.filter(Boolean).length} planned</small></p>
            <div className={s.aCal}>{WEEK.map((_d, i) => <i key={i} data-plan={COOK_NEXT[i] || undefined} />)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
