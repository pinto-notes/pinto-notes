import { AIGlyph } from "./ai-glyphs";
import s from "./note-moment.module.css";

/// A blog picture drawn the way the home page draws its scenes (app/_home): what you said to your AI,
/// its reply, and the note it changed, zoomed in to the lines that matter. The lines the AI added or
/// changed are tinted and carry its name, as Pinto Notes marks them. Short and wide on purpose: it
/// shows one moment, not a whole window (Emil, 17 October 2026: "make the UI more zoomed in, less
/// tall, and show the ChatGPT writing in the notes").
export type MomentLine = { text: string; done?: boolean; by?: boolean };
type Glyph = "openai" | "claude" | "grok" | "gemini";

export function NoteMoment({ me, reply, ai = "ChatGPT", glyph = "openai", title, kind = "check", lines, caption, label }: {
  me: string; reply: string; ai?: string; glyph?: Glyph; title: string; kind?: "check" | "bullet" | "text";
  lines: MomentLine[]; caption: string; label?: string;
}) {
  const summary = label ?? `${me} ${ai} answers: ${reply} The note ${title} shows ${lines.filter((l) => l.by).map((l) => l.text).join(", ")} added by ${ai}.`;
  return (
    <figure className={s.moment}>
      <div className={s.stage} role="img" aria-label={summary}>
        <div className={s.chat} aria-hidden="true">
          <p className={s.me}>{me}</p>
          <p className={s.ai}><span><AIGlyph name={glyph} size={12} />{ai}</span>{reply}</p>
        </div>
        <div className={s.note} aria-hidden="true">
          <p className={s.title}>{title}</p>
          <ul className={s.lines} data-kind={kind}>
            {lines.map((l) => (
              <li key={l.text} data-by={l.by || undefined} data-done={l.done || undefined}>
                {kind === "check" && <i />}{kind === "bullet" && <b />}<span>{l.text}</span>
                {l.by && <em><AIGlyph name={glyph} size={8} />{ai}</em>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption className={s.caption}>{caption}</figcaption>
    </figure>
  );
}
