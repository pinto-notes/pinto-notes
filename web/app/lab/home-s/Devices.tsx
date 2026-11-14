"use client";

import { useState } from "react";
import { ADDED, DECIDED, Receipt, Tick } from "./Things";
import s from "./s.module.css";

// The ending's first half: the same Lisbon note, open on a Mac and on an iPhone at once. Both are the
// real thing's words and layout, built in HTML so they stay sharp. Undo on one is Undo on both, the
// way sync works.

function NoteBody({ undone, onFlip, phone }: { undone: boolean; onFlip: () => void; phone?: boolean }) {
  return (
    <div className={s.dvNote}>
      {!phone && <p className={s.dvDate}>Today at 09:41</p>}
      <p className={s.dvTitle}>Lisbon, <span className={s.nw}>May 8–12</span></p>
      <p className={s.dvText}>Marta says go up to Graça for the sunset. Pack shoes for the hills.</p>
      <p className={s.dvDecided}><b>Decided:</b> {DECIDED}</p>
      <ul className={s.dvRows}>
        <li data-on><i><Tick /></i>Book the flights</li>
        <li><i />Find a flat in Alfama</li>
        <li><i />Ask Marta about the fado place</li>
        <li className={s.dvAdded} data-undone={undone || undefined}><i /><span>{ADDED}</span></li>
      </ul>
      <Receipt undone={undone} onFlip={onFlip} />
    </div>
  );
}

const LIST = [
  { t: "Lisbon, May 8–12", d: "09:41", k: "note", on: true },
  { t: "Friday in Lisbon", d: "Yesterday", k: "board" },
  { t: "Before Lisbon", d: "Monday", k: "app" },
  { t: "Book club: May", d: "Friday", k: "note" },
];

const Kind = ({ k }: { k: string }) => k === "board"
  ? <svg viewBox="0 0 16 16"><rect x="1.5" y="2.5" width="13" height="11" rx="2.5" /><path d="M4.5 9.5 L7 6.5 L9 8.5 L11.5 5.5" /></svg>
  : k === "app"
    ? <svg viewBox="0 0 16 16"><rect x="2" y="2" width="5" height="5" rx="1.4" /><rect x="9" y="2" width="5" height="5" rx="1.4" /><rect x="2" y="9" width="5" height="5" rx="1.4" /><rect x="9" y="9" width="5" height="5" rx="1.4" /></svg>
    : <svg viewBox="0 0 16 16"><rect x="2.5" y="1.5" width="11" height="13" rx="2.2" /><path d="M5 5.5h6M5 8h6M5 10.5h3.5" /></svg>;

export function Devices() {
  const [undone, setUndone] = useState(false);
  const flip = () => setUndone((u) => !u);
  return (
    <div className={s.devices}>
      <div className={s.mac} role="img" aria-label="Pinto Notes on a Mac, showing the Lisbon note">
        <div className={s.macBar}><i /><i /><i /></div>
        <div className={s.macMain}>
          <ul className={s.macList}>
            {LIST.map((n) => (
              <li key={n.t} data-on={n.on || undefined}><span className={s.macKind}><Kind k={n.k} /></span><span><b>{n.t}</b><small>{n.d}</small></span></li>
            ))}
          </ul>
          <NoteBody undone={undone} onFlip={flip} />
        </div>
      </div>
      <div className={s.phone} role="img" aria-label="The same note on an iPhone">
        <div className={s.phoneScreen}>
          <p className={s.phoneStatus}><b>9:41</b><span className={s.island} /><span className={s.phoneIcons}><i /><i /><i /></span></p>
          <p className={s.phoneNav}><svg viewBox="0 0 10 16"><path d="M8 2 L2 8 L8 14" /></svg>Notes</p>
          <NoteBody undone={undone} onFlip={flip} phone />
        </div>
      </div>
    </div>
  );
}
