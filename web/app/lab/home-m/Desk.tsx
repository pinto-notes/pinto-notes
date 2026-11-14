"use client";

import { APP_STORE_URL, SITE_URL } from "@/lib/site";
import { mailLink, sendLink } from "@/lib/platform";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { GroceriesPhone, HabitsPhone, Mug, Pencil, Plant, Sticky, Whiteboard } from "./Things";
import m from "./m.module.css";

// Study M, "The desk": the first screen is one cut-paper desk seen from above. On it lie the three
// things, each the real piece of Pinto: the Groceries note on an iPhone, the Publishing flow
// whiteboard as a sheet, the Habit tracker on a second iPhone. Point at one and it lifts and turns
// straight; click it and it slides to the middle at its sharp size, with two facts beside it.
//
// The desk is drawn on a 1408 × 800 stage and only ever scaled down to fit the window, never up.
// Under 900 px it becomes a tall flat-lay with the things stacked, each at a readable size.

const STAGE_W = 1408, STAGE_H = 800;

type Thing = {
  id: "notes" | "whiteboards" | "apps"; title: string; tag: string; label: string;
  W: number; H: number; cx: number; cy: number; rot: number; s: number;
  tagAt: [number, number, number];
  facts: [string, string][];
};

const THINGS: Thing[] = [
  {
    id: "notes", title: "Notes.", tag: "Feels like Apple Notes.",
    label: "The Groceries note in Pinto Notes on an iPhone: a checklist, with olive oil just added by ChatGPT.",
    W: 320, H: 672, cx: 770, cy: 376, rot: -5, s: 0.7, tagAt: [668, 648, -2],
    facts: [
      ["Feels like Apple Notes.", "Checklists, tables and folders, on iPhone and Mac, always in sync."],
      ["Brings yours over.", "Import your Apple Notes in one go, folders and checklists included."],
    ],
  },
  {
    id: "whiteboards", title: "Whiteboards.", tag: "Draw it. Your AI can read it.",
    label: "A whiteboard called Publishing flow, drawn by hand: Idea, Draft, Ready? Yes goes to Publish, no goes to Fix it.",
    W: 720, H: 448, cx: 318, cy: 552, rot: -2.5, s: 0.66, tagAt: [70, 722, 1.5],
    facts: [
      ["Draw it out.", "Boxes, arrows and words by hand, with the tools you know from Excalidraw."],
      ["Your AI sees it.", "ChatGPT and Claude can read a whiteboard and draw into it."],
    ],
  },
  {
    id: "apps", title: "Apps.", tag: "A note that's a small app.",
    label: "The Habit tracker app in a note on an iPhone: 62% this week, 2 of 6 done today, Walk on an 11-day streak.",
    W: 320, H: 672, cx: 1134, cy: 420, rot: 4, s: 0.7, tagAt: [1040, 702, 2],
    facts: [
      ["Ready now.", "Pick a template, like this habit tracker, and start using it."],
      ["Or describe it.", "Your AI builds it, and any AI you use can keep it up to date."],
    ],
  },
];

type Geo = { dx: number; dy: number; sc: number; fx: number; fy: number };

const FACTS_W = 340, GAP = 64;

