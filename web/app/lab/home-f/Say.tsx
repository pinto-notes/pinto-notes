"use client";

import { APP_STORE_URL } from "@/lib/site";
import { AIGlyph } from "@/lib/ai-glyphs";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Download } from "../../_home/Download";
import { Board, BoardTools, toolAt } from "./Board";
import s from "./f.module.css";

// Direction F, "Say it to any AI": the first screen is one sentence you'd say to your AI, and what it
// makes in Pinto. Three of them, one for each kind of note (a note, a whiteboard, an app), switch on
// their own, or by the tabs. The AI row shows the same works from any of them.
// ?tab=notes|whiteboards|apps&t=<s>&ai=chatgpt|claude|claude-code|codex freezes a frame for stills.

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const mj = (v: number) => { const t = clamp(v); return t * t * t * (10 - 15 * t + 6 * t * t); };
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

type AI = { id: string; name: string; glyph: "openai" | "claude" };
const AIS: AI[] = [
  { id: "chatgpt", name: "ChatGPT", glyph: "openai" },
  { id: "claude", name: "Claude", glyph: "claude" },
  { id: "claude-code", name: "Claude Code", glyph: "claude" },
  { id: "codex", name: "Codex", glyph: "openai" },
];

type Mode = { id: "notes" | "whiteboards" | "apps"; tab: string; say: string; then: string; ai: number; dur: number };
const MODES: Mode[] = [
  { id: "notes", tab: "Notes", say: "Plan my week around the gym.", then: "It writes the note in Pinto. Tick it off on your iPhone.", ai: 0, dur: 8.5 },
  { id: "whiteboards", tab: "Whiteboards", say: "Sketch our publishing flow.", then: "It draws on a whiteboard in Pinto. Then you keep drawing.", ai: 1, dur: 11.5 },
  { id: "apps", tab: "Apps", say: "Make me a habit tracker.", then: "It builds a small app in your notes, ready to use.", ai: 3, dur: 8.5 },
];

const TYPE = 0.034, LEAD = 0.1;
/** When the AI starts on its work: the sentence typed, and a beat. */
const startOf = (m: Mode) => LEAD + m.say.length * TYPE + 0.35;

/// The hero's clock: seconds since the current sentence began, the mode, the AI, and autoplay.
function useShow() {
  const [mode, setMode] = useState(0);
  const [ai, setAi] = useState<number | null>(null);
  const [t, setT] = useState(0);
  const [auto, setAuto] = useState(true);
  const [frozen, setFrozen] = useState(false);
  const start = useRef(0), seen = useRef(true), modeRef = useRef(0), autoRef = useRef(true);
  modeRef.current = mode; autoRef.current = auto;
  const host = useRef<HTMLElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const tab = MODES.findIndex((m) => m.id === q.get("tab"));
    const who = AIS.findIndex((a) => a.id === q.get("ai"));
    if (tab >= 0) setMode(tab);
    if (who >= 0) setAi(who);
    if (q.get("t") !== null) { setT(Number(q.get("t"))); setFrozen(true); setAuto(false); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setT(99); setFrozen(true); setAuto(false); return; }
    const io = new IntersectionObserver(([e]) => { seen.current = e.isIntersecting; });
    if (host.current) io.observe(host.current);
    let raf = 0;
    const tick = (now: number) => {
      if (!start.current) start.current = now;
      if (seen.current) {
        let el = (now - start.current) / 1000;
        if (autoRef.current && el > MODES[modeRef.current].dur) {
          const next = (modeRef.current + 1) % MODES.length;
          modeRef.current = next; setMode(next); start.current = now; el = 0;
        }
        setT(el);
      } else start.current = now - t * 1000;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restart = useCallback(() => { start.current = performance.now(); setT(frozen ? 99 : 0); }, [frozen]);
  const pick = (i: number) => { setAuto(false); setMode(i); modeRef.current = i; restart(); };
  const pickAi = (i: number) => { setAi(i); restart(); };
  return { mode, ai, t, auto, pick, pickAi, host };
}

/** Scales a surface drawn at a fixed design width to the width it is given. */
function useFit(width: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(el.clientWidth / width));
    ro.observe(el);
    setK(el.clientWidth / width);
    return () => ro.disconnect();
  }, [width]);
  return { ref, k };
}

