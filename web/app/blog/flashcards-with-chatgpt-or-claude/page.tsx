import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("flashcards-with-chatgpt-or-claude", { title: "How to make flashcards with ChatGPT or Claude" });

// Checked on 13 October 2026. ChatGPT's own flashcards: OpenAI's help article "Flashcards in ChatGPT"
// (help.openai.com/en/articles/20001533): cards in the chat from a topic or uploaded notes, flip, mark known or
// review again, shuffle, changes by asking, saved to your library, check cards against your notes. The Study notes
// and flashcards template on main (Mac 1.2.26): content/templates/study-flashcards.json (prompt, asks) and
// study-flashcards.app (README.md, docs/README.md: five Leitner boxes with gaps of 1, 2, 4, 8 and 16 days; Study
// and Cards tabs; add, edit, delete with Undo; topic pills; no typed answers, multiple choice or images). The
// iPhone app isn't on the App Store yet.

const PROMPT = `Make flashcards from the notes below.

Rules:
- One fact per card. If a card needs "and" in the answer, split it.
- Questions I could be asked in an exam, not "What is mentioned about...".
- Answers of one line, in my notes' own terms.
- Only facts that are in my notes. If something important seems missing, list it at the end instead of making a card for it.
- Ten to fifteen cards, then stop.

Give them as a two-column table: Question, Answer.

My notes:
[paste them here]`;

