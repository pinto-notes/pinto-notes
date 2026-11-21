import { PostCta } from "@/lib/PostCta";
import { Figure } from "@/lib/blog";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("where-are-apple-notes-stored", { title: "Where are Apple Notes stored? iCloud, your Mac or Gmail" });

// Written 21 November 2026 for "where are apple notes stored". Google autocomplete (en-US, read 21 Nov):
// where are apple notes stored on mac, locally, on macbook, in icloud; where are mac notes stored (locally);
// where are iphone notes stored, in gmail; where are icloud notes stored (on mac, on iphone); where are my
// iphone notes stored.
// Apple facts, all read on support.apple.com on 21 November 2026:
// - "Add or remove accounts in Notes on iPhone" (guide/iphone/iph7262fd4fe/ios): iCloud, enterprise-managed
//   iCloud, Microsoft Exchange, Google and Yahoo accounts; On My iPhone is for notes kept only on this device,
//   they appear only on that iPhone and are included in iPhone backups to iCloud; every feature works with
//   iCloud and On My iPhone, some don't with other accounts; a removed account's notes remain in the internet
//   account (for example iCloud.com or Google); Settings, Apps, Notes, Notes Accounts.
// - "Add or remove accounts in Notes on Mac" (guide/notes/not85d6f7b58/mac): Notes, Accounts; Google, Yahoo,
//   AOL; On My Mac notes are stored locally on the computer and can't be reached from other devices or
//   iCloud.com; Delete Account removes the notes from that Mac only. "Change settings in Notes on Mac"
//   (apd97da26aed): Default account is the one Siri uses; Enable the On My Mac account.
// - "Change Notes settings on iPhone" (iph92579feda): Default Account, for notes made with Siri and the widget.
// - "Set up iCloud for Notes on all your devices" (guide/icloud/mm8685520792): iCloud notes on iPhone, Mac and
//   icloud.com/notes; the Settings paths for iPhone and macOS 15 or later (Sync this iPhone, Sync this Mac).
// - 102537 (lock notes): only notes on your device and in iCloud can be locked; Gmail and Yahoo accounts sync
//   over IMAP, miss some features and can't be locked.
// - 102476 (missing notes): a deleted note in Gmail or Yahoo usually goes to that account's Trash in Mail.
// - iPhone guide iph904eee369: Recently Deleted keeps notes 30 days, on every device with the same Apple Account.
// - 108770 (what iCloud backs up): Notes is named among the things that sync to iCloud.
// - 102651 (iCloud data security): Notes with standard data protection is encrypted in transit and on server
//   with keys held by Apple; with Advanced Data Protection the keys are on your trusted devices.
// - "Import, export, and print notes on Mac" (not201900c07, Notes 4.13, macOS 27): File, Export To, PDF or Markdown.
// No Apple page gives a folder on disk for any account, so the post names none.
// Pictures: reused, each shows what the text says. public/blog/apple/iphone-notes-ios27-folders-list,
// iphone-settings-icloud-storage-notes and iphone-settings-mail-account-notes-switch (Apple's images, as used in
// move-apple-notes-to-icloud and apple-notes-not-syncing), public/blog/macos27/notes27-settings-default-account-on-my-mac
// (Notes on macOS 27, read for this post: "Notes in On My Mac are stored on this computer"), and SHOTS.connectList.
// Pinto Notes: each note is a Markdown file in folders to a connected AI (supabase/functions/mcp/files_tools.ts,
// FILE_INSTRUCTIONS); one sign-in syncs iPhone and Mac with no On My iPhone or mail accounts (move-apple-notes-to-icloud);
// encrypted on your device before it syncs (best-notes-app-for-mac); every earlier version kept and the Apple Notes
// import (BRIEF facts, import-your-notes).

