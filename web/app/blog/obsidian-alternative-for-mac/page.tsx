import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("obsidian-alternative-for-mac", {
  title: "Obsidian alternative for Mac: choosing where to move",
});

// Written 21 November 2026 for "obsidian alternative for mac", research row 3 in
// topic-research-2026-11-22.md. Google autocomplete fetched live 21 Nov at 13:18 UTC:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=obsidian+alternative+for+mac
// Returned: "obsidian alternative for mac", "obsidian alternative macos", "alternative to obsidian",
// "obsidian alternative open source". Also queried "obsidian alternative", "alternative to obsidian",
// "obsidian alternative macos" and "obsidian alternative open source" at that endpoint.
// Relevant additional suggestions: "obsidian alternative with sync", "obsidian alternatives free",
// "obsidian alternative with free sync", "alternative to obsidian notes", "alternative to obsidian sync",
// "obsidian alternative open source self hosted", "obsidian alternative free open source".
// Models read: evernote-alternative, apple-notes-vs-bear and notes-in-claude-code-and-codex.
// Existing apple-notes-vs-obsidian and obsidian-mcp read to keep this about replacing a vault.
// Official pages read today, 21 Nov 2026, documentation checks rather than migration tests:
// https://obsidian.md/ (links, graph, Canvas and plugins, including Dataview queries);
// https://obsidian.md/help/data-storage (local Markdown vault, other editors, .obsidian settings).
// https://support.apple.com/guide/notes/not201900c07/mac (Markdown folder import, File, Import Markdown,
// Preserve folder structure on import; read directly over HTTPS after the web reader returned 429).
// Apple Notes folders, checklists and search also come from BRIEF.md's verified facts.
// https://bear.app/ (Markdown, tags, tables, Mac and iPhone; iCloud sync requires Pro);
// https://bear.app/faq/import-your-notes/ (File, Import From, Markdown Folder for attachments).
// https://joplinapp.org/help/ (open source, offline notes, notebooks, Markdown, supported platforms);
// https://joplinapp.org/help/apps/import_export/ (MD directory import keeps folder structure);
// https://joplinapp.org/help/apps/sync/ (choice of sync services). No numeric prices used.
// Pinto: BRIEF.md for Apple Notes behaviour, connected ChatGPT/Claude read and edit, every earlier version.
// import-your-notes supplies the exact Obsidian import wording, the File menu and unchanged source vault.
// Pane/Views/ImportSheet.swift:16-18,65-68 confirms the menu label and a copied library, not vault sync.
// Pane/Model/MarkdownImport.swift:6-12,22,75-76,580-611 confirms folders, attachments, wiki-link rewriting,
// skipped .obsidian settings, and embedded notes becoming links. No plugin, graph or Canvas parity promised.
// Pane/Model/NoteExport.swift:5-13,59-65,102-107,154-161,176-179 confirms Markdown ZIP export with folders,
// files and rewritten links; currently locked notes are skipped and unavailable files can be left out.
// Mac/iPhone-only scope: evernote-alternative's verified header and BRIEF-compare.md.
// Picture reused and visually checked: /blog/launch/import-obsidian-found-done, from apple-notes-vs-obsidian.

const CHECK = `Before moving an Obsidian vault
- Keep a backup of the whole vault, including its attachments and hidden settings folder.
- Open a note with a picture and check that the picture came across.
- Follow a link between notes, including one into a subfolder.
- Check an embedded note and any plugin-generated content.
- Search for a note whose title you remember.
- Try the imported notes on your iPhone if you use one.
- Open an exported Markdown file in another editor before committing to the new app.`;

