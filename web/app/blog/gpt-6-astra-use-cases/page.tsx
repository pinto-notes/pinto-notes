import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, PostFigure, Steps } from "@/lib/PostParts";
import { MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = postMetadata("gpt-6-astra-use-cases", { title: "GPT-6 Astra use cases, and how to try it" });

// Checked on 13 October 2026 against OpenAI's own pages: the launch post (openai.com/index/gpt-6-astra, 3 September,
// with its availability, OSWorld 2.0 figures and safety-pause wording), Introducing GPT-6.1 Sol (29 September), and
// learn.chatgpt.com: Computer Use (setup, @Computer, app approvals, Always allow, what it can't automate, "prefer
// that structured integration"), Get started with ChatGPT Work, Models (Astra in the desktop app and on the web) and
// Pricing (5-45 Astra messages per five hours on Plus, 15-160 for GPT-6.1 Sol; Computer Use limited by region).
// Not tested by me in a Plus account. Pinto Notes: the Codex line is the one in notes-in-claude-code-and-codex; the
// "changed N lines, Undo" bar and version history are AIEdit.swift and VersionHistoryView.swift. I haven't tried
// Pinto Notes inside ChatGPT Work with Astra, and the text says so.

const FAQ = [
  { q: "What is GPT-6 Astra?", a: [
    "OpenAI's most capable model, released on 3 September 2026. It's built for long, multi-step work: using apps on your computer, research, documents, slides, spreadsheets and code. In ChatGPT, look for it in Work or Codex.",
  ] },
  { q: "Can I use GPT-6 Astra on the free plan?", a: [
    "No. OpenAI rolled it out to Plus, Pro, Business and Enterprise. On Enterprise an admin has to turn it on first. Free and Go users get GPT-6 Luna in the desktop app instead.",
  ] },
  { q: "How many GPT-6 Astra messages do I get on Plus?", a: [
    "OpenAI estimates 5 to 45 local messages every five hours on Plus, depending on how big each task is. GPT-6.1 Sol gets 15 to 160 in the same window, which is why it's the better default for everyday work.",
  ] },
  { q: "Is GPT-6 Astra computer use safe?", a: [
    "It only uses apps you approve, asks again before sensitive actions, and can't approve the Mac's own security prompts. It still sees whatever is on screen in those apps, so close anything private first and stay at the computer for payments, passwords and account settings.",
  ] },
];

const FORM_PROMPT = `Use @Safari to fill in the claim form at [address]. Take the details from the PDFs in my Claims folder. Stop before the last page and show me every field you filled in, so I can check it and press Submit myself.`;

export default function Page() {
  return (
    <PostPage
      slug="gpt-6-astra-use-cases"
      intro={<>OpenAI released GPT-6 Astra on 3 September and called it the best model in the world at using a computer. A month in, here&apos;s what that means for an ordinary week: what it can do, and how to start it.</>}
      answer={
        <Answer jump={[
          { href: "#what-it-is", label: "What it is" },
          { href: "#try-it", label: "How to try it" },
          { href: "#use-cases", label: "Eight use cases" },
          { href: "#notes", label: "Notes and Astra" },
          { href: "#limits", label: "Limits" },
        ]}>
          <p>
            GPT-6 Astra is OpenAI&apos;s top model, on Plus and above. Its big change is computer use: in the ChatGPT desktop
            app it can look at an app on your Mac or PC and click and type in it for you. Good first jobs are long forms
            and research that ends in a spreadsheet. For everyday tasks, GPT-6.1 Sol is close
            behind and lets you send about three times as many messages.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/covers/openai-gpt-6-astra" width={1600} height={900} maxWidth={800}
        alt="A spiral galaxy of white and amber stars on black, its arms drawn into the shape of a 6."
        caption="The picture OpenAI launched GPT-6 Astra with. Image: OpenAI." />}
      faq={FAQ}
    >
      <h2 id="what-it-is">What GPT-6 Astra is, and what changed</h2>
      <p>
        Astra is the first model in OpenAI&apos;s GPT-6 family. Its <a href="https://openai.com/index/gpt-6-astra/" rel="noopener">launch
        post</a> covers science, coding and security too, but for most people one number explains it. On OSWorld 2.0, a test of long
        tasks done by operating real software, Astra scored 72.6%, against 65.7% for GPT-5.6 Sol before it, and took about 40 minutes
        per task instead of 75. Faster and more often right is what makes handing over a task worth it.
      </p>
      <p>
        OpenAI&apos;s own examples are everyday work: filling out online forms, updating records, organising a calendar, researching
        something and drafting the summary in your email or document. It&apos;s also better at following a template, so slides and
        spreadsheets come back in your format instead of its own.
      </p>
      <p>
        Two cheaper models came after it. GPT-6 Sol and Luna arrived on 22 September, and <a href="https://openai.com/index/introducing-gpt-6-1-sol/" rel="noopener">GPT-6.1
        Sol</a> on 29 September, which OpenAI says nearly matches Astra on computer use and professional work at a fifth of the price.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">Model</th><th scope="col">Best for</th><th scope="col">Messages per 5 hours on Plus</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">GPT-6 Astra</th><td>Hard tasks that need visual judgment, or a polished final file</td><td>About 5 to 45</td></tr>
            <tr><th scope="row">GPT-6.1 Sol</th><td>Most real work, at a lower cost</td><td>About 15 to 160</td></tr>
            <tr><th scope="row">GPT-6 Luna</th><td>Quick, simple, repeated tasks</td><td>About 350 to 3,000</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        The ranges are OpenAI&apos;s estimates from its <a href="https://learn.chatgpt.com/docs/pricing" rel="noopener">pricing page</a>,
        and they&apos;re wide because a big task uses far more than a small one.
      </p>

      <h2 id="try-it">How to try GPT-6 Astra</h2>
      <p>
        ChatGPT now has two modes. Chat is for answers and short drafts; Work is for tasks with an outcome you can check, like a
        file or a filled-in form. You&apos;ll find Astra in Work (and in Codex, for code). On a Mac or a Windows PC:
      </p>
      <Steps>
        <li>
          <strong>Open the ChatGPT desktop app and switch to Work</strong>
          Then pick Astra in the model control under the message box. ChatGPT shows presets such as Astra Light and Astra Medium.
        </li>
        <li>
          <strong>Install Computer Use</strong>
          Open Plugins, then Computer Use, and choose Install plugin. Turn on its toggles, then Try now.
        </li>
        <li>
          <strong>Allow it on a Mac</strong>
          macOS asks for Screen Recording, so ChatGPT can see the app, and Accessibility, so it can click and type. Both are in
          System Settings, Privacy &amp; Security, if you miss the prompt.
        </li>
        <li>
          <strong>Name the app in your request</strong>
          Write @Computer or @ and the app&apos;s name, such as @Safari or @Numbers. ChatGPT asks before it uses each app. Choose
          Always allow only for apps you&apos;d trust it with next time.
        </li>
      </Steps>
      <p>
        OpenAI documents all of this in <a href="https://learn.chatgpt.com/docs/computer-use" rel="noopener">Computer Use</a>.
        On a Mac it can work in the background while you use other apps. On Windows it takes over the screen, so step away or give
        it a virtual machine. Computer Use is only offered in some regions, so if Plugins doesn&apos;t list it, that&apos;s
        probably why.
      </p>

      <h2 id="use-cases">Eight GPT-6 Astra use cases for a normal week</h2>
      <p>
        Each one is a task you can describe in two or three sentences and check afterwards. That&apos;s the shape Astra is good at.
      </p>
      <h3>1. Fill in a long form from your documents</h3>
      <p>
        Insurance claims and school sign-ups ask for things you already have in PDFs. Point Astra at the files and the
        form, and tell it where to stop.
      </p>
      <Keep title="A prompt for a form" text={FORM_PROMPT}
        note="Swap in your browser, the address and the folder. The last sentence is the important one: you press Submit." />
      <h3>2. Clean up your calendar</h3>
      <p>
        &ldquo;Find every meeting next week that clashes or has no agenda, and draft a message to each organiser. Don&apos;t send
        anything.&rdquo; Astra can read the calendar app the way you do, which helps when your calendar has no plugin in ChatGPT.
      </p>
      <h3>3. Research that ends in a spreadsheet</h3>
      <p>
        Comparing five daycares, flats or laptops is mostly copying details out of websites. Ask for a spreadsheet with one row per
        option, the price, the dealbreakers and a link to where each figure came from, so you can spot-check it.
      </p>
      <h3>4. Fix a setting you can&apos;t find</h3>
      <p>
        &ldquo;My Mac stopped backing up to the external drive. Look at Time Machine settings and tell me what&apos;s wrong before
        you change anything.&rdquo; OpenAI lists troubleshooting problems you can see on screen as one of Astra&apos;s jobs. It
        can&apos;t approve the Mac&apos;s own password prompts, so you&apos;ll still type your password.
      </p>
      <h3>5. Turn rough notes into slides in your template</h3>
      <p>
        Give it last quarter&apos;s deck as the template and this quarter&apos;s notes as the content. Following an existing template
        is one of the things OpenAI says improved most.
      </p>
      <h3>6. Move data between two apps with no export</h3>
      <p>
        Some sites only show a table, like a bank portal or a club&apos;s member list, with no way to download it. Astra can read the
        screen page by page and type it into Numbers or Excel. It&apos;s slow, so leave it running on the Mac while you do something else.
      </p>
      <h3>7. Make a small website</h3>
      <p>
        With Sites in ChatGPT, Astra can build and host a page from a request: a wedding page with the schedule and a map, or a page
        for a local club.
      </p>
      <h3>8. Keep a running document up to date</h3>
      <p>
        Some documents change every week, like a packing list or a renovation log. Keeping them current depends on where the document lives, which is the
        next section.
      </p>

      <h2 id="notes">Where notes fit</h2>
      <p>
        OpenAI&apos;s Computer Use guide says that if an app has its own plugin or MCP server (a standard way
        for an AI to read and write in an app), ChatGPT should use that, and keep clicking for apps without one. Clicking through a
        window means a screenshot and a click, over and over. A direct connection is one request.
      </p>
      <p>
        Apple Notes has no plugin and no API, so on a Mac computer use is the only way Astra can work in it. It can open Notes and
        type into a note. It&apos;s fine for a one-off tidy, and slow for anything you do every day. <a href="/blog/claude-memory-vs-notes">AI memory
        vs notes it can edit</a> covers why the notes themselves are the better place for things you want an AI to remember.
      </p>
      <p>
        That direct connection is what I built Pinto Notes around. It&apos;s a notes app for iPhone and Mac that ChatGPT, Claude,
        Claude Code and Codex can read and edit over MCP, once you approve each one. With Codex, it&apos;s one line:
      </p>
      <pre><code>{`codex mcp add pinto-notes --url ${MCP_URL}`}</code></pre>
      <p>
        Then choose Astra with <code>/model</code> and ask it to keep a note, such as a running log of what it built today.
        In ChatGPT on the web, the steps are in <a href="/blog/connect-chatgpt-to-your-notes">how to connect ChatGPT to your
        notes</a>. I haven&apos;t tried Pinto Notes inside ChatGPT Work with Astra yet, so I can&apos;t promise it shows up there.
      </p>
      <p>
        Whatever the AI changes, Pinto Notes tints the lines and shows a bar with Undo, and the version before is kept in the
        note&apos;s history. You want that record more from an agent that works for 40 minutes than from a chat you watch. For the other
        options, see <a href="/blog/notes-apps-with-mcp">notes apps an AI can work in</a>.
      </p>

      <h2 id="limits">What GPT-6 Astra still gets wrong</h2>
      <p>
        A 72.6% score on long computer tasks is a big step, and it also means some tasks go wrong. Check the result, especially
        anything with numbers. On Plus, a handful of big Astra tasks can use up your five-hour allowance. More limits from OpenAI&apos;s own pages:
      </p>
      <ul>
        <li>It can&apos;t operate Terminal or ChatGPT itself, and it can&apos;t approve security or admin prompts.</li>
        <li>Extra safety checks sometimes pause a task in ChatGPT and ask you to review the action before it goes on.</li>
        <li>In a signed-in browser, websites treat its clicks as yours. Ask it to use a different browser if you want to keep working in yours.</li>
      </ul>
      <p>
        My rule is the one OpenAI suggests: one app and one clear outcome per task, and a sentence that says where to stop.
      </p>

    </PostPage>
  );
}