export function Desk() {
  const wrap = useRef<HTMLDivElement>(null);
  const openers = useRef<(HTMLButtonElement | null)[]>([]);
  const closer = useRef<HTMLButtonElement>(null);
  const [k, setK] = useState(1);
  const [open, setOpen] = useState<number | null>(null);
  const [geo, setGeo] = useState<Geo | null>(null);

  // Fit the stage to the window: as wide as the desk, as tall as the window under the header.
  const fit = useCallback(() => {
    const el = wrap.current; if (!el) return 1;
    const top = el.getBoundingClientRect().top + scrollY;
    const v = Math.max(0.55, Math.min(1, el.clientWidth / STAGE_W, (innerHeight - top - 16) / STAGE_H));
    setK(v);
    return v;
  }, []);
  useLayoutEffect(() => {
    fit();
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, [fit]);

  // Where an opened thing goes: the middle of the desk, at its own size (smaller only if the window
  // is), with its facts beside it. Worked out in the stage's units.
  const place = useCallback((i: number, kk: number): Geo | null => {
    const el = wrap.current; if (!el) return null;
    const t = THINGS[i], Ww = el.clientWidth, Wh = STAGE_H * kk;
    const e = Math.min(1, (Wh - 56) / t.H, (Ww - FACTS_W - GAP - 96) / t.W);
    const left = (Ww - (t.W * e + GAP + FACTS_W)) / 2, stageLeft = Ww / 2 - (STAGE_W * kk) / 2;
    const X = (left + (t.W * e) / 2 - stageLeft) / kk, Y = Wh / 2 / kk;
    return { dx: X - t.cx, dy: Y - t.cy, sc: e / kk, fx: (left + t.W * e + GAP - stageLeft) / kk, fy: Y };
  }, []);

  const show = useCallback((i: number | null) => {
    if (i !== null && !matchMedia("(min-width: 901px)").matches) return;
    setOpen(i);
    setGeo(i === null ? null : place(i, fit()));
  }, [fit, place]);

  // ?open=notes|whiteboards|apps opens one on load, for screenshots and links.
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("open");
    const i = THINGS.findIndex((t) => t.id === q);
    if (i >= 0) show(i);
  }, [show]);

  useEffect(() => {
    if (open === null) return;
    closer.current?.focus({ preventScroll: true });
    const key = (ev: KeyboardEvent) => { if (ev.key === "Escape") { const was = open; show(null); openers.current[was]?.focus({ preventScroll: true }); } };
    const re = () => setGeo(place(open, fit()));
    addEventListener("keydown", key);
    addEventListener("resize", re);
    return () => { removeEventListener("keydown", key); removeEventListener("resize", re); };
  }, [open, show, place, fit]);

  const close = () => { const was = open; show(null); if (was !== null) openers.current[was]?.focus({ preventScroll: true }); };
  const t = open === null ? null : THINGS[open];

  return (
    <section className={m.desk} ref={wrap} style={{ "--k": k } as React.CSSProperties} data-open={t?.id} aria-label="Pinto Notes on a desk: notes, whiteboards and apps">
      <div className={m.stage}>
        <Plant className={m.plant} />
        <Mug className={m.mug} />
        <Pencil className={m.pencil} />

        <div className={m.card}>
          <h1 className={m.h1}>The notebook <span className={m.mark}>you and your AI</span> share.</h1>
          <p className={m.lede}>Notes, whiteboards and small apps. ChatGPT and Claude work in all three.</p>
          <div className={x.ctas}>
            <Download note={false} />
            <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
              Get it for iPhone
            </a>
            <a className={x.offMac} href="/download">Download for Mac</a>
            <p className={`${x.fine} ${x.offApple}`} data-off-apple>
              Pinto Notes is for iPhone and Mac.{" "}
              <a href={mailLink(SITE_URL)} onClick={(ev) => sendLink(navigator, ev, SITE_URL)}>Send myself the link</a>
            </p>
          </div>
        </div>

        {THINGS.map((th, i) => {
          const on = open === i;
          const style = {
            left: th.cx - th.W / 2, top: th.cy - th.H / 2, width: th.W, height: th.H,
            "--r0": `${th.rot}deg`, "--s0": th.s,
            ...(on && geo ? { "--r": "0deg", "--s": geo.sc, "--dx": `${geo.dx}px`, "--dy": `${geo.dy}px` } : {}),
          } as React.CSSProperties;
          return (
            <div key={th.id} className={m.spot} data-spot={th.id}>
              {th.id === "notes" && <div className={m.stickyAt}><Sticky /></div>}
              <div className={m.thing} data-thing={th.id} data-on={on || undefined} style={style}>
                <div role="img" aria-label={th.label} className={m.thingIn}>
                  {th.id === "notes" && <GroceriesPhone />}
                  {th.id === "whiteboards" && <Whiteboard />}
                  {th.id === "apps" && <HabitsPhone />}
                </div>
                <button type="button" ref={(b) => { openers.current[i] = b; }} className={m.hit} aria-expanded={on}
                  aria-label={`${th.title.replace(".", "")}: look closer`} onClick={() => (on ? close() : show(i))} />
              </div>
              <p className={m.tag} style={{ left: th.tagAt[0], top: th.tagAt[1], "--tr": `${th.tagAt[2]}deg` } as React.CSSProperties}>
                <b>{th.title}</b> {th.tag}
              </p>
            </div>
          );
        })}

        <div className={m.veil} onClick={close} aria-hidden="true" />
        {t && geo && (
          <div className={m.facts} style={{ left: geo.fx, top: geo.fy, width: FACTS_W } as React.CSSProperties} role="dialog" aria-label={t.title.replace(".", "")}>
            <button type="button" ref={closer} className={m.close} onClick={close} aria-label="Put it back"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" /></svg></button>
            <h2 className={m.fTitle}>{t.title}</h2>
            <ul>
              {t.facts.map(([b, s]) => <li key={b}><b>{b}</b> {s}</li>)}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
