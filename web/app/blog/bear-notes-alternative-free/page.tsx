import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("bear-notes-alternative-free", {
  title: "Bear Notes alternative: free options for Mac and iPhone",
});

// Written 21 November 2026 for "bear notes alternative", row 1 of topic-research-2026-11-22.md.
// Live Google autocomplete checked 21 Nov 2026, client=firefox, hl=en, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=bear%20notes%20alternative
// Head returned: bear notes alternative, bear notes alternative reddit, bear notes alternative for windows,
// bear notes alternative android, best bear notes alternative, bear notes app alternative, is bear notes free,
// what is bear notes, bear app alternatives, bear can alternatives. Platform suggestions are outside Pinto's scope.
// "best bear notes alternative" returned itself, bear app alternatives, alternatives to goodnotes.
// "bear notes app alternative" returned itself, how to use bear notes app, bear notes vs apple notes.
// "bear notes alternative free" returned no suggestions. "free bear alternative" returned itself,
// alternatives to build a bear, free alternative to gimp. The broad free suggestion is ambiguous.
// "bear alternative" returned mostly ambiguous suggestions, plus bear alternative for windows/linux/reddit.
// Models read: evernote-alternative, apple-notes-vs-bear, notes-in-claude-code-and-codex;
// also import-your-notes and the recipe, meeting and Cornell template models from BRIEF.md.
// Maker pages read live 21 Nov 2026:
// https://bear.app/#pricing: free local notes, Markdown editor, tags, heading folding;
// iCloud sync and search inside images/PDFs need Pro. No numeric subscription prices used.
// https://bear.app/faq/export-your-notes/: free Markdown and TextBundle export, multiple-note selection,
// File, Export Notes; Keep tags during export. https://bear.app/faq/import-your-notes/: Markdown and
// TextBundle input; Markdown Folder imports referenced attachments. These are Bear's import features,
// not evidence for Pinto's import. Pinto's route comes from import-your-notes and the code below.
// https://bear.app/faq/command-line-interface/: Bear 2.8+ on Mac has a Claude desktop Connector,
// local MCP server and CLI for search/read/create/edit. AI access is not exclusive to Pinto.
// https://apps.apple.com/us/app/notes/id1110145109: free, folders, shared notes and iCloud sync.
// https://support.apple.com/guide/notes/not201900c07/mac: current macOS 27 guide, File, Import Markdown,
// optional Preserve folder structure on import. Read directly over HTTPS after web reader returned 429.
// Apple Notes sharing needs an Apple Account for each person: BRIEF.md, verified earlier in
// apple-notes-meeting-notes-template and apple-notes-vs-bear. No other Apple Notes facts used.
// Pinto: BRIEF.md supplies Apple Notes feel, free Mac download/iPhone app, connected ChatGPT/Claude
// reading/editing and every earlier version kept. README.md:15-26 confirms Mac/iPhone, free and history.
// BRIEF-compare.md supplies no Windows, Android or web app. import-your-notes supplies the Bear wording
// verbatim: "export your notes as Markdown with attachments, then choose the folder. Pictures come too."
// Pane/Model/MarkdownImport.swift:6-10, 177-186, 553-613 confirms Markdown/TextBundle input and attachments.
// Inspected PaneTests/Fixtures/Markdown/Bear export: Groceries.md, Recipe.md with Recipe/photo.png,
// Trip notes.textbundle/text.markdown with assets/map.png, and the corresponding bearExportWithATextBundle
// assertions in PaneTests/MarkdownImportTests.swift:302. Fixture/code inspection, not a fresh Bear export
// or a running-app migration test. No promise of complete tag, link, formatting or history preservation.
// Pictures: none. All three linked blog posts have draft: false in lib/posts.ts, checked 21 Nov 2026.

const IMPORT_CHECK = `Bear import check
- [ ] Compare the note text with Bear
- [ ] Open a picture in the imported copy
- [ ] Check a checklist and a table
- [ ] Follow a link to another note
- [ ] Check how tags appear
- [ ] Keep the original export while trying the new app`;

