"use client";

import { useEffect, useRef, useState } from "react";
import { AppsScene, BoardScene, Frame, NotesScene } from "./Scenes";
import s from "./n.module.css";

// Study N's three rooms, from study L: the words sit above each room with a "See it" link, and the
// whole room is the button (no unlabelled round buttons). On a phone the rooms become a 3-up strip of
// small rooms, so all three show in the first screen; each opens the same sheet.
//
// The three cards: Notes, Whiteboards, Apps, each a paper diorama in a shadow box. Pointing at a card
// tilts it a few degrees and its planes slide against each other (the far ones most), eased in one
// requestAnimationFrame loop that writes two numbers; everything that moves is a transform. Reduce
// Motion, touch screens and `?t=` get no tilt. Pressing a card opens a sheet: the real app, bigger,
// and three facts. `?card=apps` opens one on load, `?tilt=0.8,-0.6` holds the middle card tilted.

/** A close crop of an app capture: the rectangle x, y, w, h of a W × H picture. */
function Crop({ src, W, x, y, w, h, alt }: { src: string; W: number; H: number; x: number; y: number; w: number; h: number; alt: string }) {
  return (
    <span className={s.crop} style={{ aspectRatio: `${w} / ${h}` }}>
      <img src={src} alt={alt} loading="lazy" decoding="async"
        style={{ width: `${(W / w) * 100}%`, left: `${(-x / w) * 100}%`, top: `${(-y / h) * 100}%` }} />
    </span>
  );
}

type Card = {
  id: string; title: string; line: string; mini: string; scene: React.ReactNode;
  sheet: { line: string; crop: React.ComponentProps<typeof Crop>; facts: [string, string][] };
};

const MAC = { W: 2880, H: 1800 };
const CARDS: Card[] = [
  {
    id: "notes", title: "Write.", line: "Notes that feel like Apple Notes. Bring yours over.", mini: "Notes, like Apple Notes.", scene: <NotesScene />,
    sheet: {
      line: "Feels like Apple Notes, on Mac and iPhone.",
      crop: { src: "/lab/big3/layout-two-columns-main.webp", ...MAC, x: 0, y: 0, w: 1940, h: 1078, alt: "Pinto Notes on a Mac: the list of notes, and the Groceries note open with its checklist." },
      facts: [
        ["Like Apple Notes.", "Checklists, tables, folders and links between notes."],
        ["Bring yours over.", "Import Apple Notes in one go. Folders, checklists and tables come along."],
        ["Mac and iPhone.", "Always in sync, and works offline."],
      ],
    },
  },
  {
    id: "whiteboards", title: "Draw.", line: "A whiteboard next to your notes. Your AI can read it and draw on it.", mini: "A whiteboard your AI can read.", scene: <BoardScene />,
    sheet: {
      line: "Sketch how something works. Your AI sees it too.",
      crop: { src: "/lab/big3/canvas-selected-light-main.webp", ...MAC, x: 300, y: 420, w: 2300, h: 1360, alt: "A whiteboard in Pinto Notes on a Mac: Idea, Draft, Ready?, then Publish or Fix it, with the drawing tools along the bottom." },
      facts: [
        ["Draw by hand.", "Boxes, arrows and words, with the tools you know from Excalidraw."],
        ["Your AI sees it.", "Ask ChatGPT or Claude about a whiteboard. It reads the drawing and can add to it."],
        ["A standard file.", "Every whiteboard is saved in the .excalidraw format."],
      ],
    },
  },
  {
    id: "apps", title: "Build.", line: "Small apps in a note, like a habit tracker. Your AI can make one.", mini: "Apps, like a habit tracker.", scene: <AppsScene />,
    sheet: {
      line: "A habit tracker, a budget, a trip plan. Ready now, or made for you.",
      crop: { src: "/lab/big3/create-mac-newapp-page-chatgpt-light.webp", W: 2938, H: 1840, x: 1190, y: 140, w: 1748, h: 1000, alt: "The New app page in Pinto Notes: four templates, and a box to describe your own and make it with ChatGPT." },
      facts: [
        ["Ready now.", "Pick a template and start using it."],
        ["Or describe it.", "Say what you need, and your AI builds it."],
        ["Any AI can update it.", "Tell ChatGPT “I trained 120 kg this week” and it’s in your log."],
      ],
    },
  },
];

