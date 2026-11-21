import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-keeps-jumping-to-top", { title: "Apple Notes keeps jumping to top? What to try" });

// Written 21 November 2026 for "apple notes keeps jumping to top". Research row 35 in
// topic-research-2026-11-20.md. Google autocomplete read live today with client=firefox, hl=en, gl=us:
// apple notes keeps jumping to top, apple notes keeps scrolling up, iphone notes keeps scrolling up,
// apple notes jumps around, iphone notes jumping around, apple notes lagging when typing,
// apple notes lagging when writing, apple notes slow typing, iphone notes slow typing.
// Official Apple pages read today:
// https://support.apple.com/en-us/119876: general app steps, close and reopen, restart, update;
// deletion may lose app data. No specific scrolling fix documented here.
// https://support.apple.com/guide/iphone/iph83bfec492/ios: App Switcher, swipe up, reopen Notes.
// https://support.apple.com/en-us/118259: restart instructions differ by iPhone model.
// https://support.apple.com/guide/mac-help/mchlp2579/mac: general app troubleshooting, restart,
// open another file, update. https://support.apple.com/guide/mac-help/mchlp2522/mac: Apple menu, Restart.
// https://support.apple.com/en-us/118575: back up, power, Wi-Fi, Settings, General, Software Update.
// https://support.apple.com/en-us/108382: Mac backup, System Settings, General, Software Update;
// macOS updates include Notes. Mac and iPhone guide pages fetched directly after web-tool 429 responses.
// https://support.apple.com/en-us/121669: for missing iCloud notes, check Sync this device,
// restart if needed, recheck settings. This is not evidence that iCloud causes scrolling jumps.
// https://support.apple.com/guide/icloud/mm8685520792/icloud: same Apple Account, See All or Show All
// on iPhone, Notes under Saved to iCloud on macOS 15 or later, icloud.com/notes in a browser.
// No official fix for this exact bug found. Smaller working notes and trying another device or browser
// are suggestions to try, not Apple fixes or tested remedies. No cause or success rate claimed.
// Models read: apple-notes-not-working and apple-notes-not-syncing. Pinto claims only: Apple Notes
// import on a Mac, originals unchanged, BRIEF.md Pinto facts and move-from-apple-notes verified header.
// Also checked ../Pane/Views/AppleNotesImport.swift (copies only) and ../Pane/Model/AppleNotesImporter.swift.
// No claim that Pinto avoids this bug. Picture reused: /blog/macos27/notes27-turn-on-icloud-prompt,
// as in apple-notes-not-working. It shows an iCloud prompt, not the scrolling bug.

const SUPPORT_RECORD = `Notes scrolling problem
Device and iOS or macOS version:
One note or several:
What I did just before the jump:
Does the page move, the cursor move, or both?
Does typing also lag?
What happened after restarting:
What happened after updating:
What happens with the same note on another device:
`;

