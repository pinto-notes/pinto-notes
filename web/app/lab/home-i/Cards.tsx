"use client";

import { useEffect, useRef, useState } from "react";
import { Board } from "./Board";
import { Front, Scene, type World } from "./Paper";
import s from "./home-i.module.css";

// The three cards under the hero: Notes, Whiteboards, Apps. Each card is its own paper world (a soft
// paper colour, a grain, and cut-paper shapes behind the app), and the real app sits in front, big and
// close up, running off the card's bottom edge. Pressing a card (or its +) opens a sheet of the same
// paper with a bigger picture and three more facts. On phones the cards are a swipe row.

/** A close crop of an app capture: the rectangle x, y, w, h of a W × H picture, at any size. */
function Crop({ src, W, H, x, y, w, h, alt }: { src: string; W: number; H: number; x: number; y: number; w: number; h: number; alt: string }) {
  return (
    <span className={s.crop} style={{ aspectRatio: `${w} / ${h}` }}>
      <img src={src} alt={alt} loading="lazy" decoding="async"
        style={{ width: `${(W / w) * 100}%`, left: `${(-x / w) * 100}%`, top: `${(-y / h) * 100}%` }} />
    </span>
  );
}

const Tick = () => <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 6.2l2 2 4-4.4" /></svg>;

/** Notes: the Groceries note as the Mac app draws it (layout-two-columns-main). */
function NotePic() {
  const items: [string, boolean][] = [["Oat milk", false], ["Lemons", false], ["Coffee beans", false], ["Fresh basil", false], ["Burrata", false],
    ["Cherry tomatoes", false], ["Olive oil", false], ["Dark chocolate", false], ["Sourdough", true], ["Eggs", true], ["Spinach", true]];
  return (
    <div className={s.note} role="img" aria-label="A note called Groceries with a checklist, three items ticked.">
      <p className={s.noteTitle}>Groceries</p>
      <p className={s.noteText}>For the weekend, and Sunday dinner with Sara and Jonas.</p>
      <ul className={s.check}>
        {items.map(([t, on]) => <li key={t} data-on={on || undefined}><i>{on && <Tick />}</i>{t}</li>)}
      </ul>
    </div>
  );
}

/** Apps: the Habit tracker template as it draws itself in a note (templates/apps/phone/habit-tracker-light). */
function HabitPic() {
  const habits = [
    { name: "Walk", say: "30 minutes outside", streak: "11-day streak", done: true, days: 2 },
    { name: "Read", say: "20 pages", streak: "9-day streak", done: false, days: 1 },
    { name: "Water", say: "5 of 8 glasses", streak: "2-day streak", done: false, days: 1 },
  ];
  const r = 30, c = 2 * Math.PI * r;
  return (
    <div className={s.habit} role="img" aria-label="The Habit tracker app in a note: 62% this week, 2 of 6 done today, Walk on an 11-day streak.">
      <p className={s.hDate}>Tuesday 13 October</p>
      <p className={s.hToday}>Today</p>
      <div className={s.hWeek}>
        <span className={s.ring}>
          <svg viewBox="0 0 76 76" aria-hidden="true">
            <circle cx="38" cy="38" r={r} fill="none" stroke="#ebe6df" strokeWidth="8" />
            <circle cx="38" cy="38" r={r} fill="none" stroke="#e07612" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(c * 0.62).toFixed(1)} ${c.toFixed(1)}`} transform="rotate(90 38 38)" />
          </svg>
          <b>62%</b>
        </span>
        <span className={s.hWeekWords}><small>This week</small><b>2 of 6 done today</b><span>8 of 13 since Monday</span></span>
      </div>
      <p className={s.hHead}>Habits</p>
      <ul className={s.hList}>
        {habits.map((h) => (
          <li key={h.name}>
            <span className={s.hWords}>
              <b>{h.name} <i aria-hidden="true">›</i></b>
              <span>{h.say} · <em>{h.streak}</em></span>
              <span className={s.hDays}>{"MTWTFSS".split("").map((d, i) => <i key={i} data-on={i < h.days || undefined}>{d}</i>)}</span>
            </span>
            <span className={s.hDone} data-on={h.done || undefined}>{h.done && <Tick />}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Card = {
  id: World; title: string; line: string;
  pic: React.ReactNode;
  sheet: { line: string; crop: React.ComponentProps<typeof Crop>; facts: [string, string][] };
};

const MAC = { W: 2880, H: 1800 };
const CARDS: Card[] = [
  {
    id: "notes", title: "Write.", line: "Notes that feel like Apple Notes. Bring yours over.",
    pic: <NotePic />,
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
    id: "whiteboards", title: "Draw.", line: "A whiteboard next to your notes. Your AI can read it and draw on it.",
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
    id: "apps", title: "Build.", line: "Small apps in a note, like a habit tracker. Your AI can make one.",
    pic: <HabitPic />,
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
            <div className={s.stage}>
              <Scene world={c.id} id={`card-${c.id}`} />
              <div className={s.pic}>{c.pic}</div>
              <Front world={c.id} id={`card-${c.id}`} />
            </div>
            <span className={s.plus} aria-hidden="true"><Plus /></span>
          </li>
        ))}
      </ul>

      <dialog ref={dialog} className={s.sheet} data-sheet={card?.id} aria-labelledby="sheet-title"
        onClose={() => { setOpen(null); opener.current?.focus(); }}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
        {card && (
          <div className={s.sheetIn}>
            <Scene world={card.id} id={`sheet-${card.id}`} sheet />
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