const FAQ = [
  { q: "Which Mac notes app can import an Obsidian vault?", a: [
    "Pinto Notes imports a vault on a Mac with subfolders, pictures and links between notes. Bear documents a Markdown Folder import with attachments. Joplin imports a Markdown directory into notebooks and subnotebooks. Apple Notes imports Markdown folders too. Check links and attachments in the result before moving everything.",
  ] },
  { q: "Can I use Pinto Notes to edit my existing vault in Finder?", a: [
    "Pinto Notes imports a copy into its own library and leaves the source vault where it is. It doesn't keep that vault in sync. You can export the Pinto library as Markdown files in a ZIP, but that is a separate export.",
  ] },
  { q: "What happens to embedded Obsidian notes in Pinto Notes?", a: [
    "Embedded notes become links to those notes. Pictures and other linked files import as attachments. Obsidian's settings folder is skipped, so importing your notes doesn't move your plugin setup with them.",
  ] },
  { q: "Which Obsidian replacement works on Mac and Android?", a: [
    "Joplin runs on both, supports Markdown notes and offers a choice of sync services. Pinto Notes runs on iPhone and Mac only. If you want to keep editing the same folder of local Markdown files, staying with Obsidian is also an option.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="obsidian-alternative-for-mac"
      intro={<>Pinto Notes is an Obsidian alternative for Mac if you want Apple Notes&apos; layout and an import for your vault. Choose Bear for Markdown writing organised with tags, Apple Notes for everyday notes, or Joplin for an open source notebook app.</>}
      answer={
        <Answer jump={[
          { href: "#choose", label: "Choose a replacement" },
          { href: "#keep-obsidian", label: "When to keep Obsidian" },
          { href: "#pinto-notes", label: "Move your vault" },
          { href: "#check", label: "Check the import" },
        ]}>
          <p>
            For an Apple Notes-style replacement, Pinto Notes imports an Obsidian vault with its subfolders,
            pictures and links between notes. Keep Obsidian if you need to edit the same Finder folder with
            other tools, or depend on its graph, Canvas or plugins.
          </p>
          <PostCta slug="obsidian-alternative-for-mac" position="answer" title="Bring your vault to Pinto Notes.">
            <p>Import your Obsidian notes on a Mac, then read them in Pinto Notes on Mac and iPhone. Connect ChatGPT or Claude when you want it to read and edit those notes.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/import-obsidian-found-done" width={1600} height={1000} maxWidth={640}
        alt="Pinto Notes on a Mac finds the Second brain vault with 27 notes, then confirms the Obsidian import."
        caption="An Obsidian vault imported into Pinto Notes on a Mac. The original vault stays where it is. Screenshot: Pinto Notes." />}
      faq={FAQ}
    >
      <h2 id="choose">Choose by what you want to change</h2>
      <p>
        Start with the part of Obsidian you want to leave. A different editor may be enough.
        If you want a different way to organise your notes, try it with a small folder first.
      </p>
      <ul>
        <li><strong>Pinto Notes:</strong> Apple Notes&apos; layout, an Obsidian import and connected ChatGPT or Claude access. For iPhone and Mac only.</li>
        <li><strong>Apple Notes:</strong> everyday notes with folders, checklists and search. A route to try if you already want to use Apple&apos;s app.</li>
        <li><strong>Bear:</strong> Markdown writing with tags and tables. Its iCloud sync requires Bear Pro.</li>
        <li><strong>Joplin:</strong> an open source app with notebooks and offline Markdown notes. It also runs on Windows, Linux and Android.</li>
      </ul>
      <p>
        Apple Notes can import a folder of Markdown files. On a Mac, choose File, Import Markdown and
        select the folder. Turn on &ldquo;Preserve folder structure on import&rdquo;, under Options if needed.
        Check pictures and <code>[[links]]</code> yourself. Apple&apos;s{" "}
        <a href="https://support.apple.com/guide/notes/not201900c07/mac">import guide</a> documents folder import,
        without promising to reproduce an Obsidian vault. Our <a href="/blog/apple-notes-vs-obsidian">Apple Notes vs Obsidian comparison</a>{" "}
        covers the wider differences. Leaving Mem before it closes? The <a href="/blog/mem-ai-alternative-for-mac-and-iphone">Mem AI alternative guide</a> has its dates and a Markdown import to test.
      </p>
      <p>
        Bear&apos;s <a href="https://bear.app/faq/import-your-notes/">import guide</a> has a specific route for
        Markdown with attachments: File, Import From, Markdown Folder. It reads notes and referenced attachments
        within that folder and its subfolders. Choose <a href="https://bear.app/">Bear</a> if tags suit your writing.
      </p>
      <p>
        <a href="https://joplinapp.org/help/">Joplin</a> suits a notebook library you need on several operating systems.
        Its desktop app imports a directory through File, Import, MD - Markdown (directory), preserving folders as
        notebooks and subnotebooks. See its <a href="https://joplinapp.org/help/apps/import_export/">import instructions</a>.
        You choose a <a href="https://joplinapp.org/help/apps/sync/">sync service</a>, such as Dropbox or Nextcloud.
      </p>

      <h2 id="keep-obsidian">When keeping Obsidian makes sense</h2>
      <p>
        An <a href="https://obsidian.md/help/data-storage">Obsidian vault is a local folder of Markdown files</a>.
        Other editors can change those files, and Obsidian picks up the changes. If that is how you work with
        scripts or another editor, a replacement that imports copies changes your workflow.
      </p>
      <p>
        Obsidian also has a graph, Canvas and community plugins. A query generated by a plugin needs more than
        the Markdown text around it. Keep Obsidian if you rely on those tools, or save the results you need
        as ordinary note content before moving. These are reasons to choose Obsidian, described on its{" "}
        <a href="https://obsidian.md/">own feature page</a>.
      </p>
      <p>
        If AI access is your only reason for leaving, first read the <a href="/blog/obsidian-mcp">Obsidian MCP guide</a>.
        You may be able to keep your vault. This guide is for moving the notes into a different app.
      </p>

      <h2 id="pinto-notes">Move an Obsidian vault to Pinto Notes</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac. It keeps every earlier version of a note.
        It imports your vault into its own library, so subsequent edits in Pinto Notes and Obsidian are separate.
        There is no Windows, Android or web app.
      </p>
      <ol>
        <li>Keep a backup of your whole vault folder, including pictures and other attachments.</li>
        <li>On your Mac, open Pinto Notes&apos; File menu and choose Import from Obsidian.</li>
        <li>Pinto Notes finds your vault. Confirm the right folder, or choose another folder.</li>
        <li>Import it, then open a few notes and follow their links before switching your daily work.</li>
      </ol>
      <p>
        Subfolders, pictures and the links between notes come too, and your vault stays where it is.{" "}
        <a href="/blog/import-your-notes">Import your notes</a> describes Pinto&apos;s import routes.
        An embedded note becomes a link to that note. The hidden <code>.obsidian</code> settings folder is skipped.
        Importing the text does not reproduce your plugin setup or a Canvas workspace.
      </p>
      <p>
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, it can read and edit
        the imported notes. Ask it to read a named project note and add a summary under a heading.
        Check the result in the note. Its earlier version remains in history.
      </p>
      <p>
        You can export the library as a ZIP of Markdown files in folders, with attachments and links rewritten
        to point to the exported copies. Open any locked notes first, and check the export report for files
        that could not be downloaded. Export gives you files to take elsewhere; it does not sync changes back
        to your original vault.
      </p>

      <h2 id="check">Check an import before moving everything</h2>
      <p>
        Try a folder with a linked pair of notes and a picture. Include a note that depends on a plugin if you
        use one. Read the imported result beside the original and decide whether it still does the job.
      </p>
      <Keep title="A vault migration checklist" text={CHECK} />
      <p>
        Keep your original vault and backup until you have checked the imported library and opened its export.
        Then choose which app you will write in, so new changes have one place to go.
      </p>
    </PostPage>
  );
}
