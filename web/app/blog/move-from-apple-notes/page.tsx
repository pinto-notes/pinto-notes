import { PostPage, postMetadata } from "@/lib/PostPage";
import { APP_STORE_LIVE } from "@/lib/site";

export const dynamic = "force-static";
export const metadata = postMetadata("move-from-apple-notes");

// Updated on 12 October 2026 for Mac 1.2.6, against Pane/Views/AppleNotesImport.swift and
// Pane/Model/AppleNotesImporter.swift on main: every note of every folder is listed and picked, folders are always
// kept, pictures come along as files, checklists and pins need Full Disk Access (never asked for), locked notes are
// listed as Locked in Apple Notes, Recently Deleted isn't read, and notes already here are skipped.

const FAQ = [
  { q: "Does importing change or delete anything in Apple Notes?", a: [
    "No. The import only reads Apple Notes. Your notes there stay exactly as they were, so you can keep using both.",
  ] },
  { q: "Can I import again later without getting duplicates?", a: [
    "Yes. Notes that are already in Pinto Notes, by title and date, are marked Already imported and skipped, so importing again brings only what's missing.",
  ] },
  { q: "Can I export Apple Notes as markdown instead?", a: [
    "On macOS 26, Apple Notes can export a note as markdown from the File menu, one note at a time. Pinto Notes imports everything you pick in one go, and keeps your notes as markdown from then on.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="move-from-apple-notes"
      intro={<>I built Pinto Notes to feel like Apple Notes, so moving should be easy too. On your Mac, you bring every note over in one go, folders included. Nothing in Apple Notes changes, so you can take your time.</>}
      faq={FAQ}
    >
      <h2>Before you start</h2>
      <ul>
        <li>A Mac with macOS 26 or later, and your notes in the Notes app on it.</li>
        <li>Pinto Notes, free from the <a href="/download">download page</a>. Open it and sign in, so your notes sync.</li>
      </ul>

      <h2>Import everything on your Mac</h2>
      <ol>
        <li>In Pinto Notes, choose File, then Import from Apple Notes.</li>
        <li>The first time, macOS asks whether Pinto Notes may control Notes. Choose Allow. That&apos;s how it reads your notes. If you chose Don&apos;t Allow by mistake, turn it on in System Settings, Privacy &amp; Security, Automation.</li>
        <li>Every note in every folder is listed and picked, with a total that matches Apple Notes. Import everything, or untick what you don&apos;t want. You can search the list.</li>
        <li>Choose Import. You can watch it count through your notes. If a note didn&apos;t come, the sheet stays open and names it, with the reason.</li>
      </ol>

      <h2>What comes along</h2>
      <ul>
        <li>Your notes, in their folders, with folders inside folders kept, and the day each note was written and last changed.</li>
        <li>Text formatting, lists, tables and empty lines as you wrote them.</li>
        <li>Pictures, as files in the note, where they were.</li>
        <li>Checklists with their ticks, and pins, when Pinto Notes has Full Disk Access. It never asks for it; without it, checklists arrive as bullet lists. The sheet&apos;s How to keep them explains where to turn it on.</li>
      </ul>
      <p>
        Other attachments, such as PDFs, stay in Apple Notes. So do locked notes, which the import can&apos;t read: they&apos;re listed as
        Locked in Apple Notes (unlock them first; if you&apos;ve lost the password, see <a href="/blog/forgot-apple-notes-password">forgot your
        Apple Notes password</a>). Recently Deleted isn&apos;t read. Your notes in Apple Notes stay exactly as they were, and importing again
        later brings only what isn&apos;t here yet.
      </p>

      <h2>On your iPhone</h2>
      {APP_STORE_LIVE ? (
        <p>
          Everything you import on your Mac shows up on your iPhone a second later, once you sign in there with the same account. To
          bring over a single note from your iPhone, open it in Apple Notes, tap Share and choose Pinto Notes.
        </p>
      ) : (
        <p>
          The iPhone app is coming soon to the App Store. Once it&apos;s out, sign in with the same account and everything you imported
          on your Mac is there. To bring over a single note from your iPhone, open it in Apple Notes, tap Share and choose Pinto Notes.
        </p>
      )}

      <h2>After the move</h2>
      <ul>
        <li>If you know Apple Notes, you already know Pinto Notes: folders, a note list by date, pins, search and Recently Deleted work the same way.</li>
        <li>Your notes are stored as markdown underneath, formatted on screen.</li>
        <li>Using Claude Cowork? <a href="/blog/claude-cowork-apple-notes">How to use Claude Cowork with Apple Notes</a> compares staying in Apple Notes with moving.</li>
        <li>Want ChatGPT or Claude to use them? <a href="/blog/connect-chatgpt-to-your-notes">Connect ChatGPT or Claude to your notes</a>. For a coding agent, see <a href="/blog/notes-in-claude-code-and-codex">using your notes from Claude Code and Codex</a>.</li>
        <li>Still deciding? <a href="/blog/pinto-notes-vs-apple-notes">Pinto Notes vs Apple Notes</a> covers what each one does better.</li>
        <li>Want a copy of your Apple Notes as files too? <a href="/blog/export-apple-notes-to-markdown">Export Apple Notes to Markdown</a> covers the built-in export and tools for every note at once.</li>
      </ul>
    </PostPage>
  );
}
