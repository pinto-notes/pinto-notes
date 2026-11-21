import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, MenuPaths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-search-not-working", { title: "Apple Notes search not working? 7 checks, in order" });

// Written 21 November 2026 for "apple notes search not working". Autocomplete that day (en-US): apple notes search not
// working, iphone notes search not working, mac notes search not working, iphone notes search not working after update,
// apple notes search function not working.
// Apple pages read on 21 Nov 2026, and every Apple fact here comes from one of them:
// - support.apple.com/guide/iphone/search-notes-iphb8628c6b8/ios (iOS 27): tags, typed and handwritten text in supported
//   languages, objects in images, text in scanned documents; locked notes show only their title; Find in Note with
//   Include Attachments for PDFs and other attachments.
// - support.apple.com/guide/notes/search-your-notes-not18ab658ed/mac (macOS 27): what search finds (body, attachment
//   filenames, PDFs, drawings and handwriting, what's in an image, scanned text), Current Account or All Accounts,
//   natural language search, Top Hits, locked notes show only the title even when unlocked, Recently Deleted notes are in
//   the results, Command-F in a note, View, Show Attachments Browser, notes appear in Spotlight; some features aren't
//   available in accounts from other providers.
// - support.apple.com/en-us/102476 (If you're missing notes, published 12 May 2026): update all devices first; Settings,
//   Apps, Notes, Notes Accounts; All Accounts selected; scroll to find the Search bar; search sees only the title of locked
//   notes; check other folders; you may not be using the right word.
// - support.apple.com/en-us/102321 (About Spotlight indexing, published 25 Aug 2026): indexing after a software update,
//   hours or even days, faster when not in use, on power and on Wi-Fi; the Settings notification and the Mac progress
//   indicator; Spotlight settings on Mac and Settings, Search on iPhone; the rebuild steps are for files in a disk or folder.
// - support.apple.com/guide/mac-help/mchlp2962/mac (If searching your Mac returns unexpected results) and
//   support.apple.com/guide/mac-help/mchl54d95e8a/mac (Spotlight settings: Results from Apps).
// - support.apple.com/guide/iphone/iph3c511548/ios (Search with Spotlight: Settings, Search, an app, Show App in Search)
//   and support.apple.com/guide/iphone/iph92579feda/ios (Notes settings: Search allows content from Notes in Search).
// - support.apple.com/guide/iphone/iph83bfec492/ios (Quit and reopen an app), iph841379c3d (Turn iPhone on or off),
//   iph3e504502 (Update iOS); support.apple.com/en-us/102586 (Force an app to quit on Mac, published 8 Dec 2025) and
//   support.apple.com/guide/mac-help/mchlpx1065/mac (Keep your Mac up to date: updates improve built-in apps like Notes).
// - Sync this iPhone and the iOS 27 iCloud path were verified in apple-notes-not-syncing (Apple Support 121669).
// Picture: Apple's own image of Notes search on iPhone (/blog/apple/iphone-notes-search-results), already used in
// recover-deleted-apple-notes; it shows Top Hits, Notes and Attachments for the search "Home".
// Pinto side: search reads every word in every note; ChatGPT or Claude, once connected, can find a note by what it's
// about. Apple Notes import on Mac leaves Apple Notes unchanged.

