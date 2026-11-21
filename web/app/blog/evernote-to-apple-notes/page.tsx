import { PostPage, postMetadata } from "@/lib/PostPage";
import { PostCta } from "@/lib/PostCta";
import { Answer, Checklist, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("evernote-to-apple-notes", { title: "Evernote to Apple Notes: how to move your notes" });

// Written 21 November 2026 for "evernote to apple notes". Google autocomplete (en-US, read 21 Nov 2026):
// evernote to apple notes migration, export evernote to apple notes, import evernote to apple notes,
// convert evernote to apple notes, evernote to notes mac, switching from evernote to apple notes,
// transfer evernote to notes apple phone how, can i transfer evernote to apple notes, evernote vs apple
// notes (2026, reddit), evernote or apple notes, evernote vs iphone notes.
// Apple, read 21 Nov 2026:
//   support.apple.com/en-us/102223 ("Import or share notes and files to the Notes app", published 2 April
//   2026): on a Mac, pick a folder in iCloud or On My Mac, File, Import to Notes, select files or folders,
//   Import, then Import again; .txt, .rtf, .rtfd, .html, .enex and .md; each .enex file can hold many notes
//   and each becomes a new note; an attachment or feature Notes doesn't support isn't imported; imports land
//   in an Imported Notes folder; Preserve folder structure on import (Show Options); iCloud notes are on
//   every device signed in to your Apple Account; for iPhone the page only covers sharing files into Notes.
//   support.apple.com/guide/notes/not201900c07/mac ("Import, export, and print notes on Mac", macOS 27):
//   needs upgraded iCloud notes or On My Mac; Evernote XML Export (ENEX); "If you have macOS 13 or later,
//   you can also import tags from Evernote (ENEX) files"; notes and folders appear in Imported Notes and
//   can be moved or renamed as usual.
// Earlier posts (verified there): typing #word makes a tag and Smart Folders filter by tags
// (apple-notes-tags-smart-folders); search reads every word; Apple Intelligence transcripts and
// summaries of recordings; Apple Notes reaches ChatGPT and Claude only through apps on your own Mac
// (best-notes-app-for-mac); no version history (apple-notes-version-history).
// Evernote, read 21 Nov 2026:
//   help.evernote.com/hc/en-us/articles/209005557 ("Export Notes and Notebooks as ENEX or HTML", read
//   through the help center's own article API because the page refuses automated fetches): export only in
//   the desktop app for Mac or Windows, not on Evernote Web; select a notebook or notes, right-click,
//   Export..., pick ENEX, tick attributes such as tags and created date, Export, saved to the desktop; up to
//   100 notes at a time or entire notebooks; each ENEX file 300 MB to 2 GB at most; free users can export.
//   evernote.com/compare-plans: plans Free, Starter, Advanced, Flexible, Unlimited (no prices shown today,
//   so none here); Free is 50 notes, 1 notebook, 1 device, 20 tags; apps for iOS, Android, Web, Windows
//   and Mac; Web Clipper, document scanning, advanced search (Boolean, geographic, filtered), tasks,
//   AI Assistant, semantic search, AI Transcribe, and "Connect Evernote to AI tools (MCP)".
// Pinto Notes: import-your-notes wording for Evernote (export each notebook as .enex, drop them in at
// once, each notebook becomes a folder, tags come too); Pane/Model/EvernoteImport.swift on main for files
// coming along and notes keeping their created and edited dates. Pictures: the Pinto File menu import
// capture from import-your-notes, and Evernote's own AI Assistant picture from best-ai-notes-app.

const FAQ = [
  { q: "Can Apple Notes import Evernote files?", a: [
    "Yes, on a Mac. Notes imports Evernote's .enex export files with File, Import to Notes, and turns each Evernote note into a new note. On macOS 13 or later it imports Evernote tags too.",
  ] },
  { q: "How do I get my Evernote notes into Notes on my iPhone?", a: [
    "Import them on a Mac into a folder in your iCloud account. iCloud notes show up on every device signed in to the same Apple Account, so they appear in Notes on your iPhone. Apple doesn't describe an .enex import on iPhone itself.",
  ] },
  { q: "Can I export Evernote notes on the web or on my phone?", a: [
    "No. Evernote says exporting only works in its desktop app for Mac or Windows. You can export a whole notebook at once, or up to 100 selected notes at a time.",
  ] },
  { q: "Is Apple Notes a good replacement for Evernote?", a: [
    "If you only use iPhone and Mac, and mostly write, clip and search notes, it covers most of it. Stay with Evernote if you need Windows or Android, its Web Clipper, or its built-in AI.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="evernote-to-apple-notes"
      intro={<>Apple Notes can read Evernote&apos;s export files on a Mac. The move takes two apps and a little sorting afterwards, and it helps to know what comes across before you start.</>}
      answer={
        <Answer jump={[
          { href: "#export", label: "Export from Evernote" },
          { href: "#import", label: "Import into Notes" },
          { href: "#what-comes-across", label: "What comes across" },
          { href: "#evernote-vs-apple-notes", label: "Evernote vs Apple Notes" },
          { href: "#pinto-notes", label: "A second route" },
        ]}>
          <p>
            In Evernote&apos;s Mac or Windows app, right-click a notebook, choose Export and pick ENEX. Then, in Notes on a Mac, click a
            folder in your iCloud account and choose File, Import to Notes. Each Evernote note becomes a new note in an Imported Notes folder,
            with its tags on macOS 13 or later, and it&apos;s on your iPhone once iCloud syncs.
          </p>
          <PostCta slug="evernote-to-apple-notes" position="answer" title="Or bring Evernote into a notes app ChatGPT can read.">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. It imports the same .enex files on your Mac, each notebook as a folder with its tags, and ChatGPT or Claude can read and edit the notes once you connect them.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="before">What you need</h2>
      <ul>
        <li><strong>A Mac.</strong> Apple documents the .enex import for Notes on a Mac. Its iPhone article only covers sharing files into Notes.</li>
        <li><strong>Evernote&apos;s desktop app,</strong> for Mac or Windows. Evernote says exports aren&apos;t possible on Evernote Web. Free accounts can export.</li>
        <li><strong>Upgraded iCloud notes, or notes on your Mac.</strong> Apple says import works with either. Pick a folder in iCloud if you want the notes on your iPhone.</li>
      </ul>
      <p>
        If you export on a Windows PC, copy the .enex files to the Mac, for example through iCloud Drive or a USB stick.
      </p>

      <h2 id="export">Step 1: export each notebook from Evernote</h2>
      <Steps>
        <li>
          <strong>Open the Evernote desktop app</strong>{" "}
          Select a notebook. To export only some notes, select them instead; Evernote exports up to 100 notes at a time.
        </li>
        <li>
          <strong>Right-click and choose Export</strong>{" "}
          Pick ENEX as the file format.
        </li>
        <li>
          <strong>Keep tags ticked</strong>{" "}
          Evernote lets you choose which attributes go with the notes, such as tags and the created date. Leave tags on if you want them in
          Apple Notes.
        </li>
        <li>
          <strong>Click Export</strong>{" "}
          Evernote saves the .enex file to your desktop. Repeat for each notebook.
        </li>
      </Steps>
      <p>
        You can also pick a maximum size for each .enex file, from 300 MB to 2 GB, if a notebook holds a lot of attachments.
      </p>

      <h2 id="import">Step 2: import into Notes on your Mac</h2>
      <Steps>
        <li>
          <strong>Pick where the notes go</strong>{" "}
          Open Notes and click a folder in the iCloud account (or On My Mac, if you want them on this Mac only).
        </li>
        <li>
          <strong>Choose File, Import to Notes</strong>{" "}
          Select one .enex file, then click Import, and Import again to confirm.
        </li>
        <li>
          <strong>Rename the Imported Notes folder</strong>{" "}
          The notes arrive in a folder called Imported Notes. Rename it to the notebook&apos;s name, then import the next notebook.
        </li>
      </Steps>
      <Paths rows={[
        { on: "Evernote, Mac or Windows", steps: ["Right-click a notebook", "Export...", "ENEX"] },
        { on: "Notes, Mac", steps: ["File", "Import to Notes"] },
      ]} />
      <p>
        One notebook at a time is the safe way to keep them apart. Apple says the notes and any folders you imported land in Imported Notes,
        but it doesn&apos;t say whether several .enex files picked together become separate folders. The Preserve folder structure on import
        option is for importing a folder of files; click Show Options if you don&apos;t see it.
      </p>

      <h2 id="what-comes-across">What comes across</h2>
      <p>
        Apple keeps this short. Each note in an .enex file becomes its own note, and on macOS 13 or later its Evernote tags come with it, as
        Apple Notes tags. Anything Notes doesn&apos;t support is left out: Apple says such a note is imported without that attachment or
        feature, and it doesn&apos;t list which ones. So check before you close your Evernote account.
      </p>
      <Checklist title="Before you leave Evernote" items={[
        "Import one small notebook first and open a few notes",
        "Compare a note with a checklist, a table and an attachment",
        "Check that the tags arrived",
        "Count the notes in each notebook and in each new folder",
        "Keep your Evernote account until every notebook is checked",
      ]} />
      <p>
        Tags are worth the trouble. In Apple Notes a tag is any #word in a note, and a Smart Folder can gather every note with one, which
        works across all your folders.
      </p>

      <h2 id="evernote-vs-apple-notes">Evernote vs Apple Notes: should you switch?</h2>
      <PostFigure src="/blog/news/evernote-ai-assistant-mac" width={1720} height={785}
        alt="Evernote's Mac app with a Website Launch note and the AI Assistant panel, which has just moved a note to the Website notebook, with an Undo button."
        caption="Evernote's AI Assistant moving a note to another notebook, on a Mac. Image: Evernote, from the Mac App Store." />
      <p>
        Evernote still does things Apple Notes doesn&apos;t. Its plan page lists apps for iPhone, Android, Windows, Mac and the web, a Web
        Clipper, document scanning, and search with Boolean, place and filter options. It has its own AI Assistant, search by meaning,
        transcription, and a connection that lets Claude, ChatGPT and other AI tools use your notes. Today the Free plan stops at 50 notes,
        one notebook and one device, so a large archive needs a paid plan.
      </p>
      <p>
        Apple Notes comes with every iPhone and Mac and syncs through iCloud, with iCloud.com for a browser. Search reads every word in every
        note, and Apple Intelligence can turn a recording into a transcript and a summary. What it lacks: Windows and Android apps, a way for
        ChatGPT or Claude to reach your notes from anywhere but your own Mac, and <a href="/blog/apple-notes-version-history">version
        history</a>.
      </p>
      <ul>
        <li><strong>Stay with Evernote</strong> if you use Windows or Android, clip a lot from the web, or rely on its AI features.</li>
        <li><strong>Move to Apple Notes</strong> if you&apos;re on iPhone and Mac only and want notes that are already on both.</li>
      </ul>
      <p>
        <a href="/blog/best-notes-app-for-mac">The best notes apps for Mac, compared</a> covers Obsidian, Notion, Bear and the others, if
        you&apos;re still choosing.
      </p>

      <h2 id="pinto-notes">The second route: Pinto Notes</h2>
      <p>
        If you&apos;re leaving Evernote for Apple Notes&apos; simplicity but would miss having an AI that can use your notes, there&apos;s a
        middle way. Pinto Notes is a notes app for iPhone and Mac that looks and works like Apple Notes, and it imports the same .enex files.
      </p>
      <PostFigure src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain"
        alt="The File menu in Pinto Notes on a Mac: Import from Apple Notes, Obsidian, Bear, Evernote and Google Keep, each with its app's icon, and Import Markdown or Text."
        caption="The File menu in Pinto Notes on a Mac. Evernote is one of the choices." />
      <p>
        On a Mac, open the File menu and choose Evernote. Export each notebook as an .enex file and drop them all in at once. Each notebook
        becomes a folder, and tags come too. Attached files come along, and each note keeps the dates it was created and last edited.
        Evernote stays as it is. <a href="/blog/import-your-notes">Importing your notes</a> shows the steps for every app.
      </p>
      <p>
        After that, <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a> and they can search, read and edit your old
        Evernote notes, from your phone, the web or your Mac. Pinto Notes keeps every earlier version of a note, so you can go back after
        an AI edit. Pinto Notes is Apple only: there&apos;s no Windows, Android or web app, so if you need those, Evernote is the better
        fit. Already moved to Apple Notes? <a href="/blog/move-from-apple-notes">Moving from Apple Notes</a> is one import on your Mac,
        and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
