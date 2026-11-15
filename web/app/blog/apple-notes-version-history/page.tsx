import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Capture, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-version-history", { title: "Apple Notes version history: there is none. What to do" });

// Written 13 November 2026 for "apple notes version history" and its variants (iphone, icloud, mac, "does apple notes have
// version history", "revision history", "undo changes"): blog-growth/topic-research-2026-11-13.md. What ranks: Apple Community
// threads (2016 to 2024) that say "no", Six Colors (March 2026) on shared-note activity, an App Store app. None says what can
// still be done. Facts: no version history for a note in Apple Notes (Apple Community; Mac Format 2018: Notes keeps its notes
// in one database, so File, Revert To and Time Machine's version browser don't apply). Shared notes: the Shared Note menu has
// Show All Activity and Show Highlights, who changed what and when, deletions not marked, no rollback (Six Colors, 2026).
// iCloud Backup leaves out notes already in iCloud (support.apple.com/en-us/108770). Pinto Notes: retention in
// supabase/migrations/20260929200000_version_history.sql (every version for 24 hours, the last of each hour for 7 days, the last
// of each day for 90 days, every AI edit for 90 days, at most 500 versions or 10 MB per note); restoring writes the old text as
// a new edit, so the text it replaces is kept too. Menus: File, Version History… on a Mac (RootView.swift), and the note's
// More menu on iPhone and Mac (NoteDetailView.swift, NoteMoreMenu.historyTitle). Duplicate Note: macOS 27 capture below.

