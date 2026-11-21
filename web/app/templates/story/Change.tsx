"use client";
import { useState } from "react";
import type { TemplateStory } from "@/lib/template-story";
import { Phone } from "./Phone";
import s from "./story.module.css";

/// Asking for a change: pick an ask, read the chat, and flip the phone between the app before and
/// after it.
export default function Change({ change }: { change: TemplateStory["change"] }) {
  const [ask, setAsk] = useState(0);
  const [after, setAfter] = useState(true);
  const a = change.asks[ask];
  const shown = after ? a.after : a.before;
  return (
    <div className={s.week}>
      <div>
        <div className={s.asks} role="group" aria-label="What was asked">
          {change.asks.map((x, i) => (
            <button key={x.label} type="button" className={s.ask} aria-pressed={i === ask} onClick={() => { setAsk(i); setAfter(true); }}>{x.label}</button>
          ))}
        </div>
        <div className={s.thread} aria-live="polite">
          {a.chat.map((m, i) => "you" in m
            ? <p key={i} className={s.you}>{m.you}</p>
            : <p key={i} className={s.ai}><b>{change.who}</b>{m.ai}</p>)}
        </div>
      </div>
      <figure className={s.weekPhone}>
        <div className={s.flip} role="group" aria-label="The app">
          <button type="button" aria-pressed={!after} onClick={() => setAfter(false)}>Before</button>
          <button type="button" aria-pressed={after} onClick={() => setAfter(true)}>After</button>
        </div>
        <Phone src={shown.src} alt={shown.alt} />
        <figcaption>{change.caption}</figcaption>
      </figure>
      <div hidden>{change.asks.flatMap((x) => [x.before.src, x.after.src]).map((src) => <link key={src} rel="prefetch" as="image" href={src} />)}</div>
    </div>
  );
}
