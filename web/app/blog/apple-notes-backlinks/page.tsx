import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-backlinks", { title: "Does Apple Notes have backlinks? No. What to do instead" });

// Written 18 November 2026 for "apple notes backlinks", "apple notes backlink" and "does apple notes have backlinks"
// (blog-growth/topic-research-2026-11-13.md #6). What ranks: Digital Trends, an Apple Community thread asking for backlinks,
// 9to5mac and MacRumors from 2023 on the linking feature, a substack. None gives a complete answer. Apple facts: Add links in
// Notes on Mac (support.apple.com/guide/notes/apde615d29c2/mac): Edit, Add Link, pick the note; ">>" in the note body; a link
// named with the note's title updates when it's renamed; nothing about seeing what links to a note. iOS 27 and macOS 27 added
// links to a section (our apple-notes-ios-27 post). No backlinks in iOS 26 or 27 (Apple's guides, MacRumors iOS 26 notes).
// Pinto Notes: [[Title]], [[Title|shown text]], [[Title#Heading]] (Pane/Model/WikiLinks.swift); "/ Link to Note" (SlashCommands);
// Linked From in the note's ••• menu, real links only, newest first, up to 50 and then "N More" (NoteDetailView LinkedFromMenu,
// shipped in 1.4, tag mac-v1.4); renaming a note retargets [[links]] to it (retargetWikiLinks); an AI's fetch lists what links to
// a note (MCP instructions). Pictures: PaneTests/HIG/BlogSnapshots linkedFromForBacklinksPost, offscreen, from main.

