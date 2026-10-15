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

/// 5. Together: a shared shopping list. You at home, Sara at the shop; each change shows up for the
/// other the moment it's made. People and the list, nothing else.
const DUO = [
  { id: "you", name: "You", where: "at home", color: "#c8692a", img: "/home-v5/people/you.webp", side: "l" },
  { id: "sara", name: "Sara", where: "at the shop", color: "#75703c", img: "/home-v5/people/sara.webp", side: "r" },
];
const ITEMS = [
  { text: "Bread", by: 1, add: -1, tick: 0.3 },
  { text: "Eggs", by: 0, add: -1, tick: 0.38 },
  { text: "Oat milk", by: 0, add: 0.06, tick: 0.45 },
  { text: "Lemons", by: 0, add: 0.2, tick: 0.84 },
  { text: "Ice cream", by: 1, add: 0.64, tick: -1 },
];
const SAID = [
  { who: 0, text: "We're out of oat milk.", at: 0.02 },
  { who: 0, text: "And lemons, if they have them.", at: 0.17 },
  { who: 1, text: "Got it.", at: 0.48 },
  { who: 1, text: "Something for tonight.", at: 0.6 },
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
                <img className={m.mini} src={DUO[it.by].img} alt="" />
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
