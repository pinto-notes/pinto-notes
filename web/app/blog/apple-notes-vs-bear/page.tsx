import { Figure } from "@/lib/blog";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-vs-bear", { title: "Apple Notes vs Bear: choosing where to write" });

// Written 21 November 2026 for "apple notes vs bear", research row 40 in topic-research-2026-11-20.md.
// Live Google autocomplete, en-US, 21 Nov: suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=...
// Queried "apple notes vs bear", "bear vs apple notes", "apple notes or bear", "bear notes vs apple notes".
// Returned variants include apple notes vs bear app, apple notes vs bear reddit, apple notes vs bear 2025,
// bear vs apple notes 2026, bear versus apple notes, bear or apple notes, bear app vs apple notes,
// bear scan vs apple notes for scanning photos, bear vs obsidian vs apple notes, bear notes vs apple notes 2025.
// Bear official pages read live 21 Nov 2026:
// https://bear.app/#pricing: Markdown editor, photos, tables, todos; free local access and three themes;
// Pro adds iCloud sync, OCR and more themes; US prices $2.99/month or $29.99/year. No invented platform claims.
// https://bear.app/faq/how-to-use-tags-in-bear/: multiple tags per note; slash-separated nested tags.
// https://bear.app/faq/how-to-link-notes-together/: [[ autocomplete and links to note headings.
// https://bear.app/faq/how-to-use-the-info-panel-table-of-contents-and-backlinks-in-bear/: heading outline,
// backlinks with linked and unlinked mentions. https://bear.app/faq/export-your-notes/: multiple-note export,
// free Markdown, TXT, TextBundle, RTF; Pro adds PDF, DOCX, HTML and EPUB.
// https://bear.app/faq/where-are-bears-notes-located/: notes live in a database, not a folder of .md files.
// https://bear.app/faq/command-line-interface/: Bear 2.8+, Mac only, Claude desktop Connector, local MCP server
// and CLI can search/read/create/edit; encrypted notes cannot be read or modified by these tools.
// https://bear.app/faq/migrate-from-apple-notes/: Markdown Folder import on Mac; older Automator route loses
// non-photo attachments and changes task lists to bullets. Apple's guide documents export of a selected note,
// so no Apple Notes bulk-export claim here.
// Apple official pages read live 21 Nov 2026:
// https://support.apple.com/en-am/guide/notes/not201900c07/mac: File, Export To, Markdown on macOS 27;
// File, Import Markdown; preserve folder structure. Read directly after the web reader returned 429.
// https://support.apple.com/en-tj/guide/notes/apd4e6e2c9a6/mac: collaboration on iCloud notes and folders,
// editing permissions. Read directly. https://support.apple.com/guide/icloud/mm8685520792/icloud: same Apple
// Account, turn on Notes sync on each device. Checklists, tables, pinning, tags, Smart Folders and Edit, Add Link
// from BRIEF.md; earlier verification in apple-notes-tags-smart-folders and apple-notes-meeting-notes-template.
// Pinto: Apple Notes-like iPhone/Mac app, connected ChatGPT/Claude read and edit, every earlier version kept,
// Apple Notes import on Mac without changes: BRIEF.md. Markdown files: apple-notes-vs-obsidian verified header.
// Bear import wording, including pictures, copied from import-your-notes as required by BRIEF-wave4.md.
// Picture: reused SHOTS.aiEdit, Groceries, also used by apple-notes-vs-obsidian. No new screenshots.

