"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import f from "./remember.module.css";
import { Download } from "../../kit";

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const mj = (v: number) => { const x = clamp(v); return x * x * x * (10 - 15 * x + 6 * x * x); };
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

// The hero: three chats on the left, each with one thing you told it. As you scroll, the chats fade to
// grey (forgotten), and the one thing from each flies across into the Pinto note on the right, which
// stays crisp and credits each line. The first frame is finished: the chats and an empty-looking but
// real note with its title. `?p=` freezes progress.

const CHATS = [
  { app: "chatgpt" as const, name: "ChatGPT", when: "Last week", me: "I'm vegetarian, and I don't eat mushrooms.", line: "Vegetarian, no mushrooms" },
  { app: "claude" as const, name: "Claude", when: "Yesterday", me: "My half marathon is on 30 November.", line: "Half marathon on 30 November" },
  { app: "code" as const, name: "Claude Code", when: "This morning", me: "we deploy on Fridays, never Mondays", line: "Deploys on Fridays, never Mondays" },
];

export function Forget() {
  const box = useRef<HTMLDivElement>(null);
  const note = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("p");
    let frozen = false;
    (window as unknown as { __setP?: (v: number) => void }).__setP = (v) => { frozen = true; setP(v); };
    if (q !== null) { setP(Number(q)); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setP(1); return; }
    const narrow = matchMedia("(max-width: 900px)").matches;
    let raf = 0;
    if (narrow) {
      setPhone(true);
      let start = 0;
      const tick = (now: number) => { if (frozen) return; if (!start) start = now; const v = (now - start) / 4200; setP(Math.min(1, v)); if (v < 1) raf = requestAnimationFrame(tick); };
      // On a phone the note sits below the chats, so the story starts when the note is in view.
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); raf = requestAnimationFrame(tick); } }, { threshold: 0.6 });
      if (note.current) io.observe(note.current);
      return () => { io.disconnect(); cancelAnimationFrame(raf); };
    }
    const read = () => { raf = 0; if (frozen) return; const el = box.current; if (!el) return; const r = el.getBoundingClientRect(); const travel = r.height - innerHeight; setP(clamp(travel > 0 ? -r.top / travel : 0)); };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);

  // On a phone the whole headline is there from the start; the story below plays when the note is in view.
  const second = phone ? 1 : mj(span(p, 0.08, 0.3));
  return (
    <div ref={box} className={f.scroller}>
      <div className={f.pin}>
        <div className={f.hero}>
          <h1 className={f.h1}>
            <span className={f.l1}>Every AI you use forgets you.</span>
            <span className={f.l2} style={{ opacity: second, transform: `translateY(${((1 - second) * 18).toFixed(1)}px)`, filter: `blur(${((1 - second) * 6).toFixed(1)}px)` }}>
              Your <span className={f.mark}>notebook</span> doesn't.
            </span>
          </h1>
          <div className={f.stage}>
            <div className={f.chats}>
              {CHATS.map((c, i) => {
                const fade = mj(span(p, 0.3 + i * 0.08, 0.5 + i * 0.08));
                return (
                  <figure key={c.app} className={f.chat} data-app={c.app} style={{ filter: `grayscale(${fade.toFixed(2)})`, opacity: 1 - 0.55 * fade }}>
                    <div className={f.top}><span>{c.app !== "chatgpt" ? <AIGlyph name="claude" size={13} /> : <AIGlyph name="openai" size={13} />}{c.name}</span><em>{c.when}</em></div>
                    <p className={f.me}>{c.me}</p>
                    <p className={f.gone} style={{ opacity: fade }}>New chat. It doesn't know this any more.</p>
                  </figure>
                );
              })}
            </div>
            <figure ref={note} className={f.note}>
              <div className={f.bar}><span className={f.lights}><i /><i /><i /></span><span className={f.folder}>Notes</span></div>
              <div className={f.paper}>
                <h3 className={f.title}>About me</h3>
                <p className={f.sub}>What every AI I use should know.</p>
                <ul className={f.lines}>
                  {CHATS.map((c, i) => {
                    const land = mj(span(p, 0.36 + i * 0.1, 0.56 + i * 0.1));
                    return (
                      <li key={c.app}>
                        <span className={f.ghost} style={{ opacity: 1 - land, width: `${[62, 74, 68][i]}%` }} aria-hidden="true" />
                        <span className={f.landed} style={{ opacity: land, transform: `translateX(${((1 - land) * -40).toFixed(1)}px)` }}>
                        <span className={f.dash}>–</span>{c.line}
                        <span className={f.by}>{c.app === "chatgpt" ? <AIGlyph name="openai" size={11} /> : <AIGlyph name="claude" size={11} />}{c.name}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className={f.foot} style={{ opacity: mj(span(p, 0.8, 0.92)) }}>Every AI you connect reads this, so none of them start from zero.</p>
              </div>
            </figure>
          </div>
          <Download quiet="Free for Mac. Works with ChatGPT, Claude, Claude Code and Codex, with your OK." />
        </div>
      </div>
    </div>
  );
}
