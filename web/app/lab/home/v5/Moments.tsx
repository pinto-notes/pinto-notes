"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import m from "./moments.module.css";

// Four moments from real life, each a small scene that plays as a pure function of p (0..1): how far
// the scene has come into view. Nothing pins; scrolling back plays it backwards. `?m=0.5` freezes
// every scene at one progress, and Reduce Motion shows the finished scene.

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const mj = (v: number) => { const x = clamp(v); return x * x * x * (10 - 15 * x + 6 * x * x); };
const over = (v: number) => { const x = clamp(v); const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const rise = (v: number, px = 14): React.CSSProperties => ({ opacity: v, transform: `translateY(${((1 - v) * px).toFixed(1)}px)` });

// A pinned row hands its progress down; scenes outside one (phones, Reduce Motion) measure themselves.
const PinProgress = createContext<number | null>(null);

/// Holds a row on screen while you scroll through it, like the film: the row sticks under the header
/// and the extra height is the scene's time. Wide screens only; elsewhere it's a plain block.
export function Pin({ children, className, length = 150 }: { children: React.ReactNode; className?: string; length?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [p, setP] = useState(0);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("m");
    const wide = matchMedia("(min-width: 901px)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!wide || q !== null) return;
    setOn(true);
    let raf = 0;
    const read = () => { raf = 0; const el = box.current; if (!el) return; const r = el.getBoundingClientRect(); const travel = r.height - (innerHeight - 100); setP(clamp(travel > 0 ? (100 - r.top) / travel : 0)); };
    const go = () => { if (!raf) raf = requestAnimationFrame(read); };
    read(); addEventListener("scroll", go, { passive: true }); addEventListener("resize", go);
    return () => { removeEventListener("scroll", go); removeEventListener("resize", go); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={box} className={m.pinBox} data-on={on || undefined} style={on ? { height: `calc(100vh - 100px + ${length}vh)` } : undefined}>
      <div className={`${m.pinInner} ${className ?? ""}`}>
        <PinProgress.Provider value={on ? p : null}>{children}</PinProgress.Provider>
      </div>
    </div>
  );
}

/// Scenes play by themselves: once most of the scene is on screen, it runs once at its own pace
/// (about five seconds) and rests on its last frame. `replay` plays it again. Pinned rows (if any)
/// still hand their scroll progress down. `?m=` freezes every scene; Reduce Motion shows the end.
const PLAY_MS = 5200;
function useSceneProgress() {
  const pinned = useContext(PinProgress);
  const ref = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState(0);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (pinned !== null) return;
    const q = new URLSearchParams(location.search).get("m");
    if (q !== null) { setOwn(Number(q)); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setOwn(1); return; }
    let raf = 0, start = 0;
    const tick = (now: number) => { if (!start) start = now; const v = Math.min(1, (now - start) / PLAY_MS); setOwn(v); if (v < 1) raf = requestAnimationFrame(tick); };
    setOwn(0);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); raf = requestAnimationFrame(tick); } }, { threshold: 0.6 });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [pinned, run]);
  const p = pinned !== null ? clamp((pinned - 0.08) / 0.8) : own;
  const replay = pinned !== null ? undefined : () => setRun((r) => r + 1);
  return [ref, p, replay] as const;
}

/// A small replay button, shown once a scene has finished.
const Replay = ({ p, onClick }: { p: number; onClick?: () => void }) => !onClick ? null : (
  <button type="button" className={m.replay} onClick={onClick} style={{ opacity: p >= 1 ? 1 : 0, pointerEvents: p >= 1 ? "auto" : "none" }} aria-label="Play again">
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v2.8h2.8" /></svg>Play again
  </button>
);

const Check = ({ on, t = on ? 1 : 0 }: { on: boolean; t?: number }) => (
  <span className={m.box} data-on={on || undefined} style={{ transform: `scale(${t > 0 && t < 1 ? (0.85 + 0.15 * over(t)).toFixed(3) : 1})` }}>
    <svg viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7" pathLength={1} style={{ strokeDashoffset: 1 - clamp(t * 1.4) }} /></svg>
  </span>
);
const By = ({ app, label, v = 1 }: { app: "openai" | "claude"; label: string; v?: number }) => (
  <span className={m.by} style={{ opacity: v, transform: `scale(${(0.8 + 0.2 * v).toFixed(3)})` }}><AIGlyph name={app} size={11} />{label}</span>
);

