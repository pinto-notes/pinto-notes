"use client";

import { useEffect, useRef, useState } from "react";
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
const BEATS = [
  { at: 0.27, slot: 0, text: "You tick things off." },
  { at: 0.4, slot: 1, text: "Your AI keeps it up to date." },
  { at: 0.52, slot: 2, text: "You tick things off." },
  { at: 0.61, slot: 3, text: "Life happens." },
  { at: 0.71, slot: 4, text: "Ask how your week went." },
  { at: 0.93, slot: 4, text: "The notebook you and your AI share." },
];
const SLOTS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/// A checkbox; `cur` (0..1) brings your pointer in to it, tip exactly on its centre, and `t` ticks it.
function Check({ t, cur = 0, press = false }: { t: number; cur?: number; press?: boolean }) {
  return (
    <i className={c.chk} data-on={t > 0.5 || undefined} style={{ transform: `scale(${t > 0 && t < 1 ? (0.85 + 0.15 * over(t)).toFixed(3) : 1})` }}>
      <svg viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7" pathLength={1} style={{ strokeDashoffset: 1 - clamp(t * 1.4) }} /></svg>
      {cur > 0 && (
        <svg className={c.cursor} viewBox="0 0 24 24" aria-hidden="true"
          style={{ opacity: Math.min(1, cur * 3), transform: `translate(${((1 - mj(cur)) * 260).toFixed(1)}%, ${((1 - mj(cur)) * 180).toFixed(1)}%) scale(${press ? 0.86 : 1})` }}>
          <path d="M4 2l15 9-7 1.5L8.5 20z" />
        </svg>
      )}
    </i>
  );
}

const Chip = ({ ai, v = 1 }: { ai: "openai" | "claude"; v?: number }) => (
  <em data-ai={ai === "claude" ? "claude" : undefined} style={{ opacity: v }}>
    <AIGlyph name={ai} size={8} color={ai === "claude" ? "#d97757" : undefined} />{ai === "claude" ? "Claude" : "ChatGPT"}
  </em>
);

