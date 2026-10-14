import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("what-are-chatgpt-dots", { title: "What are ChatGPT dots, and what to give yours" });

// Checked on 13 October 2026 against OpenAI's own pages: Introducing dots (openai.com/index/introducing-dots), the
// DevDay 2026 recap and What's new for DevDay (29 September), What's new for 5 to 9 October (mobile setup), and
// learn.chatgpt.com: Meet dots (availability: Pro 100, 200 and 500 for over-18s outside the EEA, UK and Switzerland;
// Business Premium worldwide; Enterprise off by default; computer connection; sign-in requests; the Chat, Work, Codex
// and dot table), Tasks and memory (its own notes, "not a complete transcript"; recurring tasks; proactive research
// is read-only) and Control your dot (Pause, Activity, Scheduled, delete can't be undone). Not tested by me with a
// dot. I haven't tried Pinto Notes with a dot, and the text says so.

const FAQ = [
  { q: "What is a dot in ChatGPT?", a: [
    "An always-on agent that OpenAI announced on 29 September 2026. It runs on GPT-6 Astra, has its own computer and browser in the cloud, keeps working when your devices are off, and messages you when it needs a decision. You talk to it in ChatGPT, Slack or Teams, or call it.",
  ] },
  { q: "Who can get a ChatGPT dot?", a: [
    "Pro subscribers aged over 18 outside the EU (strictly, the European Economic Area), the UK and Switzerland, Business Premium workspaces worldwide, and Enterprise workspaces once an admin turns dots on. It's rolling out gradually, so an eligible account may not see it yet.",
  ] },
  { q: "Do conversations with a dot count toward my ChatGPT limits?", a: [
    "No. Talking to your dot doesn't count. Tasks it starts in ChatGPT Work or Codex count toward those products' limits as usual.",
  ] },
  { q: "Can I see what my dot remembers about me?", a: [
    "You can ask it, and you can review its tasks in Activity and Scheduled. Its memory is its own set of notes, separate from ChatGPT's saved memory, and OpenAI says they aren't a complete transcript. Deleting the dot can't be undone, so save any results you need first.",
  ] },
];

const FIRST = `Help me keep our kitchen renovation on track. Read the emails from the builder and the supplier that I've shared, and make a checklist of decisions, deadlines and things we're waiting on. Tell me about anything that affects the budget or needs an answer this week. Draft replies for me to review, but don't send them.`;

