import c from "./close.module.css";

// Round 23: the close is one short sheet on the desk. "Pinto Notes is free.", the download, what it
// needs, then what a careful person checks before installing, in round 19's short lines, and the study
// once on the page, as a small labelled comparison. Each line is checked:
// - Syncs Mac and iPhone, works offline: web/app/help/questions.ts ("Does it work offline?": your
//   notes are on your device too; edits sync when you're back online).
// - Encrypted, stored in the EU: /privacy-security (encrypted on your device before they're uploaded;
//   stored at Supabase in Frankfurt, Germany).
// - Brings over your Apple Notes: the Mac reads them straight from Notes (Pane/Views/ImportSources.swift).
// - Open source: /privacy-security ("The apps, the server and this website are open source").
// - The study (/blog/ai-memory-with-notes): Claude Haiku 5.5 on LoCoMo, 1,540 questions about months of
//   earlier chats, asked in a new chat: 18% right with nothing else, 82.5% with Pinto Notes connected
//   (memory there: the notes the AI wrote after each chat and could look up in the next one).
//   The bars are those two numbers to scale.

export const GITHUB = "https://github.com/pinto-notes/pinto-notes";

/** The four lines a careful person checks, in plain words. */
export function Trust() {
  return (
    <ul className={c.trust}>
      <li>Syncs your Mac and iPhone. Works offline.</li>
      <li>Encrypted, and stored in the EU.</li>
      <li>Brings over your Apple Notes.</li>
      <li>Open source. <a href={GITHUB} target="_blank" rel="noopener noreferrer">Check the code</a></li>
    </ul>
  );
}

const STUDY = [
  { who: "Answered right in a new chat", v: 18, shown: "18%" },
  { who: "With Pinto Notes connected", v: 82.5, shown: "82.5%", pinto: true },
] as const;

/** The study, once, before the invitation (round 25: compact, and scoped to its conditions, as the
 *  study states them): which model, how many questions, about what, asked where; then the two results,
 *  both numbers in ink, the bars to scale carrying the difference; the benchmark and the link. */
export function Study() {
  return (
    <figure className={c.study}>
      <figcaption className={c.why}>In our test, Claude Haiku 5.5 answered 1,540 questions about months of earlier chats, each in a new chat. With Pinto Notes connected, it could read the notes it saved after each chat.</figcaption>
      <dl className={c.bars}>
        {STUDY.map((r) => (
          <div key={r.who} className={c.row} data-pinto={"pinto" in r || undefined} style={{ "--v": r.v / 100 } as React.CSSProperties}>
            <dt>{r.who}</dt>
            <dd><b>{r.shown}</b><i aria-hidden="true" /></dd>
          </div>
        ))}
      </dl>
      <p className={c.studyFoot}>LoCoMo benchmark. <a href="/blog/ai-memory-with-notes">Read the study</a></p>
    </figure>
  );
}
