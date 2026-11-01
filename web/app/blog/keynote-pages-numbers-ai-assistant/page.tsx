import { AIConnect } from "@/lib/AIConnect";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";
import { APP_STORE_LIVE } from "@/lib/site";

export const dynamic = "force-static";
export const metadata = postMetadata("keynote-pages-numbers-ai-assistant", { title: "The AI assistant in Keynote, Pages and Numbers, and MCP" });

// News post, 27 October 2026, from Apple's newsroom post "Apple Creator Studio adds powerful new AI features and even
// more creative tools" (27 October) and its footnotes: assistant (beta) built on Apple models and OpenAI, for
// subscribers, on an Apple Intelligence device with iOS 27 or macOS 27 (Apple's list also has its tablets), U.S.
// English only; MCP needs macOS 27; the update reaches the App Store in November; $12.99 a month or $129 a year, a
// one-month trial, three months free with a new Mac; free Keynote, Pages and Numbers stay. The suggestions in the Keep
// box are the ones on screen in Apple's own Keynote picture. Apple doesn't say how an outside AI connects, which AIs
// work, or whether MCP needs the subscription; the text says so. Both pictures: Apple Newsroom, credited.
// Update when it ships in November: the real setting, first-hand pictures, and a tracker entry.

const FAQ = [
  { q: "When can I use the AI assistant in Keynote, Pages and Numbers?", a: [
    "Apple says the update reaches the App Store in November. It was announced on 27 October, so for now there's nothing to turn on.",
  ] },
  { q: "Is the assistant in Keynote, Pages and Numbers free?", a: [
    "No. Apple lists it among the features for Apple Creator Studio subscribers: $12.99 a month or $129 a year in the US, with a one-month free trial for new subscribers and three months free with a new Mac. The free Keynote, Pages and Numbers stay, without the assistant.",
  ] },
  { q: "Does it work outside the US?", a: [
    "Apple says the assistant is in U.S. English only. It also needs a device that runs Apple Intelligence, on iOS 27 or macOS 27 or later.",
  ] },
  { q: "Can Claude or ChatGPT edit my Keynote slides?", a: [
    "That's what the new MCP support is for. Apple says it lets outside AI agents and tools read your content, make edits and run actions in Keynote, Pages and Numbers, on a Mac with macOS 27. Apple's own picture shows the ChatGPT Mac app summarizing an open deck. Apple hasn't said which AI apps it works with or how you connect one.",
  ] },
  { q: "Does Apple Notes get MCP too?", a: [
    "No. The announcement covers Keynote, Pages and Numbers, plus Freeform, which gets text styles and image tools but no MCP. Notes isn't in it.",
  ] },
];

const ASK = `Write speaking points for these slides.
Help me animate my slides.
Add a slide transition between each section.
Give me a summary of this presentation.`;