function useCompact() {
  const [c, setC] = useState(false);
  useEffect(() => {
    const m = matchMedia("(max-width: 760px)");
    const on = () => setC(m.matches);
    on(); m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return c;
}

export function Say() {
  const { mode, ai, t, auto, pick, pickAi, host } = useShow();
  const compact = useCompact();
  const m = MODES[mode];
  const who = AIS[ai ?? m.ai];
  const typed = Math.round(clamp((t - LEAD) / (m.say.length * TYPE)) * m.say.length);
  const typing = typed < m.say.length;
  const local = t - startOf(m);
  const thenIn = mj(span(t, startOf(m) - 0.1, startOf(m) + 0.4));
  const W = compact ? 380 : 840, H = compact ? 600 : 590;
  const fit = useFit(W);

  return (
    <section className={s.hero} ref={host} aria-labelledby="say">
      <div className={s.words}>
        <h1 id="say" className={`${s.say} rise`} style={{ "--i": 0 } as React.CSSProperties} aria-label={`${m.say} Say it to any AI, and it's made in Pinto Notes.`}>
          {MODES.map((x) => <span key={x.id} className={s.sayGhost} aria-hidden="true">“{x.say}”</span>)}
          <span className={s.sayLive} aria-hidden="true">“{m.say.slice(0, typed)}{typing ? "" : "”"}<i className={s.caret} data-on={typing ? "" : undefined} /></span>
        </h1>
        <div className={`${s.ais} rise`} style={{ "--i": 1 } as React.CSSProperties} role="group" aria-label="Say it to">
          {AIS.map((a, i) => (
            <button key={a.id} type="button" className={s.ai} aria-pressed={a === who} onClick={() => pickAi(i)}>
              <AIGlyph name={a.glyph} size={compact ? 14 : 16} />{a.name}
            </button>
          ))}
        </div>
        <p className={`${s.then} rise`} style={{ "--i": 2 } as React.CSSProperties}>
          {MODES.map((x) => <span key={x.id} className={s.sayGhost} aria-hidden="true">{x.then}</span>)}
          <span className={s.sayLive} style={{ opacity: 0.35 + 0.65 * thenIn }}>{m.then}</span>
        </p>
        <div className={`${s.ctas} rise`} style={{ "--i": 3 } as React.CSSProperties}>
          <Download note={false} />
          <a className={s.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
            Get it for iPhone
          </a>
        </div>
        <p className={`${s.fine} rise`} style={{ "--i": 4 } as React.CSSProperties}>Free for Mac and iPhone. Open source.</p>
      </div>

      <div className={`${s.stageCol} rise`} style={{ "--i": 1 } as React.CSSProperties}>
        <div className={s.tabs} role="tablist" aria-label="What it makes">
          {MODES.map((x, i) => (
            <button key={x.id} type="button" role="tab" aria-selected={i === mode} className={s.tab} onClick={() => pick(i)}>
              <TabIcon id={x.id} />{x.tab}
              {i === mode && auto && <i className={s.tabBar} style={{ transform: `scaleX(${clamp(t / x.dur).toFixed(4)})` }} />}
            </button>
          ))}
        </div>
        <div ref={fit.ref} className={s.stage} style={{ height: fit.k ? H * fit.k : undefined, aspectRatio: fit.k ? undefined : `${W} / ${H}` }}>
          <div className={s.window} role="tabpanel" aria-label={`${m.tab}: what ${who.name} made in Pinto Notes`}
            style={{ width: W, height: H, transform: `scale(${fit.k || 0.0001})`, visibility: fit.k ? "visible" : "hidden" }} data-compact={compact ? "" : undefined}>
            <Chrome mode={m.id} compact={compact} />
            <div key={`${m.id}${compact}`} className={s.surface} data-mode={m.id}>
              {m.id === "notes" && <NoteView t={local} compact={compact} />}
              {m.id === "whiteboards" && <BoardView t={local} compact={compact} />}
              {m.id === "apps" && <AppView t={local} compact={compact} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── The three create buttons from the app's toolbar: compose, whiteboard, app ── */
function TabIcon({ id }: { id: Mode["id"] }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {id === "notes" && <><path d="M19 12.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5.5" /><path d="m17.5 3.5 3 3-8 8-3.6.6.6-3.6z" /></>}
      {id === "whiteboards" && <><rect x="3.5" y="7.5" width="11" height="11" rx="2.5" /><path d="M8 7.5V6a2.5 2.5 0 0 1 2.5-2.5h7.5A2.5 2.5 0 0 1 20.5 6v7.5a2.5 2.5 0 0 1-2.5 2.5h-3.5" /></>}
      {id === "apps" && <><rect x="4" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" /></>}
    </svg>
  );
}

/* ── The Mac window's toolbar for each kind of note, as in the app's captures ── */
const Ico = ({ d, k }: { d: React.ReactNode; k?: string }) => <svg viewBox="0 0 24 24" aria-hidden="true" className={k}>{d}</svg>;
const SHARE = <><path d="M12 3.5v11M8.5 7 12 3.5 15.5 7" /><path d="M8 10H6.5A1.5 1.5 0 0 0 5 11.5v7A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16" /></>;
const MORE = <><circle cx="6" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="18" cy="12" r="1.2" fill="currentColor" /></>;

function Chrome({ mode, compact }: { mode: Mode["id"]; compact: boolean }) {
  if (compact) {
    return (
      <div className={s.bar} data-compact="">
        <span className={s.backText}><Ico d={<path d="M14.5 5 8 12l6.5 7" />} />Notes</span>
        <span className={s.barRight}><Ico d={SHARE} /><Ico d={MORE} /></span>
      </div>
    );
  }
  const title = mode === "notes" ? null : mode === "whiteboards" ? "Publishing flow" : "Habit tracker";
  return (
    <div className={s.bar}>
      <span className={s.lights}><i /><i /><i /></span>
      {title === null ? (
        <>
          <Ico k={s.barIcon} d={<><rect x="3.5" y="5" width="17" height="14" rx="2.5" /><path d="M9 5v14M5.8 8.5h1.4M5.8 11h1.4" /></>} />
          <Ico k={s.barIcon} d={<path d="M14.5 5 8 12l6.5 7" />} />
          <Ico k={s.barIconMuted} d={<path d="M9.5 5 16 12l-6.5 7" />} />
          <b className={s.barTitle}>Notes</b>
          <span className={s.cluster}>
            <span className={s.aa}>Aa</span>
            <Ico d={<><circle cx="6" cy="7.5" r="2" /><circle cx="6" cy="16.5" r="2" /><path d="M11 7.5h9M11 16.5h9" /></>} />
            <Ico d={<><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M3.5 10h17M3.5 14.5h17M10 5v14" /></>} />
            <Ico d={<path d="m15.5 8-6 6a2 2 0 0 0 2.8 2.8l6.4-6.3a3.6 3.6 0 0 0-5.1-5.1L7.2 11.8a5.2 5.2 0 0 0 7.3 7.3l5-5" />} />
            <Ico d={SHARE} /><Ico d={MORE} />
          </span>
        </>
      ) : (
        <>
          <span className={s.backCircle}><Ico d={<path d="M14.5 5 8 12l6.5 7" />} /></span>
          <b className={s.barTitle}>{title}</b>
          <span className={s.cluster}><Ico d={SHARE} /><Ico d={MORE} /></span>
        </>
      )}
    </div>
  );
}

/* ── 1. A note: Plan my week ── */
const WEEK = [
  ["Gym, Monday at 7", false],
  ["Send Jonas the deck", false],
  ["Gym, Wednesday at 7", false],
  ["Book the Lisbon flights", false],
  ["Gym, Friday at 7", false],
  ["Dinner with Sara, Friday", false],
] as const;

function NoteView({ t, compact }: { t: number; compact: boolean }) {
  const title = "This week";
  const tt = Math.round(clamp(t / 0.45) * title.length);
  const intro = mj(span(t, 0.55, 0.85));
  return (
    <div className={s.note}>
      <h2 className={s.noteTitle}>{title.slice(0, tt)}{tt === 0 && " "}</h2>
      <p className={s.noteIntro} style={{ opacity: intro, transform: `translateY(${((1 - intro) * 6).toFixed(1)}px)` }}>Gym three mornings. The rest fits around it.</p>
      <ul className={s.check}>
        {WEEK.map(([text], i) => {
          const at = 0.95 + i * 0.3;
          const v = mj(span(t, at, at + 0.4)), fresh = v * (1 - span(t, at + 1.3, at + 2.4));
          return (
            <li key={text} style={{ opacity: v, transform: `translateY(${((1 - v) * 8).toFixed(1)}px)`, background: `rgba(240,144,26,${(0.16 * fresh).toFixed(3)})` }}>
              <i />{text}
            </li>
          );
        })}
      </ul>
      {!compact && <p className={s.mention} style={{ opacity: mj(span(t, 3.0, 3.4)) }}>Mentioned in 1 note ›</p>}
    </div>
  );
}

/* ── 2. A whiteboard: Sketch our publishing flow ── */
function BoardView({ t, compact }: { t: number; compact: boolean }) {
  return (
    <div className={s.boardWrap}>
      <div className={s.boardCanvas}><Board t={t} tall={compact} /></div>
      <BoardTools tool={toolAt(t, compact)} compact={compact} />
      {!compact && <span className={s.zoom}>100%</span>}
    </div>
  );
}

/* ── 3. An app: Make me a habit tracker (the Habit tracker template's Today screen) ── */
const HABITS = [
  { name: "Walk", detail: "30 minutes outside", streak: "3-day streak", state: "done" },
  { name: "Read", detail: "20 pages", streak: "9-day streak", state: "done" },
  { name: "Water", detail: "5 of 8 glasses", streak: "2-day streak", state: "count" },
  { name: "No phone in bed", detail: "Charges in the kitchen", streak: "1-day streak", state: "open" },
] as const;
const WEEKDOTS = [[1, 1], [1, 1], [1, 0.5], [1, 0.5]];

function AppView({ t, compact }: { t: number; compact: boolean }) {
  const at = (i: number) => mj(span(t, 0.1 + i * 0.12, 0.5 + i * 0.12));
  const lift = (v: number) => ({ opacity: v, transform: `translateY(${((1 - v) * 12).toFixed(1)}px)` });
  const ring = mj(span(t, 0.6, 1.6)) * 0.75;
  const C = 2 * Math.PI * 40;
  return (
    <div className={s.app}>
      {!compact && (
        <aside className={s.appSide} style={{ opacity: at(0) }}>
          <b>Habit tracker</b>
          <span data-on=""><Ico d={<><circle cx="12" cy="12" r="8" /><path d="m8.5 12 2.4 2.4 4.6-4.8" /></>} />Today</span>
          <span><Ico d={<><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" /></>} />Month</span>
          <span><Ico d={<path d="m4 7 1.6 1.6L8.5 5.6M4 15l1.6 1.6 2.9-3M12 7h8M12 15h8" />} />Habits</span>
        </aside>
      )}
      <div className={s.appMain}>
        <div style={lift(at(1))}>
          <p className={s.appDate}>Tuesday 10 November</p>
          <h2 className={s.appTitle}>Today</h2>
        </div>
        <div className={s.appCols}>
          <div className={s.appLeft}>
            <div className={s.ringCard} style={lift(at(2))}>
              <svg viewBox="0 0 100 100" className={s.ring}>
                <circle cx="50" cy="50" r="40" />
                <circle cx="50" cy="50" r="40" data-on="" strokeDasharray={`${(C * ring).toFixed(1)} ${C.toFixed(1)}`} />
                <text x="50" y="51" textAnchor="middle" dominantBaseline="central">{Math.round(ring * 100)}%</text>
              </svg>
              <div><p className={s.appLabel}>Since Monday</p><b>6 of 8</b><span>Today: 2 of 4 done</span></div>
            </div>
            {!compact && (
              <div className={s.weekCard} style={lift(at(4))}>
                <div className={s.weekHead}><span />{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
                {HABITS.map((h, r) => (
                  <div key={h.name} className={s.weekRow}><span>{h.name}</span>
                    {Array.from({ length: 7 }, (_, d) => {
                      const v = d < 2 ? WEEKDOTS[r][d] : 0;
                      const on = span(t, 1.4 + (r * 2 + d) * 0.07, 1.6 + (r * 2 + d) * 0.07);
                      return <i key={d} data-v={v === 1 && on > 0.5 ? "1" : v === 0.5 && on > 0.5 ? "h" : undefined} />;
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={s.habits}>
            {!compact && <p className={s.appLabel} style={lift(at(3))}>Habits</p>}
            <ul style={lift(at(3))}>
              {HABITS.map((h, i) => {
                const v = mj(span(t, 0.5 + i * 0.14, 0.9 + i * 0.14));
                return (
                  <li key={h.name} style={lift(v)}>
                    <div><b>{h.name}<Ico d={<path d="m9.5 6 6 6-6 6" />} /></b><span>{h.detail} · <em>{h.streak}</em></span></div>
                    {h.state === "done" && <i className={s.done}><Ico d={<path d="m7 12.5 3.2 3.2L17 9" />} /></i>}
                    {h.state === "count" && <span className={s.count}><i>–</i><i data-ring="">+</i></span>}
                    {h.state === "open" && <i className={s.open} />}
                  </li>
                );
              })}
            </ul>
            {!compact && <p className={s.appFoot} style={{ opacity: at(6) }}>Choose a habit to see or change it.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
