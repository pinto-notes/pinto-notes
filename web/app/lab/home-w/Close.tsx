"use client";

import { useCallback, useRef, useState } from "react";
import { seg, useShow } from "./show";
import { Receipt, Tick } from "./Things";
import s from "./s.module.css";

// The close is one scene on the same table (the second still life). On the left: "Pinto Notes is
// free.", the download, and four plain lines, what a careful person checks before installing. On the
// right, laid on the table: the Studio North note open on a Mac (the other side of that life: the
// decision to wait, and the question ChatGPT added for the call), and the iPhone beside it, where the
// same line arrives a moment after the page lands. The iPhone never covers the Mac's lines.

/** The Studio North note, as the Mac and the iPhone show it. */
const SN = { title: "Studio North", decided: "Wait until March. Finish the launch first.", added: "Ask Ana: can the start move to March?" };

function Lines({ arrived }: { arrived: boolean }) {
  const [undone, setUndone] = useState(false);
  return (
    <div className={s.dvNote}>
      <p className={s.dvDate}>Today at 09:12</p>
      <p className={s.dvTitle}>{SN.title}</p>
      <ul className={s.dvRows}>
        <li data-on><i><Tick /></i>Read the offer again</li>
        <li><i />Answer Ana by Friday</li>
      </ul>
      <p className={s.dvDecided}><b>Decided:</b> {SN.decided}</p>
      <p className={s.dvAdded} data-in={arrived || undefined} data-undone={undone || undefined}><span>{SN.added}</span></p>
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
      <div className={s.mac} role="img" aria-label="Pinto Notes on a Mac: the Studio North note, with the question ChatGPT added for the call">
        <div className={s.macBar}><i /><i /><i /><span>Studio North</span></div>
        <Lines arrived />
      </div>
      <div className={s.phone} role="img" aria-label="The same note on an iPhone, where the question has just arrived">
        <div className={s.phoneScreen}>
          <p className={s.phoneStatus}><b>9:41</b><span className={s.island} /><span className={s.phoneIcons}><i /><i /><i /></span></p>
          <p className={s.phoneNav}><svg viewBox="0 0 10 16"><path d="M8 2 L2 8 L8 14" /></svg>Work</p>
          <Lines arrived={arrived} />
        </div>
      </div>
    </div>
  );
}

/** The four things a careful person checks, in plain words on the cover. */
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
