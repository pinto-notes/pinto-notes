import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("journal-with-chatgpt-or-claude", { title: "Journal with ChatGPT or Claude: daily prompts to copy" });

// Checked on 11 October 2026. The prompts are plain text and name no product, so they work in any AI.
// The four questions and the bold labels (Today, Energy, Remember, Tomorrow) are the Daily journal
// template's (content/templates/daily-journal.json), and the evening scores are the Mood and energy
// log's (content/templates/mood-energy-log.json). Apple Notes: Edit, Paste as Markdown is what the
// apple-notes-templates post checked in Notes on macOS 27 on 8 October. Pinto Notes: append_to_note
// (under_heading, at_start), read_note, read_table and log_table_row are in
// supabase/functions/mcp/tools.ts, where search also says "Locked notes are left out"; the "changed N
// lines, Undo" bar is AIEdit.swift and version history is VersionHistoryView.swift, on main on
// 11 October. The capture is the Evening tracker one: there is no capture of a Daily journal note
// yet, and the caption says what it shows.

const PROMPT = `Let's write today's journal entry. Ask me these four questions one at a time, and wait for my answer before you ask the next. If I say "skip", move on.

1. What happened today?
2. What took energy, and what gave it back?
3. What do I want to remember?
4. What's one thing for tomorrow?

If I tell you about my whole day in one message instead, don't ask the questions. Write the entry from what I said.

Then write the entry like this:
- A heading with the weekday and the date.
- Four short lines that start with a bold label: Today, Energy, Remember, Tomorrow.
- My own words, shortened. Don't add feelings I didn't mention, and don't give advice unless I ask.
`;

const MORE = `Two minutes, on a tired day:
Ask me for one sentence about today and one thing for tomorrow. Write them as two lines under today's date. Nothing else.

A morning page:
Ask me what's on my mind, what would make today a good day, and what I'm avoiding. One at a time. Then give me back three short lines, in my own words.

When something is stuck:
I'm going to write about something that's bothering me. Don't fix it. Ask me one question at a time that helps me say it more exactly, at most five. Then sum up what I said in three lines and ask if you got it right.

Looking back over a month:
Here are my journal entries from the last month. What comes up more than once? Quote my own lines as evidence, and tell me if there's too little to say.
`;