const FAQ = [
  { q: "Does Apple Notes have backlinks?", a: [
    "No. You can link one note to another in Apple Notes, but a note never shows which notes link to it. That's true on iPhone and Mac, in iOS 27 and macOS 27 too.",
  ] },
  { q: "How do I see which notes link to a note in Apple Notes?", a: [
    "Search for the note's title. Apple Notes finds notes whose text includes it, which covers links named with the title, plus notes that only mention it. A link you gave its own name won't show up.",
  ] },
  { q: "Does Apple Notes have wiki links like Obsidian?", a: [
    "Close. Type >> in a note and then a note's title to link to it, or use Add Link. Since iOS 27 and macOS 27 a link can also go to a heading in a note. There's no [[double bracket]] syntax and no list of links back.",
  ] },
  { q: "What happens to a link in Apple Notes when I rename the note?", a: [
    "If the link is named with the note's title, it updates to the new title. A link you named yourself keeps its name and still opens the note.",
  ] },
  { q: "Which notes apps have backlinks?", a: [
    "Obsidian and Notion show the pages that link to a page. Pinto Notes, which works like Apple Notes on iPhone and Mac, lists them under Linked From in each note's menu.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-backlinks"
      intro={<>
        Apple Notes can link one note to another. What it can&apos;t do is the other direction: open a note and see every note that
        links to it. Here&apos;s what Apple Notes does have, how to find those notes anyway, and an app that lists them for you.
      </>}
      answer={
        <Answer jump={[
          { href: "#link", label: "Link notes" },
          { href: "#find", label: "Find links back" },
          { href: "#two-way", label: "Two-way by hand" },
          { href: "#pinto-notes", label: "Real backlinks" },
        ]}>
          <p>
            No. Apple Notes has links between notes (type <code>&gt;&gt;</code> and a title) and, since iOS 27, links to a heading, but
            no backlinks: a note never shows what links to it. Searching for the note&apos;s title finds most of them.
          </p>
          <PostCta slug="apple-notes-backlinks" position="answer" title="Want to see what links to a note?">
            <p>Pinto Notes works like Apple Notes, links notes with [[double brackets]], and lists every note that links to this one under Linked From. Your Apple Notes come over in one import.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/macos27/notes27-link-to-section" width={980} height={710} maxWidth={490}
        alt="The Add Link dialog in Apple Notes on macOS 27. Link To says Spring garden plan, and the Link to Section menu is open, listing the note's headings Raised beds, Seeds to order and Watering."
        caption="Apple Notes links forward: Add Link picks a note, or a heading in it. Nothing shows the links coming back." />}
      faq={FAQ}
    >
      <h2 id="none">Does Apple Notes have backlinks?</h2>
      <p>
        No. A backlink is the list, on a note, of the other notes that link to it. Obsidian and Notion show one under every page, so a
        note about a person or a project collects every meeting and plan that mentions it, without you keeping a list. Apple Notes
        added links between notes in iOS 17 and macOS Sonoma, and links to a heading in iOS 27 and macOS 27, but the links only go
        one way. Apple&apos;s own guide to <a href="https://support.apple.com/guide/notes/add-links-apde615d29c2/mac" rel="noopener">adding
        links in Notes</a> never mentions seeing them from the other side.
      </p>

      <h2 id="link">How to link notes in Apple Notes</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Add Link"] },
        { on: "iPhone", steps: ["Edit menu", "Add Link"] },
      ]} />
      <p>
        Choose Add Link, start typing the other note&apos;s title and pick it. Faster: type <code>&gt;&gt;</code> anywhere in a note,
        then the title, on iPhone or Mac. Keep Use Note Title on and the link renames itself when the note does. On iOS 27 and macOS
        27 you can also pick a heading, which <a href="/blog/apple-notes-ios-27">what&apos;s new in Apple Notes</a> covers.
      </p>

      <h2 id="find">Find the notes that link to one</h2>
      <p>
        Search is the closest thing to backlinks. Pull down in the notes list on iPhone, or click the search field on a Mac, and type
        the note&apos;s exact title. Every note whose text includes it shows up: the ones linking with the title as the link&apos;s
        name, and the ones that just mention it.
      </p>
      <p>
        Two catches. A link you gave a different name (&ldquo;the trip&rdquo; for a note called Lisbon) won&apos;t match. And a common
        title brings back every note that uses the word, linked or not. For a note called Ideas, that&apos;s most of them.
      </p>

      <h2 id="two-way">Two-way links by hand</h2>
      <p>
        If one note matters more than the rest, a project or a person, give it a Linked from section at the bottom and add a link
        there each time you link to it from somewhere else. It&apos;s a habit, not a feature, and it goes stale the first time you
        forget. A <a href="/blog/apple-notes-tags-smart-folders">tag and a Smart Folder</a> is the other route: tag every note about
        the project and the Smart Folder lists them, links or not. <a href="/blog/apple-notes-second-brain">A simple second-brain setup</a> uses both.
      </p>

      <p>
        For a whole system of folders, tags, pins and links, see <a href="/blog/apple-notes-organize">how to organize Apple Notes</a>.
      </p>

      <h2 id="pinto-notes">A notes app with backlinks</h2>
      <p>
        That&apos;s one of the reasons I made Pinto Notes. It looks and works like Apple Notes on iPhone and Mac, and links notes the
        way Obsidian does: type <code>[[</code> and a note&apos;s title, or choose Link to Note from the / menu. The link shows as the
        title, <code>[[Lisbon#Food]]</code> goes to a heading, and <code>[[Lisbon|the trip]]</code> gives it a name of its own.
      </p>
      <PostFigure src="/blog/launch/backlinks-wiki-links" width={1280} height={300} maxWidth={640}
        alt="A Weekend plans note in Pinto Notes on a Mac with three checklist items: Book flights for Lisbon on Thursday, with Lisbon as a link; Pick the next book for Book club, with Book club as a link; and a ticked Dentist at 10."
        caption="Links to Lisbon and Book club in a Weekend plans note, written as [[Lisbon]] and [[Book club]]." />
      <p>
        Open the Lisbon note, and its ••• menu has Linked From: every note that links to it, newest first. Choose one to open it. Only
        real links count, so a note that happens to say &ldquo;Lisbon&rdquo; isn&apos;t listed. Rename Lisbon and the links to it are
        changed to the new name, so they keep working.
      </p>
      <PostFigure src="/blog/launch/backlinks-linked-from" width={960} height={236} maxWidth={480}
        alt="The note's menu in Pinto Notes with Move to, Linked From and Version History. Linked From is open and lists Weekend plans and Packing."
        caption="Linked From on the Lisbon note: Weekend plans and Packing link to it. Trip documents only mentions Lisbon, so it isn't there." />
      <p>
        The links are also what an AI sees. If you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, it
        writes links the same way and can ask which notes link to the one it&apos;s reading.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t
        changed, so you can try it without giving anything up.
      </p>
    </PostPage>
  );
}
