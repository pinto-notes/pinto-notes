import { PostCta } from "@/lib/PostCta";
import { Figure } from "@/lib/blog";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-storage-limit", { title: "Apple Notes storage limit: iCloud space and attachments" });

// Written 21 November 2026 for "apple notes storage limit". Autocomplete read the same day (en-US): apple notes storage
// limit, apple notes storage size, iphone notes storage, apple notes limit, apple notes maximum attachments reached,
// apple notes maximum size, apple notes attachment limit, does apple notes have a limit, how much storage does notes
// take up, how much storage does apple notes have.
// Apple's pages, read 21 November 2026: Support 108922 (Manage your iCloud storage, published 14 September 2026: 5 GB
// free, what stops when storage is full), 108047 (iCloud+ plans and pricing, published 16 September 2026: 50 GB,
// 200 GB, 2 TB, 6 TB, 12 TB; no prices used), 103188 (Limits for iCloud Contacts, Calendars, Reminders, Bookmarks, and
// Maps, published 25 September 2025: no Notes limits), 108429 (How to check the storage on your iPhone, published
// 13 October 2026), the iCloud User Guide (Check your iCloud storage on any device: the Documents category includes data
// from Notes), the iPhone User Guide (Add photos, video, and more: View Attachments) and the Notes User Guide for Mac
// (Add photos, PDFs, and more: no attachments in Exchange accounts; View attachments: Show Attachments Browser, locked
// notes left out). None of these pages gives a number for note size, attachment count or attachment size.
// The messages in the limits table were read from Notes' own Localizable.loctable (Notes.app and NotesShared.framework)
// on macOS 27.2 on 21 November 2026. The numbers in them are filled in by the app and appear on no Apple page, so
// none is given here, and forum numbers aren't repeated.
// Earlier posts verified: a shared note uses its owner's iCloud storage, and On My iPhone and On My Mac notes stay on
// that device (apple-notes-not-syncing, move-apple-notes-to-icloud); Gmail notes live in the Gmail account
// (move-apple-notes-to-obsidian-notion-keep); Recently Deleted keeps notes 30 days (recover-deleted-apple-notes);
// Edit, Add Link (BRIEF.md list).
// Pinto side: syncs through its own encrypted service, so iCloud storage doesn't affect it (apple-notes-not-syncing,
// SyncEngine.swift); the Apple Notes import brings pictures, while PDFs and other attachments stay in Apple Notes,
// and Apple Notes isn't changed (move-from-apple-notes). No Pinto storage limit is stated: none is in the site copy.
// Pictures: Apple's iCloud settings image (as used in apple-notes-not-syncing) and SHOTS.iphoneFiles.