const FAQ = [
  { q: "Can ChatGPT keep a journal for me?", a: [
    "It can ask the questions and write up your answers, which is the part most people stall on. Whether it keeps the entries is another matter: a chat scrolls away, so copy each entry into a note, or use a notes app the AI can write to.",
  ] },
  { q: "What should a daily journal prompt ask?", a: [
    "Four questions cover most days: what happened, what took energy and what gave it back, what you want to remember, and one thing for tomorrow. Tell the AI to ask them one at a time and to keep your own words.",
  ] },
  { q: "Is it private to journal with an AI?", a: [
    "What you type is sent to the company that runs the AI, as with any chat. ChatGPT and Claude both have a setting for whether your chats are used to train their models, so look at it before you write anything you'd mind sharing. For the most private thoughts, a note you write yourself and lock is safer than a chat.",
  ] },
  { q: "Will the AI remember what I wrote last week?", a: [
    "Don't count on it. Paste the entries in when you want it to look back, or keep them in a note the AI can read, so it answers from what you wrote and not from what it recalls.",
  ] },
  { q: "Does Pinto Notes remind me to journal?", a: [
    "No. It's a notes app and sends no reminders. Pick a time, such as when you put your phone on charge, and say \"I want to journal\" to your AI then.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="journal-with-chatgpt-or-claude"
      intro={<>Most journals stop at the empty page. If an AI asks you four short questions and writes down what you say, the page is never empty, and an entry takes about three minutes.</>}
      answer={
        <Answer jump={[
          { href: "#prompt", label: "The prompt" },
          { href: "#what-you-get", label: "What an entry looks like" },
          { href: "#more", label: "Prompts for other days" },
          { href: "#private", label: "Is it private?" },
          { href: "#keep-it", label: "Where the journal lives" },
          { href: "#in-a-note", label: "Let the AI keep it" },
        ]}>
          <p>
            Paste the prompt below into ChatGPT or Claude. It asks four questions, one at a time: what happened today, what took
            energy and what gave it back, what you want to remember, and one thing for tomorrow. Then it writes four short lines in
            your own words. Keep every entry in one note, newest first, so a month from now you can read the days back.
          </p>
        </Answer>
      }
      // Nothing above the intro: there's no capture of a Daily journal note yet, and the tracker one
      // belongs further down, in the Pinto Notes section, captioned as what it is.
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="prompt">The prompt</h2>
      <p>
        It names no app, so it works in ChatGPT, Claude, Gemini or anything else. It works in a voice chat too, so you can talk
        through the day while you do the dishes.
      </p>
      <Keep title="Daily journal" text={PROMPT}
        note="Keep the last line. Left alone, an AI tidies your day into something calmer and wiser than it was, and that isn't the day you'll want to read about later." />

      <h2 id="what-you-get">What an entry looks like</h2>
      <p>Four lines you can read in ten seconds. For a Friday:</p>
      <p><strong>Friday 2 October</strong></p>
      <ul>
        <li><strong>Today:</strong> quiet day; finished the report and left at five.</li>
        <li><strong>Energy:</strong> low after lunch, better after coffee with Jonas.</li>
        <li><strong>Remember:</strong> the bakery on the corner opens at seven.</li>
        <li><strong>Tomorrow:</strong> call Mum.</li>
      </ul>
      <p>
        Short is the point. An entry this size gets written on the days you&apos;re tired, and those are the days worth having on
        record.
      </p>

      <h2 id="more">Prompts for other days</h2>
      <p>Four more, for the days when the usual questions don&apos;t fit. Each one stands alone.</p>
      <Keep title="Four more journal prompts" text={MORE} />
      <p>
        The last one needs the entries in front of the AI. If they live in a chat or in Apple Notes, paste them in first. For a
        longer look back once a week, there&apos;s <a href="/blog/weekly-review-with-chatgpt-or-claude">a weekly review prompt</a>{" "}
        that works the same way.
      </p>

      <h2 id="private">Is it private?</h2>
      <p>
        Less private than a paper notebook, and it&apos;s worth knowing how before you start. Whatever you type or say goes to the
        company that runs the AI. ChatGPT and Claude each have a setting that decides whether your chats are used to train their
        models. Open the app&apos;s settings, find the data or privacy section, and choose before your first entry.
      </p>
      <p>
        Some things don&apos;t belong in a chat at all. Write those by hand in a note and lock it. Apple Notes can lock a note behind your
        passcode or a password of its own. If you choose a password and lose it,{" "}
        <a href="/blog/forgot-apple-notes-password">nobody can open the note</a>, Apple included.
      </p>

      <h2 id="keep-it">Where the journal lives</h2>
      <p>A journal is only worth something if you can read it back, so pick one place and stay there.</p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">The entries live in</th><th scope="col">You can read the days back</th><th scope="col">The AI can look back with you</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">The chat</th><td>By scrolling, if you keep to one chat</td><td>Only in that chat</td></tr>
            <tr><th scope="row">Apple Notes, pasted in</th><td>Yes</td><td>No. You paste the entries back in</td></tr>
            <tr><th scope="row">A note your AI can edit</th><td>Yes</td><td>Yes. It reads the note first</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Apple Notes does this well for free. Make one note called Journal and paste each entry at the top. On a Mac with macOS 27,
        Edit, Paste as Markdown keeps the heading and the bold labels. On iPhone, paste it as it is. If the labels arrive with
        asterisks around them, the entry still reads fine. <a href="/blog/apple-notes-templates">Apple Notes templates</a> shows how
        to keep a blank entry to duplicate, if you&apos;d rather type than talk.
      </p>

      <h2 id="in-a-note">Let the AI keep the journal itself</h2>
      <p>
        The third row is what I built Pinto Notes for. It&apos;s a notes app for iPhone and Mac that ChatGPT and Claude can read
        and edit once you allow it. With one Daily journal note, an evening looks like this:
      </p>
      <Steps>
        <li>
          <strong>Say &ldquo;I want to journal&rdquo;</strong>
          The AI reads the note, finds the four questions in it and asks them one at a time.
        </li>
        <li>
          <strong>Answer, or just talk</strong>
          &ldquo;Today was long: the move is done, the boxes aren&apos;t, and I finally slept&rdquo; is enough for an entry.
        </li>
        <li>
          <strong>The entry lands at the top of the note</strong>
          Under Entries, newest day first. You never copy or paste anything.
        </li>
      </Steps>
      <p>
        Because every day is in the same note, &ldquo;what&apos;s been on my mind this week?&rdquo; gets an answer from your own
        entries. And if you&apos;d like numbers next to the words, a second note can hold a table with one row per evening: say
        how you slept and how the day felt, and the AI logs the scores.
      </p>
      <Figure shot={SHOTS.tracker} ground="berry" caption="An Evening tracker in Pinto Notes on a Mac, not a journal entry: one row a day, with energy and mood as numbers. The AI adds the row when you tell it about your evening." />
      <p>
        What the AI wrote is tinted in the note, with a bar that says how many lines it changed and an Undo. Every earlier version
        is kept, so an entry it got wrong is easy to put back.
      </p>
      <p>
        What it doesn&apos;t do: it sends no reminders, and it isn&apos;t more private than the AI you connect, which reads the
        journal in order to write in it. The AI sees the title of a note you lock in Pinto Notes and nothing else, so a locked journal
        is one you write yourself. You need ChatGPT on a plan that allows custom apps, or Claude;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connecting ChatGPT</a> takes a few minutes. The free{" "}
        <a href="/templates/daily-journal">Daily journal template</a> has the note and the prompt that goes with it, and the{" "}
        <a href="/templates/mood-energy-log">Mood and energy log</a> is the table.
      </p>
      <PostCta slug="journal-with-chatgpt-or-claude" position="how-amber-helps" title="Try Pinto Notes on your Mac">
        <p>One note for every day&apos;s entry, written down by your AI and read back by you.</p>
      </PostCta>
    </PostPage>
  );
}
