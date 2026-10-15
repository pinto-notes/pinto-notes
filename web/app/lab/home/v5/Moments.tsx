"use client";

import { useEffect, useRef, useState } from "react";
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

function useSceneProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("m");
    if (q !== null) { setP(Number(q)); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setP(1); return; }
    let raf = 0;
    // Starts as the scene's top comes up past the bottom of the screen; done when its top is near the top third.
    const read = () => { raf = 0; const el = ref.current; if (!el) return; const r = el.getBoundingClientRect(); setP(clamp((innerHeight * 0.95 - r.top) / (innerHeight * 0.72))); };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return [ref, p] as const;
}

const Check = ({ on, t = on ? 1 : 0 }: { on: boolean; t?: number }) => (
  <span className={m.box} data-on={on || undefined} style={{ transform: `scale(${t > 0 && t < 1 ? (0.85 + 0.15 * over(t)).toFixed(3) : 1})` }}>
    <svg viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7" pathLength={1} style={{ strokeDashoffset: 1 - clamp(t * 1.4) }} /></svg>
  </span>
);
const By = ({ app, label, v = 1 }: { app: "openai" | "claude"; label: string; v?: number }) => (
  <span className={m.by} style={{ opacity: v, transform: `scale(${(0.8 + 0.2 * v).toFixed(3)})` }}><AIGlyph name={app} size={11} />{label}</span>
);

