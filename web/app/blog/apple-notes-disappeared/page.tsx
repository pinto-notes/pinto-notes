import { PostCta } from "@/lib/PostCta";
import { Figure } from "@/lib/blog";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
// Written 21 November 2026 for "apple notes disappeared". Google autocomplete (en-US, 21 Nov): apple notes disappeared,
// apple notes disappeared after update, iphone notes disappeared, icloud notes disappeared, mac notes disappeared,
// iphone notes disappeared after update, iphone notes disappeared after sync, iphone notes disappeared and reappear,
// ios notes disappeared; also notes app disappeared from iphone, apple notes not showing up, apple notes not showing
// up on phone, apple notes not showing folders.
// Apple pages read on 21 Nov 2026: Support 102476 (If you're missing notes, published 12 May 2026), 121669 (If you
// don't see your iCloud notes, published 21 March 2025), 118582 (Delete built-in Apple apps, published 18 June 2026);
// iPhone User Guide, iOS 27: Add or remove accounts in Notes (iph7262fd4fe), Delete and recover notes (iph904eee369),
// Change Notes settings (iph92579feda), Organize in folders (ipha61270292), Find and use your apps in App Library
// (iph87abad19a), Remove or delete apps (iph248b543ca), Sign in to your Apple Account (aside iph39beaede9); Notes User
// Guide for Mac, macOS 27: Add or remove accounts (not85d6f7b58), About accounts and folders (notc3b2d538b), Delete a
// note (not5585d71a8), View your notes (apd8b73d28be); iCloud User Guide: Set up iCloud for Notes on all your devices
// (mm8685520792). Pictures are reused from apple-notes-not-syncing and recover-deleted-apple-notes with their own alt
// text. Pinto side: every earlier version of a note is kept; Apple Notes import on a Mac, Apple Notes isn't changed.
export const metadata = postMetadata("apple-notes-disappeared", { title: "Apple Notes disappeared? 7 places to look, in order" });

