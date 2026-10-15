"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { Download } from "../../kit";
import { Film, type Caption } from "../v2/Film";
import h from "../../home-h/h.module.css";
import x from "./heroes2.module.css";
import c from "./continue.module.css";

// Version 1 of "how the hero hands over": a genuine continuation. Her note on the phone IS the film's
// note. As you scroll, that one note leaves her phone and settles in the middle of the screen; only
// then does the film's stage (panel, day strip, caption) appear around it, and her next day plays on
// the same note. Everything is a pure function of scroll progress p; `?p=` freezes it.

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const mj = (v: number) => { const t = clamp(v); return t * t * t * (10 - 15 * t + 6 * t * t); };
const over = (v: number) => { const t = clamp(v); const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Phases of p.
const FLY = [0.02, 0.2];   // the note leaves the phone and settles in the middle
const STAGE = [0.2, 0.27]; // then the stage appears around it
// Three beats, each one big, connected change. The caption carries the day.
const BEATS = [
  { at: 0.27, text: "This week, in one note." },
  { at: 0.31, text: "Tuesday · Your AI keeps it up to date." },
  { at: 0.5, text: "Thursday · Life happens." },
  { at: 0.64, text: "Friday · Ask how your week went." },
  { at: 0.96, text: "The notebook you and your AI share." },
];
// Friday's answer, line by line, and the row each line lights up.
const ANSWER = [
  { text: "Two of three runs done.", rows: ["mon", "wed"], at: 0.72 },
  { text: "The dentist is booked.", rows: ["dentist"], at: 0.77 },
  { text: "You missed Thursday, so I moved it to Sunday.", rows: ["thu"], at: 0.82 },
  { text: "The Lisbon flights are due today.", rows: ["flights"], at: 0.88 },
];
const LIT = (p: number, row: string) => {
  const a = ANSWER.find((x) => x.rows.includes(row)); if (!a) return 0;
  return Math.sin(Math.PI * span(p, a.at, a.at + 0.05));
};
/// Which row is "active" right now, for the connector line and the row's lift.
export const activeRow = (p: number): string | null => {
  if (p >= 0.33 && p < 0.47) return "dentist";
  if (p >= 0.52 && p < 0.62) return "thu";
  const a = [...ANSWER].reverse().find((x) => p >= x.at && p < x.at + 0.07);
  return a ? a.rows[a.rows.length - 1] : null;
};

/// A checkbox that ticks.
function Check({ t }: { t: number }) {
  return (
    <i className={c.chk} data-on={t > 0.5 || undefined} style={{ transform: `scale(${t > 0 && t < 1 ? (0.85 + 0.15 * over(t)).toFixed(3) : 1})` }}>
      <svg viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7" pathLength={1} style={{ strokeDashoffset: 1 - clamp(t * 1.4) }} /></svg>
    </i>
  );
}

const Chip = ({ ai, v = 1, label }: { ai: "openai" | "claude" | "you" | "missed"; v?: number; label?: string }) => (
  <em data-ai={ai} style={{ opacity: v }}>
    {ai === "openai" || ai === "claude" ? <AIGlyph name={ai} size={8} color={ai === "claude" ? "#d97757" : undefined} /> : null}
    {label ?? (ai === "claude" ? "Claude" : ai === "openai" ? "ChatGPT" : ai === "you" ? "You" : "Missed")}
  </em>
);

/// Her week: the plan she made on the walk; then the week happens to it.
function Note({ p, f }: { p: number; f: number }) {
  // Mon and Wed are already ticked by you when the note lands (the stage says "This week").
  const done = mj(span(p, 0.23, 0.27));
  // Tuesday: Claude books the dentist (tick, time).
  const dTick = span(p, 0.38, 0.41), dMark = over(span(p, 0.39, 0.43));
  // Thursday: the run slips.
  const missed = mj(span(p, 0.53, 0.57));
  // Friday: Thursday's run moves to Sunday.
  const moved = mj(span(p, 0.84, 0.88)), mMark = over(span(p, 0.85, 0.89));
  const act = activeRow(p);
  const row = (id: string, extra?: number): React.CSSProperties => {
    const lit = Math.max(LIT(p, id), extra ?? 0, act === id && p < 0.66 ? 1 : 0);
    return { background: `rgba(240,144,26,${(0.18 * lit).toFixed(3)})`, 
      boxShadow: lit > 0.05 ? `inset 0 0 0 1.5px rgba(217,122,23,${(0.55 * lit).toFixed(2)})` : undefined };
  };
  return (
    <div className={c.scIn}>
      <p className={c.status} style={{ opacity: 1 - mj(span(f, 0, 0.6)), maxHeight: `${(1 - f) * 12}cqw`, marginBottom: `${(1 - f) * 6}cqw`, overflow: "hidden" }}><b>21:40</b><span /></p>
      <p className={c.back} style={{ opacity: 1 - f, maxHeight: `${(1 - f) * 8}cqw`, marginBottom: `${(1 - f) * 2}cqw`, overflow: "hidden" }}>‹ My notebook</p>
      <h3 className={c.title}>This week</h3>
      <p className={c.sub}>Half marathon in six weeks. Lisbon on the 18th, so keep the evenings light.</p>
      <p className={c.section}>Training</p>
      <ul className={c.list}>
        <li data-row="mon" style={row("mon")}><Check t={done} /><span data-done={done > 0.5 || undefined}>Mon · Run, 5 km</span><Chip ai="openai" /></li>
        <li data-row="wed" style={row("wed")}><Check t={done} /><span data-done={done > 0.5 || undefined}>Wed · Intervals</span><Chip ai="openai" /></li>
        <li data-row="thu" style={{ ...row("thu"), opacity: 1 - 0.45 * missed * (1 - moved) }}>
          <Check t={0} /><span style={{ textDecoration: missed > 0.5 && moved < 0.5 ? "line-through" : undefined, textDecorationColor: "rgba(190,70,40,0.6)" }}>{moved > 0.5 ? "Sun · Run, 5 km" : "Thu · Run, 5 km"}</span>
          {moved > 0.5 ? <Chip ai="claude" v={mMark} label="Claude moved it" /> : missed > 0.5 ? <Chip ai="missed" v={missed} /> : <Chip ai="openai" />}
        </li>
      </ul>
      <p className={c.section}>To do</p>
      <ul className={c.list}>
        <li data-row="dentist" style={row("dentist")}>
          <Check t={dTick} /><span data-done={dTick > 0.5 || undefined}>{dTick > 0.5 ? "Dentist · Thu 10:00" : "Call the dentist"}</span>
          {dTick > 0.5 ? <Chip ai="claude" v={dMark} /> : <Chip ai="openai" />}
        </li>
        <li data-row="flights" style={row("flights")}><Check t={0} /><span>Book Lisbon flights · by Fri</span><Chip ai="openai" /></li>
      </ul>
    </div>
  );
}

function useProgress() {
  const box = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const [mode, setMode] = useState<"wait" | "live" | "still">("wait");
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("p");
    if (!matchMedia("(min-width: 901px)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) { setMode("still"); return; }
    setMode("live");
    if (q !== null) { setP(Number(q)); return; }
    let raf = 0;
    const read = () => { raf = 0; const el = box.current; if (!el) return; const r = el.getBoundingClientRect(); const travel = r.height - innerHeight; setP(clamp(travel > 0 ? -r.top / travel : 0)); };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return { box, p, mode };
}

/// The phone screen's rectangle inside the pinned stage, measured once (and on resize).
function useScreenRect(pin: React.RefObject<HTMLDivElement | null>, screen: React.RefObject<HTMLDivElement | null>, live: boolean) {
  const [r, setR] = useState<null | { x: number; y: number; w: number; h: number; vw: number; vh: number }>(null);
  useEffect(() => {
    if (!live) return;
    const m = () => { const a = pin.current?.getBoundingClientRect(), s = screen.current?.getBoundingClientRect(); if (a && s) setR({ x: s.left - a.left, y: s.top - a.top, w: s.width, h: s.height, vw: a.width, vh: a.height }); };
    const t = setTimeout(m, 60); addEventListener("resize", m);
    return () => { clearTimeout(t); removeEventListener("resize", m); };
  }, [live, pin, screen]);
  return r;
}

const HERO_SAID = "Plan my week. Three runs, the dentist, and the Lisbon flights.";

export function ContinueHero({ captions }: { captions: Caption[] }) {
  const { box, p, mode } = useProgress();
  const pin = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const r = useScreenRect(pin, screen, mode === "live");
  const note = useRef<HTMLDivElement>(null);

  const fly = mj(span(p, FLY[0], FLY[1]));
  const heroOut = mj(span(p, 0.01, 0.14));
  const stage = mj(span(p, STAGE[0], STAGE[1]));
  const beat = [...BEATS].reverse().find((b) => p >= b.at);
  const capIn = beat ? mj(span(p, beat.at, beat.at + 0.025)) * stage : 0;

  // Target: as big as fits under the caption (contents scale with the note's width).
  const tw = r ? Math.min(560, r.vw * 0.38, (r.vh - 390) / 1.36) : 0, th = tw * 1.36;
  const tx = r ? r.vw / 2 - tw / 2 : 0, ty = r ? 204 + (r.vh - 204 - 180 - th) / 2 : 0;
  const s0 = r ? r.w / tw : 1, sc = lerp(s0, 1, fly);
  const noteBox = r ? { left: tx, top: ty, width: tw, height: lerp(r.h / s0, th, fly), transformOrigin: "0 0",
    transform: `translate(${lerp(r.x - tx, 0, fly).toFixed(2)}px, ${lerp(r.y - ty, 0, fly).toFixed(2)}px) scale(${sc.toFixed(5)})` } : null;

  // Chats: Tuesday on the left (Claude), Friday on the right (Claude).
  const tueIn = mj(span(p, 0.31, 0.34)) * (1 - mj(span(p, 0.47, 0.5)));
  const tueAns = mj(span(p, 0.36, 0.39));
  const friIn = mj(span(p, 0.66, 0.69));
  const said = ANSWER.filter((a2) => p >= a2.at - 0.01);


  return (
    <div ref={box} className={c.box}>
      <div ref={pin} className={c.pin}>
        {/* The stage of the film, appearing only once the note is in the middle. */}
        <div className={c.stage} style={{ opacity: stage, transform: `scale(${(0.97 + 0.03 * stage).toFixed(4)})` }} aria-hidden={stage < 0.5}>
          <p className={c.caption} style={{ opacity: capIn }}>{beat?.text}</p>
          <Timeline p={p} />
        </div>

        {/* The hero. */}
        <section className={x.editorial} style={{ opacity: 1 - heroOut, transform: `translateY(${(-24 * heroOut).toFixed(1)}px)`, pointerEvents: heroOut > 0.5 ? "none" : undefined }}>
          <div className={x.edWords}>
            <h1 className={x.edH1}>The notebook <span className={h.mark}>you and your AI</span> share.</h1>
            <p className={x.edLede}>A notes app for you and every AI you use. It looks and feels like Apple Notes.</p>
            <div className={x.edCtas}>
              <Download />
              <span className={x.soonBtn} aria-disabled="true">
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
                Coming to iPhone
              </span>
            </div>
            <p className={x.edFine}>Free for Mac. Brings your Apple Notes over.</p>
          </div>
          <div className={`${x.moment} ${x.shoulder} ${x.splitScene}`}>
            <div className={x.momentFit}>
              <img className={x.momentArt} src="/home-v5/hero/phone-shoulder.webp" alt="" />
              <div ref={screen} className={`${x.screen} ${c.screenSlot}`} />
              <div className={x.saidBox}>
                <p className={x.saidMe}><span className={x.scWave} aria-hidden="true"><i /><i /><i /><i /></span>{HERO_SAID}</p>
                <p className={x.saidAi}><span><AIGlyph name="openai" size={12} />ChatGPT</span>Done, it's in your notes. The flights need booking by Friday, so I flagged them.</p>
              </div>
            </div>
          </div>
        </section>

        {/* The one note: on her phone, then in the middle of the screen. */}
        {noteBox && (
          <div ref={note} className={c.note} style={{ ...noteBox, borderRadius: lerp(r!.w * 0.11, 18, fly) / sc,
            boxShadow: `0 0 0 0.5px rgba(60,30,5,${(0.22 * fly).toFixed(2)}), 0 ${(40 * fly).toFixed(0)}px ${(80 * fly).toFixed(0)}px -36px rgba(60,30,5,${(0.5 * fly).toFixed(2)})` }}>
            <div className={c.winBar} style={{ height: `${(fly * 9).toFixed(2)}cqw`, opacity: mj(span(fly, 0.4, 1)) }}>
              <span className={c.lights}><i /><i /><i /></span><span className={c.folder}>Plans</span>
            </div>
            <Note p={p} f={fly} />

          </div>
        )}

        {noteBox && <>
          <figure className={c.chat} data-side="l" style={{ opacity: tueIn, transform: `translate(${((1 - tueIn) * -30).toFixed(1)}px, -50%)`, right: `calc(50% + ${tw / 2 + 22}px)` }}>
            <p className={c.bMe}>Booked the dentist, Thursday at 10.</p>
            <p className={c.bAi} style={{ opacity: tueAns }}><span><AIGlyph name="claude" size={13} color="#d97757" />Claude</span>Ticked it off and added the time.</p>
          </figure>
          <figure className={c.chat} data-side="r" style={{ opacity: friIn, transform: `translate(${((1 - friIn) * 30).toFixed(1)}px, -50%)`, left: `calc(50% + ${tw / 2 + 22}px)` }}>
            <p className={c.bMe}>How did my week go?</p>
            <p className={c.bAi} style={{ opacity: said.length ? 1 : 0 }}><span><AIGlyph name="claude" size={13} color="#d97757" />Claude</span>
              {said.map((a2, i) => <span key={i} className={c.seg} style={{ opacity: mj(span(p, a2.at - 0.01, a2.at + 0.02)) }}>{a2.text} </span>)}
            </p>
          </figure>
        </>}
      </div>
    </div>
  );
}

/// A clear week timeline along the bottom: Mon to Sun on a track that fills as the week goes, the day
/// you're on large, and what happened marked under its day.
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EVENTS = [
  { day: 1, text: "Dentist booked", at: 0.38 },
  { day: 3, text: "Missed run", at: 0.54, bad: true }, { day: 4, text: "Check-in", at: 0.68 }, { day: 6, text: "Run moved here", at: 0.86 },
];
function Timeline({ p }: { p: number }) {
  // Progress across the week (0..4 = Mon..Fri), stepping with the beats.
  const pos = p < 0.31 ? lerp(0, 0.9, mj(span(p, 0.27, 0.31))) : p < 0.5 ? 1 : p < 0.64 ? lerp(1, 3, mj(span(p, 0.5, 0.54))) : lerp(3, 4, mj(span(p, 0.64, 0.68)));
  const now = Math.round(pos);
  return (
    <div className={c.timeline} aria-hidden="true">
      <div className={c.track}><span className={c.fill} style={{ width: `${((pos / 6) * 100).toFixed(2)}%` }} /></div>
      {DAYS.map((d, i) => {
        const ev = EVENTS.find((e) => e.day === i && p >= e.at);
        return (
          <div key={d} className={c.day} style={{ left: `${((i / 6) * 100).toFixed(2)}%` }} data-past={i < now || undefined} data-now={i === now || undefined}>
            <span className={c.dot} />
            <b>{d}</b>
            {ev && <em data-bad={ev.bad || undefined} style={{ opacity: mj(span(p, ev.at, ev.at + 0.03)) }}>{ev.text}</em>}
          </div>
        );
      })}
    </div>
  );
}

/// The vertical centre of a row in the note, relative to the pinned stage (measured after layout).
function useRowY(note: React.RefObject<HTMLDivElement | null>, row: string | null, p: number) {
  const [y, setY] = useState<number | null>(null);
  useLayoutEffect(() => {
    const n = note.current; if (!n || !row) { if (y !== null) setY(null); return; }
    const li = n.querySelector(`[data-row="${row}"]`) as HTMLElement | null; const pin = n.parentElement;
    if (!li || !pin) return;
    const a = li.getBoundingClientRect(), b = pin.getBoundingClientRect();
    const v = a.top + a.height / 2 - b.top;
    if (y === null || Math.abs(v - y) > 0.5) setY(v);
  }, [note, row, p, y]);
  return row ? y : null;
}

/// Phones and Reduce Motion get the still hero and the film, as version 2 does.
export function useContinueMode() {
  const [m, setM] = useState<"wait" | "live" | "still">("wait");
  useEffect(() => { setM(!matchMedia("(min-width: 901px)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches ? "still" : "live"); }, []);
  return m;
}
export function ContinueOrFallback({ captions, fallback }: { captions: Caption[]; fallback: React.ReactNode }) {
  const m = useContinueMode();
  if (m === "still") return <>{fallback}</>;
  return <ContinueHero captions={captions} />;
}
export { Film };
