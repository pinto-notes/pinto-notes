import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-vs-onenote", {
  title: "Apple Notes vs OneNote: which to use on iPhone and Mac",
});

// Written 21 November 2026 for "apple notes vs onenote" (Google autocomplete, en-US, read 21 Nov: apple notes vs onenote,
// apple notes vs onenote reddit, onenote vs apple notes 2026, apple notes vs onenote 2025, apple notes versus onenote,
// apple notes or onenote, mac notes vs onenote, ios notes vs onenote, icloud notes vs onenote; and onenote vs apple notes,
// onenote or apple notes, onenote vs iphone notes, onenote vs ios notes, onenote vs icloud notes; both lists also have a
// tablet variant). The reader is choosing between the two, often coming from OneNote at work or school.
// Microsoft, every fact read on 21 November 2026 on support.microsoft.com (the microsoft.com product page blocked automated
// reading, so nothing here comes from it):
// topic/a624e692-b78b-4c09-b07f-46181958118f ("What's the difference between the OneNote versions?": "all supported versions
// of OneNote are free to download and use"; Mac "as a free standalone app (some features may be limited)"; iPhone free on the
// App Store; Android on Google Play; OneNote for the web at onenote.com; premium features with Microsoft 365, on Mac "including
// Stickers"), onenote-for-mac-help-and-learning/frequently-asked-questions-about-onenote-for-mac ("requires access to OneDrive
// using a Microsoft account"; "continually syncs all of your notes with OneDrive"; a local copy for offline use; Copy Text
// from Picture can take 24 to 48 hours), .../protect-notes-with-a-password-in-onenote-for-mac (Control-click the section tab,
// Password Protection, Protect This Section; sections only, not single pages or a whole notebook; auto-locks after a few
// minutes; locked sections are left out of search; "no one will be able to unlock your notes for you"),
// .../draw-and-annotate-with-ink-in-onenote-for-mac (mouse or trackpad, "anywhere on a page", Draw tab with Pen, Marker and
// Highlighter; Mac "doesn't currently support converting handwriting to text"), office/review-the-history-of-a-page-f81e1133
// (applies to OneNote for Mac: View, Page Versions; Control-click a version, Restore Version), onenote/recover-deleted-notes-
// in-onenote-for-mac ("OneNote keeps deleted notes for a period of 60 days"), .../export-notes-as-a-pdf-file-in-onenote-for-mac
// (File, Save as PDF, one page), .../share-your-notes-in-onenote-for-mac (File, Share, Send Link to Notebook; Can Edit or Can
// view), .../copy-text-from-inserted-pictures-in-onenote-for-mac (Control-click a picture, Copy Text from Picture),
// onenote/welcome-to-copilot-in-onenote (summarise, task lists, rewrite, draft; Mac needs a Microsoft Copilot (Work) license),
// microsoft-365-copilot/frequently-asked-questions-about-copilot-in-microsoft-365-subscriptions ("Microsoft Copilot is
// available in Microsoft 365 Personal, Family, and Premium plans", AI credits, OneNote listed), office/microsoft-storage-faqs
// ("5 GB of free cloud storage with your Microsoft account", shared across OneDrive, Outlook.com attachments and Microsoft 365
// apps; "1 TB or 2 TB included with your Microsoft 365 subscription").
// Apple, read 21 November 2026: support.apple.com/102537 (lock single notes with the device passcode or a Notes password, Face ID
// or Touch ID; notes with tags, PDFs, audio or video, shared notes and Gmail or other IMAP notes can't be locked; Apple can't
// get you into a note if you forget the password), support.apple.com/108047 (5 GB of iCloud storage free; iCloud+ 50 GB $0.99 a
// month in the US), support.apple.com/HT210402 (Notes at iCloud.com on a Windows PC; Android isn't mentioned),
// support.apple.com/102223 (Notes on a Mac imports .txt, .rtf, .rtfd, .html, .enex and .md; OneNote isn't listed),
// support.apple.com/guide/iphone/iphd939f0a1c/ios (draw or handwrite with your finger, Markup tools; Smart Selection can paste
// handwriting as typed text in a supported language).
// Apple Notes facts from earlier posts: folders, tags and Smart Folders (apple-notes-tags-smart-folders), search finds text in
// handwriting and scanned pages and Apple Intelligence transcripts and summaries of recordings (apple-notes-for-school), Math
// Results (apple-notes-budget-template), sharing needs an Apple Account for each person (apple-notes-1-on-1-template), no
// version history (apple-notes-version-history), Recently Deleted for 30 days (recover-deleted-apple-notes), exports as PDF or
// Markdown (best-notes-app-for-mac, export-apple-notes-to-markdown).
// Pinto side: import-your-notes (imports on a Mac from Apple Notes, Obsidian, Evernote, Google Keep, Bear, and Markdown or text
// files; no OneNote import), apple-notes-version-history (versions kept, the last of each day for 90 days), best-notes-app-for-mac
// (no handwriting; Apple Notes keeps text in one column), move-from-apple-notes (Apple Notes isn't changed). Apple only: no Windows, Android or web app.
// Pictures, both reused from best-notes-app-for-mac: /blog/news/apple-notes-mac-groceries and
// /blog/news/pinto-notes-mac-chatgpt-edit-framed. No OneNote picture: none exists on the site. No new screenshots.

