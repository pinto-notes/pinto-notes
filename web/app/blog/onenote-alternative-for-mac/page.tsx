import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("onenote-alternative-for-mac", {
  title: "OneNote alternative for Mac: starting with typed notes",
});

// Written 21 November 2026 for "onenote alternative mac", research row 18 in
// topic-research-2026-11-22.md. Models read: evernote-alternative and
// notes-in-claude-code-and-codex. Also read apple-notes-vs-onenote and import-your-notes.
// Google autocomplete read live today over HTTPS, client=firefox, hl=en, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=onenote%20alternative%20mac
// Head results: onenote alternative mac, onenote alternative on macbook,
// onenote alternative mac reddit, onenote alternative mac os, onenote equivalent mac,
// onenote replacement mac, onenote alternative for mac free, best onenote alternative mac,
// microsoft onenote alternative mac, onenote alternative für mac.
// Rechecked seeds "onenote replacement mac", "onenote alternative for mac free" and
// "best onenote alternative mac" too. Each returned its exact seed; the free seed also
// returned "onenote alternative for mac" and "microsoft onenote alternative free".
// No search-volume or discontinuation claim follows from these suggestions.
// Microsoft official pages read today, all URLs below on support.microsoft.com:
// https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/create-pages-sections-or-notebooks-in-onenote-for-mac
// (notebooks, sections and pages; expandable pages).
// https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/draw-and-annotate-with-ink-in-onenote-for-mac
// (mouse or trackpad drawing anywhere on a Mac page).
// https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/share-your-notes-in-onenote-for-mac
// (shared notebooks and collaboration).
// https://support.microsoft.com/en-us/onenote/what-s-the-difference-between-the-onenote-versions
// (Windows, Mac, iPhone, Android and browser access; no prices used).
// https://support.microsoft.com/en-gb/onenote/onenote-for-mac-help-and-learning/export-notes-as-a-pdf-file-in-onenote-for-mac
// (File, Save as PDF exports the current page as a static snapshot).
// https://support.microsoft.com/en-us/onenote/export-and-import-onenote-notebooks
// (web notebook export only for personal OneDrive, not work/school OneDrive or SharePoint).
// Pinto claims checked against BRIEF.md: Apple Notes feel, free Mac download and iPhone app,
// connected ChatGPT/Claude reading and editing, and every earlier version kept.
// README.md:15 and :22 confirm Mac/iPhone, AI edits and version history.
// Pane/Model/MarkdownImport.swift:21 noteExtensions and :176 kind(of:) confirm accepted text
// formats, not .one/.onepkg/PDF as notes. Pane/Views/ImportSheet.swift:6 ImportKind and
// Pane/Views/ImportSources.swift:9 ImportOrigin confirm no direct OneNote source.
// import-your-notes supplies the exact folder/.zip wording. BRIEF-compare.md confirms no
// Windows, Android or web app. connect-chatgpt-to-your-notes verified header confirms one
// Allow grants reading and editing. No Apple Notes feature claims beyond BRIEF.md's app feel.
// All three linked blog posts have draft: false in lib/posts.ts. No pictures used.

const FAQ = [
  { q: "Can Pinto Notes open a OneNote .one or .onepkg file?", a: [
    "No. Pinto Notes has no direct OneNote importer. It can import a folder or .zip of Markdown or text files, but a OneNote notebook download is not that format. Copy the typed pages you need, or prepare Markdown or text files yourself.",
  ] },
  { q: "What can I save from OneNote on a Mac before switching?", a: [
    "Microsoft documents File, Save as PDF for the current page on a Mac. For a whole notebook, its web export works with personal OneDrive accounts only, not work or school OneDrive or SharePoint. Neither route creates editable Pinto notes.",
  ] },
  { q: "Will a OneNote PDF become an editable note in Pinto?", a: [
    "No. Pinto's Markdown and text importer does not turn PDF pages into editable notes. Keep PDFs as reference copies. To continue editing the words in Pinto, copy the text into a note or put it in a Markdown or text file first.",
  ] },
];

const SWITCH_CHECK = `OneNote switching check
Keep access to the original notebook.
Choose five typed pages used this week.
Copy each into a separate note or text file.
Check the reading order and any tables.
Compare links, pictures and attached files with the originals.
Keep drawings and page layouts in the original or a PDF.
Try the new notes on Mac and iPhone before moving more.`;

