import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-vs-google-keep", { title: "Apple Notes vs Google Keep: what each does better" });

// Written 21 November 2026 for "apple notes vs google keep". Google autocomplete (en-US, read 21 Nov): apple notes vs google
// keep (reddit), google keep vs apple notes (reddit, 2025), apple notes or google keep, google keep or apple notes, iphone notes
// vs google keep, icloud notes vs google keep, google keep vs iphone notes, google keep or iphone notes, is google keep or apple
// notes better, which is better apple notes or google keep, apple notes google keep sync, apple notes vs google keep vs onenote,
// google keep vs evernote vs apple notes, apple notes to google keep converter, google keep import apple notes.
// Google, read 21 Nov 2026 on support.google.com/keep (iPhone, Android and computer tabs): 2888240 (iPhone app from the App
// Store; notes, lists, labels, colours, pins, archive, reminders, sharing), 9050190 (on a computer: the two latest versions of
// Chrome and Firefox, Safari on Mac, Edge on Windows), 2888246 (Bold, Italic, Underline, heading styles; Speak records a voice
// note on iPhone; "You can't use Keep on your Apple Watch or Today View on iOS"), 6395451 (lists: reorder, indent, new items
// at top or bottom), 6191044 ("You can have up to 50 labels"; label, colour and pin; only labels, colours and pins, no folders),
// 6395566 (image notes), 2888263 (search filters by type, label, things, people, colour; text in photos, English only),
// 3187168 (timed reminders with recurrence, also in Google Tasks and Google Calendar), 6101196 (collaborators by name, email or
// Google Group; they edit text, lists, images, drawings and recordings), 7313121 (family group), 6262765 ("After deleting a
// note, you have seven days to recover it"; archive; Wear OS), 13820887 (version history: download a text file of earlier
// versions on keep.google.com on a computer; text changes only, no images), 14626262 (Gemini: Help me create a list on Android
// and titles on Pixel or Android, for Google AI Pro and Ultra or a Pixel), 3003125 (Chrome extension), 6320648 (Copy to Google
// Docs), 10017039 (Takeout export: text, list items, attachments, colour, pinned and archived state, collaborators, labels).
// Keep's help index has no article on locking a note. US App Store listing of Google Keep, read 21 Nov: Free, requires iOS 18.0
// or later. No Google One prices used.
// Apple, read 21 Nov 2026 on support.apple.com: guide/iphone/iph904eee369/ios (Recently Deleted for 30 days, on every device
// and iCloud.com), en-us/102651 (standard data protection: Apple holds the keys; Notes end-to-end with Advanced Data
// Protection), en-us/102537 (lock with a password, Face ID or Touch ID; Gmail or Yahoo accounts can't be locked; end-to-end for
// iCloud), guide/iphone/iph7262fd4fe/ios (Notes can use iCloud, Exchange, Google and Yahoo accounts; some features aren't
// available in other accounts), guide/icloud/mm000b55f946/icloud (iCloud.com notes on a computer, phone or tablet, folders,
// tags, tables), en-us/102223 (File, Import to Notes on a Mac: .txt, .rtf, .rtfd, .html, .enex, .md). From BRIEF's verified
// list: tags, Smart Folders, tables, checklists that sort ticked items, pinning, search, Math Results, Apple Intelligence
// transcripts and summaries, sharing needs an Apple Account. No version history: apple-notes-version-history. Notes in a
// Google account sync over IMAP and Keep doesn't show them: move-apple-notes-to-obsidian-notion-keep.
// Pinto Notes: Google Keep and Apple Notes import wording from import-your-notes; File, Version History from
// recover-deleted-apple-notes; sharing a note by link and writing together on iPhone and Mac from
// share-a-note-and-edit-it-together (1.4); Mac and iPhone only, free, Markdown, encrypted, ChatGPT and Claude: BRIEF.
// Pictures: /blog/news/apple-notes-mac-groceries (best-notes-app-for-mac) and /blog/launch/import-google-keep-guide
// (import-your-notes). No Keep screenshot: none exists in public/blog.

type Row = { what: string; apple: string; keep: string };

