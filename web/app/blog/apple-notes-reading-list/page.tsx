import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-reading-list", { title: "Apple Notes reading list template, with ratings" });

// Written 21 November 2026 for "apple notes reading list"; rebuilt 22 November 2026 in pattern E (lib/SideBySide.tsx).
// Apple Notes: blog-growth/research/apple-notes-captures-2026-11-22 (macOS 27.0). TEMPLATE: plain paste, the six lines from
// Title to The Overstory made a table with the Table button (five columns, six rows), Notes under it. SIMPLE: Edit, Paste as
// Markdown, To read as a checklist and Finished as a dashed list.
// Pinto Notes: the reading list template's note (content/templates/reading-list.json) with the same five books and notes,
// drawn by the Mac app offscreen (PaneTests/HIG/BlogSnapshots.swift, appleNotesSideBySide).

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
      cover={false}
      intro={<>One table of books: title, author, status, a rating out of 5 and why you wanted it.</>}
      answer={<>
        <Keep title="Reading list for Apple Notes" text={TEMPLATE} fold={10}
          note="After pasting, select the six lines from Title to The Overstory and press the Table button." />
        {/* Experiment B39: the download card back on the first screen, under the template. */}
        <PostCta slug="apple-notes-reading-list" position="answer" title="Want a reading list that fills itself in?">
          <p>Tell your AI about a book and Pinto Notes&apos; free reading list adds the row. Status and rating are picked, not typed.</p>
        </PostCta>
        <SideBySide slug="apple-notes-reading-list"
          apple={{ src: "/blog/side-by-side/reading-list-apple-notes", width: 1894, height: 672, line: "Holds the list. Status and rating are words you type.",
            alt: "The reading list template in Apple Notes on macOS 27: a table of five books with title, author, status, rating and why, and notes on two books under it." }}
          pinto={{ frame: false, title: "The same books in Pinto Notes", line: "Status and rating are picked, not typed. Tell your AI about a book and it adds the row.",
            alt: "The same five books in the Pinto Notes reading list template, from Project Hail Mary, finished with a 5, to The Overstory, to read, with the notes under the table.",
            phone: { src: "/blog/side-by-side/reading-list-pinto-phone", width: 780, height: 1100 },
            desk: { src: "/blog/side-by-side/reading-list-pinto-mac", width: 1520, height: 991 },
            template: "reading-list" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Paste the template into a new note, select the six lines from Title to The Overstory and press the Table button: <MenuPath steps={["Format", "Table"]} keys="⌥⌘T" /></li>
        <li>Add a book with Tab in the last cell. Status is one of four words: To read, Reading, Finished or Dropped.</li>
        <li>Keep the cells short; Notes sets the column widths itself. Longer thoughts go under Notes.</li>
      </Steps>
      <p>Rather have a checklist? Paste this one with Edit, Paste as Markdown, and tick a book when you finish it.</p>
      <Keep title="Reading checklist for Apple Notes" text={SIMPLE} fold={10} />
      <p>More for Apple Notes: <a href="/blog/apple-notes-tables">what tables in Notes can and can&apos;t do</a> and <a href="/blog/apple-notes-templates">five more templates</a>.</p>
    </PostPage>
  );
}