const FAQ = [
  { q: "Are Apple Notes stored locally or in iCloud?", a: [
    "It depends on the account a note is in. Notes under iCloud are kept in iCloud and on every device signed in to the same Apple Account with Notes turned on. Notes under On My iPhone or On My Mac are stored only on that device.",
  ] },
  { q: "Where are iPhone notes stored in Gmail?", a: [
    "Notes under a Gmail heading in Notes are kept in your Google account and sync with Notes over IMAP, the way Mail does. Apple says they stay in your Google account if you remove it from your iPhone. Open and edit them in Notes.",
  ] },
  { q: "Can I find my Apple Notes as files on my Mac?", a: [
    "Apple's guides don't name a folder for notes, in iCloud or On My Mac, and only open them in Notes. To get a note as a file, open it and choose File, Export To, then PDF or Markdown.",
  ] },
  { q: "Are iCloud notes encrypted?", a: [
    "Yes. Apple says notes in iCloud are encrypted in transit and on its servers, with Apple holding the keys. With Advanced Data Protection turned on, the keys are kept only on your trusted devices.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="where-are-apple-notes-stored"
      intro={<>Every note in Apple Notes lives in an account, and the account decides where the note is kept. Here&apos;s how to see which one each note is in, and what that means for your other devices.</>}
      answer={
        <Answer jump={[
          { href: "#which-account", label: "Which account a note is in" },
          { href: "#icloud", label: "iCloud" },
          { href: "#on-device", label: "On My iPhone and On My Mac" },
          { href: "#gmail", label: "Gmail and other accounts" },
          { href: "#compare", label: "Side by side" },
        ]}>
          <p>
            Notes under the iCloud heading are kept in iCloud and on every device signed in to your Apple Account, and at
            icloud.com/notes. Notes under On My iPhone or On My Mac stay on that one device. Notes under Gmail, Yahoo or another
            mail account are kept in that email account. Apple doesn&apos;t give a folder on disk for any of them.
          </p>
          <PostCta slug="where-are-apple-notes-stored" position="answer" title="Want notes your AI can read?">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac, with one sign-in and no accounts to sort out. Each note is a Markdown file that ChatGPT or Claude can read and edit once you connect them.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="The Folders list in Notes on iPhone with iOS 27: Quick Notes and Shared at the top, then an iCloud heading with its folders, and Tags below."
        caption="The heading above a folder, here iCloud, is where its notes are kept. Image: Apple." />}
      faq={FAQ}
    >
      <h2 id="which-account">See which account a note is in</h2>
      <p>
        Notes groups folders under a heading for each account: iCloud, On My iPhone (On My Mac on a Mac), Gmail, Yahoo, or a work
        account such as Microsoft Exchange. On iPhone, go back to the folders list. On a Mac, look at the sidebar. A note is kept
        wherever its folder&apos;s heading says.
      </p>
      <p>To see every account set up for Notes, and switch Notes on or off for each one:</p>
      <Paths rows={[
        { on: "iPhone", steps: ["Settings", "Apps", "Notes", "Notes Accounts"] },
        { on: "Mac", steps: ["Notes", "Accounts"] },
      ]} />
      <p>
        If a whole account is missing from the list, Notes is probably turned off for it. Its notes aren&apos;t gone: Apple says they
        stay with the account, and come back when you turn Notes on again.
      </p>

      <h2 id="icloud">Notes in iCloud</h2>
      <PostFigure src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} maxWidth={250}
        alt="The iCloud screen in iPhone Settings: storage at 4.1 of 50 GB, and under Saved to iCloud, Photos, Drive, Passwords, Notes with 29 items, Messages and Mail."
        caption="Settings, your name, iCloud: Notes is listed under Saved to iCloud. Image: Apple." />
      <p>
        iCloud is the account most people use, and the only one where every Notes feature works on all your devices. Your notes are
        kept in iCloud and appear in Notes on each iPhone and Mac signed in to the same Apple Account, and in any browser at
        icloud.com/notes. Turn Notes on for iCloud here:
      </p>
      <Paths rows={[
        { on: "iPhone", steps: ["Settings", "Your name", "iCloud", "See All", "Notes", "Sync this iPhone"] },
        { on: "Mac, macOS 15 or later", steps: ["Apple menu", "System Settings", "Your name", "iCloud", "Notes", "Sync this Mac"] },
      ]} />
      <p>
        Apple encrypts iCloud notes in transit and on its servers. With standard data protection Apple holds the keys; with Advanced
        Data Protection turned on, the keys stay on your trusted devices.
      </p>
      <p>
        Syncing isn&apos;t a backup. A note you delete moves to Recently Deleted on every device with the same Apple Account, and is
        removed for good after 30 days. <a href="/blog/back-up-apple-notes">How to back up Apple Notes</a> covers keeping a copy of
        your own, and <a href="/blog/recover-deleted-apple-notes">recovering deleted notes</a> covers the 30 days.
      </p>

      <h2 id="on-device">On My iPhone and On My Mac</h2>
      <PostFigure src="/blog/macos27/notes27-settings-default-account-on-my-mac" width={1148} height={1000} maxWidth={500}
        alt="Notes Settings on macOS 27 with Default account set to On My Mac, and a ticked Enable the On My Mac account: Notes in On My Mac are stored on this computer."
        caption="Notes, Settings on macOS 27. Notes in On My Mac are stored on this computer." />
      <p>
        These are the local accounts. Apple says notes in On My iPhone appear only on that iPhone, and notes in On My Mac are stored on
        that Mac and can&apos;t be opened from your other devices or iCloud.com. Apple says every Notes feature works in On My
        iPhone, and notes in both can be locked. They&apos;re switched on here:
      </p>
      <Paths rows={[
        { on: "iPhone", steps: ["Settings", "Apps", "Notes", "“On My iPhone” Account"] },
        { on: "Mac", steps: ["Notes", "Settings", "Enable the On My Mac account"] },
      ]} />
      <p>
        What happens to them if the device is lost differs. On My iPhone notes are part of your iPhone&apos;s backups to iCloud. On My
        Mac notes are only as safe as your Mac&apos;s own backups.
      </p>
      <p>
        If you&apos;re looking for the notes as files in Finder, Apple doesn&apos;t say where on the disk they are, and its guides only
        open them in Notes. To get a note as a file, open it and choose File, Export To, then PDF or Markdown. If notes you expect on
        your phone sit under On My Mac, that&apos;s why they never arrive: <a href="/blog/apple-notes-not-syncing">Apple Notes not
        syncing</a> goes through it.
      </p>

      <h2 id="gmail">Notes in Gmail, Yahoo and other accounts</h2>
      <PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} maxWidth={300}
        alt="An iPhone's settings for a Gmail account, with switches for Mail, Contacts, Calendars and Notes, all turned on."
        caption="With Notes on for a mail account, its notes are kept in that account. Image: Apple." />
      <p>
        If Notes is turned on for a Gmail, Yahoo or other mail account, the notes you put under its heading are kept in that email
        account and sync over IMAP, the protocol Mail uses. Apple says those notes stay in your Google account if you remove it from
        your iPhone. Apple doesn&apos;t say where they show up in Gmail itself, so read and edit them in Notes.
      </p>
      <p>Three things work differently in these accounts:</p>
      <ul>
        <li>Some Notes features aren&apos;t available, and the notes can&apos;t be locked.</li>
        <li>A deleted note usually goes to that account&apos;s Trash, in the Mail app, instead of Recently Deleted.</li>
        <li>They reach only the devices where that mail account is set up with Notes turned on.</li>
      </ul>
      <p>
        Removing the account from a Mac with Delete Account removes its notes from that Mac only; the copies stay in the email account.
      </p>

      <h2 id="compare">The accounts side by side</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">Account</th><th scope="col">Where notes are kept</th><th scope="col">Other devices</th><th scope="col">Locked notes</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">iCloud</th><td>In iCloud</td><td>Every device with your Apple Account, and icloud.com</td><td>Yes</td></tr>
            <tr><th scope="row">On My iPhone, On My Mac</th><td>On that device</td><td>None</td><td>Yes</td></tr>
            <tr><th scope="row">Gmail, Yahoo and other mail accounts</th><td>In that email account</td><td>Devices with that account set up</td><td>No</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        New notes made with Siri or the Notes widget go to the default account, so set it to the one you want:
      </p>
      <Paths rows={[
        { on: "iPhone", steps: ["Settings", "Apps", "Notes", "Default Account"] },
        { on: "Mac", steps: ["Notes", "Settings", "Default account"] },
      ]} />
      <p>
        To bring notes from On My iPhone or Gmail into iCloud, see <a href="/blog/move-apple-notes-to-icloud">move Apple Notes to
        iCloud</a>.
      </p>

      <h2 id="pinto-notes">Where Pinto Notes keeps your notes</h2>
      <p>
        Pinto Notes, the notes app for iPhone and Mac, looks and works like Apple Notes, with one place for every note. You sign in
        once and your notes sync between your iPhone and Mac. There&apos;s no On My iPhone and no mail accounts to keep apart. Notes
        are encrypted on your device before they sync, and every earlier version of a note is kept.
      </p>
      <Figure shot={SHOTS.connectList} caption="Settings in Pinto Notes on a Mac: connect ChatGPT, Claude, Claude Code or Codex." />
      <p>
        Each note is a Markdown file in your folders. Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, which takes a minute, they see your notes as
        those files and can read and edit them, from any device. Pinto Notes has no Windows, Android or web app.
      </p>
      <p>
        Your Apple Notes come over in one import on your Mac, with their folders, and Apple Notes isn&apos;t changed. <a
        href="/blog/move-from-apple-notes">Moving from Apple Notes</a> walks through it.
      </p>
    </PostPage>
  );
}
