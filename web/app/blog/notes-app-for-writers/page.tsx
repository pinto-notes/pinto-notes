import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("notes-app-for-writers", { title: "Notes app for writers: six options for your drafts" });

// Written 21 November 2026 for "notes app for writers". Research: topic-research-2026-11-20.md, row 27.
// Google autocomplete read live today, en-US, with suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=...
// Variants returned: best notes app for writers, notes app for authors, which app is best for writing notes, apps for writing
// notes, apps for writing notes on laptop, famous writers notebooks, which is the best app for notes, apple notes for writing,
// using apple notes for writing, can apple notes convert handwriting to text, how to convert handwriting to text apple notes.
// Models read: apple-notes-vs-obsidian, best-notes-app-for-mac, apple-notes-recipe-template.
// Official sources read live 21 Nov 2026, no prices used:
// Apple: https://support.apple.com/guide/notes/not9474646a9/mac (automatic saving, File, Duplicate Note),
// https://support.apple.com/guide/notes/not201900c07/mac (selected note: File, Export To, PDF or Markdown).
// Folders, tags, pinned notes, search and Edit, Add Link: BRIEF.md's verified Apple facts, also used in the models.
// Bear: https://blog.bear.app/2023/07/get-started-with-bear/ (Markdown, tags, word count in Info Panel),
// https://bear.app/faq/typewriter-mode/ (Edit, Typewriter Mode),
// Bear FAQ, "hide the sidebar and note list" (bear.app/faq/, hide the other columns),
// https://bear.app/faq/export-your-notes/ (Markdown in Free; DOCX, PDF and ePub need Pro),
// https://bear.app/faq/backup-restore/ (manual library backup, restoring replaces current notes).
// Obsidian: https://obsidian.md/help/data-storage (local Markdown files), https://obsidian.md/help/links (internal links),
// https://obsidian.md/help/plugins/word-count (core word counter), https://obsidian.md/help/plugins/file-recovery
// (local snapshots, 7 days by default, not a complete backup), https://obsidian.md/help/sync/version-history (Sync history).
// Ulysses: https://ulysses.app/ (focused editor, projects), https://help.ulysses.app/goals (word and daily goals),
// https://help.ulysses.app/en_US/backups (automatic local backups, not synced, External Folders excluded),
// https://help.ulysses.app/export (Text, HTML, ePub, PDF, DOCX).
// Scrivener: https://www.literatureandlatte.com/scrivener/overview (sections, research beside draft, composition mode,
// word/session targets, manual Snapshots and Compare, Compile to Word, PDF and ePub).
// Pinto: BRIEF.md (Apple Notes feel on iPhone and Mac, connected ChatGPT/Claude read and edit, Apple Notes import unchanged).
// Markdown storage: verified header of apple-notes-vs-obsidian and best-notes-app-for-mac.
// Earlier versions and restore: apple-notes-version-history's verified header; Pane/Model/NoteHistory.swift,
// Pane/Views/VersionHistoryView.swift. /blog/version-history is not registered; link the published Apple Notes history post.
// Export: Pane/Model/NoteExport.swift (Markdown files in folders, ZIP, skips locked notes),
// Pane/Views/RootView.swift (File, Export All Notes; File, Export as PDF), Pane/Editor/EditorAccessibility.swift (PDF).
// Word-count grep in Pane/: broad matches were unrelated string lengths and search helpers; targeted word-count search
// found only a search-ranking comment in TemplateAsk.swift. No editor word-count feature found; none claimed here.
// Picture: reused SHOTS.history, the existing Groceries version-history image. No new screenshots.