const ROWS: Row[] = [
  { what: "Price", apple: "Free, comes with your iPhone and Mac", keep: "Free. Gemini features need Google AI Pro or Ultra, or a Pixel" },
  { what: "Runs on", apple: "Apple devices; icloud.com/notes in a browser on any phone or computer", keep: "Android, iPhone (iOS 18 or later), Wear OS, and keep.google.com in a browser" },
  { what: "Sorting notes", apple: "Folders, #tags, Smart Folders, pinned notes", keep: "Up to 50 labels, colours and backgrounds, pinned notes, an archive" },
  { what: "Lists", apple: "Checklists that can move ticked items to the bottom", keep: "Checkbox lists you can reorder and indent" },
  { what: "In a note", apple: "Headings, tables, Math Results, recordings", keep: "Bold, italic, underline, headings, pictures, drawings, voice notes" },
  { what: "Sharing", apple: "Each person needs an Apple Account", keep: "Anyone by name, email or Google Group, or your family group" },
  { what: "Deleted notes", apple: "Recently Deleted, for 30 days", keep: "Trash, for 7 days" },
  { what: "Earlier versions", apple: "None", keep: "Text versions, downloaded as a file on a computer" },
  { what: "Lock a note", apple: "A password, Face ID or Touch ID", keep: "Not in Keep's help" },
  { what: "AI", apple: "Apple Intelligence: transcripts and summaries of recordings", keep: "Gemini: makes a list from a prompt and titles notes, on Android" },
];

