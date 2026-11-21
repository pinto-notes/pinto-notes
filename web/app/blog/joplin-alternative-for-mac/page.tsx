import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("joplin-alternative-for-mac", {
  title: "Joplin Notes alternative for Mac and iPhone",
});

// Written 21 November 2026 for "joplin notes alternative", row 8 of topic-research-2026-11-23.md.
// Google autocomplete rechecked live today, client=firefox, hl=en-US, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=joplin%20alternative
// Returned: joplin alternative, joplin alternative school, joplin alternative open source,
// joplin alternative reddit, joplin alternative free, joplin alternative client,
// joplin alternatives linux, joplin self hosted alternative, joplin notes alternative,
// best joplin alternative. School results are ambiguous; Windows/Linux/Android needs exclude Pinto.
// The research describes established comparison pages, not an uncontested search result page.
// Models read: evernote-alternative, bear-notes-alternative-free, best-notes-app-for-mac,
// move-apple-notes-to-obsidian-notion-keep, import-your-notes, recover-deleted-apple-notes;
// also the recipe, meeting, Cornell, budget, meal, code-block, font and AI workflow models in the briefs.
// Maker pages read live 21 November 2026:
// https://joplinapp.org/help/install/ (Mac, iOS, Windows, Linux, Android).
// https://joplinapp.org/help/apps/sync/ (choice of sync services, including WebDAV and Nextcloud).
// https://joplinapp.org/help/apps/plugins/ (plugins extend Joplin).
// https://joplinapp.org/help/apps/rich_text_editor/ (Markdown and Rich Text editors).
// https://joplinapp.org/help/apps/import_export/ (JEX backup, metadata, reimport into Joplin).
// https://joplinapp.org/help/dev/spec/interop_with_frontmatter/ (Markdown export with title,
// created/updated dates and tags in YAML; its supported metadata is not a Pinto fidelity promise).
// https://raw.githubusercontent.com/laurent22/joplin/dev/packages/lib/services/interop/InteropService.ts
// (Markdown + Front Matter export targets a directory; no unverified desktop menu path given).
// https://joplinapp.org/help/apps/ai_mcp/ (local MCP on Web Clipper, note search/read/create/update).
// No prices or Apple Notes instructions used. No claim that Joplin lacks AI access.
// Pinto sources opened in this worktree:
// BRIEF.md: Apple Notes look/behavior, free Mac download, connected ChatGPT/Claude read/edit,
// every earlier version kept. BRIEF-compare.md: Mac/iPhone only, no Windows, Linux, Android or web app.
// README.md:15-26, 35-61 confirms platforms, history and the hosted MCP connection.
// app/blog/connect-chatgpt-to-your-notes/page.tsx verified header: one Allow grants read/edit access.
// app/blog/import-your-notes/page.tsx: "a folder or .zip of Markdown or text files. Each folder
// becomes a folder." This is the Joplin route, not a native JEX importer.
// ../Pane/Model/MarkdownImport.swift:6-10 names Joplin; MarkdownNote.parse reads title/dates/tags;
// add imports relative attachments and appends tags to the body. Import does not write source files.
// ../Pane/Views/ImportSheet.swift: Import Markdown or Text, choose a folder or .zip, source unchanged.
// ../PaneTests/Fixtures/Markdown/Joplin/Work/Meeting notes.md and Personal/Garden.md inspected;
// ../PaneTests/MarkdownImportTests.swift:joplinWithFrontMatterAndResources asserts folders, dates,
// tag text and the linked image. Existing fixture/assertion inspection only, not a fresh Joplin export
// or a running-app migration test. No complete link, plugin, task, sync or history transfer promised.
// Pictures: none. Body links and inbound source have draft: false in lib/posts.ts, checked today.

const IMPORT_CHECK = `Joplin to Pinto Notes check
- [ ] Compare the number of notes in the sample notebook
- [ ] Read a long note beside its Joplin original
- [ ] Open an attached picture and a file
- [ ] Follow a link between two imported notes
- [ ] Check a table and a checklist
- [ ] Check the title, dates and tag text
- [ ] Keep the JEX backup and the Markdown export`;

