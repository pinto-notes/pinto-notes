"use client";

import { useCallback, useRef, useState } from "react";
import { seg, useShow } from "./show";
import { ADDED, DECIDED, hand, Receipt, Tick } from "./Things";
import s from "./u.module.css";

// The close is one scene on the notebook's cover (the pencil-and-tear picture). On the left: "Pinto
// Notes is free.", the download, and four lines in pencil on the cover itself, what a careful person
// checks before installing. On the right, laid on the tear: the trip note open on a Mac, with
// ChatGPT's Sintra line in it, and the iPhone beside it, where the same line arrives a moment after
// the cover lands. The iPhone never covers the Mac's lines.

function Lines({ arrived }: { arrived: boolean }) {
  const [undone, setUndone] = useState(false);
  return (
    <div className={s.dvNote}>
      <p className={s.dvDate}>Today at 09:41</p>
      <p className={s.dvTitle}>Lisbon, <span className={s.nw}>May 8–12</span></p>
      <p className={s.dvDecided}><b>Decided:</b> {DECIDED}</p>
      <ul className={s.dvRows}>
        <li data-on><i><Tick /></i>Book the flights</li>
        <li><i />Find a flat in Alfama</li>
        <li><i />Pastéis de Belém, early</li>
        <li className={s.dvAdded} data-in={arrived || undefined} data-undone={undone || undefined}><i /><span>{ADDED}</span></li>
      </ul>
      <div className={s.dvRec} data-in={arrived || undefined}><Receipt undone={undone} onFlip={() => setUndone((u) => !u)} live={arrived} /></div>
    </div>
  );
}

type Sub = (fn: (dwell: number, arrive: number) => void) => () => void;

/**
 * The Mac and the iPhone. On wide windows the cover docks and the show starts with it (`subscribe`);
 * on phones the cover scrolls like a page, so the show starts once the devices are in view.
 */
export function SyncMoment({ subscribe }: { subscribe: Sub }) {
  const box = useRef<HTMLDivElement>(null);
  const [arrived, setArrived] = useState(false);
  const sub = useCallback<Sub>((fn) => {
    const el = box.current;
    if (typeof matchMedia !== "function" || !matchMedia("(max-width: 760px)").matches || !el) return subscribe(fn);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { fn(0, 1); io.disconnect(); } }, { threshold: 0.7 });
    io.observe(el);
    return () => io.disconnect();
  }, [subscribe]);
  useShow({ name: "sync", end: 1.6, subscribe: sub, apply: (t) => { const a = seg(t, 0.75, 0.76) >= 1; setArrived((o) => (o === a ? o : a)); } });
  return (
    <div ref={box} className={s.devices}>
      <div className={s.mac} role="img" aria-label="Pinto Notes on a Mac: the Lisbon note, with ChatGPT's Sintra line in it">
        <div className={s.macBar}><i /><i /><i /><span>Lisbon, May 8–12</span></div>
        <Lines arrived />
      </div>
      <div className={s.phone} role="img" aria-label="The same note on an iPhone, where the Sintra line has just arrived">
        <div className={s.phoneScreen}>
          <p className={s.phoneStatus}><b>9:41</b><span className={s.island} /><span className={s.phoneIcons}><i /><i /><i /></span></p>
          <p className={s.phoneNav}><svg viewBox="0 0 10 16"><path d="M8 2 L2 8 L8 14" /></svg>Notes</p>
          <Lines arrived={arrived} />
        </div>
      </div>
    </div>
  );
}

/** The four things a careful person checks, written in pencil on the cover. */
export function FreeLines() {
  return (
    <ul className={`${s.claims} ${hand.className}`}>
      <li>Syncs your Mac and iPhone. Works offline.</li>
      <li>Encrypted, and stored in the EU.</li>
      <li>Brings over your Apple Notes.</li>
      <li>Open source. <a href="https://github.com/pinto-notes/pinto-notes" target="_blank" rel="noopener noreferrer">Check the code</a></li>
    </ul>
  );
}
