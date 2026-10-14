import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("habit-tracker-with-chatgpt-or-claude", { title: "How to make a habit tracker with ChatGPT or Claude" });

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
      intro={<>Asking ChatGPT or Claude for a habit tracker takes one message. Getting one you still use in week three, and can change without asking the AI every time, takes a little more thought about where the ticks live.</>}
      caption="The habit tracker template's app in Pinto Notes on a Mac. You tick it yourself, and your AI can log a day in the same data."
      answer={
        <Answer jump={[
          { href: "#in-chat", label: "Build one in the chat" },
          { href: "#template", label: "Start from the template" },
          { href: "#yourself", label: "Edit it yourself" },
          { href: "#ai-logs", label: "Let your AI log days" },
          { href: "#limits", label: "Limits" },
        ]}>
          <p>
            There are two routes. Paste a prompt into ChatGPT or Claude and it builds a small tracker in the chat; that works for
            a few days, as long as what you tick is saved. Or start from a free habit tracker app that lives in a note: you tick
            habits in it yourself, add or rename them, and ChatGPT or Claude can log a day in the same data when you tell it what
            you did.
          </p>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="in-chat">Route 1: ask ChatGPT or Claude to build one</h2>
      <p>
        Both can write a small app from a description. In Claude it opens as an artifact beside the chat. In ChatGPT you get code
        in a canvas, or a spreadsheet to download if you ask for one. Be specific about your habits, and say which ones you count
        (glasses of water) and which are yes or no. Without that, you tend to get a generic tracker with sample habits you then
        have to argue away.
      </p>
      <Keep title="A habit tracker prompt" text={PROMPT}
        note="Swap in your own habits. Two or three is a good start: a tracker with nine habits on day one is usually abandoned by Friday." />
      <p>
        Then test the one thing that decides whether it&apos;s a tracker or a demo. Tick a habit, close the chat, and open it again
        tomorrow. If the tick is gone, the app keeps nothing between visits and you&apos;re back to a blank week. A downloaded
        spreadsheet does keep your ticks, but then it&apos;s a file on your computer the AI can&apos;t see unless you upload it again.
      </p>
      <p>
        This route is good for trying a layout. You can say &ldquo;make the ticks bigger&rdquo; or &ldquo;add a 30-day view&rdquo;
        and see it a few seconds later. It gets awkward when you want both things at once: a tracker you tick on your own, and an
        AI that knows what you ticked.
      </p>

      <h2 id="template">Route 2: start from the habit tracker template</h2>
      <p>
        I make Pinto Notes, a notes app for Mac and iPhone that ChatGPT, Claude and Claude Code can read and edit once you allow
        them. A note in it can hold a small app, and the <a href="/templates/habit-tracker">Habit tracker template</a> is a note with a
        habit tracker app already built, with sample habits to replace.
      </p>
      <Steps>
        <li>
          <strong>Choose Start tracking on the template page</strong>
          On a Mac with Pinto Notes installed, it opens the app and adds a &ldquo;Habit tracker&rdquo; note, with its app, to the
          folder you pick. The Mac app is a free download.
        </li>
        <li>
          <strong>Connect your AI once</strong>
          Add Pinto Notes in ChatGPT or Claude and choose Read and Edit when Pinto Notes asks. <a href="/blog/connect-chatgpt-to-your-notes">Connecting
          ChatGPT</a> takes a few minutes in Developer mode, on a paid plan.
        </li>
        <li>
          <strong>Tell your AI what you did</strong>
          &ldquo;Log today: walked, read 30 pages.&rdquo; It reads the app&apos;s own notes on where the habits and days are kept, then
          logs the day.
        </li>
      </Steps>

      <h2 id="yourself">What you can still do yourself</h2>
      <p>
        The app has three tabs. Today shows this week&apos;s ring and each habit with its tick and streak. A counted habit, like
        Water with a goal of 8 glasses, gets minus and plus buttons, and its ring fills as you go. Habits that aren&apos;t for
        today, like a weekday habit on a Sunday, wait under Not today. Month shows a calendar per habit: tap a day to tick it,
        which is how you fix the Tuesday you forgot. Tap it again to mark it skipped.
      </p>
      <p>
        Tap a habit&apos;s name for its own page: its streak, its best run, this month, and Skip today. A skipped day doesn&apos;t
        break the streak, so a sick day doesn&apos;t wipe out three weeks of walks.
      </p>
      <p>
        On the Habits tab you add, rename, reorder and remove habits, and set how often each one is for: every day, some
        weekdays, or a number of times a week, like the gym three times. Removing one shows Undo at the top of the screen, and the
        habit&apos;s days stay in the data, so Undo brings its history back. None of this needs your AI. I&apos;d set the habits up
        by hand on the first day, because it&apos;s quicker than describing them.
      </p>

      <h2 id="ai-logs">Let your AI log the day</h2>
      <p>
        The app keeps its data with the note, and your AI reads and edits that same data. So at the end of a day you can open
        ChatGPT or Claude, on your phone or anywhere else, and type what happened:
      </p>
      <ul>
        <li>&ldquo;Log today: walked, read 30 pages, 6 glasses of water, phone in bed again.&rdquo;</li>
        <li>&ldquo;Which habit did I miss most this month?&rdquo;</li>
        <li>&ldquo;How&apos;s my week looking?&rdquo;</li>
      </ul>
      <p>
        For the first one, the AI sets each habit for today&apos;s date: done for Walk and Read, 6 for Water, nothing for the phone
        habit. Open the note and the ticks are there. For the third, it adds three short lines to the note under Weekly check-in:
        what went well, what slipped, and one thing to try next week. Every earlier version of the note is kept, so a wrong edit
        is easy to put back.
      </p>
      <p>
        If the template isn&apos;t quite what you want, ask your AI to change it. The app is a small React project inside the note,
        and ChatGPT or Claude can edit it the same way it edits the data: &ldquo;add a habit for stretching that only counts on
        weekdays&rdquo;, then look at the result. Or start from nothing in a note of your own and say &ldquo;Make my note an app:
        a habit tracker for these three habits&rdquo;. Pinto Notes runs the app&apos;s tests on every save and only shows a version
        that passes.
      </p>

      <h2 id="limits">What it doesn&apos;t do yet</h2>
      <p>
        Apps in Pinto Notes can&apos;t send notifications, so nothing reminds you to tick, and the AI only logs a day when you tell
        it to. There are no habit icons or colours, and no notes on a day yet; ask your AI if you want them.
      </p>
      <p>
        The iPhone app isn&apos;t on the App Store yet, so today the tracker opens on a Mac (macOS 26 or later). ChatGPT and Claude
        can still log days from your phone, since they reach the note through the connection, not the app. To let ChatGPT edit
        it, you need a plan with custom apps (Plus, Pro, Business, Enterprise or Edu). If you want a few words about the day next to the ticks,
        see <a href="/blog/journal-with-chatgpt-or-claude">journaling with ChatGPT or Claude</a>, and the <a href="/blog/weekly-review-with-chatgpt-or-claude">weekly
        review</a> post for a longer Sunday check-in.
      </p>
      <PostCta slug="habit-tracker-with-chatgpt-or-claude" position="how-amber-helps" title="Try the habit tracker on your Mac">
        <p>A habit tracker app in a note: tick it yourself, or tell your AI what you did.</p>
      </PostCta>
    </PostPage>
  );
}
