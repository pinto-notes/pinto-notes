import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";
import { APP_STORE_LIVE } from "@/lib/site";

export const dynamic = "force-static";
export const metadata = postMetadata("habit-tracker-with-chatgpt-or-claude", { title: "A habit tracker ChatGPT and Claude can update for you" });

// Checked on 13 October 2026 against the Habit tracker template on main (Mac 1.2.26):
// content/templates/habit-tracker.json (its prompt and asks) and habit-tracker.app (README.md, docs/README.md:
// Today, Month and Habits screens; schedules (every day, some weekdays, times a week); skip days that keep the
// streak; a habit's own page; add, rename, reorder and remove with Undo; days kept on remove; counted habits;
// no notifications). Re-checked on growth/apps-bar for the upgraded app. The "Make my note an app" wording is the make_app prompt in
// supabase/functions/mcp/files_tools.ts. The iPhone app isn't on the App Store yet. What ChatGPT and Claude
// build in a chat is described as what you can check yourself, not as tested behaviour.

const PROMPT = `Build me a habit tracker as a small interactive app I can use right here.

My habits:
- Walk, 30 minutes outside (yes or no)
- Read, 20 pages (yes or no)
- Water, 8 glasses (count it, with minus and plus buttons)

Show today first: each habit with a big tick (or the counter), and its streak. Under it, this week as seven small dots per habit. Let me add, rename and remove habits myself, and fix an earlier day by tapping it.

Keep it to one screen. No login, no charts I didn't ask for.`;

