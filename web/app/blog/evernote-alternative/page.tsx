import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("evernote-alternative", {
  title: "Evernote alternative for Mac and iPhone: 6 options",
});

// Written 21 November 2026 for "evernote alternative". Google autocomplete read live today with
// suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q= for all six brief queries.
// Head-query suggestions: evernote alternative, evernote alternatives 2026, evernote alternative free,
// evernote alternative reddit, evernote alternative mac, evernote alternative open source,
// evernote alternative self hosted, what is the best alternative to evernote.
// Other suggestions: evernote alternative free open source, evernote alternative free reddit,
// evernote free alternative android, best evernote alternative for mac, evernote alternative iphone,
// evernote free alternative reddit, evernote alternatives 2026 reddit, what is better than evernote.
// "evernote export to something free" returned no suggestions. Research row: topic-research-2026-11-20.md,
// evernote-alternative-for-mac-and-iphone. Models read: apple-notes-vs-obsidian and best-notes-app-for-mac.
// Official pages read 21 Nov 2026, import routes documented there, not migration tests:
// Apple: https://support.apple.com/en-us/102223 (Mac ENEX import, unsupported content omitted, iCloud);
// https://support.apple.com/guide/notes/not201900c07/mac (File, Import to Notes; tags on macOS 13+).
// Both read directly over HTTPS after the web reader returned 429.
// https://apps.apple.com/us/app/notes/id1110145109 (free, checklists, tags, search, iCloud sync).
// Evernote: https://help.evernote.com/hc/en-us/articles/209005557-Export-Notes-and-Notebooks-as-ENEX-or-HTML
// (desktop Mac/Windows export only, ENEX, attributes, whole notebooks, free accounts can export).
// Obsidian: https://obsidian.md/ (local Markdown, links, graph, plugins), https://obsidian.md/download
// (platforms), https://obsidian.md/pricing (free app, optional paid Sync),
// https://obsidian.md/help/import/evernote (official Importer, ENEX, tag hierarchy and stack limits).
// Notion: https://www.notion.com/product (team workspace),
// https://www.notion.com/help/import-data-into-notion (account connection, not ENEX upload; notebooks
// become pages, notes database items; desktop/web only; Evernote Teams excluded; image issues),
// https://www.notion.com/help/system-requirements-for-notion (Mac, Windows, iOS, Android, web).
// Bear: https://bear.app/ (Markdown, tags, Mac/iPhone, Pro for iCloud sync),
// https://bear.app/faq/migrate-from-evernote/ (File, Import From, Evernote; iOS sidebar import;
// ENEX lacks notebook information; use tags to retain notebook names).
// Joplin: https://joplinapp.org/help/ (free, open source, notebooks, Markdown, offline, platforms),
// https://joplinapp.org/ (web clipper), https://joplinapp.org/help/apps/sync/ (sync services),
// https://joplinapp.org/help/apps/import_export/ (ENEX, tags, attachments, notebook per file;
// Markdown or HTML; formatting and note-link caveats). No numeric prices used.
// Pinto: BRIEF.md for Apple Notes feel, free download, connected ChatGPT/Claude reading and editing,
// and every earlier version. BRIEF-compare.md for Markdown files and Mac/iPhone only, no Windows,
// Android or web app. import-your-notes supplies the exact Evernote import wording and File menu.
// Picture reused: /blog/launch/import-file-menu from import-your-notes, no new screenshots.

