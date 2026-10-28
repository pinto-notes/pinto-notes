import { SHOTS } from "@/lib/posts";
import { Figure } from "@/lib/blog";
import { AIConnect } from "@/lib/AIConnect";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";
import { APP_STORE_LIVE } from "@/lib/site";

export const dynamic = "force-static";
export const metadata = postMetadata("siri-ai-apple-notes", { title: "Siri AI and Apple Notes: what it can do, and what it can't" });

// Rebuilt to Emil's recipe on 14 October 2026 night: show Siri AI at its best, a plain can and can't table, then the
// gap (only Siri gets into Apple Notes; ChatGPT, Claude and Codex can't), then Pinto once. Hero image: Apple Newsroom,
// 8 June 2026, credited. Siri AI couldn't be captured first-hand (off on the test Mac, region Sweden).
// Checked on 14 October 2026 against Apple's own pages: the Siri AI newsroom post (14 September: beta in English,
// French, Japanese, Korean, Portuguese and Spanish "next month", not initially in the EU on iPhone, Apple's tablets and
// Apple Watch, built with Google's Gemini models, daily limits), the Apple TV 4K and HomeView newsroom posts (13 October:
// Siri AI in beta in tvOS 27.2 and HomeView 27.2, personal context needs a paired iPhone, $299, 13 November, HomeView
// not sold in the EU), How to get Siri AI (support.apple.com/127893: devices, Try Siri AI (Beta), waitlist, EU and
// macOS, "Notes" in personal context), Use Notes on your iPhone (118442: "What was the note with the cookie recipe?"),
// the iOS 27 iPhone User Guide pages Get started with Siri AI, Write with Siri, Ask Siri about what's on your screen,
// Change your Notes settings (Default Account for notes made with Siri), Turn on ChatGPT and Use Siri to get answers
// from ChatGPT. Apple doesn't say whether a spoken rewrite replaces the note's text, whether Siri AI opens locked
// notes, or whether Apple TV and HomeView reach Notes, and the text says so. The guide's device list includes a
// tablet the blog doesn't name (site copy test); the text says "iPhone and Mac" and links the full list.
// Updated 26 October 2026: macOS 27.2 and watchOS 27.2 shipped with Siri AI in French, Japanese, Korean, Portuguese and
// Spanish. Same evening iOS 27.2 shipped too, and Apple's newsroom post "Siri AI is available in more languages starting
// today" (26 October) confirms all five in every 27.2 update, Chinese (traditional), Norwegian,
// Turkish and Vietnamese "by the end of the year", and no Siri AI in the EU except on the Mac and Vision Pro.
// support.apple.com/127893 (published 22 October) still says English and, for EU accounts on the Mac, English only.

const FAQ = [
  { q: "Can Siri AI find things in my Apple Notes?", a: [
    "Yes. In iOS 27, Apple says Siri AI can search for notes and search inside them. Its example is \"What was the note with the cookie recipe?\" Notes is also one of the apps Siri AI draws on for personal context, with Messages, Mail, Calendar and Reminders.",
  ] },
  { q: "Can Siri AI summarize or rewrite a note?", a: [
    "Apple's Write with Siri page says it can proofread, rewrite and summarize text, with examples like \"Condense these meeting notes to give me key points.\" Open the note first. To change the note's text directly, select it and choose Proofread or Rewrite, which lets you compare the new version with the original.",
  ] },
  { q: "Which devices have Siri AI?", a: [
    "Siri AI is a beta in iOS 27, macOS 27, watchOS 27 and visionOS 27. On iPhone it needs an iPhone 15 Pro, iPhone 15 Pro Max or any iPhone 16 or later. On a Mac it needs Apple silicon (M1 or later) or the MacBook Neo. Apple TV 4K (2nd generation or later) gets it in tvOS 27.2, and HomeView has it from launch.",
  ] },
  { q: "Can Siri AI on Apple TV or HomeView read my notes?", a: [
    "Apple doesn't say. Both need a paired iPhone with Siri AI for personal requests, and Apple's pages for them name Calendar, Messages and Apple Music, not Notes. Until Apple documents it, ask about a note on your iPhone or Mac.",
  ] },
  { q: "Can ChatGPT save into Apple Notes through Siri?", a: [
    "Apple doesn't describe that. With the ChatGPT extension on, Siri AI sends a request to ChatGPT when you ask for ChatGPT by name, and the answer comes back in Siri. Apple's examples use a photo or a document in Files, and none of its pages show ChatGPT writing into a note.",
  ] },
];

const ASK = `What was the note with the cookie recipe?
Proofread this.
Tidy up the recipe I wrote down from my cooking class and format it step by step.
Condense these meeting notes to give me key points.
Explain this from my class notes.`;

