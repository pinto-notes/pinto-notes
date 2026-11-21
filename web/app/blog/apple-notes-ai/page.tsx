import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-ai", { title: "Apple Notes AI: what Apple Intelligence does in Notes" });

// Written 21 November 2026 for "apple notes ai". Google autocomplete (en-US, read 21 Nov): apple notes ai, apple notes ai
// integration, apple notes ai summary, apple notes ai features, apple notes ai transcription, apple notes ai note taking,
// apple notes ai drawing, apple notes ai note taker, apple notes ai search; and from the longer queries: does apple notes
// have ai summary, does apple have access to my notes, how to search apple notes, how to transcribe notes on iphone.
// Apple facts, all read on 21 November 2026 on support.apple.com:
// support.apple.com/en-us/121115 (published 5 Nov 2026): devices (iPhone Duo, iPhone 16 models or later, iPhone 15 Pro,
//   iPhone 15 Pro Max, iPhone Air, MacBook Neo, Mac with M1 or later), iOS 27 and macOS 27, automatically available after
//   the 27.0 update, device and Siri language set to the same supported language, the 16 languages, up to 8 GB of storage
//   (up to 14 GB on some newer models), China mainland, daily usage limits for server-side features, Writing Tools "for
//   users without Siri AI writing support", Image Wand on iPhone (not Mac), Notes transcription summaries and their
//   languages (footnote 6), ChatGPT extension.
// iPhone User Guide (iOS 27): Record and transcribe audio in Notes (iphbe11247b5: iPhone 12 and later and its ten
//   languages for transcription; Find in Transcript, Add Transcript to Note, Copy Transcript; tap the recording, then
//   Summary, on an Apple Intelligence iPhone); Writing Tools (iph6f08da1d2: Describe a change, Rewrite with Friendly,
//   Professional or Concise, Proofread, Summarize, Key Points, Compose with ChatGPT with Include All Text or Selected
//   Text); Image Wand (iph7db25a67c); Search notes (iphb8628c6b8: typed and handwritten text, objects in images, text in
//   scans, tags; locked notes show only the title); Record and transcribe a call (iph57c6590e9: Call Recordings folder,
//   transcript, Summary; call recording not available in the EU and other listed countries); Turn on ChatGPT
//   (iph00fd3c8c2); Apple Intelligence and privacy (iphe3f499e0e: on device in many cases, Private Cloud Compute not
//   stored or made accessible to Apple, Settings, Privacy & Security, Apple Intelligence Report).
// Notes User Guide for Mac (macOS 27): Record and transcribe audio (apdb5106e334: M1 or later and its languages; double-click
//   the recording, then Summary). Mac User Guide: Writing Tools (mchldcd6c260: Control-click, Writing Tools, Show Writing
//   Tools) and Write with Siri (ipho54eqrx4ms3j). support.apple.com/118442 (Use Notes on your iPhone: the Forward button,
//   then Writing Tools; Siri AI example "What was the note with the cookie recipe?"). support.apple.com/127893 (How to get
//   Siri AI, published 12 Nov 2026: beta, English, French, Japanese, Korean, Portuguese and Spanish; not on iPhone in the
//   EU, on the Mac there; personal context includes Notes; app actions include editing notes).
// Not repeated here: siri-ai-apple-notes, chatgpt-and-apple-notes and claude-and-apple-notes cover those routes; this
// post links them. Apple Notes having no API is from apple-notes-api and claude-and-apple-notes.
// Pinto side: BRIEF Pinto facts, best-notes-app-for-mac (no AI of its own, Mac and iPhone only, Markdown), claude-and-apple-notes
// (ChatGPT and Claude search, read and edit from the web, desktop and phone; changes tinted with Undo), recover-deleted-apple-notes
// (every earlier version kept), import-your-notes (File menu import on the Mac with folders, Apple Notes stays as it is), the
// Pinto Notes MCP server's own instructions (notes are Markdown files with checklists and tables; locked notes show as "Locked
// note" without title or text) and SHOTS.consent ("locked notes stay private").
// Pictures: /blog/news/apple-notes-recording-summary-mac (Apple's image, as used in best-ai-notes-app; the caption says only
// what it shows) and SHOTS.aiEdit. No new screenshots.

