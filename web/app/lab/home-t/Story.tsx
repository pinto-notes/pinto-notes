"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { Board, BoardCrop, TALL, WIDE } from "./Board";
import { hand } from "./fonts";
import { Cursor, Receipt, Tick, Undone } from "./Parts";
import { type Anchors, DUR, LAST, type Lay, type Pose, sample, type Tracks, tracks } from "./timeline";
import s from "./t.module.css";

// Study T, round 6: "one note becomes everything". One running project (a first half marathon) on a
// sticky stage. The note fills the screen, a checklist item becomes a whiteboard, the whiteboard's
// boxes become a habit tracker, and one request to ChatGPT changes all three, in turn, then Undo.
// The signature is the named cursors: you, ChatGPT and Claude, working in the same things.
// Each canvas is a fixed design (1280 x 720 wide, 360 x 660 on a phone) scaled to fit the window,
// so every beat is composed exactly; the backgrounds sit outside it and fill the screen.

const DESK: Lay = {
  W: 1280, H: 720, phone: false,
  note: [452, 40], heroNote: [108, 298], app: [500, 36, 712, 648],
  panels: [[64, 182], [456, 182], [848, 182]], pw: 368, ph: 506, board: WIDE,
};
const PHONE: Lay = {
  W: 360, H: 660, phone: true,
  note: [20, 126], heroNote: [34, 380], app: [10, 136, 340, 456],
  panels: [[20, 244], [20, 244], [20, 244]], pw: 320, ph: 412, board: TALL,
};
const ROWS = { d: { top: 248, h: 62 }, p: { top: 214, h: 46 } };

const st = (p: Record<string, number | string>) => p as CSSProperties;
const at = (x: number, y: number, w?: number, h?: number) => st({ left: x, top: y, ...(w ? { width: w } : {}), ...(h ? { height: h } : {}) });

const CHECK = ["Sign up for the race", "Buy running shoes", "Make a training plan", "Book flights to Lisbon", "Find a hotel near the start"];

function NoteTop({ L, id }: { L: Lay; id: string }) {
  return (
    <div className={s.note} data-k="note" style={at(L.note[0], L.note[1])}>
      <p className={s.noteDate}>Today at 09:41</p>
      <p className={s.noteTitle}>Lisbon half, 17 May</p>
      <p className={s.noteText}>Decided: four runs a week, long run on Sundays.</p>
      <p className={`${s.noteText} ${s.offable}`} data-off-id={`${id}line`}>
        <span className={s.mk} data-a="gptBox"><span className={s.tint} data-who="gpt" data-k="gptTint" /><span data-k="gptLine" data-a="gptLine">Last long run on 3 May, then two easy weeks.</span></span>
      </p>
      <Receipt who="gpt" did="Added a line" k="pill0" id={`${id}line`} />
    </div>
  );
}

function Rows({ L, id, phone }: { L: Lay; id: string; phone: boolean }) {
  const R = ROWS[phone ? "p" : "d"];
  return (
    <>
      {CHECK.map((t, i) => {
        const claude = i === 4;
        return (
          <div key={t} className={`${s.row} ${claude ? s.offable : ""}`} data-k={`r${i}`} data-off-id={claude ? `${id}hotel` : undefined}
            style={at(L.note[0], L.note[1] + R.top + i * R.h, phone ? 320 : 740, R.h)}>
            <span className={s.rowBox} data-k={i === 2 ? "r2rest" : undefined}>
              <i className={s.box} data-a={`box${i}`}>{i < 3 && <b className={s.on} data-k={`t${i}`}><Tick /></b>}</i>
            </span>
            {i === 2 ? (
              <span className={s.flyR} data-k="r2fly"><span data-k="r2fade" data-a="r2text"><span data-k="r2pre">Make a </span><span data-a="r2tp">training plan</span></span></span>
            ) : claude ? (
              <span className={s.mk}><span className={s.tint} data-who="claude" data-k="r4tint" /><span data-a="r4text">{t}</span></span>
            ) : <span>{t}</span>}
          </div>
        );
      })}
      <div className={s.pillAt} style={at(L.note[0] - (phone ? 0 : 2), L.note[1] + R.top + 5 * R.h + (phone ? 8 : 12))}>
        <Receipt who="claude" did="Added an item" k="pill1" id={`${id}hotel`} />
      </div>
    </>
  );
}

