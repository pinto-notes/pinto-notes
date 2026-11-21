import { SHOTS } from "@/lib/posts";
import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Capture, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-for-school", { title: "Apple Notes for school: a setup for every class" });

// Written 21 November 2026 for "apple notes for school" (Google autocomplete 21 Nov, en-US: apple notes for school,
// apple notes for school reddit, using apple notes for school, apple notes app for school, apple notes for med school,
// apple notes for college, apple notes for college reddit, is apple notes good for school, how to use apple notes app
// for school notes, how to use apple notes for note taking; topic-research-2026-11-20.md row 13, notes-app-for-students:
// "notes app for students", "apple notes for students", "apple notes for university"; the row says write it as "Apple
// Notes for school, and what to add").
// Apple pages read on 21 Nov 2026 (en-us):
// - support.apple.com/guide/notes/record-and-transcribe-audio-apdb5106e334/mac (Attachment button, Record Audio; edit the
//   note while recording; Transcription button; More, Find in Transcript, Add Transcript to Note; Summary with Apple
//   Intelligence; transcription on M1 or later in listed languages)
// - support.apple.com/guide/iphone/record-and-transcribe-audio-iphbe11247b5/ios (Attachments button, Record Audio; swipe
//   down to take notes while recording; transcription on iPhone 12 and later; summaries on iPhone 15 Pro or later)
// - support.apple.com/guide/iphone/scan-text-and-documents-iph653f28965/ios (Attachments button, Scan Documents; automatic
//   capture; Done; saved as a PDF in the note; Scan Text inserts text)
// - support.apple.com/guide/iphone/search-notes-iphb8628c6b8/ios (search finds text in scanned documents and handwriting)
// - support.apple.com/guide/notes/manage-pdfs-and-scanned-documents-apdd655f4242/mac (Down arrow, Rename Attachment; a
//   scan is named Scanned Documents by default)
// - support.apple.com/guide/notes/add-and-remove-folders-apd558a85438/mac (File, New Folder; drag a folder onto another
//   for a subfolder) and support.apple.com/guide/iphone/organize-in-folders-ipha61270292/ios (New Folder button; touch and
//   hold a note, Pin Note)
// - support.apple.com/guide/notes/solve-math-apda85974595/mac (type an expression and =; variables defined above; Return
//   inserts the answer; Format, Math Results: Insert Results, Suggest Results, Off)
// - support.apple.com/guide/notes/share-notes-and-collaborate-apd4e6e2c9a6/mac and
//   support.apple.com/guide/iphone/share-and-collaborate-iphe4d04f674/ios (Share button, Share a Link, Share Folder, Can
//   edit or view, Send a Copy, everyone signed in to an Apple Account with Notes on in iCloud, no locked notes, notes added
//   to a shared folder are shared, @ mentions)
// Earlier posts' verified facts: Paste as Markdown, an empty checklist item doesn't survive (apple-notes-templates);
// File, Duplicate Note, Command-D (apple-notes-templates); Format, Table, Option-Command-T, tab-separated lines plus the
// Table button, no sort, no sum, fixed widths (apple-notes-tables); Edit, Add Link, Command-K (apple-notes-recipe-template);
// Smart Folder rule Checklists, Unchecked (apple-notes-tags-smart-folders).
// Pinto side: web/content/templates/cornell-notes.json (a section per lecture with a Cue and Notes table and a summary;
// "quiz me" asks the cues and keeps the missed ones under Cues to revisit) and study-flashcards.json (an app in a note;
// the AI makes five to ten cards from pasted notes, quizzes one card at a time, lowest box first, and cards you miss come
// back sooner). No hero picture: no school note in Apple Notes was captured. Body pictures are Apple's own iPhone
// screens (folders list, Math Results), the macOS 27 table and File menu captures from apple-notes-tables and
// apple-notes-templates, and SHOTS.flashcardsApp for the Pinto section.

const CLASS_NOTE = `# Biology

## This week
- [ ] Read chapter 4
- [ ] Lab report on enzymes
- [ ] Flashcards for cell respiration

## Lectures
- Cell respiration, 3 Nov
- Photosynthesis, 10 Nov

## Exams
- Midterm, 12 Dec
`;