const FAQ = [
  { q: "Which free Evernote alternatives can import my notebooks?", a: [
    "Apple Notes, Pinto Notes, Obsidian and Joplin accept Evernote's .enex files. Obsidian's own Sync service is a paid add-on. Joplin lets you choose a sync service. Evernote says free accounts can export, so you don't need a paid Evernote subscription to get your notes out.",
  ] },
  { q: "Can I move an ENEX backup into Notion?", a: [
    "Notion's official Evernote importer connects to your Evernote account. Its guide doesn't document uploading an .enex backup. If you only have the backup file, Apple Notes, Pinto Notes, Obsidian, Bear and Joplin document file imports.",
  ] },
  { q: "Can I leave Evernote using only an iPhone?", a: [
    "Evernote says its export works only in the Mac or Windows desktop app. Bear documents importing an existing .enex file on iPhone, but you still need to obtain that export. Notion's account import runs on desktop or web, not in its mobile app.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="evernote-alternative"
      intro={<>Apple Notes is a straightforward Evernote alternative for personal notes on a Mac and iPhone. Choose Pinto Notes for connected AI access, Obsidian for Markdown files, Notion for team work, Bear for writing, or Joplin for an open source notebook app.</>}
      answer={
        <Answer jump={[
          { href: "#at-a-glance", label: "Compare the six" },
          { href: "#export", label: "Export from Evernote" },
          { href: "#apple-notes", label: "Import routes" },
          { href: "#before-you-switch", label: "Check your import" },
        ]}>
          <p>
            Apple Notes, Pinto Notes, Obsidian and Joplin are free options that accept Evernote&apos;s .enex exports.
            Bear accepts them too, with Pro needed for iCloud sync. Notion suits shared work, but its official
            import connects to your Evernote account instead of reading an .enex file.
          </p>
          <PostCta slug="evernote-alternative" position="answer" title="Bring your Evernote notebooks to Pinto Notes.">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. Import your Evernote notebooks on a Mac, then connect ChatGPT or Claude to read and edit your notes.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain"
        alt="The File menu in Pinto Notes on a Mac, with Import from Evernote and other import options."
        caption="Pinto Notes has an Evernote import in the File menu on a Mac. Screenshot: Pinto Notes." />}
      faq={FAQ}
    >
      <h2 id="at-a-glance">Which Evernote alternative suits your notes?</h2>
      <div className="tableWrap">
        <table>
          <thead><tr><th scope="col">App</th><th scope="col">Choose it for</th><th scope="col">Evernote import</th><th scope="col">Check first</th></tr></thead>
          <tbody>
            <tr><th scope="row">Apple Notes</th><td>Everyday personal notes on Apple devices</td><td>.enex on a Mac</td><td>Unsupported attachments or features are omitted</td></tr>
            <tr><th scope="row">Pinto Notes</th><td>Apple Notes&apos; feel with ChatGPT or Claude access</td><td>.enex on a Mac, notebooks become folders</td><td>iPhone and Mac only</td></tr>
            <tr><th scope="row">Obsidian</th><td>Local Markdown files and linked research</td><td>.enex through the official Importer plugin</td><td>Sync is a separate choice</td></tr>
            <tr><th scope="row">Notion</th><td>Team pages and databases</td><td>Connect an Evernote account on desktop or web</td><td>No documented .enex upload route</td></tr>
            <tr><th scope="row">Bear</th><td>Markdown writing organised with tags</td><td>.enex on Mac or iPhone</td><td>iCloud sync requires Pro</td></tr>
            <tr><th scope="row">Joplin</th><td>Open source notebooks and a web clipper</td><td>.enex in the desktop app</td><td>Choose your sync service and import format</td></tr>
          </tbody>
        </table>
      </div>
      <p>The import routes below follow the makers&apos; guides, read on 21 November 2026.</p>

      <h2 id="export">Start with an Evernote export</h2>
      <p>
        In Evernote&apos;s Mac or Windows desktop app, select a notebook, choose Export, and select ENEX.
        Keep tags and the other attributes you need ticked. Export each notebook separately and keep the files
        as your backup. Evernote says exporting is available to free accounts, and doesn&apos;t work in Evernote Web.
        See <a href="https://help.evernote.com/hc/en-us/articles/209005557-Export-Notes-and-Notebooks-as-ENEX-or-HTML">Evernote&apos;s export guide</a>.
      </p>

      <h2 id="apple-notes">Apple Notes for everyday notes on Apple devices</h2>
      <p>
        Apple Notes suits a library of personal notes, checklists and saved information. You can organise notes with
        folders or tags and search their contents. iCloud makes those notes available on devices signed in to your Apple Account.
      </p>
      <p>
        On your Mac, select a folder under iCloud or On My Mac, then choose File, Import to Notes and select your .enex files.
        Choose iCloud if you want the notes on your iPhone. Tags import on macOS 13 or later, according to{" "}
        <a href="https://support.apple.com/guide/notes/not201900c07/mac">Apple&apos;s Mac guide</a>.
        Apple warns that unsupported attachments and features won&apos;t come across.
        Our <a href="/blog/evernote-to-apple-notes">Evernote to Apple Notes guide</a> covers the steps and checks, using{" "}
        <a href="https://support.apple.com/en-us/102223">Apple&apos;s import instructions</a>.
      </p>

      <h2 id="pinto-notes">Pinto Notes for Apple Notes&apos; feel with AI access</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac. Your notes are Markdown files, and every earlier
        version stays in their history. Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>,
        it can read and edit your notes. That suits an Evernote library you want your AI to work with.
      </p>
      <p>
        On your Mac, export each notebook as an .enex file and drop them all in at once. Each notebook becomes a folder,
        and tags come too. Choose Import from Evernote in Pinto Notes&apos; File menu, as shown above.{" "}
        <a href="/blog/import-your-notes">Import your notes</a> describes the import. Your old app stays as it is.
      </p>
      <p>Pinto Notes is Apple only, on iPhone and Mac. There is no Windows, Android or web app.</p>

      <h2 id="obsidian">Obsidian for Markdown files and linked research</h2>
      <p>
        Obsidian stores notes locally as plain Markdown files. Links, a graph and community plugins suit a research
        library you want to organise yourself. It runs on Mac and iPhone, as well as Windows, Linux and Android.
        The app is free. Obsidian Sync is an optional paid service, so decide how you want to sync before switching.
      </p>
      <p>
        Install and enable the official Importer through Settings, Community Plugins. Open Importer, choose Evernote (.enex),
        select your export, then Import to preview it and Import again to finish. Obsidian&apos;s{" "}
        <a href="https://obsidian.md/help/import/evernote">Evernote import guide</a> explains how to retain notebook stacks
        through filenames and tag hierarchies through renamed tags. An ordinary export doesn&apos;t retain those structures.
      </p>

      <h2 id="notion">Notion for notes that belong in shared work</h2>
      <p>
        Notion suits notes you want to bring into a team workspace. Its Evernote importer turns notebooks into pages
        and notes into database items. That changes how you organise the library. It also gives you a place to work
        with those notes alongside your team. Notion runs on Mac and iPhone, Windows, Android and the web.
      </p>
      <p>
        On desktop or web, go to Settings, Import, Third party imports, Evernote. Sign in to Evernote, authorise the
        connection and choose notebooks. Notion&apos;s <a href="https://www.notion.com/help/import-data-into-notion">official guide</a>{" "}
        documents this account connection, not an .enex upload. It excludes Evernote Teams and warns that images may
        need cleanup. Keep access to your Evernote account until you have checked the result.
      </p>

      <h2 id="bear">Bear for Markdown writing and tags</h2>
      <p>
        Bear suits writing you organise with tags. Its Markdown editor has tables and to-do lists, and it runs on
        Mac and iPhone. Bear&apos;s <a href="https://bear.app/">feature page</a> lists iCloud sync as a Pro feature.
        If you need notes on both devices, include that subscription in your decision.
      </p>
      <p>
        On a Mac, choose File, Import From, Evernote and select your .enex file. On iPhone, open the sidebar&apos;s
        three-dot menu, then Import. Bear&apos;s <a href="https://bear.app/faq/migrate-from-evernote/">migration guide</a>{" "}
        says .enex doesn&apos;t contain notebook information. It suggests adding tags before export to keep notebook
        names as references. Plan that before bringing over a library built around notebooks.
      </p>

      <h2 id="joplin">Joplin for open source notebooks and web clipping</h2>
      <p>
        Joplin is a free, open source app with notebooks, tags and a web clipper. Notes remain available offline.
        It runs on Mac and iPhone, Windows, Linux and Android. You can choose a sync service such as Dropbox or
        OneDrive instead of using Joplin Cloud. Set that up separately from the import.
      </p>
      <p>
        In the desktop app, choose File, Import, ENEX. Joplin accepts one file or a directory of files and creates a
        notebook per file. Tags and attachments come across. Its <a href="https://joplinapp.org/help/apps/import_export/">import guide</a>{" "}
        explains the choice between Markdown and HTML. Markdown conversion can lose colours and font formatting;
        HTML is an option when those matter. Links between notes can also need repair.
      </p>

      <h2 id="before-you-switch">Check a small notebook before moving everything</h2>
      <p>Try a notebook that contains the kinds of notes you actually keep. Before you stop using Evernote:</p>
      <ul>
        <li>Compare note counts and open notes with attachments or tables.</li>
        <li>Check tags, notebook organisation and links between notes.</li>
        <li>Search for a note you know, then open it on your iPhone after setting up sync.</li>
        <li>Keep the original .enex files until you are happy with the move.</li>
      </ul>
    </PostPage>
  );
}
