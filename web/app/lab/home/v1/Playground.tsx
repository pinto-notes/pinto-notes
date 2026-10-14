"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import s from "./playground.module.css";

// The playground hero: pick an AI, tap something to ask, and watch the note change. It opens on a
// finished exchange (ChatGPT already added the Sintra trip), so the first frame makes sense; every
// ask plays its answer and its edit, credited, and can be undone.

type AI = "chatgpt" | "claude" | "claude-code";
type Line = { id: string; text: string; sec: "plan" | "places" | "packing"; box?: boolean; done?: boolean; who?: AI; fresh?: boolean };
type Ask = { label: string; me: string; ai: string; apply: (l: Line[]) => Line[]; look?: string[] };

const NAME: Record<AI, string> = { chatgpt: "ChatGPT", claude: "Claude", "claude-code": "Claude Code" };
const GLYPH: Record<AI, "openai" | "claude"> = { chatgpt: "openai", claude: "claude", "claude-code": "claude" };

const START: Line[] = [
  { id: "tram", text: "Tram 28 early, before the crowds", sec: "plan", box: true },
  { id: "sintra", text: "Day trip to Sintra", sec: "plan", box: true, who: "chatgpt" },
  { id: "flights", text: "Book flights", sec: "plan", box: true, done: true },
  { id: "hotel", text: "Hotel in Príncipe Real", sec: "plan", box: true },
  { id: "market", text: "Time Out Market", sec: "places" },
  { id: "miradouro", text: "Miradouro da Senhora do Monte", sec: "places" },
];

const ASKS: Record<AI, Ask[]> = {
  chatgpt: [
    { label: "What's still open?", me: "What's still open in my Lisbon plan?", ai: "Tram 28, the Sintra day trip and the hotel. Flights are booked.", apply: (l) => l, look: ["tram", "sintra", "hotel"] },
    { label: "Add a fado night", me: "Add a fado night in Alfama to Lisbon", ai: "Added it under Places.", apply: (l) => [...l, { id: "fado", text: "Fado night in Alfama", sec: "places", who: "chatgpt", fresh: true }] },
  ],
  claude: [
    { label: "The hotel is booked", me: "I booked the hotel. Tick it off.", ai: "Ticked Hotel in Príncipe Real.", apply: (l) => l.map((x) => x.id === "hotel" ? { ...x, done: true, who: "claude", fresh: true } : x) },
    { label: "Make a packing list", me: "Make me a short packing list for Lisbon in May", ai: "Added a Packing section with three things.", apply: (l) => [...l,
      { id: "p1", text: "Comfortable shoes, the hills are real", sec: "packing", box: true, who: "claude", fresh: true },
      { id: "p2", text: "A light jacket for the evenings", sec: "packing", box: true, who: "claude", fresh: true },
      { id: "p3", text: "Sunscreen", sec: "packing", box: true, who: "claude", fresh: true }] },
  ],
  "claude-code": [
    { label: "Add LX Factory on Sunday", me: "add LX Factory on Sunday to my Lisbon note", ai: "Added under Places.", apply: (l) => [...l, { id: "lx", text: "LX Factory on Sunday", sec: "places", who: "claude-code", fresh: true }] },
  ],
};

export function Playground() {
  const [ai, setAi] = useState<AI>("chatgpt");
  const [lines, setLines] = useState<Line[]>(START);
  const [history, setHistory] = useState<Line[][]>([]);
  const [chat, setChat] = useState<{ me: string; ai: string; typed: number; who: AI } | null>({ me: "Add a day trip to Sintra to my Lisbon note", ai: "Added it under Plan.", typed: 1, who: "chatgpt" });
  const [busy, setBusy] = useState(false);
  const [look, setLook] = useState<string[]>([]);
  const [used, setUsed] = useState<string[]>([]);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };

  const ask = (a: Ask) => {
    if (busy) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setBusy(true); setUsed((u) => [...u, a.label]);
    setLines((l) => l.map((x) => ({ ...x, fresh: false })));
    setLook([]);
    setChat({ me: a.me, ai: a.ai, typed: 0, who: ai });
    const answer = () => {
      setHistory((h) => [...h, lines.map((x) => ({ ...x, fresh: false }))]);
      setLines((l) => a.apply(l.map((x) => ({ ...x, fresh: false }))));
      setLook(a.look ?? []);
      if (reduce) { setChat((c) => c && { ...c, typed: 1 }); setBusy(false); return; }
      const n = a.ai.length;
      for (let i = 1; i <= n; i++) later(i * 18, () => setChat((c) => c && { ...c, typed: i / n }));
      later(n * 18 + 50, () => setBusy(false));
    };
    if (reduce) answer(); else later(700, answer);
  };
  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setLines(prev); setHistory((h) => h.slice(0, -1)); setLook([]);
    setChat({ me: "Undo", ai: "Back to how it was.", typed: 1, who: ai });
  };

  const sec = (k: Line["sec"], title: string) => {
    const ls = lines.filter((x) => x.sec === k);
    if (!ls.length) return null;
    return (
      <>
        <h4 className={s.h}>{title}</h4>
        <ul className={s.list}>
          {ls.map((x) => (
            <li key={x.id} data-fresh={x.fresh || undefined} data-look={look.includes(x.id) || undefined}>
              {x.box ? <span className={s.box} data-on={x.done || undefined}><svg viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7" /></svg></span> : <span className={s.dash}>–</span>}
              <span className={s.text} data-done={x.done || undefined}>{x.text}</span>
              {x.who && x.fresh && <span className={s.by}><AIGlyph name={GLYPH[x.who]} size={11} />{NAME[x.who]}</span>}
            </li>
          ))}
        </ul>
      </>
    );
  };

  const shown = chat ? chat.ai.slice(0, Math.round(chat.ai.length * chat.typed)) : "";
  return (
    <div className={s.play}>
      <div className={s.chat} data-app={ai}>
        <div className={s.tabs} role="tablist" aria-label="Pick an AI">
          {(Object.keys(NAME) as AI[]).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={k === ai} className={s.tab} onClick={() => !busy && setAi(k)}>
              <AIGlyph name={GLYPH[k]} size={14} />{NAME[k]}
            </button>
          ))}
        </div>
        <div className={s.convo} aria-live="polite">
          {chat && (
            <>
              <p className={s.me}>{chat.me}</p>
              {chat.me !== "Undo" && <p className={s.tool}>{busy && chat.typed === 0 ? <span className={s.dots}><i /><i /><i /></span> : "Used Pinto Notes · Lisbon"}</p>}
              <p className={s.ai}>{shown}</p>
            </>
          )}
        </div>
        <div className={s.chips}>
          <span className={s.try}>Try asking {NAME[ai]}:</span>
          {ASKS[ai].map((a) => (
            <button key={a.label} type="button" className={s.chip} disabled={busy || used.includes(a.label)} onClick={() => ask(a)}>{a.label}</button>
          ))}
          {history.length > 0 && <button type="button" className={`${s.chip} ${s.undo}`} disabled={busy} onClick={undo}>Undo</button>}
        </div>
      </div>
      <figure className={s.note} aria-label="The Lisbon note in Pinto Notes">
        <div className={s.bar}><span className={s.lights}><i /><i /><i /></span><span className={s.folder}>Travel</span></div>
        <div className={s.paper}>
          <p className={s.date}>Today at 9:41</p>
          <h3 className={s.title}>Lisbon</h3>
          {sec("plan", "Plan")}
          {sec("places", "Places")}
          {sec("packing", "Packing")}
        </div>
      </figure>
    </div>
  );
}