const FAQ = [
  { q: "Can ChatGPT make flashcards?", a: [
    "Yes. ChatGPT has its own flashcards: ask for cards on a topic or upload your notes, and it shows them in the chat to flip and mark as known or to review again. OpenAI says they're saved in your library, and suggests checking them against your notes.",
  ] },
  { q: "Can Claude make flashcards?", a: [
    "Yes, as a table you can copy anywhere, or as an artifact you click through in the chat. Ask it to work only from the notes you paste, so the cards match what you'll be tested on.",
  ] },
  { q: "Can I put ChatGPT flashcards into Anki?", a: [
    "Ask for the cards as two columns separated by a tab, one card per line, and save that as a text file. Anki's import reads that format. Check the first few cards after the import.",
  ] },
  { q: "What is the Leitner system?", a: [
    "Cards sit in numbered boxes. A card you know moves up a box and comes back less often; a card you miss goes back to box 1 and comes back soon. In the Pinto Notes template, box 1 comes back after a day and box 5 after sixteen.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="flashcards-with-chatgpt-or-claude"
      intro={<>Turning a chapter into flashcards used to take an evening. ChatGPT or Claude does it in a minute, which moves the hard part to two other places: whether the cards are any good, and whether the ones you get wrong come back.</>}
      caption="The flashcards template's app in Pinto Notes on a Mac: the cards due today, and how many sit in each box."
      answer={
        <Answer jump={[
          { href: "#prompt", label: "The prompt" },
          { href: "#chatgpt", label: "ChatGPT's own flashcards" },
          { href: "#template", label: "Study them in an app" },
          { href: "#yourself", label: "Edit cards yourself" },
          { href: "#limits", label: "Limits" },
        ]}>
          <p>
            Paste your notes into ChatGPT or Claude with a prompt that asks for one fact per card, exam-style questions and only
            what&apos;s in your notes. ChatGPT can show the cards in its own flashcard view. To study them over weeks, with missed
            cards coming back sooner, keep them in an app with spaced repetition. The free Study notes and flashcards template
            for Pinto Notes is one your AI fills in from your notes.
          </p>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="prompt">The prompt</h2>
      <p>
        Left alone, an AI writes cards that are too long and too vague: &ldquo;What are the key features of glycolysis?&rdquo;
        with a paragraph for an answer. You can&apos;t say whether you knew that, so you can&apos;t grade yourself honestly. The fix
        is one fact per card, and answers short enough that you either knew them or didn&apos;t.
      </p>
      <Keep title="A flashcards prompt" text={PROMPT}
        note={"\"Only facts that are in my notes\" keeps the AI from filling gaps with things your course never covered."} />
      <p>
        Read every card once before you study it. An AI can get a fact wrong while sounding sure of it, and a wrong card you learn
        well is worse than no card at all. Ten cards take a minute to check.
      </p>

      <h2 id="chatgpt">ChatGPT&apos;s own flashcards, and Claude&apos;s artifacts</h2>
      <p>
        ChatGPT has a built-in flashcard view. According to OpenAI&apos;s <a href="https://help.openai.com/en/articles/20001533-flashcards-in-chatgpt" rel="noopener">help
        article</a>, you ask for cards on a topic or upload notes, flip each card, and mark it as known or to review again. You
        change cards by asking in the chat, and the cards are saved in your ChatGPT library. If you already study in ChatGPT, try that first.
      </p>
      <p>
        Claude has no flashcard view, but it can build a small study app as an artifact in the chat. Ask for &ldquo;a flashcard app
        with these cards: show the question, a button to show the answer, then Knew it and Didn&apos;t know&rdquo;. Before you rely on
        it, check whether it remembers which cards you missed after you close the chat. The other option in both is a plain table you
        paste somewhere else, such as Anki.
      </p>

      <h2 id="template">Study them in an app your AI can fill</h2>
      <p>
        I make Pinto Notes, a notes app for Mac and iPhone that ChatGPT, Claude and Claude Code can read and edit once you allow them.
        A note in it can hold a small app. The <a href="/templates/study-flashcards">Study notes and flashcards template</a> is a note
        with a flashcard app already built, with sample biology cards to replace.
      </p>
      <Steps>
        <li>
          <strong>Choose Study now on the template page</strong>
          On a Mac with Pinto Notes, it opens the app and adds a &ldquo;Study notes and flashcards&rdquo; note, with its app, to the
          folder you pick.
        </li>
        <li>
          <strong>Connect ChatGPT or Claude once</strong>
          With Read and Edit. <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT</a> needs Developer mode on a paid
          plan; Claude connects from its connector directory.
        </li>
        <li>
          <strong>Paste the template&apos;s prompt, then your notes</strong>
          &ldquo;Here are my notes on cell respiration&rdquo;, and the lecture notes after it. The AI makes five to ten cards under
          that topic, all starting in box 1.
        </li>
      </Steps>
      <p>
        Then study in the app. The first screen says how many cards are due today and has one button, Study now. You see the
        question, tap Show answer, then Didn&apos;t know or Knew it. A card you knew moves up a box: box 1 comes back after a day,
        box 2 after two, then four, eight and sixteen days. A card you missed goes back to box 1. The lowest box comes first, so the
        cards you struggle with come back before the ones you know.
      </p>
      <p>
        You can also say &ldquo;quiz me on biology, ten cards&rdquo; in the chat. The AI asks one card at a time without showing the
        answer, tells you whether you were right, and moves each card the same way the app does. &ldquo;Which cards do I keep
        missing?&rdquo; gets an answer from the boxes. No Mac nearby? Copy the template&apos;s prompt instead, and your AI creates the note with its app from any device once Pinto Notes is connected.
      </p>

      <h2 id="yourself">What you can still do yourself</h2>
      <p>
        The Cards tab lists every card by topic with its box. Tap a card to fix a wrong answer, add your own cards, or delete one;
        a delete shows Undo at the top of the screen. Topic pills on the Study tab narrow a session to one subject, which helps the
        week before one exam. The Boxes chart shows where your cards sit, so you can see progress without a streak to protect.
      </p>
      <p>
        Your AI can change the app itself too. It&apos;s a small React project in the note: ask for a &ldquo;reverse the cards&rdquo;
        button and check the result. Pinto Notes runs the app&apos;s tests on every save and only shows a version that passes. If you
        keep your lecture notes in another app, <a href="/blog/notes-apps-that-work-with-chatgpt">notes apps that work with
        ChatGPT</a> compares the ones your AI can read.
      </p>

      <h2 id="limits">What it doesn&apos;t do yet</h2>
      <p>
        You grade yourself: there are no typed answers and no multiple choice, and cards hold text only, no pictures. The boxes use
        fixed gaps, simpler than Anki&apos;s scheduling. There are no reminders, because apps in Pinto Notes can&apos;t send
        notifications yet.
      </p>
      <p>
        The iPhone app isn&apos;t on the App Store yet, so the flashcard app opens on a Mac with macOS 26 or later. On your phone you
        can still say &ldquo;quiz me&rdquo; to ChatGPT or Claude, and it updates the same cards. If you already live in ChatGPT&apos;s
        flashcards or in Anki, that&apos;s fine; the prompt above works with both.
      </p>
      <PostCta slug="flashcards-with-chatgpt-or-claude" position="how-amber-helps" title="Try the flashcards on your Mac">
        <p>Paste your notes, let your AI make the cards, and study what&apos;s due.</p>
      </PostCta>
    </PostPage>
  );
}
