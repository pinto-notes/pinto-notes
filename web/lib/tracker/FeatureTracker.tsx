"use client";

import { useState } from "react";
import s from "./tracker.module.css";
import { type Assistant, type Entry } from "./entries";
import { host, monthId, monthName, monthOf, newestFirst, shortDate } from "./months";

/// The tracker's rows, newest first and grouped by month, with chips to show one assistant's
/// launches. Every row is in the page's HTML; the chips only hide rows.

export function FeatureTracker({ entries, figures = {} }: { entries: Entry[]; figures?: Record<string, React.ReactNode> }) {
  const [only, setOnly] = useState<Assistant | null>(null);
  const rows = newestFirst(entries);
  const assistants = [...new Set(rows.map((e) => e.assistant))].sort((a, b) => rows.filter((e) => e.assistant === b).length - rows.filter((e) => e.assistant === a).length);
  const months = [...new Set(rows.map((e) => monthOf(e.date)))];
  const shown = (e: Entry) => !only || e.assistant === only;

  return (
    <div className={s.tracker}>
      <p className={s.months}>
        Jump to{" "}
        {months.map((m, i) => <span key={m}><a href={`#${monthId(m)}`}>{monthName(m).slice(0, -5)}</a>{i < months.length - 1 ? <span aria-hidden="true"> · </span> : null}</span>)}
      </p>
      <div className={s.filter} role="group" aria-label="Show launches from">
        <button type="button" aria-pressed={!only} onClick={() => setOnly(null)}>All</button>
        {assistants.map((a) => (
          <button key={a} type="button" aria-pressed={only === a} onClick={() => setOnly(only === a ? null : a)}>{a}</button>
        ))}
      </div>
      {months.map((m) => {
        const list = rows.filter((e) => monthOf(e.date) === m);
        const visible = list.filter(shown);
        return (
          <section key={m} aria-labelledby={monthId(m)} hidden={visible.length === 0}>
            <h2 id={monthId(m)}>{monthName(m)}</h2>
            {!only && figures[m]}
            <ol className={s.rows}>
              {list.map((e) => (
                <li key={`${e.date}-${e.feature}`} className={s.row} hidden={!shown(e)}>
                  <p className={s.meta}>
                    <time dateTime={e.date}>{shortDate(e.date)}</time>
                    <span className={s.chip} data-assistant={e.assistant}>{e.assistant}</span>
                  </p>
                  <div className={s.body}>
                    <h3 className={s.feature}>{e.feature}</h3>
                    <p className={s.what}>{e.what}</p>
                    {e.who ? <p className={s.who}><span>Who gets it:</span> {e.who}</p> : null}
                    <p className={s.links}>
                      <a href={e.source} rel="noopener">Official page ({host(e.source)})</a>
                      {e.guide ? <><span aria-hidden="true"> · </span><a href={`/blog/${e.guide}`}>Our how-to</a></> : null}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
