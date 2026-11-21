import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-not-working", { title: "Apple Notes not working or crashing? What to try, in order" });

// Written 21 November 2026 for "apple notes not working". Autocomplete, 21 Nov, en-US: apple notes not working,
// apple notes keeps crashing, apple notes keeps freezing, apple notes keeps closing, apple notes not opening, apple
// notes not working after update, mac notes keeps crashing, iphone notes keeps crashing, apple notes not loading.
// Apple pages read on 21 November 2026: support.apple.com/en-us/119876 (If an app on your iPhone stops
// responding, closes unexpectedly, or won't open; published 24 March 2026), the iPhone User Guide pages Quit and
// reopen an app (iph83bfec492) and Force restart iPhone (iph8903c3ee6), 118575 (Update your iPhone,
// published 15 September 2026), 118582 (Delete built-in Apple apps, published 18 June 2026: Notes is on the list,
// deleting a built-in app deletes related user data, restore by searching the exact name in the App Store and
// tapping Redownload), the Mac User Guide page If an app freezes or quits unexpectedly on Mac (mchlp2579, macOS 27),
// 102586 (How to force an app to quit on Mac, published 8 December 2025), 108382 (Update macOS on Mac, published
// 14 September 2026), 116946 (Start up your Mac in safe mode, published 5 December 2025; Apple frames it as a way
// to tell whether software that loads at startup causes an issue, and doesn't name apps) and 121669 (If you don't
// see your iCloud notes in the Notes app, published 21 March 2025). The Notes User Guide for Mac has no
// troubleshooting topic, so no Notes-specific cause is claimed here. From the model posts: the iOS 27 and Mac iCloud
// paths, icloud.com/notes, iCloud Notes on Apple's System Status page and the macOS "unsupported features" message
// (apple-notes-not-syncing), and Recently Deleted's 30 days (recover-deleted-apple-notes). Pinto side: Apple Notes
// import on a Mac, Apple Notes isn't changed (move-from-apple-notes, Mac 1.2.6).

