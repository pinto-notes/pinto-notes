import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-widget", { title: "Apple Notes widget: iPhone, Lock Screen and Mac" });

// Written 21 November 2026 for "apple notes widget", topic-research-2026-11-20.md row 22.
// Google autocomplete read live today, en-US, through suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us:
// apple notes widget, apple notes widget iphone, apple notes widget lock screen, apple notes widget not working,
// iphone notes widget, ios notes widget, mac notes widget, iphone notes widget lock screen,
// iphone notes widget not working, apple stickies widget. Follow-up queries also returned ios notes widget not working,
// macbook notes widget, mac desktop notes widget, mac os notes widget, and does notes have a widget.
// Apple sources read live today, both web search and direct retrieval from support.apple.com:
// https://support.apple.com/en-us/118610, "How to add and edit widgets on your iPhone": Home Screen and Lock Screen
// steps, making room on the Lock Screen, Today View, removal. Published 14 September 2026.
// https://support.apple.com/guide/iphone/iphb8f1bf206/ios, "Add, edit, and remove widgets on iPhone":
// Home Screen search and editing; Today View and Search under Allow Access When Locked.
// https://support.apple.com/guide/iphone/create-a-custom-lock-screen-iph4d0e6c351/ios:
// Customize an existing Lock Screen, then Add Widgets. No Notes-specific Lock Screen widget promised in these pages.
// https://support.apple.com/guide/iphone/iph92579feda/ios, "Change your Notes settings on iPhone":
// Search, Default Account, Access Notes from Lock Screen, Always Create New Note or Resume Last Note.
// https://support.apple.com/guide/notes/apdc28344070/mac, "Use Notes widgets to view notes on Mac":
// Note and Folder widgets on the desktop or in Notification Center; multiple widgets allowed.
// https://support.apple.com/guide/mac-help/mchl52be5da5/mac, "Add and customize widgets on Mac":
// gallery, editing, desktop visibility. These are settings checks, not a promised cure for a blank or stale widget.
// Pinto facts: BRIEF.md only, Apple Notes look and behavior on iPhone and Mac, connected ChatGPT or Claude reads
// and edits notes, every earlier version kept, Apple Notes import on Mac leaves Apple Notes unchanged.
// No published app/blog post mentions a Pinto widget. The research row's app-code claim is not used.
// Pictures: none. No widget screenshot is available in the verified post sources.
// Registration copy: title 47 characters; description 139 characters.
// Description: Add an Apple Notes widget on iPhone or Mac, check Lock Screen options, and find Apple's settings for a missing widget or the wrong content.