const FAQ = [
  { q: "Does Apple Notes have version history?", a: [
    "No. Apple Notes keeps only the current text of a note, on iPhone, Mac and iCloud.com. Shared notes show who changed what, but you can't go back to an earlier version of any note.",
  ] },
  { q: "Can I undo changes in Apple Notes after closing the note?", a: [
    "Usually not. Undo works for changes you just made in the note you're editing. Once you've moved on, Apple Notes has no earlier version to go back to.",
  ] },
  { q: "Can Time Machine restore an old version of one note?", a: [
    "Not on its own. Apple Notes keeps every note in one database rather than one file per note, so Time Machine can't show you earlier versions of a single note the way it can for a document.",
  ] },
  { q: "Does iCloud keep old versions of my notes?", a: [
    "No. iCloud keeps your notes the same on every device, so a change reaches all of them. Apple says iCloud Backup doesn't include notes that are already stored in iCloud.",
  ] },
  { q: "Which notes apps keep version history?", a: [
    "Pinto Notes keeps earlier versions of every note, with who made each one, and puts any of them back with Restore This Version. Pages, Google Docs and Notion keep versions of their documents too.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-version-history"
      intro={<>
        You changed a note, or someone did, and the part you needed is gone. The obvious next step is an earlier version. Here&apos;s
        the short answer for Apple Notes, what can still bring the text back, and how to never be here again.
      </>}
      answer={
        <Answer jump={[
          { href: "#undo", label: "Undo, right away" },
          { href: "#shared", label: "Shared notes" },
          { href: "#other-device", label: "Another device" },
          { href: "#backups", label: "Backups" },
          { href: "#next-time", label: "Next time" },
        ]}>
          <p>
            Apple Notes has no version history, on iPhone, Mac or iCloud.com. Right after a change, Undo takes it back. A shared note
            shows who changed what, but can&apos;t roll back. After that, only a device that hasn&apos;t synced yet, or a backup with the
            note in it, still has the old text.
          </p>
          {/* Experiment B1: the download where readers are. */}
          <PostCta slug="apple-notes-version-history" position="answer" title="Want every version kept?">
            <p>Pinto Notes works like Apple Notes and keeps earlier versions of every note, with Restore This Version. Your Apple Notes come over in one import.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/notes-same-note-three-devices" width={814} height={412} maxWidth={600}
        alt="The same handwritten note, Urban planner, open in Notes on a MacBook, a tablet and an iPhone at once."
        caption="iCloud keeps one copy of a note, the same on every device. A change replaces it everywhere. Image: Apple." />}
      faq={FAQ}
    >
      <h2 id="none">Does Apple Notes have version history?</h2>
      <p>
        No. Apple Notes keeps the current text of each note and nothing before it. Pages and Numbers have Browse All Versions; Notes
        doesn&apos;t, and its notes live in one database rather than in files, so a Mac&apos;s Time Machine can&apos;t show you an
        earlier version of a single note either. iCloud keeps every device the same, which means a change, or a mistake, reaches
        all of them within seconds.
      </p>
      <p>
        That still leaves a few ways to get text back, depending on how long ago it happened. Try them in this order.
      </p>

      <h2 id="undo">Right after the change: Undo</h2>
      <p>
        If you&apos;re still in the note, Undo is the only real version history Apple Notes has. On a Mac, choose Edit, Undo, or press
        Command-Z, as many times as you need. On iPhone, swipe left with three fingers, or shake the phone and tap Undo. It works for
        what you just did in that note; once you&apos;ve moved on, it usually can&apos;t reach back.
      </p>
      <p>
        If the whole note is gone rather than changed, that&apos;s a different case: it&apos;s probably in Recently Deleted for 30 days,
        and <a href="/blog/recover-deleted-apple-notes">how to recover deleted Apple Notes</a> walks through it.
      </p>

      <h2 id="shared">In a shared note: see who changed what</h2>
      <p>
        If the note is shared, Notes keeps a record of who edited it. Tap or click the shared note button at the top of the note,
        then choose Show All Activity for a list of edits by person and date, or Show Highlights to mark each change in the margin
        with its author.
      </p>
      <p>
        It tells you who and when, which is often enough to ask the person what was there. It won&apos;t restore anything: deleted
        text isn&apos;t marked, and there&apos;s no way to roll the note back to an earlier edit.
      </p>

      <h2 id="other-device">On a device that hasn&apos;t synced yet</h2>
      <p>
        A Mac that&apos;s been asleep, or an old iPhone in a drawer, may still have the old note, until it connects and syncs. Before you open
        Notes on it, turn on Airplane Mode (or turn off Wi-Fi on the Mac). Then open the note, select the text you need and copy it
        into a new note in <strong>On My iPhone</strong> or <strong>On My Mac</strong>, or into another app. Only then go back online.
        The note itself will update to the new version, but your copy stays.
      </p>
      <p>
        This only works if that device really hasn&apos;t synced since the change. If it has, it shows the same text as everywhere
        else.
      </p>

      <h2 id="backups">From a backup</h2>
      <ul>
        <li>
          <strong>Notes in iCloud:</strong> not in an iPhone backup. Apple says{" "}
          <a href="https://support.apple.com/en-us/108770" rel="noopener">iCloud Backup doesn&apos;t include notes already stored in
          iCloud</a>, so restoring a phone won&apos;t bring back an old version of them.
        </li>
        <li>
          <strong>Notes in On My iPhone:</strong> they are in the iPhone&apos;s backup, but restoring a backup replaces everything on
          the phone with how it was then. That&apos;s rarely worth it for one note.
        </li>
        <li>
          <strong>An export you made earlier:</strong> if you ever exported your notes as files, the old text is in that file. This is
          the one backup that works for a single note. <a href="/blog/back-up-apple-notes">How to back up Apple Notes</a> shows how to
          make one.
        </li>
      </ul>

      <h2 id="next-time">Next time: keep a copy before big changes</h2>
      <Capture src="/blog/macos27/notes-file-duplicate-note" width={554} height={296} maxWidth={277}
        alt="The lower part of the File menu in Notes on macOS 27: Export To, Pin Note, Lock Note, Duplicate Note with Command-D, highlighted, and Print."
        caption="File, Duplicate Note (Command-D) on a Mac makes a copy before you rewrite a note." />
      <p>
        With no history to fall back on, the habit that helps is a copy. Before you rewrite a note, or let anyone else edit it, choose
        File, Duplicate Note on a Mac (Command-D). On iPhone, select all the text and paste it into a new note. A regular export to files, once a week, covers everything else.
      </p>

      <h2 id="pinto-notes">A notes app that keeps every version</h2>
      <Figure shot={SHOTS.history} caption="Version history in Pinto Notes on a Mac: each earlier version, who made it, the lines that differ, and Restore This Version." />
      <p>
        That&apos;s why I made Pinto Notes. It looks and works like Apple Notes on iPhone and Mac, and it keeps earlier versions of every
        note: every version from the last 24 hours, then the last one of each hour for a week, and the last one of each day for 90
        days. Each version says who made it, you on your iPhone or Mac, or ChatGPT or Claude if you let them edit your notes, and
        the lines that differ are tinted.
      </p>
      <PostFigure src="/blog/launch/version-history-list" width={520} height={960} maxWidth={300}
        alt="A note's version history in Pinto Notes: the current version by you on iPhone, 4:35 by ChatGPT, 13:35 by you on Mac with 3 edits, 13:30 by you on iPhone and 1:30 by Claude Code."
        caption="The list of versions, newest first: you on iPhone, ChatGPT, you on the Mac, Claude Code." />
      <p>
        Choose File, Version History on a Mac, or Version History in the note&apos;s More menu on either device, pick a version and
        choose Restore This Version. Restoring is itself saved as a new version, so the text it replaces isn&apos;t lost either.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t
        changed, so you can try it without giving anything up.
      </p>
    </PostPage>
  );
}