const FAQ = [
  { q: "Can ChatGPT make a habit tracker?", a: [
    "Yes. Ask for a small interactive app or a spreadsheet, and list your habits. What it can't do on its own is keep your ticks between chats unless the thing it built saves them somewhere, so check that before you rely on it.",
  ] },
  { q: "Can Claude make a habit tracker?", a: [
    "Yes. Claude builds it as an artifact you can click in the chat. Test it the same way: tick a habit, come back the next day, and see whether the tick is still there.",
  ] },
  { q: "Is there a free habit tracker ChatGPT can update?", a: [
    "The Habit tracker template for Pinto Notes is free and comes with its own app. Once Pinto Notes is connected to ChatGPT or Claude, the AI can log days in it, and you can tick everything yourself as well.",
  ] },
  { q: "Will the habit tracker remind me?", a: [
    "Not the Pinto Notes one: apps in a note can't send notifications yet. Use your phone's reminders or calendar for the nudge.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="habit-tracker-with-chatgpt-or-claude"
      intro={<>
        Every habit tracker I&apos;ve started died the same way: not from the habits, from the ticking. By week three I&apos;d stopped
        opening it. What I wanted was to text &ldquo;walked, read 20 pages&rdquo; to the AI I already talk to all day and have the
        tracker fill itself in. Here are the two ways to get close to that, and the one that actually works.
      </>}
      answer={
        <Answer jump={[
          { href: "#in-chat", label: "Build one in the chat" },
          { href: "#missing", label: "What's missing" },
          { href: "#template", label: "A tracker your AI can update" },
          { href: "#ai-logs", label: "Let your AI log the day" },
          { href: "#limits", label: "Limits" },
        ]}>
          <p>
            ChatGPT and Claude can build you a habit tracker in one message, but it lives in that chat and usually forgets your ticks.
            The habit apps on the App Store have their own AI coaches, and none of them let ChatGPT or Claude write to them. A tracker
            in Pinto Notes does both: you tick it yourself, and your AI logs a day when you tell it what you did.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/pinto/habit-tracker-main-mac-light" width={1280} height={900} maxWidth={640}
        alt="A habit tracker app in a Pinto Notes note on a Mac: Today, 2 of 6 habits done with a 62 percent ring for the week, a dot grid for this week, and each habit with its streak, including Water at 5 of 8 glasses."
        caption="The habit tracker template in Pinto Notes. Tick it yourself, or tell your AI what you did. Example data." />}
      faq={FAQ}
    >
      <h2 id="in-chat">Ask ChatGPT or Claude to build one</h2>
      <p>
        Both can write a small tracker from a description: Claude opens it as an artifact beside the chat, ChatGPT as code in a canvas
        or a spreadsheet to download. Be specific, and say which habits you count (glasses of water) and which are yes or no.
      </p>
      <Keep title="A habit tracker prompt" text={PROMPT}
        note="Two or three habits is a good start. A tracker with nine on day one is usually abandoned by Friday." />
      <p>
        Then do the test that decides whether it&apos;s a tracker or a demo: tick a habit, close the chat, open it tomorrow. If the tick is
        gone, you&apos;re back to a blank week. A downloaded spreadsheet keeps your ticks, but the AI can&apos;t see it unless you upload it
        again.
      </p>

      <h2 id="missing">What&apos;s missing</h2>
      <p>
        I looked for a habit app my AI could write to and didn&apos;t find one. The App Store is full of trackers with a built-in AI coach,
        but that coach is a stranger: it doesn&apos;t know what you told ChatGPT this morning, and ChatGPT can&apos;t tick anything in it.
      </p>
      <p>
        What I wanted was two things at once: a real app I can tick on my own, and the AI I already talk to filling it in when I mention
        it, from my phone, in any chat.
      </p>

      <h2 id="template">A tracker your AI can update</h2>
      <p>
        That&apos;s what I built into Pinto Notes, a notes app for Mac and iPhone that ChatGPT and Claude can read and write once you
        allow them. A note can hold a small app, and the <a href="/templates/habit-tracker">habit tracker template</a> is one: choose Start
        tracking, then <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT</a> or Claude once.
      </p>
      <PostFigure src="/blog/pinto/habit-tracker-month-mac-light" width={1280} height={900} maxWidth={640}
        alt="The Month view of the habit tracker on a Mac: a calendar per habit for October with the done days filled in."
        caption="Month: a calendar per habit, on a Mac." />
      <PostFigure src="/blog/pinto/habit-tracker-habit-phone-light" width={780} height={1688} maxWidth={320}
        alt="A habit's own page on a phone: Gym, 3 times a week, 9 weeks in a row, best run 9, 56 percent this month, and a calendar where you tap a day to tick it, again to skip it."
        caption="A habit's own page on a phone: its streak, best run, and a skip that keeps the streak." />
      <p>
        You stay in charge of it. Add, rename, reorder and remove habits yourself, and set each one to every day, some weekdays, or a
        number of times a week. Tap a day to fix the Tuesday you forgot. A sick day can be skipped without losing three weeks of walks.
      </p>

      <h2 id="ai-logs">Let your AI log the day</h2>
      <p>At the end of the day, open ChatGPT or Claude anywhere and just say what happened:</p>
      <ul>
        <li>&ldquo;Log today: walked, read 30 pages, 6 glasses of water, phone in bed again.&rdquo;</li>
        <li>&ldquo;Which habit did I miss most this month?&rdquo;</li>
        <li>&ldquo;Add stretching, on weekdays only.&rdquo;</li>
      </ul>
      <p>
        The first ticks Walk and Read and sets Water to 6. The second reads the same data you see. The third changes the app itself. And
        because it&apos;s one notebook, it doesn&apos;t matter which AI you told: log it in ChatGPT, ask Claude about your week, and it knows.
      </p>

      <h2 id="limits">Limits</h2>
      <p>
        Apps in a note can&apos;t send notifications yet, so use your phone&apos;s reminders for the nudge. The AI logs a day when you tell
        it, not on its own. Connecting ChatGPT needs a paid plan with custom apps. For a few words about the day next to the ticks,
        try <a href="/blog/journal-with-chatgpt-or-claude">journaling with ChatGPT or Claude</a>; for money, the same idea works as{" "}
        <a href="/blog/budget-tracker-with-chatgpt-or-claude">a budget your AI keeps</a>.
        {APP_STORE_LIVE
          ? <> Pinto Notes is free on Mac and iPhone.</>
          : <> Pinto Notes is free on the Mac today; the iPhone app is coming soon, and until then ChatGPT and Claude can still log days from your phone.</>}
      </p>
    </PostPage>
  );
}