const FAQ = [
  { q: "How do I add the Apple Notes widget on iPhone?", a: [
    "Hold an empty area of the Home Screen, tap Edit, then Add Widget. Search for Notes, choose a size, tap Add Widget, then Done. Hold the widget and tap Edit Widget to see its options.",
  ] },
  { q: "Can I put an Apple Notes widget on my Lock Screen?", a: [
    "Check the Lock Screen's own gallery by holding the Lock Screen, tapping Customize, then Add Widgets. Apple's widget guides don't confirm a Notes widget there. Settings, Apps, Notes, Access Notes from Lock Screen separately lets you choose Always Create New Note or Resume Last Note.",
  ] },
  { q: "Which account does the Notes widget use for new notes?", a: [
    "The account set under Settings, Apps, Notes, Default Account. Apple says this setting controls notes created using Siri and the Notes widget.",
  ] },
  { q: "Can I put more than one Notes widget on my Mac?", a: [
    "Yes. Apple's Notes guide says you can add multiple widgets for access to different notes and folders, on the desktop or in Notification Center.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-widget"
      intro={<>On iPhone, hold the Home Screen, tap Edit, then Add Widget and search for Notes. On a Mac, Control-click the desktop and choose Edit Widgets. The Lock Screen has a separate widget gallery, so check its choices separately.</>}
      answer={
        <Answer jump={[
          { href: "#iphone", label: "iPhone Home Screen" },
          { href: "#lock-screen", label: "Lock Screen" },
          { href: "#mac", label: "Mac widgets" },
          { href: "#not-working", label: "Not working?" },
        ]}>
          <p>
            Add the Notes widget through your iPhone&apos;s Home Screen widget gallery, or use a Note or Folder widget on your Mac.
            For the Lock Screen, Apple documents how to add available widgets and a separate Notes access setting, but does not
            confirm a Notes widget below the clock in the guides linked here.
          </p>
          <PostCta slug="apple-notes-widget" position="answer" title="Want your AI to work in the note itself?">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read and edit your notes, and every earlier version is kept.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="iphone">Add the Apple Notes widget on iPhone</h2>
      <MenuPaths rows={[{ on: "Home Screen", steps: ["Touch and hold", "Edit", "Add Widget", "Notes"] }]} />
      <Steps>
        <li>Go to the Home Screen page where you want the widget.</li>
        <li>Touch and hold an empty area until the apps jiggle. Tap Edit, then Add Widget.</li>
        <li>Search for Notes and tap it. Swipe through the available sizes and styles.</li>
        <li>Tap Add Widget, move it where you want it, then tap Done.</li>
      </Steps>
      <p>
        To change what it shows, touch and hold the widget, then tap Edit Widget and choose from the options offered.
        Apple describes this in <a href="https://support.apple.com/guide/iphone/iphb8f1bf206/ios" rel="noopener">its iPhone widget guide</a>.
        Use the choices in your gallery rather than assuming every size has the same settings.
      </p>

      <h2 id="lock-screen">Apple Notes and the Lock Screen</h2>
      <p>
        The Home Screen gallery and the Lock Screen gallery have their own choices. Apple&apos;s{" "}
        <a href="https://support.apple.com/en-us/118610" rel="noopener">widget setup instructions</a> give this route for the Lock Screen:
      </p>
      <Steps>
        <li>Touch and hold the Lock Screen until Customize appears, then tap Customize.</li>
        <li>Tap Add Widgets and choose from the widgets offered there.</li>
        <li>Tap or drag a widget into place. Remove an existing widget first if there is no room.</li>
        <li>Swipe down from the widget list, then tap Done.</li>
      </Steps>
      <p>
        These steps don&apos;t establish that Notes has a widget for that space. If Notes isn&apos;t listed, the Home Screen
        instructions above don&apos;t add it below the clock.
      </p>
      <p>
        Apple separately documents <strong>Access Notes from Lock Screen</strong> under Settings, Apps, Notes. Choose
        Always Create New Note or Resume Last Note, or turn access off. This setting controls Notes access. It does not add a widget.
        See <a href="https://support.apple.com/guide/iphone/iph92579feda/ios" rel="noopener">Apple&apos;s Notes settings guide</a>.
      </p>
      <p>
        Apple&apos;s <a href="https://support.apple.com/guide/iphone/iphb8f1bf206/ios" rel="noopener">iPhone widget guide</a> also covers
        Today View, which opens when you swipe right from the Lock Screen. If that view is unavailable while locked,
        open Settings, then Face ID &amp; Passcode or Touch ID &amp; Passcode. Under Allow Access When Locked, turn on Today View and Search.
        That gives access to Today View while the phone is locked.
      </p>

      <h2 id="mac">Add a Notes widget on Mac</h2>
      <p>
        Apple&apos;s <a href="https://support.apple.com/guide/notes/apdc28344070/mac" rel="noopener">Notes widget guide</a> describes
        a Note widget and a Folder widget. Both work on the desktop or in Notification Center. You can add more than one for
        different notes and folders.
      </p>
      <Steps>
        <li>Control-click the desktop wallpaper and choose Edit Widgets.</li>
        <li>Search for Notes in the gallery and choose a widget.</li>
        <li>Click it to place it automatically, or drag it to a spot on the desktop.</li>
        <li>Click Done.</li>
      </Steps>
      <p>
        For Notification Center, click the date and time in the menu bar, then Edit Widgets at the bottom. Add the widget there.
        Control-click a widget to change its size or choose its Edit option, if available. Click Done after editing.
        Apple covers these controls in <a href="https://support.apple.com/guide/mac-help/mchl52be5da5/mac" rel="noopener">Add and customize widgets on Mac</a>.
      </p>

      <h2 id="not-working">If the Apple Notes widget is not working</h2>
      <p>
        Check the setting that matches the problem. Apple&apos;s pages above document these controls. They don&apos;t promise that
        one setting will fix every blank or outdated widget.
      </p>
      <ul>
        <li>The content is wrong. On iPhone, hold the widget and tap Edit Widget to review its choices. On Mac, use the widget&apos;s Edit option if offered.</li>
        <li>Notes content is missing from suggestions or widgets. On iPhone, check Settings, Apps, Notes, Search, which controls whether Notes suggestions and content can appear there.</li>
        <li>A new note goes to the wrong account. Check Settings, Apps, Notes, Default Account. Apple says this controls notes created through Siri and the Notes widget.</li>
        <li>Mac desktop widgets are hidden. Open System Settings, Desktop &amp; Dock, then Widgets. Under Show Widgets, check On Desktop.</li>
      </ul>
      <p>
        If the note is also missing from search inside Notes, follow the separate{" "}
        <a href="/blog/apple-notes-search-not-working">Apple Notes search checks</a>. If you want another way to reach a note,
        <a href="/blog/apple-notes-tips"> these Apple Notes tips</a> cover Quick Notes and pinning.
      </p>

      <h2 id="pinto-notes">Let ChatGPT or Claude edit the note</h2>
      <p>
        A widget helps you reach a note. If you also want ChatGPT or Claude to read and edit what&apos;s in it, Pinto Notes
        looks and works like Apple Notes on iPhone and Mac. The AI part works once you{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>. Pinto keeps every earlier version of the note.
      </p>
      <p>
        Your Apple Notes come over in one <a href="/blog/move-from-apple-notes">import on your Mac</a>. Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
