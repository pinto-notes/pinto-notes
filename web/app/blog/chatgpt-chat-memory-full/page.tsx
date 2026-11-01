import { Figure } from "@/lib/blog";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, MenuPath, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("chatgpt-chat-memory-full", { title: "ChatGPT \"Chat memory full\": what it means and what to do" });

// Checked on 26 October 2026. OpenAI has said nothing about the message: it isn't in the help center (searched "chat
// memory full"), Troubleshooting ChatGPT Error Messages (updated 23 Oct) or the Free Tier FAQ (updated 19 Oct), and no
// staff member has replied in the OpenAI community thread "Why is ChatGPT showing 'Chat memory full' after just a few
// messages?" (community.openai.com/t/1403842, opened 6 Oct, 249 posts by 26 Oct 08:29 UTC; the earliest report is
// /t/1403129 on 3 Oct). The wording, buttons, plans and what didn't help come from that thread and r/ChatGPT. The
// saved-memory side is from OpenAI's Memory in ChatGPT page (help.openai.com/en/articles/8590148, updated 22 Oct:
// Settings > Personalization > Memory, improved memory vs legacy saved memories, no storage limit for chat history).
// The warning picture is our own drawing of the reported wording, not a screenshot: my account is on a paid plan and
// doesn't show it.

const FAQ = [
  { q: "Is \"Chat memory full\" a bug?", a: [
    "OpenAI hasn't said. It started around 3 October, mostly on the Free plan, it comes with an upgrade offer, and some people saw it clear for a day or two around 22 October and then come back. That looks more like a limit on how long a free chat can get than a fault, but until OpenAI explains it, nobody outside knows for sure.",
  ] },
  { q: "Will deleting my saved memories fix \"Chat memory full\"?", a: [
    "No. People in the OpenAI forum tried it, and turning memory off, and it didn't help. Saved memories are a separate list. Clearing them is the fix for the older \"Memory full\" message, not this one.",
  ] },
  { q: "Does upgrading to Plus remove \"Chat memory full\"?", a: [
    "The warning offers an upgrade, and most reports are from Free accounts, so a paid plan probably gives a chat more room. A few paid users have reported the warning too, and OpenAI hasn't published a limit for either, so don't upgrade only for this.",
  ] },
  { q: "Is my old chat lost when ChatGPT says chat memory full?", a: [
    "No. The chat stays in your history and you can still read and copy everything in it. What stops is adding new messages to it.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="chatgpt-chat-memory-full"
      intro={<>Since early October, ChatGPT stops some conversations after a dozen or so messages with &quot;Chat memory full&quot; and an offer to continue in a new chat. Clearing your memories doesn&apos;t help, because it&apos;s a different thing with a confusingly similar name. Here&apos;s what it is, what works, and how not to lose your work to it.</>}
      answer={
        <Answer jump={[
          { href: "#what", label: "What it means" },
          { href: "#not-memories", label: "Not your saved memories" },
          { href: "#do", label: "What to do" },
          { href: "#saved", label: "The older Memory full" },
          { href: "#keep", label: "Keep the plan outside" },
        ]}>
          <p>
            &quot;Chat memory full&quot; means that one conversation has got too long to continue. It isn&apos;t your saved memories,
            so deleting them changes nothing. Choose Continue in a new chat to carry an automatic summary into a fresh chat, paste
            in anything the summary dropped, and keep long-running plans somewhere outside the chat. It mostly hits the Free plan,
            and OpenAI hasn&apos;t explained it yet.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/chat-memory-full/warning" width={1200} height={640} maxWidth={600}
        alt="A drawing of a ChatGPT chat ending in a warning box: Chat memory full. Start a new chat with an automatic summary of this conversation. Buttons: Continue in a new chat, Claim free offer."
        caption="Our drawing of the warning, in the words people report. The second button is an upgrade offer." />}
      faq={FAQ}
    >
      <h2 id="what">What &quot;Chat memory full&quot; means in ChatGPT</h2>
      <p>
        Every chat has a limit on how much ChatGPT can hold in mind at once, its context. A long chat used to just run on,
        with ChatGPT losing track of the earliest parts. Since about 3 October, some chats instead stop with &quot;Chat
        memory full&quot; and two choices: start a new chat with an automatic summary of this one, or take the upgrade offer.
      </p>
      <p>
        The OpenAI community thread about it had 249 posts by this morning, and no reply from anyone at OpenAI. Most reports
        are from Free accounts, on the web and the Android app, though a few paid users see it too. Some people get it after
        about ten messages in a brand-new chat; others found their older chats wouldn&apos;t take new messages. A few say it
        cleared up around 22 October and came back on the 24th. One person who wrote to support says they were told
        that&apos;s how tokens work.
      </p>
      <p>
        So the most likely reading is a new, tighter limit on how long a Free chat can get, shown with a message that borrows
        the word memory. Treat that as a reading, not a fact: OpenAI hasn&apos;t said so.
      </p>

      <h2 id="not-memories">Why deleting your memories doesn&apos;t fix it</h2>
      <PostFigure src="/blog/chat-memory-full/two-kinds" width={1200} height={600} maxWidth={600}
        alt="Two cards. Chat memory full: one chat is too long, shows inside a single conversation, mostly on the Free plan since October, comes with an upgrade offer, can come back after a few replies; fix: continue in a new chat with the summary. Memory full: saved memories are full, the older list of saved memories, ChatGPT stops saving new ones, chats keep working, Settings, Personalization, Memory; fix: delete memories you don't need."
        caption="Two different limits with nearly the same name." />
      <p>
        The advice you&apos;ll find first, delete some memories, is for a different message. Saved memories are the facts
        ChatGPT keeps about you across chats, and the older version of that list could fill up and say &quot;Memory
        full&quot;. That never stopped a chat; it only stopped ChatGPT saving anything new.
      </p>
      <p>
        People hit by the new message have tried deleting memories, turning memory off, temporary chats, reinstalling the
        app, signing out and switching browsers. None of it brought the stuck chat back, which fits: the limit is on the
        conversation, not on what ChatGPT remembers about you.
      </p>

      <h2 id="do">What to do when a chat says memory full</h2>
      <Steps>
        <li>
          <strong>Copy what matters first</strong>
          Before you leave, select the parts you&apos;ll need, such as the plan, the list or the draft, and copy them. The old
          chat stays readable in your history, but it&apos;s easier now.
        </li>
        <li>
          <strong>Choose Continue in a new chat</strong>
          ChatGPT starts a fresh chat with an automatic summary of the old one. Read the summary: it keeps the gist and loses
          details.
        </li>
        <li>
          <strong>Paste back what the summary dropped</strong>
          Numbers, names, the exact wording you agreed on. A short message with the essentials does more than the whole old
          chat.
        </li>
        <li>
          <strong>Keep the new chat short</strong>
          One job per chat. Start another when the topic changes, instead of running one chat for weeks.
        </li>
      </Steps>
      <p>
        People report the warning can come back after a handful of replies in the continued chat, so treat the summary as a
        bridge, not a fix. If you depend on one very long conversation, that&apos;s the habit this change punishes.
      </p>

      <h2 id="saved">If it says &quot;Memory full&quot; instead</h2>
      <PostFigure src="/blog/chat-memory-full/personalization-memory" width={1200} height={456} maxWidth={600}
        alt="ChatGPT's Personalization settings: ChatGPT memory, with Enable memory switched on and Memory summary with a Manage button and a link to manage your old saved memories."
        caption="Settings, then Personalization, then Memory. The old saved memories are linked from the summary." />
      <MenuPath steps={["Settings", "Personalization", "Memory", "Manage"]} />
      <p>
        That one is about saved memories, and you can fix it yourself. Open the memory controls, review what&apos;s there and
        delete what you don&apos;t need, or ask ChatGPT to forget something specific. OpenAI&apos;s help page says improved
        memory keeps a summary that updates itself, and that there&apos;s no storage limit for what ChatGPT picks up from your
        chat history, so on the newer memory you&apos;re unlikely to see a full message at all.
      </p>
      <p>
        Deleting a saved memory doesn&apos;t delete the chat it came from, and deleting a chat doesn&apos;t delete a saved
        memory made from it. To remove something for good, do both. Locked chats have their own memory again (<a href="/blog/lock-chats-in-chatgpt">how
        locked chats work</a>).
      </p>

      <h2 id="keep">Keep the plan outside the chat</h2>
      <Figure shot={SHOTS.connectClaude} caption="Pinto Notes connects to Claude now. ChatGPT is next." />
      <p>
        A chat is good for working something out and bad for keeping it, and &quot;Chat memory full&quot; makes that sharper:
        the trip plan, the budget or the study schedule you built over thirty messages is now stuck behind a summary. Put the
        result in a note, and start each new chat from the note instead of from the last chat.
      </p>
      <p>
        That&apos;s why I make Pinto Notes, a notes app for Mac that your AI can read and edit after you allow it. It works
        with ChatGPT and Claude, so a new chat picks up the plan from the note, however many chats it takes.
        <a href="/blog/claude-memory-vs-notes"> AI memory versus notes</a> explains the difference, and new limits like this
        one go into <a href="/blog/new-ai-features">our tracker of AI changes</a> when OpenAI announces them.
      </p>
    </PostPage>
  );
}
