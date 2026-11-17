"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AskChatGpt, HabitsNote } from "../home-z/Habits";
import { CollabPicture } from "../home-z/Collab";
import { Note, NotePhone } from "../home-z/Things";
import { WbCanvas } from "../home-z/Wb";
import zs from "../home-z/s.module.css";
import v from "./home.module.css";
import r from "./rows.module.css";

// Round 28 (Emil, 2026-11-17): the live page with the film and the people taken out, and in their
// place what Pinto is, one row each, words and the real app alternating sides: write notes, draw on
// whiteboards, build apps, and (behind SHOW_COLLAB until 1.4 ships) write together. The pictures are
// the lab's marketing versions of the real UI (home-z), which Emil's designer colleague liked.

/** Collaboration ships in 1.4. On the lab page it shows; flip this off before this page goes live. */
export const SHOW_COLLAB = true;

/** True once the element has been on screen (or at once with Reduce Motion or `?t=`). */
function useSeen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("t")) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.45 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

/** `full` (default, after Linear): each thing is a whole screen, the title left, its line right, the
 *  product wide under them. `alt`: the earlier alternating rows. */
export type Layout = "full" | "alt";
const LayoutCtx = createContext<Layout>("full");

function Row({ id, kicker, title, say, flip, wide, children }: { id: string; kicker: string; title: React.ReactNode; say: string; flip?: boolean; wide?: boolean; children: React.ReactNode }) {
  const layout = useContext(LayoutCtx);
  if (layout === "full") return (
    <div className={r.full}>
      <div className={r.fullHead}>
        <div><p className={v.kicker}>{kicker}</p><h3 id={id} className={r.fullTitle}>{title}</h3></div>
        <p className={r.fullSay}>{say}</p>
      </div>
      <div className={r.fullPic}>{children}</div>
    </div>
  );
  return (
    <div className={`${v.row} ${r.row} ${wide ? r.wide : ""}`} data-flip={flip || undefined}>
      <div className={v.words}>
        <p className={v.kicker}>{kicker}</p>
        <h3 id={id} className={`${v.rowTitle} ${r.title}`}>{title}</h3>
        <p className={v.say}>{say}</p>
      </div>
      <div className={r.pic}>{children}</div>
    </div>
  );
}

function WriteRow() {
  const [ref, seen] = useSeen<HTMLDivElement>();
  return (
    <Row id="r-write" kicker="Notes" flip title="Write notes." say="Keep what you read and what you decide. It feels like Apple Notes, on Mac and iPhone, and brings yours over.">
      <div ref={ref} className={`${zs.wDevices} ${r.devices}`} role="img" aria-label="A book note open in Pinto Notes on a Mac, and the same note on an iPhone.">
        <Note live={seen} />
        <NotePhone />
      </div>
    </Row>
  );
}

function DrawRow() {
  const [ref, seen] = useSeen<HTMLDivElement>();
  // The board draws Claude's path once it's on screen.
  const bind = useCallback((set: (k: number) => void) => { set(seen ? 1 : 0); return () => {}; }, [seen]);
  return (
    <Row id="r-draw" kicker="Whiteboards" wide title="Draw on whiteboards." say="Think a decision through on a board beside your notes. Here Claude drew what happens if you wait.">
      <div ref={ref} className={`${zs.dBoard} ${r.board}`} role="img" aria-label="A whiteboard in Pinto Notes, Studio North: now or March? Claude has drawn the other path, outlined and named as its own.">
        <WbCanvas bind={bind} />
      </div>
    </Row>
  );
}

function BuildRow() {
  return (
    <Row id="r-build" kicker="Apps" flip title="Build apps." say="A note can be a small app. Describe one, and ChatGPT or Claude builds it as a new note.">
      <div className={r.build}>
        <div className={r.app}><HabitsNote /></div>
        <div className={r.ask}><AskChatGpt /></div>
      </div>
    </Row>
  );
}

function ShareRow() {
  return (
    <Row id="r-share" kicker="Together" wide title="Write together." say="Share a note and write in it at the same time. Each of you can bring your own AI.">
      <div className={r.share}><CollabPicture /></div>
    </Row>
  );
}

export function Rows({ layout = "full" }: { layout?: Layout }) {
  return (
    <LayoutCtx.Provider value={layout}>
    <section className={`${r.rows} ${layout === "full" ? r.rowsFull : ""}`} aria-label="What you can do in Pinto Notes">
      <WriteRow />
      <DrawRow />
      <BuildRow />
      {SHOW_COLLAB && <ShareRow />}
    </section>
    </LayoutCtx.Provider>
  );
}