const FAQ = [
  { q: "Should I use Bear or Apple Notes for writing?", a: [
    "Choose Bear if you want to write in Markdown, navigate long notes through a table of contents, and connect notes with backlinks. Choose Apple Notes if folders and shared iCloud notes are more useful to you. Both have tables and checklists.",
  ] },
  { q: "Do I need Bear Pro to sync with my iPhone?", a: [
    "Yes. Bear's free version gives you local access to your notes. Sync with iCloud needs Bear Pro, listed at US $2.99 a month or $29.99 a year on Bear's pricing page on 21 November 2026.",
  ] },
  { q: "Can I move Bear notes into Apple Notes?", a: [
    "Yes. Export the notes from Bear as Markdown, then on a Mac choose File, Import Markdown in Apple Notes and select the exported files. Test notes with pictures, tables and links before moving the rest. Bear's wiki links are specific to Bear.",
  ] },
  { q: "Does Bear let Claude edit my notes?", a: [
    "Yes. Bear 2.8 or later has a Claude Connector for the Claude desktop app on a Mac, plus a local MCP server and command-line tool. They can search, read, create and edit notes. Bear says encrypted notes cannot be read or modified by these tools.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-vs-bear"
      intro={<>Choose Apple Notes for shared lists and folders. Choose Bear if you prefer writing in Markdown and organizing notes with nested tags. Here&apos;s what changes when you switch, including sync and moving your notes.</>}
      answer={
        <Answer jump={[
          { href: "#at-a-glance", label: "At a glance" },
          { href: "#apple-notes", label: "Apple Notes" },
          { href: "#bear", label: "Bear" },
          { href: "#switching", label: "Moving your notes" },
          { href: "#pinto-notes", label: "Pinto Notes" },
        ]}>
          <p>
            Pick <strong>Apple Notes</strong> for folders, Smart Folders and notes you edit with other people through iCloud.
            Pick <strong>Bear</strong> for Markdown writing, nested tags and backlinks between related notes.
            Both work on iPhone and Mac, but Bear needs a Pro subscription to sync between them.
          </p>
          <PostCta slug="apple-notes-vs-bear" position="answer" title="Keep Apple Notes' feel and bring your AI.">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac, keeps every earlier version, and lets ChatGPT or Claude read and edit your notes once connected. It imports from Apple Notes and Bear on a Mac.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="at-a-glance">At a glance</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">What matters to you</th><th scope="col">Apple Notes</th><th scope="col">Bear</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Organization</th><td>Folders, tags and Smart Folders</td><td>Tags, including nested tags such as #work/project</td></tr>
            <tr><th scope="row">Writing</th><td>Formatted notes with checklists and tables</td><td>Markdown editor with tables, todos and themes</td></tr>
            <tr><th scope="row">Links</th><td>Edit, Add Link connects notes</td><td>Wiki links, backlinks and links to headings</td></tr>
            <tr><th scope="row">Sync</th><td>iCloud, with Notes enabled on each device</td><td>iCloud with Bear Pro</td></tr>
            <tr><th scope="row">Export on Mac</th><td>PDF or Markdown</td><td>Markdown and other formats; PDF and Word need Pro</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Bear has a free version for local notes. Bear Pro is US $2.99 a month or $29.99 a year on its{" "}
        <a href="https://bear.app/#pricing" rel="noopener">official pricing page</a>, read 21 November 2026.
        Pro also adds search inside images and PDFs, and more themes.
      </p>

      <h2 id="apple-notes">Choose Apple Notes for folders and shared notes</h2>
      <p>
        If you want a Work folder and a Home folder, Apple Notes already gives you that structure. Add checklists or tables inside
        a note, pin a note you use often, and use tags when something belongs to more than one topic.
        A Smart Folder gathers notes by rules, such as a tag or an unchecked checklist. Our guide to{" "}
        <a href="/blog/apple-notes-tags-smart-folders">Apple Notes tags and Smart Folders</a> shows how to set those up.
      </p>
      <p>
        For a grocery list you edit together or a shared project note, Apple documents{" "}
        <a href="https://support.apple.com/guide/notes/apd4e6e2c9a6/mac" rel="noopener">collaboration on notes and folders</a>{" "}
        through iCloud. Everyone needs an Apple Account. You can give people permission to edit or to view.
        For your own notes to appear on both devices, sign in to the same Apple Account and turn on Notes in iCloud settings.
      </p>
      <p>
        Try those tools before moving a whole library. If the missing piece is seeing which notes link back to the one you&apos;re
        reading, Bear&apos;s Backlinks panel is a reason to switch. If it&apos;s finding unfinished tasks, a Smart Folder may be enough.
      </p>

      <h2 id="bear">Choose Bear for Markdown and linked writing</h2>
      <p>
        Bear puts Markdown in the editor. Its Info panel has a table of contents built from your headings, so you can jump to a
        section of a long draft. Type [[ to find another note and link it. The Backlinks tab lists notes that link to the one
        you&apos;re reading, and notes that mention its title without a link. Bear explains both in its{" "}
        <a href="https://bear.app/faq/how-to-use-the-info-panel-table-of-contents-and-backlinks-in-bear/" rel="noopener">Info panel guide</a>.
      </p>
      <p>
        Organization takes a different habit. Add #work/project to nest project under work, and add another tag when a note belongs
        in several places. Click a tag in the sidebar to see its notes. Try this with a handful of real notes before importing everything.
      </p>
      <p>
        Markdown editing doesn&apos;t mean Bear keeps a folder of Markdown files on your disk. Bear says its notes live in a database.
        Its <a href="https://bear.app/faq/export-your-notes/" rel="noopener">export tools</a> can save several notes at once as Markdown,
        even in the free version. Pro adds formats including PDF, Word and HTML. Apple Notes can export Markdown too.
      </p>
      <p>
        Bear also has AI connections. In Bear 2.8 or later on a Mac, Help, Advanced, Install Claude Connector sets up access for
        Claude desktop. A local MCP server and command-line tool support other tools. Bear&apos;s{" "}
        <a href="https://bear.app/faq/command-line-interface/" rel="noopener">official instructions</a> describe reading and editing
        notes, plus tag filters that limit access. These tools are Mac only and cannot read or modify encrypted notes.
      </p>

      <h2 id="switching">Moving between Apple Notes and Bear</h2>
      <p>
        To try Bear, export a note from Apple Notes on a Mac as Markdown. On macOS 27, choose File, Export To, Markdown.
        Bear&apos;s <a href="https://bear.app/faq/migrate-from-apple-notes/" rel="noopener">migration guide</a> then uses File, Import From,
        Markdown Folder to read the exported folder. Its older Automator route changes task lists into bullet lists and leaves
        out attachments other than photos, so check which route applies to your Mac.
      </p>
      <p>
        Choosing for long drafts? <a href="/blog/notes-app-for-writers">Notes apps for writers</a> adds Ulysses and Scrivener to the list.
      </p>
      <p>
        Going back, select notes in Bear and choose File, Export Notes, then Markdown. In Apple Notes on a Mac, choose File,
        Import Markdown and select the files. Apple&apos;s{" "}
        <a href="https://support.apple.com/guide/notes/not201900c07/mac" rel="noopener">import and export guide</a> also describes
        preserving a folder&apos;s structure on import. Bear&apos;s wiki links work inside Bear, so check those links in the imported notes.
      </p>
      <p>
        Start with notes containing a picture, a table and a checklist. Open the imported copies and check the details you rely on.
        Keep the originals while you try the new app. Exporting and importing copies notes; it doesn&apos;t set up ongoing sync between apps.
      </p>

      <h2 id="pinto-notes">Apple Notes&apos; feel, with your AI connected</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac. Your notes are Markdown files, and every earlier version
        is kept. Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, it can read and edit the notes
        themselves. You can ask it to update a list or rewrite a draft without copying the text back into your notes.
      </p>
      <Figure shot={SHOTS.aiEdit} caption="A Groceries note in Pinto Notes on a Mac after ChatGPT added items. Reused screenshot from the Pinto Notes blog." />
      <p>
        Coming from Bear: export your notes as Markdown with attachments, then choose the folder. Pictures come too.
        That&apos;s the Bear route in Pinto&apos;s <a href="/blog/import-your-notes">import guide</a>, on a Mac.
        Coming from Apple Notes, bring your notes over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>.
        Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
