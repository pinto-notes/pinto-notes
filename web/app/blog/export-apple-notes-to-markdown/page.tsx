import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("export-apple-notes-to-markdown");

const FAQ = [
  { q: "Can Apple Notes export to Markdown?", a: [
    "Yes, since macOS 26 and iOS 26. On a Mac, click the note and choose File, Export as, Markdown (in macOS 27 the menu is called Export To). On iPhone, open the note, tap the Share button and tap Export as Markdown. Older versions can't export Markdown on their own.",
  ] },
  { q: "Can I export all my Apple Notes to Markdown at once?", a: [
    "Not with a documented Apple feature. Apple's guides describe exporting the note you have open. To export a folder or your whole library, use a free exporter on your Mac, such as Apple Notes Exporter or notes-exporter on GitHub.",
  ] },
  { q: "Does the Markdown export keep images and attachments?", a: [
    "Pictures, yes: in my test on macOS 27 they were copied into an Attachments folder next to the Markdown file and linked from the text. Links to other notes and web links were dropped, and a table cell with two lines broke its row.",
  ] },
  { q: "Can I export a locked note?", a: [
    "Unlock it first. Apple's iPhone guide says a locked note must be unlocked before you export it to Pages, and it doesn't describe a way around that for Markdown.",
  ] },
  { q: "How do I get Markdown back into Apple Notes?", a: [
    "On a Mac, choose File, Import Markdown, pick one or more files and click Import. In macOS 27 you can also pick a whole folder and keep its folder structure; the new notes land in a folder called Imported Notes.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="export-apple-notes-to-markdown"
      intro={<>Apple Notes can finally export Markdown on its own, which is good news if you want your notes in Obsidian, in a git repository or in a chat with ChatGPT. Here&apos;s how it works on a Mac and an iPhone, what to check in the file, and what to use when you want every note, not just one.</>}
      answer={
        <Answer jump={[
          { href: "#mac", label: "On a Mac" },
          { href: "#iphone", label: "On iPhone" },
          { href: "#check", label: "What to check" },
          { href: "#all", label: "Every note at once" },
        ]}>
          <p>
            On macOS 26 and iOS 26 or later, Apple Notes exports a note as a Markdown file: File, Export To, Markdown on a Mac (Export as
            in macOS 26), and Share, Export as Markdown on iPhone. It works one note at a time. For a whole library you need a free exporter.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/macos27/notes27-export-to" width={1138} height={855} maxWidth={569}
        alt="The File menu of Apple Notes on macOS 27 with Export To open, offering PDF and Markdown. Markdown is highlighted. Behind the menu, a Day hike packing list note."
        caption="File, Export To, Markdown, in Apple Notes on macOS 27." />}
      faq={FAQ}
    >
      <h2 id="mac">Export a note on a Mac</h2>
      <MenuPaths rows={[
        { on: "macOS 27", steps: ["File", "Export To", "Markdown"] },
        { on: "macOS 26", steps: ["File", "Export as", "Markdown"] },
      ]} />
      <ol>
        <li>Open Notes and click the note you want to export.</li>
        <li>Choose File, Export as, Markdown. In macOS 27, the menu is File, Export To, then Markdown.</li>
        <li>Type a name for the file if you want another one, and pick where to save it.</li>
        <li>Click Save.</li>
      </ol>
      <p>
        To copy only part of a note, macOS 27 and iOS 27 add Copy as Markdown: select the text, then choose Edit, Copy as Markdown on a Mac,
        or Copy as Markdown in the edit menu on iPhone. It works the other way too: paste Markdown into a note and it turns into headings and
        lists. <a href="/blog/apple-notes-ios-27">What else is new in Apple Notes in iOS 27</a> covers the rest. The Mac steps come from Apple&apos;s guide, <a href="https://support.apple.com/guide/notes/import-export-and-print-notes-not201900c07/mac" rel="noopener">Import, export, and print notes on Mac</a>.
      </p>

      <h2 id="iphone">Export a note on iPhone</h2>
      <ol>
        <li>Open the note in Notes.</li>
        <li>Tap the Share button, then tap Export as Markdown. If you don&apos;t see it, tap the View More button first.</li>
        <li>Choose where the file goes: Save to Files, AirDrop, Mail or another app.</li>
      </ol>
      <p>
        Apple describes this in <a href="https://support.apple.com/guide/iphone/export-or-print-notes-iphdf551cfa2/ios" rel="noopener">Export or print notes on iPhone</a>.
      </p>

      <h2 id="check">What survives the export</h2>
      <p>
        Apple doesn&apos;t list what comes across, so I tested it on macOS 27 with one note that has everything: a checklist, a table with
        a two-line cell, a tag, a link to another note and a picture.
      </p>
      <PostFigure src="/blog/macos27/notes27-smart-folder-open-todos" width={2000} height={900} maxWidth={700}
        alt="The test note in Apple Notes on macOS 27: a Plan for Saturday heading, a bulleted list, a checklist with Book the ferry ticked and Pack snacks open, the tag #weekend, a table with Item, Who and Cost where one cell reads Leo and And Sam on two lines, See also Groceries as a link to another note, and a picture."
        caption="The test note in Notes on macOS 27." />
      <PostFigure src="/blog/macos27/notes27-export-markdown-textedit" width={1800} height={500} maxWidth={700}
        alt="The exported Markdown in TextEdit: - [x] Book the ferry, - [ ] Pack snacks, #weekend, a pipe table whose second row is broken across two lines at Leo / And Sam, the plain text See also Groceries, and an image link to a file in an Attachments folder."
        caption="The same note as Markdown. The ticks survive; the two-line cell breaks the table, and the link to Groceries is gone." />
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">In your note</th><th scope="col">In the Markdown file</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Title, headings</th><td>Kept: <code>#</code>, <code>##</code> and <code>###</code></td></tr>
            <tr><th scope="row">Bold, lists</th><td>Kept: <code>**bold**</code>, <code>*</code> bullets, <code>1.</code> numbered lists</td></tr>
            <tr><th scope="row">Checklists</th><td>Kept, ticks included: <code>- [x]</code> and <code>- [ ]</code></td></tr>
            <tr><th scope="row">Tables</th><td>A pipe table with a header row. A cell with two lines breaks the row, so fix those by hand</td></tr>
            <tr><th scope="row">Pictures</th><td>Copied into an Attachments folder next to the file, and linked from the text</td></tr>
            <tr><th scope="row">Tags</th><td>Kept as plain text, like <code>#weekend</code></td></tr>
            <tr><th scope="row">Links to other notes and web links</th><td>Dropped. Only the words are left</td></tr>
            <tr><th scope="row">Locked notes</th><td>Unlock the note before you export it</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Two more things. Export writes a folder, not a lone file: the folder takes the name you type, and the Markdown file inside keeps
        the note&apos;s title. And every line ends in two spaces, which Markdown reads as a line break. Most apps don&apos;t mind.
      </p>

      <h2 id="all">Export every note at once</h2>
      <p>
        Apple&apos;s guides only describe exporting the note in front of you. For a folder or a whole library, the usual route is a free
        exporter that runs on your Mac and reads the Notes app for you:
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col"></th><th scope="col">What it does</th><th scope="col">Good to know</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Apple Notes&apos; own export</th><td>One note to one Markdown file, on Mac and iPhone</td><td>macOS 26 or iOS 26 and later; nothing to install</td></tr>
            <tr><th scope="row"><a href="https://github.com/kzaremski/apple-notes-exporter" rel="noopener">Apple Notes Exporter</a></th><td>A Mac app that exports every note, in its folders, to Markdown and other formats, with attachments beside each note</td><td>Free and open source (GPL); download from GitHub; asks for Full Disk Access</td></tr>
            <tr><th scope="row"><a href="https://github.com/storizzi/notes-exporter" rel="noopener">notes-exporter</a></th><td>A command-line script that exports your notes to HTML, Markdown, PDF or Word, with images</td><td>Free and open source (MIT); needs Python and the Terminal</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Whichever you use, it&apos;s a copy. Apple Notes stays as it was, and a note you change tomorrow won&apos;t change in the file.
      </p>

      <h2>If you&apos;re moving somewhere, not making a backup</h2>
      <p>
        An export is the right tool for a backup or a one-off move into Obsidian or a repository. <a href="/blog/move-apple-notes-to-obsidian-notion-keep">Moving
        Apple Notes to Obsidian, Notion or Keep</a> covers what you gain and give up there. If what you actually want is Markdown notes that still work like Apple
        Notes, that&apos;s why I made Pinto Notes: it looks and works like Apple Notes on iPhone and Mac, and every note is Markdown underneath.
      </p>
      <p>
        On a Mac, <a href="/blog/move-from-apple-notes">File, Import from Apple Notes</a> brings over the notes you pick in one go, in their
        folders, with tables and pictures. Be aware of what it leaves behind: other attachments and locked notes stay in Apple Notes. And
        once your notes are Markdown in Pinto Notes, ChatGPT and Claude can read and edit them directly, with your approval, instead of you
        pasting files into a chat. <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT or Claude</a> takes a couple of minutes.
      </p>
      <p>
        If you&apos;re here because you want to script Apple Notes, <a href="/blog/apple-notes-api">what exists instead of an Apple Notes
        API</a> covers AppleScript, Shortcuts and their limits.
      </p>
    </PostPage>
  );
}
