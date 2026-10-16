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
/// A soft rise as it comes into view: the art scales down to rest, the exchange lifts in after it.
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (new URLSearchParams(location.search).has("m") || matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(1); return; }
    let raf = 0;
    const read = () => { raf = 0; const r = el.getBoundingClientRect(); setV(clamp((innerHeight - r.top) / (innerHeight * 0.55))); };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return [ref, v] as const;
}

export function PaperStill({ src, alt, where, me, ai, aiName, aiGlyph, at = "left", budget = false, voice = false }:
  { src: string; alt: string; where: string; me: string; ai: string; aiName: string; aiGlyph: "openai" | "claude" | "meta"; at?: "left" | "right"; budget?: boolean; voice?: boolean }) {
  const [ref, v] = useReveal();
  const art = mj(v), q1 = mj(span(v, 0.35, 0.75)), q2 = mj(span(v, 0.5, 0.95));
  return (
    <div ref={ref} className={m.paperScene} style={{ opacity: 0.2 + 0.8 * art, transform: `translateY(${((1 - art) * 40).toFixed(1)}px)` }}>
      <img src={src} alt={alt} style={{ transform: `scale(${(1.08 - 0.08 * art).toFixed(4)})` }} />
      <figure className={m.quote} data-at={at} data-voice={voice || undefined} style={{ "--q1": q1, "--q2": q2 } as React.CSSProperties}>
                <p className={m.qMe}>{voice && <span className={m.qWave} aria-hidden="true"><i /><i /><i /><i /><i /></span>}{me}</p>
        <p className={m.qAi}><span><AIGlyph name={aiGlyph} size={13} color={aiGlyph === "meta" ? "#0866ff" : undefined} />{aiName}</span>{ai}</p>
        {budget && <BudgetCard />}
      </figure>
      <span className={m.paperWhere}>{where}</span>
    </div>
  );
}

/// Sara's budget, her own app: what's left this month, by category.
export function BudgetCard() {
  const rows = [{ n: "Groceries", left: "410 kr under", ok: true }, { n: "Eating out", left: "2 dinners left", ok: false }];
  return (
    <figure className={m.gymMini}>
      <div className={m.gymMiniHead}><span>Budget</span><em>October</em></div>
      <p className={m.budgetBig}>8,205 kr <small>left this month</small></p>
      <ul>{rows.map((r) => <li key={r.n}><b>{r.n}</b><span data-empty={!r.ok || undefined}>{r.left}</span></li>)}</ul>
    </figure>
  );
}
