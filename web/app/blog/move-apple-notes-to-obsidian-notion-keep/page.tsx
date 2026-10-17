import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Capture, Checklist, Paths, PostFigure, Steps } from "@/lib/PostParts";
import { APP_STORE_LIVE } from "@/lib/site";

export const dynamic = "force-static";
export const metadata = postMetadata("move-apple-notes-to-obsidian-notion-keep", { title: "Move Apple Notes to Obsidian, Notion or Google Keep" });

// Checked on 12 October 2026.
// Apple: "Import, export, and print notes on Mac" in the Notes User Guide for Mac (File, Export To, PDF
// or Markdown, one note at a time; File, Import Markdown) and "Export or print notes on iPhone" (Share,
// Export as Markdown). The File, Export To capture is public/blog/macos27/notes-export-to, taken in
// Notes on macOS 27 in a throwaway VM with no account (the same capture the iOS 27 and API posts use).
// Obsidian: obsidian.md/help/import/apple-notes (macOS only, not on iOS; Importer from Community plugins;
// File format, Apple Notes; select the group.com.apple.notes folder; locked notes are skipped and must be
// unlocked first; tables, images, drawings, scans and PDFs come along), obsidian.md/help/community-plugins
// (Restricted mode, Browse, Install, Enable), and the Importer's source on GitHub
// (src/formats/apple-notes.ts and apple-notes/convert-note.ts: notes go into folders that match Apple
// Notes', password-protected notes are skipped, checklist items become [ ] and [x], a folder picker).
// Notion: notion.com/help/import-data-into-notion (Settings, Import; no Apple Notes importer; Text and
// Markdown one file at a time or a folder as a ZIP; 5 MB a file on Free, 50 MB on paid plans; about 120
// file imports every 12 hours; up to 5 GB a ZIP; pages can be moved after import).
// Google Keep: Keep's help has pages for sending notes to other apps and for exporting with Google
// Takeout (support.google.com/keep/answer/6320648 and 10017039) and none for importing; no import menu
// was found in Keep's help or App Store listing. Not verified: Keep's iPhone share extension (only older
// third-party guides describe it), so the post doesn't rely on it.
// Pinto Notes: Pane/Views/AppleNotesImport.swift and Pane/Model/AppleNotesImporter.swift on main:
// File, Import from Apple Notes; every folder in Apple Notes' order and nesting; pictures as files;
// "Locked in Apple Notes"; checklists and pins exactly with Full Disk Access, otherwise checklists as
// bullet lists; notes already imported are skipped; "Copies the notes you pick. Nothing in Apple Notes
// changes."

