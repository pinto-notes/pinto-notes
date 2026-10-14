"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import s from "./switcher.module.css";

export type VersionInfo = { id: string; name: string; idea: string; take: string; parts?: { key: string; label: string; options: { id: string; label: string }[] }[] };

/// The lower-left switcher: pick a whole version, then flip its parts. Choices live in the address,
/// so a version can be shared and reloads where you were. Collapses to a pill; remembers it.
export function Switcher({ versions }: { versions: VersionInfo[] }) {
  const router = useRouter();
  const path = usePathname();
  const q = useSearchParams();
  const v = versions.find((x) => x.id === q.get("v")) ?? versions[0];
  const [open, setOpen] = useState(false);
  useEffect(() => { try { if (localStorage.getItem("labSwitcher") === "open") setOpen(true); } catch {} }, []);
  const toggle = () => { setOpen(!open); try { localStorage.setItem("labSwitcher", open ? "closed" : "open"); } catch {} };
  const go = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(q.toString());
    for (const [k, val] of Object.entries(next)) val === null ? p.delete(k) : p.set(k, val);
    router.replace(`${path}?${p.toString()}`, { scroll: false });
  };
  return (
    <aside className={s.box} data-open={open || undefined} aria-label="Version switcher">
      <button type="button" className={s.pill} onClick={toggle} aria-expanded={open}>
        <span className={s.dot} />Version {versions.indexOf(v) + 1} of {versions.length} · {v.name}
      </button>
      {open && (
        <div className={s.panel}>
          <div className={s.versions} role="radiogroup" aria-label="Version">
            {versions.map((x, i) => (
              <button key={x.id} type="button" role="radio" aria-checked={x.id === v.id} className={s.v}
                onClick={() => { const p: Record<string, string | null> = { v: x.id }; for (const pt of v.parts ?? []) p[pt.key] = null; go(p); scrollTo({ top: 0 }); }}>
                <b>{i + 1}</b>{x.name}
              </button>
            ))}
          </div>
          <p className={s.idea}>{v.idea}</p>
          <p className={s.take}>{v.take}</p>
          {(v.parts ?? []).map((pt) => {
            const cur = q.get(pt.key) ?? pt.options[0].id;
            return (
              <div key={pt.key} className={s.part}>
                <span>{pt.label}</span>
                <div className={s.seg}>
                  {pt.options.map((o) => (
                    <button key={o.id} type="button" aria-pressed={o.id === cur} onClick={() => go({ [pt.key]: o.id === pt.options[0].id ? null : o.id })}>{o.label}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
