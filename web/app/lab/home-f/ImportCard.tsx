"use client";

import { FOLDERS, FolderIcon, PINNED, PinIcon, TOTAL, Tick } from "../../Sections";
import a from "../../sections.module.css";
import d from "../home-d/d.module.css";

/// D's import card, finished and still: study F keeps one motion on the page (the hero's ticks).
/// A client component only because the folder figures live in the live home page's client module.
export default function ImportCard() {
  return (
    <div className={d.import} aria-label={`Imported ${TOTAL.toLocaleString("en")} notes from Apple Notes, with ${PINNED} pinned. Folders kept, Apple Notes unchanged.`}>
      <div className={d.importTop} aria-hidden="true">
        <img src="/apple-notes.webp" alt="" width={36} height={36} />
        <div className={d.importName}>
          <b>Imported from Apple Notes</b>
          <span className={d.importTicks}><span><Tick />Folders kept</span><span><Tick />Apple Notes unchanged</span></span>
        </div>
        <p className={d.importTotal}><span className={a.num}>{TOTAL.toLocaleString("en")}</span> notes</p>
      </div>
      <div className={a.bar} aria-hidden="true">
        <i style={{ transform: "scaleX(1)" }} />
        <span className={a.barDone} data-on><Tick /></span>
      </div>
      <ul className={`${a.folders} ${d.folders}`} aria-hidden="true">
        {FOLDERS.map((f) => (
          <li key={f.name} data-on><FolderIcon /><b>{f.name}</b><span className={a.num}>{f.n.toLocaleString("en")}</span></li>
        ))}
        <li data-on className={a.pinned}><PinIcon /><b>Pinned</b><span className={a.num}>{PINNED}</span></li>
      </ul>
    </div>
  );
}
