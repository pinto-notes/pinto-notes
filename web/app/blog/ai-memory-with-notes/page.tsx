import { NoteMoment } from "@/lib/NoteMoment";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("ai-memory-with-notes", { title: "Does your AI remember better with notes?" });

// Every number here is from the public repo github.com/pinto-notes/memory-study (README and
// results/), runs of November 2026: Claude Haiku 5.5 on LoCoMo (Maharana et al., ACL 2024), 1,540
// questions without the adversarial category; GPT-6 Luna on the same test; LongMemEval-S, 48
// questions. Sonnet 5.5 numbers stay out of the headline because it has memorized LoCoMo (45.7% with
// no memory). Saved facts is our simulation, never ChatGPT's or Claude's built-in memory. LoCoMo is
// CC BY-NC, so no dataset text or notes written from it appear here.

const REPO = "https://github.com/pinto-notes/memory-study";

const FAQ = [
  { q: "What is LoCoMo?", a: [
    "A benchmark for long-term memory in chat, from Snap Research (Maharana et al., ACL 2024). It has 10 long conversations between two friends, each 19 to 32 chats over months, and questions about what happened in them. AI memory products often quote their score on it.",
  ] },
  { q: "Is this a comparison with ChatGPT's or Claude's memory?", a: [
    "No. \"Saved facts\" is our stand-in for a memory list: up to five one-line facts the AI chose to keep after each chat. It isn't the built-in memory of either app, so this test can't say how Pinto compares with them.",
  ] },
  { q: "Why a small model?", a: [
    "Because bigger models have learned LoCoMo. Claude Sonnet 5.5 answered 45.7% of the questions with no memory at all, often with the exact dates. Claude Haiku 5.5 got 3.1% of the date questions with no memory and GPT-6 Luna 6.5%, so their scores measure memory, not recall of the benchmark.",
  ] },
  { q: "How did the AI decide what to write down?", a: [
    "After each chat it got one instruction: \"Remember this chat in Pinto Notes for next time.\" It chose the notes itself. It kept a note per person and a note per chat, and in the new chat it found what it needed with search, list and fetch.",
  ] },
  { q: "Can I run it myself?", a: [
    "Yes. The scripts, every answer and every grade are in the repo, and the runs go through the Claude Code and Codex command line tools. The Pinto condition runs Pinto's own MCP server code on a local database on your machine.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="ai-memory-with-notes"
      intro={<>Every new chat with ChatGPT or Claude starts blank. I wanted to know how much an AI remembers about months of past chats when it has nothing, a short list of saved facts, one notebook, or Pinto Notes to keep its notes in. So I ran the test AI memory products quote, and put the code and every answer online.</>}
      answer={
        <Answer jump={[
          { href: "#test", label: "The test" },
          { href: "#results", label: "Results" },
          { href: "#limits", label: "What it doesn't show" },
          { href: "#run-it", label: "Run it yourself" },
        ]}>
          <p>
            In a new chat, Claude answered 18% of questions about months of past chats right. With Pinto Notes connected, 82.5%.
          </p>
          <p>
            Memory here means what the AI wrote down after each chat and could look up in the next one: nothing, a short list of saved
            facts, one notebook, or its own notes in Pinto Notes. Every number is below.
          </p>
          {/* 13 Nov 2026 (Emil: "sounds good"): the download where readers are, as in experiment B1. */}
          <PostCta slug="ai-memory-with-notes" position="answer" title="Want your AI to remember?">
            <p>Pinto Notes works like Apple Notes, and ChatGPT and Claude can keep their notes in it, where you can read and fix them.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="test">The test</h2>
      <p>
        LoCoMo has 10 long conversations between two friends. Each one is 19 to 32 chats, spread over months, and there are 1,540
        questions about them: single facts, several facts together, when something happened, and what you can work out from it. I
        left out the adversarial questions, as every published score does.
      </p>
      <p>
        Each chat counts as a separate chat with the AI. After the last one, the questions come in a new chat, which is where you are
        when you open ChatGPT or Claude tomorrow. The only thing that changes is what that new chat has:
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">Condition</th><th scope="col">What the new chat has</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">No memory</th><td>Nothing.</td></tr>
            <tr><th scope="row">Saved facts</th><td>Up to five one-line facts the AI chose to save after each chat.</td></tr>
            <tr><th scope="row">One notebook</th><td>A single markdown notebook the AI rewrote after each chat, asked to stay under 2,000 words.</td></tr>
            <tr><th scope="row">Pinto</th><td>Pinto Notes connected through its real MCP server code, on a local test database. After each chat the AI was told to remember it in Pinto Notes.</td></tr>
            <tr><th scope="row">Every old chat pasted in</th><td>All the transcripts in the prompt. The ceiling, not something a chat app does.</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="results">Results</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">Share right</th><th scope="col">All</th><th scope="col">One fact</th><th scope="col">Several facts</th><th scope="col">When</th><th scope="col">Inference</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">No memory</th><td>18.0%</td><td>24.1%</td><td>12.8%</td><td>3.1%</td><td>29.2%</td></tr>
            <tr><th scope="row">Saved facts</th><td>60.2%</td><td>66.1%</td><td>58.2%</td><td>48.3%</td><td>54.2%</td></tr>
            <tr><th scope="row">One notebook</th><td>71.9%</td><td>72.4%</td><td>67.4%</td><td>80.4%</td><td>52.1%</td></tr>
            <tr><th scope="row">Pinto</th><td><strong>82.5%</strong></td><td>88.5%</td><td>66.0%</td><td>86.6%</td><td>64.6%</td></tr>
            <tr><th scope="row">Every old chat pasted in</th><td>85.4%</td><td>93.6%</td><td>72.0%</td><td>83.5%</td><td>59.4%</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        I ran the other four conditions a second time, with new notebooks and new answers, and every score landed within 2.5 points. Pinto is one run.
        Pinto scored higher than every old chat pasted in on dates and inference, and lower overall.
      </p>
      <p>
        The no-memory score is mostly lucky guesses, helped by hints in the questions themselves.
      </p>

      <h2 id="dates">Dates are where a list of facts falls short</h2>
      <p>
        A one-line fact like &ldquo;Sam started a pottery class&rdquo; usually loses the date. A note per chat keeps it, because the
        date is in the note&apos;s title. So on &ldquo;when did this happen&rdquo; questions, saved facts got 48% and Pinto 87%.
      </p>
      <p>
        OpenAI&apos;s small model shows the same thing. GPT-6 Luna went from 18.3% with no memory to 74.5% with a notebook it kept
        itself. With saved facts it got 43.6%, and only 11.5% of the date questions. I didn&apos;t run Pinto with GPT-6 Luna.
      </p>

      <h2 id="what-it-wrote">What the AI kept in Pinto</h2>
      <NoteMoment
        me="Remember this chat in Pinto Notes for next time."
        reply="Saved. I added today's news to Sam's note and kept a note of this chat."
        ai="Claude"
        glyph="claude"
        title="Sam"
        kind="bullet"
        lines={[
          { text: "Nurse, works nights" },
          { text: "Sister Mia moved to Berlin in April" },
          { text: "Started a pottery class on 12 May", by: true },
          { text: "Wants to go to Lisbon in October", by: true },
        ]}
        caption="An example made up for this page, in the shape the AI chose in the test: a note per person, with dates. The test's own notes stay out, because its data can't be reused commercially."
      />
      <p>
        Across the 10 conversations, Haiku made 275 notes, edited them 937 times, and ran 600 searches and 6,671 fetches. It settled
        on a note for each person and a dated note for each chat, the way you might set up a notebook by hand.
      </p>
      <p>
        It also kept a lot. With no limit, it wrote 8,000 to 24,000 words per pair of friends, often more than the chats themselves.
        Part of the gain comes from that. The logs don&apos;t record how much of its notes it read for each answer, so I make no
        claim about that.
      </p>

      <h2 id="limits">What this doesn&apos;t show</h2>
      <ul>
        <li><strong>It isn&apos;t ChatGPT&apos;s or Claude&apos;s memory.</strong> Saved facts is a simulation, so this says nothing about how Pinto compares with them.</li>
        <li><strong>Pasting everything still wins when it fits.</strong> On LongMemEval-S, where each question comes with about 50 chats and 165,000 tokens of history, Haiku scored 91.7% with all of it pasted in, 70.8% with one notebook (reading about 10,000 tokens) and 2.1% with nothing. Today&apos;s models read long input well. A year of your chats still doesn&apos;t fit in one prompt.</li>
        <li><strong>One benchmark of two friends talking,</strong> not a person talking with their own assistant.</li>
        <li><strong>Small models only,</strong> for the reason below.</li>
      </ul>

      <h2 id="memorized">Bigger models have memorized LoCoMo</h2>
      <p>
        I also ran Claude Sonnet 5.5. With no memory at all it answered 45.7% right and 27.7% of the date questions, often word for
        word, like &ldquo;7 May 2023&rdquo;. A blank chat can&apos;t know that. LoCoMo has been public since 2024, and Sonnet has
        learned it. The order of the conditions was the same, but its numbers are inflated, so I don&apos;t use them.
      </p>
      <p>
        That&apos;s worth keeping in mind when you see very high LoCoMo scores. The answer key also has mistakes in it, and the usual
        grader is lenient. To check ours, a second model graded 100 random answers blind under a stricter rule and agreed on 99. The
        100 are in the repo so a person can check them too.
      </p>

      <h2 id="run-it">Run it yourself</h2>
      <p>
        The scripts, every answer and every grade are at <a href={REPO}>github.com/pinto-notes/memory-study</a>. You need Python, Deno
        for the Pinto condition, and the Claude Code command line tool signed in. You can start with a pilot of one conversation and
        20 questions. The Pinto condition starts Pinto&apos;s own MCP server code on your machine with an empty, in-memory database,
        so nothing touches a real account.
      </p>

      <h2 id="why">Why I ran this</h2>
      <p>
        I make Pinto Notes so the AI you use keeps its notes somewhere you can read them and fix them. This test is the measurable part
        of that: in a new chat, an AI that can open its notes remembers most of what you told it, and one that can&apos;t remembers
        almost nothing. You can <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT</a> or Claude, and the same
        notes work from <a href="/blog/notes-in-claude-code-and-codex">Claude Code and Codex</a>. If you&apos;d rather wire it up
        yourself, <a href="/blog/mcp-server">the MCP server</a> has the same file tools this test used.
      </p>
    </PostPage>
  );
}
