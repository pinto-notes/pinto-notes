"use client";

import { useEffect, useState } from "react";
import { FOLDERS, FolderIcon, PINNED, PinIcon, TOTAL, Tick, reduce, useFirstView } from "../../Sections";
import a from "../../sections.module.css";
import s from "./d.module.css";

/// The import, run once: the total counts up in the card's title row while the bar fills and each
/// folder fills in. Every part has its place from the start, so the card is never half empty.
/// `settled` (home-g): the numbers are final from the first frame; only the bar's last stretch fills
/// and the check appears, so a visitor who scrolls in early never sees an empty card.
export default function ImportCard({ settled = false }: { settled?: boolean } = {}) {
  const [ref, seen] = useFirstView<HTMLDivElement>(0.45);
  const [p, setP] = useState(1); // complete at rest
  useEffect(() => {
    if (!seen || reduce()) return;
    let raf = 0, start = 0;
    const tick = (now: number) => {
      if (!start) start = now + 250;
      const t = Math.max(0, Math.min(1, (now - start) / (settled ? 700 : 3200)));
      setP(settled ? 0.82 + 0.18 * (1 - Math.pow(1 - t, 3)) : 1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    setP(settled ? 0.82 : 0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, settled]);
  const full = p >= 1;
  const of = FOLDERS.length + 1;
  const count = (n: number, k: number) => settled ? n : Math.round(Math.max(0, Math.min(1, (p - k / of) * of)) * n);
  return (
    <div ref={ref} className={s.import} aria-label={`Imported ${TOTAL.toLocaleString("en")} notes from Apple Notes, with ${PINNED} pinned. Folders kept, Apple Notes unchanged.`}>
      <div className={s.importTop} aria-hidden="true">
        <img src="/apple-notes.webp" alt="" width={36} height={36} />
        <div className={s.importName}>
          <b>{full ? "Imported from Apple Notes" : "Importing from Apple Notes"}</b>
          <span className={s.importTicks}><span><Tick />Folders kept</span><span><Tick />Apple Notes unchanged</span></span>
        </div>
        <p className={s.importTotal}><span className={a.num}>{(settled ? TOTAL : Math.round(TOTAL * p)).toLocaleString("en")}</span> notes</p>
      </div>
      <div className={a.bar} aria-hidden="true">
        <i style={{ transform: `scaleX(${p})` }} />
        <span className={a.barDone} data-on={full || undefined}><Tick /></span>
      </div>
      <ul className={`${a.folders} ${s.folders}`} aria-hidden="true">
        {FOLDERS.map((f, k) => (
          <li key={f.name} data-on={settled || p > k / of || undefined}><FolderIcon /><b>{f.name}</b><span className={a.num}>{count(f.n, k).toLocaleString("en")}</span></li>
        ))}
        <li data-on={settled || p > FOLDERS.length / of || undefined} className={a.pinned}><PinIcon /><b>Pinned</b><span className={a.num}>{count(PINNED, FOLDERS.length)}</span></li>
      </ul>
    </div>
  );
}