/** Pointer tilt for one card: eases --mx and --my (each -1 to 1) toward the pointer, and back to 0 when it leaves. */
function useTilt() {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const q = new URLSearchParams(location.search);
    const set = (x: number, y: number) => { el.style.setProperty("--mx", x.toFixed(4)); el.style.setProperty("--my", y.toFixed(4)); };
    const held = q.get("tilt");
    if (held && el.dataset.card === "whiteboards") { const [x, y] = held.split(",").map(Number); set(x || 0, y || 0); el.dataset.hover = ""; return; }
    if (q.has("t") || !matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const tick = () => {
      x += (tx - x) * 0.1; y += (ty - y) * 0.1;
      if (Math.abs(tx - x) < 0.0008 && Math.abs(ty - y) < 0.0008) { x = tx; y = ty; raf = 0; } else raf = requestAnimationFrame(tick);
      set(x, y);
    };
    const go = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const b = el.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1));
      ty = Math.max(-1, Math.min(1, ((e.clientY - b.top) / b.height) * 2 - 1));
      go();
    };
    const leave = () => { tx = 0; ty = 0; go(); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); cancelAnimationFrame(raf); };
  }, []);
  return ref;
}

const Arrow = () => <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" /></svg>;
const Close = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" /></svg>;

function Diorama({ card, onOpen }: { card: Card; onOpen: (b: HTMLButtonElement) => void }) {
  const ref = useTilt();
  return (
    <li ref={ref} className={s.card} data-card={card.id}>
      <div className={s.cap}>
        <h3 className={s.cardHead}><b>{card.title}</b> <span className={s.long}>{card.line}</span><span className={s.mini}>{card.mini}</span></h3>
        <span className={s.see} aria-hidden="true">See it <Arrow /></span>
      </div>
      <div className={s.box}>
        <div className={s.stage}>{card.scene}<Frame /></div>
      </div>
      <button type="button" className={s.hit} aria-haspopup="dialog" aria-label={`${card.title.replace(".", "")}: ${card.line} See it`}
        onClick={(e) => onOpen(e.currentTarget)} />
    </li>
  );
}

export function Dioramas() {
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const i = CARDS.findIndex((c) => c.id === new URLSearchParams(location.search).get("card"));
    if (i >= 0) setOpen(i);
  }, []);
  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
  }, [open]);

  const card = open === null ? null : CARDS[open];
  return (
    <section className={s.cardsSec} aria-label="Notes, whiteboards and apps">
      <ul className={s.cards}>
        {CARDS.map((c, i) => <Diorama key={c.id} card={c} onOpen={(b) => { opener.current = b; setOpen(i); }} />)}
      </ul>

      <dialog ref={dialog} className={s.sheet} aria-labelledby="sheet-title"
        onClose={() => { setOpen(null); opener.current?.focus(); }}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
        {card && (
          <div className={s.sheetIn} data-sheet={card.id}>
            <button type="button" className={s.close} onClick={() => setOpen(null)} aria-label="Close"><Close /></button>
            <h2 id="sheet-title" className={s.sheetHead}><b>{card.title}</b> {card.sheet.line}</h2>
            {/* Never wider than the capture at 2x, so it stays sharp. */}
            <div className={s.sheetPic} style={{ maxWidth: card.sheet.crop.w / 2 }}><Crop {...card.sheet.crop} /></div>
            <ul className={s.facts}>
              {card.sheet.facts.map(([b, t]) => <li key={b}><b>{b}</b> {t}</li>)}
            </ul>
          </div>
        )}
      </dialog>
    </section>
  );
}
