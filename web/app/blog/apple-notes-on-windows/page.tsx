import { Figure } from "@/lib/blog";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-on-windows", { title: "Apple Notes on Windows: use iCloud in your browser" });

// Written 21 November 2026 for "apple notes on windows". BRIEF-wave4.md post 3.
// Google autocomplete read live today, client=firefox, hl=en, gl=us, at
// https://suggestqueries.google.com/complete/search for each of the five brief queries:
// apple notes on windows, apple notes on windows 11, apple notes on windows pc,
// apple notes app for windows, apple notes on windows download. Returned variants include
// apple notes on windows desktop, apple notes on windows laptop, apple notes on windows 10,
// how to install apple notes on windows 11, how to use apple notes on windows 11,
// access apple notes on windows pc, apple notes app for windows desktop,
// can i download apple notes on windows, can you access apple notes on pc.
// Apple sources read live 21 Nov 2026, all on support.apple.com:
// /en-us/105119, "Which iCloud.com features are available in the browser on your device":
// Notes on Windows PCs; latest Firefox, Chrome, Edge or Opera recommended for Windows.
// /guide/icloud/mm8685520792/icloud, "Set up iCloud for Notes on all your devices": same
// Apple Account; iPhone Settings, name, iCloud, See All or Show All, Notes, Sync this device;
// macOS 15 or later System Settings, name, iCloud, Notes, Sync this Mac; iCloud folders.
// /guide/icloud/mm6704cac5/icloud, "Use Notes on iCloud.com": iCloud notes only, excluding
// other accounts such as Google and Yahoo; view and edit notes from Apple devices.
// /guide/icloud/mmc0cd6edf/icloud, "Create notes on iCloud.com": Create a note, automatic
// saving, Choose a style, changes appear on devices with the same Apple Account;
// adding attachments requires the Notes app on an Apple device.
// /en-us/guide/icloud/mmcd9c9e9b71/icloud, "Add or edit lists in Notes on iCloud.com":
// Choose a style for lists, Make a checklist for selected lines, circle to complete a task.
// /en-us/guide/icloud/mm198698c442/icloud, "View or download attachments in Notes on
// iCloud.com": double-click attachments; open scan thumbnail, then Download; locked-note
// attachments show placeholders. /en-us/guide/icloud/mm000b55f946/icloud, "View notes and
// locked notes on iCloud.com": select a folder/note; custom Notes password works; device
// passcode/login password does not; lock management requires an Apple device.
// /en-us/guide/icloud/mmc8a8e49dbd/icloud, "Manage access to iCloud.com": Advanced Data
// Protection disables web data access; allow it again and approve temporary access on a
// trusted device. iPhone: Settings, name, iCloud, iCloud.com, Allow Data Access.
// /en-us/guide/icloud/mm6be2394337/icloud, "What can you do with iCloud on a Windows
// device?": iCloud for Windows feature list excludes Notes; browser access is separate.
// The iCloud guide pages that returned 429 in the web reader were read by live HTTPS fetch.
// Pinto facts: BRIEF.md, looks/works like Apple Notes on iPhone and Mac; ChatGPT or Claude
// read/edit once connected; every earlier version kept; Apple Notes import on Mac leaves
// Apple Notes unchanged. BRIEF-compare.md, Apple only, no Windows, Android or web app.
// Markdown files: live apple-notes-vs-obsidian verified header comment. Models read:
// apple-notes-vs-obsidian and apple-notes-export-pdf. Picture reused: SHOTS.welcome from
// apple-notes-export-pdf, shown only in the Pinto section; no Windows screenshot claimed.
// Proposed description: Use Apple Notes on Windows through iCloud.com. Set up your iPhone notes, edit them in a browser, and check the limits before downloading anything.

