"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import t from "./try.module.css";

// Round 27, slug `try` (2026-11-17), Dusk's lesson: the first screen holds a small demo you can play
// with. Pinto on a Mac with a note open, ChatGPT beside it, and three things you might ask, as buttons.
// Tap one: it goes into ChatGPT as your message, and the matching change lands in the note in under a
// second, marked the way the app marks an AI's lines (a peach run behind the words and an orange tick in
// the margin: the Mac capture appstore-council/cap24/mac/undo.png, Pane/Editor/DecoratedLayoutFragment.
// swift). On a phone it's the iPhone app's note with its own label at the foot, "ChatGPT changed 2 lines
// ›" (AIChangeButton, Pane/Views/AIMarks.swift; it holds no Undo, the page shows Undo once, in Your AI).
// ChatGPT answers in the words the demo video shows ("Worked for 6s", the note named in bold).
//
// The first request runs by itself on load, by CSS alone: the page is server-rendered with your message
// already sent and the lines landing at 0.2 and 0.4 s, so the product is working at half a second even
// before the script hydrates. Nothing here talks to a server: it is a picture of what the app does,
// played back. Reduce Motion shows each request's end state at once.

type Block =
  | { k: "title"; text: string }
  | { k: "by"; text: string; ai?: boolean; extra?: boolean }
  | { k: "h"; text: string }
  | { k: "quote"; text: string; extra?: boolean; long?: boolean }
  | { k: "check"; text: string; ai?: boolean; done?: boolean }
  | { k: "dish"; day: string; text: string; ai?: boolean }
  | { k: "dot"; text: string; ai?: boolean }
  | { k: "p"; lead?: string; text: string; ai?: boolean };

type Req = {
  chip: string;
  /** What you send, word for word (the chip says it shorter only on a phone, never differently). */
  ask: string;
  folder: string;
  title: string;
  worked: string;
  answer: React.ReactNode;
  /** The answer as plain words, for VoiceOver. */
  said: string;
  /** What the iPhone's label says (AIEdit.Receipt.summary). */
  summary: string;
  /** The end of ChatGPT's earlier message, when your request points back at it ("this shakshuka"). */
  before?: string;
  body: Block[];
};

export const REQS: Req[] = [
  {
    chip: "Turn my highlights into things to try",
    ask: "Turn my highlights into things to try.",
    folder: "Reading", title: "Deep Work",
    worked: "Worked for 6s",
    answer: <>Added two things to try to your <b>Deep Work</b> note.</>,
    said: "Added two things to try to your Deep Work note.",
    summary: "ChatGPT changed 2 lines",
    body: [
      { k: "title", text: "Deep Work" },
      { k: "by", text: "By Cal Newport", extra: true },
      { k: "h", text: "Highlights" },
      { k: "quote", text: "Deep work is rare, and worth more every year.", long: true },
      { k: "quote", text: "Focus is a skill. Train it.", extra: true },
      { k: "h", text: "To try" },
      { k: "check", text: "Phone in another room", ai: true },
      { k: "check", text: "Schedule every minute", ai: true },
    ],
  },
  {
    chip: "Plan three easy dinners",
    ask: "Plan three easy dinners.",
    folder: "Home", title: "This week",
    worked: "Worked for 7s",
    answer: <>Added three dinners to your <b>This week</b> note, each 20 minutes or less, as you decided.</>,
    said: "Added three dinners to your This week note, each 20 minutes or less, as you decided.",
    summary: "ChatGPT changed 3 lines",
    body: [
      { k: "title", text: "This week" },
      { k: "p", lead: "Decided:", text: "20-minute weeknight dinners." },
      { k: "h", text: "Dinners" },
      { k: "dish", day: "Mon", text: "Lemon chicken · 20 min", ai: true },
      { k: "dish", day: "Tue", text: "Miso salmon · 15 min", ai: true },
      { k: "dish", day: "Wed", text: "Black bean tacos · 15 min", ai: true },
    ],
  },
  {
    chip: "Save this shakshuka to Recipes",
    ask: "Save this shakshuka to Recipes.",
    folder: "Recipes", title: "Shakshuka",
    worked: "Worked for 8s",
    answer: <>Created <b>Shakshuka</b> in your <b>Recipes</b> folder in Pinto Notes.</>,
    said: "Created Shakshuka in your Recipes folder in Pinto Notes.",
    summary: "ChatGPT wrote this note",
    before: "Crack in the eggs, cover, and cook for about 6 minutes. Finish with feta.",
    body: [
      { k: "title", text: "Shakshuka" },
      { k: "by", text: "Serves 2 · 25 min", ai: true },
      { k: "dot", text: "1 onion and 1 red pepper, sliced", ai: true },
      { k: "dot", text: "2 cloves garlic, cumin, paprika", ai: true },
      { k: "dot", text: "1 can of tomatoes, 4 eggs, feta", ai: true },
      { k: "p", text: "Simmer 10 min, crack in the eggs, cover for 6.", ai: true },
    ],
  },
];

