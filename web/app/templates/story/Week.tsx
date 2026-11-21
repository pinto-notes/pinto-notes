"use client";
import { useState } from "react";
import type { TemplateStory } from "@/lib/template-story";
import { Phone } from "./Phone";
import s from "./story.module.css";

/// The week as the app counts it: a dot per habit per day, filled as far as it got. Tap a day (or
/// any dot in it) to see that day's phone, what was said and what came back.
export default function Week({ week }: { week: TemplateStory["week"] }) {
  const [day, setDay] = useState(week.days.length - 1);
  const d = week.days[day];
  return (
    <div className={s.week}>
      <div>
        <div className={s.dots} style={{ "--n": week.days.length } as React.CSSProperties} role="group" aria-label="The week">
          <span />
          {week.days.map((x, i) => (
            <button key={x.label} type="button" className={s.head} aria-pressed={i === day} aria-label={x.label} onClick={() => setDay(i)}>{x.short}</button>
          ))}
          {week.rows.map((r) => [
            <span key={r.name} className={s.name}>{r.name}</span>,
            ...r.days.map((v, i) => (
              <button key={`${r.name}${i}`} type="button" tabIndex={-1} aria-hidden="true" className={s.dot} data-on={i === day || undefined}
                style={{ "--p": `${Math.round(v * 100)}%` } as React.CSSProperties} onClick={() => setDay(i)} />
            )),
          ])}
        </div>
        <div className={s.talk} aria-live="polite">
          <p className={s.day}>{d.label}</p>
          <p className={s.you}>{d.you}</p>
          <p className={s.ai}><b>{week.who}</b>{d.ai}</p>
        </div>
      </div>
      <figure className={s.weekPhone}>
        <Phone src={d.phone} alt={`The habit tracker on ${d.label}`} />
        <figcaption>{week.caption}</figcaption>
      </figure>
      {/* The other days' phones, fetched once the page is idle, so a tap swaps at once. */}
      <div hidden>{week.days.map((x) => <link key={x.phone} rel="prefetch" as="image" href={x.phone} />)}</div>
    </div>
  );
}
