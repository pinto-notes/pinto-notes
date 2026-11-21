import { PostPage, postMetadata } from "@/lib/PostPage";
import { PostCta } from "@/lib/PostCta";
import { Answer, Checklist, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("google-keep-to-apple-notes", { title: "Google Keep to Apple Notes: how to move your notes" });

// Written 21 November 2026 for "google keep to apple notes". Google autocomplete (en-US, read 21 Nov):
// google keep to apple notes, google keep to apple notes transfer, google keep to apple notes converter,
// google keep to ios notes, google keep to iphone notes, google keep to icloud notes, import google keep
// to apple notes, export google keep to apple notes, sync google keep to apple notes, transfer google keep
// to iphone notes, can you transfer google keep to apple notes, how to move google keep notes to iphone notes.
//
// Google, read 21 Nov 2026:
// support.google.com/keep/answer/10017039 ("Export your data from Google Keep": only data that hasn't
// been deleted; the download has note text and list items, attachments such as voice recordings, drawings
// and images, colour, pinned and archived state, collaborators and the list of labels; work or school
// accounts may not get everything). It does not name the file types.
// support.google.com/accounts/answer/3024190 ("How to download your Google data": untick what you don't
// want, delivery by emailed link, Zip or Tgz, from a few minutes to a few days, the archive expires in
// about 7 days, each archive can be downloaded 5 times).
// support.google.com/keep/answer/6320648 ("Send a Keep note to another app": on the web, More, Copy to
// Google Docs). No import into Apple Notes or sync with it is described anywhere in Keep's help.
// The Keep folder's contents (an .html and a .json file per note, inside Takeout/Keep) are from Pinto
// Notes' own importer, Pane/Model/KeepImport.swift on main, which reads real Takeout downloads; the post
// says so and tells the reader to look in their own folder.
//
// Apple, read 21 Nov 2026:
// support.apple.com/en-us/102223 ("Import or share notes and files to the Notes app": on a Mac Notes
// imports .txt, .rtf, .rtfd, .html, .enex and .md; File, Import to Notes; "Preserve folder structure on
// import"; imports land in an Imported Notes folder; on iPhone, Files, Share, Notes, one file at a time).
// support.apple.com/guide/notes/not201900c07/mac ("Import, export, and print notes on Mac": the same list,
// File, Import to Notes or File, Import Markdown). support.apple.com/en-ie/guide/iphone/iph7262fd4fe/ios
// ("Add or remove accounts in Notes on iPhone": Settings, Apps, Notes, Notes Accounts; Google is one of
// the accounts Notes can use; some features aren't available in other accounts). Nothing on Apple's
// pages mentions Google Keep.
// From BRIEF's verified list: typing #word makes a tag, Smart Folders by tag, select lines and tap the
// checklist button, Search reads every word. Notes in a Google account sync over IMAP and Keep doesn't show
// them: verified in move-apple-notes-to-obsidian-notion-keep (12 Oct 2026).
//
// Pinto Notes: File, Import from Google Keep (Pane/Views/ImportSheet.swift); the guide opens Google's
// download page with only Keep ticked (Pane/Views/ImportGuide.swift, import-your-notes wording); labels
// become folders, or tags if you pick that ("Labels become" Folders or Tags); archived notes only if
// ticked, into Archive; notes in Keep's trash don't come; checklists keep their ticks, pins stay, pictures
// come as attachments; colours, drawings and reminders don't come and the summary counts them
// (Pane/Model/KeepImport.swift). Mac only for a whole library, as import-your-notes says.
// Picture: /blog/launch/import-google-keep-guide (the import-your-notes cover, Pinto's real Keep guide).

const FAQ = [
  { q: "Can Apple Notes import Google Keep notes?", a: [
    "Not directly. Apple Notes has no Google Keep option. On a Mac, File, Import to Notes takes .txt, .rtf, .rtfd, .html, .enex and .md files, so you can download your Keep notes with Google Takeout and import the .html files. On iPhone, copy and paste is the practical way.",
  ] },
  { q: "Can Google Keep sync with Apple Notes?", a: [
    "No. There's no sync between them in either direction. Adding your Google account to Apple Notes syncs Apple Notes' own notes into that account over IMAP, and Keep doesn't show those.",
  ] },
  { q: "Do Google Keep labels come across to Apple Notes?", a: [
    "Not as labels. Apple Notes has tags instead: type #work in a note and it becomes a tag you can find in the sidebar. Retag the notes that matter after the move.",
  ] },
  { q: "Does Google Takeout delete my Keep notes?", a: [
    "No. Takeout makes a copy for you to download, and everything stays in Keep. Notes you've already deleted in Keep aren't in the download.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="google-keep-to-apple-notes"
      intro={<>Apple Notes can&apos;t read Google Keep, and the two never sync. There are still two good ways across, and which one fits depends on how many notes you have.</>}
      answer={
        <Answer jump={[
          { href: "#copy-paste", label: "A few notes" },
          { href: "#takeout", label: "All your notes" },
          { href: "#what-comes-across", label: "What comes across" },
          { href: "#gmail", label: "Sync and Gmail" },
          { href: "#pinto-notes", label: "Pinto Notes" },
        ]}>
          <p>
            For a few notes, copy each one from Keep and paste it into a new note in Apple Notes. For all of them, download your Keep
            notes with Google Takeout, then on a Mac choose File, Import to Notes and pick the .html files from the Keep folder. Labels,
            colours and reminders stay behind either way, so check a handful of notes before you delete anything in Keep.
          </p>
          <PostCta slug="google-keep-to-apple-notes" position="answer" title="Or import Keep into a notes app like Apple Notes.">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. It imports your whole Google Keep download with checklists, pins and pictures, turns labels into folders, and lets ChatGPT or Claude read your notes.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="before">Before you start</h2>
      <p>
        Keep and Apple Notes don&apos;t work the same way. Keep sorts notes with labels and colours, and Apple Notes uses folders and
        tags. Whatever route you take, your notes arrive as plain notes, and the sorting is yours to redo.
      </p>
      <Checklist title="Before moving out of Google Keep" items={[
        "Move a test note with a checklist, a label and a picture, and open it in Apple Notes",
        "Write down your labels, to make them folders or tags afterwards",
        "Look in Keep's Archive too: archived notes are easy to forget",
        "Leave Keep as it is until you've checked everything",
      ]} />

      <h2 id="copy-paste">A few notes: copy and paste</h2>
      <p>
        This works on any device, iPhone included, and needs nothing installed. It&apos;s the right choice for a few dozen notes, and
        slow for hundreds.
      </p>
      <Steps>
        <li>
          <strong>Copy the note in Keep</strong>
          Open it in the Keep app or at keep.google.com, select all the text and copy it.
        </li>
        <li>
          <strong>Paste it into a new note in Apple Notes</strong>
          Put the Keep title on the first line. Apple Notes uses it as the note&apos;s title.
        </li>
        <li>
          <strong>Fix the checklists</strong>
          If a Keep checklist arrives as plain lines, select them and tap the checklist button.
        </li>
        <li>
          <strong>Check the pictures</strong>
          If a picture didn&apos;t come with the text, save it from Keep and add it to the note.
        </li>
      </Steps>

      <h2 id="takeout">All your notes: Google Takeout and a Mac</h2>
      <p>
        Google Takeout is Google&apos;s page for downloading your data. Keep&apos;s help says the download has every note that
        hasn&apos;t been deleted, with its text, list items, pictures, voice recordings and drawings, colour, pinned and archived state,
        and your labels. It makes a copy, and Keep doesn&apos;t change.
      </p>
      <Steps>
        <li>
          <strong>Ask Google for your Keep notes</strong>
          Go to takeout.google.com, untick everything except Keep, and go to the next step.
        </li>
        <li>
          <strong>Choose an emailed link and a .zip</strong>
          Google says the export takes from a few minutes to a few days; most arrive the same day. The link works for about 7 days,
          and each download can be made 5 times.
        </li>
        <li>
          <strong>Open the download on your Mac</strong>
          Double-click the .zip. Inside is a Takeout folder with a Keep folder in it.
        </li>
        <li>
          <strong>Import the .html files into Notes</strong>
          In Notes, select a folder under iCloud, choose File, Import to Notes, select the .html files in the Keep folder and click
          Import, then Import again to confirm.
        </li>
      </Steps>
      <Paths rows={[
        { on: "Mac", steps: ["File", "Import to Notes"] },
      ]} />
      <p>
        Google&apos;s help doesn&apos;t say which files the Keep folder holds. In the downloads Pinto Notes&apos; importer reads, there&apos;s
        an .html file and a .json file for each note. Apple Notes imports .txt, .rtf, .rtfd, .html, .enex and .md files, and .json
        isn&apos;t one of them, so pick only the .html ones. Each file becomes a note, and they all land in a new folder called
        Imported Notes.
      </p>
      <p>
        On iPhone there&apos;s no import menu. Apple&apos;s way is the Files app: touch and hold a file, tap Share, then Notes. That&apos;s
        one file at a time, so for a whole Keep library, use a Mac or copy and paste.
      </p>

      <h2 id="what-comes-across">What comes across</h2>
      <p>
        Apple doesn&apos;t say how an imported HTML file&apos;s lists and pictures turn out, which is what the test note is for. What
        you can count on:
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">In Keep</th><th scope="col">Copy and paste</th><th scope="col">Takeout and Import to Notes</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Text</th><td>Yes</td><td>Yes</td></tr>
            <tr><th scope="row">Checklists</th><td>May arrive as plain lines</td><td>Check the test note</td></tr>
            <tr><th scope="row">Pictures</th><td>One by one</td><td>Check the test note</td></tr>
            <tr><th scope="row">Labels</th><td>No</td><td>No: everything goes into Imported Notes</td></tr>
            <tr><th scope="row">Colours and reminders</th><td>No</td><td>No</td></tr>
            <tr><th scope="row">Notes on iPhone</th><td>Yes</td><td>Mac only</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        To bring your labels back, make a folder for each big one and move the notes in, or type the label as a tag, like #recipes,
        in each note. A Smart Folder can then collect every note with that tag. <a href="/blog/apple-notes-tags-smart-folders">Apple
        Notes tags and Smart Folders</a> shows how. Search reads every word in every note, so a note you can&apos;t place is still easy
        to find.
      </p>

      <h2 id="gmail">Keep doesn&apos;t sync with Apple Notes</h2>
      <p>
        Apple Notes can use a Google account. Under Settings, Apps, Notes, Notes Accounts, you can add Google and turn on Notes for it.
        That puts Apple Notes&apos; own notes in your Google account, synced over IMAP the way Mail is. It doesn&apos;t bring in Google
        Keep, and Keep never shows those notes. Apple also says some Notes features aren&apos;t available in accounts other than iCloud
        and On My iPhone, so iCloud is the better home for your Keep notes.
      </p>
      <p>
        Going the other way, from Apple Notes to Keep, is copy and paste only, because Keep can&apos;t import. <a
        href="/blog/move-apple-notes-to-obsidian-notion-keep">Move Apple Notes to Obsidian, Notion or Google Keep</a> covers it.
      </p>

      <p>
        Still deciding between the two? <a href="/blog/apple-notes-vs-google-keep">Apple Notes vs Google Keep</a> compares them feature by feature.
      </p>

      <h2 id="pinto-notes">Or import Keep into Pinto Notes</h2>
      <p>
        If you&apos;re leaving Keep for something that feels like Apple Notes, Pinto Notes is another route. It looks and works like
        Apple Notes on iPhone and Mac, it&apos;s a free download, and it reads the Google Keep download itself, so there&apos;s no sorting
        through .html files.
      </p>
      <PostFigure src="/blog/launch/import-google-keep-guide" width={1600} height={1000} maxWidth={640} kind="plain"
        alt="Pinto Notes' Google Keep import guide on a Mac: Bring your Google Keep notes, then step 1, Ask Google for your notes, with Keep ticked on Google's download page."
        caption="Import from Google Keep in Pinto Notes walks you through Google's download, one step at a time." />
      <p>
        On your Mac, choose File, Import from Google Keep. Pinto Notes opens Google&apos;s download page with only Keep ticked. Drop the
        download in, and your labels become folders (or tags, if you&apos;d rather). Checklists keep their ticks, pinned notes stay
        pinned, and pictures come along. Archived notes come only if you tick the box for them. Colours, drawings and reminders
        don&apos;t come, and the summary tells you how many notes had them. <a href="/blog/import-your-notes">Pinto Notes&apos; imports</a>{" "}
        covers the other apps it brings notes in from.
      </p>
      <p>
        Once your notes are in, ChatGPT or Claude can read and edit them, after a one-minute <a
        href="/blog/connect-chatgpt-to-your-notes">connection</a>. Every earlier version of each note is kept, so an edit is easy to undo.
        Pinto Notes runs on iPhone and Mac only: there&apos;s no Android, Windows or web app, so if you still use Keep on an Android
        phone, keep it there. If you already have notes in Apple Notes too, they come over in one import on your Mac, and Apple Notes
        isn&apos;t changed: see <a href="/blog/move-from-apple-notes">moving from Apple Notes</a>.
      </p>
    </PostPage>
  );
}
