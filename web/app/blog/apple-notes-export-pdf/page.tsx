import { PostPage, postMetadata } from "@/lib/PostPage";
import { PostCta } from "@/lib/PostCta";
import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { Answer, Capture, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-export-pdf", { title: "How to export Apple Notes to PDF, and every note at once" });

// Written 21 November 2026 for "apple notes export to pdf". Autocomplete read today (en-US): apple notes export to pdf,
// apple notes pdf export, apple notes export all notes, apple notes export folder, apple notes export to pdf only one page,
// apple notes export to pdf multiple pages, apple notes export to pdf all pages, iphone notes export to pdf, mac notes export
// to pdf, apple notes export all to pdf, mac notes export all to pdf. Research row 34 (topic-research-2026-11-20).
// Apple, read today:
//   "Import, export, and print notes on Mac" (support.apple.com/guide/notes/not201900c07/mac): macOS 27 is File, Export To,
//   then an option (PDF or Markdown), a new name and Finder tags, Save; File, Print. The macOS 15 version of the same page:
//   File, Export as PDF. No step for exporting several notes, a folder or every note.
//   macOS 26 menu name (File, Export as) from export-apple-notes-to-markdown.
//   "Export or print notes on iPhone" (support.apple.com/guide/iphone/iphdf551cfa2/ios): Export a note as a PDF is Share,
//   Markup (View More if it isn't listed), mark up, Done to save. The PDF uses the note's current view settings for its
//   attachments, and a multipage PDF or scanned document comes out as its first page only. Print is Share, Print. Locked
//   notes must be unlocked before Open in Pages. The page doesn't say where the Markup PDF is saved; nor does this post.
//   "Save a document as a PDF on Mac" (support.apple.com/guide/mac-help/mchlp1531/mac): File, Print, PDF button or the PDF
//   pop-up menu, Save as PDF, Security Options for a password.
//   "How to request a copy of your data from Apple" (support.apple.com/en-us/102208): privacy.apple.com, Request a copy of
//   your data; iCloud data includes notes; 14 days to download; no format stated for notes.
// Other: github.com/storizzi/notes-exporter README read today (Mac only, AppleScript and Python; HTML, Markdown, PDF via
// Google Chrome, Word, EPUB; skips locked notes; --folder-hierarchy keeps folders; MIT).
// Picture: public/blog/macos27/notes-export-to (the same capture move-apple-notes-to-obsidian-notion-keep uses), and SHOTS.welcome.
// Pinto side: File, Export as PDF and File, Print on the Mac (Pane/Views/RootView.swift, CommandGroup printItem, shipped since
// mac-v1.3; EditorController: "the note the way it reads, on white paper"; the file is named after the note's title,
// EditorAccessibility.fileName). Settings, Account, Export Your Notes (app/privacy-security/page.tsx). No PDF export claimed
// on iPhone.

const FAQ = [
  { q: "Why does my Apple Notes PDF show only one page of a scan?", a: [
    "That's how Notes exports. Apple's iPhone guide says that when a note holds a multipage PDF or scanned document, the exported PDF contains only its first page. Keep the original file and send it along with the note's PDF.",
  ] },
  { q: "Can I export a whole folder of Apple Notes to PDF?", a: [
    "Apple's guides don't describe a way. They cover exporting or printing the note you have open, one at a time. A free exporter on a Mac, such as notes-exporter, can write every note to PDF.",
  ] },
  { q: "Can I get a copy of all my Apple Notes from Apple?", a: [
    "Yes. At privacy.apple.com, choose Request a copy of your data and pick your iCloud data, which Apple says includes notes. Apple tells you when it's ready, and you have 14 days to download it. Apple doesn't say what format the notes come in.",
  ] },
  { q: "How do I print a note from Apple Notes?", a: [
    "On a Mac, click the note and choose File, Print. On iPhone, open the note, tap the Share button, then Print. If Print isn't listed, tap View More first.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-export-pdf"
      intro={<>A PDF is the easiest way to hand a note to someone who doesn&apos;t use Apple Notes, or to print it. Apple Notes makes one note at a time, with a different route on a Mac and an iPhone. Here are both, the catch with scans and attached PDFs, and what you can do when you want a folder or every note.</>}
      answer={
        <Answer jump={[
          { href: "#mac", label: "On a Mac" },
          { href: "#iphone", label: "On iPhone" },
          { href: "#one-page", label: "Only one page?" },
          { href: "#all", label: "Every note at once" },
        ]}>
          <p>
            On a Mac, click the note and choose File, Export To, PDF (File, Export as on macOS 26). On iPhone, open the
            note, tap the Share button, then Markup, and tap Done to save the PDF. Apple Notes exports one note at a time; Apple doesn&apos;t
            describe a way to export a folder or all your notes as PDFs.
          </p>
          <PostCta slug="apple-notes-export-pdf" position="answer" title="Your notes as files, all the time.">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac, and every note is a Markdown file. On a Mac, File, Export as PDF saves any note as it reads, and one export in Settings saves every note in its folders.</p>
          </PostCta>
        </Answer>
      }
      hero={<Capture priority src="/blog/macos27/notes-export-to" width={770} height={795} maxWidth={385}
        alt="The File menu of Apple Notes on macOS 27, open at Export To, with PDF and Markdown in the submenu. Print sits at the bottom of the menu."
        caption="File, Export To, PDF in Notes on macOS 27. Print is at the bottom of the same menu." />}
      faq={FAQ}
    >
      <h2 id="mac">Export a note as a PDF on a Mac</h2>
      <MenuPaths rows={[
        { on: "macOS 27", steps: ["File", "Export To", "PDF"] },
        { on: "macOS 26", steps: ["File", "Export as", "PDF"] },
        { on: "macOS 15", steps: ["File", "Export as PDF"] },
      ]} />
      <Steps>
        <li>Open Notes and click the note you want as a PDF.</li>
        <li>Choose File, Export To, then PDF. On macOS 26 the menu is called Export as, and on macOS 15 it&apos;s a single item, Export as PDF.</li>
        <li>Type a new name if you want one. You can also add tags here, which Finder can search for.</li>
        <li>Pick where to save it and click Save.</li>
      </Steps>
      <p>
        The print route works too, and gives you a few more choices. Choose File, Print (Command-P), then click the PDF button at the
        bottom of the print window, or open the PDF menu next to it and choose Save as PDF. Security Options in that window can put a
        password on the PDF, so it can&apos;t be opened, copied or printed without it. These steps are Apple&apos;s, from{" "}
        <a href="https://support.apple.com/guide/notes/import-export-and-print-notes-not201900c07/mac" rel="noopener">Import, export, and
        print notes on Mac</a> and <a href="https://support.apple.com/guide/mac-help/save-a-document-as-a-pdf-on-mac-mchlp1531/mac" rel="noopener">Save
        a document as a PDF on Mac</a>.
      </p>

      <h2 id="iphone">Export a note as a PDF on iPhone</h2>
      <MenuPaths rows={[
        { on: "PDF", steps: ["Share", "Markup", "Done"] },
        { on: "Print", steps: ["Share", "Print"] },
      ]} />
      <Steps>
        <li>Open the note in Notes.</li>
        <li>Tap the Share button, then tap Markup. If you don&apos;t see Markup, tap the View More button first.</li>
        <li>Draw on or mark up the pages if you want to. Then tap Done to save the PDF.</li>
      </Steps>
      <p>
        On iPhone, Markup is Apple&apos;s route to a PDF. To print, tap the
        Share button, then Print, choose a printer and tap Print. Apple describes both in{" "}
        <a href="https://support.apple.com/guide/iphone/export-or-print-notes-iphdf551cfa2/ios" rel="noopener">Export or print notes on
        iPhone</a>. The same guide covers Open in Pages, for when you want to keep editing the note as a document. A locked note has to be
        unlocked with its password, Face ID or Touch ID before it goes to Pages.
      </p>

      <h2 id="one-page">Why an attached PDF or scan comes out as one page</h2>
      <p>
        Apple&apos;s iPhone guide says the PDF uses the note&apos;s current view settings for its attachments, and that a multipage PDF or
        scanned document in the note comes out as its first page only. That&apos;s the &ldquo;export to PDF only one page&rdquo; problem. If the attachment is the part that matters, send the original file along with the
        note&apos;s PDF.
      </p>

      <h2 id="all">Export a folder or every note</h2>
      <p>
        Apple&apos;s guides for Mac and iPhone only describe exporting or printing the note you have open. There&apos;s no documented
        way to export a folder, a selection of notes or your whole library to PDF. What you can do:
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col"></th><th scope="col">What you get</th><th scope="col">Good to know</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Export each note</th><td>One PDF per note, on Mac or iPhone</td><td>Fine for a handful; nothing to install</td></tr>
            <tr><th scope="row">A copy of your data from Apple</th><td>Your iCloud data, which Apple says includes notes</td><td>Request it at privacy.apple.com; 14 days to download once it&apos;s ready; Apple doesn&apos;t say what format the notes come in</td></tr>
            <tr><th scope="row"><a href="https://github.com/storizzi/notes-exporter" rel="noopener">notes-exporter</a></th><td>Every note as PDF, Markdown, HTML, Word or EPUB, in its folders if you ask for that</td><td>Mac only; free and open source; runs in the Terminal with Python, and uses Google Chrome to make the PDFs; skips locked notes</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Apple&apos;s data copy is described in <a href="https://support.apple.com/en-us/102208" rel="noopener">How to request a copy of
        your data from Apple</a>. If the point is a backup, think about Markdown instead of PDF. A PDF is good for reading and printing,
        and Markdown files go back into Notes as notes with File, Import Markdown on a Mac.{" "}
        <a href="/blog/export-apple-notes-to-markdown">Exporting Apple Notes to Markdown</a> covers that export and the free apps that do
        a whole library, and <a href="/blog/back-up-apple-notes">how to back up Apple Notes</a> has a routine that keeps a copy outside
        iCloud.
      </p>

      <h2 id="pinto-notes">Notes that are files already</h2>
      <Figure shot={SHOTS.welcome} caption="A note in Pinto Notes on a Mac. Underneath, it's a Markdown file." />
      <p>
        Pinto Notes is a notes app for iPhone and Mac that looks and works like Apple Notes. On a Mac it has the same two routes:
        File, Export as PDF saves the note the way it reads, on white paper, named after its title, and File, Print (Command-P) prints
        it. You don&apos;t need an export for the rest, because every note is a Markdown file in its folder. When you want your own copy
        of everything, Settings, Account, Export Your Notes makes a zip with every note as Markdown in its folders, with its files.
      </p>
      <p>
        Since the notes are files, ChatGPT or Claude can read and edit them once connected, with every earlier version of a note kept.
        The AI reads the note itself, so there&apos;s nothing to export first. <a href="/blog/connect-chatgpt-to-your-notes">Connecting
        ChatGPT or Claude</a> takes a minute. Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your
        Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
