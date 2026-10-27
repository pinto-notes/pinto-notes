import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("how-to-use-claude-duet", { title: "How to use Claude Duet: what it does and how to get it" });

// Checked on 21 October 2026 against Anthropic's own pages: Introducing Claude Duet (claude.com/resources/articles/
// claude-duet: research preview by waitlist for US Pro and Max, iOS, Android and claude.ai, Opus 5.5, morning brief,
// checks every few hours, approvals before sending, paying, signing or deleting, off-limits actions, Link and Shop Pay,
// 1Password coming soon, personal errands weaker), the product page (claude.com/product/claude-duet: FAQ, waitlist form)
// and the help article Get started with Claude Duet (support.claude.com/en/articles/17631495: who gets access, the
// invitation steps, connectors, past-chat search under Settings > Memory, limitations, usage limits and the one reset,
// prompt injection, passwords typed into a separate form). 9to5Mac and The Verge reported it the same day. Not tried by
// me: I'm on the waitlist. The phone pictures are frames of the demo on Anthropic's product page.

const FAQ = [
  { q: "Is Claude Duet free?", a: [
    "It costs nothing on top of a Pro or Max plan during the research preview. It uses your plan's usage limits, including the background checks and the morning brief, so you may reach your limits sooner than with chat alone. When you're let in, Anthropic resets your five-hour and weekly limits once.",
  ] },
  { q: "Can I use Claude Duet on a Mac?", a: [
    "There's no Mac app. Duet is a phone app for iPhone and Android, and on a computer you open it on the web at claude.ai once you've been invited. You join the waitlist and accept the invitation from your phone.",
  ] },
  { q: "How is Claude Duet different from ChatGPT dots and Meta Muse?", a: [
    "All three are agents with their own computer in the cloud that keep working after you close the app. A ChatGPT dot takes on one ongoing job, like a renovation, and runs on Pro, Business Premium and Enterprise. Duet is one assistant across your connected apps, aimed at people running a business, and starts with US Pro and Max on a waitlist. Muse works through connectors that Meta reviews.",
  ] },
  { q: "Why don't I have Claude Duet yet?", a: [
    "Invitations go out in waves, and only to US accounts on Pro or Max. Team and Enterprise plans aren't included yet. Access is tied to the email you gave on the waitlist, so it has to match your Claude account and the Apple or Google account on your phone.",
  ] },
];

const FIRST = `Every morning, tell me only about emails and meetings that need a decision from me today. Skip newsletters and anything that can wait until Friday. Draft replies for me to review, but don't send anything.`;

