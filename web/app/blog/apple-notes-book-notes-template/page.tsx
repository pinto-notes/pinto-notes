import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-book-notes-template", { title: "Apple Notes book notes template, with the big idea" });

// Written 21 November 2026 for "book notes template" (Google autocomplete 20 Nov: book notes template notion, book
// notes template obsidian, book notes template google docs, reading notes template, how to take notes on a book;
// topic-research-2026-11-20.md row 21). The result page: Notion and Obsidian template pages, no Apple Notes page.
// Apple Notes facts, all from earlier posts tried on macOS 27: Edit, Paste as Markdown turns #, ## and "- [ ]" lines
// into a title, headings and checklists, a plain Command-V keeps the symbols, an empty item doesn't survive
// (apple-notes-templates); File, Duplicate Note (apple-notes-meal-planner-template); Edit, Add Link, Command-K, links
// to another note (apple-notes-ios-27, used the same way in apple-notes-recipe-template); typing #word makes a tag, and
// Smart Folder rules include Tags and Checklists: Unchecked (apple-notes-tags-smart-folders); search reads every word
// (apple-notes-recipe-template). Quotes go in as list lines in quotation marks, because Paste as Markdown was verified
// only for headings, lists and checklists (no > quotes, no bold); the #books tag is typed after the paste, since a tag line in a Markdown paste wasn't tried. Pinto side: web/content/templates/book-notes.json (one
// note, a ### section per book, newest first; the AI adds the book's heading when you start, files highlights as quotes
// with the page number and your thoughts as bullets in your own words, and when you finish writes the big idea in three
// sentences and two to four things you'll do differently as a checklist; the asks "Page 31: ..." and "I finished it.
// Wrap it up."). The picture is BlogSnapshots.bookNotesForTemplatePost: the template's own example, drawn offscreen by
// the Mac app's NoteDetailView.

const TEMPLATE = `# Four Thousand Weeks by Oliver Burkeman

## Lines worth keeping
- "The day will never arrive when you finally have everything under control." (p. 31)

## My thoughts
- The to-do list is infinite by design. Finishing it isn't the goal.
- Pick your three big projects; everything else waits.
- Saying no to good things is the hard part.

## The big idea
Life is short and attention is finite. Trying to do everything guarantees the important things get squeezed. Choose what to neglect, on purpose.

## What I'll do differently
- [ ] Keep a list of three active projects, no more
- [ ] Do the most important thing first, before email
- [ ] Keep one evening a week with nothing planned
`;

const INDEX = `# Books

## 2026
- Four Thousand Weeks by Oliver Burkeman
- Deep Work by Cal Newport
`;