type Habit = { name: string; color: string; sub: (on: boolean) => string };

/** The habit tracker: a note that is a small app. Easy runs and Long run are real buttons. */
function Tracker({ L, id }: { L: Lay; id: string }) {
  const [easy, setEasy] = useState(false);
  const [long, setLong] = useState(false);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const run = [true, false, true, false, true, false, true];
  const done = [true, false, true, false, easy, false, long];
  const H: Habit[] = [
    { name: "Easy runs", color: "#3d7be0", sub: (on) => `${on ? 3 : 2} of 3 this week` },
    { name: "Long run", color: "#3d7be0", sub: (on) => (on ? "Done, 16 km" : "Sunday, 16 km") },
  ];
  const press = [easy, long], set = [setEasy, setLong];
  return (
    <div className={s.app} data-k="app" style={at(L.app[0], L.app[1], L.app[2], L.app[3])}>
      <p className={s.appHead}><b>Training</b><span className={s.appTag}>App</span></p>
      <p className={s.appSub}>Week 6 of 10. Race day is 17 May.</p>
      <div className={s.week} aria-hidden="true">
        {days.map((d, k) => <span key={k} data-run={run[k] || undefined} data-done={done[k] || undefined} data-now={k === 4 || undefined}><small>{d}</small><i><Tick /></i></span>)}
      </div>
      <ul className={s.habits}>
        {H.map((h, i) => (
          <li key={h.name} data-k={`ar${i}`} style={st({ "--c": h.color })}>
            <button type="button" className={s.hTick} aria-pressed={press[i]} aria-label={`${h.name}, done`} onClick={() => set[i]((v) => !v)}><Tick /></button>
            <span className={s.hText}><b data-a={i === 0 ? "rowEasy" : "rowLong"}>{h.name}</b><small>{h.sub(press[i])}</small></span>
          </li>
        ))}
        <li data-k="ar2" className={s.offable} data-off-id={`${id}stretch`} style={st({ "--c": "#7d5bd0" })}>
          <span className={`${s.tint} ${s.rowTint}`} data-who="claude" data-k="sTint" />
          <span className={s.hTick} data-a="sTickA"><b className={s.hOn} data-k="sTick"><Tick /></b></span>
          <span className={s.hText}><b>Stretch</b><span className={s.swap}><small data-k="st0">4 days in a row</small><small data-k="st1">5 days in a row</small></span></span>
        </li>
      </ul>
      <div className={s.appPill}><Receipt who="claude" did="Ticked Stretch" k="pill3" id={`${id}stretch`} /></div>
    </div>
  );
}

/** The last act's three close-ups, each a different surface: the app, the note, the whiteboard. */
function Panels({ L, id }: { L: Lay; id: string }) {
  const [a, b, c] = L.panels;
  const box = (p: [number, number]) => at(p[0], p[1], L.pw, L.ph);
  return (
    <>
      <div className={`${s.panel} ${s.pApp}`} data-k="pA" style={box(a)}>
        <p className={s.pLabel}>Your app</p>
        <p className={s.pTitle}>Training</p>
        <ul className={s.pList}>
          <li className={s.offable} data-off-id={`${id}run`} style={st({ "--c": "#3d7be0" })}>
            <span className={`${s.tint} ${s.rowTint}`} data-who="gpt" data-k="aTint" />
            <i className={s.pTick} data-a="aTickA"><b data-k="aTick"><Tick /></b></i>
            <span className={s.pText}><b>Easy runs</b><span className={s.swap}><small data-k="ac0">2 of 3 this week</small><small data-k="ac1">3 of 3 this week</small></span>
              <em className={s.chip} data-k="aChip"><AIGlyph name="openai" size={14} />12 km, logged by ChatGPT</em></span>
          </li>
          <li style={st({ "--c": "#3d7be0" })}><i className={s.pTick} /><span className={s.pText}><b>Long run</b><small>Sunday, 16 km</small></span></li>
          <li style={st({ "--c": "#7d5bd0" })}><i className={s.pTick} data-on=""><b><Tick /></b></i><span className={s.pText}><b>Stretch</b><small>5 days in a row</small></span></li>
        </ul>
        <div className={s.pPill}><Receipt who="gpt" did="Logged a run" k="pillA" id={`${id}run`} /></div>
      </div>

      <div className={`${s.panel} ${s.pNote}`} data-k="pB" style={box(b)}>
        <p className={s.pLabel}>Your note</p>
        <p className={s.pTitle}>Lisbon half, 17 May</p>
        <ul className={s.pCheck}>
          {CHECK.map((t, i) => (
            <li key={t} className={i === 3 ? s.offable : undefined} data-off-id={i === 3 ? `${id}flights` : undefined}>
              <i className={s.box} data-a={i === 3 ? "bBoxA" : undefined}>
                {i < 3 && <b className={s.on}><Tick /></b>}
                {i === 3 && <b className={`${s.on} ${s.onGpt}`} data-k="bTick"><Tick /></b>}
              </i>
              {i === 3 ? <span className={s.mk}><span className={s.tint} data-who="gpt" data-k="bTint" />{t}</span> : <span>{t}</span>}
            </li>
          ))}
        </ul>
        <div className={s.pPill}><Receipt who="gpt" did="Ticked Book flights" k="pillB" id={`${id}flights`} /></div>
      </div>

      <div className={`${s.panel} ${s.pBoard}`} data-k="pC" style={box(c)}>
        <p className={s.pLabel}>Your whiteboard</p>
        <BoardCrop id={id} />
        <div className={s.pPill}>
          <Receipt who="gpt" did="Drew a rest week" k="pillC" id={`${id}rest`} undoAnchor="undoC" />
          <Undone k="pillCx" />
        </div>
      </div>
    </>
  );
}

