import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, MenuPath, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("codex-usage-reset", { title: "\"Your usage does not need a reset right now\" in Codex" });

// Checked on 25 October 2026 against OpenAI's own help pages, both updated that morning: How resets work in Codex
// (help.openai.com/en/articles/20001498: banked, automatic and paid resets, the 80% rule and its exact message, the 10%
// rule for Allow your assistant to use resets, what a full reset restores per plan, History, expiry, what support won't do)
// and Paid weekly Work and Codex rate limit resets (help.openai.com/en/articles/20001507: Plus and Pro personal only, applies
// at once, restarts the weekly period with your next request, generally no refunds). No price is given there, so none here.
// The screenshots are my own Usage page on chatgpt.com/settings/usage that day (credit balance left out). The reports of
// expiring resets refused are openai/codex issues #56258 and #56262, both opened 22 October and still open.

const FAQ = [
  { q: "Does a Codex reset give me more usage than my plan?", a: [
    "No. A reset refills an allowance to 100%, and only the ones that need it. It doesn't raise your plan's limits, and two resets close together don't add up to 200%. A paid reset pulls next week's allowance forward rather than adding extra.",
  ] },
  { q: "Do resets affect normal ChatGPT chats?", a: [
    "No. The Usage page says the plan limits are shared across Codex, Work, Workspace Agents and ChatGPT for Excel, and that chat conversations aren't included. Separate limits such as image generation, file uploads and voice aren't touched by a reset either.",
  ] },
  { q: "Can I use a banked reset on my iPhone?", a: [
    "No. The ChatGPT mobile app doesn't have the reset controls or the History list yet. Use the desktop app, Usage settings on the web, or /usage in the Codex CLI.",
  ] },
  { q: "Can OpenAI support give me back a reset that expired?", a: [
    "OpenAI's help page says no: support doesn't extend expiry dates, replace free resets that expired or were used by accident, or hand out courtesy resets. Paid resets are handled separately, through billing support.",
  ] },
  { q: "Why did my weekly reset day change?", a: [
    "Any reset that restarts a usage period moves its next refresh. If your weekly period was due on Friday and a reset restarts it on Tuesday, the next refresh is the following Tuesday. Check the time on the Usage page rather than counting days yourself.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="codex-usage-reset"
      intro={<>You saved a free reset for a bad week, pressed Use reset, and Codex said &quot;Your usage does not need a reset right now.&quot; That isn&apos;t a glitch, most of the time. It&apos;s a rule on OpenAI&apos;s help page, and once you know the number, the message makes sense.</>}
      answer={
        <Answer jump={[
          { href: "#why", label: "Why you see it" },
          { href: "#use", label: "Use a reset" },
          { href: "#restores", label: "What it restores" },
          { href: "#kinds", label: "Free, automatic, paid" },
          { href: "#expiring", label: "A reset about to expire" },
        ]}>
          <p>
            A banked reset only works when at least one allowance it covers has less than 80% left. Above that, Codex shows
            &quot;Your usage does not need a reset right now&quot; and keeps the reset for later, so nothing is lost unless it
            expires. Use it from Settings, then Usage, once your 5-hour or weekly meter drops below 80%. It works for Codex, Work
            and the other tools on the plan limit, never for normal ChatGPT chats.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/codex-reset/usage-limit-resets" width={1200} height={402} maxWidth={640}
        alt="ChatGPT's Usage settings: Usage limit resets, Use a reset to restore your 5-hour limit, weekly limit, or both, with two Full resets available, expiring Oct 29 and Nov 7, each with a Use reset button."
        caption="Two banked resets waiting on my Usage page. Neither will work yet: my weekly limit is at 100%." />}
      faq={FAQ}
    >
      <h2 id="why">Why Codex says your usage doesn&apos;t need a reset</h2>
      <PostFigure src="/blog/codex-reset/rule-80" width={1200} height={620} maxWidth={600}
        alt="Three weekly-limit meters: 95% left and 85% left are marked Not needed yet, 70% left is marked Reset works, with a dashed line at 80%."
        caption="The line is at 80% left. Above it, the reset waits." />
      <p>
        A banked reset refills your allowances to 100%. If all of them are still at 80% or more, OpenAI won&apos;t spend a reset
        to top up a few percent, so you get the message and the reset stays in your list. It isn&apos;t used up, and its expiry
        date doesn&apos;t change.
      </p>
      <p>
        That catches out people who check the meter, see 85% or 87%, and expect the reset to work because they&apos;re below
        100%. Below 100% isn&apos;t enough; it has to be below 80%. On plans with both a 5-hour and a weekly limit, either one
        counts, so a nearly used 5-hour window is enough even when the week looks fine.
      </p>
      <p>
        There&apos;s a second, stricter number if you let Codex spend resets for you. With Allow your assistant to use resets
        turned on in the desktop app, Codex only redeems one when your main 5-hour or weekly allowance has 10% or less left.
      </p>

      <h2 id="use">How to use a banked reset in Codex</h2>
      <PostFigure src="/blog/codex-reset/plan-limits" width={1200} height={435} maxWidth={640}
        alt="ChatGPT's Usage settings: Plan limits, shared across Codex, Work, Workspace Agents, and ChatGPT for Excel; chat conversations are not included. A weekly limit meter shows 100% left, resetting in 6d 23h."
        caption="Check the meter first. At 100% left, like here, a banked reset won't do anything." />
      <MenuPath steps={["Settings", "Usage", "Usage limit resets", "Use reset"]} />
      <Steps>
        <li>
          <strong>Open Usage</strong>
          In the ChatGPT desktop app it&apos;s Settings, then Usage &amp; billing. On the web it&apos;s Settings, then Usage. The
          iPhone and Android apps don&apos;t have it yet.
        </li>
        <li>
          <strong>Check your plan limits</strong>
          At least one meter needs to show less than 80% left. If they&apos;re all above, wait.
        </li>
        <li>
          <strong>Choose Use reset</strong>
          Under Usage limit resets, the Available tab lists each reset with its expiry. Review what it covers and confirm.
        </li>
      </Steps>
      <p>
        In the Codex CLI, type /usage and choose Redeem reset. If your version doesn&apos;t offer it, use the desktop app or the
        web. On the desktop, don&apos;t confuse Use reset with Buy an instant reset beside the meter: that one is the paid
        offer, and buying it doesn&apos;t touch your banked resets.
      </p>

      <h2 id="restores">What a full reset restores</h2>
      <p>
        A full banked reset refills the main Codex allowance on your plan, and only the parts below 100%:
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">Plan</th><th scope="col">What a full reset refills</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Go</th><td>The monthly allowance</td></tr>
            <tr><th scope="row">Plus, Business Standard</th><td>The 5-hour and weekly allowances</td></tr>
            <tr><th scope="row">Pro 100, 200 and 500</th><td>The weekly allowance</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        It counts as used only if it actually refills something. An allowance already at 100% isn&apos;t restarted, which is why
        the 5-hour and weekly periods can drift apart: you might have the full week left and 10% of your 5-hour window, and a
        reset then refills just the 5-hour part. Image generation, file uploads and voice have their own limits and stay as
        they are.
      </p>
      <p>
        A reset that restarts a period also moves its next refresh. After using one, read the new time on the Usage page; a
        changed date on its own doesn&apos;t mean a second reset was spent. History, on the desktop only, shows the last 30
        days of resets received and used.
      </p>

      <h2 id="kinds">Free, automatic and paid resets</h2>
      <PostFigure src="/blog/codex-reset/three-kinds" width={1200} height={560} maxWidth={600}
        alt="Three cards: Banked (free, saved on your account, you choose when, works below 80% left, expires if unused), Automatic (free, applied for you, only accounts OpenAI picks, never in History) and Instant (paid, some Plus and Pro personal accounts, applies at once, restarts your week, can't be saved)."
        caption="Only banked resets wait for you. The other two happen the moment they're applied." />
      <p>
        OpenAI hands out three kinds, and they behave differently:
      </p>
      <ul>
        <li><strong>Banked resets</strong> are free, saved on your account, and used when you choose, before they expire. Referral rewards arrive this way too.</li>
        <li><strong>Automatic resets</strong>, sometimes called global resets, are free and applied for you. They never show up in your list or in History, and &quot;global&quot; doesn&apos;t mean every account got one.</li>
        <li><strong>Paid instant resets</strong> are offered to some Plus and Pro personal accounts, from Buy an instant reset or a banner once you hit the weekly limit. They apply at once, even with usage left, can&apos;t be saved, restart your week from your next request, and generally aren&apos;t refunded.</li>
      </ul>
      <p>
        If you just need to keep working this week, usage credits are the other option: they kick in after your included limit
        runs out instead of moving your week.
      </p>

      <h2 id="expiring">When a reset is about to expire</h2>
      <PostFigure src="/blog/codex-reset/history" width={1200} height={497} maxWidth={600}
        alt="The History tab of Usage limit resets for the past 30 days: Reset received Oct 8, Reset received Sep 29, Reset used Sep 27."
        caption="A reset listed as received may have been used or expired since. Available is where the dates are." />
      <p>
        This is where the rule hurts. On 22 October two Codex users reported on GitHub that their resets were refused right
        before they expired, one at about 95% left and one at 83 to 87%, and then disappeared unused. Both are still open.
        By the rule on OpenAI&apos;s page, both refusals were expected, since neither was below 80%; the second report also
        suspects the check lags after a global reset. Either way, OpenAI&apos;s page says support won&apos;t replace a free reset
        that expired.
      </p>
      <p>
        So treat a banked reset as something for a heavy week, not a bonus to cash in. Look at the expiry dates on your Usage
        page now, and if one runs out soon, plan your bigger Codex job before it, so the meter is under 80% when you need the
        reset. The <a href="/blog/gpt-6-astra-use-cases">GPT-6 Astra jobs</a> are the ones that eat a week fastest, and new
        limits and resets go into <a href="/blog/new-ai-features">our AI feature tracker</a> as OpenAI announces them.
      </p>
      <p>
        One thing a reset can&apos;t give back is where a long session had got to when the limit hit. I make Pinto Notes, a
        notes app for Mac, and keeping a short running note that Codex reads and updates means a new session picks up where the
        old one stopped. <a href="/blog/notes-in-claude-code-and-codex">Notes in Claude Code and Codex</a> shows the
        one-command setup.
      </p>
    </PostPage>
  );
}