// Live captions: the words arrive as they're said; the ones not yet said hold their space, so the box
// never jumps.
const spoken = (text: string, k: number) => {
  const words = text.split(" "); const n = Math.ceil(words.length * clamp(k));
  // Only the words said so far; the caption box has a fixed height, so nothing jumps.
  return <span className={m.line}>{words.slice(0, n).join(" ")}</span>;
};

/// Voice mode's two states, driven by one smooth voice-like level (a few slow sines, never random
/// jumps). You talking: five soft bars under a still orb. ChatGPT talking: the orb swells and glows
/// with the level. Each state fades in and out over about 250 ms so they hand over smoothly.
function Voice({ you, ai }: { you: boolean; ai: boolean }) {
  const [t, setT] = useState(0);
  const mix = useRef({ you: 0, ai: 0 });
  const [m2, setM2] = useState({ you: 0, ai: 0 });
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setM2({ you: you ? 1 : 0, ai: ai ? 1 : 0 }); return; }
    let raf = 0, last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      const k = 1 - Math.exp(-dt / 0.09);
      mix.current.you += ((you ? 1 : 0) - mix.current.you) * k;
      mix.current.ai += ((ai ? 1 : 0) - mix.current.ai) * k;
      setM2({ ...mix.current }); setT(now / 1000);
      const settled = Math.abs(mix.current.you - (you ? 1 : 0)) < 0.002 && Math.abs(mix.current.ai - (ai ? 1 : 0)) < 0.002;
      if (!(settled && !you && !ai)) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [you, ai]);
  // A voice-like level: syllables (fast) riding on phrases (slow), 0..1.
  const level = (off: number) => clamp(0.5 + 0.28 * Math.sin(t * 7.3 + off) + 0.16 * Math.sin(t * 13.1 + off * 2.1) + 0.12 * Math.sin(t * 2.2 + off * 0.7));
  const orbAmp = level(0) * m2.ai;
  return (
    <>
      <span className={m.orb} style={{ transform: `scale(${(1 + 0.14 * orbAmp).toFixed(4)})`, boxShadow: `0 ${(8 + 10 * orbAmp).toFixed(1)}px ${(24 + 26 * orbAmp).toFixed(1)}px -6px rgba(50, 120, 235, ${(0.18 + 0.3 * orbAmp).toFixed(3)})` }} />
      <span className={m.wave} style={{ opacity: m2.you }} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => {
          const shape = [0.55, 0.85, 1, 0.85, 0.55][i];
          const h = 6 + 24 * shape * level(i * 1.7) * m2.you;
          return <i key={i} style={{ height: `${h.toFixed(1)}px` }} />;
        })}
      </span>
    </>
  );
}

