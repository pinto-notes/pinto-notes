import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("flashcards-with-chatgpt-or-claude", { title: "How to make flashcards with ChatGPT or Claude" });

// Checked on 13 October 2026. ChatGPT's own flashcards: OpenAI's help article "Flashcards in ChatGPT"
// (help.openai.com/en/articles/20001533): cards in the chat from a topic or uploaded notes, flip, mark known or
// review again, shuffle, changes by asking, saved to your library, check cards against your notes. The Study notes
// and flashcards template on main (Mac 1.2.26): content/templates/study-flashcards.json (prompt, asks) and
// study-flashcards.app (README.md, docs/README.md: Again, Hard, Good and Easy with growing intervals per card, five
// boxes that follow the interval; a streak and 12-week calendar; quick add and Paste many; Study and Cards tabs; add,
// edit, delete with Undo; topic pills; no typed answers, multiple choice or images). Re-checked on growth/apps-bar for
// the upgraded app. The iPhone app isn't on the App Store yet.

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
  { q: "How does the Pinto Notes template decide when a card comes back?", a: [
    "Each card has an interval. Good multiplies it, Easy jumps further, Hard grows it a little, and Again starts it over at a day. It's the idea behind Anki's scheduling, with fewer settings. The buttons show the next interval before you tap, like \"Good 8d\".",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="flashcards-with-chatgpt-or-claude"
      intro={<>Turning a chapter into flashcards used to take an evening. ChatGPT or Claude does it in a minute, which moves the hard part to two other places: whether the cards are any good, and whether the ones you get wrong come back.</>}
      caption="The flashcards template's app in Pinto Notes on a Mac: the cards due today, the streak, and what's coming up this week."
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
      hero={<PostFigure priority src="/blog/pinto/study-flashcards-studying-mac-light" width={1280} height={900} maxWidth={640}
        alt="A flashcard being studied in the flashcards app in a Pinto Notes note on a Mac: the question, the answer shown, and four buttons, Again, Hard, Good and Easy, each with when the card comes back."
        caption="Studying in the flashcards template in Pinto Notes. Each grade shows when the card comes back. Example cards." />}
      faq={FAQ}
    >
      <h2 id="prompt">The prompt</h2>
      <PostFigure src="/blog/drawn/fc-onefact" width={1200} height={750} maxWidth={560}
        alt="A crowded flashcard crossed out next to a short flashcard with a green tick."
        caption="One fact per card, so you either knew it or didn't." />
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
      <PostFigure src="/blog/news/openai-chatgpt-flashcards-lecture-notes" width={1920} height={1080} maxWidth={720}
        alt="ChatGPT's flashcard view for an exam review made from lecture notes, with a question card and a Show answer button, and the request that made it with two PDFs attached."
        caption="ChatGPT's flashcards, made from uploaded lecture notes. Image: OpenAI." />
      <p>
        ChatGPT has a built-in flashcard view. According to OpenAI&apos;s <a href="https://help.openai.com/en/articles/20001533-flashcards-in-chatgpt" rel="noopener">help
        article</a>, you ask for cards on a topic or upload notes, flip each card, and mark it as known or to review again. You
        change cards by asking in the chat, and the cards are saved in your ChatGPT library. If you already study in ChatGPT, try that first.
      </p>
      <p>
        Claude has no flashcard view, but it can build a small study app as an artifact in the chat. Ask for &ldquo;a flashcard app
        with these cards: show the question, a button to show the answer, then Knew it and Didn&apos;t know&rdquo;. Before you rely on
        it, check whether it remembers which cards you missed after you close the chat.
      </p>
      <p>
        If you study in Anki, the best route skips copying altogether: <a href="https://ankimcp.ai/" rel="noopener">AnkiMCP</a>, a free,
        open-source connector, lets ChatGPT or Claude add cards straight into your Anki collection, and{" "}
        <a href="https://2anki.net/answers/claude-to-anki/" rel="noopener">2anki</a> turns a chat into a deck to import. Both are
        good, and both put your cards in a separate app from the notes you made them from.
      </p>

      <h2 id="missing">What&apos;s missing</h2>
      <PostFigure src="/blog/drawn/fc-apart" width={1200} height={750} maxWidth={560}
        alt="A note, a flashcard and a ChatGPT chat bubble, apart from each other with dotted lines that don't meet."
        caption="Notes, cards and the AI in three different places." />
      <p>
        That separation is the part that bugs me. My lecture notes are in one app, the cards in another, and the AI in a third. When I
        fix a mistake in my notes, the card still says the old thing. When I ask Claude what I keep getting wrong, it can&apos;t see my
        cards unless I set up yet another connection.
      </p>

      <h2 id="template">Cards that live next to your notes</h2>
      <p>
        I make Pinto Notes, a notes app for Mac and iPhone that ChatGPT, Claude and Claude Code can read and edit once you allow them.
        A note in it can hold a small app. The <a href="/templates/study-flashcards">Study notes and flashcards template</a> is a note
        with a flashcard app already built, with sample biology cards to replace. Your lecture notes can sit in the same notebook, so
        the AI that writes the cards reads the notes they came from, and the one you ask &ldquo;what do I keep getting wrong?&rdquo; sees
        both, whether that&apos;s ChatGPT or Claude.
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
          <strong>Give your AI your notes</strong>
          &ldquo;Make cards from my notes on cell respiration&rdquo;, with the lecture notes after it. It finds the note, reads the
          app&apos;s own notes on how cards are kept, and adds them under that topic as new cards.
        </li>
      </Steps>
      <PostFigure src="/blog/pinto/study-flashcards-main-mac-light" width={1280} height={900} maxWidth={600}
        alt="The Study screen of the flashcards app in a Pinto Notes note on a Mac: 8 cards due today, topic pills, a Study now button, a streak, and the cards coming up this week."
        caption="The first screen: what's due today, and one button to start. Example cards." />
      <p>
        Then study in the app. The first screen says how many cards are due today and has one button, Study now. You see the
        question, tap Show answer, then Again, Hard, Good or Easy. Each button shows when the card comes back: a new card you know
        is back tomorrow, then in a few days, then weeks. Again brings a card back at the end of the session and again tomorrow.
        The cards you know least come first. On a Mac, Space shows the answer and 1 to 4 grade it, so a session goes fast.
      </p>
      <p>
        Away from the app, ask in the chat: &ldquo;Which cards do I keep missing?&rdquo; reads the same cards and grades you see.
        To change the app itself, ask for that too: &ldquo;Add a reverse mode, answer to question&rdquo; or &ldquo;Let me type
        the answer before it shows.&rdquo; Your AI edits the app, and the new version shows up in the note.
      </p>

      <h2 id="yourself">What you can still do yourself</h2>
      <p>
        The Cards tab opens on an add form: type the question, the answer, press Return, and the next card is ready with the same
        topic. Paste many takes lines like &ldquo;question - answer&rdquo; and makes a card of each. Every card is listed by topic
        with when it&apos;s due; tap one to fix a wrong answer, or delete it, and Undo appears at the top of the screen. Topic pills
        on the Study tab narrow a session to one subject, which helps the week before one exam. The Study tab also keeps a streak,
        with a calendar of the last 12 weeks, and shows how many cards fall due each day this week.
      </p>
      <p>
        Your AI can change the app itself too. It&apos;s a small React project in the note: ask for a &ldquo;reverse the cards&rdquo;
        button and check the result. Pinto Notes runs the app&apos;s tests on every save and only shows a version that passes. If you
        keep your lecture notes in another app, <a href="/blog/notes-apps-with-mcp">notes apps with an MCP
        server, compared</a> covers the ones your AI can read.
      </p>

      <h2 id="limits">What it doesn&apos;t do yet</h2>
      <p>
        You grade yourself: there are no typed answers and no multiple choice, and cards hold text only, no pictures. The scheduling
        is simpler than Anki&apos;s, with no settings, no daily limit on new cards and no import of Anki decks. There are no
        reminders, because apps in Pinto Notes can&apos;t send notifications yet.
      </p>
      <PostFigure src="/blog/drawn/fc-quiz" width={1200} height={750} maxWidth={560}
        alt="A phone showing a chat bubble that says quiz me, next to a flashcard."
        caption="On the phone, ask your AI to quiz you from the same cards." />
      <p>
        The iPhone app isn&apos;t on the App Store yet, so the flashcard app opens on a Mac with macOS 26 or later. On your phone you
        can still say &ldquo;quiz me&rdquo; to ChatGPT or Claude, and it updates the same cards. If you already live in ChatGPT&apos;s
        flashcards or in Anki, that&apos;s fine; the prompt above works with both.
      </p>
    </PostPage>
  );
}
