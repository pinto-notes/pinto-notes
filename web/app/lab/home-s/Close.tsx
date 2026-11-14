"use client";

import { useState } from "react";
import { seg, useShow } from "./show";
import { ADDED, DECIDED, hand, Receipt, Tick } from "./Things";
import s from "./s.module.css";

// The close, in two beats. First the notebook's last page: the trip note open on a Mac, small, with
// ChatGPT's Sintra line in it, and the same line arriving on the iPhone beside it a moment later. The
// iPhone never covers the Mac's line. Then the cover closes over everything: "Pinto Notes is free.",
// the download, and four handwritten lines on a torn sheet of ruled paper.

function Lines({ arrived, phone }: { arrived: boolean; phone?: boolean }) {
  const [undone, setUndone] = useState(false);
  return (
    <div className={s.dvNote}>
      <p className={s.dvTitle}>Lisbon, <span className={s.nw}>May 8–12</span></p>
      <p className={s.dvDecided}><b>Decided:</b> {DECIDED}</p>
      <ul className={s.dvRows}>
        <li data-on><i><Tick /></i>Book the flights</li>
        <li><i />Find a flat in Alfama</li>
        {!phone && <li><i />Pastéis de Belém, early</li>}
        <li className={s.dvAdded} data-in={arrived || undefined} data-undone={undone || undefined}><i /><span>{ADDED}</span></li>
      </ul>
      <div className={s.dvRec} data-in={arrived || undefined}><Receipt undone={undone} onFlip={() => setUndone((u) => !u)} live={arrived} /></div>
    </div>
  );
}

export function SyncMoment({ subscribe }: { subscribe: (fn: (dwell: number, arrive: number) => void) => () => void }) {
  const [arrived, setArrived] = useState(false);
  useShow({ name: "sync", end: 1.6, subscribe, apply: (t) => { const a = seg(t, 0.75, 0.76) >= 1; setArrived((o) => (o === a ? o : a)); } });
  return (
    <div className={s.devices}>
      <div className={s.mac} role="img" aria-label="Pinto Notes on a Mac: the Lisbon note, with ChatGPT's Sintra line in it">
        <div className={s.macBar}><i /><i /><i /><span>Lisbon, May 8–12</span></div>
        <div className={s.macWin}>
          <ul className={s.macSide}>
            <li data-on><b>Lisbon, May 8–12</b><small>Note</small></li>
            <li><b>Friday in Lisbon</b><small>Whiteboard</small></li>
            <li><b>Before Lisbon</b><small>App</small></li>
          </ul>
          <Lines arrived />
        </div>
      </div>
      <div className={s.phone} role="img" aria-label="The same note on an iPhone, where the Sintra line has just arrived">
        <div className={s.phoneScreen}>
          <p className={s.phoneStatus}><b>9:41</b><span className={s.island} /><span className={s.phoneIcons}><i /><i /><i /></span></p>
          <p className={s.phoneNav}><svg viewBox="0 0 10 16"><path d="M8 2 L2 8 L8 14" /></svg>Notes</p>
          <Lines arrived={arrived} phone />
        </div>
      </div>
    </div>
  );
}

/** The four things a careful person checks, written by hand on the cover's ruled paper. */
export function FreeLines() {
  return (
    <div className={s.ruled}>
      <ul className={`${s.ruledLines} ${hand.className}`}>
        <li>Syncs your Mac and iPhone. Works offline.</li>
        <li>Encrypted on your device before it syncs.</li>
        <li>Brings over your Apple Notes.</li>
        <li>Open source. <a href="https://github.com/pinto-notes/pinto-notes" target="_blank" rel="noopener noreferrer">Check the code</a></li>
      </ul>
    </div>
  );
}