function Canvas({ L, cta, id }: { L: Lay; cta: ReactNode; id: string }) {
  const phone = L.phone;
  const said = "I ran 12 km and booked the flights. Log it, and add a rest week to my plan.";
  return (
    <div className={`${s.cv} ${phone ? s.cvP : s.cvD}`} data-cv={id} style={st({ width: L.W, height: L.H })}>
      {/* 0. The hero: the headline, and under it a real note you and ChatGPT both wrote in. */}
      <h1 className={s.h1} data-k="h1">
        <span className={s.w} style={st({ "--i": 0 })}>The</span>{" "}
        <span className={s.w} style={st({ "--i": 1 })}>notebook</span>{phone ? <br /> : " "}
        <span className={s.w} style={st({ "--i": 2 })}>for</span>{phone ? " " : <br />}
        <em>
          <span className={s.w} style={st({ "--i": 3 })}>you</span>{" "}
          <span className={s.w} style={st({ "--i": 4 })}>and</span>{phone ? <br /> : " "}
          <span className={s.w} style={st({ "--i": 5 })}>your</span>{" "}
          <span className={s.w} style={st({ "--i": 6 })}>AI.</span>
        </em>
      </h1>
      <div className={s.side} data-k="side">
        <p className={s.sub}>{phone ? "Write notes, draw on whiteboards and build apps, with your AI. Free on Mac and iPhone." : "Write notes, draw on whiteboards and build apps. Your AI can work in all three."}</p>
        {cta}
      </div>
      <div className={s.card} data-k="card" aria-hidden="true" />

      {/* 1. Write notes. */}
      <div className={`${s.cap} ${s.capW}`} data-k="capW">
        <h2 className={s.h2}>Write notes.</h2>
        <p className={s.say}>Feels like Apple Notes, on your Mac and iPhone.</p>
      </div>
      <NoteTop L={L} id={id} />
      <Rows L={L} id={id} phone={phone} />

      {/* 2. Draw on whiteboards. */}
      <div className={`${s.cap} ${s.capD}`} data-k="capD">
        <h2 className={s.h2}>Draw on whiteboards.</h2>
        <p className={s.say}>Sketch a plan next to your notes. Your AI can read it and draw on it.</p>
      </div>
      <div className={s.boardBox} role="img" aria-label="A hand-drawn whiteboard called Training plan: easy runs, long runs, then feel good? If yes, taper. ChatGPT draws the last arrow, to race day.">
        <Board L={L.board} id={id} />
      </div>
      <div className={s.pill2At}><Receipt who="gpt" did="Drew race day" k="pill2" id={`${id}race`} /></div>

      {/* 3. Build apps. */}
      <div className={`${s.cap} ${s.capB}`} data-k="capB">
        <h2 className={s.h2}>Build apps.</h2>
        <p className={s.say}>A note can be a small app. Start from a template, or ask your AI.</p>
      </div>
      <p className={`${s.handNote} ${hand.className}`} data-k="handNote" aria-hidden="true">
        <span>It really works.<br />Press one.</span>
        <svg viewBox="0 0 180 80"><path d="M6 22 C 52 6, 120 10, 166 52" /><path d="M146 50 L167 53 L163 32" /></svg>
      </p>
      <Tracker L={L} id={id} />

      {/* 4 to 7. Your AI, in all three. */}
      <div className={`${s.cap} ${s.capA}`} data-k="capA">
        <h2 className={s.h2}>Your AI, in all three.</h2>
        <p className={s.say}>Every change says who made it. Undo takes it back.</p>
      </div>
      <div className={s.said} data-k="said">
        <p className={s.saidHead}><AIGlyph name="openai" size={phone ? 13 : 16} />In ChatGPT</p>
        <p className={s.bubble}><span data-a="saidText">{said}</span></p>
      </div>
      {phone && (
        <>
          <div className={s.marks} data-k="marks" aria-hidden="true"><span data-a="mk0">Your app</span><span data-a="mk1">Your note</span><span data-a="mk2">Your whiteboard</span></div>
          <i className={s.mkOn} data-k="mkOn" aria-hidden="true" />
        </>
      )}
      <Panels L={L} id={id} />

      <Cursor who="you" k="cYou" />
      <Cursor who="claude" k="cClaude" />
      <Cursor who="gpt" k="cGPT" />
    </div>
  );
}

