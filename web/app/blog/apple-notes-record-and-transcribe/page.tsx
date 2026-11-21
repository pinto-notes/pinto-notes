import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-record-and-transcribe", { title: "Apple Notes record and transcribe: audio to text" });

// Written 21 November 2026 for "apple notes record audio". Google autocomplete read live today, en-US,
// suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us, for all seven BRIEF-wave4 queries:
// apple notes record audio, apple notes transcribe, apple notes record and transcribe, apple notes record meeting,
// apple notes recording to text, apple notes record phone call, apple notes transcribe languages. Returned variants:
// mac notes record audio, apple notes audio recording transcript, can apple notes record audio and transcribe,
// apple notes transcribe meeting, apple notes transcribe recording, apple notes transcribe call,
// how to use apple notes to record and transcribe, using apple notes to record meetings, apple notes audio to text,
// apple notes convert audio to text, can apple notes record phone calls, apple notes transcription language.
// Apple pages read live 21 Nov 2026, also cited in apple-notes-ai's verified header:
// https://support.apple.com/guide/iphone/record-and-transcribe-audio-iphbe11247b5/ios
//   Attachments, Record Audio, Record; swipe down to type; Pause, Done; iPhone 12 and later, ten device languages;
//   tap recording, Transcription, More, Add Transcript to Note or Copy Transcript; deleting audio deletes transcript;
//   tap recording, Summary with Apple Intelligence. Phone and FaceTime call transcripts require iOS 18.1 or later.
// https://support.apple.com/guide/notes/record-and-transcribe-audio-apdb5106e334/mac
//   Attachment, Record Audio, Record; edit while recording; Pause, Done; double-click recording, Transcription;
//   M1 or later, ten device languages, English locales listed below; More, Find in Transcript and copy options;
//   double-click recording, Summary; all guide features available with iCloud notes, other accounts may lack some.
// https://support.apple.com/guide/iphone/record-and-transcribe-a-call-iph57c6590e9/ios
//   Phone, More, Call Recording; other participant willing; both hear a notice; Stop or hang up; Call Recordings
//   folder; transcript can take time, identifies speakers; unavailable in the EU and other listed countries.
// https://support.apple.com/en-us/121115
//   Apple Intelligence devices, matching device/Siri languages; summary requirements are separate from transcription.
// https://www.apple.com/ios/feature-availability/ and https://www.apple.com/macos/feature-availability/
//   Read the Notes transcription summaries and Phone recording/transcription sections; link the current lists
//   rather than treating call, Notes transcription and summary language support as the same.
// Pinto claims: BRIEF.md's verified facts (Apple Notes feel, iPhone and Mac, connected ChatGPT/Claude editing,
//   one-tap templates, earlier versions, Mac Apple Notes import leaving Apple Notes unchanged).
//   apple-notes-meeting-notes-template's live verified header and content/templates/meeting-notes.json:
//   free template, newest meeting first, two-line summary, decision bullets, Owner: task (due date) checklist,
//   ask when unclear, tick completed items, "What's still open for me?" and Jonas's review example.
// Picture reused from live apple-notes-ai: /blog/news/apple-notes-recording-summary-mac, Apple's Neuroscience 122
//   note, N122 Lecture recording, transcript preview and Notes from Recording. No new screenshot.

const FOLLOW_UP = `Use my Pinto Notes note "Meeting notes". I'll paste a meeting transcript below.
Add the meeting name and date, a two-line summary and the decisions under Meetings, newest first.
Add each action item under Action items as "Owner: task (due date)" in a checklist.
If something is unclear, ask me before writing it.`;

