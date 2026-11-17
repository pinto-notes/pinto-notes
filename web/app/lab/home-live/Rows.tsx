"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AskChatGpt, HabitsNote } from "../home-z/Habits";
import { CollabPicture } from "../home-z/Collab";
import { ShareArt, type ShareV } from "./Share";
import { NoteReal } from "./NoteReal";
import { Gallery } from "./Gallery";
import { Stats } from "./Stats";
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

function Row({ id, kicker, title, say, flip, wide, children }: { id: string; kicker: string; title: React.ReactNode; say: string; flip?: boolean; wide?: boolean; children: React.ReactNode }) {
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
  return (
    <Row id="r-write" kicker="Notes" title="Write notes." say="Keep what you read and what you decide. It feels like Apple Notes, on Mac and iPhone, and brings yours over.">
      <div role="img" aria-label="A book note, Deep Work, open in Pinto Notes on a Mac beside the notes list, and the same note on an iPhone.">
        <NoteReal />
      </div>
    </Row>
  );
}

function DrawRow() {
  const [ref, seen] = useSeen<HTMLDivElement>();
  // The board draws Claude's path once it's on screen.
  const bind = useCallback((set: (k: number) => void) => { set(seen ? 1 : 0); return () => {}; }, [seen]);
  return (
    <Row id="r-draw" kicker="Whiteboards" flip wide title="Draw on whiteboards." say="Think a decision through on a board beside your notes. Here Claude drew what happens if you wait.">
      <div ref={ref} className={`${zs.dBoard} ${r.board}`} role="img" aria-label="A whiteboard in Pinto Notes, Studio North: now or March? Claude has drawn the other path, outlined and named as its own.">
        <WbCanvas bind={bind} />
      </div>
    </Row>
  );
}

function BuildRow() {
  return (
    <Row id="r-build" kicker="Apps" title="Build apps." say="A note can be a small app. Describe one, and ChatGPT or Claude builds it as a new note.">
      <div className={r.build}>
        <div className={r.app}><HabitsNote /></div>
        <div className={r.ask}><AskChatGpt /></div>
      </div>
    </Row>
  );
}

function ShareRow({ v }: { v?: ShareV }) {
  return (
    <Row id="r-share" kicker="Together" flip wide title="Write together." say="Share a note and write in it at the same time. Each of you can bring your own AI.">
      <div className={r.share}>{v ? <ShareArt v={v} /> : <CollabPicture />}</div>
    </Row>
  );
}

/** What follows Build (Emil, 2026-11-17: "lets figure out what to put after the build apps one"):
 *  a = the memory study as a big number, b = Together, c = a folder of recipes as a gallery. */
export type Next = "a" | "b" | "c";

function GalleryRow() {
  return (
    <Row id="r-gallery" kicker="Covers" flip wide title="Make it yours." say="Give a note a cover photo and an icon, and see a folder as a gallery. Recipes, trips, books, anything you keep.">
      <div role="img" aria-label="A Recipes folder in Pinto Notes shown as a gallery: eight recipe notes, each with a cover photo, an icon and its first line.">
        <Gallery />
      </div>
    </Row>
  );
}

export function Rows({ share, next }: { share?: ShareV; next?: Next }) {
  return (
    <section className={r.rows} aria-label="What you can do in Pinto Notes">
      <WriteRow />
      <DrawRow />
      <BuildRow />
      {next === "a" && <Stats />}
      {next === "c" && <GalleryRow />}
      {SHOW_COLLAB && (next === undefined || next === "b") && <ShareRow v={share ?? (next === "b" ? "3" : undefined)} />}
    </section>
  );
}
