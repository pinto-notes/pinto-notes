import { SHOTS } from "@/lib/posts";
import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Capture, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-tips", { title: "Apple Notes tips and tricks: 15 for iPhone and Mac" });

// Written 21 November 2026 for "apple notes tips and tricks" (Google autocomplete 21 Nov, en-US: apple notes tips and
// tricks, apple notes tips, iphone notes tips and tricks, ways to use apple notes, what can you do with apple notes,
// apple notes ideas, apple notes examples; BRIEF-compare post 8).
// Apple pages read on 21 Nov 2026 (en-us):
// - support.apple.com/guide/notes/create-a-quick-note-apdf028f7034/mac (hold Fn or Globe, press Q; bottom-right hot
//   corner; Safari Share button, Add to Quick Note; Quick Notes folder; Notes, Settings, Always resume to last Quick Note)
// - support.apple.com/guide/notes/add-lists-apd93c815aa0/mac (Checklist button; "Automatically sort checked items" in Notes
//   settings; Format, More, Check All or Uncheck All; Command-click an item checks or unchecks all; drag to reorder;
//   checklists need iCloud notes or notes on the Mac)
// - support.apple.com/guide/notes/format-notes-apd1955d3b21/mac (Format button, Heading or Subheading; Collapse Heading
//   and Expand Heading buttons, iCloud or On My Mac notes only; Format button, Highlight button, the coloured circle
//   next to it picks the colour)
// - support.apple.com/guide/notes/use-smart-folders-apd58edc7964/mac (File, New Smart Folder; rules such as Tags, Date
//   Created, Date Edited, mentions, checklists; can't be locked, nested or shared; deleting one keeps the notes)
// - support.apple.com/guide/notes/lock-your-notes-not28c5f5468/mac (More button, Lock Note; Mac login password or a
//   custom one, Touch ID; can't lock Quick Notes, shared notes, notes with tags, or notes with video, audio, PDF or
//   document attachments)
// - support.apple.com/guide/notes/sort-and-pin-notes-apdb54e469b6/mac (File, Pin Note; two-finger swipe right, Pin button)
// - support.apple.com/guide/notes/record-and-transcribe-audio-apdb5106e334/mac (Attachment button, Record Audio; Record,
//   Pause, Done; Transcription button; More button, Add Transcript to Note; Summary with Apple Intelligence, not in all
//   languages or regions; transcription on Macs with M1 or later)
// - support.apple.com/guide/iphone/scan-text-and-documents-iph653f28965/ios (Attachments button, Scan Documents; saved as
//   a PDF in the note; Scan Text, Insert)
// - support.apple.com/guide/iphone/search-notes-iphb8628c6b8/ios (search finds typed and handwritten text, text in scans,
//   objects in images, tags; locked notes show only their title; Note Actions button, Find in Note, Include Attachments)
// Earlier posts' verified facts: Paste as Markdown on macOS 27 (apple-notes-templates); File, Duplicate Note, Command-D
// (apple-notes-templates); Format, Table, Option-Command-T, tab-separated lines plus the Table button, no sort or sum
// (apple-notes-tables); Math Results and Format, Math Results (apple-notes-for-school); Edit, Add Link, Command-K and
// Link to Section on macOS 27 (apple-notes-ios-27); #word makes a tag, Smart Folder rule Checklists, Unchecked
// (apple-notes-tags-smart-folders); iPhone Settings, Apps, Notes, Sort Checked Items (apple-notes-checklist-sort);
// iPhone touch and hold, Pin Note (apple-notes-organize); no version history (recover-deleted-apple-notes).
// Pictures, reused for what they show: macOS 27 captures from move-from-apple-notes (hero), apple-notes-templates (File
// menu), apple-notes-ios-27 (Paste as Markdown, Link to Section), apple-notes-tags-smart-folders (Smart Folder), Apple's
// Math Results image from apple-notes-tables, and SHOTS.aiEdit for the Pinto tip.
// Pinto side: BRIEF Pinto facts; imports as worded in import-your-notes (File menu on the Mac: Apple Notes, Obsidian,
// Evernote, Google Keep, Bear, Markdown or text files).