const FAQ = [
  { q: "How do I use Apple Notes on Windows 11?", a: [
    "Open icloud.com/notes in your browser and sign in with the Apple Account you use for Notes. Apple recommends the latest Firefox, Chrome, Edge or Opera on Windows. Only notes stored in iCloud appear there.",
  ] },
  { q: "Do I need iCloud for Windows to open my notes?", a: [
    "No. Apple's steps for Notes use icloud.com/notes in a browser. The separate iCloud for Windows app has tools for photos, files and other iCloud data, but Apple doesn't list Notes among its features.",
  ] },
  { q: "Can I add attachments to Apple Notes from a Windows PC?", a: [
    "Apple directs you to add attachments in the Notes app on an iPhone or Mac. You can then view or download them from Notes on iCloud.com using the same Apple Account.",
  ] },
  { q: "Why can't I open a locked Apple note on Windows?", a: [
    "Notes locked with your Apple device's passcode or login password can't open on iCloud.com. A note locked with a separate Notes password can open there when you enter that password. Attachments in locked notes show as placeholders on the web.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-on-windows"
      intro={<>To use Apple Notes on Windows, open icloud.com/notes in your browser and sign in to your Apple Account. Your notes need to be stored in iCloud to appear there.</>}
      answer={
        <Answer jump={[
          { href: "#open-notes", label: "Open your notes" },
          { href: "#missing-notes", label: "Missing notes" },
          { href: "#edit-notes", label: "Write and edit" },
          { href: "#limits", label: "Browser limits" },
          { href: "#download", label: "App or download?" },
          { href: "#pinto-notes", label: "If you also use a Mac" },
        ]}>
          <p>
            Apple&apos;s route for Windows PCs, including Windows 11, is <a href="https://www.icloud.com/notes" rel="noopener">Notes on iCloud.com</a>.
            You can read and edit your iCloud notes there, and changes appear on your Apple devices with Notes syncing turned on.
            You don&apos;t need to download an app for these steps.
          </p>
          <PostCta slug="apple-notes-on-windows" position="answer" title="Also take notes on a Mac or iPhone?">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac, where ChatGPT or Claude can read and edit your notes once connected. Pinto doesn&apos;t run on Windows and has no web app. This download is for your Mac or iPhone.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="open-notes">Open Apple Notes on your Windows PC</h2>
      <Steps>
        <li>Open your browser and go to <a href="https://www.icloud.com/notes" rel="noopener">icloud.com/notes</a>.</li>
        <li>Sign in with the Apple Account you use for your iCloud notes.</li>
        <li>Select a folder, then select the note you want to read or edit.</li>
      </Steps>
      <p>
        Apple lists Notes among the <a href="https://support.apple.com/en-us/105119" rel="noopener">iCloud.com features available on Windows PCs</a>.
        It recommends the latest version of Firefox, Google Chrome, Edge or Opera for Windows. Start with that browser route on Windows 11 too.
      </p>

      <h2 id="missing-notes">If your iPhone notes are missing</h2>
      <p>
        Check the account first. Notes on iCloud.com shows notes stored in iCloud. It doesn&apos;t show notes stored in another account,
        such as Google or Yahoo. On your iPhone or Mac, look for the note under the iCloud heading in the folder list.{" "}
        <a href="/blog/where-are-apple-notes-stored"> Where Apple Notes are stored</a> explains the different accounts.
      </p>
      <MenuPaths rows={[
        { on: "iPhone", steps: ["Settings", "Your name", "iCloud", "See All or Show All", "Notes", "Sync this iPhone"] },
        { on: "Mac, macOS 15 or later", steps: ["System Settings", "Your name", "iCloud", "Notes", "Sync this Mac"] },
      ]} />
      <p>
        Turn on Notes syncing and use the same Apple Account on your device and in the Windows browser. Apple&apos;s{" "}
        <a href="https://support.apple.com/guide/icloud/mm8685520792/icloud" rel="noopener">Notes setup guide</a> gives these paths.
        Then open an iCloud folder in Notes to check which notes belong to that account.
      </p>
      <p>
        If iCloud.com says access to your data is off, check web access on your Apple device. Apple says Advanced Data Protection
        turns web data access off when you enable it. On iPhone, go to Settings, your name, iCloud, iCloud.com, then turn on Allow Data Access.
        You also use a trusted device to approve temporary access. Apple explains this in{" "}
        <a href="https://support.apple.com/en-us/guide/icloud/mmc8a8e49dbd/icloud" rel="noopener">Manage access to iCloud.com</a>.
      </p>

      <h2 id="edit-notes">Write and edit notes in the browser</h2>
      <Steps>
        <li>To start a note, click the Create a note button at the top right of the Notes toolbar.</li>
        <li>Type your note. iCloud.com saves changes automatically.</li>
        <li>To format text, select it, click Choose a style in the toolbar, then choose the format.</li>
      </Steps>
      <p>
        To make a checklist, click a blank line or select existing lines, then click Make a checklist in the toolbar.
        Click the empty circle beside an item to mark it complete. For a bulleted or numbered list, use Choose a style.
        Apple documents <a href="https://support.apple.com/guide/icloud/mmc0cd6edf/icloud" rel="noopener">creating notes</a> and{" "}
        <a href="https://support.apple.com/en-us/guide/icloud/mmcd9c9e9b71/icloud" rel="noopener">editing lists</a> separately.
      </p>

      <h2 id="limits">Where the browser version stops</h2>
      <h3>Attachments and scanned documents</h3>
      <p>
        Apple says to add attachments in Notes on an iPhone or Mac. Once they&apos;re in an iCloud note, you can view or download them
        on Windows. Double-click an attachment to open or download it. For a scanned document, double-click its thumbnail,
        then click the Download button in the document view. These are Apple&apos;s steps for{" "}
        <a href="https://support.apple.com/en-us/guide/icloud/mm198698c442/icloud" rel="noopener">attachments on iCloud.com</a>.
      </p>
      <h3>Locked notes</h3>
      <p>
        On Apple devices, you can open locked notes with a password, Face ID or Touch ID. The Windows browser needs the separate
        password you created for locked notes. If you used your Apple device&apos;s passcode or login password to lock them,
        Apple says you can&apos;t view those notes on iCloud.com. Attachments inside locked notes show placeholders on the web.
      </p>
      <p>
        Adding or removing a lock, and changing or resetting the Notes password, requires Notes on your Apple device.
        See Apple&apos;s guide to <a href="https://support.apple.com/en-us/guide/icloud/mm000b55f946/icloud" rel="noopener">viewing locked notes on iCloud.com</a>.
      </p>

      <h2 id="download">What about an Apple Notes app for Windows?</h2>
      <p>
        For the &ldquo;Apple Notes on Windows download&rdquo; search, Apple&apos;s documented answer is the browser.
        Its <a href="https://support.apple.com/en-us/guide/icloud/mm6be2394337/icloud" rel="noopener">iCloud for Windows guide</a> lists
        photos, files and other tools, and doesn&apos;t list Notes. Installing iCloud for Windows isn&apos;t part of Apple&apos;s Notes browser steps.
      </p>
      <p>
        If you need a notes app that runs on Windows itself, <a href="/blog/apple-notes-alternatives">Apple Notes alternatives</a> compares
        the options and the devices each supports. Pinto Notes also requires an Apple device.
      </p>

      <h2 id="pinto-notes">Pinto Notes if you also use a Mac or iPhone</h2>
      <p>
        Pinto Notes is for iPhone and Mac. It has no Windows, Android or web app, so it won&apos;t give you a Windows editor.
        If you also use a Mac or iPhone and want Apple Notes&apos; feel with AI access, Pinto keeps notes as Markdown files and saves every earlier version.
      </p>
      <Figure shot={SHOTS.welcome} caption="The Welcome to Pinto Notes note in the Mac app." />
      <p>
        ChatGPT or Claude can read and edit your Pinto notes once connected. <a href="/blog/connect-chatgpt-to-your-notes">Connecting your AI</a> takes
        a minute. Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