const LECTURE = `# Cell respiration, 3 Nov

## Notes
- Glucose is broken down to make ATP, the cell's energy.
- Three stages: glycolysis, the Krebs cycle, the electron transport chain.
- Most ATP comes from the electron transport chain, in the mitochondria.

## To ask
- [ ] Where in the cell does glycolysis happen?

## Summary
Glucose becomes ATP in three stages, and most of it is made in the mitochondria.
`;

// Tabs between the columns: select those lines in Notes and press the Table button.
const TIMETABLE = `Day\tClass\tRoom
Monday\tBiology\tLab 2
Tuesday\tEconomics\tHall B
Thursday\tBiology\tLab 2
Friday\tEconomics\tRoom 14
`;

const MATH = `distance = 120
time = 1.5
distance / time =
`;

const FAQ = [
  { q: "Is Apple Notes good for school?", a: [
    "For taking and keeping notes, yes. It's free on iPhone and Mac, scans handouts, records lectures with a transcript and does sums. It's weaker for revision: there are no templates, flashcards or quizzes, and a shared note needs an Apple Account for everyone in the group.",
  ] },
  { q: "Can Apple Notes record a lecture and transcribe it?", a: [
    "Yes. In a note, open the attachments menu and choose Record Audio. Notes writes a live transcript in supported languages on an iPhone 12 or later or a Mac with M1 or later, and Apple Intelligence can summarize it where it's available.",
  ] },
  { q: "Can I revise for exams in Apple Notes?", a: [
    "Partly. A two-column table works as flashcards: a question on the left, the answer on the right, and you cover the right column to test yourself. Nothing schedules your reviews or remembers which cards you missed.",
  ] },
  { q: "Can I share Apple Notes with classmates?", a: [
    "Yes, a note or a whole folder, with Share a Link. Everyone needs an Apple Account with Notes turned on in iCloud, and a locked note can't be shared. For anyone else, Send a Copy sends a copy they can read but not edit.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-for-school"
      intro={<>
        Apple Notes is already on your iPhone and Mac, so it&apos;s where a lot of school notes end up anyway. Here&apos;s an honest
        answer to whether it&apos;s good enough for school or college, then a setup that lasts a whole term, from a folder per class to
        notes you share with a study group.
      </>}
      answer={
        <Answer jump={[
          { href: "#good", label: "Is it good for school?" },
          { href: "#folders", label: "A folder per class" },
          { href: "#lectures", label: "A note per lecture" },
          { href: "#record", label: "Record a lecture" },
          { href: "#study", label: "Cornell notes and flashcards" },
          { href: "#group", label: "Study groups" },
          { href: "#pinto-notes", label: "Notes that quiz you" },
        ]}>
          <p>
            Yes, for taking and keeping notes, especially if your study group uses iPhones and Macs too. It&apos;s free, scans handouts,
            records lectures with a transcript and does sums. Where it falls short is revision: no templates, flashcards or quizzes, so you
            build those yourself.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-for-school" position="answer" template="study-flashcards" title="Want notes that quiz you?">
            <p>Pinto Notes works like Apple Notes and has free Cornell notes and flashcards templates. Paste your lecture notes into ChatGPT or Claude and it writes the questions, then quizzes you.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="good">Is Apple Notes good for school?</h2>
      <p>
        For getting things down, it&apos;s very good. It&apos;s free, a note you type on your Mac is on your iPhone through iCloud, and search finds words
        in typed notes, handwriting and scanned pages. It scans a handout into a PDF, records a lecture and writes out what was said, and
        answers a sum when you type an equals sign.
      </p>
      <p>
        For revision, it gives you less. There are no templates, no flashcards and nothing that asks you questions or remembers what you
        got wrong. Tables don&apos;t sort or add up. A study group can work in one note only if everyone has an Apple Account. If your
        course is mostly memorizing, as med school is, take notes in Notes and plan your revision somewhere that schedules it.
      </p>

      <h2 id="folders">A folder per class</h2>
      <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="The Folders list in Notes on iPhone with iOS 27: Quick Notes and Shared, iCloud folders such as Notes, Gift Ideas and Grocery List, and a Tags section below."
        caption="The Folders list on iPhone. Each class gets a folder here. Image: Apple." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["File", "New Folder"] },
        { on: "iPhone", steps: ["Folders list", "New Folder button"] },
      ]} />
      <p>
        Make one folder for each class. To keep a term together, make a folder for the term and drag each class folder onto it, which
        turns them into subfolders. Next term, start a new one and the old classes stay out of the way.
      </p>
      <p>
        In each folder, keep one class note with what&apos;s due and a list of lectures, and pin it so it stays at the top (on iPhone,
        touch and hold the note, then Pin Note). Select a lecture&apos;s name and choose Edit, Add Link (Command-K) to link it to that
        lecture&apos;s note.
      </p>
      <Keep title="Class note for Apple Notes" text={CLASS_NOTE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
      <p>
        On a Mac with macOS 27, Edit, Paste as Markdown turns the # line into the title, each ## line into a heading and the homework into
        a checklist. Keep a word in every checklist line, because an empty item doesn&apos;t survive the paste. A Smart Folder with the
        rule Checklists, Unchecked then lists every note with something left to tick, homework included; <a href="/blog/apple-notes-tags-smart-folders">tags and
        Smart Folders</a> shows how to make one.
      </p>

      <h2 id="lectures">One note per lecture</h2>
      <Capture src="/blog/macos27/notes-file-duplicate-note" width={554} height={296} maxWidth={277}
        alt="The lower part of the File menu in Notes on macOS 27: Export To, Pin Note, Lock Note, Duplicate Note with Command-D, highlighted, and Print."
        caption="File, Duplicate Note starts the next lecture from the last one." />
      <p>
        Give every lecture its own note, titled with the topic and the date. Short notes are easier to find and to revise from than one
        long note per class. On a Mac, File, Duplicate Note (Command-D) copies last week&apos;s note with its headings, ready to clear and
        fill.
      </p>
      <Keep title="Lecture note for Apple Notes" text={LECTURE} />
      <p>
        In class, write only under Notes. Questions go under To ask as a checklist, so you can tick them once you have the answer. Write
        the summary the same evening, in two or three sentences of your own.
      </p>

      <h2 id="scan">Scan handouts into the lecture note</h2>
      <MenuPaths rows={[{ on: "iPhone", steps: ["Attachments button", "Scan Documents"] }]} />
      <p>
        Open the lecture&apos;s note on your iPhone, tap the Attachments button, then Scan Documents, and hold the page in view. The
        iPhone takes the picture when it finds the edges of the page. Scan the other pages, tap Done, and the handout is saved in the note
        as a PDF. Search finds the words in it later. For a single quote from a book, Scan Text in the same menu types the text into the
        note instead.
      </p>
      <p>
        A scan is named Scanned Documents. On a Mac, click the arrow next to its name and choose Rename Attachment to call it
        &ldquo;Week 3 handout&rdquo;.
      </p>

      <h2 id="record">Record a lecture, with a transcript and a summary</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Attachment button", "Record Audio"] },
        { on: "iPhone", steps: ["Attachments button", "Record Audio"] },
      ]} />
      <p>
        Ask your lecturer first: many schools have rules about recording. Then open the lecture&apos;s note, choose Record Audio from the
        attachments menu and press the Record button. You can keep typing while it records (on iPhone, swipe down from the top of the
        screen to get back to the note).
      </p>
      <p>
        Afterwards, open the recording and click the Transcription button to read what was said. Click a sentence to hear that moment.
        The More button has Find in Transcript, for the part where the exam came up, and Add Transcript to Note. Then click Summary and
        Apple Intelligence writes a short summary of the transcript.
      </p>
      <p>
        Transcripts need an iPhone 12 or later or a Mac with M1 or later, set to a supported language. Summaries need Apple Intelligence,
        which on iPhone means an iPhone 15 Pro or later, and it isn&apos;t available in every language or region. Deleting a recording
        deletes its transcript too.
      </p>

      <h2 id="tables">Tables for a timetable or a reading list</h2>
      <PostFigure src="/blog/macos27/notes27-table-reading-list" width={1400} height={554} maxWidth={700}
        phone={{ src: "/blog/macos27/notes27-table-reading-list-phone", width: 1098, height: 492 }}
        alt="A note called Reading list in Apple Notes on macOS 27, with a table of three columns, Book, Author and Started, and four books. Long titles wrap inside their cells."
        caption="A table in Apple Notes on macOS 27. Notes picks the column widths." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format", "Table"], keys: "⌥⌘T" },
        { on: "iPhone", steps: ["Table button"] },
      ]} />
      <Keep title="Timetable for Apple Notes" text={TIMETABLE}
        note="Each line has a tab between the columns. Paste it, then turn those lines into a table." />
      <p>
        Paste the timetable into a new note, select the five lines and press the Table button. Every tab becomes a column. Tab in the last
        cell adds a row. Tables in Notes can&apos;t sort, add up or change a column&apos;s width, so keep deadlines in date order as you
        type them. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> covers the rest.
      </p>

      <h2 id="study">Cornell notes and flashcards</h2>
      <p>
        A two-column table is also the simplest way to revise in Notes. For Cornell notes, put a short question on the left, your note on
        the right, and a summary under the table; cover the right column and answer out loud. The <a
        href="/blog/apple-notes-cornell-notes-template">Cornell notes template for Apple Notes</a> has one to paste in.
      </p>
      <p>
        Flashcards work the same way: one row per card, question and answer. What Notes can&apos;t do is decide which cards you see
        today, or bring back the ones you missed. <a href="/blog/apple-notes-flashcards">Flashcards in Apple Notes</a> shows the layout and
        the workarounds.
      </p>

      <h2 id="math">Math Results for homework sums</h2>
      <PostFigure src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={360}
        alt="A note called Sequoia Group Expenses on iPhone: each cost named on its own line, the names added up to $475, and $475 divided by 5 to $95 each."
        caption="Apple's own example of Math Results on iPhone: name the numbers, then use the names. Image: Apple." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Math Results"] }]} />
      <p>
        Type a sum and an equals sign, like (27/3)^2=, and Notes suggests the answer; press Return to keep it. Notes follows the usual
        order of operations, so add brackets where you need them. You can also name a number on a line above and use the name:
      </p>
      <Keep title="Named numbers for Math Results" text={MATH}
        note="Notes offers the answer after the last equals sign. Change a number above and the answer follows." />
      <p>
        Format, Math Results chooses whether answers are inserted, suggested or turned off. It gives you the answer, not the working, so
        it&apos;s best for checking a result.
      </p>

      <h2 id="group">Share notes with a study group</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Share button", "Pop-up menu", "Share a Link"] },
        { on: "iPhone", steps: ["Share button", "Menu under the title", "Share a Link"] },
      ]} />
      <p>
        Share a Link invites people to work in the same note, and everyone sees changes as they happen. Choose whether they can edit or
        only view. To share a whole class, Control-click its folder on a Mac and choose Share Folder, or open it on iPhone and tap the
        Share button. Any note you add to a shared folder is shared with everyone in it, so keep your private notes elsewhere. Type @ and
        a name to let someone know you need them.
      </p>
      <p>
        Everyone needs an Apple Account with Notes turned on in iCloud, and locked notes can&apos;t be shared. For a classmate without
        one, Send a Copy in the same menu sends a copy they can read but not edit.
      </p>

      <h2 id="limits">Where Apple Notes stops for school</h2>
      <ul>
        <li><strong>Every note is set up by hand.</strong> There are no templates, so each class note and lecture note is pasted or duplicated.</li>
        <li><strong>Nothing quizzes you.</strong> Covering a column works, but Notes won&apos;t ask the questions, keep score or bring back what you missed.</li>
        <li><strong>Tables only hold text.</strong> No sorting a deadline list and no adding up marks in a table.</li>
        <li><strong>Groups need Apple Accounts.</strong> A classmate on another kind of phone gets a copy, not the shared note.</li>
      </ul>

      <h2 id="pinto-notes">Notes that quiz you</h2>
      <Figure shot={SHOTS.flashcardsApp} caption="The Study notes and flashcards template in Pinto Notes on a Mac, with example data." />
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. Two of its free templates are made for revision, and one tap adds either to your notes.
      </p>
      <p>
        <a href="/templates/cornell-notes">Cornell notes</a> keeps a section per lecture with a Cue and Notes table and a summary. Paste
        your lecture notes into your AI and it writes a question for each row and the summary. Say &ldquo;quiz me on supply and
        demand&rdquo; and it asks the cues one at a time without showing the notes, then keeps the ones you missed under Cues to revisit.
      </p>
      <p>
        <a href="/templates/study-flashcards">Study notes and flashcards</a> is a small app in a note. Paste a chapter and your AI makes
        five to ten cards from it. Say &ldquo;quiz me on biology, ten cards&rdquo; and it asks one card at a time, the ones you know least
        first, and tells you if you were right. Cards you miss come back sooner, and cards you know wait longer. You can add, edit and
        delete cards in the app yourself, and every earlier version of a note is kept. The AI part works once you{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT</a> or Claude, which takes a minute.
      </p>
      <p>
        The class notes you already have in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>,
        and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