const FAQ = [
  { q: "Why did all my notes disappear from my iPhone?", a: [
    "Apple says missing notes may have been deleted by accident, or a setting needs to change. Check that Notes is turned on for iCloud (Settings, your name, iCloud), look in Recently Deleted, and make sure Notes is on for every other account, such as Gmail or Yahoo.",
  ] },
  { q: "My notes disappeared after an update. What do I do?", a: [
    "Apple's missing-notes steps start with updating every device to the latest iOS and macOS. Then check that Notes is still on for iCloud and that you're signed in to the same Apple Account as before. If notes are still missing, Apple says to restart the iPhone and check the setting again.",
  ] },
  { q: "How do I get the Notes app back on my iPhone?", a: [
    "Swipe left past your last Home Screen page to App Library and search for Notes. If it's there, touch and hold it to put it back on the Home Screen. If it was deleted, open the App Store, search for Notes and tap the Redownload button.",
  ] },
  { q: "Does deleting the Notes app delete my notes?", a: [
    "Apple says deleting a built-in app also deletes its related data on that device, while data stored in iCloud isn't deleted when you delete an app. Notes in iCloud are also on icloud.com/notes.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-disappeared"
      intro={<>Your notes were there yesterday, and now the list is empty or a folder is gone. Apple&apos;s own advice is that missing notes were either deleted by accident, or a setting needs to change. These checks go through both, quickest first.</>}
      answer={
        <Answer jump={[
          { href: "#checks", label: "The checks in order" },
          { href: "#on-a-mac", label: "On a Mac" },
          { href: "#app-gone", label: "The app is gone" },
          { href: "#pinto-notes", label: "Keep a second copy" },
        ]}>
          <p>
            First check that Notes is turned on for iCloud, then open Recently Deleted, where a deleted note waits for 30 days. After that,
            make sure Notes is on for your other accounts, such as Gmail, and that every device is signed in to the same Apple Account.
            If the Notes app itself is missing, it&apos;s in App Library or in the App Store.
          </p>
          <PostCta slug="apple-notes-disappeared" position="answer" title="Want every version of your notes kept?">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac, and keeps every earlier version of each note. On a Mac it can import your Apple Notes once, as a second copy, and Apple Notes isn&apos;t changed.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Apple Notes on macOS 27 without iCloud: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. System Settings and Cancel."
        caption="What Notes shows on a Mac where Notes is turned off for iCloud. The notes are still in iCloud; this Mac just isn't showing them." />}
      faq={FAQ}
    >
      <h2 id="checks">The checks, in order</h2>
      <p>
        Apple&apos;s <a href="https://support.apple.com/en-us/102476" rel="noopener">missing notes article</a> starts with one step before
        any of these: update every device to the latest iOS or macOS, so the problem isn&apos;t old software. Then work down the list.
      </p>
      <Steps>
        <li id="icloud-on">
          <strong>Notes is turned on for iCloud</strong>
          If your iCloud notes don&apos;t appear, Apple&apos;s fix is to make sure Sync this iPhone is on, then check Notes. If they still
          don&apos;t show, restart the iPhone and check the setting again. Apple says the notes should then appear and start syncing,
          and that content synced to iCloud before should appear once syncing completes.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Settings", "Your name", "iCloud", "See All", "Notes", "Sync this iPhone"] },
            { on: "Mac, macOS 15 or later", steps: ["System Settings", "Your name", "iCloud", "Notes", "Sync this Mac"] },
          ]} />
        </li>
        <li id="recently-deleted">
          <strong>Recently Deleted</strong>
          A deleted note moves to Recently Deleted on your iPhone, on iCloud.com and on your other devices signed in to the same Apple
          Account, and stays there for 30 days. On iPhone, go back to the folder list, tap Recently Deleted, swipe left on the note and
          tap Move. The folder only appears when it has something in it. <a href="/blog/recover-deleted-apple-notes">How to recover
          deleted Apple Notes</a> has every route, including after the 30 days.
        </li>
        <li id="search">
          <strong>Search with All Accounts selected</strong>
          In the notes list, tap the Search bar and type a word or the title, with All Accounts selected. Search only sees the title of a
          locked note, so open locked notes by hand. If search finds nothing, tap the back icon until you see your Folders list, then open
          each folder: a note can sit in one you didn&apos;t expect.
        </li>
        <li id="other-accounts">
          <strong>Notes is on for Gmail, Yahoo and other accounts</strong>
          Notes kept in a mail account only show while Notes is turned on for that account. Check each account. Their deleted notes
          don&apos;t go to Recently Deleted: look in that account&apos;s Trash in the Mail app, then copy the note into a new one.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Settings", "Apps", "Notes", "Notes Accounts", "The account", "Notes"] },
            { on: "Mac", steps: ["Notes", "Accounts", "The account", "Notes"] },
          ]} />
        </li>
        <li id="same-account">
          <strong>Every device uses the same Apple Account</strong>
          Apple says that on a device that isn&apos;t signed in to your Apple Account, you won&apos;t be able to see your iCloud notes. The
          name at the top of Settings on iPhone, or at the top of the System Settings sidebar on a Mac, is the account that device uses.
          To see what iCloud holds, sign in at icloud.com/notes in a browser with the same account.
        </li>
        <li id="on-my-iphone">
          <strong>The notes were kept on one device</strong>
          Notes in the On My iPhone account appear only on that iPhone, and notes in On My Mac only on that Mac. If a note is missing on
          your other device, look at the heading above its folder on the device that has it. <a href="/blog/move-apple-notes-to-icloud">Moving
          notes into iCloud</a> puts them on every device.
        </li>
        <li id="restart">
          <strong>Restart, then check again</strong>
          If notes are still missing after the switches above, Apple&apos;s next step is a restart, then checking the iCloud setting once
          more. If notes show on one device and not the other, see <a href="/blog/apple-notes-not-syncing">Apple Notes not syncing</a>.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-recently-deleted" width={760} height={894} maxWidth={300}
        alt="The Recently Deleted folder in Notes on iPhone with four notes, under a line saying deleted notes are removed after 30 days and permanent deletion from iCloud may take up to 40 more days."
        caption="Recently Deleted on iPhone. It only appears when it holds a note. Image: Apple." />
      <PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} maxWidth={300}
        alt="An iPhone's settings for a Gmail account, with switches for Mail, Contacts, Calendars and Notes, all turned on."
        caption="A mail account's notes only show while its Notes switch is on. Image: Apple." />

      <h2 id="on-a-mac">Notes or folders missing on a Mac</h2>
      <PostFigure src="/blog/macos27/notes27-sidebar-on-my-mac-only" width={1336} height={720} maxWidth={600}
        alt="The Apple Notes sidebar on macOS 27 with only an On My Mac section: All on My Mac, Notes, a folder and Recently Deleted. No iCloud section."
        caption="No iCloud heading in the sidebar means this Mac isn't showing your iCloud notes. Check Sync this Mac first." />
      <ul>
        <li><strong>No sidebar.</strong> Choose View, Show Sidebar.</li>
        <li><strong>An account with no folders under it.</strong> Hold the pointer over the account name in the sidebar until a button appears, then click it.</li>
        <li><strong>A whole account missing.</strong> Choose Notes, Accounts, select the account and turn on Notes. Apple says an account&apos;s notes aren&apos;t available while Notes is off for it.</li>
        <li><strong>A deleted note.</strong> Click Recently Deleted and drag the note to another folder in the sidebar. If your iCloud notes aren&apos;t upgraded, or the note was in another kind of account, there&apos;s no Recently Deleted folder, and Apple says deleted notes are removed from every device that uses that account.</li>
        <li><strong>A shared note.</strong> If the owner deleted a note they shared, Apple says it&apos;s deleted from every participant&apos;s devices too. If you deleted a note someone shared with you, you may be able to open it again from the original link, unless the owner stopped sharing.</li>
      </ul>

      <h2 id="app-gone">When the Notes app itself is gone</h2>
      <p>
        An app removed from the Home Screen isn&apos;t deleted. It moves to App Library, and you can still use it from there.
      </p>
      <Steps>
        <li>On the Home Screen, swipe left past all your pages to App Library.</li>
        <li>Tap the search field at the top and type Notes.</li>
        <li>To put it back, touch and hold the icon until the icons jiggle and it moves to the Home Screen, then lift your finger.</li>
      </Steps>
      <p>
        Notes is one of the built-in apps Apple lets you delete. If it isn&apos;t in App Library, open the App Store, search for Notes by
        its exact name, tap the Redownload button, and open it from the Home Screen when it&apos;s done. Apple says deleting a built-in app
        also deletes its related data on the device, while data stored in iCloud isn&apos;t deleted with the app. Notes in On My iPhone
        are included in your iPhone backups to iCloud.
      </p>

      <h2 id="next-time">So it doesn&apos;t happen again</h2>
      <ul>
        <li>Set the default account to iCloud in Settings, Apps, Notes, Default Account. It decides where notes made with Siri and the Notes widget go.</li>
        <li>Keep your own copy of the notes you can&apos;t lose. <a href="/blog/back-up-apple-notes">How to back up Apple Notes</a> has a routine.</li>
      </ul>

      <h2 id="pinto-notes">Keep a second copy, with every version</h2>
      <p>
        Recently Deleted covers a note that was deleted. It doesn&apos;t cover a note someone changed, since Apple Notes keeps <a
        href="/blog/apple-notes-version-history">no version history</a>. Pinto Notes, the notes app for iPhone and Mac, keeps every
        earlier version of each note, so a paragraph that vanished from a note can be restored.
      </p>
      <p>
        It won&apos;t bring back notes already lost in Apple Notes. <a href="/blog/move-from-apple-notes">Importing from Apple
        Notes</a> takes one import on your Mac and gives you a second copy, and Apple Notes isn&apos;t changed.
      </p>
      <Figure shot={SHOTS.history} caption="Version history in Pinto Notes on a Mac: each earlier version, who made it, and Restore This Version." />
    </PostPage>
  );
}
