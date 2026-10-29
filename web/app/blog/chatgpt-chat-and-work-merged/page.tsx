import { Figure } from "@/lib/blog";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("chatgpt-chat-and-work-merged", { title: "ChatGPT merged Chat and Work? How to get plain chat back" });

// Checked on 29 October 2026, about 01:00 CET. OpenAI has announced nothing about this rollout: the ChatGPT release notes
// (help.openai.com/en/articles/6825453, newest entries 28 Oct: texting your dot, API credits) and the ChatGPT Work and
// Codex help page (help.openai.com/en/articles/20001275, still describing the Chat or Work toggle) say nothing about it.
// What OpenAI did say: Tibo Sottiaux, head of ChatGPT and Codex, on Lenny Rachitsky's podcast (4 Oct) that Chat and the
// Work toggle will merge, no date; the 7 Oct release note that Chat on Plus, Pro, Business and Enterprise runs on GPT-6
// Sol from Instant to Extra High, Free and Go on GPT-6 Luna; and the help page's line that Work follows Codex's usage
// structure. What users report comes from r/ChatGPT threads posted 28 to 29 Oct (1xi29er, 1xi2b1c, 1xi2c8k, 1xi2sj5) and
// one r/OpenAI thread on 27 Oct about the Mac app. The pictures are our drawings of what people describe, not screenshots:
// my account didn't have the change when this was written.