export default function Page() {
  return (
    <PostPage
      slug="what-are-chatgpt-dots"
      intro={<>At DevDay on 29 September, OpenAI gave ChatGPT something new: a dot, an agent that keeps working after you close the app. Since 9 October you can set one up from your phone. Here&apos;s what a dot is, and what to hand it first if you can get one.</>}
      caption="Version history for a Groceries note in Pinto Notes on a Mac: who changed it and when, ChatGPT included. A dot works for weeks, so that record is worth having somewhere you can read it."
      answer={
        <Answer jump={[
          { href: "#what-it-is", label: "What a dot is" },
          { href: "#who", label: "Who can get one" },
          { href: "#set-up", label: "Set one up" },
          { href: "#use-cases", label: "What to give it" },
          { href: "#memory", label: "Its memory" },
          { href: "#limits", label: "Limits" },
        ]}>
          <p>
            A dot is an always-on agent inside ChatGPT. You give it a responsibility instead of a question, like keeping a
            renovation on schedule, and it follows up on its own between conversations, using its own cloud computer and the apps you
            connect. It&apos;s on Pro (outside the EU, UK and Switzerland), Business Premium and Enterprise. Start with one ongoing
            job you already check by hand every week.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/openai-dots-slides" width={1600} height={900} maxWidth={800}
        alt="A ChatGPT dot called Felipe, a blue plush character, in a chat beside a Google Slides deck. It offers two layouts for slide 5 of a launch deck and saves both to the library."
        caption="A dot at work: it updates a launch deck in Google Slides and shows the options in its chat. Image: OpenAI." />}
      faq={FAQ}
    >
      <h2 id="what-it-is">What a dot is</h2>
      <p>
        Every other part of ChatGPT waits for you. You ask, it answers or does the task, and then it stops. A dot keeps going after the conversation ends.
        OpenAI&apos;s <a href="https://openai.com/index/introducing-dots/" rel="noopener">announcement</a> calls dots always-on agents,
        and the <a href="https://learn.chatgpt.com/docs/dots" rel="noopener">guide</a> says a dot decides for itself when to pause
        and when to wake up and carry on. You don&apos;t have to schedule every follow-up.
      </p>
      <p>
        It runs on GPT-6 Astra, OpenAI&apos;s strongest model, and has its own computer and browser in the cloud, so it works while
        your laptop is shut. It can use the plugins you&apos;ve connected (OpenAI says there are over 4,000), such as Gmail or Google
        Drive. You can give it a name and a look, message it in ChatGPT on your phone, desktop or the web, or call it and talk.
        Slack and Teams work too, and it&apos;s the same dot with the same memory wherever you reach it.
      </p>
      <p>OpenAI&apos;s own comparison is the clearest way to tell the new pieces of ChatGPT apart:</p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">Use</th><th scope="col">When</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Chat</th><td>You want an answer, ideas or a quick draft</td></tr>
            <tr><th scope="row">ChatGPT Work</th><td>You have one task to hand over, like research or a file, now or on a schedule</td></tr>
            <tr><th scope="row">Codex</th><td>You&apos;re building or fixing software</td></tr>
            <tr><th scope="row">Your dot</th><td>Something needs keeping track of for weeks, and the next step changes as things happen</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="who">Who can get a dot</h2>
      <p>
        Dots are rolling out slowly, so you may not see one even on an eligible plan. On a personal plan you need Pro (Pro 100, Pro 200
        or Pro 500), you must be over 18, and you can&apos;t be in the EU, the UK or Switzerland. Business Premium has them worldwide.
        On Enterprise, an admin has to switch them on. Plus doesn&apos;t include a dot yet, and OpenAI says only that it plans to
        expand dots to more users soon.
      </p>
      <p>
        Talking to your dot doesn&apos;t count toward your ChatGPT limits. Work it hands to ChatGPT Work or Codex does, and the first
        month comes with extended limits.
      </p>

      <h2 id="set-up">How to set up your dot</h2>
      <Steps>
        <li>
          <strong>Open ChatGPT and create your dot</strong>
          In the latest ChatGPT mobile app, the desktop app, or a desktop browser. The mobile website doesn&apos;t
          work for this.
        </li>
        <li>
          <strong>Name it and connect plugins</strong>
          Its handle follows the name, such as @yourname-alfred for a dot called Alfred. Connect the apps it will need, like your email or calendar. Each
          plugin keeps its own permissions.
        </li>
        <li>
          <strong>Connect your computer, if it needs your files</strong>
          In the desktop app, from the dot&apos;s profile. Only one computer at a time, and it has to be online with ChatGPT open
          when the dot uses it.
        </li>
        <li>
          <strong>Give it one responsibility, then check the first result</strong>
          Correct what it missed before you add more.
        </li>
      </Steps>
      <Keep title="A first job for your dot" text={FIRST}
        note="Based on OpenAI's own offsite example. Swap the renovation for whatever you're chasing by email this month." />

      <h2 id="use-cases">What to give a dot</h2>
      <PostFigure src="/blog/news/openai-dots-gmail-draft" width={1600} height={900} maxWidth={800}
        alt="A ChatGPT dot called Todd, a green plush frog, in a chat beside Gmail. It updated a study with new results, then drafted an email to Diana with the findings, a chart and a link."
        caption="Another dot updates a study, then drafts the email about it in Gmail. Image: OpenAI." />
      <p>
        A good dot job is something you keep checking: an inbox thread or a list that changes. One-off questions are
        better in Chat. Six ideas for a personal account:
      </p>
      <h3>A move or a renovation</h3>
      <p>
        Builders and suppliers all write in separate threads. The dot keeps one list of what&apos;s decided and what&apos;s
        waiting on you, and drafts the chasers.
      </p>
      <h3>A party or a trip with other people</h3>
      <p>
        OpenAI&apos;s example is an offsite: the dot updates the headcount as people confirm and asks before it requests a new price.
        A wedding or a group holiday works the same way.
      </p>
      <h3>Renewals and admin</h3>
      <p>
        The dots guide shows a dot on a car registration renewal page in its cloud browser. Ask it to track every renewal date it can
        find in your email and prepare each one a week ahead. When a site needs your login, it sends a sign-in request that you fill
        in privately, or you take over its browser yourself.
      </p>
      <h3>Invoices you forget to send</h3>
      <p>
        OpenAI tells the story of an early tester whose dot noticed he hadn&apos;t invoiced a publication and prepared the invoice. If
        you freelance, ask your dot to compare finished work with invoices sent, every Friday.
      </p>
      <h3>A daily check of a few websites</h3>
      <p>
        &ldquo;Each weekday at 8 AM New York time for the next month, check these three job pages and add new roles that match my
        CV to my list. Message me only if one closes this week.&rdquo; Give the time zone and an end date, then ask it to confirm the
        schedule. That&apos;s how OpenAI says recurring tasks get saved correctly.
      </p>
      <h3>A side project you keep putting off</h3>
      <p>
        A dot can start tasks in ChatGPT Work and Codex and follow up on them. Give it the goal and let it bring you the next
        decision, instead of you having to remember where you left off.
      </p>

      <h2 id="memory">Where a dot keeps what it knows</h2>
      <p>
        A dot remembers through its own notes about your preferences, decisions and ongoing work. They&apos;re separate from
        ChatGPT&apos;s saved memory, and OpenAI says they aren&apos;t a complete transcript. If you delete the dot, the guide tells you
        to save any results first, because deleting can&apos;t be undone.
      </p>
      <p>
        So the plan itself, the checklist and the decisions, belongs somewhere you can open without asking the dot, like a document or a note it updates through a plugin.
        Then you can read it on your phone and keep it if you cancel Pro. <a href="/blog/claude-memory-vs-notes">AI memory vs notes it can edit</a> goes into that difference in more
        detail.
      </p>
      <p>
        Pinto Notes is one place for it. It&apos;s the notes app for iPhone and Mac that I make, and ChatGPT, Claude, Claude Code
        and Codex can read and edit it over MCP once you approve them. Each change by an AI is tinted with an Undo, and every
        earlier version is kept, which is the record you want from an agent that works while you sleep. I haven&apos;t tested
        Pinto Notes with a dot yet, so I can&apos;t promise a dot can use it. <a href="/blog/connect-chatgpt-to-your-notes">How to
        connect ChatGPT to your notes</a> covers the setup that works today, and <a href="/blog/gpt-6-astra-use-cases">GPT-6
        Astra use cases</a> covers the model under the dot.
      </p>

      <h2 id="limits">Limits worth knowing</h2>
      <p>
        A dot can make mistakes, and OpenAI says a finished run doesn&apos;t prove the result was achieved, so read what it brings
        back. Stopping a task doesn&apos;t undo what it already did. Pause stops its current work. Tasks it handed off are stopped
        in Activity, and recurring ones are cancelled in Scheduled.
      </p>
      <p>
        By default it asks before actions that affect your accounts or share information, and some things, like changing a
        password, always stay with you. You can add your own rules, such as &ldquo;show me every email before you send it.&rdquo;
        Its background research while you&apos;re away is read-only. Some websites block cloud browsers, and the guide suggests
        letting it use your connected computer for those.
      </p>
      <p>
        I&apos;d start with something where a mistake costs you an awkward email at worst, and give it money or other people&apos;s
        data only once you&apos;ve seen a few weeks of its work.
      </p>

    </PostPage>
  );
}