const FAQ = [
  { q: "Does Apple Notes have a book notes template?", a: [
    "No. Apple Notes has no templates. One note per book, with headings for the quotes, your thoughts, the big idea and what you'll do differently, works as one, and you can paste the template on this page straight in.",
  ] },
  { q: "How do I take notes on a book?", a: [
    "Write down the lines that stop you, with the page number, and a short thought of your own next to them. When you finish, write the book's big idea in three sentences and one or two things you'll change.",
  ] },
  { q: "How do I find a quote again in Apple Notes?", a: [
    "Search reads every word in every note, so a few words from the quote find it. Tagging each book note #books also lets a Smart Folder gather them in one place.",
  ] },
  { q: "Is there a book notes app that works like Apple Notes?", a: [
    "Pinto Notes looks and works like Apple Notes and has a free book notes template. Send ChatGPT or Claude your highlights as you read and it files them under the book; when you finish, it writes up the big idea.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-book-notes-template"
      intro={<>
        A year after a good book, most people remember the cover and one idea, if that. A page of notes per book changes that. Here&apos;s a
        book notes template for Apple Notes to paste in, an index to keep them together, and where Notes stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#reading", label: "While you read" },
          { href: "#index", label: "Keep them together" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Notes that write the big idea" },
        ]}>
          <p>
            Apple Notes has no book notes template, but one note per book does the job: the lines worth keeping with their page numbers,
            your own thoughts, the big idea in three sentences once you finish, and a checklist of what you&apos;ll do differently. Copy the
            template below for every new book.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-book-notes-template" position="answer" template="book-notes" title="Want your highlights filed for you?">
            <p>Pinto Notes works like Apple Notes and has a free book notes template. Send ChatGPT or Claude a highlight as you read and it files it; when you finish, it writes up the big idea.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/book-notes-note" width={1520} height={1255} maxWidth={600}
        alt="A Book notes note in Pinto Notes on a Mac: Four Thousand Weeks by Oliver Burkeman with a quote from page 31, four thoughts, the big idea and a checklist of three things to do differently, then Deep Work by Cal Newport."
        caption="Book notes in Pinto Notes, a section per book, the way the template saves them. Example data. The headings, bullets and checklist work the same in Apple Notes." />}
      faq={FAQ}
    >
      <h2 id="template">The template: one note per book</h2>
      <p>
        Four parts, in the order you fill them. The quotes and your thoughts come while you read. The big idea and the checklist come once
        you finish, and they&apos;re the parts you&apos;ll come back for. Keep a word in every line, because an empty checklist item
        doesn&apos;t survive the paste.
      </p>
      <Keep title="Book notes for Apple Notes" text={TEMPLATE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />
      <p>
        On a Mac with macOS 27, Edit, Paste as Markdown turns the # line into the title, each ## line into a heading and the last part
        into a checklist. A plain Command-V keeps the symbols as text. On iPhone, type it in, select the last lines and tap the checklist
        button. For the next book, choose File, Duplicate Note and replace the words.
      </p>

      <h2 id="reading">While you read</h2>
      <ul>
        <li>
          <strong>Page number first.</strong> Type the page before the quote. It takes a second, and it&apos;s how you find the line
          again in the book.
        </li>
        <li>
          <strong>Your words, not a summary.</strong> A thought like &ldquo;saying no to good things is the hard part&rdquo; is worth more
          than a tidy paraphrase of the chapter.
        </li>
        <li>
          <strong>Write the big idea within a day.</strong> Three sentences, from memory, before you start the next book. If you
          can&apos;t, the book didn&apos;t stick, and that&apos;s worth knowing too.
        </li>
        <li>
          <strong>Make the checklist small.</strong> Two to four things you&apos;ll actually try. Tick them as they become habits.
        </li>
      </ul>

      <h2 id="index">Keep them together</h2>
      <p>
        Type #books under the title of each book note: that makes it a tag. A Smart Folder with the Tags rule set to books gathers every book note in one place, and
        adding the rule Checklists: Unchecked shows only the books with something you haven&apos;t tried yet.{" "}
        <a href="/blog/apple-notes-tags-smart-folders">Tags and Smart Folders</a> shows how to set one up. For passage study, the <a href="/blog/apple-notes-bible-study-template">Bible study template</a> keeps observations, questions and cross references apart.
      </p>
      <Keep title="Book index for Apple Notes" text={INDEX} />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Add Link"], keys: "⌘K" },
        { on: "iPhone", steps: ["Edit menu", "Add Link"] },
      ]} />
      <p>
        For an index by year, keep one more note, Books, and turn each title into a link: select it, choose Add Link and pick the
        book&apos;s note. Search reads every word in every note, so a few words of a quote find it even when you&apos;ve forgotten the
        book. Books you haven&apos;t read yet belong on a <a href="/blog/apple-notes-reading-list">reading list</a>, and more notes to
        paste in are in <a href="/blog/apple-notes-templates">Apple Notes templates</a>.
      </p>

      <h2 id="limits">Where book notes in Notes stop</h2>
      <ul>
        <li><strong>Every quote is typed by hand.</strong> Copying a line from a paper book means putting the book down, finding the note and typing it.</li>
        <li><strong>The big idea is the part people skip.</strong> Nothing reminds you to write it, and a week later it&apos;s harder.</li>
        <li><strong>The index is by hand.</strong> A new book isn&apos;t in it until you add its link.</li>
        <li><strong>Books stay apart.</strong> Search finds words. It can&apos;t tell you what three books on focus had in common.</li>
      </ul>

      <h2 id="pinto-notes">Book notes that write up the big idea</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/book-notes">book notes</a> template is one note with a section per book, newest
        first: the quotes, your thoughts, the big idea and what you&apos;ll do differently.
      </p>
      <p>
        Tell your AI which book you&apos;re reading and it starts the book&apos;s section. Send it a highlight as you go, like &ldquo;page
        31: the day will never arrive when you finally have everything under control&rdquo;, and it files it as a quote with the page
        number. Your own thoughts go in as bullets, in your words, without polishing. Say &ldquo;I finished it, wrap it up&rdquo; and it
        writes the big idea in three sentences and two to four things you&apos;ll do differently as a checklist. You can still write and
        edit every line yourself, and every earlier version of the note is kept.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        The book notes you already keep in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>,
        and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