const FAQ = [
  { q: "Does Apple Notes have an AI summary?", a: [
    "Yes, in two places. A recording in a note gets a Summary of its transcript, and Writing Tools can summarize or pull key points out of text you select. Both need Apple Intelligence: an iPhone 15 Pro or later, or a Mac with M1 or later, in a supported language.",
  ] },
  { q: "Which languages can Apple Notes transcribe?", a: [
    "On iPhone, Apple lists English, Spanish, Portuguese, Italian, French, German, Japanese, Korean, Simplified Chinese and Traditional Chinese, on iPhone 12 and later. The Mac needs M1 or later and has nearly the same list. Summaries of those transcripts have their own, slightly different list.",
  ] },
  { q: "Why don't I see a transcript for my recording in Notes?", a: [
    "Apple gives two reasons: the iPhone or Mac doesn't meet the minimum requirements, or Notes didn't detect a supported language. A call transcript can also take a moment; Notes says when it's still in progress.",
  ] },
  { q: "Does Apple Intelligence send my notes to Apple?", a: [
    "Apple says many requests run entirely on your device. Bigger ones can go to Private Cloud Compute, where the data isn't stored or made accessible to Apple. On iPhone, Settings, Privacy & Security, Apple Intelligence Report lists what was sent.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-ai"
      intro={<>Apple Notes has AI built in, spread across Writing Tools, recordings and Siri. Here&apos;s what each part does in Notes today, what your iPhone or Mac needs for it, and the one thing it still doesn&apos;t do.</>}
      answer={
        <Answer jump={[
          { href: "#features", label: "What it does" },
          { href: "#needs", label: "Devices and languages" },
          { href: "#search", label: "AI search" },
          { href: "#cant", label: "What it can't do" },
        ]}>
          <p>
            Apple Notes gets its AI from Apple Intelligence. Writing Tools proofread, rewrite and summarize text you select, and an audio
            recording gets a transcript and a summary. In iOS 27 and macOS 27, Siri AI (beta) can also find a note by what&apos;s in it.
            None of it lets ChatGPT or Claude read or edit your notes.
          </p>
          <PostCta slug="apple-notes-ai" position="answer" title="Want ChatGPT or Claude in your notes?">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. Connect ChatGPT or Claude and they can search, read and edit your notes, and every change can be undone.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/apple-notes-recording-summary-mac" width={1630} height={1780} maxWidth={560}
        alt="Apple Notes on a Mac: a Neuroscience lecture note with a five-minute audio recording called N122 Lecture, a preview of its transcript, and a Notes from Recording section with headings and bullet points."
        caption="A recorded lecture in Apple Notes on a Mac, with the start of its transcript under the recording. Image: Apple." />}
      faq={FAQ}
    >
      <h2 id="features">What Apple Intelligence does in Notes</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">Feature</th><th scope="col">What it does in a note</th><th scope="col">Where</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Writing Tools</th><td>Proofread, rewrite (Friendly, Professional or Concise), summarize, pull out key points, or describe a change</td><td>iPhone and Mac</td></tr>
            <tr><th scope="row">Audio transcript</th><td>Writes down what&apos;s said while you record; you can search it or add it to the note</td><td>iPhone 12 and later, Mac with M1 or later</td></tr>
            <tr><th scope="row">Recording summary</th><td>Sums up a recording&apos;s transcript; you can copy or share it</td><td>iPhone and Mac with Apple Intelligence</td></tr>
            <tr><th scope="row">Call recordings</th><td>Saves a recorded phone call to a Call Recordings folder, with a transcript and a summary</td><td>iPhone, in some countries</td></tr>
            <tr><th scope="row">Image Wand</th><td>Turns a rough sketch, or the text around an empty space, into a picture</td><td>iPhone</td></tr>
            <tr><th scope="row">Siri AI (beta)</th><td>Finds notes, searches inside them, edits them, and writes with you</td><td>iPhone and Mac, iOS 27 and macOS 27</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Transcripts themselves don&apos;t need Apple Intelligence: an iPhone 12 transcribes. The summary of a transcript does. If you use
        Siri AI, Apple points you to Write with Siri for rewriting instead of Writing Tools; <a href="/blog/siri-ai-apple-notes">Siri AI and
        Apple Notes</a> covers what Siri does with your notes.
      </p>

      <h3>Rewrite or summarize text</h3>
      <Paths rows={[
        { on: "iPhone", steps: ["Select the text", "Writing Tools"] },
        { on: "Mac", steps: ["Select the text", "Control-click", "Writing Tools", "Show Writing Tools"] },
      ]} />
      <p>
        Then pick Proofread, Rewrite, Summarize or Key Points, or type what you want under Describe a change. With Apple&apos;s ChatGPT
        extension turned on, Compose in the same panel asks ChatGPT to write, using the whole note or only the selected text.
      </p>

      <h3>Record, transcribe and summarize</h3>
      <Steps>
        <li>In a note, tap the Attachment button (on a Mac, click it in the toolbar), then Record Audio, and start recording. You can keep typing in the note while it records.</li>
        <li>When you&apos;re done, open the recording (double-click it on a Mac) and tap the transcript button. Find in Transcript searches it; Add Transcript to Note puts the text in the note.</li>
        <li>For the summary, open the recording and choose Summary. The button at the top of the summary copies or shares it.</li>
      </Steps>
      <p>
        Deleting the recording deletes its transcript too. Phone calls you record on iPhone land in the Call Recordings folder, with
        the speaker of each line identified in the transcript, and a Summary button. Call recording isn&apos;t available in the EU and some other
        countries, and the other person hears that the call is being recorded.
      </p>

      <h2 id="needs">Which devices and languages</h2>
      <ul>
        <li><strong>iPhone:</strong> iPhone 15 Pro, iPhone 15 Pro Max, iPhone 16 or later, iPhone Air or iPhone Duo, with iOS 27.</li>
        <li><strong>Mac:</strong> any Mac with M1 or later, or the MacBook Neo, with macOS 27.</li>
        <li><strong>Language:</strong> your device language and Siri language set to the same supported language. Apple lists English, Danish, Dutch, French, German, Italian, Norwegian, Portuguese, Spanish, Swedish, Turkish, Vietnamese, Chinese (simplified and traditional), Japanese and Korean.</li>
        <li><strong>Space:</strong> up to 8 GB of storage, and up to 14 GB on some newer models.</li>
      </ul>
      <p>
        On those devices Apple Intelligence comes with the 27.0 update. It doesn&apos;t work on devices bought in China mainland. Some
        features use Apple&apos;s servers and have daily limits, and Apple&apos;s Notes pages say usage limits may apply. Recording summaries
        have a shorter language list than the rest: English, French, German, Italian, Japanese, Korean, Portuguese (Brazil), Spanish and
        traditional Chinese, each in the regions Apple names. Siri AI is a beta in English, French, Japanese, Korean, Portuguese and
        Spanish, and in the EU it&apos;s on the Mac but not on iPhone.
      </p>

      <h2 id="search">Is there AI search in Apple Notes?</h2>
      <p>
        Notes&apos; own search already goes further than words: it finds typed and handwritten text, objects in pictures, text in scanned
        documents and tags. A locked note only shows its title in the results. Within one note, Find in Note searches the text, and
        PDFs and other attachments too if you choose Include Attachments.
      </p>
      <p>
        The AI part is Siri AI. In iOS 27 you can ask it something like &ldquo;What was the note with the cookie recipe?&rdquo; and it
        looks through what your notes say, so you don&apos;t need the title. Notes is one of the apps it draws on, with Messages, Mail,
        Calendar and Reminders.
      </p>

      <h2 id="cant">What it can&apos;t do: ChatGPT and Claude</h2>
      <p>
        Apple Intelligence works on the note in front of you, on that device. The AI you plan your week with can&apos;t open your notes.
        Apple&apos;s ChatGPT extension only gets what you choose to send it, such as the text you selected, and the answer comes back in
        Writing Tools or Siri. Apple offers no such extension for Claude, and Apple Notes has no API other apps could use.
      </p>
      <p>
        On a Mac there are workarounds. The ChatGPT app can read the note you have open. Claude&apos;s desktop app can read and write notes through an extension that drives the Notes
        app; <a href="/blog/claude-and-apple-notes">can Claude read your Apple Notes?</a> has the details and the catches. Both stop at
        that Mac: from ChatGPT on your phone or Claude on the web, your notes aren&apos;t there.
      </p>

      <h2 id="pinto-notes">When you want ChatGPT or Claude in your notes</h2>
      <p>
        Pinto Notes is a notes app for iPhone and Mac that looks and works like Apple Notes, with folders, checklists, tables and pinned
        notes. It has no AI of its own. Instead, the ChatGPT or Claude you already use can search, read and edit your notes, from the web,
        the desktop apps or your phone, and Claude Code and Codex can too. Connecting one takes a minute:
        see <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude to your notes</a>.
      </p>
      <Figure shot={SHOTS.aiEdit} caption="ChatGPT added five items to a Groceries note in Pinto Notes. The new lines are tinted, with Undo." />
      <ul>
        <li>Every change an AI makes is tinted, with Undo, and every earlier version of a note is kept.</li>
        <li>Notes are Markdown files, so an AI reads them as plain text, checklists and tables included.</li>
        <li>Notes are encrypted, and locked notes stay closed to AI.</li>
      </ul>
      <p>
        It&apos;s for iPhone and Mac only, with no Windows, Android or web app. Your Apple Notes come over
        in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, with their folders, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