/** When things happen in a run (ms). The first run is the page's own: your message is already sent when
 *  the page paints, and the first line is already most of the way in (a negative delay starts its landing
 *  260 ms along), so an edit shows on the very first frame however late that frame comes. A tap sends it
 *  then: the message rises, the note opens, the lines land. */
const LOAD = { line: -260, step: 360, answer: 620 };
const TAP = { bubble: 0, note: 120, line: 300, step: 150, answer: 300 };

const Ico = {
  back: <svg viewBox="0 0 10 16"><path d="M7.5 2 1.8 8l5.7 6" /></svg>,
  fwd: <svg viewBox="0 0 10 16"><path d="M2.5 2l5.7 6-5.7 6" /></svg>,
  chev: <svg viewBox="0 0 8 12"><path d="m2 2 4 4-4 4" /></svg>,
  check: <svg viewBox="0 0 22 18"><circle cx="4" cy="5" r="2.4" /><path d="M9 5h11M9 13h11" /><circle cx="4" cy="13" r="2.4" /></svg>,
  table: <svg viewBox="0 0 20 18"><rect x="2" y="2.5" width="16" height="13" rx="2" /><path d="M2 7.2h16M2 11.4h16M7.4 2.5v13" /></svg>,
  clip: <svg viewBox="0 0 20 20"><path d="m15.6 9.4-5.8 5.8a3.6 3.6 0 0 1-5.1-5.1l6.4-6.4a2.4 2.4 0 0 1 3.4 3.4L8.3 13.3a1.2 1.2 0 0 1-1.7-1.7l5.6-5.6" /></svg>,
  share: <svg viewBox="0 0 18 20"><path d="M9 12.4V1.8M5.6 5 9 1.6 12.4 5M6.2 7.6H4.4a1.6 1.6 0 0 0-1.6 1.6v7.4a1.6 1.6 0 0 0 1.6 1.6h9.2a1.6 1.6 0 0 0 1.6-1.6V9.2a1.6 1.6 0 0 0-1.6-1.6h-1.8" /></svg>,
  more: <svg viewBox="0 0 20 6" className={t.fill}><circle cx="3" cy="3" r="1.6" /><circle cx="10" cy="3" r="1.6" /><circle cx="17" cy="3" r="1.6" /></svg>,
  plus: <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" /></svg>,
  mic: <svg viewBox="0 0 20 20"><rect x="7.4" y="2.6" width="5.2" height="9.2" rx="2.6" /><path d="M4.8 9.6a5.2 5.2 0 0 0 10.4 0M10 14.8V17" /></svg>,
  wave: <svg viewBox="0 0 20 20"><path d="M5 8.6v2.8M7.6 6.4v7.2M10.2 4.6v10.8M12.8 6.8v6.4M15.4 8.8v2.4" /></svg>,
  up: <svg viewBox="0 0 20 20"><path d="M10 15.5V4.8M5.4 9.2 10 4.6l4.6 4.6" /></svg>,
  copy: <svg viewBox="0 0 20 20"><rect x="6.6" y="6.6" width="10" height="10" rx="2.4" /><path d="M13.4 6.6V5.4a2 2 0 0 0-2-2H5.4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1.2" /></svg>,
  speak: <svg viewBox="0 0 20 20"><path d="M4 7.6h2.4L10 4.6v10.8l-3.6-3H4z" /><path d="M13 7.4a3.6 3.6 0 0 1 0 5.2M15.2 5.4a6.4 6.4 0 0 1 0 9.2" /></svg>,
  again: <svg viewBox="0 0 20 20"><path d="M15.6 8.2A5.8 5.8 0 0 0 5 6.4M4.4 11.8A5.8 5.8 0 0 0 15 13.6M5 3.4v3h3M15 16.6v-3h-3" /></svg>,
  down: <svg viewBox="0 0 20 20"><path d="M6.6 11.4V4h-2a1 1 0 0 0-1 1v5.4a1 1 0 0 0 1 1zM6.6 11.4l3 5a1.6 1.6 0 0 0 2.9-1.2l-.7-3h3.6a1.6 1.6 0 0 0 1.6-1.9l-1-5.2A1.6 1.6 0 0 0 14.4 4H6.6" /></svg>,
  tick: <svg viewBox="0 0 24 24"><path d="M6.5 12.4l3.6 3.6 7.4-7.6" /></svg>,
  spark: <svg viewBox="0 0 20 20"><path d="M10 2.2c.5 4.1 3.7 7.3 7.8 7.8-4.1.5-7.3 3.7-7.8 7.8-.5-4.1-3.7-7.3-7.8-7.8 4.1-.5 7.3-3.7 7.8-7.8z" /></svg>,
};