export default function Page() {
  return (
    <PostPage
      slug="siri-ai-apple-notes"
      intro={<>
        Siri AI is the biggest thing to happen to Apple Notes in years: for the first time an AI can find a note by what&apos;s in it and
        rewrite it in place. It came to iPhone and Mac with iOS 27 and macOS 27, and Apple is now putting it on the new Apple TV and
        HomeView. Here&apos;s what it can do with your notes, what it can&apos;t, and the gap that matters if you use ChatGPT or Claude.
      </>}
      answer={
        <Answer jump={[
          { href: "#can", label: "What it can do" },
          { href: "#table", label: "Can and can't" },
          { href: "#chatgpt", label: "ChatGPT and other AIs" },
          { href: "#missing", label: "What's missing" },
        ]}>
          <p>
            Siri AI can find your notes, search inside them, make a new note, and proofread, rewrite or summarize the one you have open.
            It&apos;s a beta on iPhone 15 Pro and later and Macs with M1 or later, and not on iPhone in the EU. It started in English;
            since the 27.2 updates on 26 October it also speaks French, Japanese, Korean, Portuguese and Spanish. What it
            can&apos;t do is let ChatGPT, Claude or any other AI into your notes: Siri is the only one that gets in.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/apple-siri-ai-app-chat" width={1306} height={1829} maxWidth={360}
        alt="Siri AI on an iPhone, in the new Siri app: a typed conversation about a park in Mexico City."
        caption="Siri AI on iPhone, in its new app. Image: Apple." />}
      faq={FAQ}
    >
      <h2 id="can">What Siri AI does with your notes</h2>
      <p>
        <strong>It finds them.</strong> Apple&apos;s own example is &ldquo;What was the note with the cookie recipe?&rdquo;. You no longer
        need the title you gave a note in 2019, just what&apos;s in it. That alone fixes a real problem.
      </p>
      <p>
        <strong>It works on the note in front of you.</strong> Select text, tap the Siri AI icon, and ask for a proofread, a rewrite or a
        summary, or describe the change. After a rewrite you can compare it with the original before you keep it.
      </p>
      <Figure shot={SHOTS.notesDefaultAccount} caption="Siri's new notes go to the default account you pick here." />
      <p>
        <strong>It makes new notes.</strong> They go to the Default Account in Notes&apos; settings, so if Siri&apos;s notes land in On My
        iPhone or an old Gmail account, <a href="/blog/move-apple-notes-to-icloud">change it there</a>.
      </p>
      <Keep title="Things to try in Notes" text={ASK} note="All five are Apple's own examples." />
      <MenuPaths rows={[
        { on: "iPhone", steps: ["Settings", "Siri", "Try Siri AI (Beta)"] },
        { on: "Mac", steps: ["System Settings", "Siri", "Try Siri AI (Beta)"] },
      ]} />
      <p>Setting up puts you on a waitlist; the download starts on its own when your turn comes.</p>
      <p>
        <strong>In another language.</strong> iOS 27.2 and macOS 27.2, out on 26 October, add French, Japanese, Korean, Portuguese and
        Spanish. Update (Settings, General, Software Update on iPhone; System Settings, General, Software Update on a Mac), then set your
        device&apos;s language and Siri&apos;s language to the same one: Apple says they have to match. Chinese (traditional), Norwegian,
        Turkish and Vietnamese are due by the end of the year. In the EU it&apos;s still Mac only, and Apple&apos;s setup page says in
        English only there.
      </p>

      <h2 id="table">What it can do, and what it can&apos;t</h2>
      <div className="tableWrap">
        <table>
          <thead><tr><th scope="col">With your notes</th><th scope="col">Siri AI</th></tr></thead>
          <tbody>
            <tr><th scope="row">Find a note by what&apos;s in it</th><td>Yes</td></tr>
            <tr><th scope="row">Proofread, rewrite or summarize the note you have open</th><td>Yes</td></tr>
            <tr><th scope="row">Make a new note</th><td>Yes, in your default account</td></tr>
            <tr><th scope="row">Open a locked note</th><td>Apple doesn&apos;t say; assume not</td></tr>
            <tr><th scope="row">Work on your notes from Apple TV or HomeView</th><td>Apple doesn&apos;t say; their pages name Calendar, Messages and Music</td></tr>
            <tr><th scope="row">Let ChatGPT, Claude or Codex read or edit your notes</th><td>No</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="chatgpt">ChatGPT and other AIs</h2>
      <PostFigure src="/blog/news/apple-intelligence-chatgpt-writing-tools" width={1600} height={1066} maxWidth={640}
        alt="A MacBook showing a story in Pages, with the Writing Tools panel open at Refine with ChatGPT."
        caption="Apple's ChatGPT extension inside Writing Tools, shown in Pages; it works the same in Notes. Image: Apple." />
      <p>
        Siri can hand a question to ChatGPT if you turn on its extension (Settings, Siri, Set Up Extensions, ChatGPT) and ask for ChatGPT
        by name. Apple&apos;s examples send it a photo or a document. None of its pages show ChatGPT reading your notes or writing an answer
        back into one. Claude isn&apos;t an option at all, and Apple has <a href="/blog/apple-notes-api">no Notes API</a> anything else
        could use.
      </p>

      <h2 id="missing">What&apos;s missing</h2>
      <p>
        Siri AI is the only AI that gets into Apple Notes, and it only works one note at a time, on that device, when you ask. The ChatGPT
        you plan your week with can&apos;t see the plan you wrote down. Claude can&apos;t tick off what you finished. Codex can&apos;t add
        to your work log. You end up copying between them and Notes by hand.
      </p>
      <p>
        If that&apos;s you, what you want isn&apos;t a smarter Siri. It&apos;s one notebook every AI you use can work in.
      </p>
      <AIConnect caption="The AIs you already use, in one notebook." />
      <p>
        That&apos;s why I made Pinto Notes. It works like Apple Notes, brings yours over in{" "}
        <a href="/blog/move-from-apple-notes">one import</a> on a Mac (Apple Notes stays as it was), and lets ChatGPT, Claude, Claude Code and Codex search, read and edit your notes once you approve them, with every change tinted and undoable.
        {APP_STORE_LIVE
          ? <> It&apos;s free on Mac and iPhone.</>
          : <> It&apos;s free on the Mac today, with the iPhone app coming soon.</>}{" "}
        For the rest of this year&apos;s Notes update, see <a href="/blog/apple-notes-ios-27">what&apos;s new in Apple Notes in iOS 27</a>.
      </p>
    </PostPage>
  );
}
