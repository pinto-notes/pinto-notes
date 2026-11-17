import { AIGlyph } from "@/lib/ai-glyphs";
import c from "./collab.module.css";

// Round 23, `?collab=1` only (collaboration ships in 1.4): the sharing chapter's picture. Only what the
// app shows, from its code:
// - Who's in the note: the Mac toolbar puts the avatars of everyone else in the note between the
//   writing tools and Share and More (NoteDetailView.swift, NoteToolbarParts). An avatar is a solid
//   circle with the person's initials in white on their colour, inside a 2 pt white ring; no badge on
//   the Mac (Collab/PresenceViews.swift). Sara's colour is one of the people colours (CollabSession.palette).
// - Where they are: their caret, 2 pt in their colour, with their first name on a small flag above it,
//   11 pt semibold white, 4 pt corners (MarkdownEditor.swift, CollabSession.RemoteCaret).
// - A shared note in the list: the person-with-a-checkmark mark before its title (NoteRowStatus.swift).
// - Whose AI changed a note: the list's line in place of the preview, in the app's amber ink with the
//   AI's mark, until you open it: "Edited by Sara's Claude" (someone else's AI is named with them),
//   "Edited by ChatGPT" (AIEdit.listLine). The app marks a note by the last AI that changed it, so each
//   wording is on its own note here, never on a line.
// On a phone: the note as the iPhone app shows it (the avatar in its bar), and the list's two rows on a
// card laid over its foot, as Your AI lays the note over the chat.

const SARA = "#7a6f3a";

const I = {
  side: <svg viewBox="0 0 20 16"><rect x="1.5" y="1.5" width="17" height="13" rx="3" /><path d="M7.5 1.5v13" /></svg>,
  search: <svg viewBox="0 0 18 18"><circle cx="7.6" cy="7.6" r="5.6" /><path d="M11.8 11.8 16 16" /></svg>,
  back: <svg viewBox="0 0 10 16"><path d="M7.5 2 1.8 8l5.7 6" /></svg>,
  fwd: <svg viewBox="0 0 10 16"><path d="M2.5 2l5.7 6-5.7 6" /></svg>,
  check: <svg viewBox="0 0 22 18"><circle cx="4" cy="5" r="2.4" /><path d="M9 5h11M9 13h11" /><circle cx="4" cy="13" r="2.4" /></svg>,
  table: <svg viewBox="0 0 20 18"><rect x="2" y="2.5" width="16" height="13" rx="2" /><path d="M2 7.2h16M2 11.4h16M7.4 2.5v13" /></svg>,
  clip: <svg viewBox="0 0 20 20"><path d="m15.6 9.4-5.8 5.8a3.6 3.6 0 0 1-5.1-5.1l6.4-6.4a2.4 2.4 0 0 1 3.4 3.4L8.3 13.3a1.2 1.2 0 0 1-1.7-1.7l5.6-5.6" /></svg>,
  share: <svg viewBox="0 0 18 20"><path d="M9 12.4V1.8M5.6 5 9 1.6 12.4 5M6.2 7.6H4.4a1.6 1.6 0 0 0-1.6 1.6v7.4a1.6 1.6 0 0 0 1.6 1.6h9.2a1.6 1.6 0 0 0 1.6-1.6V9.2a1.6 1.6 0 0 0-1.6-1.6h-1.8" /></svg>,
  more: <svg viewBox="0 0 20 6" className={c.fill}><circle cx="3" cy="3" r="1.6" /><circle cx="10" cy="3" r="1.6" /><circle cx="17" cy="3" r="1.6" /></svg>,
  // SF Symbols person.crop.circle.badge.checkmark, drawn plain.
  shared: <svg viewBox="0 0 20 18"><circle cx="8" cy="9" r="6.6" /><circle cx="8" cy="7.2" r="2.3" /><path d="M3.6 13.8c1-1.6 2.6-2.4 4.4-2.4s3.4.8 4.4 2.4" /><circle cx="15.2" cy="13.6" r="3.6" className={c.badgeBg} /><path d="m13.6 13.6 1.1 1.1 2.1-2.2" /></svg>,
};

