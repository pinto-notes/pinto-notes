import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-stuck-on-folders", { title: "Apple Notes stuck on folders? What to check first" });

// Written 21 November 2026 for "apple notes stuck on folders". Wave 5 queries:
// apple notes stuck on preparing, icloud notes stuck on saving, apple notes slow to sync,
// apple notes stuck loading. Google autocomplete read live on 21 November 2026, en-US,
// via suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q= for each query.
// Returned variants include iphone notes app stuck on folders, why is my notes app stuck on
// folders, how to get out of folders in notes, iphone notes scan stuck on preparing,
// iphone notes pdf stuck on preparing, icloud notes slow to sync, force apple notes to sync,
// how long does it take for notes to sync, and icloud notes stuck loading.
// Research row: topic-research-2026-11-20.md, apple-notes-stuck-on-folders-or-preparing.
// Apple pages read live today: https://support.apple.com/en-us/121669, iCloud Notes switch,
// restart and check settings again; https://support.apple.com/en-gb/118446, service status,
// same Apple Account, updates and mobile data; https://www.apple.com/support/systemstatus/;
// https://support.apple.com/en-ca/guide/icloud/-mm8685520792/icloud, All iCloud, Settings paths
// and icloud.com/notes; https://support.apple.com/en-us/118575 and /108382, update paths;
// https://support.apple.com/en-us/121115, current Apple Intelligence setup requirements and
// Siri language download. That live page was updated 5 November 2026; the older search snippet
// about Wi-Fi and power is not used. These pages give no specific Folders or Saving diagnosis
// and no Notes sync deadline. No cause, guaranteed fix or sync speed is claimed.
// Models read: apple-notes-not-working and apple-notes-not-syncing. Pinto claims are only
// BRIEF.md facts: looks and works like Apple Notes on iPhone and Mac, Apple Notes import on
// Mac, originals unchanged. Import also verified by move-from-apple-notes' header comment.
// Reused picture: /blog/macos27/notes27-turn-on-icloud-prompt, as in both model posts.