const FAQ = [
  { q: "Is Google Keep or Apple Notes better?", a: [
    "If all your devices are Apple, Apple Notes does more: folders, tables, tags with Smart Folders, locked notes and 30 days to undo a delete. If you use Android or Windows, or share lists with people who do, Google Keep is the better fit, because it has an app or a web page everywhere and its reminders show up in Google Calendar.",
  ] },
  { q: "Does Google Keep have a Mac app?", a: [
    "Google's help covers Keep on a computer as keep.google.com in a browser: Safari, Chrome or Firefox on a Mac. There's also a Keep extension for Chrome that saves a page or a selection to a note. On iPhone, Keep is a free app on the App Store.",
  ] },
  { q: "Can I use Google Keep and Apple Notes on the same iPhone?", a: [
    "Yes, side by side, but they don't share notes. Adding your Google account to Apple Notes keeps Apple Notes' own notes in that account, and Keep doesn't show them. To move notes from one to the other you copy them, or import a Google Takeout download on a Mac.",
  ] },
  { q: "Which keeps deleted notes longer, Apple Notes or Google Keep?", a: [
    "Apple Notes. A deleted note stays in Recently Deleted for 30 days on all your devices and iCloud.com. Google Keep gives you seven days to restore a note from its Trash.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-vs-google-keep"
      intro={<>Apple Notes and Google Keep are both free and both quick to open. They grew up in different homes, and that decides most of the choice: which devices you use, and who you share your lists with.</>}
      answer={
        <Answer jump={[
          { href: "#at-a-glance", label: "At a glance" },
          { href: "#apple-notes", label: "Where Apple Notes wins" },
          { href: "#google-keep", label: "Where Google Keep wins" },
          { href: "#switching", label: "Moving between them" },
          { href: "#pinto-notes", label: "A third option" },
        ]}>
          <p>
            Pick <strong>Apple Notes</strong> if your devices are Apple and your notes are longer than a sticky note: it has folders,
            tables, tags, locked notes and 30 days to undo a delete. Pick <strong>Google Keep</strong> if you use Android or Windows, or
            share lists with people who do: it runs on Android, iPhone and the web, and its reminders show up in Google Calendar. Both are
            free, and neither syncs with the other.
          </p>
          <PostCta slug="apple-notes-vs-google-keep" position="answer" title="Coming from Keep to an iPhone and a Mac?">
            <p>Pinto Notes works like Apple Notes, imports your Google Keep notes on a Mac with labels as folders, keeps every earlier version, and lets ChatGPT or Claude read and edit your notes.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="at-a-glance">At a glance</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col"></th><th scope="col">Apple Notes</th><th scope="col">Google Keep</th></tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.what}><th scope="row">{r.what}</th><td>{r.apple}</td><td>{r.keep}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        As read on Apple&apos;s and Google&apos;s own help pages, and Keep&apos;s US App Store listing, on 21 November 2026.
      </p>

      <h2 id="apple-notes">Where Apple Notes is better</h2>
      <PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000}
        alt="Apple Notes on a Mac: folders in the sidebar, a list of notes, and a Groceries note with a checklist where three items are ticked."
        caption="A Groceries note in Apple Notes on a Mac, with folders in the sidebar. Screenshot: Pinto Notes." />
      <p>
        <strong>It holds longer notes well.</strong> Notes go in folders, and typing #word adds a tag you can gather in a Smart Folder.
        A note can have headings, tables, checklists that move ticked items to the bottom, and recordings. Math Results
        works out sums you type. With Apple Intelligence, a recording becomes a transcript and a summary.
      </p>
      <p>
        <strong>Locked notes are built in.</strong> You can lock a note with a password, Face ID or Touch ID, and a locked iCloud
        note gets its own encryption. Turn on Advanced Data Protection and Apple encrypts all your notes with keys only your devices hold;
        without it, Apple holds the keys so it can help you recover your data.
      </p>
      <p>
        <strong>Deleted notes stay longer.</strong> A deleted note waits in Recently Deleted for 30 days, on every device and on
        iCloud.com.
      </p>
      <p>
        <strong>Where it falls short:</strong> it&apos;s built for Apple devices. On Android or Windows you get icloud.com/notes in a
        browser, and sharing a note needs an Apple Account for each person. It keeps no version history,
        so text you deleted last week is gone. Notes kept in a Gmail or Yahoo account can&apos;t be locked, and Apple says some features aren&apos;t available in those accounts.
      </p>

      <h2 id="google-keep">Where Google Keep is better</h2>
      <p>
        <strong>It goes where you go.</strong> Keep has apps for Android and iPhone, runs on Wear OS watches, and opens at keep.google.com
        in Chrome, Firefox, Safari or Edge. A household with an Android phone and an iPhone can keep one shopping list. Keep doesn&apos;t
        run on an Apple Watch.
      </p>
      <p>
        <strong>Sharing is easy.</strong> Add anyone by name, email address or Google Group, or share with your Google family group, and
        they can edit the text, the list, pictures and recordings. Each person&apos;s labels, colours and pins stay their own.
      </p>
      <p>
        <strong>Reminders are built in.</strong> Give a note a date and time, repeating if you like, and the reminder also shows in Google
        Calendar and Google Tasks.
      </p>
      <p>
        <strong>Quick capture is the point.</strong> You can colour, pin, label and archive notes. You can snap a photo as a
        note and later find it by the words in the photo (in English), record a voice note, or save a web page with the Chrome
        extension. On a computer, Copy to Google Docs turns a note into a document. Keep also keeps earlier text versions of a note,
        which you download as a file from keep.google.com on a computer.
      </p>
      <p>
        <strong>Where it falls short:</strong> no folders, only up to 50 labels, and no locked notes in Keep&apos;s help. A deleted note
        can be restored for seven days. Gemini in Keep (a list from a prompt, a title for a note) is on Android, for Google AI Pro and
        Ultra subscribers or Pixel owners.
      </p>

      <h2 id="which-one">Which one to pick</h2>
      <ul>
        <li>Only Apple devices, and notes you keep for years: <strong>Apple Notes</strong>.</li>
        <li>An Android phone, a Windows PC, or a family on both: <strong>Google Keep</strong>.</li>
        <li>Shopping lists and reminders more than long notes: <strong>Google Keep</strong>.</li>
        <li>Notes that need a lock, a table or a folder: <strong>Apple Notes</strong>.</li>
      </ul>
      <p>
        If neither fits, <a href="/blog/apple-notes-alternatives">Apple Notes alternatives</a> compares more apps, including the ones that
        run on Windows and Android.
      </p>

      <h2 id="switching">Moving between them</h2>
      <p>
        The two never sync. If Apple Notes shows a Gmail account in its sidebar, those notes are Apple Notes&apos; own, stored in your
        Google account the way Mail is, and Keep doesn&apos;t show them. So moving means copying.
      </p>
      <p>
        <strong>Google Keep to Apple Notes:</strong> Google Takeout gives you a download of your Keep notes, with their text, list items,
        attachments, colours, pins and labels. On a Mac, Apple Notes&apos; File, Import to Notes takes .txt, .rtf, .rtfd, .html, .enex
        and .md files and puts them in an Imported Notes folder. Labels have nowhere to go, so add #tags to the notes that matter.
      </p>
      <p>
        <strong>Apple Notes to Google Keep:</strong> Keep can&apos;t import, so it&apos;s copy and paste, one note at a time. Here&apos;s{" "}
        <a href="/blog/move-apple-notes-to-obsidian-notion-keep">how to move Apple Notes to Google Keep</a>, step by step.
      </p>

      <h2 id="pinto-notes">A third option for iPhone and Mac</h2>
      <p>
        If you&apos;re leaving Keep for an iPhone and a Mac, you might want Apple Notes&apos; folders and tables without giving up what Keep
        did well: an AI that helps, earlier versions, lists you share. Pinto Notes is a notes app for iPhone and Mac that looks and works
        like Apple Notes, with notes stored as Markdown and encrypted.
      </p>
      <PostFigure src="/blog/launch/import-google-keep-guide" width={1600} height={1000} maxWidth={640} kind="plain"
        alt="Pinto Notes' Google Keep import guide on a Mac: Bring your Google Keep notes, then step 1, Ask Google for your notes, with Keep ticked on Google's download page."
        caption="Import from Google Keep in Pinto Notes walks you through Google's download, one step at a time." />
      <ul>
        <li><strong>Your Keep notes come along.</strong> On a Mac, Pinto Notes opens Google&apos;s download page with only Keep ticked. Drop the download in, and your labels become folders. <a href="/blog/import-your-notes">Importing your notes</a> covers every app it imports from.</li>
        <li><strong>Every earlier version.</strong> File, Version History shows each version of a note and who made it, and restores any of them.</li>
        <li><strong>Share a note and write in it together.</strong> Send a link, and the people you invite edit the note with you in Pinto Notes on iPhone or Mac: <a href="/blog/share-a-note-and-edit-it-together">sharing a note</a>.</li>
        <li><strong>Your AI in your notes.</strong> ChatGPT, Claude, Claude Code and Codex can read and edit your notes once you <a href="/blog/connect-chatgpt-to-your-notes">connect them</a>, which takes a minute.</li>
      </ul>
      <p>
        Your Apple Notes come over in one import on your Mac, and Apple Notes isn&apos;t changed:{" "}
        <a href="/blog/move-from-apple-notes">moving from Apple Notes</a>. It&apos;s a free download for the Mac and free on the App Store
        for iPhone.
      </p>
      <p>
        <strong>Where it falls short:</strong> Pinto Notes is Apple only. There&apos;s no Android, Windows or web app. If
        your list is shared with someone on Android, Keep is still the right tool for that list.
      </p>

      <p className="label">Sources</p>
      <p>
        Read on 21 November 2026: Google&apos;s <a href="https://support.google.com/keep/answer/6191044" rel="noopener">organise your
        notes</a>, <a href="https://support.google.com/keep/answer/6101196" rel="noopener">sharing</a>,{" "}
        <a href="https://support.google.com/keep/answer/3187168" rel="noopener">reminders</a>,{" "}
        <a href="https://support.google.com/keep/answer/6262765" rel="noopener">archive and trash</a>,{" "}
        <a href="https://support.google.com/keep/answer/13820887" rel="noopener">version history</a> and{" "}
        <a href="https://support.google.com/keep/answer/14626262" rel="noopener">Gemini in Keep</a>; Apple&apos;s{" "}
        <a href="https://support.apple.com/guide/iphone/iph904eee369/ios" rel="noopener">deleting and recovering notes</a>,{" "}
        <a href="https://support.apple.com/en-us/102537" rel="noopener">locking notes</a>,{" "}
        <a href="https://support.apple.com/en-us/102651" rel="noopener">iCloud data security</a> and{" "}
        <a href="https://support.apple.com/en-us/102223" rel="noopener">importing to Notes</a>.
      </p>
    </PostPage>
  );
}
