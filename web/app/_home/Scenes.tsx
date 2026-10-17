"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import m from "./scenes.module.css";

// The people scenes: a cut-paper picture of one person's moment, and one exchange set large like a
// pull quote. `?m=` and Reduce Motion show them at rest.

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const mj = (v: number) => { const x = clamp(v); return x * x * x * (10 - 15 * x + 6 * x * x); };
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

/// The scene, still: the art, and one exchange set large like a pull quote. No motion to decode.
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (new URLSearchParams(location.search).has("m") || matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(1); return; }
    let raf = 0;
    const read = () => { raf = 0; const r = (el.parentElement ?? el).getBoundingClientRect(); setV(clamp((innerHeight - r.top) / (innerHeight * 0.55))); };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return [ref, v] as const;
}

/// `focus` is where the person is across the picture (0 to 100), for the portrait crop on phones.
export function PaperStill({ src, alt, where, me, ai, aiName, aiGlyph, at = "left", voice = false, focus = 50, log = false, split = false }:
  { src: string; alt: string; where: string; me: string; ai: string; aiName: string; aiGlyph: "openai" | "claude" | "meta"; at?: "left" | "right"; voice?: boolean; focus?: number; log?: boolean; split?: boolean }) {
  const [ref, v] = useReveal();
  // The same entrance as the cards further down: a quick fade with a short lift, fully there early.
  const art = mj(clamp(v * 2.2)), q1 = mj(span(v, 0.3, 0.6)), q2 = mj(span(v, 0.42, 0.72));
  return (
    <div ref={ref} className={m.paperScene} data-card={log || split || undefined} style={{ "--fx": `${focus}%`, opacity: art, translate: `0 ${((1 - art) * 46).toFixed(1)}px`, scale: (0.96 + 0.04 * art).toFixed(4) } as React.CSSProperties}>
      <img src={src} alt={alt} loading="lazy" decoding="async" />
      <figure className={m.quote} data-at={at} data-voice={voice || undefined} style={{ "--q1": q1, "--q2": q2 } as React.CSSProperties}>
                <p className={m.qMe}>{voice && <span className={m.qWave} aria-hidden="true"><i /><i /><i /><i /><i /></span>}{me}</p>
        <p className={m.qAi}><span><AIGlyph name={aiGlyph} size={13} color={aiGlyph === "meta" ? "#0866ff" : undefined} />{aiName}</span>{ai}</p>
        {log && <LogCard />}
        {split && <SplitApp />}
      </figure>
      <span className={m.paperWhere}>{where}</span>
    </div>
  );
}


/// Jonas's note while he sleeps: each agent logs what it did, the next one starts from there.
export function LogCard() {
  const rows = [
    { at: "01:14", who: "Claude Code", glyph: "claude" as const, did: "Offline queue written. Tests pass." },
    { at: "03:02", who: "Codex", glyph: "openai" as const, did: "Reviewed it. Two questions for Jonas." },
    { at: "03:40", who: "Claude Code", glyph: "claude" as const, did: "Fixed one. One is left for you." },
  ];
  return (
    <figure className={m.gymMini}>
      <div className={m.gymMiniHead}><span>Sync rewrite</span><em>Log</em></div>
      <ul className={m.log}>{rows.map((r) => (
        <li key={r.at}><time>{r.at}</time><span className={m.logWho}><AIGlyph name={r.glyph} size={11} color={r.glyph === "claude" ? "#d97757" : undefined} />{r.who}</span><b>{r.did}</b></li>
      ))}</ul>
    </figure>
  );
}



/// The app Claude made in Sara's Lisbon trip note: who paid what, who owes, and a button to add more.
export function SplitApp() {
  const rows = [{ n: "Apartment", amt: "4,800 kr", by: "S" }, { n: "Flights", amt: "3,120 kr", by: "L" }, { n: "Dinner, Alfama", amt: "960 kr", by: "S" }];
  return (
    <figure className={m.app}>
      <div className={m.appHead}><span>Split the trip</span><em><AIGlyph name="claude" size={11} color="#d97757" />Made by Claude</em></div>
      <ul className={m.appRows}>{rows.map((r) => <li key={r.n}><i data-who={r.by}>{r.by}</i><b>{r.n}</b><em>{r.amt}</em></li>)}</ul>
      <div className={m.appFoot}><p><i data-who="L">L</i>Leo owes you <b>1,320 kr</b></p><span className={m.appAdd}>+ Add<span className={m.appAddMore}> a cost</span></span></div>
    </figure>
  );
}