const FAQ = [
  { q: "What should I check when Apple Notes won't leave the Folders screen?", a: [
    "For missing iCloud notes, check Apple's System Status page, your Apple Account and the Notes switch in iCloud settings. Apple says to restart an iPhone and check the switch again if notes still don't appear. If the screen doesn't respond to taps, follow Apple's general steps for an app that stops responding.",
  ] },
  { q: "Does Preparing in Apple Intelligence mean my notes are syncing?", a: [
    "A message in Apple Intelligence settings concerns its setup. Apple's current setup page says that changing the Siri language can make Apple Intelligence unavailable until the language finishes downloading and matches the device language. That doesn't confirm whether a note has reached iCloud.",
  ] },
  { q: "Does Apple give a time limit for Notes to finish syncing?", a: [
    "The Apple support pages linked here don't give a Notes sync time limit. A slow upload alone doesn't establish its cause. Check for an iCloud outage, a working connection and the same Apple Account with Notes enabled on each device.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-stuck-on-folders"
      intro={<>If Apple Notes is stuck on Folders with no notes loading, check iCloud status and make sure Notes is on in iCloud settings. If taps do nothing, use the app troubleshooting steps below.</>}
      answer={
        <Answer jump={[
          { href: "#folders", label: "Folders won't open" },
          { href: "#icloud-checks", label: "iCloud checks" },
          { href: "#saving", label: "Stuck on saving" },
          { href: "#preparing", label: "Stuck on preparing" },
        ]}>
          <p>
            Check Apple&apos;s System Status page, then confirm that each device uses the same Apple Account with Notes turned on
            for iCloud. Check your connection and software updates too. Apple&apos;s linked pages give these general checks;
            they don&apos;t document a specific fix for Notes getting stuck on Folders.
          </p>
          <PostCta slug="apple-notes-stuck-on-folders" position="answer" title="Try your notes in Pinto Notes">
            <p>
              Pinto Notes looks and works like Apple Notes on iPhone and Mac. You can <a href="/blog/move-from-apple-notes">import
              Apple Notes on your Mac</a>, and Apple Notes isn&apos;t changed. It won&apos;t fix Apple Notes for you.
            </p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Apple Notes on macOS 27 showing Turn On iCloud, with System Settings and Cancel buttons."
        caption="Apple Notes on macOS 27 when iCloud is off for Notes. This prompt is different from an unresponsive Folders screen." />}
      faq={FAQ}
    >
      <h2 id="folders">When the Folders screen won&apos;t open a folder</h2>
      <p>
        Try selecting All iCloud or a folder under iCloud. That&apos;s where Apple&apos;s setup guide says to look for iCloud notes.
        If folders open but their notes don&apos;t appear, continue with the checks below.
      </p>
      <p>
        If Notes doesn&apos;t respond at all, see <a href="/blog/apple-notes-not-working">Apple Notes not working or crashing</a> for
        Apple&apos;s steps to close and reopen the app, then restart and update the device. A frozen screen doesn&apos;t tell you
        whether your latest changes have uploaded.
      </p>

      <h2 id="icloud-checks">Check iCloud before changing anything else</h2>
      <Steps>
        <li id="status">
          <strong>Check Apple&apos;s service status</strong>{" "}
          Open <a href="https://www.apple.com/support/systemstatus/" rel="noopener">Apple System Status</a> and look for iCloud Notes.
          If Apple reports an issue, check its status before changing your settings.
        </li>
        <li id="account">
          <strong>Check the Apple Account</strong>{" "}
          Make sure each device is signed in to the same Apple Account. Check your account at the top of Settings on iPhone or
          System Settings on Mac.
        </li>
        <li id="notes-switch">
          <strong>Make sure Notes is on for iCloud</strong>{" "}
          Turn on Sync this iPhone or Sync this Mac if it&apos;s off. On iPhone, Apple says to restart if notes still don&apos;t
          appear, then check the setting again.
          <Paths rows={[
            { on: "iPhone", steps: ["Settings", "Your name", "iCloud", "See All or Show All", "Notes", "Sync this iPhone"] },
            { on: "Mac, macOS 15 or later", steps: ["System Settings", "Your name", "iCloud", "Notes", "Sync this Mac"] },
          ]} />
        </li>
        <li id="network">
          <strong>Check the connection</strong>{" "}
          Apple asks for a strong internet connection. If you&apos;re using an iPhone without Wi-Fi, check that Cellular or Mobile
          Data is on in Settings. Apple says iCloud may be unavailable over mobile data when that setting is off.
        </li>
        <li id="updates">
          <strong>Check for software updates</strong>{" "}
          Apple includes updating iOS or macOS in its iCloud troubleshooting steps. Back up your device before installing an update.
          <Paths rows={[
            { on: "iPhone", steps: ["Settings", "General", "Software Update"] },
            { on: "Mac", steps: ["Apple menu", "System Settings", "General", "Software Update"] },
          ]} />
        </li>
      </Steps>
      <p>
        These checks come from Apple&apos;s <a href="https://support.apple.com/en-gb/118446" rel="noopener">iCloud connection
        guidance</a>, <a href="https://support.apple.com/en-us/121669" rel="noopener">missing iCloud notes article</a> and{" "}
        <a href="https://support.apple.com/en-ca/guide/icloud/-mm8685520792/icloud" rel="noopener">Notes setup guide</a>.
        The update paths are in Apple&apos;s <a href="https://support.apple.com/en-us/118575" rel="noopener">iPhone</a> and{" "}
        <a href="https://support.apple.com/en-us/108382" rel="noopener">Mac update guides</a>.
      </p>

      <h2 id="saving">iCloud Notes stuck on saving or slow to sync</h2>
      <p>
        Open <a href="https://www.icloud.com/notes" rel="noopener">iCloud Notes in a browser</a> and sign in to the same Apple Account.
        Look for the note and its latest change. If you can see an older version, that confirms only that the older content reached
        iCloud. Keep a separate copy of any new text you can still read while you work through the checks.
      </p>
      <p>
        Apple&apos;s pages linked here don&apos;t give a time limit for syncing or a specific fix for a Saving message. For the next
        checks, including storage and notes on only one device, use <a href="/blog/apple-notes-not-syncing">Apple Notes not syncing
        between iPhone and Mac</a>.
      </p>

      <h2 id="preparing">Check where &ldquo;preparing&rdquo; appears</h2>
      <p>
        If the message is in Apple Intelligence settings, follow <a href="https://support.apple.com/en-us/121115" rel="noopener">Apple&apos;s
        Apple Intelligence setup page</a>. It says Apple Intelligence may be unavailable after a Siri language change until that
        language finishes downloading and matches the device language. This concerns Apple Intelligence setup, not the upload of a note.
      </p>
      <p>
        If &ldquo;preparing&rdquo; appears inside Notes while you work with a scan or PDF, that setup guidance doesn&apos;t identify
        the cause. Note the exact message and what you were doing when it appeared. If the checks above don&apos;t help, share those
        details with <a href="https://getsupport.apple.com/" rel="noopener">Apple Support</a>.
      </p>
    </PostPage>
  );
}