const FAQ = [
  { q: "Can I use Apple Notes to draft a novel?", a: [
    "Yes. Keep one note per scene and an index note linking to them. On a Mac, File, Duplicate Note makes a separate draft before a rewrite. For manuscript word targets and assembling chapters into a book, consider Ulysses or Scrivener.",
  ] },
  { q: "Which notes apps show a writer's word count?", a: [
    "Bear shows it in the Info Panel. Obsidian has a core Word count plugin. Ulysses and Scrivener are writing apps with word targets as well as counts.",
  ] },
  { q: "Is a notes app enough for writing articles?", a: [
    "It can be. Try drafting and exporting one complete article before moving your library. Check how you will save earlier drafts and whether the exported file works in the editor or publishing system that receives it.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="notes-app-for-writers"
      intro={<>Apple Notes suits ideas and short drafts. Bear adds writing statistics, Pinto Notes adds version history and connected AI, and Obsidian keeps research as linked files. For a whole manuscript, consider Ulysses or Scrivener.</>}
      answer={
        <Answer jump={[
          { href: "#at-a-glance", label: "Compare the six apps" },
          { href: "#apple-notes", label: "Writing in Apple Notes" },
          { href: "#pinto-notes", label: "Pinto Notes" },
          { href: "#writing-apps", label: "Ulysses and Scrivener" },
          { href: "#try-a-draft", label: "Try one draft" },
        ]}>
          <p>
            Choose Apple Notes for capturing ideas and drafting in the app you already use, Bear for Markdown with a word count,
            or Obsidian for research you keep as linked Markdown files. Pinto Notes suits writers who want Apple Notes&apos; feel
            with earlier versions and AI access; Ulysses and Scrivener are writing apps more than notes apps, with manuscript tools.
          </p>
          <PostCta slug="notes-app-for-writers" position="answer" title="Keep earlier drafts in Pinto Notes">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac, keeps earlier versions, and lets ChatGPT or Claude read and edit your notes once connected.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="at-a-glance">Six apps for different kinds of writing</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">App</th><th scope="col">Writing fit</th><th scope="col">Drafts and earlier text</th><th scope="col">Getting text out</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Apple Notes</th><td>Ideas and short drafts</td><td>Duplicate a note before rewriting</td><td>Selected note as PDF or Markdown on Mac</td></tr>
            <tr><th scope="row">Pinto Notes</th><td>Apple Notes feel with AI access</td><td>Version history with restore</td><td>Library as Markdown in a ZIP; PDF on Mac</td></tr>
            <tr><th scope="row">Bear</th><td>Markdown drafts with word count</td><td>Manual library backups</td><td>Markdown; DOCX, PDF and ePub need Pro</td></tr>
            <tr><th scope="row">Obsidian</th><td>Research linked to drafts</td><td>Local recovery snapshots; Sync has separate history</td><td>Notes are already Markdown files</td></tr>
            <tr><th scope="row">Ulysses</th><td>Focused writing with goals</td><td>Automatic local library backups</td><td>DOCX, PDF, ePub, HTML or text</td></tr>
            <tr><th scope="row">Scrivener</th><td>Chapters and research in one project</td><td>Take Snapshots before revisions</td><td>Compile into Word, PDF or ePub</td></tr>
          </tbody>
        </table>
      </div>
      <p>These are different ways to preserve work. A library backup, a recovery snapshot and a copy you make before editing are not interchangeable.</p>
      <h2 id="apple-notes">Apple Notes for writers who want to start there</h2>
      <p>
        Apple Notes saves as you type. A folder per project and a note per scene or article is a workable starting point.
        Keep research in separate notes so you can find a source without searching through a draft. Tags and pinned notes help
        keep an outline easy to find.
      </p>
      <p>
        To make an index on a Mac, write the scene titles in one note. Select a title, choose Edit, Add Link and pick its note.
        Before a substantial rewrite, select the draft and choose File, Duplicate Note. Give the copy a date and a clear name.
        That is a manual way to preserve a draft. The <a href="/blog/apple-notes-version-history">Apple Notes version-history guide</a>{" "}
        explains the limits of recovering earlier text.
      </p>
      <p>
        To hand a draft to another editor on a Mac, select the note, then choose File, Export To, PDF or Markdown.
        The <a href="/blog/export-apple-notes-to-markdown">Markdown export guide</a> covers what to check in the result.
        If you need a manuscript word target or a book export, compare the writing apps below.
      </p>

      <h2 id="pinto-notes">Pinto Notes for earlier drafts and connected AI</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac. It keeps notes as Markdown and has version history.
        On a Mac, open File, Version History, select an earlier version and choose Restore This Version to put its text back.
        Restoring keeps the text it replaces as another version too.
      </p>
      <Figure shot={SHOTS.history} caption="Version history for a Groceries note in Pinto Notes on a Mac. The view shows earlier text and a Restore This Version button." />
      <p>
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, it can read and edit your notes.
        You can ask it to read your research notes before suggesting an outline, then review the result yourself.
        Keep the source notes so you can check quotations and factual claims.
      </p>
      <p>
        On a Mac, File, Export All Notes saves a ZIP of Markdown files in their folders. Unlock any locked notes first to include them.
        File, Export as PDF saves the open note as a PDF. Those routes suit a draft you will finish elsewhere.
        If your handoff needs a Word document or an ebook, Ulysses and Scrivener offer those formats directly.
      </p>
      <p>
        Pinto Notes is Apple only, on iPhone and Mac, with no Windows, Android or web app.
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>

      <h2 id="bear">Bear for Markdown drafts with a word count</h2>
      <p>
        Bear combines Markdown with tags for organizing notes. Its Info Panel shows the word count and estimated reading time.
        On a Mac, Edit, Typewriter Mode keeps the line you are writing in the center of the editor.
        You can also hide the sidebar and note list to leave more room for the draft.
        See Bear&apos;s <a href="https://blog.bear.app/2023/07/get-started-with-bear/">getting-started guide</a> and{" "}
        <a href="https://bear.app/faq/typewriter-mode/">typewriter-mode instructions</a>.
      </p>
      <p>
        Markdown export is available in Bear&apos;s free version. DOCX, PDF and ePub export need Pro.
        Bear also documents manual library backups. Restoring one replaces the current library, so treat that as a different tool
        from restoring a single paragraph. Check its <a href="https://bear.app/faq/export-your-notes/">export formats</a> and{" "}
        <a href="https://bear.app/faq/backup-restore/">backup instructions</a> before moving your drafts.
      </p>

      <h2 id="obsidian">Obsidian for research kept as linked files</h2>
      <p>
        Obsidian stores notes as plain Markdown files in an ordinary folder. You can link a source note to a draft and open the
        files in another text editor. Its core Word count plugin shows the active note&apos;s word and character counts.
        This suits a writer who wants to manage the research files as well as write in them.
        Obsidian documents its <a href="https://obsidian.md/help/data-storage">file storage</a> and{" "}
        <a href="https://obsidian.md/help/plugins/word-count">word counter</a>.
      </p>
      <p>
        File recovery keeps local snapshots for seven days by default. They stay on the device that made them, and Obsidian says
        they are not a complete backup. Obsidian Sync has separate version history.
        Read the <a href="https://obsidian.md/help/plugins/file-recovery">recovery limits</a> and keep a separate backup of your work.
      </p>

      <h2 id="writing-apps">Ulysses and Scrivener for longer writing</h2>
      <h3>Ulysses for focused drafting and writing goals</h3>
      <p>
        Ulysses is a writing app more than a notes app. Its focused editor and projects suit articles or a manuscript in sections.
        You can set word goals for a sheet, group or project, including daily goals. It exports DOCX, PDF and ePub,
        as well as HTML and text. See its <a href="https://help.ulysses.app/goals">writing goals</a> and{" "}
        <a href="https://help.ulysses.app/export">export guide</a>.
      </p>
      <p>
        Automatic backups preserve the library locally. They do not sync between devices, and External Folders are excluded.
        Those details matter if you keep drafts outside the library. Ulysses explains how to restore work in its{" "}
        <a href="https://help.ulysses.app/en_US/backups">backup guide</a>.
      </p>
      <h3>Scrivener for assembling a manuscript</h3>
      <p>
        Scrivener is also a writing app more than a notes app. Write in sections, rearrange them, and keep research beside the draft.
        Composition mode hides the rest of the interface. Word targets can apply to the manuscript, a section or a writing session.
        Before a rewrite, take a Snapshot so you can compare or return to that text later.
      </p>
      <p>
        Compile assembles sections into a document, including Word, PDF or ePub. That is useful when separate scene drafts need
        to become one manuscript. Try compiling a sample before committing a whole project to it. The maker&apos;s{" "}
        <a href="https://www.literatureandlatte.com/scrivener/overview">Scrivener overview</a> describes these tools.
      </p>

      <h2 id="try-a-draft">Try one complete draft before switching</h2>
      <p>
        Use a short piece you are already working on. Write for twenty minutes with the editor arranged as you prefer, then revise
        a paragraph and recover its earlier wording. Export the draft and open it where you will submit or publish it.
        Choose the app that handles those steps with the least work for the kind of writing you do.
      </p>
      <p>
        Writing in Simplenote now? Here is <a href="/blog/simplenote-alternative-for-iphone-and-mac">how to export your notes and move them</a>.
      </p>
    </PostPage>
  );
}
