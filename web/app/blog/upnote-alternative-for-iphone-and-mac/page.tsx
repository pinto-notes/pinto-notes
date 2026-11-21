import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("upnote-alternative-for-iphone-and-mac", {
  title: "UpNote alternative for iPhone and Mac: Pinto Notes",
});

// Written 21 November 2026 for "upnote alternative", research row 5 in
// topic-research-2026-11-23.md. The row reports directory-style results and a possible
// gap for a checked, Apple-only move. No exact Apple-qualified demand is claimed.
// Google autocomplete rechecked today by direct HTTPS after the web reader failed:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=upnote%20alternative
// Returned: upnote alternative; upnote alternative reddit; upnote alternative open source;
// upnote alternative free. These match A5 in the supplied research, not search-volume data.
// Maker pages read live 21 November 2026:
// https://help.getupnote.com/import-and-export/export-notes (export formats and steps).
// https://getupnote.com/ (platforms, notebooks, folding, clipper; export requires Premium).
// No numeric UpNote prices used. No Apple Notes procedures or feature limits asserted.
// Pinto claims: BRIEF.md supplies Apple Notes look/behavior, free Mac download and iPhone
// app, connected ChatGPT/Claude reading and editing, and every earlier version kept.
// BRIEF-compare.md supplies Mac/iPhone only, no Windows, Android or web app.
// app/blog/import-your-notes/page.tsx supplies the File menu wording and the exact generic
// route: "a folder or .zip of Markdown or text files. Each folder becomes a folder."
// Pane/Model/MarkdownImport.swift:6-21, 220-282 confirms formats and folder/ZIP input.
// Pane/Model/NoteExport.swift:5-14, 98-200 confirms Markdown export in folders inside a ZIP,
// skipping currently locked notes and reporting files that cannot be fetched.
// Code paths are relative to the wave8 repo root. This is a format-based import route,
// not a fresh UpNote export test. No full preservation of notebook membership, links,
// collapsible sections, attachments or UpNote history is promised. Pinto history starts here.
// Pictures: none. Body links and the suggested inbound source are live in lib/posts.ts.

const IMPORT_CHECK = `UpNote trial import
- [ ] Compare the number of exported files with imported notes
- [ ] Read the whole of one long note
- [ ] Check a table and a checklist
- [ ] Open every picture and attachment in the sample
- [ ] Follow a link to another note
- [ ] Check where notes from each notebook appear
- [ ] Compare a note that used a collapsible section
- [ ] Open the imported notes on iPhone
- [ ] Keep the original export and UpNote library`;