const FAQ = [
  { q: "Has Apple published a fix for Notes jumping to the top?", a: [
    "Apple doesn't document a fix for this exact scrolling bug in the support pages checked for this article. Its general app advice is to close and reopen the app, restart the device and check for software updates. Those steps don't guarantee the scrolling problem will stop.",
  ] },
  { q: "Does turning off iCloud stop Apple Notes from scrolling up?", a: [
    "The Apple pages checked here don't identify iCloud as the cause or recommend turning it off to fix scrolling. Apple's missing-notes guide says to check that Notes syncing is on, then restart if notes still don't appear. That addresses missing notes, not scroll position.",
  ] },
  { q: "What can I try when Apple Notes lags and loses my place?", a: [
    "Try a fresh note for the section you're writing, keeping the original untouched. You can also try the same iCloud note on another device or at icloud.com/notes. These are workarounds to test, with no promise that either will stop the lag or jumping.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-keeps-jumping-to-top"
      intro={<>Apple documents no fix for Notes jumping to the top. Start with its general restart and update steps, then try another way to keep writing if the jumping continues.</>}
      answer={
        <Answer jump={[
          { href: "#restart", label: "Restart Notes" },
          { href: "#update", label: "Check updates" },
          { href: "#icloud", label: "Check iCloud Notes" },
          { href: "#workarounds", label: "Keep writing" },
        ]}>
          <p>
            Close and reopen Notes, restart your iPhone or Mac, then check for an iOS or macOS update.
            Apple recommends these steps for apps that misbehave, but doesn&apos;t promise they fix this scrolling bug.
            If notes are also missing from another device, check that Notes is turned on for iCloud.
          </p>
          <PostCta slug="apple-notes-keeps-jumping-to-top" position="answer" title="Try a copy in Pinto Notes">
            <p>
              Pinto Notes <a href="/blog/move-from-apple-notes">imports Apple Notes on a Mac</a> and leaves Apple Notes unchanged.
              Try a copy of the affected note there before deciding whether to move. There&apos;s no promise it will avoid the same problem.
            </p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="restart">Close Notes, then restart the device</h2>
      <p>
        On iPhone, open the App Switcher, find Notes and swipe up on it. Tap Notes to reopen it.
        Apple describes this in its <a href="https://support.apple.com/guide/iphone/iph83bfec492/ios" rel="noopener">quit and reopen an app guide</a>.
        If the page still jumps, restart the iPhone using <a href="https://support.apple.com/en-us/118259" rel="noopener">the steps for your model</a>.
      </p>
      <p>
        On a Mac, quit Notes and open it again. To restart the Mac, choose Restart from the Apple menu.
        Apple includes restarting in its <a href="https://support.apple.com/guide/mac-help/mchlp2579/mac" rel="noopener">general app troubleshooting steps</a>.
        Open the affected note afterwards and try the action that made it jump.
      </p>
      <p>
        If Notes freezes or closes altogether, <a href="/blog/apple-notes-not-working">Apple Notes not working or crashing</a> covers those symptoms.
      </p>

      <h2 id="update">Check for an iOS or macOS update</h2>
      <p>
        Apple recommends software updates when an app isn&apos;t working as expected.
        Back up your device first. On iPhone, connect to power and Wi-Fi, then check Software Update.
        On a Mac, macOS updates include the built-in Notes app.
      </p>
      <Paths rows={[
        { on: "iPhone", steps: ["Settings", "General", "Software Update"] },
        { on: "Mac", steps: ["Apple menu", "System Settings", "General", "Software Update"] },
      ]} />
      <p>
        Follow Apple&apos;s instructions for <a href="https://support.apple.com/en-us/118575" rel="noopener">updating iPhone</a> or
        {" "}<a href="https://support.apple.com/en-us/108382" rel="noopener">updating macOS</a>.
        An available update is worth trying. It isn&apos;t evidence that Apple has fixed this particular bug.
      </p>

      <h2 id="icloud">Check iCloud if notes are also missing</h2>
      <p>
        A page jumping while you type doesn&apos;t establish that syncing is at fault.
        If the note also fails to appear on another device, Apple&apos;s iCloud checks apply to that separate symptom.
        Make sure both devices use the same Apple Account and Notes syncing is on.
      </p>
      <Paths rows={[
        { on: "iPhone", steps: ["Settings", "Your name", "iCloud", "See All or Show All", "Notes", "Sync this iPhone"] },
        { on: "Mac, macOS 15 or later", steps: ["System Settings", "Your name", "iCloud", "Notes", "Sync this Mac"] },
      ]} />
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Apple Notes on a Mac asking to turn on iCloud to access notes from all your devices."
        caption="An iCloud prompt in Apple Notes on macOS 27. This is a sync check, not a fix for scrolling." />
      <p>
        Apple&apos;s <a href="https://support.apple.com/en-us/121669" rel="noopener">missing iCloud notes article</a> says to restart
        if notes still don&apos;t appear, then check the setting again. Its <a href="https://support.apple.com/guide/icloud/mm8685520792/icloud" rel="noopener">iCloud Notes setup guide</a> gives
        the paths above. For the remaining checks, see <a href="/blog/apple-notes-not-syncing">Apple Notes not syncing</a>.
      </p>

      <h2 id="workarounds">Ways to keep writing while it happens</h2>
      <p>
        These are things to try, not documented Apple fixes. Keep the original note while you compare.
      </p>
      <ul>
        <li>Start a fresh note for the section you&apos;re writing. Copy over only the passage you need. If it behaves better, finish there and combine the text later.</li>
        <li>Try the same note on your other device, if you have one. Compare the same edit rather than assuming it will behave differently.</li>
        <li>For an iCloud note, try <a href="https://www.icloud.com/notes" rel="noopener">icloud.com/notes</a> in a browser. Apple documents browser access in its iCloud setup guide. If editing works there, you can use it for now.</li>
      </ul>
      <p>
        A fresh note behaving differently doesn&apos;t prove that note length caused the problem.
        A working browser session doesn&apos;t explain what went wrong in the app either.
        The useful result is whether you can finish the text you were writing.
      </p>

      <h2 id="still-jumping">If Notes still jumps or typing still lags</h2>
      <p>
        Before removing the app or changing accounts, keep a separate copy of important notes.
        Apple&apos;s <a href="https://support.apple.com/en-us/119876" rel="noopener">general iPhone app guide</a> warns that deleting an app can lose its stored data.
        <a href="/blog/back-up-apple-notes">How to back up Apple Notes</a> covers keeping a copy outside the app.
      </p>
      <p>
        Write down what triggers the jump, including whether the page moves or the insertion point moves.
        Take those details to <a href="https://support.apple.com/contact" rel="noopener">Apple Support</a> if it continues.
        You can use this record without including the contents of your note.
      </p>
      <Keep title="A record for Apple Support" text={SUPPORT_RECORD} />
    </PostPage>
  );
}