/// 1. The evening walk: you think out loud to ChatGPT's voice mode, and tomorrow fills in. The phone is
/// voice mode as it really looks (white, the cloudy orb, mic and close); what's said floats beside it.
const TALK = [
  { who: "you", text: "Tomorrow I want to run before work.", at: 0.04 },
  { who: "ai", text: "Five easy kilometres. It's on the list.", at: 0.24 },
  { who: "you", text: "And remind me to call the dentist.", at: 0.46 },
  { who: "ai", text: "Added, after the run.", at: 0.66 },
];
export function Walk() {
  const [ref, p, replay] = useSceneProgress();
  const now = [...TALK].reverse().find((t) => p >= t.at);
  // Speaking only while the reply is being said (its words arrive over about 0.12 of the scene).
  const speaking = now?.who === "ai" && p < now.at + 0.16;
  // You talking: a live waveform under the still orb.
  const listening = now?.who === "you" && p < now.at + 0.16;
  const line1 = over(span(p, 0.34, 0.42)), line2 = over(span(p, 0.74, 0.82));
  return (
    <div ref={ref} className={`${m.stage} ${m.dusk}`}>
      <Replay p={p} onClick={replay} />
      <div className={`${m.phone} ${m.voicePhone}`} aria-hidden="true">
        <div className={m.screen} data-voice="">
          <span className={m.island} />
          <p className={m.status}><b>21:14</b><span className={m.bars}><i /><i /><i /><i /></span></p>
          <span className={m.tune}><svg viewBox="0 0 16 16"><path d="M2 5h7M12 5h2M2 11h2M7 11h7" /><circle cx="10.5" cy="5" r="1.6" /><circle cx="5.5" cy="11" r="1.6" /></svg></span>
          <Voice you={!!listening} ai={!!speaking} />
      <div className={m.spokenIn} aria-hidden="true">
              {TALK.map((t, i) => {
                // One line at a time: the old one leaves first, then the new one arrives.
                const v = i === 0 ? mj(span(p, t.at, t.at + 0.05)) : mj(span(p, t.at + 0.04, t.at + 0.09));
                const gone = i < TALK.length - 1 ? mj(span(p, TALK[i + 1].at, TALK[i + 1].at + 0.035)) : 0;
                return <p key={i} className={m.said} data-who={t.who} style={{ opacity: v * (1 - gone), transform: `translateY(${((1 - v) * 10 - gone * 10).toFixed(1)}px)` }}>
                  <span>{t.who === "you" ? "You" : <><AIGlyph name="openai" size={11} />ChatGPT</>}</span>{spoken(t.text, span(p, t.at + 0.03, t.at + 0.15))}</p>;
              })}
            </div>
          <span className={m.mic}><svg viewBox="0 0 16 16"><rect x="5.5" y="1.5" width="5" height="8.5" rx="2.5" /><path d="M3 7.5a5 5 0 0 0 10 0M8 12.5V15" /></svg></span>
          <span className={m.close}><svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" /></svg></span>
        </div>
      </div>
      <figure className={`${m.note} ${m.walkNote}`}>
        <div className={m.bar}><span className={m.lights}><i /><i /><i /></span><span className={m.folder}>Plans</span></div>
        <div className={m.paper}>
          <h3 className={m.title}>Tomorrow</h3>
          <ul className={m.list}>
            <li><Check on={false} /><span>Pick up the dry cleaning</span></li>
            <li style={{ ...rise(line1), background: `rgba(240,144,26,${(0.14 * line1).toFixed(3)})` }}><Check on={false} /><span>Run, 5 km easy</span><By app="openai" label="ChatGPT" v={line1} /></li>
            <li style={{ ...rise(line2), background: `rgba(240,144,26,${(0.14 * line2).toFixed(3)})` }}><Check on={false} /><span>Call the dentist</span><By app="openai" label="ChatGPT" v={line2} /></li>
          </ul>
        </div>
      </figure>
    </div>
  );
}

