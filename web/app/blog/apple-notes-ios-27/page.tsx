import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, MenuPaths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-ios-27", { title: "What's new in Apple Notes in iOS 27, and how to use it" });

// Every Apple Notes picture here is a real capture of Notes on macOS 27, taken on 14 October 2026
// in a throwaway folder of demo notes. Facts come from Apple's own guides, linked in the text.
const FAQ = [
  { q: "What's new in Apple Notes in iOS 27?", a: [
    "Divider lines, links to a section of a note, Markdown that formats itself when you paste it, and Copy as Markdown. On a Mac, File, Export as is now File, Export To. Siri AI, in beta, can also add things to a note when you ask.",
  ] },
  { q: "How do I add a divider line in Apple Notes?", a: [
    "On a Mac, choose Edit, Insert Divider Line, or press Command-L. On iPhone, tap where the line should go, then choose Insert Divider Line from the edit menu.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-ios-27"
      intro={<>iOS 27 and macOS 27 came out on 14 September, and Apple Notes picked up a handful of small things that make long notes easier to live with. Here&apos;s each one, with a screenshot and the exact menu to find it.</>}
      answer={
        <Answer jump={[
          { href: "#divider-lines", label: "Divider lines" },
          { href: "#section-links", label: "Section links" },
          { href: "#paste-markdown", label: "Paste Markdown" },
          { href: "#copy-as-markdown", label: "Copy as Markdown" },
          { href: "#export-to", label: "Export To" },
        ]}>
          <p>
            Divider lines, links that jump to a heading, Markdown that turns into real formatting when you paste it, and Copy as
            Markdown to take it back out. On a Mac, the export menu is now called Export To.
          </p>
          <p>
            Siri AI is new too, in beta and in English to start; Apple&apos;s <a href="https://www.apple.com/newsroom/2026/06/apple-introduces-siri-ai-a-profoundly-more-capable-and-personal-assistant/" rel="noopener">example</a> has
            it adding a recipe to Notes. It isn&apos;t on my test Mac, so it has no screenshot here. <a href="/blog/siri-ai-apple-notes">Siri AI and Apple Notes</a> covers it.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/macos27/notes27-garden-note" width={1400} height={993} maxWidth={700}
        alt="A note called Spring garden plan in Apple Notes on macOS 27. Under the title, a line reads Jump to, followed by a link to the Seeds to order section. Below are three headings, Raised beds, Seeds to order and Watering, with a divider line between each section."
        caption="Apple Notes on macOS 27: a link to a section at the top, and divider lines between the sections." />}
      faq={FAQ}
    >
      <h2 id="divider-lines">Divider lines</h2>
      <PostFigure src="/blog/macos27/notes27-insert-divider" width={1400} height={836} maxWidth={700}
        alt="The Edit menu of Apple Notes on macOS 27 with Insert Divider Line highlighted and its shortcut, Command-L. Behind the menu, a note shows a divider line between two sections."
        caption="Edit, Insert Divider Line. The line spans the whole note." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Insert Divider Line"], keys: "⌘L" },
        { on: "iPhone", steps: ["Tap where it goes", "Edit menu", "Insert Divider Line"] },
      ]} />
      <p>
        A thin line across the note, for splitting it into parts. Click or tap where the line should go first. One thing I noticed: a <code>---</code> line
        in pasted Markdown becomes a divider too. Apple&apos;s steps are in <a href="https://support.apple.com/guide/notes/apd1955d3b21/mac" rel="noopener">Format
        notes on Mac</a> and <a href="https://support.apple.com/guide/iphone/create-and-format-notes-iph1ac0b3a2/ios" rel="noopener">Create and format notes on iPhone</a>.
      </p>

      <h2 id="section-links">Links to a section of a note</h2>
      <PostFigure src="/blog/macos27/notes27-link-to-section" width={980} height={710} maxWidth={490}
        alt="The Add Link dialog in Apple Notes on macOS 27. Link To says Spring garden plan, and the Link to Section menu is open, listing the note's title and its headings Raised beds, Seeds to order and Watering, with Seeds to order highlighted."
        caption="Add Link lists every heading in the note you link to." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Add Link", "Link to Section"], keys: "⌘K" },
        { on: "iPhone", steps: ["Edit menu", "Add Link", "Link to Section"] },
      ]} />
      <p>
        Any heading can now be the target of a link, in the same note or another one, so a long note can start with a little contents list.
        A section starts at any line styled as a Heading or Subheading, so set those first.
      </p>
      <p>
        On my Mac I had to type the note&apos;s title under Link To even for the same note; then the headings showed up. Turn on Use Section Title
        and the link renames itself when the heading changes. On iPhone, typing <code>&gt;&gt;</code>, a note&apos;s title and then <code>/</code> picks a
        section without the dialog. It&apos;s all in <a href="https://support.apple.com/guide/iphone/add-links-iph908d1558b/ios" rel="noopener">Add links in Notes on iPhone</a>.
      </p>

      <h2 id="paste-markdown">Paste Markdown and it formats itself</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={700}
        phone={{ src: "/blog/macos27/notes27-paste-as-markdown-phone", width: 640, height: 830 }}
        alt="The same packing list pasted into Apple Notes on macOS 27 two ways. Pasted with Edit, Paste, it keeps the hash marks and asterisks as text. Pasted with Edit, Paste as Markdown, it has a heading, a bulleted list and bold text."
        caption="A plain paste keeps the Markdown symbols. Paste as Markdown turns them into formatting." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />
      <p>
        Paste a ChatGPT or Claude answer into a note and you used to get <code>##</code> and <code>**</code> everywhere. Now Notes turns
        the Markdown into headings, lists and bold text. In my test on a Mac, a plain Command-V still kept the symbols, so use the menu item.
      </p>

      <h2 id="copy-as-markdown">Copy as Markdown</h2>
      <PostFigure src="/blog/macos27/notes27-copy-as-markdown" width={1400} height={836} maxWidth={700}
        alt="Apple Notes on macOS 27 with the Seeds to order section of a note selected and the Edit menu open, Copy as Markdown highlighted."
        caption="Select part of a note, then Edit, Copy as Markdown." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Select text", "Edit", "Copy as Markdown"] }]} />
      <p>
        The other direction. The section in the picture came out as <code>## Seeds to order</code> and a dash list, with the bold kept
        as <code>**Cherry tomatoes**</code>. That&apos;s what you want for a README, a blog draft or a prompt. Apple covers it
        in <a href="https://support.apple.com/guide/notes/not201900c07/mac" rel="noopener">Import, export, and print notes on Mac</a>.
      </p>

      <h2 id="export-to">Export a whole note with Export To</h2>
      <PostFigure src="/blog/macos27/notes27-export-to" width={1138} height={855} maxWidth={569}
        alt="The File menu of Apple Notes on macOS 27, open at Export To, with PDF and Markdown in the submenu and Markdown highlighted. Import Markdown is higher in the same menu."
        caption="File, Export To, with Markdown and PDF. Import Markdown sits above it." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["File", "Export To", "Markdown"] },
        { on: "iPhone", steps: ["Open the note", "Export as Markdown"] },
      ]} />
      <p>
        On a Mac the menu got a new name: it was File, Export as in macOS 26. File, Import Markdown brings files back in. The iPhone steps are
        in <a href="https://support.apple.com/guide/iphone/export-or-print-notes-iphdf551cfa2/ios" rel="noopener">Export or print notes on iPhone</a>,
        and for every note at once, see <a href="/blog/export-apple-notes-to-markdown">how to export Apple Notes to Markdown</a>.
      </p>

      <h2 id="ai">Want ChatGPT or Claude to edit these notes too?</h2>
      <Figure shot={SHOTS.importSheet} ground="wheat" caption="Import from Apple Notes in Pinto Notes on a Mac. You pick the notes, and nothing in Apple Notes changes." />
      <p>
        Apple Notes still has no way for ChatGPT or Claude to read or edit your notes from the web or your phone. I made Pinto Notes for that: a
        notes app that works like Apple Notes, which ChatGPT and Claude can search and edit once you allow them. It imports your Apple Notes,
        folders included. The Mac app is out now, and the iPhone app is coming soon.
        See <a href="/blog/connect-chatgpt-to-your-notes">how to connect ChatGPT to your notes</a>.
      </p>
      <PostCta slug="apple-notes-ios-27" position="how-amber-helps" title="Notes ChatGPT and Claude can work in">
        <p>Pinto Notes works like Apple Notes, and imports your notes from it on the Mac.</p>
      </PostCta>
    </PostPage>
  );
}
