"use client";

import { useEffect, useRef, useState } from "react";
import { Board } from "./Board";
import s from "./home-d.module.css";

// The three cards under the hero: Notes, Whiteboards, Apps. Each is a tall card with the real thing
// filling most of it, a title and one line. Pressing a card (or its +) opens a larger sheet with a
// bigger picture of the app and three more facts. On phones the cards are a swipe row.

/** A close crop of an app capture: the rectangle x, y, w, h of a W × H picture, at any size. */
function Crop({ src, W, H, x, y, w, h, alt }: { src: string; W: number; H: number; x: number; y: number; w: number; h: number; alt: string }) {
  return (
    <span className={s.crop} style={{ aspectRatio: `${w} / ${h}` }}>
      <img src={src} alt={alt} loading="lazy" decoding="async"
        style={{ width: `${(W / w) * 100}%`, left: `${(-x / w) * 100}%`, top: `${(-y / h) * 100}%` }} />
    </span>
  );
}

/** The Notes card's picture: the Groceries note as the Mac app draws it (layout-two-columns-main). */
function NotePic() {
  const items: [string, boolean][] = [["Oat milk", false], ["Lemons", false], ["Coffee beans", false], ["Fresh basil", false], ["Burrata", false],
    ["Cherry tomatoes", false], ["Olive oil", false], ["Dark chocolate", false], ["Sourdough", true], ["Eggs", true], ["Spinach", true]];
  return (
    <div className={s.note} role="img" aria-label="A note called Groceries with a checklist, three items ticked.">
      <p className={s.noteTitle}>Groceries</p>
      <p className={s.noteText}>For the weekend, and Sunday dinner with Sara and Jonas.</p>
      <ul className={s.check}>
        {items.map(([t, on]) => <li key={t} data-on={on || undefined}><i>{on && <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 6.2l2 2 4-4.4" /></svg>}</i>{t}</li>)}
      </ul>
    </div>
  );
}

type Card = {
  id: string; title: string; line: string;
  pic: React.ReactNode;
  sheet: { line: string; crop: React.ComponentProps<typeof Crop>; facts: [string, string][] };
};

const MAC = { W: 2880, H: 1800 };
const CARDS: Card[] = [
  {
    id: "notes", title: "Notes.", line: "Feels like Apple Notes. Brings yours over.",
    pic: <NotePic />,
    sheet: {
      line: "Feels like Apple Notes, on Mac and iPhone.",
      crop: { src: "/lab/big3/layout-two-columns-main.webp", ...MAC, x: 0, y: 0, w: 1800, h: 1000, alt: "Pinto Notes on a Mac: the list of notes, and the Groceries note open with its checklist." },
      facts: [
        ["Like Apple Notes.", "Checklists, tables, folders and links between notes."],
        ["Bring yours over.", "Import Apple Notes in one go. Folders, checklists and tables come along."],
        ["Mac and iPhone.", "Always in sync, and works offline."],
      ],
    },
  },
  {
    id: "whiteboards", title: "Whiteboards.", line: "Draw it out. Your AI can read it and draw on it.",
    pic: <div className={s.boardWrap}><p className={s.boardBar}><span aria-hidden="true">‹</span>Publishing flow</p><Board /></div>,
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
    id: "apps", title: "Apps.", line: "A note can be a small app. Your AI can make one.",
    pic: <div className={s.appPic}><img src="/templates/apps/phone/habit-tracker-light.webp" alt="The Habit tracker app in a note: 62% this week, 2 of 6 done today, Walk on an 11-day streak." width={600} height={662} loading="lazy" decoding="async" /></div>,
    sheet: {
      line: "A habit tracker, a budget, a trip plan. Ready now, or made for you.",
      crop: { src: "/lab/big3/create-mac-newapp-page-chatgpt-light.webp", W: 2938, H: 1840, x: 1200, y: 150, w: 1738, h: 950, alt: "The New app page in Pinto Notes: four templates, and a box to describe your own and make it with ChatGPT." },
      facts: [
        ["Ready now.", "Pick a template and start using it."],
        ["Or describe it.", "Say what you need, and your AI builds it."],
        ["Any AI can update it.", "Tell ChatGPT “I trained 120 kg this week” and it’s in your log."],
      ],
    },
  },
];

const Plus = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11" /></svg>;
const Close = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" /></svg>;

export function Cards() {
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  // `?card=apps` opens a sheet on load (for screenshots and links).
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("card");
    const i = CARDS.findIndex((c) => c.id === q);
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
        {CARDS.map((c, i) => (
          <li key={c.id} className={s.card} data-card={c.id}>
            <button type="button" className={s.cardHit} aria-haspopup="dialog" aria-label={`${c.title.replace(".", "")}: more`}
              onClick={(e) => { opener.current = e.currentTarget; setOpen(i); }} />
            <h3 className={s.cardHead}><b>{c.title}</b> {c.line}</h3>
            <div className={s.pic}>{c.pic}</div>
            <span className={s.plus} aria-hidden="true"><Plus /></span>
          </li>
        ))}
      </ul>

      <dialog ref={dialog} className={s.sheet} aria-labelledby="sheet-title"
        onClose={() => { setOpen(null); opener.current?.focus(); }}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
        {card && (
          <div className={s.sheetIn} data-sheet={card.id}>
            <button type="button" className={s.close} onClick={() => setOpen(null)} aria-label="Close"><Close /></button>
            <h2 id="sheet-title" className={s.sheetHead}><b>{card.title}</b> {card.sheet.line}</h2>
            <div className={s.sheetPic}><Crop {...card.sheet.crop} /></div>
            <ul className={s.facts}>
              {card.sheet.facts.map(([b, t]) => <li key={b}><b>{b}</b> {t}</li>)}
            </ul>
          </div>
        )}
      </dialog>
    </section>
  );
}
