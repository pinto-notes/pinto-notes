import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("simplenote-alternative-for-iphone-and-mac", {
  title: "Simplenote alternative for iPhone and Mac",
});

// Written 21 November 2026 for "simplenote alternative", research row 5 in topic-research-2026-11-22.md.
// Google autocomplete read live today through https://suggestqueries.google.com/complete/search
// with client=firefox, hl=en, gl=us. Head suggestions: simplenote alternatives, simplenote alternative free,
// simplenote alternative reddit, best simplenote alternative, apps like simplenote, alternative to simple,
// noteflight alternatives. The last two are irrelevant. "simplenote alternative iphone" and
// "simplenote alternative mac" returned none. "simplenote alternative free" returned itself and
// apps like simplenote. "apps like simplenote" returned itself, apps like notability that are free,
// app similar to notes. Broad suggestions are not evidence of demand for the device-specific phrase.
// Models read: evernote-alternative, notes-in-claude-code-and-codex, import-your-notes and recipe template.
// Official Simplenote pages read 21 November 2026: https://simplenote.com/ for platforms, tags,
// search, Markdown, sharing, publishing and previous versions; https://simplenote.com/help/#export
// for web Settings, Tools, Export Notes, ZIP export, Electron export and the Mac App Store exception;
// https://simplenote.com/help/#offline for offline use after sign-in and downloading notes.
// Maker's export source read today: https://github.com/Automattic/simplenote-electron/blob/trunk/lib/utils/export/to-zip.ts
// and lib/utils/export/README.md, export-notes.ts in the same repo. ZIP contains individual .txt files
// and source/notes.json; tags appended as text; current note objects, not a version-history archive.
// Pinto sources opened: BRIEF.md for Apple Notes feel, free Mac download, connected AI read/edit and history;
// BRIEF-compare.md for Markdown files and iPhone/Mac only; web/app/blog/import-your-notes/page.tsx
// for the exact folder/ZIP wording, File menu and unchanged source app; Pane/Model/MarkdownImport.swift
// for accepted text/Markdown extensions, folder/ZIP handling and no JSON note extension;
// README.md and Pane/Model/NoteHistory.swift for versions and restoring without discarding current text.
// No native Simplenote account import or tag/history migration promised. No migration sample was run.
// Picture reused from import-your-notes: /blog/launch/import-file-menu. No new screenshot.

const CHECK = `Simplenote move check

- Keep the original ZIP backup.
- Open the exported text files and check a long note.
- Import a small folder into Pinto Notes on a Mac.
- Compare the full text and any Markdown formatting.
- Check whether the old tag names need reorganising.
- Open the imported notes on iPhone.
- Keep Simplenote available until the checks are done.
`;

