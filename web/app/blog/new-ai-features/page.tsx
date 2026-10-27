import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, PostFigure } from "@/lib/PostParts";
import { ENTRIES } from "@/lib/tracker/entries";
import { FeatureTracker } from "@/lib/tracker/FeatureTracker";
import { newestFirst } from "@/lib/tracker/months";

export const dynamic = "force-static";
export const metadata = postMetadata("new-ai-features", { title: "New ChatGPT, Claude and Gemini features in 2026, by date" });

// Built on 22 October 2026. Every row in lib/tracker/entries.ts was checked against the company's own page: Claude's
// release notes and posts on claude.com and anthropic.com, Gemini's release notes and the Google blog, OpenAI's posts (by
// their news feed), help articles and the ChatGPT changelog on learn.chatgpt.com, xAI's release notes, Meta's newsroom,
// Perplexity's blog and Microsoft's blog. Plans and countries for a few OpenAI launches (GPT-6, GPT-5.5, Health, GPT-Live,
// Dreaming, personal finance) come from same-day reports by 9to5Mac, TechCrunch and MacRumors quoting OpenAI, because
// openai.com doesn't load for us. Left out until an official page dates them: Claude's Gmail send actions and Cowork on
// phones for every paid plan (18 August), Record a skill in Cowork, ChatGPT scheduled tasks (17 June), the ChatGPT
// Chrome extension's tab control (October), and the Meta AI and Muse Mac apps. The pictures are the companies' own.

const FAQ = [
  { q: "Why don't I have a new ChatGPT, Claude or Gemini feature yet?", a: [
    "Most launches roll out over days or weeks, so the date here is the day the company announced it, not the day every account gets it. Check the Who gets it line too: many features start with one plan, one country or adults only, and the official page linked in each row says when more people get it.",
  ] },
  { q: "How often is this list updated?", a: [
    "When something ships. New launches go in the same day or the day after, once the company's own page confirms the date and who gets it.",
  ] },
];

const LATEST = 3;
const dayMonth = (date: string) => new Date(`${date.length > 7 ? date : `${date}-01`}T12:00:00Z`).toLocaleDateString("en-GB", { ...(date.length > 7 ? { day: "numeric" } : {}), month: "long", timeZone: "UTC" });

export default function Page() {
  const rows = newestFirst(ENTRIES);
  return (
    <PostPage
      slug="new-ai-features"
      intro={<>Every notable feature that ChatGPT, Claude and Gemini have shipped since April 2026, plus the big ones from Grok, Meta AI, Perplexity and Copilot. Each row has the launch date, what it does, who gets it and a link to the company&apos;s own page. I add launches as they ship.</>}
      answer={
        <Answer>
          <p>
            {rows.length} launches so far. The newest:{" "}
            {rows.slice(0, LATEST).map((e, i) => <span key={e.feature}>{e.feature} ({e.assistant}, {dayMonth(e.date)}){i < LATEST - 1 ? (i === LATEST - 2 ? " and " : ", ") : "."}</span>)}{" "}
            Pick an assistant below to see only its launches.
          </p>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <FeatureTracker entries={ENTRIES} figures={{
        "2026-10": <PostFigure src="/blog/duet/duet-brief" width={1984} height={1848} maxWidth={620}
          alt="Two phone screens from Claude Duet. A lock screen notification from Claude Duet says: Morning, Maya. 5 things in progress and 2 that need you. Next to it, the morning brief lists Hiring, Northfield, Chicago location, Series A and Customers, each with one line on what needs attention."
          caption="Claude Duet, from 21 October, messages you first with a morning brief. Image: Anthropic." />,
        "2026-09": <PostFigure src="/blog/tracker/meta-muse" width={1600} height={900}
          alt="Meta's launch picture for Muse: a blue squiggle logo among chat bubbles, one offering to order Halloween costumes and one saying it adjusted your budget."
          caption="Meta's Muse launched on 8 September as an agent you message. Image: Meta." />,
      }} />

      <h2 id="how">How this list is made</h2>
      <p>
        A launch goes in when the company&apos;s own release notes, blog or help pages confirm it. The date is the day it was
        announced. Plans and countries are copied from the same page, and left out when the page doesn&apos;t say. Features
        only for developers or for company admins are left out, unless they change what you can do in the app.
      </p>
      <p>
        For the bigger launches there&apos;s a how-to: <a href="/blog/how-to-use-claude-duet">Claude Duet</a>,{" "}
        <a href="/blog/what-are-chatgpt-dots">ChatGPT dots</a>, <a href="/blog/lock-chats-in-chatgpt">locked chats</a>{" "}
        and <a href="/blog/meta-muse-connectors">Meta Muse connectors</a>.
      </p>
      <p>
        I keep lists like this one in Pinto Notes, a notes app for the Mac that Claude can read and add to, with ChatGPT coming soon.
      </p>
    </PostPage>
  );
}