const FAQ = [
  { q: "Why does Apple Notes keep crashing?", a: [
    "Apple doesn't document a cause that's specific to Notes. Its steps are the ones for any app: close it and open it again, restart the device, then update the software. On a Mac, Apple also suggests disconnecting a device you just plugged in and removing plug-ins from other makers.",
  ] },
  { q: "Will deleting the Notes app delete my notes?", a: [
    "Apple says deleting a built-in app also deletes its related user data on that device. Notes in iCloud are also on icloud.com/notes, so check them there first. Notes in On My iPhone live only on that phone, so don't delete the app while you have notes there.",
  ] },
  { q: "How do I force quit Notes on a Mac?", a: [
    "Press Option-Command-Esc, or choose Force Quit from the Apple menu, then select Notes and click Force Quit. Apple warns that you may lose unsaved changes.",
  ] },
  { q: "Why won't a note open on my Mac after I updated my iPhone?", a: [
    "A note made with a newer version of Notes can use features an older one doesn't have. The Mac then says the note uses unsupported features and asks you to upgrade to the latest version of macOS. Updating the Mac lets it open the note.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-not-working"
      intro={<>Notes freezes, closes on its own, or won&apos;t open at all. Apple&apos;s own steps, in the order Apple gives them, for iPhone and Mac.</>}
      answer={
        <Answer jump={[
          { href: "#iphone", label: "On iPhone" },
          { href: "#mac", label: "On a Mac" },
          { href: "#notes-dont-load", label: "Notes don't load" },
          { href: "#after-update", label: "After an update" },
        ]}>
          <p>
            Close Notes and open it again, then restart the device. If it still freezes or quits, update iOS or macOS. These are
            Apple&apos;s steps for any app that stops responding. If Notes opens but your notes don&apos;t appear, check that Notes is
            turned on for iCloud on that device.
          </p>
          <PostCta slug="apple-notes-not-working" position="answer" title="Want a second copy of your notes?">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. It imports your Apple Notes once on a Mac, as a copy, and Apple Notes isn&apos;t changed. Every earlier version of a note is kept.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="safe">First, check your notes are safe</h2>
      <p>
        Before you try anything bigger than a restart, open icloud.com/notes in a browser and sign in with your Apple Account. If your
        notes are there, they&apos;re stored in iCloud, whatever the app on your device is doing. Apple also lists iCloud Notes on its System
        Status page, at apple.com/support/systemstatus. If it shows an outage, wait until Apple marks it resolved. If Notes opens but a note{" "}
        <a href="/blog/apple-notes-keeps-jumping-to-top">keeps jumping to the top</a> as you type, that has its own steps.
      </p>

      <h2 id="iphone">On iPhone: Notes keeps crashing or won&apos;t open</h2>
      <Steps>
        <li id="quit-iphone">
          <strong>Close Notes and open it again</strong>{" "}
          Open the App Switcher, swipe to find Notes, then swipe up on it. Then tap Notes on the Home Screen or in the App Library.
        </li>
        <li id="restart-iphone">
          <strong>Restart your iPhone</strong>{" "}
          Apple&apos;s next step if the app is still unresponsive. If the iPhone itself is frozen and won&apos;t turn off, force it to
          restart: press and release volume up, press and release volume down, then press and hold the side button until the Apple logo
          appears.
        </li>
        <li id="update-iphone">
          <strong>Update iOS</strong>{" "}
          Apple suggests checking App Updates in the App Store first, and updating the iPhone&apos;s software if there&apos;s nothing for
          the app. Back up the iPhone, plug it in and connect to Wi-Fi first.
          <Paths rows={[
            { on: "iPhone", steps: ["Settings", "General", "Software Update"] },
          ]} />
        </li>
        <li id="redownload">
          <strong>Delete Notes and download it again, last</strong>{" "}
          Notes is one of the built-in apps Apple lets you delete. Apple says that deleting one also deletes its related user data on
          the device, so check icloud.com/notes first, and skip this step if you keep notes in On My iPhone. To get it back, search the
          App Store for Notes by its exact name and tap Redownload.
        </li>
      </Steps>
      <p>
        The steps are from Apple&apos;s <a href="https://support.apple.com/en-us/119876" rel="noopener">If an app on your iPhone stops
        responding, closes unexpectedly, or won&apos;t open</a>, with the details from the iPhone User Guide
        and <a href="https://support.apple.com/en-us/118582" rel="noopener">Delete built-in Apple apps</a>.
      </p>

      <h2 id="mac">On a Mac: Notes keeps freezing or quitting</h2>
      <Steps>
        <li id="force-quit">
          <strong>Quit Notes, or force it to quit</strong>{" "}
          Try Command-Q first. If Notes doesn&apos;t respond, press Option-Command-Esc, or choose Force Quit from the Apple menu, select
          Notes and click Force Quit. Apple warns that you may lose unsaved changes. If Notes quit on its own, click Reopen in the
          dialog that appears.
          <Paths rows={[
            { on: "Mac", steps: ["Apple menu", "Force Quit"], keys: "⌥⌘⎋" },
          ]} />
        </li>
        <li id="restart-mac">
          <strong>Restart the Mac</strong>{" "}
          Choose Restart from the Apple menu. If the Mac won&apos;t restart, Apple says to press and hold the power button for up to 10
          seconds until it turns off, then press it again to turn it on.
        </li>
        <li id="other-note">
          <strong>Open a different note</strong>{" "}
          Apple&apos;s guide suggests opening another file, since the one that was open may be causing the problem. In Notes, that&apos;s
          another note.
        </li>
        <li id="update-mac">
          <strong>Update macOS</strong>{" "}
          Apple says it&apos;s a good idea to back up your Mac first. Keep the Mac awake and the lid open until the install finishes.
          <Paths rows={[
            { on: "Mac", steps: ["System Settings", "General", "Software Update"] },
          ]} />
        </li>
        <li id="peripherals">
          <strong>Unplug what&apos;s new, remove add-ons</strong>{" "}
          Apple suggests disconnecting a device you just connected, such as a printer, and uninstalling plug-ins or enhancements from
          other makers, which may stop working after an app or macOS update.
        </li>
      </Steps>
      <p>
        The steps are from Apple&apos;s <a href="https://support.apple.com/guide/mac-help/mchlp2579/mac" rel="noopener">If an app freezes
        or quits unexpectedly on Mac</a> and <a href="https://support.apple.com/en-us/102586" rel="noopener">How to force an app to quit on
        Mac</a>. If it keeps happening, Apple&apos;s <a href="https://support.apple.com/en-us/116946" rel="noopener">safe mode
        article</a> describes how to check whether software that loads when your Mac starts up is causing an issue.
      </p>

      <h2 id="notes-dont-load">Notes opens, but your notes don&apos;t load</h2>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Apple Notes on macOS 27 without iCloud: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. System Settings and Cancel."
        caption="What Notes shows on a Mac where iCloud is off for Notes." />
      <p>
        If the app runs but the list is empty, Apple&apos;s steps are to make sure Sync this iPhone (or Sync this Mac) is on for Notes,
        then check the Notes app. If the notes still don&apos;t appear, restart the device and check the setting again. Apple says that
        once syncing finishes, notes already in iCloud should appear.
      </p>
      <Paths rows={[
        { on: "iPhone, iOS 27", steps: ["Settings", "Your name", "iCloud", "See All", "Notes"] },
        { on: "iPhone, iOS 26", steps: ["Settings", "Your name", "iCloud", "Notes"] },
        { on: "Mac, macOS 15 or later", steps: ["System Settings", "Your name", "iCloud", "Notes"] },
      ]} />
      <p>
        That&apos;s from <a href="https://support.apple.com/en-us/121669" rel="noopener">If you don&apos;t see your iCloud notes</a>. If
        notes show on one device and not the other, <a href="/blog/apple-notes-not-syncing">Apple Notes not syncing between iPhone and
        Mac</a> goes through the rest of the checks. If one note is missing everywhere, look in Recently Deleted, where deleted notes stay
        for 30 days: <a href="/blog/recover-deleted-apple-notes">how to recover deleted Apple Notes</a> shows where it is on each device.
      </p>

      <h2 id="after-update">Not working after an update</h2>
      <p>
        When one device is updated and the other isn&apos;t, a note made on the newer one can use features the older Notes doesn&apos;t
        have. On a Mac, Notes then shows &ldquo;This note uses unsupported features. To view or edit it, upgrade to the latest version of
        macOS.&rdquo; The note has synced, but that Mac can&apos;t open it. Updating the device that&apos;s behind is the fix.
      </p>
      <p>
        If Notes itself started crashing after an update, the steps above are still the ones Apple gives. Check for a newer update as well,
        since Apple lists software updates among its fixes for an app that quits.
      </p>

      <h2 id="next-time">Keep a copy, for next time</h2>
      <p>
        A copy of your notes outside the Notes app is worth having whatever goes wrong. <a href="/blog/back-up-apple-notes">How to back up
        Apple Notes</a> shows how to keep one.
      </p>

      <p>
        If Notes says a note is full or has too many attachments, see <a href="/blog/apple-notes-storage-limit">Apple Notes storage limit</a>.
      </p>

      <h2 id="pinto-notes">A second home for your notes</h2>
      <PostFigure src="/blog/pinto/import-from-apple-notes-sheet" width={1090} height={1260} maxWidth={460}
        alt="The Import from Apple Notes sheet in Pinto Notes on a Mac: Copies the notes you pick. Nothing in Apple Notes changes. Every note is listed under its Apple Notes folder, all ticked, with Import 8 Notes."
        caption="Import from Apple Notes in Pinto Notes on a Mac. It copies your notes and leaves Apple Notes as it was." />
      <p>
        Pinto Notes won&apos;t fix Apple Notes. It&apos;s a notes app that looks and works like Apple Notes on iPhone and Mac, and it can
        hold a second copy of your notes: <a href="/blog/move-from-apple-notes">moving from Apple Notes</a> is one import on your Mac, and
        Apple Notes isn&apos;t changed. The import reads your notes through Apple Notes, so Notes needs to open on that Mac. After that,
        every earlier version of each note is kept in Pinto Notes.
      </p>
    </PostPage>
  );
}