const FAQ = [
  { q: "Can Pinto Notes import a Joplin JEX backup?", a: [
    "Use a folder or .zip of Markdown or text files for Pinto Notes. A native JEX import is not supported by this route. Keep your JEX file as a backup you can reimport into Joplin, and make a separate Markdown export for the move.",
  ] },
  { q: "What Joplin export should I use for Pinto Notes?", a: [
    "Try Markdown + Front Matter. Joplin documents title, dates and tags in that format. Pinto's Markdown importer reads those fields, with tags added as text in the note. Keep the exported attachments with the Markdown files and check a small notebook first.",
  ] },
  { q: "Can I keep using Joplin on Linux after switching to Pinto?", a: [
    "You can keep Joplin, but this import does not connect the two apps. Pinto Notes runs on Mac and iPhone only, with no Linux, Windows, Android or web app. Stay with Joplin if you need one library across those devices.",
  ] },
  { q: "Do I need to leave Joplin to connect Claude to my notes?", a: [
    "No. Joplin documents an MCP server that runs through its local Web Clipper service. It lets connected AI apps search and read notes, and create or update them when the relevant tools are enabled. Try that if AI access is your only reason to switch.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="joplin-alternative-for-mac"
      intro={<>Pinto Notes is a Joplin alternative for Mac and iPhone if you want an editor that looks and works like Apple Notes. Stay with Joplin if you need Windows, Linux or Android.</>}
      answer={
        <Answer jump={[
          { href: "#choose", label: "Compare the fit" },
          { href: "#keep-joplin", label: "Reasons to stay" },
          { href: "#export", label: "Export and import" },
          { href: "#check", label: "Check your notes" },
          { href: "#pinto-notes", label: "Use your AI" },
        ]}>
          <p>
            Try Pinto Notes if your notes live on a Mac and iPhone and you prefer Apple Notes&apos; editing style.
            Bring a small Joplin notebook over as Markdown first, and keep a separate JEX backup for Joplin.
            Both apps can give an AI access to notes, so compare the editor and connection that suit you.
          </p>
          <PostCta slug="joplin-alternative-for-mac" position="answer" title="Try a Joplin notebook in Pinto Notes">
            <p>Download Pinto Notes free on your Mac and import a folder of Markdown notes. Connect ChatGPT or Claude when you want it to read and edit them.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="choose">Choose by the devices and editor you use</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">You need</th><th scope="col">Joplin</th><th scope="col">Pinto Notes</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Mac and iPhone</th><td>Available on both</td><td>Available on both</td></tr>
            <tr><th scope="row">Windows, Linux or Android</th><td>Available on all three</td><td>No app for these platforms</td></tr>
            <tr><th scope="row">Editing</th><td>Markdown and Rich Text editors</td><td>Looks and works like Apple Notes</td></tr>
            <tr><th scope="row">An AI working in your notes</th><td>Local MCP through Web Clipper</td><td>Hosted connection for ChatGPT or Claude</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Joplin lists its platforms in the <a href="https://joplinapp.org/help/install/" rel="noopener">installation guide</a>.
        Pinto Notes is Mac and iPhone only. It has no Windows, Linux, Android or web app.
        A Mac at home does not make it a replacement for Joplin on an Android phone or a Windows work computer.
      </p>

      <h2 id="keep-joplin">Reasons to stay with Joplin</h2>
      <p>
        Joplin has both <a href="https://joplinapp.org/help/apps/rich_text_editor/" rel="noopener">Markdown and Rich Text editors</a>.
        Try Rich Text if seeing Markdown symbols is your main complaint. You may prefer it without moving your notes.
      </p>
      <p>
        Keep Joplin if choosing your own sync service matters. Its <a href="https://joplinapp.org/help/apps/sync/" rel="noopener">sync guide</a>{" "}
        lists options including Nextcloud, WebDAV and Dropbox. A Markdown import into Pinto does not transfer that setup.
        If you rely on <a href="https://joplinapp.org/help/apps/plugins/" rel="noopener">Joplin plugins</a>, check what each
        one does for you before moving. Importing its notes does not bring the plugin with them.
      </p>
      <p>
        Joplin also has an <a href="https://joplinapp.org/help/apps/ai_mcp/" rel="noopener">MCP server for AI apps</a>.
        It runs through the local Web Clipper service and supports searching, reading and, when enabled, creating or updating notes.
        If you like Joplin and only want Claude to use your notes, try that connection first.
      </p>

      <h2 id="export">Export Markdown for Pinto, keep JEX for Joplin</h2>
      <p>
        Joplin&apos;s <a href="https://joplinapp.org/help/apps/import_export/" rel="noopener">export guide</a> describes
        JEX as a backup format that preserves notes and metadata for reimport into Joplin.
        Keep one before you start. Pinto&apos;s route uses Markdown files, so make a separate export for it.
      </p>
      <Steps>
        <li>
          Export a small notebook from Joplin as Markdown + Front Matter into its own folder.
          Include notes with the attachments and formatting you use most.
        </li>
        <li>
          Keep the whole exported folder together, including its resource files.
          Open a Markdown file in a text editor to check that the note text is there.
        </li>
        <li>
          On your Mac, open Pinto Notes and choose File, Import Markdown or Text.
          Choose the exported folder, or a .zip of it, and review the import before continuing.
        </li>
      </Steps>
      <p>
        Joplin&apos;s <a href="https://joplinapp.org/help/dev/spec/interop_with_frontmatter/" rel="noopener">front matter guide</a>{" "}
        explains the title, dates and tags stored above the note text. Pinto&apos;s importer reads these fields and adds tags
        as text in the note. Check their appearance in your sample before relying on them.
      </p>
      <p>
        The route in <a href="/blog/import-your-notes">Import your notes</a> is a folder or .zip of Markdown or text files.
        Each folder becomes a folder. Pinto imports linked pictures and files that it can find in the export.
        Your source files stay unchanged. A JEX backup is a separate format, and this route does not import it.
      </p>

      <h2 id="check">Check the parts of your notebook you rely on</h2>
      <p>
        Compare the imported copies with Joplin before moving another notebook.
        Open a linked note and an attachment, rather than judging the import only by its note count.
        Use this checklist while both apps are available.
      </p>
      <Keep title="Check your Joplin import" text={IMPORT_CHECK}
        note="This is a checklist to copy, not a report that your own export has passed." />
      <p>
        Keep Joplin&apos;s settings and earlier note versions separate from the move.
        The Markdown route does not promise to transfer plugin behavior or Joplin to-do alarms.
        If a link or attachment fails in your sample, sort that out before importing the rest.
      </p>

      <h2 id="pinto-notes">Work with the imported notes in Pinto</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and keeps every earlier version of a note.
        That history covers changes in Pinto. It does not recover versions you left in Joplin.
      </p>
      <p>
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a> and choose Allow,
        it can read and edit your notes. Pinto uses a hosted connection; Joplin&apos;s documented MCP connection runs locally.
        Ask your connected AI to find an imported project note, list the unfinished work and show which lines it used.
        Check its answer against the note before asking it to add a next step.
      </p>
      <p>
        Start with the notebook you use this week. Write in the imported copies for a few days and check them on your iPhone.
        Move the rest when the editor and your sample notes meet your needs, with the original export kept as a backup.
      </p>
    </PostPage>
  );
}