type El = HTMLElement | SVGElement;
type Rect = { x: number; y: number; w: number; h: number };

export function Story({ cta, ctaPhone }: { cta: ReactNode; ctaPhone: ReactNode }) {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sec.current, sheet = stage.current;
    if (!section || !sheet) return;
    const pin = sheet.parentElement!;
    const q = new URLSearchParams(location.search);
    const freeze = q.has("t");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const bg = [...sheet.querySelectorAll<HTMLElement>(":scope > [data-k]")];
    const sets = ([["d", DESK], ["p", PHONE]] as const).map(([n, L]) => {
      const cv = sheet.querySelector<HTMLElement>(`[data-cv="${n}"]`)!;
      const els = new Map<string, El[]>();
      [...bg, ...cv.querySelectorAll<HTMLElement>("[data-k]")].forEach((e) => {
        const k = e.dataset.k!;
        els.set(k, [...(els.get(k) ?? []), e]);
      });
      return { n, cv, els, L, T: null as Tracks | null, last: new Map<El, string>() };
    });

    // Anchors: where things are at rest, read from the page (transforms off), in canvas units.
    const measure = (set: (typeof sets)[number]) => {
      const { cv, L } = set;
      cv.setAttribute("data-measure", "");
      const base = cv.getBoundingClientRect(), k = base.width / L.W;
      const map = new Map<string, Rect & { lx: number; ly: number; lw: number; lh: number }>();
      cv.querySelectorAll<Element>("[data-a]").forEach((e) => {
        const r = e.getBoundingClientRect(), rs = e.getClientRects(), l = rs[rs.length - 1] ?? r;
        map.set(e.getAttribute("data-a")!, {
          x: (r.left - base.left) / k, y: (r.top - base.top) / k, w: r.width / k, h: r.height / k,
          lx: (l.left - base.left) / k, ly: (l.top - base.top) / k, lw: l.width / k, lh: l.height / k,
        });
      });
      cv.removeAttribute("data-measure");
      const A: Anchors = (name) => {
        const a = map.get(name);
        if (!a) { console.warn("[home-t] missing anchor", name); return { x: 0, y: 0, w: 0, h: 0 }; }
        // An end anchor is the last line of the text, so a cursor lands where the words end.
        return name.endsWith("Line") || name.endsWith("text") || name === "saidText" ? { x: a.lx, y: a.ly, w: a.lw, h: a.lh } : a;
      };
      set.T = tracks(L, A);
      set.last.clear();
    };

    let cur = -1, target = -1, go = false, raf = 0, prev = 0;
    const beat = () => {
      const top = parseFloat(getComputedStyle(pin).top) || 0;
      const seg = (section.offsetHeight - pin.offsetHeight) / LAST;
      const p = (top - section.getBoundingClientRect().top) / Math.max(1, seg);
      return Math.max(0, Math.min(LAST, Math.round(p)));
    };
    const write = (set: (typeof sets)[number], u: number) => {
      if (!set.T) measure(set);
      for (const [k, track] of Object.entries(set.T!)) {
        const list = set.els.get(k);
        if (!list) continue;
        const p: Required<Pose> = sample(track, u);
        const dash = track.some(([, q]) => "d" in q);
        for (const e of list) {
          let v: string;
          if (dash) {
            v = `${p.d.toFixed(4)}`;
            if (set.last.get(e) === v) continue;
            e.style.strokeDashoffset = String(1 - p.d);
            e.style.visibility = p.d <= 0.001 ? "hidden" : "";
          } else {
            const tf = `translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,0) scale(${(p.s * p.sx).toFixed(4)},${p.s.toFixed(4)})${p.r ? ` rotate(${p.r.toFixed(2)}deg)` : ""}`;
            v = `${tf}|${p.o.toFixed(3)}`;
            if (set.last.get(e) === v) continue;
            e.style.transform = tf;
            e.style.opacity = p.o.toFixed(3);
            e.style.visibility = p.o <= 0.002 ? "hidden" : "";
          }
          set.last.set(e, v);
        }
      }
    };
    const frame = (now: number) => {
      raf = 0;
      if (go) target = beat();
      const dt = prev ? Math.min(50, now - prev) / 1000 : 1 / 60;
      prev = now;
      if (freeze || reduce.matches) cur = go ? target : 0;
      else if (cur !== target) {
        const dir = Math.sign(target - cur);
        const seg = dir > 0 ? Math.floor(cur + 1e-6) : Math.ceil(cur - 1e-6) - 1;
        let v = 1 / DUR[Math.max(0, Math.min(DUR.length - 1, seg + 1))];
        const rem = Math.abs(target - cur);
        if (rem > 1.02) v *= 1 + (rem - 1) * 2.4;
        if (dir < 0) v *= 1.7;
        cur += dir * v * dt;
        if ((target - cur) * dir <= 0) cur = target;
      }
      const moving = cur !== target;
      sheet.toggleAttribute("data-moving", moving);
      for (const set of sets) if (set.cv.offsetParent !== null) write(set, cur);
      if (moving || !go) raf = requestAnimationFrame(frame);
      else prev = 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const fit = () => {
      const w = sheet.clientWidth, h = sheet.clientHeight, r = document.documentElement.style;
      r.setProperty("--kd", String(Math.min(w / DESK.W, h / DESK.H, 1.32)));
      r.setProperty("--kp", String(Math.min(w / PHONE.W, h / PHONE.H, 1.32)));
    };
    const resize = () => { fit(); for (const set of sets) set.T = null; kick(); };
    fit();
    sheet.setAttribute("data-live", "");
    kick();
    // The hero's one moment (ChatGPT's line landing) starts once the headline has risen.
    const start = () => { go = true; prev = 0; for (const set of sets) set.T = null; kick(); };
    const timer = window.setTimeout(() => { document.fonts.ready.then(start); }, freeze ? 0 : 520);
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", resize);
    reduce.addEventListener("change", resize);
    return () => {
      clearTimeout(timer);
      removeEventListener("scroll", kick); removeEventListener("resize", resize); reduce.removeEventListener("change", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Sized before first paint, so the first screen never jumps (the effect keeps it fitted after).
  const fitNow = `(function(){var s=document.currentScript.previousElementSibling,w=s.clientWidth,h=s.clientHeight,p=document.documentElement.style;p.setProperty('--kd',Math.min(w/1280,h/720,1.32));p.setProperty('--kp',Math.min(w/360,h/660,1.32))})()`;

  return (
    <section ref={sec} className={s.story} aria-label="Pinto Notes: one note becomes a whiteboard and an app, and your AI works in all three">
      <div className={s.pin}>
        <div ref={stage} className={s.sheet}>
          <div className={s.bgPaper} data-k="bgPaper" aria-hidden="true" />
          <div className={s.bgGrid} data-k="bgGrid" aria-hidden="true" />
          <div className={s.bgField} data-k="bgField" aria-hidden="true" />
          <Canvas L={DESK} cta={cta} id="d" />
          <Canvas L={PHONE} cta={ctaPhone} id="p" />
        </div>
        <script dangerouslySetInnerHTML={{ __html: fitNow }} />
      </div>
    </section>
  );
}