export default function Page() {
  return (
    <PostPage
      slug="how-to-use-claude-duet"
      intro={<>On 21 October Anthropic opened Claude Duet, a new app where Claude messages you first. It reads your email and calendar, sends a brief each morning, and keeps working after you put the phone down. It&apos;s Anthropic&apos;s answer to <a href="/blog/what-are-chatgpt-dots">ChatGPT dots</a> and <a href="/blog/meta-muse-connectors">Meta Muse</a>. Here&apos;s how to get in, and what to hand it first.</>}
      answer={
        <Answer jump={[
          { href: "#what", label: "What it does" },
          { href: "#get", label: "How to get it" },
          { href: "#first", label: "What to try first" },
          { href: "#privacy", label: "Privacy and approvals" },
          { href: "#notes", label: "Your notes" },
        ]}>
          <p>
            Claude Duet is a research preview for Pro and Max subscribers in the US. Join the waitlist on claude.com/product/claude-duet
            with the email on your Claude account, wait for the invitation, and open it on your phone. Duet brings your Claude
            memory, skills and connectors with it, so connect Gmail and Google Calendar in Claude first and start with the
            morning brief.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/duet/duet-brief" width={1984} height={1848} maxWidth={620}
        alt="Two phone screens from Claude Duet. A lock screen notification from Claude Duet says: Morning, Maya. 5 things in progress and 2 that need you. Next to it, the morning brief lists Hiring, Northfield, Chicago location, Series A and Customers, each with one line on what needs attention."
        caption="Duet writes first: a notification, then a brief of what needs you today. Image: Anthropic." />}
      faq={FAQ}
    >
      <h2 id="what">What Claude Duet does</h2>
      <PostFigure src="/blog/duet/duet-make" width={1984} height={1848} maxWidth={620}
        alt="Two Claude Duet screens. One shows a Series A deck it rebuilt, with a bar chart, and says the data room has 23 of 26 documents. The other shows Marlo Pulse, a one-page dashboard with revenue, cash, subscriptions and where to look."
        caption="Bigger jobs come back as files: a deck, a dashboard, a model. Image: Anthropic." />
      <p>
        The Claude app waits for you to open a chat. Duet comes to you. Each morning it looks across your email and calendar
        and sends a short brief of what matters, often with the first steps done, like replies drafted for you to check. Through
        the day it checks your connected apps every few hours and messages you only when something needs you.
      </p>
      <p>
        You talk to it in one long thread, typed or by voice, like a colleague. Ask it to set up a meeting or build a sales
        forecast, and it works out which apps to use. It runs on its own computer in the cloud with its own browser, so the work
        carries on when your phone is locked. Finished work lands in the Make tab, and the Tasks tab shows what&apos;s in
        progress. It runs on Claude Opus 5.5, and you can&apos;t pick another model.
      </p>

      <h2 id="get">Who gets it, and how to join the waitlist</h2>
      <PostFigure src="/blog/duet/duet-waitlist" width={2000} height={1338} maxWidth={720}
        alt="The Claude Duet page on claude.com: Get back to what needs you, and a Join the waitlist form asking for name, email, company, phone type (iPhone or Android) and what you would hand off to Claude Duet first."
        caption="The waitlist form asks for your phone type and what you'd hand off first. Image: Anthropic." />
      <p>
        You need a Pro or Max plan, a Claude account in the US, and an invitation. Team and Enterprise plans aren&apos;t included
        yet. There&apos;s no extra charge, but Duet&apos;s background checks count toward your plan&apos;s limits.
      </p>
      <Steps>
        <li>
          <strong>Open claude.com/product/claude-duet and fill in the form</strong>
          Use the email on your Claude account. Access is tied to that address.
        </li>
        <li>
          <strong>Say what you&apos;d hand off first</strong>
          The last field is optional. Anthropic says invitations go out in waves.
        </li>
        <li>
          <strong>Open the invitation email on your phone</strong>
          Install Claude Duet with the Apple or Google account that matches that email, then sign in with your Claude account. On a
          computer, it&apos;s on the web at claude.ai.
        </li>
      </Steps>

      <h2 id="first">What to try first</h2>
      <PostFigure src="/blog/duet/duet-connectors" width={2000} height={1000} maxWidth={620}
        alt="A grid of app icons that work with Claude Duet, including Gmail, Google Calendar, Google Drive, Slack, Notion, HubSpot, Canva, Shopify, Zapier, Xero and QuickBooks."
        caption="Duet uses the connectors you've already added in Claude. Image: Anthropic." />
      <p>
        Duet only knows what it can reach, so connect the apps before you start. It uses the connectors you&apos;ve set up in
        Claude, like Gmail, Google Calendar, Google Drive, Slack and QuickBooks. Slack works with limits for now, and Microsoft 365
        isn&apos;t available yet. Then start small. These come from Anthropic&apos;s own examples:
      </p>
      <ul>
        <li>&quot;Clear out anything in my inbox that I don&apos;t need to read.&quot;</li>
        <li>&quot;Check Stripe for unpaid invoices and draft reminder emails for me to approve.&quot;</li>
        <li>&quot;Pull together a brief on this company before my 2 pm meeting.&quot;</li>
      </ul>
      <p>
        You can also tell it what you want to hear about and how often. If the first briefs are noisy, say so in the thread:
      </p>
      <Keep title="Tune your morning brief" text={FIRST} />
      <p>
        Anthropic built it for work. Personal errands like booking tickets are weaker for now, and it doesn&apos;t make phone calls
        or text other people.
      </p>

      <h2 id="privacy">Privacy and what it asks first</h2>
      <PostFigure src="/blog/duet/duet-approve" width={1984} height={1848} maxWidth={620}
        alt="Two Claude Duet approval cards. One asks to pay a 640 dollar county health permit fee with Link, with Approve in Link and Not now buttons. The other shows a drafted email to Elena at Harbor Ventures with Not now and Send buttons."
        caption="It drafts on its own, but paying and sending wait for your tap. Image: Anthropic." />
      <p>
        Duet reads, drafts and prepares on its own. Before it sends a message, makes a payment, signs a document or deletes
        anything, it shows you exactly what it&apos;s about to do and waits. Some things are off-limits even if you approve, like
        trading securities or moving money between accounts. Purchases go through Link or Shop Pay with a one-time card, so your
        real card number isn&apos;t shared.
      </p>
      <p>
        When a site needs a password, you type it into a separate form on your phone, and Anthropic says Duet never directly sees your
        passwords or sign-in tokens. It can search your past Claude chats; turn off Search and reference chats in Settings,
        then Memory, to stop that. You can disconnect any app, but what it already learned from earlier conversations stays in
        its memory. And it reads email and web pages written by other people, which can hide instructions meant to trick it.
        That&apos;s why the approvals are there: read each one before you tap.
      </p>

      <h2 id="notes">What Duet remembers, and what you keep</h2>
      <PostFigure src="/blog/amber-notes-connect-claude-steps" width={1120} height={590} maxWidth={560}
        alt="Connecting Claude to Pinto Notes on a Mac in three steps: add it from Claude's directory, allow it on the Mac, then ask Claude about your notes."
        caption="A notes connector added in Claude is one Duet can use too." />
      <p>
        Duet carries Claude&apos;s memory with it, which is handy and hard to look inside. Things you&apos;ll want to read and edit
        yourself, like a hiring plan or the opening checklist, are better in notes. (I compared the two in <a
        href="/blog/claude-memory-vs-notes">Claude memory vs notes</a>.) I make Pinto Notes, a notes app for Mac that Claude can
        read and edit once you allow it (the iPhone app is coming soon). Because Duet uses the connectors you&apos;ve added in
        Claude, it should reach your notes the same way. I&apos;m still on the waitlist, so I haven&apos;t tried it yet.
      </p>
    </PostPage>
  );
}
