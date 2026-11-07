"use client";

import { useEffect, useState } from "react";
import type { QA } from "./questions";
import f from "./faq.module.css";
import { SITE_EVENT } from "@/lib/open-in-app";
import type { SiteEvent } from "@/lib/posthog";
import { answerRated, questionOpened } from "@/lib/help-events";

const send = (e: SiteEvent) => window.dispatchEvent(new CustomEvent(SITE_EVENT, { detail: e }));

/// One question per row; click to open. Each row has an #anchor, and opening one updates the address.
/// Opening a question and answering "Did this answer it?" are counted (lib/help-events.ts).
export default function Faq({ items }: { items: QA[] }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [rated, setRated] = useState<Record<string, "yes" | "no">>({});

  useEffect(() => {
    const fromHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!items.some((i) => i.id === id)) return;
      send(questionOpened(id, "link", location.pathname));
      setOpen((o) => new Set(o).add(id));
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [items]);

  const toggle = (id: string) => {
    if (!open.has(id)) send(questionOpened(id, "click", location.pathname));
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id); else n.add(id);
      history.replaceState(null, "", n.has(id) ? `#${id}` : location.pathname);
      return n;
    });
  };

  return (
    <div className={f.list}>
      {items.map((it) => {
        const on = open.has(it.id);
        return (
          <div key={it.id} id={it.id} className={f.item} data-open={on || undefined}>
            <h2 className={f.q}>
              <button id={`${it.id}-q`} type="button" aria-expanded={on} aria-controls={`${it.id}-a`} onClick={() => toggle(it.id)}>
                <span>{it.q}</span>
                <svg className={f.chev} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5.5 7 9.5l4-4" /></svg>
              </button>
            </h2>
            <div id={`${it.id}-a`} role="region" aria-labelledby={`${it.id}-q`} className={f.a} inert={!on || undefined}>
              <div>
                {it.a.map((p) => <p key={p}>{p}</p>)}
                {it.more && <p className={f.more}><a href={it.more.href}>{it.more.text}</a></p>}
                <Rate id={it.id} answer={rated[it.id]} onRate={(a) => {
                  send(answerRated(it.id, a, location.pathname));
                  setRated((r) => ({ ...r, [it.id]: a }));
                }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/// "Did this answer it?" under each answer. After a tap it says thanks, and after No it says where
/// to ask instead.
function Rate({ id, answer, onRate }: { id: string; answer?: "yes" | "no"; onRate: (a: "yes" | "no") => void }) {
  if (answer) {
    return (
      <p className={f.rated} role="status">
        {answer === "yes" ? "Thanks." : <>Thanks. Tell me what you were looking for at <a href="#contact">Contact</a>, and I&apos;ll add it.</>}
      </p>
    );
  }
  return (
    <div className={f.rate} role="group" aria-labelledby={`${id}-rate`}>
      <span id={`${id}-rate`}>Did this answer it?</span>
      <button type="button" onClick={() => onRate("yes")}>Yes</button>
      <button type="button" onClick={() => onRate("no")}>No</button>
    </div>
  );
}