type Row = { what: string; apple: string; onenote: string };

const ROWS: Row[] = [
  { what: "Price", apple: "Free, comes with your iPhone and Mac", onenote: "Free app; some Mac features need Microsoft 365" },
  { what: "Devices", apple: "iPhone and Mac; iCloud.com in a browser on Windows", onenote: "Windows, Mac, iPhone, Android and the web" },
  { what: "Account and sync", apple: "Your Apple Account, through iCloud", onenote: "A Microsoft account, through OneDrive" },
  { what: "Free cloud storage", apple: "5 GB of iCloud; 50 GB is $0.99 a month (US)", onenote: "5 GB, shared with Outlook.com and Microsoft 365 apps" },
  { what: "How notes are organised", apple: "Folders, tags and Smart Folders", onenote: "Notebooks, sections and pages" },
  { what: "The page", apple: "Text runs top to bottom", onenote: "Write or draw anywhere on the page" },
  { what: "Handwriting", apple: "Finger drawing on iPhone; can paste as typed text", onenote: "Pen, Marker and Highlighter; no handwriting to text on Mac" },
  { what: "Locking", apple: "One note at a time", onenote: "One section at a time, not single pages" },
  { what: "Earlier versions of a note", apple: "Not kept", onenote: "Page Versions" },
  { what: "Deleted notes", apple: "Kept 30 days", onenote: "Kept 60 days" },
  { what: "AI built in", apple: "Apple Intelligence, on supported devices", onenote: "Copilot, with Microsoft 365 plans that include it" },
];