const FAQ = [
  { q: "Can Obsidian import Apple Notes directly?", a: [
    "Yes, on a Mac. Obsidian's official Importer plugin has an Apple Notes option that reads Notes' own data on your Mac and writes each note as a Markdown file, in folders that match yours. It doesn't run on iPhone, and it skips locked notes.",
  ] },
  { q: "Does Notion have an Apple Notes importer?", a: [
    "No. Notion's import list has Evernote, Trello, Confluence and others, but not Apple Notes. Export your notes as Markdown first, put the files in a ZIP, and import that in Notion under Settings, Import.",
  ] },
  { q: "Can I import Apple Notes into Google Keep?", a: [
    "Not in one go. Google Keep has no import feature, so each note has to be copied and pasted into a new Keep note.",
  ] },
  { q: "Are my Gmail notes in Apple Notes the same as Google Keep?", a: [
    "No. Notes kept under a Gmail account in Apple Notes are stored in your Gmail account over IMAP, the way Mail works. Google Keep is a separate app with its own notes, and it doesn't show them.",
  ] },
  { q: "Will moving my notes delete them from Apple Notes?", a: [
    "No. None of these routes changes Apple Notes. Obsidian's importer reads a copy, and an export writes new files. Your notes stay in Apple Notes until you delete them yourself.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="move-apple-notes-to-obsidian-notion-keep"
      intro={<>Apple Notes has no button that moves everything to another app, so the route depends on where you&apos;re going.</>}
      answer={
        <Answer jump={[
          { href: "#before", label: "Before you start" },
          { href: "#obsidian", label: "Obsidian" },
          { href: "#notion", label: "Notion" },
          { href: "#google-keep", label: "Google Keep" },
          { href: "#what-comes-across", label: "What comes across" },
        ]}>
          <p>
            For Obsidian, install the official Importer plugin on your Mac and choose Apple Notes. It reads every note and keeps your
            folders. Notion can&apos;t read Apple Notes, so export your notes as Markdown files, zip them and import the ZIP under
            Settings, Import. Google Keep can&apos;t import anything, so you copy and paste one note at a time. Unlock locked notes
            first, whichever app you pick.
          </p>
        </Answer>
      }
      // Paper-cut art above the intro (decoration, made with the Codex image tool like the API post's). The
      // Export To capture sits in the Notion section, where it's used.
      art="/blog/art/move-apple-notes-to-obsidian-notion-keep"
      faq={FAQ}
    >
      <h2 id="before">Before you start</h2>
      <PostFigure src="/blog/macos27/notes-locked-window" width={1520} height={984} maxWidth={560}
        alt="Apple Notes on macOS 27 with a locked note asking for the notes password, with the hint City and year of the trip."
        caption="A locked note stays behind in every move. Unlock it first." />
      <p>
        Locked notes are the main thing that gets left behind. Obsidian&apos;s importer skips them, and Apple Notes won&apos;t export a
        locked note, so take the lock off the ones you want to bring. If you&apos;ve lost the password for one, <a
        href="/blog/forgot-apple-notes-password">what to do if you forgot your Apple Notes password</a> explains what&apos;s possible.
      </p>
      <Checklist title="Before moving out of Apple Notes" items={[
        "Unlock the locked notes you want to bring",
        "Move one test note with a checklist, a table and a picture, and open it in the new app",
        "Keep Apple Notes as it is until you've checked the new app",
        "Write down the folders you have, to compare afterwards",
      ]} note="Copy gives you plain lines. In Apple Notes, select them and tap the checklist button." />

      <h2 id="obsidian">Apple Notes to Obsidian</h2>
      <p>
        Obsidian has the only real importer of the three. Its official Importer plugin reads Apple Notes&apos; data on your Mac and
        turns each note into a Markdown file in your vault. It runs on macOS only; Obsidian says it isn&apos;t available on iOS yet.
      </p>
      <PostFigure src="/blog/apple/obsidian-importer-dialog" width={2004} height={1468} maxWidth={560}
        alt="Obsidian's Import data into Obsidian window, with File format, Files to import, Output folder and an Import button."
        caption="Obsidian's Importer. Choose Apple Notes under File format. Image: Obsidian." />
      <Steps>
        <li>
          <strong>Install Importer</strong>
          In Obsidian, open Settings, choose Community plugins and turn off Restricted mode if it&apos;s on. Choose Browse, find
          Importer, click Install, then Enable.
        </li>
        <li>
          <strong>Open Importer and pick Apple Notes</strong>
          Open it from the command palette or its icon in the ribbon, and under File format choose Apple Notes.
        </li>
        <li>
          <strong>Give it access to your notes</strong>
          Click Import. When Obsidian asks for the group.com.apple.notes folder, click Open. That folder is where Notes keeps its data
          on your Mac.
        </li>
        <li>
          <strong>Check the preview, then import</strong>
          You can change the note template and the file names before the import starts.
        </li>
      </Steps>
      <p>
        Obsidian says it handles virtually everything in Apple Notes, including tables, pictures, drawings, scans and PDFs. The plugin&apos;s
        code puts notes in folders that match yours and turns checklist items into Markdown checkboxes. If you want an AI to work in
        the vault too, <a href="/blog/obsidian-mcp">Obsidian MCP servers, compared</a> covers what works.
      </p>

      <h2 id="notion">Apple Notes to Notion</h2>
      <PostFigure src="/blog/apple/notion-settings-import" width={2136} height={1340} maxWidth={700}
        alt="Notion's Settings window open at Import: a drop area for ZIP, CSV, PDF, text, Markdown or HTML files up to 5 GB, and tiles for each kind."
        caption="Notion's Settings, Import, where the ZIP goes. Image: Notion." />
      <p>
        Notion&apos;s import list has Evernote, Trello and Confluence, but not Apple Notes. The way in is Markdown: Notion imports
        Markdown files, and Apple Notes can write them.
      </p>
      <Steps>
        <li>
          <strong>Export your notes as Markdown</strong>
          Use the menus below, note by note. Apple&apos;s export works one note at a time, so for many notes a free exporter is
          quicker.
        </li>
        <li>
          <strong>Put the files in a ZIP</strong>
          On a Mac, Control-click the folder in Finder and choose Compress. Notion keeps the folder structure from a ZIP.
        </li>
        <li>
          <strong>Import the ZIP in Notion</strong>
          In the sidebar, open Settings, then Import, and choose the ZIP. The notes arrive as pages you can move anywhere afterwards.
        </li>
      </Steps>
      <Paths rows={[
        { on: "Mac, macOS 27", steps: ["File", "Export To", "Markdown"] },
        { on: "Mac, macOS 26", steps: ["File", "Export as", "Markdown"] },
        { on: "iPhone", steps: ["Share", "Export as Markdown"] },
      ]} />
      <Capture src="/blog/macos27/notes-export-to" width={770} height={795} maxWidth={385}
        alt="The File menu of Apple Notes on macOS 27, open at Export To, with PDF and Markdown in the submenu."
        caption="File, Export To in Notes on macOS 27. Markdown is the format Notion can import." />
      <p>
        <a href="/blog/export-apple-notes-to-markdown">How to export Apple Notes to Markdown</a> has the free exporters that do a whole
        library at once, and what to check in the files. On Notion&apos;s side, mind the limits. On the Free plan a single file can be at
        most 5 MB (50 MB on paid plans), and Notion handles about 120 Markdown files every 12 hours. A ZIP can be up to 5 GB, but
        Notion says one with more than 10,000 files is likely to fail.
      </p>

      <h2 id="google-keep">Apple Notes to Google Keep</h2>
      <PostFigure src="/blog/drawn/keep-copy" width={1200} height={750} maxWidth={560}
        alt="A drawn notes icon and the Google Keep logo, with copy and paste keys between them."
        caption="Keep has no import: one note at a time, by copy and paste." />
      <p>
        Google Keep can&apos;t import notes from any app. Its help pages cover sending notes out of Keep and downloading them with
        Google Takeout, and nothing about bringing notes in. So the move is by hand:
      </p>
      <Steps>
        <li>
          <strong>Copy the note in Apple Notes</strong>
          Open it, select all the text and copy it.
        </li>
        <li>
          <strong>Paste it into a new note in Keep</strong>
          Make the first line the title, and add a label if you sort notes that way.
        </li>
      </Steps>
      <p>
        That&apos;s fine for a few dozen notes, and slow for hundreds. Pictures have to be added to each Keep note separately, and
        Keep has no folders, only labels, so your folders won&apos;t come with you.
      </p>
      <p>
        One thing that confuses people: if Apple Notes shows a Gmail account in its sidebar, those notes aren&apos;t in Google Keep. They
        live in your Gmail account and sync over IMAP, the same way Mail does, and Keep never shows them.
      </p>

      <h2 id="what-comes-across">What comes across</h2>
      <PostFigure src="/blog/macos27/notes27-smart-folder-open-todos" width={2000} height={900} maxWidth={640}
        alt="A test note in Apple Notes on macOS 27 with a heading, a checklist with one item ticked, a tag, a small table, a link to another note and a picture."
        caption="A test note like this shows what each move keeps." />
      <p>Google Keep gets the text of each note and nothing else. For the other two:</p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">In your notes</th><th scope="col">Obsidian</th><th scope="col">Notion</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">All notes at once</th><td>Yes</td><td>With a free exporter</td></tr>
            <tr><th scope="row">Folders</th><td>Kept</td><td>Kept, if the ZIP has them</td></tr>
            <tr><th scope="row">Checklists</th><td>Markdown checkboxes</td><td>Depends on the export</td></tr>
            <tr><th scope="row">Pictures</th><td>Come along</td><td>Depends on the export</td></tr>
            <tr><th scope="row">Locked notes</th><td>Skipped</td><td>Unlock them to export</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        &ldquo;Depends on the export&rdquo; means Apple doesn&apos;t say what its Markdown export keeps, and the free exporters each do it
        their own way. That&apos;s what the test note in the checklist above is for.
      </p>

      <h2 id="pinto-notes">Or move to a notes app that works like Apple Notes</h2>
      <p>
        Each of these is a real change of habit. Obsidian is a folder of files you manage, Notion is a workspace built for teams, and
        Keep has no folders at all. If what you liked about Apple Notes was how quick it is, and what you&apos;re missing is that
        ChatGPT and Claude can&apos;t see a word of it, there&apos;s a shorter move.
      </p>
      <PostFigure src="/blog/pinto/import-from-apple-notes-sheet" width={1090} height={1260} maxWidth={460}
        alt="The Import from Apple Notes sheet in Pinto Notes on a Mac: Copies the notes you pick. Nothing in Apple Notes changes. Every note is listed under its Apple Notes folder, all ticked, with Import 8 Notes."
        caption="Import from Apple Notes in Pinto Notes: every note under its folder, ticked. Nothing in Apple Notes changes." />
      <p>
        Pinto Notes, the notes app for iPhone and Mac that I make, looks and works like Apple Notes, keeps every note as Markdown, and
        lets ChatGPT and Claude read and edit your notes once you approve them. On a Mac, File, Import from Apple Notes copies every
        note in every folder, with the folders&apos; names, nesting and order. Pictures come along as files, and importing again skips
        notes that are already there. Apple Notes doesn&apos;t change.
      </p>
      <p>
        It has limits too. Locked notes stay in Apple Notes and show as &ldquo;Locked in Apple Notes&rdquo;. Checklists and pins come over
        exactly only if you give Pinto Notes Full Disk Access, which it never asks for; without it, checklists arrive as bullet lists.
        There&apos;s no Windows, Android or web version. {APP_STORE_LIVE
          ? <>The iPhone app is on the App Store. </>
          : <>The iPhone app is coming soon to the App Store. </>}
        <a href="/blog/move-from-apple-notes">Moving from Apple Notes</a> walks through the import.
      </p>
    </PostPage>
  );
}