export default function Page() {
  return (
    <PostPage
      slug="onenote-alternative-for-mac"
      intro={<>Pinto Notes is a OneNote alternative for Mac if you want typed personal notes with Apple Notes&apos; feel and connected AI access. It has no direct OneNote import, so start with new notes or copy a small set of pages you still use.</>}
      answer={
        <Answer jump={[
          { href: "#fit", label: "Decide what to move" },
          { href: "#export", label: "Save the originals" },
          { href: "#moving", label: "Bring typed notes across" },
          { href: "#pinto-notes", label: "Use them with AI" },
        ]}>
          <p>
            Choose Pinto Notes for typed personal notes on Mac and iPhone, with ChatGPT or Claude able to read and edit once connected.
            Keep OneNote for notebooks whose free-form layout, drawing or shared pages you still need.
            Pinto cannot import a whole OneNote notebook or its native files.
          </p>
          <PostCta slug="onenote-alternative-for-mac" position="answer" title="Try Pinto Notes with your next typed note.">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. The Mac download is free, and you can connect ChatGPT or Claude to work in your notes.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="fit">Choose the notes you want to keep using</h2>
      <p>
        A useful first move is a current project or a few personal reference pages. Leave the archive in OneNote while you
        try the new app. A typed meeting record is a different job from a page of drawings arranged around a diagram.
        Moving the words does not preserve that page&apos;s layout.
      </p>
      <p>
        OneNote&apos;s notebooks, sections and pages give a large library a clear hierarchy. Its Mac app lets you draw anywhere
        on a page with a mouse or trackpad, and shared notebooks let other people work with you. These are reasons to keep it
        for the notebooks that use them. Microsoft documents the{" "}
        <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/create-pages-sections-or-notebooks-in-onenote-for-mac">notebook structure</a>,{" "}
        <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/draw-and-annotate-with-ink-in-onenote-for-mac">drawing tools</a> and{" "}
        <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/share-your-notes-in-onenote-for-mac">notebook sharing</a>.
      </p>
      <p>
        Device access matters too. OneNote has Windows and Android apps and a browser version, as listed in{" "}
        <a href="https://support.microsoft.com/en-us/onenote/what-s-the-difference-between-the-onenote-versions">Microsoft&apos;s version guide</a>.
        Pinto is for iPhone and Mac. There is no Windows, Android or web app.
        If you are deciding whether Apple&apos;s own app is enough, read{" "}
        <a href="/blog/apple-notes-vs-onenote">Apple Notes vs OneNote</a> for that comparison.
      </p>

      <h2 id="export">Save the originals before moving text</h2>
      <p>
        On a Mac, open a OneNote page and choose File, Save as PDF. Pick a filename and save it.
        Microsoft&apos;s <a href="https://support.microsoft.com/en-gb/onenote/onenote-for-mac-help-and-learning/export-notes-as-a-pdf-file-in-onenote-for-mac">Mac PDF guide</a>{" "}
        describes a snapshot of that page. Later edits in OneNote do not update the PDF.
        Open the saved file and check it before relying on it as a reference copy.
      </p>
      <p>
        For a whole notebook, Microsoft documents a separate export through OneNote for the web. Right-click the notebook,
        choose Export notebook, then confirm Export. Its{" "}
        <a href="https://support.microsoft.com/en-us/onenote/export-and-import-onenote-notebooks">notebook export guide</a>{" "}
        limits this to personal OneDrive accounts. It does not work for work or school OneDrive or SharePoint notebooks.
        Keep the download as a backup, not as a file to import into Pinto.
      </p>

      <h2 id="moving">What Pinto can and cannot import from OneNote</h2>
      <p>
        There is no direct OneNote import. Pinto cannot turn <code>.one</code> or <code>.onepkg</code> files into notes.
        It also does not convert OneNote PDF exports into editable notes through its Markdown and text importer.
        Putting a notebook export in a ZIP does not change its format.
      </p>
      <p>
        For a few pages, copy the typed text into separate new notes. Start with a short page and compare it with the original.
        Check the order of text blocks, then check tables and links. Bring across pictures and attached files separately if
        you need them. Do not assume a text copy includes them.
      </p>
      <p>
        For more pages, you can prepare a folder of Markdown or text files yourself, one file per note. This is manual
        preparation, not a OneNote export option described in Microsoft&apos;s guides above. On your Mac, choose File,
        Import Markdown or Text in Pinto, then choose the folder.
        As <a href="/blog/import-your-notes">Import your notes</a> puts it, Pinto accepts &ldquo;a folder or .zip of Markdown
        or text files. Each folder becomes a folder.&rdquo;
      </p>
      <Keep title="Check a small set before moving more" text={SWITCH_CHECK}
        note="This is a checklist for a manual move, not an automatic notebook conversion." />
      <p>
        Keep pages that depend on handwriting, scans or a free-form canvas in the original notebook or a checked PDF copy.
        This route moves typed text. It does not reproduce those parts as editable Pinto content.
      </p>

      <h2 id="pinto-notes">Use your typed notes with ChatGPT or Claude</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac. Once you{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, your AI can read and edit your notes.
        Approving the connection gives it both abilities. Every earlier version of a note is kept.
      </p>
      <p>
        Try a specific request on the pages you copied: &ldquo;Read my kitchen project notes and add a checklist of decisions
        still to make.&rdquo; Review the result against your notes. Your AI can work with the text you brought into Pinto;
        connecting it does not import the rest of your OneNote library.
      </p>
      <p>
        Write your next few personal notes in Pinto and see whether they cover your daily work. You can leave shared
        notebooks in OneNote and move more typed pages later, after checking the first set.
      </p>
    </PostPage>
  );
}