const FAQ = [
  { q: "Does Apple Notes need Apple Intelligence to transcribe audio?", a: [
    "No. Audio transcription works on iPhone 12 and later or a Mac with M1 or later, with a supported device language. A summary of the transcript needs Apple Intelligence.",
  ] },
  { q: "Where do phone recordings appear in Apple Notes?", a: [
    "In the Call Recordings folder. Start the recording in Phone, using More, then Call Recording. Both participants hear a notice. Availability depends on your region, and call transcription has its own language requirements.",
  ] },
  { q: "Can I keep typing in Notes during a meeting recording?", a: [
    "Yes. On iPhone, swipe down from the top of the recording screen to take notes. On a Mac, you can edit the note while the recording continues.",
  ] },
  { q: "Will deleting the recording remove its transcript?", a: [
    "Yes. Apple says deleting an audio recording also deletes its transcript. Use Copy Transcript or Add Transcript to Note before removing audio you still need as text.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-record-and-transcribe"
      intro={<>To record audio in Apple Notes, open a note, choose the attachment button, then Record Audio. Transcription needs an iPhone 12 or later or a Mac with M1 or later, with a supported language.</>}
      answer={
        <Answer jump={[
          { href: "#iphone", label: "Record on iPhone" },
          { href: "#mac", label: "Record on Mac" },
          { href: "#requirements", label: "Devices and languages" },
          { href: "#transcript", label: "Copy the text" },
          { href: "#phone-calls", label: "Phone calls" },
          { href: "#pinto-notes", label: "Meeting follow-ups" },
        ]}>
          <p>
            Choose Record Audio in a note, then press Record. Notes transcribes supported speech, and you can copy the text or add it
            to the note. Transcription doesn&apos;t need Apple Intelligence; a summary does.
          </p>
          <PostCta slug="apple-notes-record-and-transcribe" position="answer" template="meeting-notes" title="Turn the transcript into follow-ups">
            <p>Pinto Notes has a free meeting notes template. Once ChatGPT or Claude is connected, paste in the transcript and it writes the summary, decisions and action items with owners and dates.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/apple-notes-recording-summary-mac" width={1630} height={1780} maxWidth={560}
        alt="Apple Notes on a Mac: a Neuroscience 122 note with an N122 Lecture audio recording, a transcript preview and a Notes from Recording section."
        caption="A lecture recording and its transcript preview in Apple Notes on a Mac. Image: Apple." />}
      faq={FAQ}
    >
      <h2 id="iphone">Record and transcribe audio on iPhone</h2>
      <MenuPaths rows={[{ on: "iPhone", steps: ["Notes", "Attachments", "Record Audio"] }]} />
      <Steps>
        <li>Open a note and tap the Attachments button, then Record Audio.</li>
        <li>Tap Record to start. Tap the Transcription button to see the words as you speak.</li>
        <li>Swipe down from the top of the screen if you want to type notes while recording.</li>
        <li>When you&apos;re finished, tap Pause, then Done.</li>
      </Steps>
      <p>
        Apple&apos;s <a href="https://support.apple.com/guide/iphone/record-and-transcribe-audio-iphbe11247b5/ios" rel="noopener">iPhone
        recording guide</a> gives these steps. For a meeting, keep a note of decisions as you go. You can check the exact words in the
        recording afterwards.
      </p>

      <h2 id="mac">Record audio in Notes on a Mac</h2>
      <MenuPaths rows={[{ on: "Mac", steps: ["Notes", "Attachment", "Record Audio"] }]} />
      <Steps>
        <li>In a note, click the Attachment button in the toolbar, then Record Audio.</li>
        <li>Click Record. You can keep editing the note while it records.</li>
        <li>Click the Transcription button for the live text. Click Pause, then Done to finish.</li>
      </Steps>
      <p>
        To reopen the text, double-click the recording, then click Transcription. These are the steps in Apple&apos;s{" "}
        <a href="https://support.apple.com/guide/notes/record-and-transcribe-audio-apdb5106e334/mac" rel="noopener">Mac recording guide</a>.
        Apple says all the guide&apos;s features work with iCloud notes; accounts from other providers may lack some.
      </p>

      <h2 id="requirements">Which devices and languages can transcribe?</h2>
      <p>
        These steps follow Apple&apos;s iOS 27 and macOS 27 guides. The iPhone guide requires iPhone 12 or later for transcription.
        The Mac guide requires M1 or later. Both list these device languages for audio
        transcription: English, Spanish, Portuguese, Italian, French, German, Japanese, Korean, Simplified Chinese and Traditional
        Chinese. The Mac guide lists English for Australia, Canada, New Zealand, South Africa, the UK and the US.
      </p>
      <p>
        If the Transcription button is missing, Apple says the device either doesn&apos;t meet the minimum requirements or hasn&apos;t
        detected a supported language. Check both before making another recording. Phone-call transcription has a separate list in
        Apple&apos;s <a href="https://www.apple.com/ios/feature-availability/#phone-call-transcription" rel="noopener">feature availability guide</a>.
      </p>
      <p>
        A summary needs an <a href="https://support.apple.com/en-us/121115" rel="noopener">Apple Intelligence device</a>, including
        iPhone 15 Pro, iPhone 15 Pro Max, iPhone 16 models or later, iPhone Air
        or iPhone Duo, or a Mac with M1 or later or MacBook Neo. Device and Siri languages must match. Summary languages differ from
        transcription languages, so check Apple&apos;s <a href="https://www.apple.com/ios/feature-availability/#apple-intelligence-notes-transcription" rel="noopener">current
        summary list</a>. Our <a href="/blog/apple-notes-ai">Apple Notes AI guide</a> covers Apple Intelligence setup and its other Notes tools.
      </p>

      <h2 id="transcript">Turn the recording into text you can use</h2>
      <p>
        Open the recording and show its transcript. Open More, then choose Add Transcript to Note to put the words in the note, or
        Copy Transcript to paste them elsewhere. Find in Transcript searches inside the recording, and selecting text plays that part
        of the audio.
      </p>
      <p>
        For a summary on a supported device, open the recording and choose Summary. On a Mac, double-click the recording first.
        Keep the full transcript until you&apos;ve checked the decisions and names against the audio.
      </p>

      <h2 id="phone-calls">Record a phone call and find it in Notes</h2>
      <p>
        A phone call starts in Phone. Check availability in your region and make sure the other person agrees to the recording.
        Apple&apos;s <a href="https://support.apple.com/guide/iphone/record-and-transcribe-a-call-iph57c6590e9/ios" rel="noopener">call
        recording guide</a> says the feature isn&apos;t available in the European Union and several other countries.
      </p>
      <Steps>
        <li>During a call with one other person, tap More in Phone, then Call Recording. Both people hear an audio notice.</li>
        <li>Tap Stop or hang up to finish. The recording saves in Notes, in the Call Recordings folder.</li>
        <li>Open that note and tap the recording to read its transcript, where supported. Each speaker is identified.</li>
      </Steps>
      <p>
        The transcript can take time to appear. Notes may say transcription is in progress. Apple&apos;s iPhone guide says viewing
        transcripts of recorded Phone and FaceTime audio calls requires iOS 18.1 or later; language and regional restrictions still apply.
      </p>

      <h2 id="limits">Where it stops</h2>
      <p>
        Keep the audio until you&apos;ve checked the transcript. Apple warns that a call transcript may not perfectly represent the
        conversation. Deleting a recording also deletes its transcript, so copy any text you need first.
      </p>
      <p>
        After a meeting, turn the checked text into decisions and tasks with names attached. The{" "}
        <a href="/blog/apple-notes-meeting-notes-template">Apple Notes meeting notes template</a> gives you a layout to fill in by hand.
      </p>

      <h2 id="pinto-notes">Use the transcript for meeting follow-ups</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac. Its free{" "}
        <a href="/templates/meeting-notes">meeting notes template</a> adds a note in one tap, with open action items at the top and
        meetings below, newest first. Start with the text you copied from Apple Notes.
      </p>
      <p>
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, paste the transcript into your AI with the
        template&apos;s instructions. It writes a two-line summary and the decisions, then adds checklist items with an owner and due
        date. If something is unclear, it asks before writing.
      </p>
      <Keep title="A follow-up request for your connected AI" text={FOLLOW_UP}
        note="Add the meeting notes template first, then paste this request and your transcript into ChatGPT or Claude." />
      <p>
        Later, ask &ldquo;What&apos;s still open for me?&rdquo; or say &ldquo;Mark Jonas&apos;s design review as done.&rdquo; The AI can
        tick the completed item in the note, and every earlier version is kept. Your Apple Notes come over in{" "}
        <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