const FAQ = [
  { q: "Is OneNote better than Apple Notes?", a: [
    "For free-form pages, drawing anywhere on a page, and Windows or Android, yes. For quick notes, lists and checklists on iPhone and Mac, Apple Notes is simpler and already installed.",
  ] },
  { q: "Is OneNote free on Mac and iPhone?", a: [
    "Yes. Microsoft says every supported version of OneNote is free to download and use, including the Mac and iPhone apps. Some Mac features need Microsoft 365, and you need a Microsoft account, because notes sync through OneDrive.",
  ] },
  { q: "Can I move my OneNote notebooks into Apple Notes?", a: [
    "Not in one go. OneNote for Mac saves one page at a time as a PDF (File, Save as PDF), and Notes on a Mac imports text, RTF, HTML, Evernote and Markdown files, with no OneNote option. For a few pages, copy and paste works.",
  ] },
  { q: "Can you lock a single page in OneNote?", a: [
    "No. OneNote for Mac locks whole sections with a password, and Microsoft says you can't protect single pages or a whole notebook at once. Apple Notes does the opposite: you lock one note at a time.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-vs-onenote"
      intro={<>Apple Notes is the Notes app on your iPhone and Mac. OneNote is Microsoft&apos;s free notes app for Windows, Mac, phones and the web, with notebooks of free-form pages. If you use OneNote at work or school and Apple Notes at home, you&apos;ve probably wondered whether one could do both jobs. Here&apos;s how they compare, from what Apple and Microsoft say today.</>}
      answer={
        <Answer jump={[
          { href: "#at-a-glance", label: "At a glance" },
          { href: "#apple-notes", label: "Apple Notes" },
          { href: "#onenote", label: "OneNote" },
          { href: "#moving", label: "Moving between them" },
          { href: "#which-one", label: "Which one to pick" },
        ]}>
          <p>
            Pick <strong>Apple Notes</strong> if you mostly use an iPhone and a Mac and want quick notes, lists and checklists with
            nothing to set up. Pick <strong>OneNote</strong> if you need Windows or Android too, already work in Microsoft 365, or want
            pages you can write and draw on anywhere, like a paper notebook.
          </p>
          <PostCta slug="apple-notes-vs-onenote" position="answer" title="Like Apple Notes, with your AI in it.">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. Once you connect ChatGPT or Claude, your AI can read and edit your notes, and earlier versions of every note are kept.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="at-a-glance">At a glance</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col"></th><th scope="col">Apple Notes</th><th scope="col">OneNote</th></tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.what}><th scope="row">{r.what}</th><td>{r.apple}</td><td>{r.onenote}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        The OneNote facts are from Microsoft&apos;s support pages, mostly the ones for OneNote for Mac, and the Apple ones from
        Apple&apos;s support pages and Notes itself. All were read on 21 November 2026. The iCloud price is Apple&apos;s US price.
      </p>

      <h2 id="apple-notes">Where Apple Notes is the better pick</h2>
      <PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000}
        alt="Apple Notes on a Mac: folders in the sidebar, a list of notes, and a Groceries note with a checklist where three items are ticked."
        caption="A Groceries note in Apple Notes on a Mac. Screenshot: Pinto Notes." />
      <p>
        Apple Notes is already on your iPhone and Mac, signed in with your Apple Account, and it syncs through iCloud. There&apos;s no
        second account, no notebook to create and no section to pick before you type.
      </p>
      <p>
        Organising is light. Notes go in folders, typing #word makes a tag, and Smart Folders gather notes by tag, folder or unchecked
        checklists. Search finds words in typed notes, handwriting and scanned pages. Math Results works out sums you type. On
        supported devices, Apple Intelligence turns a recording in a note into a transcript and a summary.
      </p>
      <p>
        On iPhone you can draw or handwrite in a note with your finger, using the Markup tools. With Smart Selection you can select
        your handwriting and paste it as typed text, if your iPhone&apos;s language is one Apple supports.
      </p>
      <p>
        Locking is per note. You lock a note with a password, Face ID or Touch ID, and the rest of the folder stays open. Some notes
        can&apos;t be locked: notes with tags, PDFs, audio or video, shared notes, and notes in a Gmail or other mail account. If you
        forget the password, Apple can&apos;t get you back into those notes.
      </p>
      <p>
        <strong>Where it stops:</strong> it&apos;s Apple only. On a Windows PC you get Notes at iCloud.com in a browser, and
        Apple&apos;s page doesn&apos;t mention Android. Text runs top to bottom, so there&apos;s no placing a note box in the
        corner of a page. It keeps <a href="/blog/apple-notes-version-history">no version history</a>, so text you deleted is gone
        once Undo can&apos;t reach it. Deleted notes wait in Recently Deleted for 30 days. Sharing a note needs an Apple Account for
        each person.
      </p>
      <p><strong>Best for:</strong> personal notes, lists and quick capture, on Apple devices.</p>

      <h2 id="onenote">Where OneNote is the better pick</h2>
      <p>
        OneNote works like a ring binder. A notebook holds sections, and each section holds pages. On a Mac you can write, highlight
        and draw anywhere on a page with a mouse or trackpad, using the Pen, Marker and Highlighter on the Draw tab. If you think in diagrams, or you keep class notes the way you would on paper, that freedom is the reason to use it.
      </p>
      <p>
        It runs almost everywhere: Windows, Mac, iPhone, Android and the web at onenote.com. Microsoft says every supported version is
        free to download and use. The Mac app needs a Microsoft account and syncs everything through OneDrive, keeping a copy on your
        Mac for when you&apos;re offline. A free Microsoft account has 5 GB of cloud storage, shared with your OneDrive files,
        Outlook.com attachments and other Microsoft 365 apps. Microsoft 365 Personal and Family come with 1 TB or more.
      </p>
      <p>
        Two things Apple Notes lacks. OneNote keeps earlier versions of a page: on a Mac, choose View, Page Versions, then
        Control-click an old version and choose Restore Version. And deleted notes stay for 60 days, twice as long as in Apple
        Notes. You can also copy the text out of a picture: Control-click it and choose Copy Text from Picture, though Microsoft says
        some results take 24 to 48 hours to be ready.
      </p>
      <p>
        Sharing a notebook goes through File, Share, Send Link to Notebook, and each person gets Can Edit or Can view. For AI,
        Copilot can summarise notes, make task lists and draft new text. Microsoft includes Copilot in Microsoft 365 Personal, Family
        and Premium, with monthly AI credits, and in work plans with a Copilot license. Its page on Copilot in OneNote lists a work Copilot
        license for the Mac app, so check your plan before you count on it there.
      </p>
      <p>
        <strong>Where it stops:</strong> on a Mac it can&apos;t turn handwriting into text. You lock whole sections with a password,
        never a single page, and a locked section is left out of search until you unlock it. Like Apple, Microsoft can&apos;t recover a
        forgotten password. OneNote for Mac saves one page at a time as a PDF. It&apos;s a Microsoft app first, so it looks and
        behaves differently from the apps that come with your Mac, and some Mac features need Microsoft 365.
      </p>
      <p><strong>Best for:</strong> students and teams in Microsoft 365, people on Windows or Android, and anyone who wants free-form pages.</p>

      <h2 id="moving">Moving between them</h2>
      <p>
        Neither app imports the other&apos;s notes directly. Notes on a Mac imports .txt, .rtf, .html, .md and <a href="/blog/apple-notes-vs-evernote">Evernote</a>&apos;s .enex
        files with File, Import to Notes, and OneNote isn&apos;t on Apple&apos;s list. OneNote for Mac exports one page at a time,
        as a PDF, with File, Save as PDF. So a notebook comes across page by page: copy and paste the text, or keep the PDFs.
      </p>
      <p>
        Plan for that before you switch. If you have a few hundred pages in OneNote, it may be easier to keep the old notebooks there
        to read, and start new notes in the app you&apos;re moving to.
      </p>

      <h2 id="pinto-notes">If you like Apple Notes and want AI in it</h2>
      <PostFigure src="/blog/news/pinto-notes-mac-chatgpt-edit-framed" width={1720} height={1178}
        alt="Pinto Notes on a Mac: folders in the sidebar, a list of notes, and a Lisbon trip note where the line ChatGPT just added, Late checkout requested, is tinted, with a bar saying ChatGPT changed 1 line and an Undo button."
        caption="ChatGPT added a line to a trip note. Pinto Notes tints it and offers Undo. Screenshot: Pinto Notes." />
      <p>
        If you were weighing OneNote for its version history or for AI, and you&apos;d rather keep how Apple Notes works, Pinto Notes
        is a smaller step. It looks and works like Apple Notes on iPhone and Mac: folders, pinned notes, checklists and tables. Once
        you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, which takes a minute, your AI can read and
        edit your notes, and Claude Code and Codex can too.
      </p>
      <p>
        Every change keeps the version before it, so you can restore a note after you or an AI edit it. Notes are stored as Markdown
        and encrypted. It is free on the Mac and on the App Store for iPhone.
      </p>
      <p>
        It <a href="/blog/import-your-notes">imports on a Mac</a> from Apple Notes, Obsidian, Evernote, Google Keep and Bear, and from
        any folder of Markdown or text files. There&apos;s no OneNote import, so OneNote pages come across the same way as into
        Apple Notes: by copy and paste.
      </p>
      <p>
        <strong>Where it stops:</strong> Pinto Notes is Apple only, with no Windows, Android or web app, and it has no handwriting.
        For free-form pages you draw on, OneNote is the better tool.
      </p>

      <h2 id="which-one">Which one should you pick?</h2>
      <ul>
        <li>Quick notes, lists and checklists on iPhone and Mac: <strong>Apple Notes</strong>.</li>
        <li>Windows or Android, Microsoft 365 at work or school, or pages you draw on: <strong>OneNote</strong>.</li>
        <li>Apple Notes, with ChatGPT or Claude working in your notes and every version kept: <strong>Pinto Notes</strong>.</li>
      </ul>
      <p>
        Still deciding? <a href="/blog/apple-notes-alternatives">Apple Notes alternatives</a> compares more apps, including ones for
        Windows and Android. Your Apple Notes come over to Pinto Notes in one import on your Mac, and Apple Notes isn&apos;t
        changed: <a href="/blog/move-from-apple-notes">how to move from Apple Notes</a>.
      </p>
      <p className="label">Sources</p>
      <p>
        Read on 21 November 2026: <a href="https://support.microsoft.com/en-us/topic/a624e692-b78b-4c09-b07f-46181958118f">OneNote versions</a>,{" "}
        <a href="https://support.microsoft.com/en-US/OneNote/onenote-for-mac-help-and-learning/frequently-asked-questions-about-onenote-for-mac">OneNote for Mac FAQ</a>,{" "}
        <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/protect-notes-with-a-password-in-onenote-for-mac">OneNote passwords</a>,{" "}
        <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/draw-and-annotate-with-ink-in-onenote-for-mac">drawing in OneNote for Mac</a>,{" "}
        <a href="https://support.microsoft.com/en-us/office/review-the-history-of-a-page-f81e1133-03f6-4e7b-8b3c-69dbad9ee987">OneNote page history</a>,{" "}
        <a href="https://support.microsoft.com/en-US/OneNote/recover-deleted-notes-in-onenote-for-mac">OneNote deleted notes</a>,{" "}
        <a href="https://support.microsoft.com/en-US/OneNote/onenote-for-mac-help-and-learning/export-notes-as-a-pdf-file-in-onenote-for-mac">OneNote PDF export</a>,{" "}
        <a href="https://support.microsoft.com/en-US/OneNote/onenote-for-mac-help-and-learning/share-your-notes-in-onenote-for-mac">OneNote sharing</a>,{" "}
        <a href="https://support.microsoft.com/en-us/onenote/welcome-to-copilot-in-onenote">Copilot in OneNote</a>,{" "}
        <a href="https://support.microsoft.com/microsoft-365-copilot/frequently-asked-questions-about-copilot-in-microsoft-365-subscriptions">Copilot in Microsoft 365 plans</a>,{" "}
        <a href="https://support.microsoft.com/en-us/office/microsoft-storage-faqs-8fca6272-3427-4cce-a437-2c5ed84550a9">Microsoft storage</a>,{" "}
        <a href="https://support.apple.com/en-us/102537">locking Apple Notes</a>,{" "}
        <a href="https://support.apple.com/en-us/108047">iCloud+ plans</a>,{" "}
        <a href="https://support.apple.com/en-us/HT210402">iCloud.com features by device</a>,{" "}
        <a href="https://support.apple.com/en-us/102223">importing into Apple Notes</a> and{" "}
        <a href="https://support.apple.com/guide/iphone/iphd939f0a1c/ios">drawing in Notes on iPhone</a>.
      </p>
    </PostPage>
  );
}