/** Sara's avatar: her initials on her colour, in the white ring. */
const Avatar = () => <span className={c.avatar} style={{ background: SARA }} aria-label="Sara Lind is in this note">SL</span>;

/** A row of the notes list, as the Mac and iPhone write it. `ai`: the AI line in place of the preview. */
type Row = { title: string; when: string; first?: string; ai?: { glyph: "claude" | "openai"; says: string }; shared?: boolean; on?: boolean };
const ROWS: Row[] = [
  { title: "Launch plan", when: "9:41 AM", first: "Ship in February. Demo on the 12th.", shared: true, on: true },
  { title: "Reading group", when: "9:20 AM", ai: { glyph: "claude", says: "Edited by Sara's Claude" }, shared: true },
  { title: "This week", when: "Yesterday", ai: { glyph: "openai", says: "Edited by ChatGPT" } },
  { title: "Studio North", when: "Monday", first: "Decided: wait until March." },
];

function Rows({ rows }: { rows: Row[] }) {
  return (
    <ul className={c.rows}>
      {rows.map((r) => (
        <li key={r.title} data-on={r.on || undefined}>
          <b>{r.shared && <span className={c.sharedMark} aria-label="Shared">{I.shared}</span>}{r.title}</b>
          <span className={c.line}>
            {r.when}<span className={c.dot}>·</span>
            {r.ai
              ? <span className={c.ai}><AIGlyph name={r.ai.glyph} size={12} color={r.ai.glyph === "claude" ? "#d97757" : "#1d1b19"} />{r.ai.says}</span>
              : <span className={c.first}>{r.first}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The shared note, with Sara's caret on the line she's writing. */
function LaunchNote() {
  return (
    <div className={c.note}>
      <h3 className={c.title}>Launch plan</h3>
      <p className={c.p}>Ship in February. Demo on the 12th.</p>
      <ul className={c.checks}>
        <li data-done><i /><span>Book the room for the demo</span></li>
        <li><i /><span>Draft the press note</span></li>
        <li><i /><span>Send Ana the demo link<span className={c.caret} style={{ "--who": SARA } as React.CSSProperties}><b>Sara</b></span></span></li>
      </ul>
    </div>
  );
}

export function CollabPicture() {
  return (
    <>
      <div className={c.mac} role="group" aria-label="Pinto Notes on a Mac: the Launch plan note, shared with Sara, who is in it and writing a line. In the list, the Reading group note is marked Edited by Sara's Claude, and This week is marked Edited by ChatGPT.">
        <div className={c.bar} aria-hidden="true">
          <span className={c.lights}><i /><i /><i /></span>
          <span className={c.listBar}><span className={c.ico}>{I.side}</span><span className={c.ico}>{I.search}</span><span className={c.pill}>All Notes</span></span>
          <span className={c.noteBar}>
            <span className={c.ico}>{I.back}</span><span className={`${c.ico} ${c.dim}`}>{I.fwd}</span>
            <span className={c.right}>
              <span className={c.cap}><b>Aa</b><span className={c.ico}>{I.check}</span><span className={c.ico}>{I.table}</span><span className={c.ico}>{I.clip}</span></span>
              <Avatar />
              <span className={c.cap}><span className={c.ico}>{I.share}</span><span className={c.ico}>{I.more}</span></span>
            </span>
          </span>
        </div>
        <nav className={c.list} aria-hidden="true"><Rows rows={ROWS} /></nav>
        <LaunchNote />
      </div>
      <div className={c.small}>
        <div className={c.phoneNote} role="group" aria-label="Pinto Notes on an iPhone: the Launch plan note, shared with Sara, who is writing a line.">
          <p className={c.pBar} aria-hidden="true"><span className={c.pBack}>{I.back}Notes</span><Avatar /><span className={c.pMore}>{I.more}</span></p>
          <LaunchNote />
        </div>
        <div className={c.phoneList} role="group" aria-label="The notes list: Reading group, Edited by Sara's Claude; This week, Edited by ChatGPT.">
          <Rows rows={ROWS.slice(1, 3)} />
        </div>
      </div>
    </>
  );
}