const FAQ = [
  { q: "Does Apple Notes have a storage limit?", a: [
    "Apple doesn't publish one for Notes. Notes in iCloud use your iCloud storage, which is 5 GB free and more with an iCloud+ plan. Notes does have limits inside a note, such as how many attachments it can hold, and says so with messages like Maximum attachments reached, but Apple doesn't give the numbers.",
  ] },
  { q: "How many attachments can one Apple Note have?", a: [
    "Apple doesn't say. Notes shows Maximum attachments reached when you hit the limit, and the help pages for iPhone, Mac and iCloud.com don't give a number. Numbers you read on forums aren't from Apple.",
  ] },
  { q: "Do Apple Notes count toward iCloud storage?", a: [
    "Yes, notes kept in iCloud do. Apple's iCloud guide counts data from Notes under Documents in your storage list. Notes in On My iPhone or On My Mac stay on that device, and Gmail notes are kept in your Gmail account.",
  ] },
  { q: "How much storage does the Notes app take up on iPhone?", a: [
    "Open Settings, General, iPhone Storage. It lists your apps with how much space each uses, and tapping Notes shows more detail. What Notes uses in iCloud is under Settings, your name, iCloud.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-storage-limit"
      intro={<>Apple Notes says Maximum attachments reached, or iCloud says it&apos;s full, and you want to know where the limit is. Here&apos;s what Apple states, and how to see what Notes takes up.</>}
      answer={
        <Answer jump={[
          { href: "#icloud", label: "iCloud storage" },
          { href: "#limits", label: "Limits inside a note" },
          { href: "#how-much", label: "What Notes takes up" },
          { href: "#make-room", label: "Making room" },
        ]}>
          <p>
            Apple doesn&apos;t publish a storage limit for Notes. Notes in iCloud use your iCloud storage, which starts at 5 GB free, with
            iCloud+ plans from 50 GB to 12 TB. Notes also has limits inside a note, such as how many attachments it holds, but Apple&apos;s
            guides and support pages don&apos;t give those numbers.
          </p>
          <PostCta slug="apple-notes-storage-limit" position="answer" title="Want notes that don't use your iCloud space?">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. It syncs through its own encrypted service rather than iCloud, so a full iCloud plan doesn&apos;t stop your notes syncing, and ChatGPT or Claude can work in them once connected.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} maxWidth={250}
        alt="The iCloud screen in iPhone Settings: storage at 4.1 of 50 GB, and under Saved to iCloud, Photos, Drive, Passwords, Notes with 29 items, Messages and Mail."
        caption="Settings, your name, iCloud: how full your storage is, with Notes among what's saved there. Image: Apple." />}
      faq={FAQ}
    >
      <h2 id="icloud">Notes share your iCloud storage</h2>
      <p>
        When you set up iCloud, you get 5 GB of storage for free, and iCloud+ plans come in 50 GB, 200 GB, 2 TB, 6 TB and 12 TB, per
        Apple&apos;s <a href="https://support.apple.com/en-us/108047" rel="noopener">iCloud+ plans page</a>. Apple lists no separate
        allowance for Notes. Apple&apos;s iCloud guide lists data from Notes under Documents, together with iCloud Drive files, Reminders, Health
        and other apps, so your notes share the same space as your photos, backups and Mail. A note shared with you is stored in its owner&apos;s iCloud, so the owner&apos;s storage counts, not yours.
      </p>
      <p>
        When the space runs out, Apple says your device stops backing up to iCloud, and iCloud Drive and other apps stop staying up to
        date across your devices. That&apos;s why a full plan often looks like a sync problem, covered in <a href="/blog/apple-notes-not-syncing">Apple
        Notes not syncing</a>. On a Mac, Notes says it outright when you move a note into a full iCloud:
        &ldquo;Your iCloud storage is full. Manage your storage and try moving the note again, get more storage, or move it to On My
        Mac.&rdquo;
      </p>

      <h2 id="limits">Limits inside a note</h2>
      <p>
        Apple&apos;s page of iCloud limits covers Contacts, Calendars, Reminders, Bookmarks and Maps, and doesn&apos;t mention Notes. The
        Notes guides for iPhone and Mac explain how to attach photos, PDFs and other files without giving any size or count. The app
        itself has limits, though. These are the messages in Notes on macOS 27.2:
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">Limit</th><th scope="col">What Notes says</th><th scope="col">Number from Apple</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Attachments in a note</th><td>Maximum attachments reached. Or: Too many attachments.</td><td>None published</td></tr>
            <tr><th scope="row">Size of one attachment</th><td>Some of these attachments are too large. Each attachment must be smaller than (a size the app fills in).</td><td>Only in the message</td></tr>
            <tr><th scope="row">Length of a note</th><td>Maximum note length reached.</td><td>None published</td></tr>
            <tr><th scope="row">Folders inside folders</th><td>Notes is limited to (a number) levels of folders.</td><td>Only in the message</td></tr>
            <tr><th scope="row">Locking a note</th><td>This note is too large to lock. You need to remove or reduce attachments and other content, then try again.</td><td>None published</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Forum threads quote numbers for some of these. Apple hasn&apos;t confirmed them, so we don&apos;t repeat them here. The account matters too: Apple says that in an Exchange account you can&apos;t attach files at
        all.
      </p>

      <h2 id="maximum-attachments">When Notes says Maximum attachments reached</h2>
      <p>
        Apple doesn&apos;t say how the limit is counted, so the safe way round is a new note for the next files. Link the two with Edit,
        Add Link (Command-K) so you can jump between them. To see what a note already holds, open the attachments view:
      </p>
      <Paths rows={[
        { on: "iPhone", steps: ["Notes list", "Folder Actions button", "View Attachments"] },
        { on: "Mac", steps: ["View", "Show Attachments Browser"] },
      ]} />
      <p>
        On iPhone, touch and hold a thumbnail and tap Show in Note to jump to it. On a Mac, Control-click an attachment to show its note,
        save it or share it. Neither view shows attachments in locked notes, so check those by opening them.
      </p>

      <h2 id="how-much">How much storage Notes takes up</h2>
      <Paths rows={[
        { on: "On your iPhone", steps: ["Settings", "General", "iPhone Storage", "Notes"] },
        { on: "In iCloud, iPhone", steps: ["Settings", "Your name", "iCloud", "Storage"] },
        { on: "In iCloud, Mac", steps: ["System Settings", "Your name", "iCloud", "Manage"] },
      ]} />
      <p>
        iPhone Storage lists your apps by the space each uses, and tapping one shows more. Apple notes that cached and temporary data
        might not count. The iCloud list puts the biggest users first, and Apple&apos;s guide counts Notes under Documents there. On
        iPhone the button may read Storage or Manage Account Storage.
      </p>
      <p>
        Only notes under the iCloud heading use iCloud storage. Notes in On My iPhone or On My Mac stay on that device, and notes under a
        Gmail account are kept in your Gmail account. <a href="/blog/where-are-apple-notes-stored">Where Apple Notes are stored</a> goes
        through each account.
      </p>

      <h2 id="make-room">Making room</h2>
      <ul>
        <li><strong>Free up or add iCloud space.</strong> Apple&apos;s own fix for full storage is deleting what you don&apos;t need elsewhere in iCloud, or moving to a bigger plan.</li>
        <li><strong>Move big notes to On My Mac.</strong> Notes offers this itself when iCloud is full. Those notes then stay on that Mac and stop syncing; <a href="/blog/move-apple-notes-to-icloud">moving notes between accounts</a> explains the trade-offs, including attachments that can be lost in a move.</li>
        <li><strong>Delete notes you don&apos;t need.</strong> They wait in Recently Deleted for 30 days before they&apos;re removed.</li>
      </ul>
      <p>
        Before you delete anything to make room, keep a copy. <a href="/blog/back-up-apple-notes">How to back up Apple Notes</a> shows the
        ways to do it, from one note to all of them.
      </p>

      <h2 id="pinto-notes">Notes that don&apos;t use your iCloud space</h2>
      <p>
        Pinto Notes is a notes app for iPhone and Mac that looks and works like Apple Notes. It syncs through its own encrypted service
        rather than iCloud, so iCloud storage doesn&apos;t affect it: a full plan doesn&apos;t stop your notes syncing, and your notes
        don&apos;t take space from your photos and backups. A note can hold pictures, PDFs and other files, as in Apple Notes. It&apos;s
        a free download for Mac, and on the App Store for iPhone.
      </p>
      <Figure shot={SHOTS.iphoneFiles} caption="A note holding a PDF, a CSV file, a photo and a link in Pinto Notes on iPhone." />
      <p>
        Your notes are Markdown files, and ChatGPT or Claude can read and edit them once you <a href="/blog/connect-chatgpt-to-your-notes">connect
        it</a>, which takes a minute. Apple Notes come over in one import on your Mac, as <a href="/blog/move-from-apple-notes">moving from
        Apple Notes</a> explains. Text and pictures come along; PDFs and other attachments stay in Apple Notes, and Apple Notes itself
        isn&apos;t changed.
      </p>
    </PostPage>
  );
}
