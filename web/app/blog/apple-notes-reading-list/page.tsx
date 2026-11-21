import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-reading-list", { title: "Apple Notes reading list template, with ratings" });

// Written 21 November 2026 for "apple notes reading list" (Google autocomplete 20 Nov: "apple notes reading list", one
// suggestion; topic-research-2026-11-20.md row 33, a cheap copy of the working template post shape). Result page not
// checked. Apple Notes facts, all from earlier posts tried on macOS 27: type rows with a tab between columns, select them
// and press the Table button; Format, Table (Option-Command-T); Tab in the last cell adds a row; column widths can't be
// dragged; tables don't add up or sort (apple-notes-tables, wording copied from apple-notes-cornell-notes-template).
// Edit, Paste as Markdown turns #, ## and "- [ ]" lines into a title, headings and checklists, a plain Command-V keeps
// the symbols, an empty item doesn't survive (apple-notes-templates). "Automatically sort checked items" in the Notes
// settings (apple-notes-habit-tracker). Pin a note to the top of its folder and search reads every word
// (apple-notes-recipe-template). Sharing a note needs an Apple Account for each person (apple-notes-meeting-notes-template,
// from support.apple.com/102462). Paste as Markdown is NOT used for the table: only headings, lists and checklists were
// verified for it. Pinto side: web/content/templates/reading-list.json (a Books table with Title, Author, Status as a
// choice of To read, Reading, Finished or Dropped, Rating as a 1 to 5 scale and Why, then Notes with a ### heading per
// book; the AI files a book you mention as To read with who recommended it, updates Status and Rating, and suggests what
// to read next from To read based on what you rated highly; the asks "Finished Piranesi. Five stars." and "What should
// I read next?"). The picture is BlogSnapshots.readingListForTemplatePost: the template's own example, drawn offscreen
// by the Mac app's NoteDetailView.

// Tabs between the columns: select the six table lines in Notes and press the Table button.
const TEMPLATE = `Reading list

Title\tAuthor\tStatus\tRating\tWhy
Project Hail Mary\tAndy Weir\tFinished\t5\tBook club
Piranesi\tSusanna Clarke\tReading\tNot yet\tFrom Jonas
War and Peace\tLeo Tolstoy\tDropped\t2\tGave up, p. 90
Never Let Me Go\tKazuo Ishiguro\tFinished\t4\tHoliday read
The Overstory\tRichard Powers\tTo read\tNot yet\tSara lent it

Notes
Project Hail Mary: The friendship carries the whole book. Lending my copy to Dad next.
Never Let Me Go: Quiet and strange. I kept thinking about it for weeks after.
`;

const SIMPLE = `# Reading list

## To read
- [ ] Piranesi by Susanna Clarke (from Jonas)
- [ ] The Overstory by Richard Powers (Sara lent it)

## Finished
- Project Hail Mary by Andy Weir: 5 out of 5
- Never Let Me Go by Kazuo Ishiguro: 4 out of 5
`;