/// 1. The evening walk: you think out loud to ChatGPT's voice mode, and tomorrow fills in. The phone is
/// voice mode as it really looks (white, the cloudy orb, mic and close); what's said floats beside it.
const TALK = [
  { who: "you", text: "Tomorrow I want to run before work.", at: 0.04 },
  { who: "ai", text: "Five easy kilometres before work. It's on tomorrow's list.", at: 0.24 },
  { who: "you", text: "And remind me to call the dentist.", at: 0.46 },
  { who: "ai", text: "Added, after the run.", at: 0.66 },
];
export function Walk() {
  const [ref, p] = useSceneProgress();
  const now = [...TALK].reverse().find((t) => p >= t.at);
  const speaking = now?.who === "ai";
  const line1 = over(span(p, 0.34, 0.42)), line2 = over(span(p, 0.74, 0.82));
  return (
    <div ref={ref} className={`${m.stage} ${m.dusk}`}>
      <div className={`${m.phone} ${m.voicePhone}`} aria-hidden="true">
        <div className={m.screen} data-voice="">
          <span className={m.island} />
          <p className={m.status}><b>21:14</b><span className={m.bars}><i /><i /><i /><i /></span></p>
          <span className={m.tune}><svg viewBox="0 0 16 16"><path d="M2 5h7M12 5h2M2 11h2M7 11h7" /><circle cx="10.5" cy="5" r="1.6" /><circle cx="5.5" cy="11" r="1.6" /></svg></span>
          <span className={m.orb} data-speaking={speaking || undefined}><i /><i /></span>
          <span className={m.mic}><svg viewBox="0 0 16 16"><rect x="5.5" y="1.5" width="5" height="8.5" rx="2.5" /><path d="M3 7.5a5 5 0 0 0 10 0M8 12.5V15" /></svg></span>
          <span className={m.close}><svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" /></svg></span>
        </div>
      </div>
      <div className={m.spoken} aria-hidden="true">
        {TALK.map((t, i) => {
          const v = mj(span(p, t.at, t.at + 0.06));
          const gone = i < TALK.length - 1 ? mj(span(p, TALK[i + 1].at, TALK[i + 1].at + 0.05)) : 0;
          return <p key={i} className={m.said} data-who={t.who} style={{ opacity: v * (1 - gone), transform: `translateY(${((1 - v) * 10 - gone * 10).toFixed(1)}px)` }}>
            <span>{t.who === "you" ? "You" : <><AIGlyph name="openai" size={11} />ChatGPT</>}</span>{t.text}</p>;
        })}
      </div>
      <figure className={`${m.note} ${m.walkNote}`}>
        <div className={m.bar}><span className={m.lights}><i /><i /><i /></span><span className={m.folder}>Plans</span></div>
        <div className={m.paper}>
          <h3 className={m.title}>Tomorrow</h3>
          <ul className={m.list}>
            <li><Check on={false} /><span>Pick up the dry cleaning</span></li>
            <li style={{ ...rise(line1), background: `rgba(240,144,26,${(0.14 * line1).toFixed(3)})` }}><Check on={false} /><span>Run before work, 5 km easy</span><By app="openai" label="ChatGPT" v={line1} /></li>
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
  const [ref, p] = useSceneProgress();
  const run = [...LOG].reverse().find((l) => p >= l.at - 0.12);
  return (
    <div ref={ref} className={m.stage}>
      <figure className={`${m.term} ${m.agentTerm}`} aria-label="Claude Code working from the project note">
        <div className={m.termBar}><span className={m.lights}><i /><i /><i /></span><span>{run?.app === "Codex" ? "codex" : "claude"}</span></div>
        <p className={m.prompt}><b>›</b> pick up the sync rewrite</p>
        <p className={m.call}><span>⏺</span> pinto.read Work/Sync rewrite.md</p>
        {LOG.map((l, i) => { const v = mj(span(p, l.at - 0.1, l.at - 0.02)); return <p key={i} className={m.out} style={rise(v, 6)}>{l.app}: {l.text}</p>; })}
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

/// 5. Together: people, not an app. Three people around one small shared note, each with their own
/// AI beside them. What each person (or their AI) does travels along a thread into the note.
const PEOPLE_BASE = [
  { id: "sara", name: "Sara", ai: "openai" as const, aiName: "ChatGPT", color: "#75703c", x: 15, y: 40, img: "/home-v5/people/sara.webp" },
  { id: "jonas", name: "Jonas", ai: "claude" as const, aiName: "Claude", color: "#5f7a5c", x: 85, y: 40, img: "/home-v5/people/jonas.webp" },
  { id: "you", name: "You", ai: "claude" as const, aiName: "Claude", color: "#c8692a", x: 50, y: 72, img: "/home-v5/people/you.webp" },
];
const NOTE_WIDE = { x: 50, y: 31 };
const EVENTS = [
  { who: 0, ai: false, said: "Dinner on Friday? I know a place.", line: "Fri · Dinner at Taberna", at: 0.04 },
  { who: 0, ai: true, said: "Added a day trip to Sintra on Thursday.", line: "Thu · Day trip to Sintra", at: 0.22 },
  { who: 1, ai: false, said: "I'll take the museum.", line: "Mon · Gulbenkian Museum", at: 0.4 },
  { who: 1, ai: true, said: "It's closed Mondays. Moved it to Friday morning.", line: "Fri · Gulbenkian, 10:00", at: 0.58 },
  { who: 2, ai: false, said: "Flights are booked.", line: "Flights booked", at: 0.76 },
];
// On a phone the people sit under the note instead of around it.
const PHONE_SPOTS = [{ x: 24, y: 60 }, { x: 76, y: 60 }, { x: 50, y: 84 }];
const PHONE_NOTE = { x: 50, y: 24 };
export function Together() {
  const [ref, p] = useSceneProgress();
  const [narrow, setNarrow] = useState(false);
  useEffect(() => { const q = matchMedia("(max-width: 760px)"); const on = () => setNarrow(q.matches); on(); q.addEventListener("change", on); return () => q.removeEventListener("change", on); }, []);
  const NOTE = narrow ? PHONE_NOTE : NOTE_WIDE;
  const PEOPLE = PEOPLE_BASE.map((pp, i) => (narrow ? { ...pp, ...PHONE_SPOTS[i] } : pp));
  return (
    <div ref={ref} className={m.together}>
      <svg className={m.threads} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {PEOPLE.map((pp, i) => {
          const draw = mj(span(p, 0.0 + i * 0.03, 0.12 + i * 0.03));
          const midX = (pp.x + NOTE.x) / 2, midY = Math.min(pp.y, NOTE.y) - 6;
          return <path key={pp.id} d={`M ${pp.x} ${pp.y} Q ${midX} ${midY} ${NOTE.x} ${NOTE.y}`} style={{ opacity: 0.6 * draw, stroke: pp.color }} />;
        })}
      </svg>

      <figure className={m.tinyNote} style={{ left: `${NOTE.x}%`, top: `${NOTE.y}%` }}>
        <p className={m.tinyTitle}>Lisbon, 14–18 May</p>
        <ul>
          {EVENTS.map((e, i) => {
            const land = over(span(p, e.at + 0.1, e.at + 0.15));
            const moved = i === 2 && p >= EVENTS[3].at + 0.12;
            return <li key={i} style={{ opacity: moved ? 0.35 : land, transform: `translateY(${((1 - land) * 8).toFixed(1)}px)`, textDecoration: moved ? "line-through" : undefined }}>
              <i style={{ background: PEOPLE[e.who].color }} />{e.line}{e.ai && <AIGlyph name={PEOPLE[e.who].ai} size={10} />}</li>;
          })}
        </ul>
      </figure>

      {EVENTS.map((e, i) => {
        // The change travels from the person (or their AI) to the note.
        const t = mj(span(p, e.at + 0.04, e.at + 0.12));
        const pp = PEOPLE[e.who];
        const fx = pp.x + (e.ai ? (pp.x < 50 ? 4 : pp.x > 50 ? -4 : 6) : 0), fy = pp.y - (e.ai ? 9 : 0);
        const midX = (fx + NOTE.x) / 2, midY = Math.min(fy, NOTE.y) - 6;
        const x = (1 - t) * (1 - t) * fx + 2 * (1 - t) * t * midX + t * t * NOTE.x;
        const y = (1 - t) * (1 - t) * fy + 2 * (1 - t) * t * midY + t * t * NOTE.y;
        const v = t > 0 && t < 1 ? 1 : 0;
        return <span key={i} className={m.spark} style={{ left: `${x}%`, top: `${y}%`, opacity: v, background: pp.color }} />;
      })}

      {PEOPLE.map((pp, i) => {
        const now = [...EVENTS].reverse().find((e) => p >= e.at && p < e.at + 0.17);
        const talking = now && now.who === i;
        const bubble = talking ? mj(span(p, now.at, now.at + 0.03)) * (1 - mj(span(p, now.at + 0.14, now.at + 0.17))) : 0;
        const appear = over(span(p, 0.0 + i * 0.04, 0.08 + i * 0.04));
        return (
          <div key={pp.id} className={m.person} data-side={pp.x < 50 ? "l" : pp.x > 50 ? "r" : "c"} style={{ left: `${pp.x}%`, top: `${pp.y}%`, opacity: appear, transform: `translate(-50%, -50%) scale(${(0.85 + 0.15 * appear).toFixed(3)})` }}>
            <span className={m.face} data-talking={(talking && !now.ai) || undefined}>
              <img src={pp.img} alt="" onError={(ev) => { (ev.currentTarget as HTMLImageElement).style.display = "none"; }} /><b>{pp.name[0]}</b>
            </span>
            <span className={m.aiDot} data-talking={(talking && now.ai) || undefined}><AIGlyph name={pp.ai} size={16} color={pp.ai === "claude" ? "#d97757" : "#0d0d0d"} /></span>
            <span className={m.who}>{pp.name}<em> · {pp.aiName}</em></span>
            {talking && <p className={m.bubble} data-ai={now.ai || undefined} style={{ opacity: bubble, transform: `translateY(${((1 - bubble) * 8).toFixed(1)}px)` }}>
              {now.ai && <span><AIGlyph name={pp.ai} size={11} />{pp.name === "You" ? "Your" : `${pp.name}'s`} {pp.aiName}</span>}{now.said}</p>}
          </div>
        );
      })}
    </div>
  );
}