export default function Page() {
  return (
    <PostPage
      slug="keynote-pages-numbers-ai-assistant"
      intro={<>
        Keynote, Pages and Numbers are getting their own AI assistant, and something bigger for anyone who uses ChatGPT or Claude: MCP
        support, so an outside AI can open your deck or spreadsheet and work in it. Apple announced both on 27 October as part of
        Apple Creator Studio. Here&apos;s what each app gets, who can use it, what it costs, and what Apple hasn&apos;t said yet.
      </>}
      answer={
        <Answer jump={[
          { href: "#assistant", label: "What the assistant does" },
          { href: "#mcp", label: "ChatGPT and Claude through MCP" },
          { href: "#who", label: "Who gets it" },
        ]}>
          <p>
            An assistant built on Apple&apos;s models and OpenAI&apos;s is coming to Keynote, Pages and Numbers in November, in beta.
            It&apos;s for Apple Creator Studio subscribers ($12.99 a month or $129 a year), on a device with Apple Intelligence running
            iOS 27 or macOS 27, in U.S. English only. On the Mac, MCP support also lets outside AI agents read and edit your documents.
            There&apos;s nothing to turn on yet: it arrives as an App Store update.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/keynote-assistant" width={1600} height={1186} maxWidth={760}
        alt="Keynote with a 12-slide pitch deck and the new Assistant panel open, suggesting Write speaking points for these slides and Give me a summary of this presentation."
        caption="The assistant in Keynote, beside the deck it's working on. Image: Apple." />}
      faq={FAQ}
    >
      <h2 id="assistant">What the assistant does in each app</h2>
      <p>
        It opens in a panel beside your document and, Apple says, understands what&apos;s in it. So you don&apos;t paste your slides into
        a chat; you ask about the deck you have open.
      </p>
      <ul>
        <li><strong>Keynote:</strong> designs, animates and refines slides.</li>
        <li><strong>Pages:</strong> drafts, restructures and fine-tunes what you&apos;ve written.</li>
        <li><strong>Numbers:</strong> calculates, makes charts and organizes data. It suggests a chart type with a one-tap preview, and can
          build a table from what it knows about the world.</li>
      </ul>
      <Keep title="Things to ask in Keynote" text={ASK} note="The suggestions Apple shows in the panel." />
      <p>
        Subscribers also get stock video in the Content Hub and new templates and themes. Keynote gains a new file format, .keyx, an
        open JSON bundle that Apple says is meant to be read by other tools and AI agents.
      </p>

      <h2 id="mcp">ChatGPT and Claude in your documents, through MCP</h2>
      <PostFigure src="/blog/apple/keynote-chatgpt-mac" width={1600} height={1066} maxWidth={760}
        alt="A MacBook Pro with Keynote open on a pitch deck and the ChatGPT app beside it, answering Summarize open Keynote presentation with a slide by slide summary."
        caption="Apple's own example: the ChatGPT Mac app summarizing the deck open in Keynote. Image: Apple." />
      <p>
        <a href="/blog/mcp-server">MCP</a> (Model Context Protocol) is the standard ChatGPT, Claude and most AI apps use to work inside
        other apps. With it, Apple says, outside AI agents and tools can read your content, edit it and run actions in Keynote, Pages
        and Numbers. It needs macOS 27, so it&apos;s Mac only.
      </p>
      <p>
        That matters more than the built-in assistant if you already pay for ChatGPT or Claude. The AI that knows your project can make
        the slides for it, or fill the spreadsheet, without you copying anything over.
      </p>
      <p>
        What Apple hasn&apos;t said: which AI apps it works with, how you connect one, and whether it needs the subscription (Apple lists
        it with the subscriber features). Until November, there are open-source Keynote MCP servers that drive the app through
        AppleScript, but they&apos;re small hobby projects; Apple&apos;s own support is the one to wait for.
      </p>

      <h2 id="who">Who gets it, and what it costs</h2>
      <div className="tableWrap">
        <table>
          <thead><tr><th scope="col"></th><th scope="col">Assistant</th><th scope="col">MCP</th></tr></thead>
          <tbody>
            <tr><th scope="row">When</th><td>November, in beta</td><td>November</td></tr>
            <tr><th scope="row">Devices</th><td>iPhone and Mac with Apple Intelligence, iOS 27 or macOS 27</td><td>Mac, macOS 27</td></tr>
            <tr><th scope="row">Language</th><td>U.S. English only</td><td>Apple doesn&apos;t say</td></tr>
            <tr><th scope="row">Cost</th><td>Apple Creator Studio, $12.99 a month or $129 a year</td><td>Apple doesn&apos;t say</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        New subscribers get a month free, and buying a new Mac adds three months. The free Keynote, Pages and Numbers stay as they are.
        Apple&apos;s footnotes list a few more devices than the Mac and iPhone; see <a
        href="https://www.apple.com/newsroom/2026/10/apple-creator-studio-adds-powerful-new-ai-features-and-even-more-creative-tools/">Apple&apos;s
        announcement</a> for the full list. Every launch like this goes into our <a href="/blog/new-ai-features">list of new AI
        features</a> on the day it ships.
      </p>

      <h2 id="notes">And your notes?</h2>
      <AIConnect caption="ChatGPT and Claude, working in one notebook." />
      <p>
        Apple Notes isn&apos;t part of this. The only AI that gets into it is Apple&apos;s own, <a href="/blog/siri-ai-apple-notes">Siri
        AI</a>, and it still has no MCP or any <a href="/blog/apple-notes-api">API</a> another app can use. So your slides will soon be
        open to outside AIs, but the notes you wrote them from won&apos;t.
      </p>
      <p>
        That gap is why I made Pinto Notes. It works like Apple Notes, brings yours over in one import, and lets Claude, Claude Code and
        Codex read and edit your notes through MCP once you approve them.
        {APP_STORE_LIVE
          ? <> It&apos;s free on Mac and iPhone.</>
          : <> It&apos;s free on the Mac today, with the iPhone app coming soon.</>}{" "}
        For other notes apps that do this, see <a href="/blog/notes-apps-with-mcp">notes apps with an MCP server</a>.
      </p>
    </PostPage>
  );
}