const FAQ = [
  { q: "Is there a free Simplenote alternative for iPhone and Mac?", a: [
    "Pinto Notes is a free option for iPhone and Mac. It looks and works like Apple Notes, accepts folders of text or Markdown files on a Mac, and lets connected ChatGPT or Claude read and edit your notes.",
  ] },
  { q: "Why can't I export from the Mac App Store version of Simplenote?", a: [
    "Simplenote's help says that version doesn't support export. Use the web app's Settings, Tools, Export Notes, or the Electron desktop app's File, Export Notes.",
  ] },
  { q: "Will my Simplenote tags and old versions move into Pinto Notes?", a: [
    "This guide imports text files. It doesn't promise to recreate Simplenote's tag organisation or old versions. Keep the original backup and check the imported notes before switching. Pinto keeps the versions you make there.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="simplenote-alternative-for-iphone-and-mac"
      intro={<>Pinto Notes is a Simplenote alternative for iPhone and Mac if you want Apple Notes&apos; layout and connected AI access. Export from Simplenote, then import the text files into Pinto on your Mac.</>}
      answer={
        <Answer jump={[
          { href: "#choose", label: "Should you switch?" },
          { href: "#export", label: "Export your notes" },
          { href: "#import", label: "Import into Pinto" },
          { href: "#check", label: "Check the move" },
        ]}>
          <p>
            Choose Pinto Notes if you use iPhone and Mac and want ChatGPT or Claude to read and edit your notes once connected.
            Simplenote is still a useful choice for text notes across Windows, Linux, Android and the web too.
            The move described here uses exported text files; it does not recreate your old version history.
          </p>
          <PostCta slug="simplenote-alternative-for-iphone-and-mac" position="answer" title="Bring your text notes to Pinto Notes.">
            <p>Pinto Notes looks and works like Apple Notes. Import your text files on a Mac, then connect ChatGPT or Claude to work with them.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain"
        alt="Pinto Notes' File menu on a Mac, including Import Markdown or Text."
        caption="Choose Import Markdown or Text for exported text files. Screenshot: Pinto Notes on a Mac." />}
      faq={FAQ}
    >
      <h2 id="choose">What do you want to change about Simplenote?</h2>
      <p>
        Simplenote has tags and search, Markdown support, shared notes and web publishing. It also keeps previous versions.
        Those are real strengths for a text notebook. If your notes already do what you need, switching is optional.
        See <a href="https://simplenote.com/">Simplenote&apos;s own overview</a>.
      </p>
      <p>
        Pinto makes sense when you want a notes app that looks and works like Apple Notes, with AI access to the notes you keep.
        You can keep writing notes yourself. Connect an AI when you have a job for it, such as reading a project note
        and adding the decision from your conversation.
      </p>
      <p>
        Pinto Notes is for iPhone and Mac. There is no Windows, Android or web app.
        If you need to open the same notebook on one of those, Simplenote has broader device support.
        Simplenote also supports offline editing after you have signed in and downloaded your notes.
      </p>

      <h2 id="export">Export from Simplenote in a browser</h2>
      <ol>
        <li>Sign in to <a href="https://app.simplenote.com/">Simplenote&apos;s web app</a>.</li>
        <li>Open the menu at the top left, then Settings.</li>
        <li>Choose Tools, then Export Notes. Save the ZIP.</li>
      </ol>
      <p>
        You can also use File, Export Notes in Simplenote&apos;s Electron desktop app.
        Its Mac App Store app does not support export, according to the{" "}
        <a href="https://simplenote.com/help/#export">official export instructions</a>.
        If you cannot find that command on your Mac, use the browser route above.
      </p>
      <p>
        Simplenote&apos;s <a href="https://github.com/Automattic/simplenote-electron/blob/trunk/lib/utils/export/README.md">export documentation</a>{" "}
        describes a ZIP with a separate file for each note. Its export code writes text files and a JSON backup.
        Keep the ZIP intact as your backup, and unpack a copy to inspect the text files before importing.
      </p>

      <h2 id="import">Import the text files into Pinto on a Mac</h2>
      <p>
        Open Pinto Notes on your Mac and choose Import Markdown or Text in the File menu, shown above.
        The supported route is <q>a folder or .zip of Markdown or text files. Each folder becomes a folder.</q>{" "}
        The <a href="/blog/import-your-notes">import guide</a> covers this route. Your old app stays as it is.
      </p>
      <p>
        For a first check, copy a few exported text files into a separate folder and import that folder.
        Include a long note and one with Markdown, if you use it. Compare them with the originals before bringing in the rest.
        Use the individual text files for this route. Pinto&apos;s Markdown and text importer does not treat the JSON backup as notes.
      </p>
      <p>
        This is a file import. You do not connect a Simplenote account to Pinto.
        Do not expect a text-file move to recreate every tag or old version.
        Simplenote&apos;s export code appends tag names to the text, but that is not a promise that they become Pinto tags.
        Check the result if you rely on tags to find your notes.
      </p>

      <h2 id="check">Check the move before you stop using Simplenote</h2>
      <Keep title="A checklist for the move" text={CHECK}
        note="Keep this with your export so you can record what you have checked." />
      <p>
        Open an imported note on your iPhone as well as your Mac. Compare its full text, especially anything below
        a long list or a code block. Check any links you depend on. A readable title alone does not show whether
        the rest of a note came across as you expected.
      </p>

      <h2 id="pinto-notes">Let an AI work with the notes you brought over</h2>
      <p>
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, it can read and edit your Pinto notes.
        You could ask it to read an imported project note, list the unanswered questions, then add a decision you have just made.
        Name the note and the change you want so you can check the result against the original.
      </p>
      <p>
        Pinto keeps every earlier version of a note. That history covers changes you make in Pinto;
        it does not bring Simplenote&apos;s earlier versions with your text files.
        The <a href="/blog/apple-notes-version-history">version history guide</a> explains why keeping earlier text matters
        when you or an AI edits a note.
      </p>
    </PostPage>
  );
}
