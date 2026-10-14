import CopyButton from "./CopyButton";
import PromptCopy from "./PromptCopy";
import s from "./templates.module.css";

type Variant = { name: string; prompt: string };

/// The full prompt, folded away behind "Show the prompt": in the page for search and for anyone who
/// wants to read exactly what their AI is told.
export function FullPrompt({ variants }: { variants: Variant[] }) {
  return (
    <details className={s.full}>
      <summary className={s.fullToggle}>Show the prompt<Chevron /></summary>
      <div className={s.fullBody}>
        {variants.map((v) => (
          <div key={v.name} className={s.fullVariant}>
            {variants.length > 1 && <p className={s.fullFor}>For {v.name}</p>}
            <p className={s.promptText}>{highlight(v.prompt.slice(0, v.prompt.indexOf("```")).trimEnd())}</p>
            <pre className={s.promptMd} aria-label="The note's markdown, part of the prompt">{v.prompt.slice(v.prompt.indexOf("```"))}</pre>
          </div>
        ))}
      </div>
    </details>
  );
}

/// What to say to your AI once it keeps the note: the template's example asks, as chat bubbles.
export function AskBubbles({ asks, label = "Ask your AI" }: { asks: string[]; label?: string }) {
  return (
    <div className={s.asks}>
      <p className={s.asksLabel}>{label}</p>
      <ul>{asks.slice(0, 3).map((a) => <li key={a}>{a}</li>)}</ul>
    </div>
  );
}

/// On a template with an app, the prompt is the second way in: one quiet line under Use, for people
/// who only use ChatGPT or Claude, and the full text folded away under it.
export function PromptLine({ variants }: { variants: Variant[] }) {
  return (
    <div className={s.promptLine} id="prompt">
      <p className={s.promptAsk}>
        Only using ChatGPT or Claude?{" "}
        <CopyButton text={variants[0].prompt} label="Copy the prompt" className={s.inlineCopy} event="copy_prompt_clicked" />
      </p>
      <FullPrompt variants={variants} />
    </div>
  );
}

/// On a template without an app, the prompt is the way in, said in one line: the copy button, what to
/// say afterwards, and the full text folded away. No card around it.
export default function Instructions({ title, folder, variants, asks }: { title: string; folder: string; variants: Variant[]; asks: string[] }) {
  return (
    <section className={s.promptCompact} id="prompt" aria-label="The prompt">
      <p className={s.promptOne}>
        Paste the prompt once into ChatGPT, Claude or Claude Code. It makes the <b>&ldquo;{title}&rdquo;</b> note in your {folder} folder, then keeps it.
      </p>
      <PromptCopy variants={variants} className={s.secondary} />
      <AskBubbles asks={asks} label="Then just talk to it" />
      <FullPrompt variants={variants} />
    </section>
  );
}

const Chevron = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>;

/// Tool names in the prompt stand out, so it's clear which Pinto Notes tool does what.
function highlight(text: string) {
  return text.split(/(\b[a-z]+(?:_[a-z]+)+\b)/g).map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));
}
