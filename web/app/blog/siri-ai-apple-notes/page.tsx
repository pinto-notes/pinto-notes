import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, Steps } from "@/lib/PostParts";
import { APP_STORE_LIVE } from "@/lib/site";

export const dynamic = "force-static";
export const metadata = postMetadata("siri-ai-apple-notes", { title: "Siri AI and Apple Notes: what it can do with your notes" });

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
      intro={<>On 13 October Apple announced a new Apple TV 4K &quot;supercharged by Siri AI&quot;, and HomeView, a home display built around it. The same Siri AI has been on iPhone and Mac since iOS 27 and macOS 27 came out on 14 September. If you keep your life in Apple Notes, the useful question is what it can do with your notes. This guide sticks to Apple&apos;s own pages, and says where they&apos;re silent.</>}
      caption="Notes settings on a Mac. Default account is where a note goes when Siri makes it. On iPhone it's in Settings, Apps, Notes."
      answer={
        <Answer jump={[
          { href: "#what", label: "What Siri AI is" },
          { href: "#turn-on", label: "Turn it on" },
          { href: "#notes", label: "In Notes" },
          { href: "#tv-home", label: "Apple TV, HomeView" },
          { href: "#chatgpt", label: "ChatGPT" },
          { href: "#limits", label: "Gaps" },
        ]}>
          <p>
            Siri AI can find a note, search inside your notes, make a new note, and proofread, tidy or summarize a note you have
            open. It&apos;s a beta, in English, on iPhone 15 Pro and later and on Macs with M1 or later, and it isn&apos;t on iPhone in
            the EU. Apple doesn&apos;t describe ChatGPT or any other AI saving into your notes.
          </p>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="what">What Siri AI is, and where you get it</h2>
      <p>
        Siri AI is Apple&apos;s new version of Siri. Apple&apos;s <a href="https://www.apple.com/newsroom/2026/09/siri-ai-a-profoundly-more-capable-and-personal-assistant-is-here/" rel="noopener">announcement</a> on
        14 September describes it as more conversational, with personal context, broad world knowledge, awareness of what&apos;s on
        your screen and more actions in apps. Apple built it in collaboration with Google and its Gemini models. You can type to it
        as well as talk, and a new Siri app keeps your conversations.
      </p>
      <p>
        It&apos;s a beta in iOS 27, macOS 27, watchOS 27 and visionOS 27. Apple&apos;s <a href="https://support.apple.com/en-us/127893" rel="noopener">How to get Siri AI</a> page
        lists the devices. On iPhone that&apos;s iPhone 15 Pro, iPhone 15 Pro Max, iPhone Air and any iPhone 16 or later; on a Mac, any
        Mac with M1 or later and the MacBook Neo. Apple TV 4K (2nd generation or later) gets it in tvOS 27.2, and the new
        Apple TV 4K and HomeView ship with it on 13 November.
      </p>
      <p>
        Apple said in September that French, Japanese, Korean, Portuguese and Spanish would follow in October. On 14 October its
        support pages still say English to start. Siri AI isn&apos;t available on iPhone or Apple Watch in the EU, though a Mac in the
        EU gets it when the Mac and Siri are both set to English. Requests that use Apple&apos;s server models count against a
        daily limit, and Apple says expanded access will cost a fee later.
      </p>

      <h2 id="turn-on">How to turn on Siri AI</h2>
      <Steps>
        <li>
          <strong>Update first</strong>
          Install iOS 27 or macOS 27, and set the device language and Siri&apos;s language to English.
        </li>
        <li>
          <strong>Open Settings, then Siri</strong>
          Tap Try Siri AI (Beta). If Siri is off, tap Turn on Siri first.
        </li>
        <li>
          <strong>Follow the setup</strong>
          You pick a voice, train it on your voice and review the privacy settings. That puts you on a waitlist, and the download
          starts on its own when your turn comes.
        </li>
      </Steps>

      <h2 id="notes">What Siri AI can do with Apple Notes</h2>
      <p>
        Apple spreads this over several pages. Put together, there are four things Siri AI does with your notes.
      </p>
      <p>
        Siri AI can find your notes. <a href="https://support.apple.com/en-us/118442" rel="noopener">Use Notes on your iPhone</a> says
        that in iOS 27 you can ask Siri AI to search for notes or search within notes, and gives the example &quot;What was the
        note with the cookie recipe?&quot; Apple&apos;s How to get Siri AI page also lists Notes, with Messages, Mail, Calendar and
        Reminders, among the apps Siri AI looks through when a question needs your personal context.
      </p>
      <p>
        Siri AI can also work on the note in front of you. Apple&apos;s page on <a href="https://support.apple.com/guide/iphone/siri-ai-ask-siri-about-whats-on-your-screen-iphmk4p88mkuky/27/ios/27" rel="noopener">asking
        Siri about your screen</a> uses &quot;Explain this from my class notes&quot; with a diagram open in Notes.
        <a href="https://support.apple.com/guide/iphone/siri-ai-write-with-siri-ipho54eqrx4ms3j/27/ios/27" rel="noopener"> Write with Siri</a> lists
        proofreading, rewriting, feedback and summaries, and its examples could have come from a notes app.
      </p>
      <Keep title="Requests from Apple's own pages to try in Notes" text={ASK}
        note="Open the note first for everything after the first line. Swipe down on Siri's answer to keep going with follow-up requests." />
      <p>
        Siri AI can make a new note, too. Apple&apos;s Notes settings page for iOS 27 has a Default Account option for notes created with Siri and the
        Notes widget. If Siri&apos;s notes keep landing in On My iPhone or an old Gmail account, change it there. <a href="/blog/move-apple-notes-to-icloud">Move
        Apple Notes to iCloud</a> explains the accounts.
      </p>
      <p>
        And Siri AI can change a note&apos;s text if you select it first. The surest way to edit a note with Siri AI is the one Apple documents step by
        step. Select the text, tap the Siri AI icon, then describe the change or choose Proofread or Rewrite. After a rewrite you
        can compare the new version with the original before you keep it.
      </p>

      <h2 id="tv-home">Siri AI on Apple TV and HomeView</h2>
      <p>
        The <a href="https://www.apple.com/newsroom/2026/10/apple-unveils-the-new-apple-tv-4k/" rel="noopener">Apple TV 4K announcement</a> is
        mostly about finding something to watch, and hands-free control of the home.
        The <a href="https://www.apple.com/newsroom/2026/10/meet-apple-homeview-a-new-way-to-enjoy-entertainment-and-manage-the-home/" rel="noopener">HomeView announcement</a> describes
        a 7-inch display for a counter or a wall that recognizes up to six people.
        Both cost $299 in the US.
      </p>
      <p>
        For anything personal, both need a paired iPhone with Siri AI. The HomeView page names Calendar, Messages and
        Apple Music as what Siri AI can reach there. Neither page names Notes, so I wouldn&apos;t buy either to read
        out a shopping list from Apple Notes until Apple says it can. HomeView isn&apos;t sold in the EU at all, because Siri AI
        isn&apos;t on iPhone there yet.
      </p>

      <h2 id="chatgpt">Siri AI with ChatGPT and other AIs</h2>
      <p>
        Siri AI can still pass a question to ChatGPT. Apple&apos;s <a href="https://support.apple.com/guide/iphone/turn-on-chatgpt-iph00fd3c8c2/27/ios/27" rel="noopener">steps</a>:
        open Settings, then Siri, tap Set Up Extensions, tap ChatGPT and turn on Use Extension. Signing in to a ChatGPT account is
        optional, and only matters if you want the requests in your ChatGPT history.
      </p>
      <p>
        With Siri AI, ChatGPT gets nothing until you ask for it by name, as in &quot;ask ChatGPT to summarize this document&quot;, and
        you can&apos;t turn that check off. Apple&apos;s examples send a photo or a PDF in Files. None of its pages show ChatGPT
        reading your notes or writing an answer back into one. ChatGPT is the only extension these pages name. Apple built Siri AI
        with Google&apos;s Gemini models, but it doesn&apos;t offer Gemini as an extension you pick, and Claude isn&apos;t mentioned. <a href="/blog/claude-and-apple-notes">Claude and
        Apple Notes</a> covers the Mac options for Claude, and the <a href="/blog/apple-notes-api">Apple Notes API</a> post covers
        what Shortcuts and AppleScript can do.
      </p>

      <h2 id="limits">What Apple doesn&apos;t say yet</h2>
      <p>
        Apple&apos;s Write with Siri examples include &quot;Tidy up the recipe I wrote down from my cooking class&quot;, but the page
        doesn&apos;t say whether the result replaces the note&apos;s text or appears in Siri&apos;s answer for you to copy. <a href="https://9to5mac.com/2026/09/28/heres-everything-new-for-apple-notes-in-ios-27/" rel="noopener">9to5Mac
        reported</a> in September that Siri AI can add to an existing note. Apple&apos;s pages don&apos;t spell that out, so check the note
        afterwards. Apple also doesn&apos;t say whether Siri AI reads locked notes, and I&apos;d assume it doesn&apos;t.
      </p>
      <p>
        I like the search part most. Finding a note by what&apos;s in it, rather than by the title you gave it in 2019, fixes a real
        problem. The writing part is a better Writing Tools. What Siri AI doesn&apos;t give you is an AI that keeps working on your
        notes for you, from ChatGPT on the web or from Claude Code in your terminal.
      </p>
      <p>
        That&apos;s the gap I built Pinto Notes for. It&apos;s a notes app that works like Apple Notes, with a server built in that
        ChatGPT, Claude, Claude Code and Codex can use to search, read and edit your notes once you approve them. Every change an AI
        makes is tinted with an Undo, and the version before it stays in the history. On a Mac it imports your Apple Notes with
        their folders and leaves Apple Notes as it was. {APP_STORE_LIVE ? "It's on the Mac and on the App Store." : "The Mac app is out now, and the iPhone app is coming soon to the App Store."} <a href="/blog/move-from-apple-notes">Moving
        from Apple Notes</a> has the steps, and <a href="/blog/apple-notes-ios-27">what&apos;s new in Apple Notes in iOS 27</a> covers
        the rest of this year&apos;s update.
      </p>

    </PostPage>
  );
}