const FAQ = [
  { q: "Why can't Notes find a note I know is there?", a: [
    "Apple points to four things: the note is locked, so search only sees its title; the search covers one account instead of All Accounts; Notes is turned off for the account the note is in; or the word you typed isn't the one in the note. A note that hasn't synced to this device can't turn up either.",
  ] },
  { q: "Does Apple Notes search inside PDFs and scanned documents?", a: [
    "Yes. On a Mac, Apple lists PDFs you attached, attachment filenames, text in scanned documents, drawings and handwriting, and what's inside images. On iPhone, search covers handwriting in supported languages, objects in images and scanned documents. Inside one note, Find in Note with Include Attachments searches PDFs too.",
  ] },
  { q: "Why don't my notes show up in Spotlight?", a: [
    "On iPhone, open Settings, tap Search, then Notes, and check Show App in Search. Settings, Apps, Notes, Search also controls whether content from Notes appears in Search. On a Mac, apps turned off under Results from Apps in System Settings, Spotlight don't appear in Spotlight results.",
  ] },
  { q: "Why did Notes search stop working after an update?", a: [
    "Apple doesn't document a Notes search problem tied to updates. It does say Spotlight rebuilds its index after a software update and that this can take hours or even days. Apple's missing notes article starts by updating every device to the latest software, then searching with All Accounts selected.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-search-not-working"
      intro={<>You typed a word you know is in a note, and Notes found nothing. Most of the time the note is locked, in another account, or not on this device yet. Here are Apple&apos;s checks, most likely first.</>}
      answer={
        <Answer jump={[
          { href: "#covers", label: "What search covers" },
          { href: "#checks", label: "The checks in order" },
          { href: "#in-a-note", label: "Inside a note or PDF" },
          { href: "#spotlight", label: "Spotlight" },
          { href: "#after-update", label: "After an update" },
        ]}>
          <p>
            Search with All Accounts selected, and remember a locked note only shows up by its title. Then check that Notes is turned on
            for the account the note is in and that the note has synced to this device. If search still misses it, quit and reopen
            Notes, restart, and update to the latest iOS or macOS.
          </p>
          <PostCta slug="apple-notes-search-not-working" position="answer" title="Want to find a note by what it's about?">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac, and its search reads every word in every note. Connect ChatGPT or Claude and you can ask it to find a note by what it&apos;s about.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-notes-search-results" width={760} height={894} maxWidth={300}
        alt="Notes on iPhone searching for Home: one top hit, Home renovation project, one more note, Kitchen remodel ideas, tagged #Home, and no attachments found."
        caption="Notes search on iPhone, with Top Hits, Notes and Attachments. Image: Apple." />}
      faq={FAQ}
    >
      <h2 id="covers">What Notes search covers</h2>
      <p>
        Before you decide search is broken, it helps to know what it reads. On a Mac, Apple says search finds matches in:
      </p>
      <ul>
        <li>the body of each note</li>
        <li>the filenames of attachments, and PDFs you attached</li>
        <li>drawings and handwritten text</li>
        <li>what&apos;s inside an image (search &ldquo;bike&rdquo; to find a photo of one)</li>
        <li>text in a scanned document</li>
      </ul>
      <p>
        On iPhone, Apple lists tags, typed text, handwriting in supported languages, objects in images and text in scanned documents. Two
        limits matter on both. A locked note shows only its title in the results, even when it&apos;s unlocked. And Apple&apos;s Mac guide
        says some features aren&apos;t available in notes accounts from other providers, such as a Gmail account. Notes in Recently
        Deleted do turn up in results on a Mac.
      </p>

      <h2 id="checks">The checks, in order</h2>
      <Steps>
        <li id="all-accounts">
          <strong>Search all accounts</strong>
          On iPhone, tap back until you see your notes list, tap the Search bar (you may need to scroll to find it) and make sure All
          Accounts is selected. On a Mac, click the search button, click the menu next to the magnifying glass and choose All Accounts.
          That choice only appears if you have more than one account, such as iCloud and On My Mac.
        </li>
        <li id="locked">
          <strong>The note may be locked</strong>
          Search sees only the title of a locked note. If you searched for a word in its text, open your locked notes and look through them
          by hand. Lost the password? See <a href="/blog/forgot-apple-notes-password">forgot your Apple Notes password</a>.
        </li>
        <li id="account-on">
          <strong>Notes is on for every account</strong>
          A note in a Gmail, Yahoo or other account only shows up while Notes is turned on for that account. Tap the account and make sure
          Notes is on, then repeat for each account.
          <MenuPaths rows={[{ on: "iPhone", steps: ["Settings", "Apps", "Notes", "Notes Accounts"] }]} />
        </li>
        <li id="other-words">
          <strong>Try other words, then look by hand</strong>
          Apple&apos;s own advice is that you may not be using the word, phrase or title that&apos;s in the note. Try a different one, then
          open each folder and scroll. On a Mac you can also type the way you&apos;d say it, such as &ldquo;notes created last week&rdquo; or
          &ldquo;modified today&rdquo;.
        </li>
        <li id="synced">
          <strong>The note has reached this device</strong>
          If you wrote the note on another iPhone or Mac, it has to reach this one before search can find it. Check that Sync this iPhone or Sync
          this Mac is on for Notes in iCloud settings, on both. <a href="/blog/apple-notes-not-syncing">Apple Notes not syncing</a> has
          the rest of those checks.
          <MenuPaths rows={[
            { on: "iPhone, iOS 27", steps: ["Settings", "Your name", "iCloud", "See All", "Notes"] },
            { on: "Mac", steps: ["System Settings", "Your name", "iCloud", "Notes"] },
          ]} />
        </li>
        <li id="restart">
          <strong>Quit and reopen Notes, then restart</strong>
          On iPhone, open the App Switcher, swipe up on Notes, and open it again. If that doesn&apos;t help, Apple suggests turning the
          iPhone off and on. On a Mac, press Command-Q in Notes and open it again; if Notes doesn&apos;t respond, press Option-Command-Esc
          and click Force Quit. If that fails too, choose Restart from the Apple menu.
        </li>
        <li id="update">
          <strong>Update to the latest software</strong>
          Apple&apos;s missing notes article starts here: update every device to the latest iOS and macOS. Apple says macOS updates come
          with improvements for built-in apps such as Notes.
          <MenuPaths rows={[
            { on: "iPhone", steps: ["Settings", "General", "Software Update"] },
            { on: "Mac", steps: ["System Settings", "General", "Software Update"] },
          ]} />
        </li>
      </Steps>
      <p>
        If search finds the note in Recently Deleted, move it back to a folder before the 30 days are up. <a
        href="/blog/recover-deleted-apple-notes">How to recover deleted Apple Notes</a> has the steps.
      </p>

      <h2 id="in-a-note">Search inside one note, or a PDF in it</h2>
      <p>
        Long notes and attached PDFs have their own search. On iPhone, open the note, open the note&apos;s menu and tap Find in Note. To search
        PDFs and other attachments as well, open the search options and select Include Attachments, then type what you&apos;re looking
        for. On a Mac, open the note and press Command-F. For notes in iCloud or On My Mac, View, Show Attachments Browser lets you browse
        every attachment.
      </p>

      <h2 id="spotlight">When notes don&apos;t show up in Spotlight</h2>
      <p>
        Spotlight is the search for the whole device, and Apple&apos;s Mac guide says notes are included in its results. If they aren&apos;t:
      </p>
      <ul>
        <li><strong>iPhone:</strong> open Settings, tap Search, scroll down, tap Notes and turn on Show App in Search. Under Settings, Apps, Notes, the Search setting decides whether content from Notes appears in Search and widgets.</li>
        <li><strong>Mac:</strong> open System Settings, click Spotlight, and look at Results from Apps. Apps turned off there don&apos;t appear in Spotlight results.</li>
      </ul>
      <p>
        Apple also has steps for rebuilding part of the Spotlight index on a Mac, under Search Privacy. They&apos;re written for files in a
        disk or folder, and Apple doesn&apos;t say they help Notes.
      </p>

      <h2 id="after-update">If it started after an update</h2>
      <p>
        Apple says Spotlight builds its index again after you install a software update, and that it can take hours or even days. It goes
        faster when the device isn&apos;t in use, is on power and is on Wi-Fi. While it runs, iPhone shows a notification in Settings that
        search and Siri are optimizing, and on a Mac, pressing Command-Space bar shows a progress indicator at the top of Spotlight.
      </p>
      <p>
        Apple doesn&apos;t say whether search inside the Notes app waits for this index, so the checks above still come first.
      </p>

      <h2 id="pinto-notes">Finding a note by what it&apos;s about</h2>
      <p>
        Every check above assumes you remember a word that&apos;s in the note. When you only remember what it was about, a word search
        can&apos;t help. Pinto Notes, the notes app for iPhone and Mac, looks and works like Apple Notes, and its search reads every word in
        every note. Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, which takes a minute, you can
        also ask it to find the note by what it&apos;s about, in your own words.
      </p>
      <p>
        It won&apos;t fix search in Apple Notes. <a href="/blog/move-from-apple-notes">Moving from Apple Notes</a> takes one import on your
        Mac, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