const ms = (v: number) => ({ "--at": `${Math.round(v)}ms` }) as React.CSSProperties;

/** A run: which request, how many runs so far (0 is the page's own, on load). */
type Run = { i: number; n: number };

/** The note as Pinto shows it: the AI's lines carry the tint and the margin tick, landing one by one. */
function NoteBody({ req, run, first }: { req: Req; run: Run; first: boolean }) {
  const tm = run.n === 0 ? LOAD : TAP;
  const many = req.body.filter((b) => "ai" in b && b.ai).length;
  const step = many > 3 ? 90 : tm.step;
  let k = 0;
  const at = () => tm.line + (k++) * step;
  return (
    <div className={t.note} data-swap={!first || undefined} style={ms(run.n === 0 ? 0 : TAP.note)}>
      {req.body.map((b, j) => {
        const ai = "ai" in b && b.ai;
        const st = ai ? ms(at()) : undefined;
        const run = (s: React.ReactNode) => (ai ? <span className={t.run}>{s}</span> : s);
        const mark = ai ? <i className={t.tick} aria-hidden="true" /> : null;
        switch (b.k) {
          case "title": return <p key={j} className={t.title} data-title>{b.text}</p>;
          case "by": return <p key={j} className={t.by} data-ai={ai || undefined} data-extra={b.extra || undefined} style={st}>{mark}{run(b.text)}</p>;
          case "h": return <p key={j} className={t.h}>{b.text}</p>;
          case "quote": return <p key={j} className={t.quote} data-extra={b.extra || undefined} data-long={b.long || undefined}>{b.text}</p>;
          case "check": return (
            <p key={j} className={t.check} data-ai={ai || undefined} style={st}>{mark}<i className={t.box} aria-hidden="true" />{run(b.text)}</p>
          );
          case "dish": return (
            <p key={j} className={t.dish} data-ai={ai || undefined} style={st}>{mark}{run(<><b>{b.day}</b> {b.text}</>)}</p>
          );
          case "dot": return (
            <p key={j} className={t.dot} data-ai={ai || undefined} style={st}>{mark}<i className={t.bullet} aria-hidden="true" />{run(b.text)}</p>
          );
          case "p": return (
            <p key={j} className={t.p} data-ai={ai || undefined} style={st}>{mark}{run(<>{b.lead && <b>{b.lead} </b>}{b.text}</>)}</p>
          );
        }
      })}
    </div>
  );
}

/** When the run's last line lands, and so when ChatGPT says what it did. */
function doneAt(req: Req, n: number) {
  const tm = n === 0 ? LOAD : TAP;
  const many = req.body.filter((b) => "ai" in b && b.ai).length;
  const step = many > 3 ? 90 : tm.step;
  return n === 0 ? LOAD.answer : TAP.line + (many - 1) * step + TAP.answer;
}

/** Pinto on a Mac: one window, the sidebar folded away, the note's toolbar (back, forward, where the
 *  note lives, then Aa, checklist, table, attach, share, more), then the note. */
function Mac({ req, run, first, at }: { req: Req; run: Run; first: boolean; at?: React.Ref<HTMLDivElement> }) {
  return (
    <div className={t.mac} ref={at} aria-hidden="true">
      <div className={t.bar}>
        <span className={t.lights}><i /><i /><i /></span>
        <span className={t.ico}>{Ico.back}</span><span className={`${t.ico} ${t.dim}`}>{Ico.fwd}</span>
        <span className={t.crumb} key={`c${run.n}`} data-swap={!first || undefined}><span>{req.folder}</span>{Ico.chev}<b>{req.title}</b></span>
        <span className={t.tools}><b>Aa</b><span className={t.ico}>{Ico.check}</span><span className={t.ico}>{Ico.table}</span><span className={`${t.ico} ${t.wideOnly}`}>{Ico.clip}</span><span className={`${t.ico} ${t.wideOnly}`}>{Ico.share}</span><span className={t.ico}>{Ico.more}</span></span>
      </div>
      <div className={t.pane}><NoteBody key={`n${run.n}`} req={req} run={run} first={first} /></div>
    </div>
  );
}

