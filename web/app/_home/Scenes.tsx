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
export function PaperStill({ src, alt, where, me, ai, aiName, aiGlyph, at = "left", budget = false, voice = false, focus = 50, log = false, review = false, friend = false }:
  { src: string; alt: string; where: string; me: string; ai: string; aiName: string; aiGlyph: "openai" | "claude" | "meta"; at?: "left" | "right"; budget?: boolean; voice?: boolean; focus?: number; log?: boolean; review?: boolean; friend?: boolean }) {
  const [ref, v] = useReveal();
  // The same entrance as the cards further down: a quick fade with a short lift, fully there early.
  const art = mj(clamp(v * 2.2)), q1 = mj(span(v, 0.3, 0.6)), q2 = mj(span(v, 0.42, 0.72));
  return (
    <div ref={ref} className={m.paperScene} data-budget={budget || log || review || friend || undefined} style={{ "--fx": `${focus}%`, opacity: art, translate: `0 ${((1 - art) * 46).toFixed(1)}px`, scale: (0.96 + 0.04 * art).toFixed(4) } as React.CSSProperties}>
      <img src={src} alt={alt} loading="lazy" decoding="async" />
      <figure className={m.quote} data-at={at} data-voice={voice || undefined} style={{ "--q1": q1, "--q2": q2 } as React.CSSProperties}>
                <p className={m.qMe}>{voice && <span className={m.qWave} aria-hidden="true"><i /><i /><i /><i /><i /></span>}{me}</p>
        <p className={m.qAi}><span><AIGlyph name={aiGlyph} size={13} color={aiGlyph === "meta" ? "#0866ff" : undefined} />{aiName}</span>{ai}</p>
        {budget && <BudgetCard />}
        {log && <LogCard />}
        {review && <ReviewCard />}
        {friend && <FriendCard />}
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

/// Sara's review prep, written by Muse from her work log: the three best wins, each with its date.
export function ReviewCard() {
  const rows = [
    { at: "Mar 12", did: "Led the checkout redesign: 18% more sales." },
    { at: "Jun 3", did: "New help pages: a third fewer tickets." },
    { at: "Sep 20", did: "Two new hires shipping by week three." },
  ];
  return (
    <figure className={m.gymMini}>
      <div className={m.gymMiniHead}><span>Review prep</span><em className={m.logWho}><AIGlyph name="meta" size={11} color="#0866ff" />Muse wrote this</em></div>
      <ul className={m.log}>{rows.map((r) => <li key={r.at} data-two=""><time>{r.at}</time><b>{r.did}</b></li>)}</ul>
    </figure>
  );
}

/// Sara's note about Leo: what he told her, with when.
export function FriendCard() {
  const rows = [{ at: "Sep 28", did: "Dad's knee surgery on the 9th." }, { at: "Oct 2", did: "Off gluten, doctor's orders." }];
  return (
    <figure className={m.gymMini}>
      <div className={m.gymMiniHead}><span>Leo</span><em>People</em></div>
      <ul className={m.log}>{rows.map((r) => <li key={r.at} data-two=""><time>{r.at}</time><b>{r.did}</b></li>)}</ul>
    </figure>
  );
}