const FAQ = [
  { q: "Is Bear usable without paying for Pro?", a: [
    "Yes. Bear's free version gives you local notes and Markdown export. Sync with iCloud needs Bear Pro. If you write on one device and like Bear's editor, the free version may already cover what you need.",
  ] },
  { q: "Do I need a Bear subscription to export Markdown?", a: [
    "No. Bear lists Markdown and TextBundle among its free export formats. On a Mac, select the notes and choose File, Export Notes. You can try an import in another app before deciding whether to move the rest.",
  ] },
  { q: "Will switching to Pinto preserve every Bear feature?", a: [
    "No complete match is promised. Pinto's Bear route imports Markdown with attachments on a Mac, including pictures. Check your own notes after importing, especially tags and links. Bear's settings and earlier note versions are not promised to transfer.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="bear-notes-alternative-free"
      intro={<>Pinto Notes is a free Bear Notes alternative for iPhone and Mac, with a Bear import on a Mac. Apple Notes is another free option if you want folders and shared notes.</>}
      answer={
        <Answer jump={[
          { href: "#free-options", label: "Free options" },
          { href: "#keep-bear", label: "Reasons to keep Bear" },
          { href: "#export", label: "Export and import" },
          { href: "#check", label: "Check your notes" },
          { href: "#pinto-notes", label: "Pinto Notes" },
        ]}>
          <p>
            Choose Pinto Notes for an Apple Notes-style app that imports Bear exports and lets connected ChatGPT or Claude
            read and edit your notes. Choose Apple Notes for folders and shared iCloud notes. Bear itself is free for local
            writing, with Pro needed for iCloud sync.
          </p>
          <PostCta slug="bear-notes-alternative-free" position="answer" title="Try your Bear notes in Pinto Notes.">
            <p>Download Pinto Notes free on your Mac and import a small Bear export first. Once you connect ChatGPT or Claude, it can read and edit those notes.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="free-options">What the free options give you</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">App</th><th scope="col">Choose it for</th><th scope="col">Check before moving</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Bear Free</th><td>Local Markdown writing</td><td>Sync with iCloud needs Pro</td></tr>
            <tr><th scope="row">Apple Notes</th><td>Folders and shared notes</td><td>How your exported Markdown looks after import</td></tr>
            <tr><th scope="row">Pinto Notes</th><td>Apple Notes&apos; feel, with connected ChatGPT or Claude</td><td>It runs on iPhone and Mac only</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Apple lists <a href="https://apps.apple.com/us/app/notes/id1110145109" rel="noopener">Notes as free</a>,
        with iCloud sync and collaboration. Everyone sharing a note needs an Apple Account. For a fuller comparison of
        editing and organization, see <a href="/blog/apple-notes-vs-bear">Apple Notes vs Bear</a>.
      </p>
      <p>
        Pinto Notes has no Windows, Android or web app. If you need one of those, it won&apos;t replace Bear for you.
        If you use an iPhone and Mac, try the notes you use most before moving the rest.
      </p>

      <h2 id="keep-bear">Reasons to keep Bear</h2>
      <p>
        Bear has a Markdown editor with tags and heading folding. If those tools suit your writing and you only need local
        notes, you can stay on its free plan. Bear&apos;s <a href="https://bear.app/#pricing" rel="noopener">pricing page</a>,
        checked 21 November 2026, puts iCloud sync and search inside images and PDFs in Pro.
      </p>
      <p>
        Bear also has AI access. Its <a href="https://bear.app/faq/command-line-interface/" rel="noopener">official guide</a>
        documents a Claude desktop Connector, a local MCP server and a command-line tool in Bear 2.8 or later on a Mac.
        They can search, read, create and edit notes. Try that route if AI access is your only reason for leaving.
      </p>

      <h2 id="export">Export a few notes before moving the library</h2>
      <p>
        On a Mac, Command-click a few notes in Bear&apos;s note list, then choose File, Export Notes.
        Bear&apos;s <a href="https://bear.app/faq/export-your-notes/" rel="noopener">export guide</a> lists Markdown and
        TextBundle as free formats. Include a note with a picture so you can check attachments too.
      </p>
      <p>
        For Pinto Notes, export your notes as Markdown with attachments, then choose the folder. Pictures come too.
        On your Mac, open Pinto Notes&apos; File menu and choose Bear. Follow the steps to select your export folder,
        as shown in the <a href="/blog/import-your-notes">import guide</a>. Your old app stays as it is.
      </p>
      <p>
        Choosing Apple Notes instead? Apple&apos;s <a href="https://support.apple.com/guide/notes/not201900c07/mac" rel="noopener">current Mac guide</a>
        documents File, Import Markdown on macOS 27. Select the exported Markdown files or their folder.
        You can preserve the folder structure. Check the imported copies before exporting the whole library.
      </p>

      <h2 id="check">Check what matters in your own notes</h2>
      <p>
        Open the original and the imported copy side by side. A note&apos;s text can arrive while a link points somewhere
        unexpected. Use a short checklist to review the parts you rely on.
      </p>
      <Keep title="A check for your Bear import" text={IMPORT_CHECK} note="Keep this with your export while you try the new app." />
      <p>
        Bear&apos;s export settings include Keep tags during export. Check that option if you need the tag text, then
        check how the receiving app handles it. Keeping a tag in the text does not promise the same sidebar organization.
        Treat Bear&apos;s settings and earlier versions as separate from the exported note.
      </p>

      <h2 id="pinto-notes">Use the imported notes with your AI</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and keeps every earlier version of a note.
        That history is for your notes in Pinto. It is not a promise to import Bear&apos;s earlier versions.
      </p>
      <p>
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, it can read and edit your notes.
        Try asking it to find an imported project note and summarize the unfinished work. Then ask it to add a next step
        to that note. Open the note in Pinto Notes and check the result before using the same approach on other notes.
      </p>
    </PostPage>
  );
}