/// Her week: the plan she made on the walk, then the week happens to it, and on Friday she asks.
function Note({ p, f }: { p: number; f: number }) {
  // Mon: you tick the run. Tue: Claude books the dentist. Wed: you tick the run. Thu: the run slips.
  // Fri: Claude moves Thursday's run to Sunday and flags the flights.
  const curMon = span(p, 0.29, 0.35) * (1 - span(p, 0.39, 0.41)), tickMon = span(p, 0.35, 0.38);
  const dentist = mj(span(p, 0.44, 0.48)), dMark = over(span(p, 0.45, 0.5));
  const curWed = span(p, 0.53, 0.57) * (1 - span(p, 0.6, 0.62)), tickWed = span(p, 0.57, 0.6);
  const slip = mj(span(p, 0.63, 0.67)) * (1 - mj(span(p, 0.84, 0.88)));
  const moved = mj(span(p, 0.84, 0.88)), mMark = over(span(p, 0.85, 0.9));
  const flag = Math.sin(Math.PI * span(p, 0.87, 0.97));
  const tint = (v: number, rgb = "240,144,26") => ({ background: `rgba(${rgb},${(0.16 * v).toFixed(3)})` });
  return (
    <div className={c.scIn}>
      <p className={c.status} style={{ opacity: 1 - mj(span(f, 0, 0.6)), maxHeight: `${(1 - f) * 12}cqw`, marginBottom: `${(1 - f) * 6}cqw`, overflow: "hidden" }}><b>21:40</b><span /></p>
      <p className={c.back}>‹ My notebook</p>
      <h3 className={c.title}>This week</h3>
      <ul className={c.list}>
        <li><Check t={tickMon} cur={curMon} press={tickMon > 0 && tickMon < 1} /><span data-done={tickMon > 0.5 || undefined}>Mon · Run, 5 km</span><Chip ai="openai" /></li>
        <li><Check t={tickWed} cur={curWed} press={tickWed > 0 && tickWed < 1} /><span data-done={tickWed > 0.5 || undefined}>Wed · Intervals</span><Chip ai="openai" /></li>
        <li style={tint(Math.max(slip, moved * (1 - span(p, 0.95, 1))), moved > 0.5 ? "240,144,26" : "200,90,60")}>
          <Check t={0} /><span>{moved > 0.5 ? "Sun · Run, 5 km" : "Thu · Run, 5 km"}</span>
          {moved > 0.5 ? <Chip ai="claude" v={mMark} /> : <Chip ai="openai" />}
        </li>
        <li style={tint(dMark * (1 - span(p, 0.55, 0.62)))}>
          <Check t={dentist} /><span data-done={dentist > 0.5 || undefined}>{dentist > 0.5 ? "Dentist · Thu 10:00" : "Call the dentist"}</span>
          {dentist > 0.5 ? <Chip ai="claude" v={dMark} /> : <Chip ai="openai" />}
        </li>
        <li style={tint(flag)}><Check t={0} /><span>Book Lisbon flights · by Fri</span><Chip ai="openai" /></li>
      </ul>
      <p className={c.section}>Every day</p>
      <ul className={c.list}>
        <li><Check t={1} /><span data-done="">Read 20 pages</span></li>
        <li><Check t={0} />Call mum</li>
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

  if (mode === "still") {
    // Phones and Reduce Motion: the still hero, then the film, explained by a title.
    return null;
  }

  const fly = mj(span(p, FLY[0], FLY[1]));
  const heroOut = mj(span(p, 0.01, 0.14));
  const stage = mj(span(p, STAGE[0], STAGE[1]));
  const beat = [...BEATS].reverse().find((b) => p >= b.at);
  const capIn = beat ? mj(span(p, beat.at, beat.at + 0.03)) * stage : 0;

  // Target: the note settles in the middle of the stage, wider and taller, with readable text.
  const tw = r ? Math.min(460, r.vw * 0.3) : 0, th = tw * 1.35;
  const tx = r ? r.vw / 2 - tw / 2 : 0, ty = r ? 100 + (r.vh - 100) / 2 - th / 2 - 28 : 0;
  // The note keeps its final size and is scaled down onto the phone's screen at the start: a pure
  // transform, so the flight is smooth. Its contents are sized from its width, so it reads the same.
  const s0 = r ? r.w / tw : 1, sc = lerp(s0, 1, fly);
  // Height: on the phone the note fills the whole screen; it eases to its own height as it lands.
  const noteBox = r ? { left: tx, top: ty, width: tw, height: lerp(r.h / s0, th, fly), transformOrigin: "0 0",
    transform: `translate(${lerp(r.x - tx, 0, fly).toFixed(2)}px, ${lerp(r.y - ty, 0, fly).toFixed(2)}px) scale(${sc.toFixed(5)})` } : null;

  // Chats around the note.
  const claudeIn = mj(span(p, 0.4, 0.43)) * (1 - mj(span(p, 0.5, 0.53)));
  const claudeAns = mj(span(p, 0.42, 0.45));
  const museIn = mj(span(p, 0.71, 0.75));
  const museAns = mj(span(p, 0.78, 0.84));

  return (
    <div ref={box} className={c.box}>
      <div ref={pin} className={c.pin}>
        {/* The stage of the film, appearing only once the note is in the middle. */}
        <div className={c.stage} style={{ opacity: stage, transform: `scale(${(0.97 + 0.03 * stage).toFixed(4)})` }} aria-hidden={stage < 0.5}>
          <ol className={c.slots}>{SLOTS.map((s, i) => <li key={s} data-on={beat?.slot === i || undefined} data-past={beat && i < beat.slot || undefined}>{s}</li>)}</ol>
          <p className={c.caption} style={{ opacity: capIn }}>{beat?.text}</p>
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
          <div className={c.note} style={{ ...noteBox, borderRadius: lerp(r!.w * 0.11, 18, fly) / sc,
            boxShadow: `0 0 0 0.5px rgba(60,30,5,${(0.22 * fly).toFixed(2)}), 0 ${(40 * fly).toFixed(0)}px ${(80 * fly).toFixed(0)}px -36px rgba(60,30,5,${(0.5 * fly).toFixed(2)})` }}>
            <Note p={p} f={fly} />

          </div>
        )}

        {/* Lunch: Claude, on her Mac. Evening: Muse. */}
        {noteBox && <>
          <figure className={c.chat} data-side="l" style={{ opacity: claudeIn, transform: `translate(${((1 - claudeIn) * -30).toFixed(1)}px, -50%)`, right: `calc(50% + ${tw / 2 + 22}px)` }}>
            <div className={c.chatTop}><span><AIGlyph name="claude" size={14} color="#d97757" />Claude</span><em>Tuesday</em></div>
            <p className={c.me}>Booked the dentist, Thursday at 10.</p>
            <p className={c.tool}>Updated This week</p>
            <p className={c.ai} style={{ opacity: claudeAns }}>Ticked it off and added the time.</p>
          </figure>
          <figure className={c.chat} data-side="r" style={{ opacity: museIn, transform: `translate(${((1 - museIn) * 30).toFixed(1)}px, -50%)`, left: `calc(50% + ${tw / 2 + 22}px)` }}>
            <div className={c.chatTop}><span><AIGlyph name="claude" size={14} color="#d97757" />Claude</span><em>Friday</em></div>
            <p className={c.me}>How did my week go?</p>
            <p className={c.tool}>Read This week</p>
            <p className={c.ai} style={{ opacity: museAns }}>Two of three runs, and the dentist is done. You missed Thursday, so I moved it to Sunday. The Lisbon flights are due today.</p>
          </figure>
        </>}
      </div>
    </div>
  );
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