/** Pinto on an iPhone (phones): the note's bar (back to its folder, more), the note, and at its foot the
 *  label the iPhone shows while an AI's change is marked. */
function Phone({ req, run, first }: { req: Req; run: Run; first: boolean }) {
  return (
    <div className={t.iphone} aria-hidden="true">
      <p className={t.ipBar}><span className={t.ipBack}>{Ico.back}{req.folder}</span><span className={t.ipMore}>{Ico.more}</span></p>
      <div className={t.ipPane}><NoteBody key={`p${run.n}`} req={req} run={run} first={first} /></div>
      <p className={t.change} key={`r${run.n}`} style={ms(doneAt(req, run.n) - 120)}>
        <span className={t.changeMark}><AIGlyph name="openai" size={17} color="#1d1b19" /></span>
        <b>{req.summary}</b>{Ico.chev}
      </p>
    </div>
  );
}

/** ChatGPT's Mac app, narrow, as the demo video shows it: dark, Chat and Work at the top, your message
 *  in a grey bubble, "Worked for 6s", the answer naming the note, its actions, and the composer. */
function Chat({ req, run }: { req: Req; run: Run }) {
  const answer = doneAt(req, run.n);
  return (
    <div className={t.gpt} aria-hidden="true">
      <p className={t.gBar}><span className={t.gLights}><i /><i /><i /></span><span className={t.seg}><b>Chat</b><span>Work</span></span></p>
      <div className={t.thread} key={`g${run.n}`} data-tap={run.n > 0 || undefined}>
        {req.before && <p className={t.before}>{req.before}</p>}
        <p className={t.bubble} style={ms(TAP.bubble)}>{req.ask}</p>
        <p className={t.think} style={ms(answer)} />
        <div className={t.reply} style={ms(answer)}>
          <p className={t.worked}>{req.worked}</p>
          <p className={t.answer}>{req.answer}</p>
          <p className={t.acts}><i>{Ico.copy}</i><i>{Ico.speak}</i><i>{Ico.again}</i><i>{Ico.down}</i></p>
        </div>
      </div>
      <p className={t.composer}><i>{Ico.plus}</i><span className={t.ph}>Ask ChatGPT</span><i>{Ico.mic}</i><i className={t.send}>{Ico.wave}</i></p>
    </div>
  );
}

/** The three requests, as buttons: each sends its words to ChatGPT. */
function Chips({ run, go }: { run: Run; go: (i: number) => void }) {
  return (
    <div className={t.chips} role="group" aria-label="Try a request">
      {REQS.map((r, i) => (
        <button key={r.chip} type="button" className={t.chip} data-on={run.i === i || undefined} aria-pressed={run.i === i} onClick={() => go(i)}>
          <span>{r.chip}</span>
          <i className={t.chipSend} aria-hidden="true">{Ico.up}</i>
        </button>
      ))}
    </div>
  );
}

const clamp = (k: number) => Math.min(1, Math.max(0, k));

/** v1's hand-off, on a Mac (Granola's lesson, round 26's `carry`): as you scroll, the headline goes but
 *  the demo's window stays, while the Notes sheet rises under it; the window grows into the Notes
 *  chapter's own window (the same note, now with its notes list and the iPhone) and hands over to it as
 *  the sheet docks. Scroll-linked and linear in the scroll, so it never fights the wheel; the window
 *  barely drifts because the sheet rises at the scroll's own speed. Its z-index (3) puts it over the
 *  Notes sheet (2) and under the whiteboard's (3, later in the page). Reduce Motion and phones: none. */