const FAQ = [
  { q: "Did OpenAI merge Chat and Work in ChatGPT?", a: [
    "OpenAI said on 4 October that it would, without a date. Since late on 28 October many paid users see one merged view instead of the Chat or Work toggle. As of 29 October OpenAI hasn't announced the rollout in its release notes, so treat the details as user reports for now.",
  ] },
  { q: "How do I get normal ChatGPT chat back?", a: [
    "Pick GPT 6 Sol (Instant, Medium or High) in the model picker before you send. Users report it answers like the old Chat. The heavier models, such as Astra, behave like Work.",
  ] },
  { q: "Does chatting now use my Work limit?", a: [
    "Users report that GPT 6 Sol messages don't count against the Work limit, and that the other models do. OpenAI hasn't published new rules, so check Settings, then Usage, after a few messages to see for yourself.",
  ] },
  { q: "Where did the Work toggle go?", a: [
    "On accounts with the change, there's no Chat or Work choice on a new chat. The model you pick decides how ChatGPT works, and your older Chat and Work chats stay in Recents as before.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="chatgpt-chat-and-work-merged"
      intro={<>Late on 28 October, ChatGPT users started finding the Chat or Work choice gone. In its place: one box and a model picker in every chat, and a popup saying everything is now in one place. OpenAI said in early October that this was coming, but it hasn&apos;t announced the rollout yet. Here&apos;s what people see, what OpenAI has said, and how to get a plain, quick chat back.</>}
      answer={
        <Answer jump={[
          { href: "#what", label: "What changed" },
          { href: "#openai", label: "What OpenAI said" },
          { href: "#plain-chat", label: "Get plain chat back" },
          { href: "#limits", label: "How limits count" },
          { href: "#keep", label: "Keep your work" },
        ]}>
          <ul>
            <li><strong>What it is:</strong> ChatGPT&apos;s Chat and Work modes merged into one view with a model picker. No Chat or Work toggle on a new chat.</li>
            <li><strong>Who gets it:</strong> paid plans, reported mostly by Plus users, on the web and in the desktop app. It&apos;s rolling out unevenly, so you may not have it yet.</li>
            <li><strong>What it costs:</strong> nothing extra. Users report that GPT 6 Sol stays outside the Work limit and the other models use it.</li>
            <li><strong>Normal chat:</strong> pick GPT 6 Sol Instant, Medium or High in the model picker.</li>
          </ul>
          <p>OpenAI hasn&apos;t confirmed the details yet. Everything about limits below comes from users.</p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/chat-work-merged/before-after" width={1200} height={640} maxWidth={600}
        alt="Two cards. Until now: pick Chat or Work first, with a Chat and Work toggle above the message box. What some people see now: one box, one model picker set to GPT 6 Sol High, and no Chat or Work choice."
        caption="Our drawing of the change people describe. The model you pick now does the job the toggle did." />}
      faq={FAQ}
    >
      <h2 id="what">What changed in ChatGPT</h2>
      <PostFigure src="/blog/chat-work-merged/picker" width={1200} height={740} maxWidth={560}
        alt="A drawing of a Choose a model menu: GPT 6 Sol with Instant, Medium and High, marked default on Plus, then GPT-6 Astra up to Extra High, GPT-6.1 Sol and GPT-6.1 Terra."
        caption="The picker as users describe it. What you see depends on your plan." />
      <p>
        Until this week, ChatGPT had two modes. Chat was for quick answers and drafts. Work, added in July, was an agent for
        longer jobs with a finished result, and it had its own models and its own usage limit. You picked one with a toggle
        before you started.
      </p>
      <p>
        On accounts with the change, a new chat has no toggle. Every chat has a model picker instead, and Plus accounts start on
        GPT 6 Sol High. The list mixes Chat&apos;s GPT 6 Sol levels with models that used to live only in Work, like GPT-6 Astra.
        Chat and Work chats already shared one Recents list, so your old chats are where they were.
      </p>
      <p>
        Not everyone has it. One person on r/OpenAI saw the toggle vanish from the Mac app on one machine a day before the wave
        started, and many people still see the old layout.
      </p>

      <h2 id="openai">What OpenAI has said</h2>
      <PostFigure src="/blog/chat-work-merged/timeline" width={1200} height={430} maxWidth={600}
        alt="A timeline. 9 July: Work launches, with a Chat or Work toggle (OpenAI). 4 October: OpenAI says Chat and Work will merge (OpenAI). 7 October: Chat moves to GPT-6 Sol on paid plans (OpenAI). 28 October: people see one merged picker (user reports)."
        caption="Three steps OpenAI announced, and the fourth people are reporting." />
      <p>
        On Lenny Rachitsky&apos;s podcast on 4 October, Tibo Sottiaux, who runs ChatGPT and Codex, said Chat and the Work
        toggle would merge. His reason: people like what Work can do but often want Chat because it&apos;s faster. He gave no
        date and said nothing about limits.
      </p>
      <p>
        That&apos;s still all OpenAI has said. As of this morning, its ChatGPT release notes don&apos;t mention the merge, and
        its help page for Work still tells you to pick Chat or Work from the toggle. So the picker, the default and the limits
        below are what users see, not rules OpenAI has published. I&apos;ll update this post when it does.
      </p>

      <h2 id="plain-chat">How to get plain chat back</h2>
      <PostFigure src="/blog/chat-work-merged/pick-sol" width={1200} height={540} maxWidth={560}
        alt="A drawing of the ChatGPT message box with the model menu open and GPT 6 Sol Instant ticked, above GPT 6 Sol Medium and GPT 6 Sol High."
        caption="GPT 6 Sol is the model that has run Chat on paid plans since 7 October." />
      <p>
        The fix people are sharing works because of how ChatGPT was already built. Since 7 October, Chat on Plus, Pro, Business
        and Enterprise has run on GPT 6 Sol, from Instant to Extra High. Pick it and you get the old Chat.
      </p>
      <Steps>
        <li>
          <strong>Start a new chat</strong>
          The picker sits in the message box. It may show GPT 6 Sol High already, which is the default some Plus users get.
        </li>
        <li>
          <strong>Pick GPT 6 Sol Instant for quick answers</strong>
          Medium or High think longer before they answer. All three behave like the old Chat, people report.
        </li>
        <li>
          <strong>Pick Astra or GPT-6.1 Sol for a real task</strong>
          Research, a document, a spreadsheet: that&apos;s what Work was for, and those models still do it.
        </li>
      </Steps>
      <p>
        Work on the web is for paid plans, and nobody has reported the change on Free or Go so far. Chat on those plans runs
        on GPT 6 Luna.
      </p>

      <h2 id="limits">How limits count now</h2>
      <PostFigure src="/blog/chat-work-merged/two-limits" width={1200} height={520} maxWidth={600}
        alt="Two cards. GPT 6 Sol Instant, Medium and High behave like Chat: quick answers, and users report they don't use the Work limit. Astra, GPT-6.1 Sol and Terra behave like Work: longer tasks, counting toward the Work and Codex limit as Work did."
        caption="How the picks split, going by user reports and Work's own usage rules." />
      <p>
        The biggest worry in the threads is whether everyday questions now eat the Work allowance. So far, people report two
        lanes. GPT 6 Sol Instant, Medium and High don&apos;t seem to count against the Work limit. Everything else does, and the
        heavy settings cost a lot: one Plus user says a single Astra Extra High prompt used 7% of their limit.
      </p>
      <p>
        That matches how OpenAI describes Work: it follows the same usage structure as Codex, so it shares that pool. Until
        OpenAI says otherwise, check Settings, then Usage, after a few messages on each model. If your Work limit runs low,
        <a href="/blog/codex-usage-reset"> how Codex resets work</a> covers the banked resets. For what Astra is good at,
        see <a href="/blog/gpt-6-astra-use-cases">GPT-6 Astra use cases</a>, and a <a href="/blog/what-are-chatgpt-dots">dot</a>
        still counts only the tasks it hands off.
      </p>

      <h2 id="keep">Keep your work outside the chat</h2>
      <Figure shot={SHOTS.connectChatGPT} caption="Pinto Notes connects to ChatGPT on a Mac in three steps." />
      <p>
        Changes like this one move things around: a toggle disappears, a default changes, a limit gets shared. The plan or the
        list you built in a chat shouldn&apos;t depend on any of it. Keep the result in a note and point the next chat at the
        note, whatever model it runs on. That also helps when a chat runs out of room, as in <a href="/blog/chatgpt-chat-memory-full">Chat
        memory full</a>.
      </p>
      <p>
        That&apos;s why I make Pinto Notes, a notes app for Mac that ChatGPT, Claude, Claude Code and Codex can read and edit
        after you allow it. <a href="/blog/connect-chatgpt-to-your-notes">Connect ChatGPT to your notes</a> shows the setup.
      </p>
    </PostPage>
  );
}