/// 2. The week's food: planned in a chat on Sunday, shopped from your phone on Saturday.
const GROCERIES = ["Chickpeas, 2 tins", "Spinach", "Feta", "Lemons", "Orzo", "Cherry tomatoes", "Oat milk"];
export function Shopping() {
  const [ref, p] = useSceneProgress();
  const ask = mj(span(p, 0.02, 0.12)), answer = mj(span(p, 0.14, 0.24));
  const store = mj(span(p, 0.32, 0.42));
  return (
    <div ref={ref} className={m.stage}>
      <figure className={`${m.chat} ${m.shopChat}`} data-app="chatgpt">
        <div className={m.chatTop}><span><AIGlyph name="openai" size={14} />ChatGPT</span><em>Sunday</em></div>
        <p className={m.me} style={rise(ask, 8)}>Plan five dinners for this week. I'm vegetarian.</p>
        <p className={m.tool} style={{ opacity: answer }}>Used Pinto Notes · Groceries</p>
        <p className={m.ai} style={rise(answer, 8)}>Five dinners, and the shopping list is in your notes.</p>
      </figure>
      <p className={m.when} style={rise(store, 10)}>Saturday, at the shop</p>
      <div className={`${m.phone} ${m.shopPhone}`} aria-hidden="true">
        <div className={m.screen}>
          <span className={m.island} />
          <p className={m.navBack}>‹ Food</p>
          <h3 className={m.phoneTitle}>Groceries</h3>
          <p className={m.phoneSub}><By app="openai" label="ChatGPT" v={answer} /> wrote these on Sunday</p>
          <ul className={m.phoneList}>
            {GROCERIES.map((g, i) => {
              const t = span(p, 0.44 + i * 0.065, 0.44 + i * 0.065 + 0.05);
              const written = mj(span(p, 0.16 + i * 0.012, 0.22 + i * 0.012));
              return <li key={g} style={{ opacity: written }}><Check on={t > 0.5} t={t} /><span data-done={t > 0.5 || undefined}>{g}</span></li>;
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/// 3. The brain dump: a messy paragraph in, a sorted to-do list out.
const DUMP = "call mum. bike tyre?? taxes due 31st, book dentist, present for anna (the green lamp), reply jonas re offsite, renew passport before march";
const SORTED = [
  { head: "Today", rows: ["Call mum", "Reply to Jonas about the offsite"] },
  { head: "This week", rows: ["Fix the bike tyre", "Book the dentist", "Present for Anna: the green lamp"] },
  { head: "Later", rows: ["Taxes, due 31 October", "Renew passport before March"] },
];
export function Dump() {
  const [ref, p] = useSceneProgress();
  const typed = span(p, 0.02, 0.2);
  const send = mj(span(p, 0.24, 0.34));
  let k = 0;
  return (
    <div ref={ref} className={m.stage}>
      <figure className={`${m.chat} ${m.dumpChat}`} data-app="claude" style={{ opacity: 1 - 0.35 * send }}>
        <div className={m.chatTop}><span><AIGlyph name="claude" size={14} />Claude</span><em>Monday morning</em></div>
        <p className={m.me}>{DUMP.slice(0, Math.round(DUMP.length * typed))}{typed < 1 && <i className={m.caret} />}</p>
        <p className={m.me} style={rise(send, 6)}>Sort this into my to-do note.</p>
        <p className={m.tool} style={{ opacity: mj(span(p, 0.34, 0.4)) }}>Used Pinto Notes · To do</p>
      </figure>
      <figure className={`${m.note} ${m.dumpNote}`}>
        <div className={m.bar}><span className={m.lights}><i /><i /><i /></span><span className={m.folder}>Notes</span></div>
        <div className={m.paper}>
          <h3 className={m.title}>To do <By app="claude" label="Claude sorted these" v={mj(span(p, 0.86, 0.94))} /></h3>
          {SORTED.map((s) => {
            const hv = mj(span(p, 0.36 + k * 0.05, 0.42 + k * 0.05));
            return (
              <div key={s.head} className={m.group}>
                <h4 style={rise(hv, 8)}>{s.head}</h4>
                <ul className={m.list}>{s.rows.map((r) => { k++; const v = mj(span(p, 0.38 + k * 0.05, 0.45 + k * 0.05)); return <li key={r} style={rise(v, 10)}><Check on={false} /><span>{r}</span></li>; })}</ul>
              </div>
            );
          })}
        </div>
      </figure>
    </div>
  );
}

/// 4. Your agents' notebook: Claude Code and Codex work from one project note and log what they did.
const REQS = ["Retry on bad networks", "Keep edits made offline", "Tests for the upload queue"];
const LOG = [
  { app: "Claude Code", text: "Retries back off up to 30 s.", at: 0.3 },
  { app: "Codex", text: "Offline edits replay in order.", at: 0.52 },
  { app: "Claude Code", text: "12 tests for the queue, all pass.", at: 0.74 },
];
export function Agents() {
  const [ref, p, replay] = useSceneProgress();
  const run = [...LOG].reverse().find((l) => p >= l.at - 0.12);
  return (
    <div ref={ref} className={m.stage}>
      <Replay p={p} onClick={replay} />
      <figure className={`${m.term} ${m.agentTerm}`} aria-label="Claude Code working from the project note">
        <div className={m.termBar}><span className={m.lights}><i /><i /><i /></span><span>{run?.app === "Codex" ? "codex" : "claude"}</span></div>
        <p className={m.prompt}><b>›</b> pick up the sync rewrite</p>
        <p className={m.call}><span>⏺</span> pinto.read Work/Sync rewrite.md</p>
        {LOG.map((l, i) => { const line = `${l.app}: ${l.text}`; const k = span(p, l.at - 0.12, l.at - 0.01); const n = Math.round(line.length * k);
          return <p key={i} className={m.out} style={{ opacity: k > 0 ? 1 : 0 }}>{line.slice(0, n)}{k > 0 && k < 1 && <i className={m.tcaret} />}</p>; })}
      </figure>
      <figure className={`${m.note} ${m.agentNote}`}>
        <div className={m.bar}><span className={m.lights}><i /><i /><i /></span><span className={m.folder}>Work</span></div>
        <div className={m.paper}>
          <h3 className={m.title}>Sync rewrite</h3>
          <p className={m.sub}>What it has to do</p>
          <ul className={m.list}>{REQS.map((r, i) => { const t = span(p, LOG[i].at, LOG[i].at + 0.05); return <li key={r}><Check on={t > 0.5} t={t} /><span data-done={t > 0.5 || undefined}>{r}</span></li>; })}</ul>
          <p className={m.sub} style={{ marginTop: 14 }}>Log</p>
          <ul className={m.log}>{LOG.map((l, i) => { const v = mj(span(p, l.at + 0.02, l.at + 0.09)); return <li key={i} style={rise(v, 8)}><By app={l.app === "Codex" ? "openai" : "claude"} label={l.app} v={1} />{l.text}</li>; })}</ul>
        </div>
      </figure>
    </div>
  );
}

/// 5. Together: a shared shopping list. You at home, Sara at the shop; each change shows up for the
/// other the moment it's made. People and the list, nothing else.
const DUO = [
  { id: "you", name: "You", where: "at home", color: "#c8692a", img: "/home-v5/people/you.webp", side: "l" },
  { id: "sara", name: "Sara", where: "at the shop", color: "#75703c", img: "/home-v5/people/sara.webp", side: "r" },
];
const ITEMS = [
  { text: "Bread", by: 1, ai: false, add: -1, tick: 0.3 },
  { text: "Oat milk", by: 0, ai: false, add: 0.04, tick: 0.4 },
  { text: "Tortillas", by: 0, ai: true, add: 0.2, tick: 0.62 },
  { text: "Avocados", by: 0, ai: true, add: 0.23, tick: 0.7 },
  { text: "Limes", by: 0, ai: true, add: 0.26, tick: 0.78 },
  { text: "Ice cream", by: 1, ai: false, add: 0.84, tick: -1 },
];
const SAID = [
  { who: 0, text: "We're out of oat milk.", at: 0.0 },
  { who: 0, text: "ChatGPT, add what we need for taco night.", at: 0.15 },
  { who: 1, text: "Got it.", at: 0.4 },
  { who: 1, text: "And something for after.", at: 0.82 },
];
export function Together() {
  const [ref, p] = useSceneProgress();
  return (
    <div ref={ref} className={m.together}>
      <figure className={m.shopList}>
        <p className={m.listTitle}>Groceries</p>
        <p className={m.listSub}><b style={{ background: DUO[0].color }} /><b style={{ background: DUO[1].color }} />Shared with Sara</p>
        <ul>
          {ITEMS.map((it, i) => {
            const land = it.add < 0 ? 1 : over(span(p, it.add + 0.04, it.add + 0.1));
            const t = it.tick < 0 ? 0 : span(p, it.tick, it.tick + 0.05);
            const fresh = it.add < 0 ? 0 : land * (1 - span(p, it.add + 0.14, it.add + 0.22));
            return (
              <li key={it.text} style={{ opacity: land, transform: `translateY(${((1 - land) * 10).toFixed(1)}px)`, background: `rgba(240,144,26,${(0.16 * fresh).toFixed(3)})` }}>
                <span className={m.box} data-on={t > 0.5 || undefined} style={{ transform: `scale(${t > 0 && t < 1 ? (0.85 + 0.15 * over(t)).toFixed(3) : 1})`, ...(t > 0.5 ? { background: DUO[1].color } : {}) }}>
                  <svg viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7" pathLength={1} style={{ strokeDashoffset: 1 - clamp(t * 1.4) }} /></svg>
                </span>
                <span className={m.itemText} data-done={t > 0.5 || undefined}>{it.text}</span>
                {it.ai ? <span className={m.aiChip}><AIGlyph name="openai" size={11} />ChatGPT</span> : <img className={m.mini} src={DUO[it.by].img} alt="" />}
              </li>
            );
          })}
        </ul>
      </figure>

      {DUO.map((d, i) => {
        const now = [...SAID].reverse().find((x) => p >= x.at && p < x.at + 0.13);
        const talking = now && now.who === i;
        const b = talking ? mj(span(p, now.at, now.at + 0.03)) * (1 - mj(span(p, now.at + 0.1, now.at + 0.13))) : 0;
        return (
          <div key={d.id} className={m.person} data-side={d.side}>
            {talking && <p className={m.bubble} style={{ opacity: b, transform: `translateY(${((1 - b) * 8).toFixed(1)}px)` }}>{now.text}</p>}
            <span className={m.face} data-talking={talking || undefined}><img src={d.img} alt="" /></span>
            <span className={m.who}>{d.name}<em> · {d.where}</em></span>
          </div>
        );
      })}
    </div>
  );
}

/// 6. Your AI keeps your trackers up to date: you tell Claude what you did, and the habit tracker
/// (the real template's Today view) ticks it, the streaks and the ring move.
const HABITS_T = [
  { name: "Walk", sub: "30 minutes outside", streak: [11, 11], done: true },
  { name: "Read", sub: "20 pages", streak: [10, 10], done: true },
  { name: "Gym", sub: "", streak: [9, 9], done: false, tick: 0.5, subs: ["1 of 3 this week", "2 of 3 this week"], unit: "week" },
  { name: "Spanish", sub: "One Duolingo lesson", streak: [2, 3], done: false, tick: 0.62 },
  { name: "No phone in bed", sub: "It charges in the kitchen", streak: [1, 1], done: false },
];
export function Habits() {
  const [ref, p, replay] = useSceneProgress();
  const ask = 1, used = mj(span(p, 0.3, 0.38)), answer = mj(span(p, 0.74, 0.84));
  const ticks = HABITS_T.map((h) => (h.done ? 1 : h.tick ? span(p, h.tick, h.tick + 0.06) : 0));
  const done = ticks.reduce((a, t) => a + (t > 0.5 ? 1 : 0), 0);
  const ringTo = 0.4 + 0.2 * clamp(span(p, 0.5, 0.56)) + 0.2 * clamp(span(p, 0.62, 0.68));
  const C = 2 * Math.PI * 34;
  return (
    <div ref={ref} className={m.stage}>
      <Replay p={p} onClick={replay} />
      <figure className={`${m.chat} ${m.habitChat}`} data-app="claude">
        <div className={m.chatTop}><span><AIGlyph name="claude" size={14} />Claude</span><em>Tuesday, 19:40</em></div>
        <p className={m.me} style={rise(ask, 8)}>Did the gym this morning, and my Spanish lesson.</p>
        <p className={m.tool} style={{ opacity: used }}>Used Pinto Notes · Habit tracker</p>
        <p className={m.ai} style={rise(answer, 8)}>Ticked both. Spanish is on a three-day streak.</p>
      </figure>
      <figure className={m.habitApp}>
        <div className={m.bar}><span className={m.lights}><i /><i /><i /></span><span className={m.folder}>Habit tracker</span></div>
        <div className={m.habitBody}>
          <div className={m.ringRow}>
            <span className={m.ringWrap}><svg viewBox="0 0 80 80" className={m.ring}><circle cx="40" cy="40" r="34" /><circle cx="40" cy="40" r="34" style={{ strokeDasharray: C, strokeDashoffset: C * (1 - ringTo) }} /></svg><b>{Math.round(ringTo * 100)}%</b></span>
            <div><p className={m.ringBig}>{done} of 5 done today</p><p className={m.ringSmall}>Tuesday</p></div>
          </div>
          <ul className={m.habitList}>
            {HABITS_T.map((h, i) => {
              const t = ticks[i], on = t > 0.5;
              const sub = h.subs ? h.subs[on ? 1 : 0] : h.sub;
              const streak = h.streak[on && !h.done ? 1 : 0];
              const flash = !h.done && h.tick ? Math.sin(Math.PI * span(p, h.tick, h.tick + 0.16)) : 0;
              return (
                <li key={h.name} style={{ background: `rgba(240,144,26,${(0.14 * flash).toFixed(3)})` }}>
                  <div><b>{h.name}</b><span>{sub} · <em>{streak}-{h.unit ?? "day"} streak</em></span></div>
                  <span className={m.bigCheck} data-on={on || undefined} style={{ transform: `scale(${t > 0 && t < 1 ? (0.85 + 0.15 * over(t)).toFixed(3) : 1})` }}>
                    <svg viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7" pathLength={1} style={{ strokeDashoffset: 1 - clamp(t * 1.4) }} /></svg>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </figure>
    </div>
  );
}

// ── People at the front: three people, each in their moment. A portrait, what they say (speech
// bubbles come out of the person, so it's obvious who talks), and the one note or app it lands in. ──

/// A spoken line: from the person (cream, a tiny waveform mark) or from their AI (white, its logo).
function Say({ who, ai, text, v, className }: { who: "me" | "ai"; ai?: "openai" | "claude"; text: string; v: number; className?: string }) {
  return (
    <p className={`${m.say} ${className ?? ""}`} data-who={who} style={{ opacity: v, transform: `translateY(${((1 - v) * 10).toFixed(1)}px) scale(${(0.96 + 0.04 * v).toFixed(3)})` }}>
      {who === "ai" && ai ? <span className={m.sayMark}><AIGlyph name={ai} size={11} /></span> : <span className={m.sayWave} aria-hidden="true"><i /><i /><i /><i /></span>}
      {text}
    </p>
  );
}
const Portrait = ({ src, name, when }: { src: string; name: string; when: string }) => (
  <figure className={m.portrait}><img src={src} alt="" /><figcaption><b>{name}</b> · {when}</figcaption></figure>
);

/// Maya, every evening: plans tomorrow on a walk, out loud with ChatGPT.
const MAYA = [
  { who: "me" as const, text: "Did my run. Skipped the reading.", at: 0.04 },
  { who: "ai" as const, text: "Run ticked. Reading moves to tomorrow.", at: 0.2 },
  { who: "me" as const, text: "And call the dentist before ten.", at: 0.44 },
  { who: "ai" as const, text: "Added to tomorrow.", at: 0.6 },
];
export function Walker() {
  const [ref, p, replay] = useSceneProgress();
  const shown = (i: number) => mj(span(p, MAYA[i].at, MAYA[i].at + 0.06)) * (i < MAYA.length - 2 ? 1 - mj(span(p, MAYA[i + 2].at, MAYA[i + 2].at + 0.05)) : 1);
  const runTick = span(p, 0.24, 0.3), read = over(span(p, 0.28, 0.36)), dentist = over(span(p, 0.64, 0.72));
  return (
    <div ref={ref} className={`${m.stage} ${m.frontier}`}>
      <Replay p={p} onClick={replay} />
      <Portrait src="/home-v5/people/you.webp" name="Maya" when="out for a walk" />
      <div className={m.says}>{MAYA.map((s, i) => <Say key={i} who={s.who} ai="openai" text={s.text} v={shown(i)} />)}</div>
      <figure className={`${m.note} ${m.personNote}`}>
        <div className={m.bar}><span className={m.lights}><i /><i /><i /></span><span className={m.folder}>Plans</span></div>
        <div className={m.paper}>
          <h3 className={m.title}>Today</h3>
          <ul className={m.list}>
            <li><Check on={runTick > 0.5} t={runTick} /><span data-done={runTick > 0.5 || undefined}>Run, 5 km</span></li>
            <li style={{ opacity: 1 - 0.6 * read }}><Check on={false} /><span style={{ textDecoration: read > 0.5 ? "line-through" : undefined }}>Read 20 pages</span></li>
          </ul>
          <h3 className={`${m.title} ${m.title2}`}>Tomorrow</h3>
          <ul className={m.list}>
            <li style={{ ...rise(read), background: `rgba(240,144,26,${(0.14 * read).toFixed(3)})` }}><Check on={false} /><span>Read 20 pages</span><By app="openai" label="moved" v={read} /></li>
            <li style={{ ...rise(dentist), background: `rgba(240,144,26,${(0.14 * dentist).toFixed(3)})` }}><Check on={false} /><span>Call the dentist, before 10</span><By app="openai" label="ChatGPT" v={dentist} /></li>
          </ul>
        </div>
      </figure>
    </div>
  );
}

/// Jonas, all day: Claude Code and Codex work from the same project notes and write back to them.
const JONAS = [
  { who: "Claude Code", ai: "claude" as const, line: "Retry with backoff", at: 0.18 },
  { who: "Codex", ai: "openai" as const, line: "Offline edits replay", at: 0.44 },
  { who: "Claude Code", ai: "claude" as const, line: "12 tests, all pass", at: 0.68 },
];
export function Builder() {
  const [ref, p, replay] = useSceneProgress();
  const intro = mj(span(p, 0.02, 0.1)) * (1 - mj(span(p, 0.16, 0.2)));
  const active = JONAS.findIndex((j) => p >= j.at - 0.08 && p < j.at + 0.08);
  return (
    <div ref={ref} className={`${m.stage} ${m.frontier}`}>
      <Replay p={p} onClick={replay} />
      <Portrait src="/home-v5/people/jonas.webp" name="Jonas" when="building his app" />
      <div className={m.says}><Say who="me" text="Pick up the sync rewrite. It's all in my notes." v={intro} /></div>
      <div className={m.agents} aria-hidden="true">
        {[{ n: "Claude Code", g: "claude" as const, c: "#d97757" }, { n: "Codex", g: "openai" as const, c: "#0d0d0d" }].map((a) => (
          <span key={a.n} className={m.agent} data-on={(active >= 0 && JONAS[active].who === a.n) || undefined}>
            <span className={m.agentDisc}><AIGlyph name={a.g} size={20} color={a.c} /></span>{a.n}
          </span>
        ))}
      </div>
      <figure className={`${m.note} ${m.personNote}`}>
        <div className={m.bar}><span className={m.lights}><i /><i /><i /></span><span className={m.folder}>Work</span></div>
        <div className={m.paper}>
          <h3 className={m.title}>Sync rewrite</h3>
          <p className={m.sub}>Plan · decisions · log</p>
          <ul className={m.list}>
            <li><span className={m.dot} />Offline-first. Never lose an edit.</li>
            {JONAS.map((j, i) => { const v = over(span(p, j.at, j.at + 0.07)); const fresh = v * (1 - span(p, j.at + 0.12, j.at + 0.22));
              return <li key={i} style={{ ...rise(v), background: `rgba(240,144,26,${(0.14 * fresh).toFixed(3)})` }}><Check on={v > 0.5} t={v} /><span>{j.line}</span><By app={j.ai} label={j.who} v={v} /></li>; })}
          </ul>
        </div>
      </figure>
    </div>
  );
}

/// Sara, every morning: built her own gym log, and just tells ChatGPT what she lifted.
const LIFTS = [
  { name: "Bench press", from: "60 kg", to: "62.5 kg", best: true, at: 0.42 },
  { name: "Squat", from: "80 kg", to: "80 kg", best: false, at: 0.5 },
  { name: "Pull-ups", from: "3 × 6", to: "3 × 7", best: true, at: 0.58 },
];
export function Optimiser() {
  const [ref, p, replay] = useSceneProgress();
  const s1 = mj(span(p, 0.04, 0.1)) * (1 - mj(span(p, 0.7, 0.75))), s2 = mj(span(p, 0.3, 0.36));
  const bars = [0.52, 0.58, 0.6, 0.66, 0.7];
  const grow = mj(span(p, 0.42, 0.52));
  return (
    <div ref={ref} className={`${m.stage} ${m.frontier}`}>
      <Replay p={p} onClick={replay} />
      <Portrait src="/home-v5/people/sara.webp" name="Sara" when="after the gym" />
      <div className={m.says}>
        <Say who="me" text="Bench 62.5 today, pull-ups three sets of seven." v={s1} />
        <Say who="ai" ai="openai" text="Logged. Two new bests this week." v={s2} />
      </div>
      <figure className={m.gymApp}>
        <div className={m.bar}><span className={m.lights}><i /><i /><i /></span><span className={m.folder}>Gym log</span></div>
        <div className={m.gymBody}>
          <div className={m.gymHead}><div><p className={m.gymKick}>Push day · week 6</p><h3>Today</h3></div>
            <div className={m.spark} aria-hidden="true">{bars.map((b, i) => <i key={i} style={{ height: `${((i === bars.length - 1 ? b + 0.18 * grow : b) * 100).toFixed(0)}%` }} />)}</div></div>
          <ul className={m.lifts}>
            {LIFTS.map((l) => { const v = span(p, l.at, l.at + 0.06); const on = v > 0.5;
              return <li key={l.name} style={{ background: `rgba(240,144,26,${(0.14 * Math.sin(Math.PI * span(p, l.at, l.at + 0.2))).toFixed(3)})` }}>
                <b>{l.name}</b><span>{on ? l.to : l.from}</span>
                {l.best && <em style={{ opacity: v, transform: `scale(${(0.8 + 0.2 * over(v)).toFixed(3)})` }}>New best</em>}
              </li>; })}
          </ul>
          <p className={m.gymFoot}>Built from one ask: “make me a gym log”.</p>
        </div>
      </figure>
    </div>
  );
}