const FAQ = [
  { q: "How do I make a reading list in Apple Notes?", a: [
    "Make one note called Reading list with a table of title, author, status, rating and why. For something simpler, use a checklist of books to read and tick each one when you finish it.",
  ] },
  { q: "Can I sort my reading list in Apple Notes?", a: [
    "No. Tables in Notes don't sort, so books stay in the order you added them. A checklist can move ticked books to the bottom if you turn on Automatically sort checked items in the Notes settings.",
  ] },
  { q: "Can I share a reading list with my book club?", a: [
    "Yes. Share the note and everyone can add to it, but each person needs an Apple Account.",
  ] },
  { q: "Is there a reading list app that works like Apple Notes?", a: [
    "Pinto Notes looks and works like Apple Notes and has a free reading list template with status and a 1 to 5 rating. Tell ChatGPT or Claude about a book and it files it; ask what to read next and it suggests one from your list.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-reading-list"
      intro={<>
        Books people recommend end up in screenshots, messages and browser tabs, and they&apos;re gone by the time you want something to
        read. Apple Notes can hold them in one note. Here&apos;s a reading list template for Apple Notes, a simpler checklist version, and
        where Notes stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#checklist", label: "A simpler checklist" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A list that files itself" },
        ]}>
          <p>
            Apple Notes has no reading list template, but one note with a table does the job: title, author, status, a rating out of 5
            and why you wanted it. Add a row when someone recommends a book, and write a few lines under Notes when you finish one.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-reading-list" position="answer" template="reading-list" title="Want your books filed for you?">
            <p>Pinto Notes works like Apple Notes and has a free reading list template. Tell ChatGPT or Claude about a book and it adds the row; ask what to read next and it picks from your list.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/reading-list-note" width={1520} height={1153} maxWidth={600}
        alt="A Reading list note in Pinto Notes on a Mac: a Books table of five books with title, author, status, rating and why, from Project Hail Mary, finished with a 5, to The Overstory, to read, then notes on two books."
        caption="A reading list in Pinto Notes, where Status is a choice and Rating a 1 to 5 scale. Example data. In Apple Notes the same table works with the words typed in." />}
      faq={FAQ}
    >
      <h2 id="template">The template: one table of books</h2>
      <p>
        Five columns are enough. Status is one of four words: To read, Reading, Finished or Dropped. Why is the column you&apos;ll thank
        yourself for: in a year, &ldquo;From Jonas&rdquo; tells you more than the title does. Dropped books stay on the list, so you
        don&apos;t pick them up again by mistake.
      </p>
      <Keep title="Reading list for Apple Notes" text={TEMPLATE}
        note="Each table line has a tab between the columns. Paste it, then turn those lines into a table." />

      <h2 id="set-up">Set it up</h2>
      <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Table"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Paste, then make the table.</strong> Paste the template into a new note, select the six lines from Title to The
          Overstory, and press the Table button. Every tab becomes a column, so you get five columns side by side.
        </li>
        <li>
          <strong>Add a book in a second.</strong> Click in the last cell and press Tab: a new row appears for the next book.
        </li>
        <li>
          <strong>Keep the cells short.</strong> Notes sets the column widths itself and you can&apos;t drag them, so five columns share
          the room. Longer thoughts go under Notes, below the table.
        </li>
        <li>
          <strong>Pin it.</strong> Pin the note to the top of its folder, so it&apos;s the first thing you see when a friend says
          &ldquo;you have to read this&rdquo;.
        </li>
      </ul>
      <p>
        Search reads every word in the note, so searching an author or a friend&apos;s name finds the list. To share it with a book club,
        share the note; each person needs an Apple Account. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> covers
        everything else a table can and can&apos;t do.
      </p>

      <h2 id="checklist">A simpler checklist version</h2>
      <p>
        If a table is more than you want, a checklist works. Books to read go in a checklist, and you tick one when you finish it. Keep a
        word in every line, because an empty checklist item doesn&apos;t survive the paste.
      </p>
      <Keep title="Reading checklist for Apple Notes" text={SIMPLE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />
      <p>
        On a Mac with macOS 27, Edit, Paste as Markdown turns the # line into the title, the ## lines into headings and the books into a
        checklist. A plain Command-V keeps the symbols as text. On iPhone, type it in, select the books and tap the checklist button. Turn
        on Automatically sort checked items in the Notes settings and the books you&apos;ve finished drop to the bottom. When you want
        to remember one, move it under Finished with a rating.
      </p>
      <p>
        To keep more than a rating, keep a note for each book with its
        quotes, your thoughts and the big idea. More notes to paste in are in{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a>.
      </p>

      <h2 id="limits">Where a reading list in Notes stops</h2>
      <ul>
        <li><strong>No sorting or filtering.</strong> Tables don&apos;t sort, so finding every To read book means reading down the Status column.</li>
        <li><strong>Status is just text.</strong> Nothing stops &ldquo;Finished&rdquo; and &ldquo;Done&rdquo; ending up in the same column.</li>
        <li><strong>Every book is typed by hand.</strong> A recommendation in a message isn&apos;t on the list until you copy it across.</li>
        <li><strong>The list can&apos;t answer.</strong> It holds what you rated highly, but it can&apos;t tell you which To read book is most like the ones you loved.</li>
      </ul>

      <h2 id="pinto-notes">A reading list that files itself</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/reading-list">reading list</a> template is one note with a Books table and a Notes
        section. Status is a choice of To read, Reading, Finished or Dropped, and Rating is a scale from 1 to 5, so you pick them
        instead of typing them.
      </p>
      <p>
        Tell your AI about a book and it adds a row: the title, the author, To read, and who recommended it or why you want it. Say
        &ldquo;finished Piranesi, five stars&rdquo; and it updates the status and the rating. Your thoughts on a book go under Notes, under
        its title. Ask &ldquo;what should I read next?&rdquo; and it suggests one from your To read books, based on what you rated
        highly. You can still add and edit every row yourself, and every earlier version of the note is kept.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        The reading list you already keep in Apple Notes comes over in <a href="/blog/move-from-apple-notes">one import on your
        Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
