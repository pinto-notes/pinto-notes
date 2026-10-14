"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { Chat, Term } from "../kit";
import s from "./h.module.css";

/// Where a line sits in the window capture, as fractions of the window's width and height.
type Spot = { left: number; top: number; width: number; height: number; mark: number };

/// One AI, one change. Each step is a finished state: the ask in that AI, and the line it changed in
/// the note, tinted and marked with its name.
const STEPS: { who: "chatgpt" | "claude" | "codex"; name: string; spot: Spot }[] = [
  { who: "chatgpt", name: "ChatGPT", spot: { left: 0.442, top: 0.396, width: 0.196, height: 0.039, mark: 0.552 } },
  { who: "claude", name: "Claude", spot: { left: 0.4455, top: 0.4725, width: 0.21, height: 0.039, mark: 0.5745 } },
  { who: "codex", name: "Codex", spot: { left: 0.4445, top: 0.634, width: 0.21, height: 0.039, mark: 0.5745 } },
];

/// The hero's window, pinned while you scroll through three AIs working in the same note: ChatGPT adds
/// a line, Claude ticks one off, Codex adds another. Every step is complete; scrolling only moves the
/// tint, the mark and the ask from one AI to the next. On phones and with Reduce Motion it stays on
/// the first step.
export function HeroStage() {
  const box = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fixed = window.matchMedia("(max-width: 900px), (prefers-reduced-motion: reduce)");
    let raf = 0;
    const read = () => {
      raf = 0;
      if (fixed.matches) return setStep(0);
      const r = el.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      const p = travel > 0 ? Math.min(1, Math.max(0, -r.top / travel)) : 0;
      setStep(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const now = STEPS[step];
  const at = (sp: Spot) => ({ "--l": sp.left, "--t": sp.top, "--w": sp.width, "--h": sp.height, "--m": sp.mark } as React.CSSProperties);

  return (
    <div ref={box} className={s.scroller}>
      <div className={s.sticky}>
        <div className={s.stage}>
          <img className={s.stageArt} src="/home-d/desk.webp" alt="" width={1254} height={1254} fetchPriority="high" />
          <figure className={s.window}>
            <img src="/home-h/window-lisbon.webp" srcSet="/home-h/window-lisbon-1100.webp 1100w, /home-h/window-lisbon.webp 2200w" sizes="(min-width: 1240px) 1100px, 92vw" width={2200} height={1375}
              alt="Pinto Notes on a Mac: folders on the left, the note list, and a note called Lisbon with a checklist, places, a hotel booking and a table of food." fetchPriority="high" />
            <span className={s.added} style={at(now.spot)} aria-hidden="true" />
            <span key={now.who} className={s.byline} style={at(now.spot)}>
              <AIGlyph name={now.who === "claude" ? "claude" : "openai"} size={11} />{now.name}
            </span>
          </figure>
          <div className={s.asks} aria-live="polite">
            <Chat app="chatgpt" className={`${s.ask} ${step === 0 ? s.on : ""}`} label="ChatGPT, asked to add a day trip to the Lisbon note"
              turns={[{ me: "Add a day trip to Sintra to my Lisbon note", tool: "Used Pinto Notes", ai: "Added it under Plan." }]} />
            <Chat app="claude" className={`${s.ask} ${step === 1 ? s.on : ""}`} label="Claude, told the hotel is booked"
              turns={[{ me: "I booked the hotel. Tick it off in Lisbon.", tool: "Used Pinto Notes", ai: "Ticked Hotel in Príncipe Real." }]} />
            <Term app="codex" className={`${s.ask} ${s.askTerm} ${step === 2 ? s.on : ""}`} label="Codex, asked to add Sunday's plan"
              ask="add LX Factory on Sunday to my Lisbon note" call="pinto.edit Travel/Lisbon.md" out={["Added under Places."]} />
          </div>
        </div>
        <ol className={s.steps} aria-label="Three AIs, one note">
          {STEPS.map((st, i) => <li key={st.who} className={i === step ? s.on : ""}>{st.name}</li>)}
        </ol>
      </div>
    </div>
  );
}
