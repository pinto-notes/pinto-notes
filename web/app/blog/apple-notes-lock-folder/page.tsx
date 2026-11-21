import { PostCta } from "@/lib/PostCta";
import { Figure } from "@/lib/blog";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Capture, Paths, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-lock-folder", { title: "Apple Notes lock folder: how to protect every note in it" });

// Written 21 November 2026 for "apple notes lock folder". Google autocomplete (en-US, read 21 Nov): apple notes lock
// folder, apple notes password protect folder, iphone notes lock folder, ios notes lock folder, apple notes secure folder,
// apple notes protect folder, iphone notes folder password, mac notes lock folder, can i lock a folder in apple notes,
// how to lock a folder in apple notes, why can't i lock my notes on mac, does apple have a secure folder.
// Apple facts, all read on 21 Nov 2026:
// - support.apple.com/en-us/102537 (published 11 Dec 2025): More, Lock on iPhone; View Note; Face ID, Touch ID or the
//   notes password; device passcode since iOS 16 with iCloud Keychain; what can't be locked, including notes with tags,
//   IMAP accounts (Gmail, Yahoo), shared notes and Managed Apple Accounts; Apple can't recover a forgotten password.
// - iPhone guide "Lock your notes on iPhone" (iphf177bb154, iOS 27): a locking method per account; the title stays
//   visible in the notes list; opening one locked note opens every locked note in that account for several minutes;
//   Lock Now at the top of the notes list; Quick Notes and notes that use newer features can't be locked.
// - Mac guide "Lock your notes on Mac" (not28c5f5468, macOS 27): Notes, Settings, Locked notes, Use Login Password or
//   Use Custom Password, Use Touch ID; More, Lock Note; no password again in the same session; all locked notes in the
//   account stay unlocked while you use Notes; the Lock button closes them; inactivity or quitting closes them; what
//   can't be locked (Quick Note, shared, video, audio, PDF or document attachments, tags, iCloud not upgraded).
// - Mac guide "Use Smart Folders" (apd58edc7964): Smart Folders can't be locked.
// - Mac guide "Share notes and collaborate" (apd4e6e2c9a6): notes added to a shared folder are shared automatically;
//   you can't collaborate on a locked note or a folder with locked notes.
// - iPhone guide "Lock or hide an app" (iph00f208d05, iOS 27): Require Face ID (or Touch ID or Passcode); built-in apps
//   can't be hidden; only on that iPhone, doesn't sync; relocks when you quit; hidden from search and notification previews.
// - Search sees only the title of a locked note: verified in recover-deleted-apple-notes (Apple 102476).
// Apple's pages describe no folder lock and no setting that locks new notes in a folder; the post says only that.
// Pinto side, only verified claims: encrypted-notes-app-for-ai (locked notes encrypted a second time with a key made
// from the notes password, which never leaves your devices; an AI sees only titles), SHOTS.notesPassword (password,
// verify and hint; can't be recovered, not even by us), pinto-notes-for-iphone (lock a note with a password and Face ID),
// Pane/Model/NoteLock.swift (Face ID or Touch ID unlock; Lock Now; locks notes, not folders), move-from-apple-notes
// (locked Apple notes stay behind in the import).
// Pictures: the hero and phone crop are the macOS 27 captures from forgot-apple-notes-password (a folder with one locked
// note, its title in the list); the iPhone locked note is Apple's image; the Pinto password sheet is SHOTS.notesPassword.