const FAQ = [
  { q: "Can Pinto Notes import an UpNote export?", a: [
    "Pinto accepts a folder or .zip of Markdown or text files on a Mac. Use that general import route for an UpNote export. There is no dedicated UpNote importer, so check a small sample before moving the rest.",
  ] },
  { q: "Is Markdown export included in UpNote Free?", a: [
    "UpNote lists export to text, PDF, HTML and Markdown under Premium on its own site, checked 21 November 2026. Check your UpNote plan before relying on an export for the move.",
  ] },
  { q: "Will UpNote's collapsible sections work the same after import?", a: [
    "That is not verified for this route. Compare a note that uses them before deciding to switch. Check its full text as well as how it looks, and retain the original in UpNote.",
  ] },
  { q: "Can Pinto replace UpNote on a Windows work computer?", a: [
    "No. Pinto Notes runs on iPhone and Mac only, with no Windows, Linux, Android or web app. Stay with UpNote if you need its apps on those other operating systems.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="upnote-alternative-for-iphone-and-mac"
      intro={<>Pinto Notes is a free UpNote alternative for iPhone and Mac if you want Apple Notes&apos; layout and connected ChatGPT or Claude access. Try a small Markdown export first, because the move uses a general importer.</>}
      answer={
        <Answer jump={[
          { href: "#keep-upnote", label: "Reasons to stay" },
          { href: "#export", label: "Export a sample" },
          { href: "#import", label: "Import on Mac" },
          { href: "#check", label: "Check the result" },
          { href: "#pinto-notes", label: "Use your AI" },
        ]}>
          <p>
            Choose Pinto Notes if you use an iPhone and Mac and want ChatGPT or Claude to read and edit your notes once connected.
            Bring a folder of exported Markdown or text files into Pinto on your Mac, then compare the imported copies.
            Keep UpNote if you need its Windows, Linux or Android apps.
          </p>
          <PostCta slug="upnote-alternative-for-iphone-and-mac" position="answer" title="Try a few UpNote notes in Pinto Notes.">
            <p>Download Pinto Notes free on your Mac. Import a small Markdown export and check your notes before bringing over the rest.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="keep-upnote">When staying with UpNote makes sense</h2>
      <p>
        UpNote runs on Mac and iPhone as well as Windows, Linux and Android. If your work computer or phone uses one of those other
        systems, Pinto won&apos;t cover the same devices. Pinto Notes has no Windows, Linux, Android or web app.
      </p>
      <p>
        UpNote also has nested notebooks, collapsible sections and a web clipper for Chrome, Safari and Firefox, as described on
        <a href="https://getupnote.com/"> its own feature page</a>. If those tools already suit your notes, keeping them may matter
        more than trying a different app. A Markdown import is not a promise to recreate those workflows.
      </p>

      <h2 id="export">Export a small sample from UpNote</h2>
      <p>
        Pick a few notes that will reveal problems: a long project note, a checklist, and something with an attachment or a link to
        another note. Include a note with a collapsible section if you use them. A short text-only note won&apos;t test those parts.
      </p>
      <Steps>
        <li>On your Mac, select the sample notes in UpNote&apos;s note list.</li>
        <li>Click Export in the right panel. Choose Markdown and separate files, so each note remains a file.</li>
        <li>Keep the whole export folder together, including its Files folder for images and attachments.</li>
      </Steps>
      <p>
        These steps follow <a href="https://help.getupnote.com/import-and-export/export-notes">UpNote&apos;s export guide</a>.
        It also supports text export. UpNote lists export as a Premium feature, so check your plan before starting.
        Once your sample passes, File, Export all notes on a Mac is the larger export route.
      </p>

      <h2 id="import">Use Pinto&apos;s Markdown and text import on a Mac</h2>
      <p>
        In Pinto Notes on your Mac, open File and choose Import Markdown or Text. Select the export folder and follow the import
        steps. The route in <a href="/blog/import-your-notes">Import your notes</a> accepts a folder or .zip of Markdown or text files.
        Each folder becomes a folder.
      </p>
      <p>
        That describes folders in the export. It does not promise to reproduce every UpNote notebook membership. Inspect the
        folders and note locations after importing. Keep your UpNote library and the original export while you try the copies.
      </p>

      <h2 id="check">Compare the imported notes before switching</h2>
      <p>
        Open the original in UpNote beside the imported note. Read past the first screen of a long note and follow its links.
        Check the content inside a collapsible section too. An import can look tidy at the top while something farther down needs
        attention. This route has not been tested here with a fresh UpNote export.
      </p>
      <Keep title="A check for your UpNote trial" text={IMPORT_CHECK}
        note="Use this for the sample, then repeat it for the parts of your library you rely on most." />
      <p>
        Make a short list of anything you have to repair. If a link or attachment fails, keep the source note available while you
        fix the copy. If too much of your daily work depends on something that did not transfer, keep using UpNote.
      </p>

      <h2 id="pinto-notes">Let your connected AI work with the imported notes</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac. Once you
        <a href="/blog/connect-chatgpt-to-your-notes"> connect ChatGPT or Claude</a> and approve the connection, it can read and edit
        your notes. Start with one imported project note and ask it to summarize the unfinished work in the chat.
      </p>
      <p>
        Compare the summary with the note before asking the AI to add a next step. Then open the note and check the edit.
        Pinto keeps every earlier version of a note. That history covers changes in Pinto; it does not bring over UpNote&apos;s
        earlier versions.
      </p>

      <h2 id="export-again">Keep a way to export again</h2>
      <p>
        Pinto can export its library as Markdown files in folders inside a .zip. Currently locked notes stay out of that export,
        and it reports files it cannot download. Check the export summary and open a few files before relying on the archive.
      </p>
      <p>
        Keep the original UpNote export separately. It gives you the source material to compare with your new copies if you find
        a missing detail later.
      </p>
    </PostPage>
  );
}