const FAQ = [
  { q: "What can you do with Apple Notes?", a: [
    "More than most people use: checklists that sort themselves, tables, tags and Smart Folders, links between notes, sums with Math Results, scanned documents, audio recordings with a transcript, and locked notes. It all syncs between iPhone and Mac through iCloud.",
  ] },
  { q: "How do I start a Quick Note on a Mac?", a: [
    "Hold the Fn or Globe key and press Q, or move the pointer to the bottom-right corner of the screen. Quick Notes are saved in the Quick Notes folder in Notes.",
  ] },
  { q: "Can Apple Notes find text in a scanned document?", a: [
    "Yes. Notes search finds text in scanned documents, handwriting in supported languages and objects in pictures. To search a PDF attached to a note, open the note, choose Find in Note and turn on Include Attachments.",
  ] },
  { q: "Why can't I lock a note in Apple Notes?", a: [
    "Some notes can't be locked: Quick Notes, shared notes, notes with tags, and notes with a video, audio file, PDF or document attached. Remove the tag or the attachment, or stop sharing, and Lock Note works.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-tips"
      intro={<>
        Apple Notes looks simple, and it&apos;s easy to use it only for typing. It does a lot more, on the iPhone and Mac you already have. Here are
        the tips worth learning, each with where to find it, and ideas for what to keep in Notes.
      </>}
      answer={
        <Answer jump={[
          { href: "#capture", label: "Get it in fast" },
          { href: "#structure", label: "Give it shape" },
          { href: "#find", label: "Find it again" },
          { href: "#ideas", label: "Ideas" },
          { href: "#pinto-notes", label: "Your AI in your notes" },
        ]}>
          <p>
            The tips that save the most time: start a Quick Note with Fn-Q on a Mac, pin the notes you open every day, let checklists
            sort ticked items to the bottom, keep a template note and duplicate it, and make a Smart Folder of every unfinished
            checklist. All of it is built in, on iPhone and Mac.
          </p>
          <PostCta slug="apple-notes-tips" position="answer" title="Want ChatGPT or Claude in your notes?">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. Your AI can read and edit your notes, and every earlier version is kept.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/macos27/notes27-smart-folder-open-todos" width={2000} height={900} maxWidth={700}
        alt="A note in Apple Notes on macOS 27: a Plan for Saturday heading, a bulleted list, a checklist with Book the ferry ticked and Pack snacks open, the tag #weekend, a small table, a link to another note and a picture."
        caption="One Apple Notes note using five of the tips below: a heading, a checklist, a tag, a table and a link." />}
      faq={FAQ}
    >
      <p>
        The Mac steps are from Apple&apos;s Notes guide, read on 21 November 2026, and Notes on macOS 27. Checklists, headings you can fold
        away and pinned notes work in iCloud notes and notes stored on your device, not in notes kept in a Gmail or other mail account.
      </p>

      <h2 id="capture">Get it in fast</h2>
      <h3>1. Start a Quick Note from any app</h3>
      <p>
        On a Mac, hold the Fn or Globe key and press Q, and a small note opens over whatever you&apos;re doing. Moving the pointer to the
        bottom-right corner of the screen does the same. In Safari, the Share button has Add to Quick Note. Everything lands in the Quick Notes folder. If you want a fresh note each time, turn off Always resume to last Quick Note
        in Notes, Settings.
      </p>
      <MenuPaths rows={[{ on: "Mac", steps: ["Fn or Globe", "Q"] }]} />

      <h3>2. Scan paper straight into a note</h3>
      <p>
        On iPhone, open a note, tap the Attachments button and choose Scan Documents. Hold the page in view and it captures by itself;
        tap Done after the last page. The scan is saved as a PDF in the note. For a few lines of text, choose Scan Text instead, select
        the words and tap Insert, and they arrive as typed text you can edit.
      </p>
      <MenuPaths rows={[{ on: "iPhone", steps: ["Attachments", "Scan Documents"] }]} />

      <h3>3. Record a meeting and get a transcript</h3>
      <p>
        In a note, choose the Attachment button, then Record Audio, and click Record. The Transcription button shows a live
        transcript. Afterwards, double-click the recording and click the Transcription button; the More button there has Add Transcript
        to Note, which keeps the text in the note. With Apple Intelligence, Summary writes a summary of it. Transcription needs a Mac with M1 or later and a supported
        language, and Apple Intelligence isn&apos;t available in every language or region.
      </p>
      <MenuPaths rows={[{ on: "Mac", steps: ["Attachment", "Record Audio"] }]} />

      <h3>4. Paste Markdown from ChatGPT as real formatting</h3>
      <p>
        A plain Command-V keeps the # and - [ ] symbols as text. On a Mac with macOS 27, Edit, Paste as Markdown turns them into a title,
        headings and checklists. It&apos;s the quickest way to bring a list an AI wrote into Notes.
      </p>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="The same Markdown pasted twice in Apple Notes on macOS 27: with Command-V the symbols stay as text, and with Edit, Paste as Markdown it becomes a heading, a list and bold text."
        caption="A plain paste keeps the symbols. Paste as Markdown turns them into formatting." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />

      <h3>5. Keep template notes and duplicate them</h3>
      <p>
        Notes has no templates button, but any note can be one. Keep a meeting, packing or weekly plan note in a Templates folder,
        select it and choose File, Duplicate Note, then rename the copy. <a href="/blog/apple-notes-templates">Apple Notes
        templates</a> has five to paste in.
      </p>
      <Capture src="/blog/macos27/notes-file-duplicate-note" width={554} height={296} maxWidth={277}
        alt="The lower part of the File menu in Notes on macOS 27: Export To, Pin Note, Lock Note, Duplicate Note with Command-D, highlighted, and Print."
        caption="File, Duplicate Note, with Pin Note and Lock Note just above it." />
      <MenuPaths rows={[{ on: "Mac", steps: ["File", "Duplicate Note"], keys: "⌘D" }]} />

      <h2 id="structure">Give it shape</h2>
      <h3>6. Checklists that sort themselves</h3>
      <p>
        Select some lines and click the Checklist button. Turn on Automatically sort checked items in Notes, Settings, and each item you
        tick drops to the bottom, so what&apos;s left stays on top. On iPhone it&apos;s Settings, Apps, Notes, Sort Checked Items. To reuse
        a list, like a packing list, click in it and choose Format, More, Uncheck All. Command-clicking an item ticks or unticks the
        whole list at once.
      </p>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Notes", "Settings", "Automatically sort checked items"] },
        { on: "iPhone", steps: ["Settings", "Apps", "Notes", "Sort Checked Items"] },
      ]} />

      <h3>7. Headings you can fold away</h3>
      <p>
        Select a line, click the Format button and choose Heading or Subheading. Each heading gets a Collapse Heading button that hides
        the text under it, which keeps a long note short. Click Expand Heading to open it again.
      </p>

      <h3>8. Highlight what matters</h3>
      <p>
        Select some text, click the Format button, then the Highlight button. The coloured circle next to it picks the colour, so you
        can give deadlines one colour and open questions another.
      </p>

      <h3>9. Tables for anything with columns</h3>
      <p>
        Format, Table, or Option-Command-T, makes a two by two table, and Tab in the last cell adds a row. To turn a list into a table,
        put a tab between the columns on each line, select the lines and click the Table button. Tables hold text: they don&apos;t sort
        or add up. <a href="/blog/apple-notes-tables">Apple Notes tables</a> covers the rest.
      </p>
      <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Table"], keys: "⌥⌘T" }]} />

      <h3>10. Let Notes do the sums</h3>
      <p>
        Type a sum and an equals sign, like 1200 - 350 =, and Math Results fills in the answer. Give numbers names on their own lines
        (rent = 1200) and you can add up the names further down. Format, Math Results chooses whether answers are inserted, suggested or
        turned off.
      </p>
      <PostFigure src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={320}
        alt="A note called Sequoia Group Expenses on iPhone: each cost named on its own line, the names added up to $475, and $475 divided by 5 to $95 each."
        caption="Apple's own example of Math Results: name the numbers, then use the names. Image: Apple." />

      <h2 id="find">Find it again</h2>
      <h3>11. Pin the notes you open every day</h3>
      <p>
        Select a note and choose File, Pin Note, or swipe right on it with two fingers and click the pin. On iPhone, touch and hold the
        note, then tap Pin Note. A pinned note stays at the top of its folder, on every device.
      </p>
      <MenuPaths rows={[
        { on: "Mac", steps: ["File", "Pin Note"] },
        { on: "iPhone", steps: ["Touch and hold", "Pin Note"] },
      ]} />

      <h3>12. Link notes to each other</h3>
      <p>
        Select some words, choose Edit, Add Link and pick another note. On macOS 27 you can link straight to one of its headings with
        Link to Section. An index note with links, like a recipe box, turns a folder sorted by date into something you can browse.
      </p>
      <PostFigure src="/blog/macos27/notes27-link-to-section" width={980} height={710} maxWidth={490}
        alt="The Add Link dialog in Apple Notes on macOS 27. Link To says Spring garden plan, and the Link to Section menu is open, listing the note's title and its headings Raised beds, Seeds to order and Watering, with Seeds to order highlighted."
        caption="Add Link lists every heading in the note you link to." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Add Link"], keys: "⌘K" }]} />

      <h3>13. Tags and a Smart Folder for open to-dos</h3>
      <p>
        Type #work or #recipes anywhere in a note and it becomes a tag you can tap in the sidebar. A Smart Folder gathers notes by rule:
        choose File, New Smart Folder and add Checklists, Unchecked, and you get one folder of every note with something left to do.
        Deleting a Smart Folder leaves the notes where they are.{" "}
        <a href="/blog/apple-notes-tags-smart-folders">Tags and Smart Folders</a> has more rules worth setting up.
      </p>
      <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} maxWidth={640}
        alt="The New Smart Folder dialog in Apple Notes on macOS 27, named Open to-dos, with one rule: Checklists, Unchecked."
        caption="A Smart Folder of every note with an unticked item." />
      <MenuPaths rows={[{ on: "Mac", steps: ["File", "New Smart Folder"] }]} />

      <h3>14. Search inside scans, pictures and PDFs</h3>
      <p>
        Notes search finds typed and handwritten text, text in scanned documents and things in your photos, so searching
        a shop&apos;s name can find its scanned receipt. Inside one note, choose the Note Actions button, then Find in Note, and turn on
        Include Attachments to search an attached PDF too. Locked notes show only their title in results. To lock a private note,
        choose File, Lock Note on a Mac; notes with tags, audio or a PDF can&apos;t be locked.
      </p>

      <h2 id="ideas">Ideas: what to keep in Apple Notes</h2>
      <p>Each of these uses only the tips above.</p>
      <ul>
        <li><strong>A recipe box.</strong> One note per recipe, ingredients as a checklist, and a pinned index that links to each: the <a href="/blog/apple-notes-recipe-template">recipe template</a>.</li>
        <li><strong>A packing list.</strong> A checklist you reset with Uncheck All before every trip.</li>
        <li><strong>A shopping list.</strong> A checklist that sorts ticked items to the bottom as you shop.</li>
        <li><strong>A monthly budget.</strong> Named lines for each bill, totalled by Math Results.</li>
        <li><strong>Class or meeting notes.</strong> A heading per session, a recording with its transcript, and scans of the handouts.</li>
        <li><strong>A reading list.</strong> A table with title, author and a few words on each book.</li>
        <li><strong>Receipts and warranties.</strong> Scans in one folder, found again by search.</li>
      </ul>
      <p>
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> has notes to paste in for several of these.
      </p>

      <h2 id="pinto-notes">15. When you want your AI in your notes</h2>
      <p>
        Every tip above is about doing the work yourself. Apple Notes doesn&apos;t let ChatGPT or Claude read and edit your notes from your
        phone or the web, and it keeps no version history, so a change that removed text can&apos;t be undone later.
      </p>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac: folders, pinned notes, checklists and tables. Once you{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, which takes a minute, your AI can read and edit your
        notes from the chat you already use. Ask it to add five things to the shopping list, or to sum up last week&apos;s meetings.
        You see what changed, and every earlier version of a note is kept. Notes are stored as Markdown files and encrypted, and free
        templates add a note in one tap. It runs on iPhone and Mac only, with no Windows, Android or web app.
      </p>
      <Figure shot={SHOTS.aiEdit} caption="A Groceries note in Pinto Notes on a Mac after ChatGPT added five items, with Undo." />
      <p>
        On a Mac, the File menu imports from Apple Notes, Obsidian, Evernote, Google Keep, Bear, or Markdown and text files.{" "}
        <a href="/blog/move-from-apple-notes">Moving from Apple Notes</a> is one import, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