const FAQ = [
  { q: "Can you password protect a folder in Apple Notes?", a: [
    "No. Apple Notes locks notes, one at a time, and Apple's pages describe no lock for a folder. Smart Folders can't be locked either. To protect a folder, lock each note in it with your notes password.",
  ] },
  { q: "Why can't I lock a note on my Mac?", a: [
    "Check what's in it. Apple lists notes that can't be locked: Quick Notes, shared notes, notes with tags, notes with a video, audio file, PDF or document attached, and notes in an account other than iCloud or On My Mac, such as Gmail.",
  ] },
  { q: "Can people see the titles of my locked notes?", a: [
    "Yes. The title of a locked note stays visible in the notes list, and search finds a locked note by its title only. Keep anything private out of the first line.",
  ] },
  { q: "Does Apple Notes have a hidden or secure folder?", a: [
    "Not in Apple's guides. On iPhone you can lock the whole Notes app with Face ID, Touch ID or your passcode instead: touch and hold Notes on the Home Screen, then tap Require Face ID.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-lock-folder"
      intro={<>Apple Notes can&apos;t lock a folder. It locks notes, so a private folder is a folder where every note is locked. Here&apos;s how to set that up on iPhone and Mac, and the app lock that covers all of Notes on iPhone.</>}
      answer={
        <Answer jump={[
          { href: "#lock-each-note", label: "Lock each note" },
          { href: "#open-and-close", label: "Open and close" },
          { href: "#cant-lock", label: "Can't lock it?" },
          { href: "#lock-the-app", label: "Lock the app" },
        ]}>
          <p>
            There&apos;s no folder lock in Apple Notes, on iPhone or Mac. Set a notes password, then lock each note in the folder with More,
            Lock (Lock Note on a Mac). They all use the same password, Face ID or Touch ID, and opening one opens the rest of that
            account&apos;s locked notes for a while.
          </p>
          <PostCta slug="apple-notes-lock-folder" position="answer" title="Want locked notes no AI can read?">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac, and lets ChatGPT or Claude work in your notes. Locked notes stay out of their reach: an AI sees only the title.</p>
          </PostCta>
        </Answer>
      }
      hero={<Capture priority src="/blog/macos27/notes-locked-window" width={1520} height={984} maxWidth={760}
        phone={{ src: "/blog/macos27/notes-locked-hint", width: 720, height: 580 }}
        alt="The Apple Notes window on macOS 27: the Notes folder in the sidebar holds one note, Lisbon, 4 days in May, marked Locked in the list, and the note asks for the notes password, with the hint City and year of the trip."
        caption="A locked note in its folder on macOS 27. The folder stays open and the title shows in the list; only the note is locked." />}
      faq={FAQ}
    >
      <h2 id="no-folder-lock">What Apple Notes locks</h2>
      <p>
        Apple&apos;s pages on locking (the <a href="https://support.apple.com/en-us/102537" rel="noopener">support article</a> and the{" "}
        <a href="https://support.apple.com/guide/iphone/iphf177bb154/ios" rel="noopener">iPhone</a> and{" "}
        <a href="https://support.apple.com/guide/notes/not28c5f5468/mac" rel="noopener">Mac</a> guides) describe locking notes. None of them
        mentions locking a folder. Apple&apos;s <a href="https://support.apple.com/guide/notes/apd58edc7964/mac" rel="noopener">Smart Folders
        guide</a> says it outright: Smart Folders can&apos;t be locked.
      </p>
      <p>
        The password belongs to the account, such as iCloud or On My iPhone, and every note you lock in that account uses it. So a folder
        where you lock every note works like a locked folder, with two differences. The folder name and each note&apos;s title stay visible,
        and a new note you add to the folder isn&apos;t locked until you lock it. Apple describes no setting that does that for you.
      </p>

      <h2 id="set-password">First, choose how notes unlock</h2>
      <p>Pick a separate notes password, or your device passcode (your login password on a Mac), for each account:</p>
      <Paths rows={[
        { on: "iPhone", steps: ["Settings", "Apps", "Notes", "Password"] },
        { on: "Mac", steps: ["Notes", "Settings", "Locked notes"] },
      ]} />
      <p>
        On iPhone, choose the account, then Use Device Passcode or Use Custom Password, and turn on Face ID or Touch ID if you like. On a
        Mac, choose Use Login Password or Use Custom Password from the menu beside Locked notes, and select Use Touch ID if your Mac or Magic
        Keyboard has it. The passcode option needs iCloud Keychain, and the device has to run iOS 16 or macOS 13 or later. A custom
        password can&apos;t be recovered by Apple if you forget it, so add a hint.
      </p>

      <h2 id="lock-each-note">Lock every note in the folder</h2>
      <p className="label"><strong>On iPhone</strong></p>
      <Steps>
        <li>Open the folder, then open the first note.</li>
        <li>Tap the More button (three dots), then tap Lock.</li>
        <li>Go back and repeat for each note in the folder.</li>
      </Steps>
      <p className="label"><strong>On a Mac</strong></p>
      <Steps>
        <li>Select the folder in the sidebar, then the first note.</li>
        <li>Click the More button next to the search field, choose Lock Note, and enter the password or use Touch ID.</li>
        <li>Select the next note and do the same. Once you&apos;ve entered the password in this session of Notes, it doesn&apos;t ask again.</li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-note-is-locked" width={760} height={910} maxWidth={300}
        alt="A locked note on iPhone: a grey padlock, the words This note is locked, and a View Note button."
        caption="A locked note on iPhone. Tap View Note to open it. Image: Apple." />
      <p>
        Apple&apos;s steps lock one note at a time. When you add a note to the folder later, lock it as soon as you&apos;ve written it.
      </p>

      <h2 id="open-and-close">Open and close them</h2>
      <p>
        A whole folder of locked notes doesn&apos;t mean typing the password for each one. On iPhone, opening one locked note opens all the
        locked notes in that account for several minutes. On a Mac, they stay open while you use Notes.
      </p>
      <ul>
        <li><strong>On iPhone</strong>, tap the locked note, then View Note, and use Face ID, Touch ID, your passcode or the notes password. To lock them again, tap the open lock in the note, or Lock Now at the top of the notes list. They also lock when you close Notes or the iPhone sleeps.</li>
        <li><strong>On a Mac</strong>, select a locked note and enter the password or use Touch ID. Click the Lock button next to the search field to close every locked note at once. Notes also closes them after a while without use, or when you quit.</li>
      </ul>

      <h2 id="cant-lock">If a note in the folder won&apos;t lock</h2>
      <p>Apple lists the notes that can&apos;t be locked. If Lock is missing for a note, it&apos;s usually one of these:</p>
      <ul>
        <li><strong>It has a tag.</strong> Notes with tags can&apos;t be locked, so a &ldquo;#private&rdquo; tag and a Smart Folder can&apos;t make a locked folder. Use an ordinary folder. More on tags in <a href="/blog/apple-notes-tags-smart-folders">tags and Smart Folders</a>.</li>
        <li><strong>It has a video, audio file, PDF or document attached.</strong> On a Mac, tables, images, drawings, scanned documents, maps and web attachments are fine.</li>
        <li><strong>It&apos;s shared.</strong> Notes you add to a shared folder are shared with everyone in it, and Apple says you can&apos;t collaborate on a folder with locked notes. Keep private notes in a folder you don&apos;t share.</li>
        <li><strong>It&apos;s a Quick Note,</strong> or it uses features from a newer version of Notes.</li>
        <li><strong>It&apos;s in another account.</strong> Only notes in iCloud or on the device can be locked, so notes in Gmail or Yahoo can&apos;t. <a href="/blog/move-apple-notes-to-icloud">Move them to iCloud</a> first. If you&apos;re signed in to iCloud with a Managed Apple Account, you can&apos;t lock notes at all.</li>
      </ul>

      <h2 id="lock-the-app">Lock the whole Notes app on iPhone</h2>
      <p>
        If you want every folder covered, iPhone can lock the app itself, from Apple&apos;s{" "}
        <a href="https://support.apple.com/guide/iphone/iph00f208d05/ios" rel="noopener">Lock or hide an app</a> guide:
      </p>
      <Steps>
        <li>On the Home Screen, touch and hold Notes until the menu opens.</li>
        <li>Tap Require Face ID (or Touch ID or Passcode), then tap it again to confirm.</li>
      </Steps>
      <p>
        Notes then asks for Face ID, Touch ID or your passcode each time it opens, and locks again when you quit it. What&apos;s inside
        stays out of search and notification previews. It only applies to that iPhone and doesn&apos;t sync to your Mac. Built-in apps
        like Notes can be locked but not hidden.
      </p>

      <h2 id="where-it-stops">Where it stops</h2>
      <ul>
        <li>Titles show. A locked note&apos;s title stays in the notes list, and search finds it by its title only. Write the first line with that in mind.</li>
        <li>It&apos;s one note at a time, and new notes in the folder start unlocked.</li>
        <li>Many notes can&apos;t be locked at all, as above, so a folder can hold locked and unlocked notes side by side.</li>
        <li>A forgotten custom password can&apos;t be recovered by Apple. <a href="/blog/forgot-apple-notes-password">Forgot your Apple Notes password?</a> has what&apos;s worth trying.</li>
      </ul>

      <h2 id="pinto-notes">Locked notes in Pinto Notes</h2>
      <p>
        Pinto Notes, a notes app for iPhone and Mac that looks and works like Apple Notes, locks notes the same way: one note at a time,
        with a password you choose and a hint. You open them with the password, Face ID or Touch ID. A locked note is encrypted a second
        time, with a key made from your notes password, and that key never leaves your devices. If you forget the password, the notes
        can&apos;t be recovered, not even by us.
      </p>
      <Figure shot={SHOTS.notesPassword} caption="Setting a password for locked notes in Pinto Notes on a Mac. Like Apple's, it can't be recovered if you forget it." />
      <p>
        The difference is what an AI can reach. Once you connect ChatGPT or Claude, they can read and edit your other notes, and a locked
        note stays closed to them: they see only its title. <a href="/blog/encrypted-notes-app-for-ai">How the encryption works</a> has
        the details.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
        Locked notes stay behind, because the import can&apos;t read them, so unlock the ones you want to bring and lock them again in Pinto
        Notes.
      </p>
    </PostPage>
  );
}