function useCarry(ref: React.RefObject<HTMLDivElement | null> | null) {
  useEffect(() => {
    const el = ref?.current;
    const write = document.getElementById("s-write");
    const target = write?.querySelector<HTMLElement>("[data-win]");
    const probe = document.querySelector<HTMLElement>("[data-probe]");
    if (!el || !write || !target) return;
    const calm = matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = matchMedia("(max-width: 760px)");
    let raf = 0, on = false;
    // The window's place in the page, and its note title's place in it (unscaled), measured at rest.
    let base = { x: 0, y: 0 }, off = { x: 0, y: 0 }, fs = 1;
    const reset = () => { el.style.transform = ""; el.style.opacity = ""; el.style.visibility = ""; target.style.opacity = ""; el.removeAttribute("data-carrying"); };
    const measure = () => {
      el.style.transform = "";
      const r = el.getBoundingClientRect(), ti = el.querySelector<HTMLElement>("[data-title]");
      base = { x: r.left, y: r.top + scrollY };
      const tr = ti?.getBoundingClientRect();
      off = tr ? { x: tr.left - r.left, y: tr.top - r.top } : { x: 0, y: 0 };
      fs = ti ? parseFloat(getComputedStyle(ti).fontSize) : 1;
    };
    const frame = () => {
      raf = 0;
      if (!on) return;
      const tt = probe?.offsetHeight ?? 106;
      const wt = write.getBoundingClientRect().top;
      const p = clamp((innerHeight - wt) / Math.max(1, innerHeight - tt));
      // Where the window would be if it scrolled with the page; where it lies with its title on the
      // chapter window's title, at that title's size. It gets there by 80% of the way (linear in the
      // scroll), then rides with the sheet while it dissolves into the chapter's window.
      const nt = target.querySelector<HTMLElement>("[data-pane] h3") ?? target;
      const tr = nt.getBoundingClientRect();
      const S = parseFloat(getComputedStyle(nt).fontSize) / fs || 1;
      const nx = base.x, ny = base.y - scrollY;
      const gx = tr.left - off.x * S, gy = tr.top - off.y * S;
      const e = clamp(p / 0.8);
      const x = nx + (gx - nx) * e, y = ny + (gy - ny) * e, sc = 1 + (S - 1) * e;
      const fade = clamp((p - 0.8) / 0.17);
      el.style.transform = p <= 0 ? "" : `translate3d(${(x - nx).toFixed(1)}px, ${(y - ny).toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
      el.style.opacity = fade > 0 ? String(1 - fade) : "";
      el.style.visibility = fade >= 1 ? "hidden" : "";
      target.style.opacity = String(fade);
      el.toggleAttribute("data-carrying", p > 0 && fade < 1);
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const setup = () => {
      on = !calm.matches && !narrow.matches;
      reset();
      if (on) { measure(); frame(); }
    };
    setup();
    addEventListener("scroll", ask, { passive: true });
    addEventListener("resize", setup);
    calm.addEventListener("change", setup); narrow.addEventListener("change", setup);
    document.fonts?.ready.then(setup);
    return () => {
      cancelAnimationFrame(raf); removeEventListener("scroll", ask); removeEventListener("resize", setup);
      calm.removeEventListener("change", setup); narrow.removeEventListener("change", setup); reset();
    };
  }, [ref]);
}

/** The demo. `v`: 1 lays it beside the headline (the Mac window, ChatGPT over its corner, the requests
 *  under it); 2 lays it in a wide frame under a centred headline (ChatGPT on the left, the window on the
 *  right). On a phone both are the iPhone app's note under ChatGPT. */
export function TryDemo({ v }: { v: "1" | "2" }) {
  const [run, setRun] = useState<Run>({ i: 0, n: 0 });
  const said = useRef<HTMLParagraphElement>(null);
  const mac = useRef<HTMLDivElement>(null);
  useCarry(v === "1" ? mac : null);
  const [first, setFirst] = useState(true);
  const go = (i: number) => {
    setFirst(i === run.i);
    setRun((r) => ({ i, n: r.n + 1 }));
  };
  // Say what ChatGPT did once it has (VoiceOver), never on load.
  useEffect(() => {
    if (run.n === 0 || !said.current) return;
    const el = said.current, req = REQS[run.i];
    const id = window.setTimeout(() => { el.textContent = `You asked ChatGPT: ${req.ask} ${req.said}`; }, doneAt(req, run.n));
    return () => clearTimeout(id);
  }, [run]);
  const req = REQS[run.i];
  return (
    <div className={t.demo} data-v={v} role="group" aria-label={`A demo of Pinto Notes with ChatGPT. You asked ChatGPT: ${REQS[0].ask} ${REQS[0].said}`}>
      <div className={t.stage}>
        <Mac req={req} run={run} first={first} at={mac} />
        <Phone req={req} run={run} first={first} />
        <Chat req={req} run={run} />
      </div>
      <Chips run={run} go={go} />
      <p ref={said} className={t.sr} aria-live="polite" />
    </div>
  );
}
