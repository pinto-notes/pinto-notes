"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import f from "./film.module.css";

// "The week": one note, one week, every AI, as a pure function of progress p (0..1). Scroll scrubs it
// on desktop (pinned); on phones and with ?t= it plays on time. Every p is a finished frame.

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const mj = (v: number) => { const x = clamp(v); return x * x * x * (10 - 15 * x + 6 * x * x); };
const over = (v: number) => { const x = clamp(v); const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const LINES = [
  { id: "mon", text: "Mon · 5 km easy" },
  { id: "wed", text: "Wed · Intervals, 6 × 400 m" },
  { id: "thu", text: "Thu · 5 km easy", moved: "Sun · 5 km easy" },
  { id: "sat", text: "Sat · Long run, 12 km" },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Marks the shared glyph set doesn't have yet (lab only): Grok, and Meta's mark for Muse.
const GROK = "M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815";
const META = "M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z";
const ORBIT: { name: string; glyph: "openai" | "claude" | null; path: string; color: string; x: number; y: number; tx: number; ty: number }[] = [
  { name: "ChatGPT", glyph: "openai" as const, path: "", color: "#0d0d0d", x: 54, y: 17, tx: 62, ty: 34 },
  { name: "Claude", glyph: "claude" as const, path: "", color: "#d97757", x: 93, y: 13, tx: 84, ty: 32 },
  { name: "Grok", glyph: null, path: GROK, color: "#0d0d0d", x: 95, y: 86, tx: 86, ty: 68 },
  { name: "Muse", glyph: null, path: META, color: "#0866ff", x: 55, y: 85, tx: 62, ty: 68 },
];

export type Caption = { at: number[]; day: number; text: string };
const CAPTIONS: Caption[] = [
  { at: [0, 0.27], day: 0, text: "Tell one AI." },
  { at: [0.27, 0.47], day: 2, text: "Every AI reads the same notebook." },
  { at: [0.47, 0.69], day: 4, text: "Plans don't die here." },
  { at: [0.69, 0.81], day: 6, text: "You stay in charge." },
  { at: [0.81, 1.01], day: 6, text: "The notebook you and your AI share." },
];

function Frame({ p: p0, lean = 34, heroOn = false, captions = CAPTIONS as Caption[], stopAt = 1 }: { p: number; lean?: number; heroOn?: boolean; captions?: Caption[]; stopAt?: number }) {
  // With a hero, the first few percent belong to it: the hero scrolls away while the note slides from
  // the right to the middle, the day strip arrives and ChatGPT asks. The week then plays as before.
  const h = heroOn ? mj(span(p0, 0.03, 0.075)) : 1;
  // `stopAt` ends the week early (version 5 stops on Sunday's tick, before the desk pull-out).
  const p = (heroOn ? span(p0, 0.07, 1) : p0) * stopAt;
  // Beat 1, Monday: ChatGPT in, four lines write, ChatGPT's mark lands.
  const gIn = heroOn ? mj(span(p0, 0.04, 0.09)) : 1, gOut = mj(span(p, 0.28, 0.33));
  const write = LINES.map((_, i) => span(p, 0.12 + i * 0.025, 0.12 + i * 0.025 + 0.035));
  const gMark = over(span(p, 0.22, 0.26));
  // Beat 2, Wednesday: Claude in, the thread from the Wednesday line, the answer.
  const cIn = mj(span(p, 0.3, 0.36)), cOut = mj(span(p, 0.7, 0.75));
  const thread = mj(span(p, 0.37, 0.42)) * (1 - mj(span(p, 0.46, 0.49)));
  const wedAnswer = mj(span(p, 0.41, 0.45));
  // Beat 3, Friday: a new ask, Mon and Wed tick, Thursday moves to Sunday, Claude's mark.
  const friAsk = mj(span(p, 0.48, 0.52));
  const tickMon = span(p, 0.53, 0.56), tickWed = span(p, 0.56, 0.59);
  const move = mj(span(p, 0.6, 0.66));
  const cMark = over(span(p, 0.65, 0.69));
  // Beat 4, Sunday: your cursor ticks the Sunday run.
  const cur = mj(span(p, 0.72, 0.77)), tickSun = span(p, 0.78, 0.8), curOut = mj(span(p, 0.8, 0.83));
  // Beat 5: pull out to the desk.
  const pull = mj(span(p, 0.83, 0.96));
  // The camera: the note leans away from whichever AI is talking, and pushes in a touch while it changes.
  const camX = lean * gIn * (1 - gOut) - lean * cIn * (1 - cOut);
  const busy = Math.max(Math.sin(Math.PI * span(p, 0.11, 0.26)), Math.sin(Math.PI * span(p, 0.52, 0.69)), Math.sin(Math.PI * span(p, 0.72, 0.81)));
  const camZ = 1 + 0.045 * busy;
  const cap = captions.find((c) => p >= c.at[0] && p < c.at[1]) ?? captions[captions.length - 1];
  const capIdx = captions.indexOf(cap);
  const capIn = capIdx === 0 ? (heroOn ? mj(span(p0, 0.05, 0.09)) : 1) : mj(span(p, cap.at[0], cap.at[0] + 0.025));

  // Slots: Thursday (slot 2) and Saturday (slot 3) trade places as Thursday becomes Sunday.
  const slot = (i: number) => (i === 2 ? lerp(2, 3, move) : i === 3 ? lerp(3, 2, move) : i);
  const ticks = [tickMon, tickWed, tickSun, 0];
  const gFade = gMark * (1 - mj(span(p, 0.44, 0.5)));
  const tinted = (i: number) => (i === 2 ? Math.max(gFade, cMark) : gFade);

  return (
    <div className={f.stage} style={heroOn ? { backgroundColor: `rgba(251, 238, 221, ${h.toFixed(3)})` } : undefined}>
      <img className={f.desk} src="/home-d/desk.webp" alt="" style={{ opacity: pull, transform: `scale(${lerp(1.12, 1, pull).toFixed(3)})` }} />

      {heroOn && h < 1 && (
        // Around the note on the first screen: every AI it works with, each threaded to the note.
        <div className={f.orbit} aria-hidden="true" style={{ opacity: 1 - h, transform: `scale(${(1 + 0.06 * h).toFixed(3)})` }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            {ORBIT.map((o) => <path key={o.name} d={`M ${o.x} ${o.y} Q ${(o.x + o.tx) / 2} ${o.y}, ${o.tx} ${o.ty}`} />)}
          </svg>
          {ORBIT.map((o, i) => (
            <span key={o.name} className={f.disc} style={{ left: `${o.x}%`, top: `${o.y}%`, animationDelay: `${i * -1.3}s` }}>
              <span className={f.discMark}>{o.glyph ? <AIGlyph name={o.glyph} size={26} color={o.color} /> : <svg width={26} height={26} viewBox="0 0 24 24" fill={o.color}><path d={o.path} /></svg>}</span>{o.name}
            </span>
          ))}
        </div>
      )}

      <ol className={f.days} aria-hidden="true" style={heroOn ? { opacity: h } : undefined}>
        {DAYS.map((d, i) => <li key={d} data-on={i === cap.day || undefined} data-past={i < cap.day || undefined}>{d}</li>)}
      </ol>

      <p key={capIdx} className={f.caption} style={{ opacity: capIn }}>{cap.text}</p>

      <div className={f.noteWrap} style={{ transform: `translate(calc(-50% + ${((1 - h) * 46).toFixed(1)}% + ${camX.toFixed(1)}px), -50%) scale(${(camZ * lerp(1, 0.78, pull)).toFixed(3)}) rotate(${lerp(0, -2.5, pull).toFixed(2)}deg)` }}>
        <figure className={f.note}>
          <div className={f.bar}><span className={f.lights}><i /><i /><i /></span><span className={f.folder}>Health</span></div>
          <div className={f.paper}>
            <h3 className={f.title}>Running plan</h3>
            <p className={f.sub}>Half marathon on 30 November. Four runs a week.</p>
            <ul className={f.lines}>
              {LINES.map((l, i) => {
                const w = write[i];
                const text = l.moved && move > 0.5 ? l.moved : l.text;
                const shown = w >= 1 ? text : text.slice(0, Math.round(text.length * w));
                const t = ticks[i];
                const tint = tinted(i);
                return (
                  <li key={l.id} style={{ transform: `translateY(${(slot(i) * 50).toFixed(1)}px)`, zIndex: i === 2 ? 2 : 1 }}
                    data-lift={i === 2 && move > 0 && move < 1 || undefined}>
                    {w < 1 && <span className={f.ghost} style={{ opacity: 1 - clamp(w * 2.5), width: `${[52, 66, 48, 58][i]}%` }} aria-hidden="true" />}
                    <span className={f.row} style={{ opacity: w > 0 ? 1 : 0, background: `rgba(240, 144, 26, ${(0.16 * tint).toFixed(3)})` }}>
                      <span className={f.box} data-on={t > 0.5 || undefined} style={{ transform: `scale(${t > 0 && t < 1 ? (0.85 + 0.15 * over(t)).toFixed(3) : 1})` }}>
                        <svg viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7" pathLength={1} style={{ strokeDashoffset: 1 - clamp(t * 1.4) }} /></svg>
                      </span>
                      <span className={f.text} data-done={t > 0.5 || undefined}>{shown}{w > 0 && w < 1 && <i className={f.caret} />}</span>
                      {i === 0 && <span className={f.by} style={{ opacity: gMark, transform: `scale(${(0.8 + 0.2 * gMark).toFixed(3)})` }}><AIGlyph name="openai" size={11} />ChatGPT<span className={f.long}> wrote these</span></span>}
                      {i === 2 && <span className={f.by} style={{ opacity: cMark, transform: `scale(${(0.8 + 0.2 * cMark).toFixed(3)})` }}><AIGlyph name="claude" size={11} />Claude<span className={f.long}> moved it from Thursday</span></span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </figure>
        <svg className={f.cursor} viewBox="0 0 24 24" aria-hidden="true"
          style={{ opacity: cur * (1 - curOut), transform: `translate(${lerp(300, 38, cur).toFixed(1)}px, ${lerp(420, 322, cur).toFixed(1)}px) scale(${tickSun > 0 && tickSun < 1 ? 0.88 : 1})` }}>
          <path d="M4 2l15 9-7 1.5L8.5 20z" />
        </svg>
      </div>

      {/* ChatGPT, Monday */}
      <figure className={`${f.chat} ${f.left}`} data-app="chatgpt" style={{ opacity: gIn * (1 - gOut), transform: `translate(${lerp(-60, 0, gIn) - 60 * gOut}px, -50%)` }}>
        <div className={f.chatTop}><span><AIGlyph name="openai" size={14} />ChatGPT</span><em>Monday</em></div>
        <p className={f.me}>I'm running a half marathon on 30 November. Plan four runs a week in my notes.</p>
        <p className={f.tool}>Used Pinto Notes</p>
        <p className={f.ai} style={{ opacity: mj(span(p, 0.2, 0.24)) }}>Done. It's in Running plan.</p>
      </figure>

      {/* Claude, Wednesday then Friday */}
      <figure className={`${f.chat} ${f.right}`} data-app="claude" style={{ opacity: cIn * (1 - cOut), transform: `translate(${lerp(60, 0, cIn) + 60 * cOut}px, -50%)` }}>
        <div className={f.chatTop}><span><AIGlyph name="claude" size={14} />Claude</span><em>{friAsk > 0.5 ? "Friday" : "Wednesday"}</em></div>
        <div className={f.swap}>
          <div style={{ opacity: 1 - friAsk }}>
            <p className={f.me}>What should I run today?</p>
            <p className={f.tool}>Used Pinto Notes · Running plan</p>
            <p className={f.ai} style={{ opacity: wedAnswer }}>Intervals: 6 × 400 m, with a slow lap between each.</p>
          </div>
          <div style={{ opacity: friAsk }}>
            <p className={f.me}>How did my week go?</p>
            <p className={f.tool}>Used Pinto Notes · Running plan</p>
            <p className={f.ai} style={{ opacity: mj(span(p, 0.62, 0.67)) }}>Two of four done. I moved Thursday's run to Sunday, so you're still on track.</p>
          </div>
        </div>
      </figure>

      <svg className={f.thread} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M 62 47 C 70 47, 70 45, 74 45" pathLength={1} style={{ strokeDashoffset: 1 - thread, opacity: thread > 0 ? 1 : 0 }} />
      </svg>
    </div>
  );
}

// The hero leaves as the week starts: it scrolls up for real and fades, before ChatGPT arrives.
const heroFade = (p: number): React.CSSProperties => { const o = mj(span(p, 0.004, 0.032)); return { opacity: 1 - o, filter: o > 0 ? `blur(${(o * 4).toFixed(1)}px)` : undefined, visibility: o >= 1 ? "hidden" : undefined }; };

/// Pinned and scrubbed by scroll on wide screens; played on time on phones, with Reduce Motion
/// showing the last frame. `?t=0..1` freezes progress for review.
export function Film({ hero, captions, stopAt }: { hero?: React.ReactNode; captions?: Caption[]; stopAt?: number } = {}) {
  const box = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const [pinned, setPinned] = useState(true);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("p");
    let frozen = false;
    (window as unknown as { __setP?: (v: number) => void }).__setP = (v) => { frozen = true; setP(v); };
    if (q !== null) { setP(Number(q)); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setPinned(false); setP(1); return; }
    const narrow = matchMedia("(max-width: 900px)");
    let raf = 0;
    if (narrow.matches) {
      setPinned(false);
      let start = 0;
      const tick = (now: number) => { if (frozen) return; if (!start) start = now; const v = (now - start) / 16000; setP(Math.min(1, v)); if (v < 1) raf = requestAnimationFrame(tick); };
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !start) { raf = requestAnimationFrame(tick); io.disconnect(); } }, { threshold: 0.4 });
      if (box.current) io.observe(box.current);
      return () => { io.disconnect(); cancelAnimationFrame(raf); };
    }
    const read = () => { raf = 0; if (frozen) return; const el = box.current; if (!el) return; const r = el.getBoundingClientRect(); const travel = r.height - innerHeight; setP(clamp(travel > 0 ? -r.top / travel : 0)); };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={box} className={f.film} data-pinned={pinned || undefined} data-hero={hero ? "" : undefined}>
      {hero && <div className={f.heroLayer} style={pinned ? heroFade(p) : undefined}>{hero}</div>}
      <div className={f.pin}><Frame p={p} lean={pinned ? 34 : 0} heroOn={!!hero && pinned} captions={captions} stopAt={stopAt} /></div>
    </div>
  );
}
