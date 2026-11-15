"use client";

import { useCallback, useRef, useState } from "react";
import { seg, useShow } from "./show";
import { ADDED, CALL, DECIDED, Receipt } from "./Things";
import s from "./s.module.css";

// The close is one scene on the notebook's cover. On the left: "Pinto Notes is free.", the download,
// and four plain lines, what a careful person checks before installing. On the right: the job offer
// note open on a Mac, with ChatGPT's line in it, and the iPhone beside it, where the same line
// arrives a moment after the cover lands. The iPhone never covers the Mac's lines.

function Lines({ arrived }: { arrived: boolean }) {
  const [undone, setUndone] = useState(false);
  return (
    <div className={s.dvNote}>
      <p className={s.dvDate}>Today at 09:41</p>
      <p className={s.dvTitle}>Job offer: <span className={s.nw}>Studio North</span></p>
      <ul className={s.dvCall}>
        <li>{CALL[0]}</li>
        <li>{CALL[1]}</li>
      </ul>
      <p className={s.dvDecided}><b>Decided:</b> {DECIDED}</p>
      <ul className={s.dvRows}>
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
      <div className={s.mac} role="img" aria-label="Pinto Notes on a Mac: the job offer note, with ChatGPT's line in it">
        <div className={s.macBar}><i /><i /><i /><span>Job offer: Studio North</span></div>
        <Lines arrived />
      </div>
      <div className={s.phone} role="img" aria-label="The same note on an iPhone, where ChatGPT's line has just arrived">
        <div className={s.phoneScreen}>
          <p className={s.phoneStatus}><b>9:41</b><span className={s.island} /><span className={s.phoneIcons}><i /><i /><i /></span></p>
          <p className={s.phoneNav}><svg viewBox="0 0 10 16"><path d="M8 2 L2 8 L8 14" /></svg>Notes</p>
          <Lines arrived={arrived} />
        </div>
      </div>
    </div>
  );
}

/** The four things a careful person checks, in plain lines on the cover. */
export function FreeLines() {
  return (
    <ul className={s.claims}>
      <li>Syncs your Mac and iPhone. Works offline.</li>
      <li>Encrypted, and stored in the EU.</li>
      <li>Brings over your Apple Notes.</li>
      <li>Open source. <a href="https://github.com/pinto-notes/pinto-notes" target="_blank" rel="noopener noreferrer">Check the code</a></li>
    </ul>
  );
}
